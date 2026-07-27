import { neon } from "@neondatabase/serverless";

const CONNECTION_ENV = "DATABASE_URL";

function client() {
  const url = process.env[CONNECTION_ENV] || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      `Falta a env var ${CONNECTION_ENV} (ou POSTGRES_URL). Conecte um banco Neon no dashboard da Vercel.`
    );
  }
  return neon(url);
}

export type SubscriberStatus = "trial" | "active" | "canceled" | "refunded";

export type Subscriber = {
  email: string;
  name: string | null;
  status: SubscriberStatus;
  source: string;
  kwify_customer_id: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  last_event_at: string | null;
  created_at: string;
  plan: string | null;         // 'essencial' | 'pro' | 'marca' | 'trial'
  photo_quota: number | null;  // fotos/mês do plano (null = sem trava, fail-open)
};

// Cota de fotos/mês de cada plano (1 foto = 1 imagem gerada = 1 crédito).
// Landing: Simples R$67 · Médio R$147 · Grande R$267.
export const PLAN_QUOTAS: Record<string, number> = {
  essencial: 20,  // Simples
  pro: 80,        // Médio
  marca: 180,     // Grande
};
// Teste grátis: fotos liberadas pra experimentar
export const TRIAL_QUOTA = 5;

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const sql = client();
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS subscribers (
          email TEXT PRIMARY KEY,
          name TEXT,
          status TEXT NOT NULL,
          source TEXT NOT NULL DEFAULT 'unknown',
          kwify_customer_id TEXT,
          trial_ends_at TIMESTAMPTZ,
          subscription_ends_at TIMESTAMPTZ,
          last_event_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      // Plano e cota vivem na linha do usuário (idempotente)
      await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS plan TEXT`;
      await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS photo_quota INT`;
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

export async function getSubscriber(email: string): Promise<Subscriber | null> {
  await ensureSchema();
  const sql = client();
  const rows = (await sql`
    SELECT email, name, status, source, kwify_customer_id,
           trial_ends_at, subscription_ends_at, last_event_at, created_at,
           plan, photo_quota
    FROM subscribers WHERE email = ${email.toLowerCase()}
  `) as Subscriber[];
  return rows[0] ?? null;
}

export function hasActiveAccess(s: Subscriber | null): boolean {
  if (!s) return false;
  const now = Date.now();
  if (s.status === "active") return true;
  if (s.status === "trial" && s.trial_ends_at && new Date(s.trial_ends_at).getTime() > now) {
    return true;
  }
  // Cancelamento "no fim do ciclo": mantém acesso até subscription_ends_at
  if (
    s.status === "canceled" &&
    s.subscription_ends_at &&
    new Date(s.subscription_ends_at).getTime() > now
  ) {
    return true;
  }
  return false;
}

export type UpsertInput = {
  email: string;
  name?: string | null;
  status: SubscriberStatus;
  source: string;
  kwify_customer_id?: string | null;
  trial_ends_at?: Date | null;
  subscription_ends_at?: Date | null;
  plan?: string | null;
  photo_quota?: number | null;
};

export async function upsertSubscriber(input: UpsertInput): Promise<void> {
  await ensureSchema();
  const sql = client();
  const email = input.email.toLowerCase();
  await sql`
    INSERT INTO subscribers (
      email, name, status, source, kwify_customer_id,
      trial_ends_at, subscription_ends_at, plan, photo_quota, last_event_at
    ) VALUES (
      ${email},
      ${input.name ?? null},
      ${input.status},
      ${input.source},
      ${input.kwify_customer_id ?? null},
      ${input.trial_ends_at ? input.trial_ends_at.toISOString() : null},
      ${input.subscription_ends_at ? input.subscription_ends_at.toISOString() : null},
      ${input.plan ?? null},
      ${input.photo_quota ?? null},
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, subscribers.name),
      status = EXCLUDED.status,
      source = EXCLUDED.source,
      kwify_customer_id = COALESCE(EXCLUDED.kwify_customer_id, subscribers.kwify_customer_id),
      trial_ends_at = COALESCE(EXCLUDED.trial_ends_at, subscribers.trial_ends_at),
      subscription_ends_at = COALESCE(EXCLUDED.subscription_ends_at, subscribers.subscription_ends_at),
      plan = COALESCE(EXCLUDED.plan, subscribers.plan),
      photo_quota = COALESCE(EXCLUDED.photo_quota, subscribers.photo_quota),
      last_event_at = NOW()
  `;
}

// ── Histórico de gerações por usuário (linkado pelo e-mail) ──────────────────
export type Generation = {
  id: number;
  email: string;
  style: string;
  label: string | null;
  images: string[];
  note: string | null;
  created_at: string;
};

let genSchemaReady: Promise<void> | null = null;

export function ensureGenerationsSchema(): Promise<void> {
  if (!genSchemaReady) {
    const sql = client();
    genSchemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS generations (
          id BIGSERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          style TEXT NOT NULL,
          label TEXT,
          images JSONB NOT NULL DEFAULT '[]'::jsonb,
          note TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS generations_email_idx ON generations (email, created_at DESC)`;
    })().catch((e) => {
      genSchemaReady = null;
      throw e;
    });
  }
  return genSchemaReady;
}

export async function saveGeneration(input: {
  email: string;
  style: string;
  label?: string | null;
  images: string[];
  note?: string | null;
  projectId?: number | null;
}): Promise<Generation> {
  await ensureGenerationsSchema();
  await ensureProjectsSchema(); // garante a coluna project_id
  const sql = client();
  const rows = (await sql`
    INSERT INTO generations (email, style, label, images, note, project_id)
    VALUES (
      ${input.email.toLowerCase()},
      ${input.style},
      ${input.label ?? null},
      ${JSON.stringify(input.images)}::jsonb,
      ${input.note ?? null},
      ${input.projectId ?? null}
    )
    RETURNING id, email, style, label, images, note, created_at
  `) as Generation[];
  // Marca o projeto como atualizado (pra ordenar a galeria por atividade recente)
  if (input.projectId) {
    try { await sql`UPDATE projects SET updated_at = NOW() WHERE id = ${input.projectId}`; } catch { /* projeto pode não existir */ }
  }
  return rows[0];
}

export async function listGenerations(email: string, limit = 60): Promise<Generation[]> {
  await ensureGenerationsSchema();
  const sql = client();
  return (await sql`
    SELECT id, email, style, label, images, note, created_at
    FROM generations
    WHERE email = ${email.toLowerCase()}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as Generation[];
}

// ── Projetos (um produto = fotos-referência + análise + todas as suas gerações) ──
export type Project = {
  id: number;
  email: string;
  name: string | null;
  category: string | null;
  color: string | null;
  material: string | null;
  size: string | null;
  ref_images: string[];
  created_at: string;
  updated_at: string;
};

let projSchemaReady: Promise<void> | null = null;

export function ensureProjectsSchema(): Promise<void> {
  if (!projSchemaReady) {
    const sql = client();
    projSchemaReady = (async () => {
      await ensureGenerationsSchema(); // generations precisa existir pra receber a coluna
      await sql`
        CREATE TABLE IF NOT EXISTS projects (
          id BIGSERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          name TEXT,
          category TEXT,
          color TEXT,
          material TEXT,
          size TEXT,
          ref_images JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS projects_email_idx ON projects (email, updated_at DESC)`;
      await sql`ALTER TABLE generations ADD COLUMN IF NOT EXISTS project_id BIGINT`;
      await sql`CREATE INDEX IF NOT EXISTS generations_project_idx ON generations (project_id)`;
    })().catch((e) => {
      projSchemaReady = null;
      throw e;
    });
  }
  return projSchemaReady;
}

export async function createProject(input: {
  email: string;
  name?: string | null;
  category?: string | null;
  color?: string | null;
  material?: string | null;
  size?: string | null;
  refImages: string[];
}): Promise<Project> {
  await ensureProjectsSchema();
  const sql = client();
  const rows = (await sql`
    INSERT INTO projects (email, name, category, color, material, size, ref_images)
    VALUES (
      ${input.email.toLowerCase()},
      ${input.name ?? null},
      ${input.category ?? null},
      ${input.color ?? null},
      ${input.material ?? null},
      ${input.size ?? null},
      ${JSON.stringify(input.refImages ?? [])}::jsonb
    )
    RETURNING id, email, name, category, color, material, size, ref_images, created_at, updated_at
  `) as Project[];
  return rows[0];
}

// Lista projetos do usuário com capa (1ª referência) e contagem de gerações.
export type ProjectSummary = Project & { gen_count: number };

export async function listProjects(email: string, limit = 100): Promise<ProjectSummary[]> {
  await ensureProjectsSchema();
  const sql = client();
  return (await sql`
    SELECT p.id, p.email, p.name, p.category, p.color, p.material, p.size,
           p.ref_images, p.created_at, p.updated_at,
           (SELECT COUNT(*) FROM generations g WHERE g.project_id = p.id)::int AS gen_count
    FROM projects p
    WHERE p.email = ${email.toLowerCase()}
    ORDER BY p.updated_at DESC
    LIMIT ${limit}
  `) as ProjectSummary[];
}

export async function getProject(id: number, email: string): Promise<Project | null> {
  await ensureProjectsSchema();
  const sql = client();
  const rows = (await sql`
    SELECT id, email, name, category, color, material, size, ref_images, created_at, updated_at
    FROM projects WHERE id = ${id} AND email = ${email.toLowerCase()}
  `) as Project[];
  return rows[0] ?? null;
}

export async function listProjectGenerations(projectId: number, email: string): Promise<Generation[]> {
  await ensureProjectsSchema();
  const sql = client();
  return (await sql`
    SELECT id, email, style, label, images, note, created_at
    FROM generations
    WHERE project_id = ${projectId} AND email = ${email.toLowerCase()}
    ORDER BY created_at DESC
    LIMIT 200
  `) as Generation[];
}

export async function renameProject(id: number, email: string, name: string): Promise<void> {
  await ensureProjectsSchema();
  const sql = client();
  await sql`UPDATE projects SET name = ${name}, updated_at = NOW() WHERE id = ${id} AND email = ${email.toLowerCase()}`;
}

// ── Uso mensal de fotos (paywall) ────────────────────────────────────────────
let usageSchemaReady: Promise<void> | null = null;

export function ensureUsageSchema(): Promise<void> {
  if (!usageSchemaReady) {
    const sql = client();
    usageSchemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS usage (
          email TEXT NOT NULL,
          year_month TEXT NOT NULL,
          photos_used INT NOT NULL DEFAULT 0,
          PRIMARY KEY (email, year_month)
        )
      `;
    })().catch((e) => {
      usageSchemaReady = null;
      throw e;
    });
  }
  return usageSchemaReady;
}

// Ciclo = mês calendário (UTC). year_month novo = uso zera sozinho.
function yearMonth(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type UsageContext = { plan: string | null; quota: number | null; used: number; remaining: number | null };

// Resolve a cota do usuário. quota null = SEM trava (fail-open: ativo sem plano mapeado ainda,
// pra não bloquear cliente pagante durante o rollout do webhook).
// E-mails do dono/equipe que geram sem trava (setar OWNER_EMAILS na Vercel, separados por vírgula)
function isOwner(email: string): boolean {
  const list = (process.env.OWNER_EMAILS || "").toLowerCase().split(/[,\s]+/).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function getUsageContext(email: string): Promise<UsageContext> {
  const e = email.toLowerCase();
  if (isOwner(e)) return { plan: "dono", quota: null, used: 0, remaining: null };
  const sub = await getSubscriber(e);
  let plan: string | null = sub?.plan ?? null;
  let quota: number | null;
  if (sub?.photo_quota != null) {
    quota = sub.photo_quota;
  } else if (sub?.status === "active") {
    quota = null; // ativo, mas o webhook ainda não gravou o plano → libera
  } else {
    quota = TRIAL_QUOTA; // trial ou sem registro
    if (!plan) plan = "trial";
  }
  const used = await getUsed(e);
  const remaining = quota == null ? null : Math.max(0, quota - used);
  return { plan, quota, used, remaining };
}

export async function getUsed(email: string): Promise<number> {
  await ensureUsageSchema();
  const sql = client();
  const rows = (await sql`
    SELECT photos_used FROM usage
    WHERE email = ${email.toLowerCase()} AND year_month = ${yearMonth()}
  `) as { photos_used: number }[];
  return rows[0]?.photos_used ?? 0;
}

// Debita 1 foto de forma ATÔMICA (aguenta as N fotos disparadas em paralelo pela UI).
// Retorna true se debitou; false se a cota estourou. quota null = sem trava → sempre true.
export async function debitPhoto(email: string, quota: number | null): Promise<boolean> {
  if (quota == null) return true;
  if (quota <= 0) return false;
  await ensureUsageSchema();
  const sql = client();
  const rows = (await sql`
    INSERT INTO usage (email, year_month, photos_used)
    VALUES (${email.toLowerCase()}, ${yearMonth()}, 1)
    ON CONFLICT (email, year_month) DO UPDATE
      SET photos_used = usage.photos_used + 1
      WHERE usage.photos_used < ${quota}
    RETURNING photos_used
  `) as { photos_used: number }[];
  return rows.length > 0;
}

// Estorna 1 foto — usado quando a geração falha na hora e não deve custar crédito.
export async function refundPhoto(email: string): Promise<void> {
  await ensureUsageSchema();
  const sql = client();
  await sql`
    UPDATE usage SET photos_used = GREATEST(0, photos_used - 1)
    WHERE email = ${email.toLowerCase()} AND year_month = ${yearMonth()}
  `;
}

// Usado por eventos de cancelamento/reembolso — precisa poder ZERAR datas.
export async function markCanceled(
  email: string,
  ends_at: Date | null,
  reason: "canceled" | "refunded"
): Promise<void> {
  await ensureSchema();
  const sql = client();
  await sql`
    UPDATE subscribers SET
      status = ${reason},
      subscription_ends_at = ${ends_at ? ends_at.toISOString() : null},
      last_event_at = NOW()
    WHERE email = ${email.toLowerCase()}
  `;
}
