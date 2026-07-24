"use client";

import { useState, useRef, useEffect } from "react";
import { ProductInfo, PhotoType, ProductCategory } from "@/lib/types";
import { assembleScene } from "@/lib/scene-blocks";

// ── Opções de geração por categoria de cliente ───────────────────────────────
// Dois conjuntos: produto puro e produto com modelo (pessoa).
// A direção de arte de cada categoria vive em lib/scene-blocks.ts (blocos verbatim);
// aqui fica só o que a tela precisa.
interface StyleOption {
  key: string;
  label: string;
  sub: string;
  emoji: string;
  photoType: PhotoType;      // controla o aspect ratio
}

const STYLES_PRODUCT: StyleOption[] = [
  { key: "estudio", label: "Estúdio", sub: "fundo limpo profissional", emoji: "💡", photoType: "fundo-limpo" },
  { key: "mostruario", label: "Mostruário", sub: "vitrine · catálogo", emoji: "🏪", photoType: "fundo-limpo" },
  { key: "comercial", label: "Comercial", sub: "cena de campanha", emoji: "🎬", photoType: "lifestyle" },
  { key: "cg", label: "CG · Render 3D", sub: "visual premium digital", emoji: "💎", photoType: "fundo-limpo" },
  { key: "detalhe", label: "Detalhe", sub: "close · textura", emoji: "🔍", photoType: "macro" },
];

const STYLES_WITH_MODEL: StyleOption[] = [
  { key: "influencia", label: "Influência", sub: "estilo criador · UGC", emoji: "🤳", photoType: "segurando" },
  { key: "estudio-modelo", label: "Estúdio", sub: "modelo em estúdio", emoji: "💡", photoType: "segurando" },
  { key: "comercial-modelo", label: "Comercial", sub: "campanha com modelo", emoji: "🎬", photoType: "lifestyle" },
  { key: "mostruario-modelo", label: "Mostruário", sub: "modelo apresentando", emoji: "🏪", photoType: "segurando" },
];

const VARIATIONS_PER_CLICK = 2;
const MAX_PHOTOS = 6;
const SUGGESTED_MIN_PHOTOS = 3;

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

interface Photo {
  url: string;
  base64: string;
}

interface Batch {
  id: number;
  style: StyleOption;
  images: string[];
  loading: boolean;
  error?: string;
  note?: string;                          // pedido específico usado nesta geração
  feedback?: "yes" | "no" | "redone";     // resposta ao "foi satisfatória?"
  feedbackText?: string;                  // o que faltou (quando "não")
  redo?: { promptEN: string; resumoPT: string; note: string }; // prompt preparado p/ nova tentativa
  redoPreparing?: boolean;
  redoError?: string;
  review?: boolean; // categoria de risco (SS alto) — conferir fidelidade do produto
}

type Phase = "upload" | "working" | "studio";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Tokens visuais do protótipo "Maré" (polo escuro) ─────────────────────────
const SW = {
  ember: "#E0742F",
  text: "#F4EFE6",
  text70: "rgba(244,239,230,0.7)",
  text55: "rgba(244,239,230,0.55)",
  text45: "rgba(244,239,230,0.45)",
  text40: "rgba(244,239,230,0.4)",
  line: "rgba(244,239,230,0.1)",
  surface: "rgba(22,18,15,0.6)",
};
const FONT = {
  archivo: "'Archivo', 'Manrope', system-ui, sans-serif",
  body: "'Hanken Grotesk', system-ui, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};
const EMBER_BTN: React.CSSProperties = {
  background: "linear-gradient(180deg, #EE8440 0%, #D96A24 100%)",
  border: "none", color: "#0A0908", borderRadius: 12,
  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT.body,
  boxShadow: "0 12px 36px rgba(224,116,47,0.25)",
};
function TrustBadges() {
  const items = ["PRODUTO FIEL AO ORIGINAL", "SEUS ARQUIVOS SÃO PRIVADOS", "RESULTADO EM MINUTOS"];
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "clamp(24px,4vw,52px)", flexWrap: "wrap", marginTop: 40 }}>
      {items.map((t) => (
        <div key={t} style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.18em", color: SW.text45 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: SW.ember, display: "inline-block" }} />{t}
        </div>
      ))}
    </div>
  );
}

