"use client";

import { useState, useRef, useEffect } from "react";
import { ProductInfo, SceneInfo, PhotoType, ProductCategory } from "@/lib/types";

// ── Tipos de foto: rótulo leigo + legenda, sem jargão ────────────────────────
const SHOT_TYPES: Record<PhotoType, { label: string; sub: string; emoji: string }> = {
  "fundo-limpo": { label: "Fundo branco", sub: "e-commerce, catálogo", emoji: "🧼" },
  segurando: { label: "Na mão de alguém", sub: "escala real, humano", emoji: "✋" },
  lifestyle: { label: "Em ambiente de uso", sub: "cena, feed", emoji: "🌿" },
  "flat-lay": { label: "Visto de cima", sub: "flat lay com props", emoji: "🍽️" },
  macro: { label: "Detalhe / textura", sub: "close no material", emoji: "🔍" },
  "ghost-mannequin": { label: "Sem modelo", sub: "roupa com volume", emoji: "👕" },
};

// Ordem em que sugerimos os próximos passos depois da primeira geração.
const SUGGESTION_ORDER: PhotoType[] = ["segurando", "lifestyle", "flat-lay", "macro"];

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "bebida", label: "Bebida" },
  { value: "alimento", label: "Alimento / Gourmet" },
  { value: "cosmetico", label: "Cosmético / Skincare" },
  { value: "roupa", label: "Roupa / Vestuário" },
  { value: "artesanal", label: "Artesanal / Handmade" },
  { value: "acessorio", label: "Acessório / Joia / Bolsa" },
  { value: "outro", label: "Outro produto" },
];

const defaultProduct: ProductInfo = {
  category: "outro",
  name: "",
  color: "",
  material: "",
  size: "",
  hasLabel: false,
  labelText: "",
  labelPosition: "",
};

interface Batch {
  id: number;
  photoType: PhotoType;
  images: string[];
  loading: boolean;
  error?: string;
}

