"use client";

/**
 * SANDBOX ISOLADO do /studio.
 * Intercepta as chamadas /api/* no cliente e devolve dados de teste + imagens de
 * exemplo reais — sem tocar no banco, sem chave de API e sem chamar a geração paga
 * (Magnific). Custo ZERO. Ativa com ?sandbox=1 (persiste na sessão via cookie).
 *
 * SEGURANÇA: o proxy só libera /studio em sandbox quando VERCEL_ENV != production.
 * Em produção o modo é inerte (o portão continua exigindo login de verdade).
 */

function origin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

// Ativa/desativa o modo sandbox e grava um cookie (o proxy lê pra liberar /studio).
export function isSandbox(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("sandbox");
    if (q === "1") {
      document.cookie = "swl-sandbox=1; path=/; samesite=lax";
      sessionStorage.setItem("swl-sandbox", "1");
      return true;
    }
    if (q === "0") {
      document.cookie = "swl-sandbox=1; path=/; max-age=0";
      sessionStorage.removeItem("swl-sandbox");
      return false;
    }
    return sessionStorage.getItem("swl-sandbox") === "1" || document.cookie.includes("swl-sandbox=1");
  } catch {
    return false;
  }
}

// Imagens de exemplo (resultados reais que já temos em /public/assets/opt, on-brand).
const SAMPLES = ["camisa", "gelato", "relogio", "luminaria", "mochila", "roupa", "pizza"];
const sampleUrl = (i: number) => `${origin()}/assets/opt/${SAMPLES[((i % SAMPLES.length) + SAMPLES.length) % SAMPLES.length]}-depois.jpg`;
const nowISO = () => new Date().toISOString();

let genCounter = 0;
let idCounter = 9000;

const mockGenerations = () => [
  { id: 8001, email: "teste@swell.studio", style: "Capa (fundo branco)", label: "Capa (fundo branco)", images: [sampleUrl(0), sampleUrl(3)], note: null, created_at: nowISO() },
  { id: 8002, email: "teste@swell.studio", style: "Em contexto", label: "Em contexto", images: [sampleUrl(1), sampleUrl(4)], note: null, created_at: nowISO() },
  { id: 8003, email: "teste@swell.studio", style: "Para anúncio", label: "Para anúncio", images: [sampleUrl(2)], note: null, created_at: nowISO() },
];

const mockProjects = () => [
  { id: 7001, email: "teste@swell.studio", name: "Camisa linho off-white", category: "vestuario", color: "off-white", material: "linho", size: "M", ref_images: [sampleUrl(0)], gen_count: 6, created_at: nowISO(), updated_at: nowISO() },
  { id: 7002, email: "teste@swell.studio", name: "Relógio aço Swell", category: "acessorio", color: "aço", material: "aço inox", size: "42mm", ref_images: [sampleUrl(2)], gen_count: 4, created_at: nowISO(), updated_at: nowISO() },
];

// Resolve o mock pra cada endpoint. Retorna undefined = deixa passar (não mocka).
function match(url: string, method: string, body: Record<string, unknown> | undefined): unknown {
  const u = url.split("?")[0];
  const qs = new URLSearchParams(url.includes("?") ? url.split("?")[1] : "");

  if (u.endsWith("/api/usage")) {
    // Modo teste grátis: mostra a limitação (5 fotos) como um usuário recém-logado.
    return { email: "teste@swell.studio", plan: "trial", quota: 5, used: 0, remaining: 5 };
  }
  if (u.endsWith("/api/generations")) {
    if (method === "POST") return { generation: { id: ++idCounter, email: "teste@swell.studio", created_at: nowISO(), ...(body || {}) } };
    return { email: "teste@swell.studio", generations: mockGenerations() };
  }
  if (u.endsWith("/api/projects")) {
    if (method === "PATCH") return { ok: true };
    if (method === "POST") {
      const b = body || {};
      return { project: { id: ++idCounter, email: "teste@swell.studio", name: b.name ?? "Produto", category: b.category ?? null, color: b.color ?? null, material: b.material ?? null, size: b.size ?? null, ref_images: (b.refImagesBase64 as string[]) ?? [], created_at: nowISO(), updated_at: nowISO() } };
    }
    if (qs.get("id")) {
      return { project: mockProjects()[0], refUrls: [sampleUrl(0)], refsBase64: [], generations: mockGenerations() };
    }
    return { email: "teste@swell.studio", projects: mockProjects() };
  }
  if (u.endsWith("/api/analyze-product")) {
    return { category: "vestuario", name: "Camisa linho off-white", color: "off-white cru", material: "linho", size: "M", hasLabel: true, labelText: "Swell", labelPosition: "etiqueta interna" };
  }
  if (u.endsWith("/api/generate-prompt")) {
    return { promptEN: "Studio product photograph, clean seamless background, soft cinematic lighting, label kept faithful, premium campaign look", resumoPT: "Foto de estúdio do produto, fundo limpo, luz suave de cinema, rótulo fiel — cara de campanha." };
  }
  if (u.endsWith("/api/generate-images")) {
    return { task_id: `sandbox-${++genCounter}`, raw: {} };
  }
  if (u.endsWith("/api/image-status")) {
    const n = parseInt((qs.get("taskId") || "").replace(/\D/g, ""), 10) || 1;
    return { status: "COMPLETED", generated: [sampleUrl(n)] };
  }
  return undefined;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let installed = false;
export function installSandbox(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const orig = window.fetch.bind(window);
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
      if (url.includes("/api/")) {
        const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
        let parsed: Record<string, unknown> | undefined;
        try { parsed = init?.body ? JSON.parse(init.body as string) : undefined; } catch { parsed = undefined; }
        const mock = match(url, method, parsed);
        if (mock !== undefined) {
          await delay(url.includes("generate-images") || url.includes("analyze") ? 700 : 220);
          return new Response(JSON.stringify(mock), { status: 200, headers: { "Content-Type": "application/json" } });
        }
      }
    } catch { /* qualquer erro cai no fetch real */ }
    return orig(input, init);
  }) as typeof window.fetch;
}