export default function PromptGenerator({ onEnsaio }: { onEnsaio?: () => void } = {}) {
  const [phase, setPhase] = useState<Phase>("upload");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [product, setProduct] = useState<ProductInfo>(defaultProduct);
  const [withModel, setWithModel] = useState(false);
  const [selected, setSelected] = useState<StyleOption | null>(null);
  const [request, setRequest] = useState("");
  const [pending, setPending] = useState<{ style: StyleOption; note: string; promptEN: string; resumoPT: string } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAdjust, setShowAdjust] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);
  const batchSeq = useRef(0);
  const photosRef = useRef<Photo[]>([]);
  useEffect(() => { photosRef.current = photos; }, [photos]);

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

  // Adiciona fotos (multi). A primeira dispara a análise; as demais só somam referência.
  async function addFiles(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    const room = MAX_PHOTOS - photosRef.current.length;
    const toAdd = imgs.slice(0, room);
    if (toAdd.length === 0) return;

    const isFirst = photosRef.current.length === 0;
    if (isFirst) setPhase("working");
    setError(null);

    try {
      const converted: Photo[] = [];
      for (const f of toAdd) {
        const { base64 } = await resizeAndConvert(f);
        converted.push({ url: URL.createObjectURL(f), base64 });
      }
      setPhotos((prev) => [...prev, ...converted].slice(0, MAX_PHOTOS));

      if (isFirst) {
        const res = await fetch("/api/analyze-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: converted[0].base64, mediaType: "image/jpeg" }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Erro na análise");
        setProduct({
          category: data.category || "outro",
          name: data.name || "",
          color: data.color || "",
          material: data.material || "",
          size: data.size || "",
          hasLabel: !!data.hasLabel,
          labelText: data.labelText || "",
          labelPosition: data.labelPosition || "",
        });
        setPhase("studio");
      }
    } catch (e) {
      console.error(e);
      if (isFirst) {
        setError("Não consegui analisar a foto agora. Tente de novo em instantes.");
        setPhotos([]);
        setPhase("upload");
      }
    }
  }

  // Colar imagem (Ctrl+V) — funciona na tela inicial e no estúdio (soma foto)
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (phase === "working") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) addFiles(files);
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function updateBatch(id: number, patch: Partial<Batch>) {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  // Etapa "transformar em prompt": o prompt-base vem dos blocos verbatim (código);
  // o Claude só incorpora o pedido do cliente sem parafrasear os blocos fixos.
  async function buildPromptRaw(style: StyleOption, note?: string): Promise<{ promptEN: string; resumoPT: string }> {
    const base = assembleScene(style.key, product);
    const pr = await fetch("/api/generate-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basePrompt: base.promptEN, clientRequest: note?.trim() || undefined }),
    });
    if (!pr.ok) throw new Error("Falha ao montar o prompt");
    const d = await pr.json();
    if (!d.promptEN) throw new Error("Prompt vazio");
    return { promptEN: d.promptEN, resumoPT: d.resumoPT || "" };
  }

  // Gera um lote — SÓ é chamada por botão de confirmação explícito.
  // Sem pedido do cliente: prompt 100% montado em código (blocos verbatim, sem Claude).
  // Com pedido: usa o prompt já ajustado e confirmado. Negative + Style Strength sempre.
  async function generateStyle(style: StyleOption, note?: string, prebuiltPrompt?: string) {
    const id = ++batchSeq.current;
    const asm = assembleScene(style.key, product);
    setBatches((prev) => [...prev, { id, style, images: [], loading: true, note, review: asm.needsReview }]);
    try {
      const promptEN = prebuiltPrompt ?? (note?.trim() ? (await buildPromptRaw(style, note)).promptEN : asm.promptEN);

      const refs = photosRef.current.map((p) => p.base64);
      const reqs = Array.from({ length: VARIATIONS_PER_CLICK }, () =>
        fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptEN,
            referenceImagesBase64: refs,
            photoType: style.photoType,
            negativePrompt: asm.negative,
            styleStrength: asm.styleStrength,
          }),
        }).then((r) => r.json())
      );
      const tasks = await Promise.all(reqs);
      const taskIds = tasks.map((t) => t?.task_id).filter(Boolean) as string[];
      if (taskIds.length === 0) {
        const msg = tasks.find((t) => t?.error)?.error;
        throw new Error(msg || "Falha na geração — verifique a chave/créditos do Magnific");
      }

      const pending = new Set(taskIds);
      const collected: string[] = [];
      let attempts = 0;
      while (pending.size > 0 && attempts < 60) {
        if (cancelRef.current) break;
        await sleep(3000);
        attempts++;
        for (const tid of Array.from(pending)) {
          if (cancelRef.current) break;
          const res = await fetch(`/api/image-status?taskId=${tid}`);
          const d = await res.json();
          if (d?.status === "COMPLETED") {
            collected.push(...((d?.generated as string[]) || []));
            pending.delete(tid);
            updateBatch(id, { images: [...collected] });
          } else if (d?.status === "FAILED") {
            pending.delete(tid);
          }
        }
      }
      if (collected.length === 0) throw new Error("Nenhuma imagem gerada");
      updateBatch(id, { loading: false });
    } catch (e) {
      updateBatch(id, { loading: false, error: e instanceof Error ? e.message : "Erro ao gerar" });
    }
  }

  function retryBatch(batch: Batch) {
    setBatches((prev) => prev.filter((b) => b.id !== batch.id));
    generateStyle(batch.style, batch.note);
  }

  // "Não foi satisfatória" — etapa 1: transforma as considerações em prompt e mostra o resumo
  async function prepareRedo(batch: Batch) {
    const considerations = [batch.note, batch.feedbackText]
      .filter((t) => t && t.trim())
      .join(". Além disso: ");
    updateBatch(batch.id, { redoPreparing: true, redoError: undefined });
    try {
      const prep = await buildPromptRaw(batch.style, considerations);
      updateBatch(batch.id, { redo: { ...prep, note: considerations }, redoPreparing: false });
    } catch {
      updateBatch(batch.id, { redoPreparing: false, redoError: "Não consegui preparar o prompt agora. Tente de novo." });
    }
  }

  // "Não foi satisfatória" — etapa 2: cliente confirmou o resumo → gera as novas tentativas
  function confirmRedo(batch: Batch) {
    if (!batch.redo) return;
    updateBatch(batch.id, { feedback: "redone" });
    generateStyle(batch.style, batch.redo.note, batch.redo.promptEN);
  }

  function reset() {
    cancelRef.current = true;
    setPhase("upload");
    setPhotos([]);
    setProduct(defaultProduct);
    setWithModel(false);
    setBatches([]);
    setError(null);
    setShowAdjust(false);
    setTimeout(() => { cancelRef.current = false; }, 50);
  }

  const styles = withModel ? STYLES_WITH_MODEL : STYLES_PRODUCT;
  const needMorePhotos = photos.length > 0 && photos.length < SUGGESTED_MIN_PHOTOS;

  // ── UPLOAD (tela de boas-vindas) ──────────────────────────────────────────
  if (phase === "upload") {
    return (
      <main style={{ width: "100%", maxWidth: 1180, margin: "0 auto", padding: "clamp(40px,7vh,90px) clamp(20px,4vw,48px) 80px", boxSizing: "border-box", animation: "sw-riseIn 800ms cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 22 }}>01 · NOVO ENSAIO</div>
        <h1 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(44px,5.6vw,76px)", lineHeight: 0.95, letterSpacing: "-0.035em", margin: "0 0 20px" }}>
          Seu produto.<br /><span style={{ color: SW.text40 }}>Pronto para vender.</span>
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: SW.text55, margin: "0 0 44px", maxWidth: "52ch" }}>
          Envie fotos do celular. A gente preserva cada detalhe e cria o ensaio por você.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(Array.from(e.dataTransfer.files)); }}
          style={{
            display: "flex", alignItems: "center", gap: "clamp(20px,3vw,36px)", flexWrap: "wrap",
            borderRadius: 24, padding: "clamp(28px,4vw,46px)", cursor: "pointer",
            background: SW.surface, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${SW.line}`, boxShadow: "0 30px 90px rgba(0,0,0,0.4)", transition: "border-color 300ms, transform 300ms cubic-bezier(0.22,1,0.36,1)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(224,116,47,0.5)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = SW.line; e.currentTarget.style.transform = "none"; }}
        >
          <div style={{ width: 58, height: 58, borderRadius: 16, background: "rgba(224,116,47,0.12)", border: "1px solid rgba(224,116,47,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 24, color: SW.ember }}>↑</div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 7 }}>Comece pelas fotos do produto</div>
            <div style={{ fontSize: 14, color: SW.text55, lineHeight: 1.55 }}>Para manter rótulo, textura e formato fiéis, envie de 3 a {MAX_PHOTOS} ângulos.</div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 20, fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.16em", color: SW.text40 }}>
              <span>JPG, PNG OU HEIC</span><span>CELULAR SERVE</span><span>CTRL+V FUNCIONA</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
            <span style={{ ...EMBER_BTN, padding: "14px 26px" }}>Escolher fotos</span>
            {onEnsaio && (
              <button onClick={(e) => { e.stopPropagation(); onEnsaio(); }} style={{ background: "none", border: "none", color: SW.text55, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: FONT.body }}>
                Ensaio de Pessoa ↗
              </button>
            )}
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; }} />

        {error && (
          <div style={{ marginTop: 22, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(224,116,47,0.4)", background: "rgba(224,116,47,0.08)", color: SW.ember, fontSize: 13, textAlign: "center" }}>
            {error}
          </div>
        )}

        <TrustBadges />
      </main>
    );
  }

  // ── WORKING (analisando a primeira foto) ──────────────────────────────────
  if (phase === "working") {
    const first = photos[0]?.url;
    return (
      <main style={{ width: "100%", maxWidth: 1180, margin: "0 auto", padding: "clamp(40px,7vh,90px) clamp(20px,4vw,48px) 80px", boxSizing: "border-box", animation: "sw-riseIn 700ms cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 22 }}>01 · NOVO ENSAIO</div>
        <h1 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(44px,5.6vw,76px)", lineHeight: 0.95, letterSpacing: "-0.035em", margin: "0 0 20px" }}>
          Seu produto.<br /><span style={{ color: SW.text40 }}>Pronto para vender.</span>
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: SW.text55, margin: "0 0 44px", maxWidth: "52ch" }}>
          Envie fotos do celular. A gente preserva cada detalhe e cria o ensaio por você.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(24px,3vw,44px)", flexWrap: "wrap", borderRadius: 24, padding: "clamp(24px,3vw,40px)", background: SW.surface, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${SW.line}`, boxShadow: "0 30px 90px rgba(0,0,0,0.4)" }}>
          <div style={{ position: "relative", width: "min(280px,100%)", aspectRatio: "1 / 1", borderRadius: 18, background: "#14110F", border: `1px solid ${SW.line}`, flexShrink: 0, overflow: "hidden" }}>
            {first && <div style={{ position: "absolute", inset: 24, backgroundImage: `url(${first})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 10 }} />}
            <div style={{ position: "absolute", left: 0, right: 0, height: "30%", background: "linear-gradient(180deg, rgba(224,116,47,0) 0%, rgba(224,116,47,0.18) 50%, rgba(224,116,47,0) 100%)", animation: "sw-scan 2.2s cubic-bezier(0.45,0,0.55,1) infinite" }} />
            {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i)=>(
              <div key={i} style={{ position:"absolute", [v]:14, [h]:14, width:22, height:22, [`border${v[0].toUpperCase()+v.slice(1)}`]:"2px solid rgba(244,239,230,0.7)", [`border${h[0].toUpperCase()+h.slice(1)}`]:"2px solid rgba(244,239,230,0.7)" } as React.CSSProperties} />
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(224,116,47,0.4)", borderRadius: 999, padding: "7px 15px", marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: SW.ember, display: "inline-block", animation: "sw-softPulse 1.6s ease-in-out infinite" }} />
              <span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.2em", color: SW.ember }}>ANALISANDO</span>
            </div>
            <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: "clamp(24px,2.8vw,32px)", letterSpacing: "-0.02em", marginBottom: 10 }}>Entendendo seu produto…</div>
            <div style={{ fontSize: 14, color: SW.text55, lineHeight: 1.6 }}>Reconhecendo cor, material, rótulo e forma para preservar cada detalhe no ensaio.</div>
          </div>
        </div>
        <TrustBadges />
      </main>
    );
  }

  // ── STUDIO (fotos + opções + resultados) ──────────────────────────────────
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px" }}>
      {/* Cabeçalho: produto identificado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
            Identificamos
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", lineHeight: 1.35, maxWidth: 520 }}>
            {product.name || "Seu produto"}
          </div>
          <button onClick={() => setShowAdjust((s) => !s)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: 0, textDecoration: "underline", marginTop: 4 }}>
            {showAdjust ? "ocultar ajustes" : "ajustar detalhes"}
          </button>
        </div>
        <button onClick={reset} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
          Nova foto
        </button>
      </div>

      {/* Fotos de referência (multi) */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {photos.map((p, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={p.url} alt={`Foto ${i + 1}`} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, display: "block", border: "1px solid var(--border)" }} />
              <button
                onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                title="Remover"
                style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.8)", color: "#fff", border: "1px solid var(--border)", fontSize: 10, cursor: "pointer", lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => addInputRef.current?.click()}
              style={{ width: 64, height: 64, borderRadius: 8, border: "2px dashed var(--border)", background: "var(--surface2)", color: "var(--text-muted)", fontSize: 22, cursor: "pointer" }}
              title="Adicionar mais fotos"
            >
              +
            </button>
          )}
          <input
            ref={addInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files) addFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
        </div>
        {needMorePhotos && (
          <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 8 }}>
            💡 Adicione mais {SUGGESTED_MIN_PHOTOS - photos.length} foto(s) em ângulos diferentes — melhora bastante a fidelidade do produto.
          </div>
        )}
      </div>

      {/* Painel de ajuste opcional */}
      {showAdjust && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
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
        </div>
      )}

      {/* Escolha do tipo de foto */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
          Que tipo de foto você quer?
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Cada opção gera {VARIATIONS_PER_CLICK} fotos usando suas imagens como referência.
        </div>
      </div>

      {/* Toggle: com modelo */}
      <button
        onClick={() => setWithModel((w) => !w)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: withModel ? "rgba(200,121,65,0.12)" : "var(--surface)",
          border: `1px solid ${withModel ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 10, padding: "12px 16px", cursor: "pointer", marginBottom: 16, width: "100%",
        }}
      >
        <div style={{
          width: 34, height: 20, borderRadius: 999, position: "relative", flexShrink: 0,
          background: withModel ? "var(--accent)" : "var(--border)", transition: "background 0.2s",
        }}>
          <div style={{
            position: "absolute", top: 2, left: withModel ? 16 : 2, width: 16, height: 16,
            borderRadius: "50%", background: "#fff", transition: "left 0.2s",
          }} />
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: withModel ? "var(--accent)" : "var(--text)" }}>
            Colocar com um modelo?
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Uma pessoa segurando, usando ou apresentando o produto
          </div>
        </div>
      </button>

      {/* Cards de opção — clicar SELECIONA; gerar só no botão de confirmar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        {styles.map((s) => (
          <StyleCard
            key={s.key}
            style={s}
            selected={selected?.key === s.key}
            onClick={() => setSelected((cur) => (cur?.key === s.key ? null : s))}
          />
        ))}
      </div>

      {/* Painel de confirmação: pedido específico → prompt entendido → gerar */}
      {selected && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: 12, padding: 20, marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
            {selected.emoji} {selected.label} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>· {selected.sub}</span>
          </div>

          {!pending ? (
            <>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                Quer pedir algo específico? Descreva do seu jeito — cenário, cor de fundo, clima, o que imaginar. (opcional)
              </div>
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="Ex: quero ver a modelo da cintura pra cima, fundo rosa claro, clima natalino…"
                rows={2}
                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text)", fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12 }}
              />
              {prepError && (
                <div style={{ fontSize: 12, color: "#f87171", marginBottom: 10 }}>{prepError}</div>
              )}
              <button
                disabled={preparing}
                onClick={async () => {
                  if (!request.trim()) {
                    generateStyle(selected);
                    setSelected(null);
                    setRequest("");
                    return;
                  }
                  setPreparing(true);
                  setPrepError(null);
                  try {
                    const prep = await buildPromptRaw(selected, request);
                    setPending({ style: selected, note: request.trim(), ...prep });
                  } catch {
                    setPrepError("Não consegui preparar o prompt agora. Tente de novo.");
                  } finally {
                    setPreparing(false);
                  }
                }}
                style={{ width: "100%", background: preparing ? "var(--surface2)" : "var(--accent)", border: "none", color: preparing ? "var(--text-muted)" : "#fff", borderRadius: 8, padding: "14px", fontSize: 15, fontWeight: 700, cursor: preparing ? "wait" : "pointer" }}
              >
                {preparing
                  ? "Entendendo o seu pedido…"
                  : request.trim()
                    ? "Transformar meu pedido em prompt →"
                    : `Sim, gerar ${VARIATIONS_PER_CLICK} fotos →`}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "var(--text-muted)", margin: "10px 0 6px" }}>
                Entendi o seu pedido assim:
              </div>
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 12 }}>
                {pending.resumoPT || "Pedido incorporado ao prompt de geração."}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    generateStyle(pending.style, pending.note, pending.promptEN);
                    setPending(null);
                    setSelected(null);
                    setRequest("");
                  }}
                  style={{ flex: 1, minWidth: 200, background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
                >
                  Confirmar — gerar {VARIATIONS_PER_CLICK} fotos →
                </button>
                <button
                  onClick={() => setPending(null)}
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "14px 18px", fontSize: 13, cursor: "pointer" }}
                >
                  ✏️ Ajustar pedido
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Lotes de imagens geradas */}
      {batches.map((batch) => (
        <div key={batch.id} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: batch.note ? 4 : 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15 }}>{batch.style.emoji}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{batch.style.label}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· {batch.style.sub}</span>
          </div>
          {batch.note && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", marginBottom: 12 }}>
              com o seu pedido: “{batch.note}”
            </div>
          )}
          {batch.review && !batch.loading && batch.images.length > 0 && (
            <div style={{ fontSize: 12, color: "#f59e0b", marginBottom: 10 }}>
              ⚠ Estilo de alta liberdade criativa — confira se o produto saiu fiel (cor, rótulo, forma). Se mudou, use o “Não” abaixo e conte o que alterou.
            </div>
          )}

          {batch.error ? (
            <div style={{ padding: "12px 16px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 8, color: "#f87171", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span>{batch.error}</span>
              <button onClick={() => retryBatch(batch)} style={{ background: "none", border: "1px solid #5c1a1a", color: "#f87171", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                Tentar de novo
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {batch.images.map((url, i) => (
                <div key={i} style={{ borderRadius: 10, overflow: "hidden", position: "relative", background: "var(--surface2)" }}>
                  <img src={url} alt={`${batch.style.label} ${i + 1}`} style={{ width: "100%", display: "block" }} />
                  <a href={url} download={`foto-${batch.style.key}-${i + 1}.jpg`} target="_blank" rel="noopener noreferrer" style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.75)", color: "#fff", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
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

          {/* Feedback pós-geração */}
          {!batch.loading && !batch.error && batch.images.length > 0 && batch.feedback !== "redone" && (
            <div style={{ marginTop: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
              {!batch.feedback && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                    Essa geração foi satisfatória para você?
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => updateBatch(batch.id, { feedback: "yes" })}
                      style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
                    >
                      👍 Sim
                    </button>
                    <button
                      onClick={() => updateBatch(batch.id, { feedback: "no" })}
                      style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
                    >
                      👎 Não
                    </button>
                  </div>
                </div>
              )}
              {batch.feedback === "yes" && (
                <div style={{ fontSize: 13, color: "#4ade80" }}>✓ Que bom! As fotos estão prontas pra baixar.</div>
              )}
              {batch.feedback === "no" && !batch.redo && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                    O que faltou? Conta do seu jeito que a gente ajusta.
                  </div>
                  <textarea
                    value={batch.feedbackText || ""}
                    onChange={(e) => updateBatch(batch.id, { feedbackText: e.target.value })}
                    placeholder="Ex: quero ver a modelo inteira, não só a mão; fundo mais escuro; produto maior na foto…"
                    rows={2}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text)", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10 }}
                  />
                  {batch.redoError && (
                    <div style={{ fontSize: 12, color: "#f87171", marginBottom: 8 }}>{batch.redoError}</div>
                  )}
                  <button
                    onClick={() => prepareRedo(batch)}
                    disabled={!batch.feedbackText?.trim() || batch.redoPreparing}
                    style={{
                      background: batch.feedbackText?.trim() && !batch.redoPreparing ? "var(--accent)" : "var(--surface2)",
                      color: batch.feedbackText?.trim() && !batch.redoPreparing ? "#fff" : "var(--text-muted)",
                      border: "none", borderRadius: 8, padding: "11px 18px", fontSize: 13, fontWeight: 700,
                      cursor: batch.feedbackText?.trim() && !batch.redoPreparing ? "pointer" : "not-allowed",
                    }}
                  >
                    {batch.redoPreparing ? "Entendendo o que faltou…" : "Transformar no prompt →"}
                  </button>
                </div>
              )}
              {batch.feedback === "no" && batch.redo && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                    Entendi as suas considerações assim:
                  </div>
                  <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 10 }}>
                    {batch.redo.resumoPT || "Considerações incorporadas ao prompt."}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => confirmRedo(batch)}
                      style={{ flex: 1, minWidth: 200, background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                    >
                      Confirmar — gerar {VARIATIONS_PER_CLICK} novas tentativas →
                    </button>
                    <button
                      onClick={() => updateBatch(batch.id, { redo: undefined })}
                      style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "12px 16px", fontSize: 12, cursor: "pointer" }}
                    >
                      ✏️ Ajustar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Card de opção: imagem de exemplo (com fallback pra emoji) ────────────────
function StyleCard({ style, selected, onClick }: { style: StyleOption; selected?: boolean; onClick: () => void }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? "rgba(200,121,65,0.1)" : "var(--surface)",
        border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 12,
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <div style={{ aspectRatio: "4 / 3", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {imgOk ? (
          <img
            src={`/exemplos/${style.key}.jpg`}
            alt={style.label}
            onError={() => setImgOk(false)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ fontSize: 36, opacity: 0.7 }}>{style.emoji}</div>
        )}
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{style.label}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{style.sub}</div>
      </div>
    </button>
  );
}

// ── Componentes de formulário (painel de ajuste) ─────────────────────────────
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
