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
};

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
           trial_ends_at, subscription_ends_at, last_event_at, created_at
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
};

export async function upsertSubscriber(input: UpsertInput): Promise<void> {
  await ensureSchema();
  const sql = client();
  const email = input.email.toLowerCase();
  await sql`
    INSERT INTO subscribers (
      email, name, status, source, kwify_customer_id,
      trial_ends_at, subscription_ends_at, last_event_at
    ) VALUES (
      ${email},
      ${input.name ?? null},
      ${input.status},
      ${input.source},
      ${input.kwify_customer_id ?? null},
      ${input.trial_ends_at ? input.trial_ends_at.toISOString() : null},
      ${input.subscription_ends_at ? input.subscription_ends_at.toISOString() : null},
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, subscribers.name),
      status = EXCLUDED.status,
      source = EXCLUDED.source,
      kwify_customer_id = COALESCE(EXCLUDED.kwify_customer_id, subscribers.kwify_customer_id),
      trial_ends_at = COALESCE(EXCLUDED.trial_ends_at, subscribers.trial_ends_at),
      subscription_ends_at = COALESCE(EXCLUDED.subscription_ends_at, subscribers.subscription_ends_at),
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