type Phase = "upload" | "working" | "results";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function PromptGenerator({ onApparel }: { onApparel?: () => void } = {}) {
  const [phase, setPhase] = useState<Phase>("upload");
  const [product, setProduct] = useState<ProductInfo>(defaultProduct);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null);
  const [workingStatus, setWorkingStatus] = useState("Analisando sua foto…");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAdjust, setShowAdjust] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);
  const batchSeq = useRef(0);

  // Redimensiona + converte para base64 via canvas
  function resizeAndConvert(file: File): Promise<{ base64: string; mediaType: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve({ base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
      };
      img.onerror = reject;
      img.src = objectUrl;
    });
  }

  function updateBatch(id: number, patch: Partial<Batch>) {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function newBatch(photoType: PhotoType): number {
    const id = ++batchSeq.current;
    setBatches((prev) => [...prev, { id, photoType, images: [], loading: true }]);
    return id;
  }

  // Gera um lote: prompt (por tipo de foto) → N imagens no Magnific → poll
  async function runBatch(batchId: number, photoType: PhotoType, count: number, productArg?: ProductInfo) {
    const prod = productArg ?? product;
    try {
      updateBatch(batchId, { loading: true, error: undefined });
      const scene: SceneInfo = { photoType, tool: "nano-banana", scene: "", background: "", lightMood: "" };

      const pr = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: prod, scene }),
      });
      if (!pr.ok) throw new Error("Falha ao montar o prompt");
      const pdata = await pr.json();
      const promptEN: string = pdata.promptEN;
      if (!promptEN) throw new Error("Prompt vazio");

      const reqs = Array.from({ length: count }, () =>
        fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptEN, referenceImageBase64: referenceBase64, photoType }),
        }).then((r) => r.json())
      );
      const tasks = await Promise.all(reqs);
      const taskIds = tasks.map((t) => t?.task_id).filter(Boolean) as string[];
      if (taskIds.length === 0) throw new Error("Sem créditos no Magnific ou falha na geração");

      const pending = new Set(taskIds);
      const collected: string[] = [];
      let attempts = 0;
      while (pending.size > 0 && attempts < 60) {
        if (cancelRef.current) break;
        await sleep(3000);
        attempts++;
        for (const id of Array.from(pending)) {
          if (cancelRef.current) break;
          const res = await fetch(`/api/image-status?taskId=${id}`);
          const d = await res.json();
          if (d?.status === "COMPLETED") {
            collected.push(...((d?.generated as string[]) || []));
            pending.delete(id);
            updateBatch(batchId, { images: [...collected] });
          } else if (d?.status === "FAILED") {
            pending.delete(id);
          }
        }
      }
      if (collected.length === 0) throw new Error("Nenhuma imagem gerada");
      updateBatch(batchId, { loading: false });
    } catch (e) {
      updateBatch(batchId, { loading: false, error: e instanceof Error ? e.message : "Erro ao gerar" });
    }
  }

  // Ponto de entrada: sobe a foto → analisa → primeira geração automática
  async function start(file: File) {
    cancelRef.current = false;
    setError(null);
    setBatches([]);
    setProduct(defaultProduct);
    setPreviewUrl(URL.createObjectURL(file));
    setPhase("working");
    setWorkingStatus("Analisando sua foto…");
    try {
      const { base64, mediaType } = await resizeAndConvert(file);
      setReferenceBase64(base64);

      const res = await fetch("/api/analyze-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro na análise");

      const analyzed: ProductInfo = {
        category: data.category || "outro",
        name: data.name || "",
        color: data.color || "",
        material: data.material || "",
        size: data.size || "",
        hasLabel: !!data.hasLabel,
        labelText: data.labelText || "",
        labelPosition: data.labelPosition || "",
      };
      setProduct(analyzed);

      // Primeira geração automática — padrão universal: fundo branco, 4 fotos
      setWorkingStatus("Preparando o estúdio…");
      setPhase("results");
      const id = newBatch("fundo-limpo");
      await runBatch(id, "fundo-limpo", 4, analyzed);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error && /api|key|análise|analis/i.test(e.message)
          ? "Não consegui analisar a foto agora. Verifique a conexão com a IA e tente de novo."
          : "Algo deu errado ao processar a foto. Tente de novo."
      );
      setPhase("upload");
    }
  }

  // Colar imagem (Ctrl+V) na tela inicial
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (phase !== "upload") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) start(file);
          break;
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function reset() {
    cancelRef.current = true;
    setPhase("upload");
    setProduct(defaultProduct);
    setPreviewUrl(null);
    setReferenceBase64(null);
    setBatches([]);
    setError(null);
    setShowAdjust(false);
  }

  function addSuggestion(photoType: PhotoType) {
    const id = newBatch(photoType);
    runBatch(id, photoType, 2); // desdobramentos: 2 variações (mais barato)
  }

  function regenerateWithAdjust() {
    const id = newBatch("fundo-limpo");
    runBatch(id, "fundo-limpo", 4);
    setShowAdjust(false);
  }

  const usedTypes = new Set(batches.map((b) => b.photoType));
  const suggestions = SUGGESTION_ORDER.filter((t) => !usedTypes.has(t)).slice(0, 3);

  // ── UPLOAD (tela de boas-vindas) ──────────────────────────────────────────
  if (phase === "upload") {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "72px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
            Foto Estúdio IA · Swell
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text)", marginBottom: 10, lineHeight: 1.15 }}>
            Comece enviando uma foto
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Produto, modelo ou vestuário — pode ser foto de celular.<br />
            A gente cuida do resto e já te mostra as primeiras fotos prontas.
          </p>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("image/")) start(file);
          }}
          style={{
            border: "2px dashed var(--border)",
            borderRadius: 16,
            padding: "56px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: "var(--surface2)",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <div style={{ fontSize: 44, marginBottom: 14 }}>📷</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
            Cole, arraste ou clique para enviar
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Ctrl+V · arraste a imagem · ou clique aqui
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) start(file);
          }}
        />

        {error && (
          <div style={{ marginTop: 20, padding: "12px 16px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 8, color: "#f87171", fontSize: 13, textAlign: "center" }}>
            {error}
          </div>
        )}

        {onApparel && (
          <p style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "var(--text-muted)" }}>
            É uma peça de roupa para vestir num modelo?{" "}
            <button onClick={onApparel} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, padding: 0, textDecoration: "underline" }}>
              Modo vestuário →
            </button>
          </p>
        )}
      </div>
    );
  }

  // ── WORKING (analisando, antes da primeira imagem) ────────────────────────
  if (phase === "working") {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        {previewUrl && (
          <img src={previewUrl} alt="Sua foto" style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 12, marginBottom: 24, opacity: 0.9 }} />
        )}
        <div style={{ fontSize: 30, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{workingStatus}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Leva alguns segundos.</div>
      </div>
    );
  }

  // ── RESULTS (imagens + cards de próximo passo) ────────────────────────────
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {previewUrl && (
            <img src={previewUrl} alt="Sua foto" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} />
          )}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
              {product.name || "Seu produto"}
            </div>
            <button onClick={() => setShowAdjust((s) => !s)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: 0, textDecoration: "underline" }}>
              {showAdjust ? "ocultar ajustes" : "ajustar detalhes"}
            </button>
          </div>
        </div>
        <button onClick={reset} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>
          Nova foto
        </button>
      </div>

      {/* Painel de ajuste opcional (correção da análise) */}
      {showAdjust && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 28 }}>
          <Field label="Categoria">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((c) => (
                <Chip key={c.value} selected={product.category === c.value} onClick={() => setProduct((p) => ({ ...p, category: c.value }))} label={c.label} />
              ))}
            </div>
          </Field>
          <Field label="Produto">
            <Input value={product.name} onChange={(v) => setProduct((p) => ({ ...p, name: v }))} placeholder="Tipo + descrição" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Cor">
              <Input value={product.color} onChange={(v) => setProduct((p) => ({ ...p, color: v }))} placeholder="Tom exato" />
            </Field>
            <Field label="Material">
              <Input value={product.material} onChange={(v) => setProduct((p) => ({ ...p, material: v }))} placeholder="Ex: vidro fosco" />
            </Field>
          </div>
          <button onClick={regenerateWithAdjust} style={{ marginTop: 8, background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Aplicar e gerar de novo
          </button>
        </div>
      )}

      {/* Lotes de imagens */}
      {batches.map((batch) => (
        <div key={batch.id} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 15 }}>{SHOT_TYPES[batch.photoType].emoji}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{SHOT_TYPES[batch.photoType].label}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· {SHOT_TYPES[batch.photoType].sub}</span>
          </div>

          {batch.error ? (
            <div style={{ padding: "12px 16px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 8, color: "#f87171", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{batch.error}</span>
              <button onClick={() => runBatch(batch.id, batch.photoType, batch.photoType === "fundo-limpo" ? 4 : 2)} style={{ background: "none", border: "1px solid #5c1a1a", color: "#f87171", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>
                Tentar de novo
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {batch.images.map((url, i) => (
                <div key={i} style={{ borderRadius: 10, overflow: "hidden", position: "relative", background: "var(--surface2)" }}>
                  <img src={url} alt={`${SHOT_TYPES[batch.photoType].label} ${i + 1}`} style={{ width: "100%", display: "block" }} />
                  <a href={url} download={`foto-${batch.photoType}-${i + 1}.jpg`} target="_blank" rel="noopener noreferrer" style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.75)", color: "#fff", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                    Baixar
                  </a>
                </div>
              ))}
              {batch.loading && (
                <div style={{ gridColumn: "1 / -1", padding: "28px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  🍌 Gerando{batch.images.length > 0 ? ` — ${batch.images.length} prontas` : "…"} · aguarde 30–60s
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Cards de próximo passo */}
      {suggestions.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
            Quer ver de outro jeito?
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Um clique — a gente usa a mesma foto. Cada opção gera 2 novas.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {suggestions.map((type) => (
              <SuggestionCard key={type} photoType={type} onClick={() => addSuggestion(type)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card de sugestão: imagem de exemplo (com fallback) ───────────────────────
function SuggestionCard({ photoType, onClick }: { photoType: PhotoType; onClick: () => void }) {
  const [imgOk, setImgOk] = useState(true);
  const meta = SHOT_TYPES[photoType];
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <div style={{ aspectRatio: "4 / 3", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {imgOk ? (
          <img
            src={`/exemplos/${photoType}.jpg`}
            alt={meta.label}
            onError={() => setImgOk(false)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ fontSize: 40, opacity: 0.7 }}>{meta.emoji}</div>
        )}
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{meta.label}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{meta.sub}</div>
      </div>
    </button>
  );
}

// ── Componentes de formulário (usados só no painel de ajuste) ────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
    />
  );
}

function Chip({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: selected ? 600 : 400, cursor: "pointer",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        background: selected ? "rgba(200,121,65,0.15)" : "var(--surface2)",
        color: selected ? "var(--accent)" : "var(--text-muted)", transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}
