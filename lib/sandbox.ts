"use client";

/**
 * SANDBOX ISOLADO do /studio.
 * Intercepta as chamadas /api/* no cliente e devolve dados de teste + imagens de
 * exemplo reais — sem tocar no banco, sem chave de API e sem chamar a geração paga
 * (Magnific). Custo ZERO. Ativa com ?sandbox=1 (persiste na sessão via cookie).
 *
 * IMPORTANTE: este arquivo só existe na branch de sandbox e NÃO deve ir pra produção.
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

// Imagens de exemplo (resultados reais que já temos, on-brand).
const SAMPLES = ["shampoo", "tenis", "camisa", "suco", "relogio", "luminaria", "gelato"];
const sampleUrl = (i: number) => `${origin()}/assets/opt/${SAMPLES[((i % SAMPLES.length) + SAMPLES.length) % SAMPLES.length]}-depois.jpg`;
const nowISO = () => new Date().toISOString();

let genCounter = 0;
let idCounter = 9000;

const mockGenerations = () => [
  { id: 8001, email: "sandbox@swell.studio", style: "Fundo Branco", label: "Fundo Branco", images: [sampleUrl(0), sampleUrl(3)], note: null, created_at: nowISO() },
  { id: 8002, email: "sandbox@swell.studio", style: "Lifestyle", label: "Lifestyle", images: [sampleUrl(1), sampleUrl(4)], note: null, created_at: nowISO() },
  { id: 8003, email: "sandbox@swell.studio", style: "Hero", label: "Hero", images: [sampleUrl(2)], note: null, created_at: nowISO() },
];

const mockProjects = () => [
  { id: 7001, email: "sandbox@swell.studio", name: "Shampoo Nutri-Enrich 1L", category: "cosmetico", color: "laranja salmão", material: "plástico", size: "1L", ref_images: [sampleUrl(0)], gen_count: 6, created_at: nowISO(), updated_at: nowISO() },
  { id: 7002, email: "sandbox@swell.studio", name: "Tênis branco Swell", category: "acessorio", color: "branco", material: "couro sintético", size: "42", ref_images: [sampleUrl(1)], gen_count: 4, created_at: nowISO(), updated_at: nowISO() },
];

// Resolve o mock pra cada endpoint. Retorna undefined = deixa passar (não mocka).
function match(url: string, method: string, body: Record<string, unknown> | undefined): unknown {
  const u = url.split("?")[0];
  const qs = new URLSearchParams(url.includes("?") ? url.split("?")[1] : "");

  if (u.endsWith("/api/usage")) {
    return { email: "sandbox@swell.studio", plan: "pro", quota: 80, used: 23, remaining: 57 };
  }
  if (u.endsWith("/api/generations")) {
    if (method === "POST") return { generation: { id: ++idCounter, email: "sandbox@swell.studio", created_at: nowISO(), ...(body || {}) } };
    return { email: "sandbox@swell.studio", generations: mockGenerations() };
  }
  if (u.endsWith("/api/projects")) {
    if (method === "POST") {
      const b = body || {};
      return { project: { id: ++idCounter, email: "sandbox@swell.studio", name: b.name ?? "Produto", category: b.category ?? null, color: b.color ?? null, material: b.material ?? null, size: b.size ?? null, ref_images: (b.refImagesBase64 as string[]) ?? [], created_at: nowISO(), updated_at: nowISO() } };
    }
    if (qs.get("id")) {
      return { project: mockProjects()[0], refUrls: [sampleUrl(0)], refsBase64: [], generations: mockGenerations() };
    }
    return { email: "sandbox@swell.studio", projects: mockProjects() };
  }
  if (u.endsWith("/api/analyze-product")) {
    return { category: "cosmetico", name: "Shampoo Nutri-Enrich 1L", color: "laranja salmão pastel", material: "plástico HDPE", size: "1 litro", hasLabel: true, labelText: "Wella Invigo Nutri-Enrich", labelPosition: "frente central" };
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
