"use client";

import { useState, useRef, useEffect } from "react";
import { ProductInfo, PhotoType, ProductCategory } from "@/lib/types";
import { assembleScene, BrandDirection } from "@/lib/scene-blocks";
import {
  ArrowRight, ArrowUp, Camera, Check, Clapperboard, Download, Film, Gem, Layers,
  Lightbulb, Lock, LogOut, Plus, Search, Smartphone, Store, ThumbsDown, ThumbsUp, X, Zap,
  type LucideIcon,
} from "lucide-react";

// ── Design do protótipo (Claude Design) — Estúdio Swell ──────────────────────
const EMBER = "#E0742F";
const INK = "#0A0908";
const FOAM = "#F4EFE6";
const foam = (a: number) => `rgba(244,239,230,${a})`;
const ember = (a: number) => `rgba(224,116,47,${a})`;

const mono = (size: number, spacing = 0.18): React.CSSProperties => ({
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: size,
  letterSpacing: `${spacing}em`,
});
const display: React.CSSProperties = { fontFamily: "'Archivo', sans-serif", fontWeight: 900, letterSpacing: "-0.035em" };
const glass: React.CSSProperties = {
  background: "rgba(22,18,15,0.6)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${foam(0.09)}`,
  boxShadow: "0 30px 90px rgba(0,0,0,0.4)",
};
const gradientBtn: React.CSSProperties = {
  background: "linear-gradient(180deg, #EE8440 0%, #D96A24 100%)",
  border: "none",
  color: INK,
  borderRadius: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'Hanken Grotesk', sans-serif",
  boxShadow: "0 12px 36px rgba(224,116,47,0.25)",
};

interface StyleOption {
  key: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  photoType: PhotoType;
}

const STYLES_PRODUCT: StyleOption[] = [
  { key: "estudio", label: "Estúdio", sub: "fundo limpo profissional", icon: Lightbulb, photoType: "fundo-limpo" },
  { key: "mostruario", label: "Mostruário", sub: "vitrine · catálogo", icon: Store, photoType: "fundo-limpo" },
  { key: "comercial", label: "Comercial", sub: "cena de campanha", icon: Clapperboard, photoType: "lifestyle" },
  { key: "cg", label: "CG · Render 3D", sub: "visual premium digital", icon: Gem, photoType: "fundo-limpo" },
  { key: "detalhe", label: "Detalhe", sub: "close · textura", icon: Search, photoType: "macro" },
];

const STYLES_WITH_MODEL: StyleOption[] = [
  { key: "influencia", label: "Influência", sub: "estilo criador · UGC", icon: Smartphone, photoType: "segurando" },
  { key: "estudio-modelo", label: "Estúdio", sub: "modelo em estúdio", icon: Lightbulb, photoType: "segurando" },
  { key: "comercial-modelo", label: "Comercial", sub: "campanha com modelo", icon: Clapperboard, photoType: "lifestyle" },
  { key: "mostruario-modelo", label: "Mostruário", sub: "modelo apresentando", icon: Store, photoType: "segurando" },
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
  { value: "acessorio", label: "Acessório / Joia" },
  { value: "outro", label: "Outro produto" },
];

const ANALYZE_MSGS = ["Lendo cor e material…", "Identificando rótulo e forma…", "Preparando a direção de arte…"];
const PROGRESS_MSGS = ["Montando a cena…", "Acertando a luz…", "Posicionando o produto…", "Revelando os frames…"];

const defaultProduct: ProductInfo = {
  category: "outro", name: "", color: "", material: "", size: "",
  hasLabel: false, labelText: "", labelPosition: "",
};

// Perfil "Minha Marca" — salvo no navegador, entra como slot de direção nos prompts
interface BrandProfile { name: string; tone: string; mood: string; human: string; colorHex: string }
const emptyBrand: BrandProfile = { name: "", tone: "", mood: "", human: "", colorHex: "" };
const BRAND_STORAGE_KEY = "swell-brand";
const BRAND_TONES = ["Minimalista", "Premium", "Acolhedor", "Vibrante", "Natural"];
const BRAND_MOODS = ["Clean", "Quente", "Escuro", "Colorido"];
const BRAND_HUMANS = ["Sem pessoas", "Só detalhes (mãos)", "Com modelo"];

interface Photo { url: string; base64: string }

interface Batch {
  id: number;
  style: StyleOption;
  images: string[];
  loading: boolean;
  isBase?: boolean;
  startedAt: number;
  error?: string;
  note?: string;
  feedback?: "yes" | "no" | "redone";
  feedbackText?: string;
  redo?: { promptEN: string; resumoPT: string; note: string };
  redoPreparing?: boolean;
  redoError?: string;
  review?: boolean;
}

type Phase = "upload" | "analyzing" | "studio";
type Stage = "category" | "results";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
      " · " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    ).toUpperCase();
  } catch {
    return "";
  }
}

export default function PromptGenerator({ onEnsaio }: { onEnsaio?: () => void } = {}) {
  const [phase, setPhase] = useState<Phase>("upload");
  const [stage, setStage] = useState<Stage>("category");
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
  const [brand, setBrand] = useState<BrandProfile>(emptyBrand);
  const [brandOpen, setBrandOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [history, setHistory] = useState<{ id: number; style: string; label: string | null; images: string[]; note: string | null; created_at: string }[]>([]);
  const [historyEmail, setHistoryEmail] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [now, setNow] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);
  const batchSeq = useRef(0);
  const photosRef = useRef<Photo[]>([]);
  useEffect(() => { photosRef.current = photos; }, [photos]);

  // Mensagens rotativas + tick de progresso enquanto algo carrega
  const anyLoading = phase === "analyzing" || batches.some((b) => b.loading);
  useEffect(() => {
    if (!anyLoading) return;
    const t = setInterval(() => { setMsgIdx((i) => i + 1); setNow(Date.now()); }, 2600);
    return () => clearInterval(t);
  }, [anyLoading]);

  // Perfil de marca salvo
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(BRAND_STORAGE_KEY);
        if (raw) setBrand({ ...emptyBrand, ...JSON.parse(raw) });
      } catch { /* ignora */ }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Carrega o histórico permanente (por e-mail) quando a Galeria abre
  useEffect(() => {
    if (!galleryOpen) return;
    const t = setTimeout(() => {
      setHistoryLoading(true);
      fetch("/api/generations")
        .then((r) => r.json())
        .then((d) => { setHistory(Array.isArray(d.generations) ? d.generations : []); setHistoryEmail(d.email ?? null); })
        .catch(() => { /* silencioso */ })
        .finally(() => setHistoryLoading(false));
    }, 0);
    return () => clearTimeout(t);
  }, [galleryOpen]);

  function saveBrand(b: BrandProfile) {
    setBrand(b);
    try { localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(b)); } catch { /* sem storage */ }
    setBrandOpen(false);
  }

  const brandDirection: BrandDirection | undefined =
    brand.tone || brand.colorHex || brand.mood || brand.human
      ? { tone: brand.tone || undefined, colorHex: brand.colorHex || undefined, mood: brand.mood || undefined, human: brand.human || undefined }
      : undefined;

  // ── Upload / análise ──────────────────────────────────────────────────────
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

  async function addFiles(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    const room = MAX_PHOTOS - photosRef.current.length;
    const toAdd = imgs.slice(0, room);
    if (toAdd.length === 0) return;

    const isFirst = photosRef.current.length === 0;
    if (isFirst) setPhase("analyzing");
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
        setStage("category");
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

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (phase === "analyzing") return;
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

  // ── Geração ───────────────────────────────────────────────────────────────
  function updateBatch(id: number, patch: Partial<Batch>) {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  async function buildPromptRaw(style: StyleOption, note?: string): Promise<{ promptEN: string; resumoPT: string }> {
    const base = assembleScene(style.key, product, 0, brandDirection);
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

  async function generateStyle(style: StyleOption, note?: string, prebuiltPrompt?: string, isBase = false) {
    const id = ++batchSeq.current;
    const asm = assembleScene(style.key, product, 0, brandDirection);
    setBatches((prev) => [...prev, { id, style, images: [], loading: true, note, review: asm.needsReview, isBase, startedAt: Date.now() }]);
    try {
      let prompts: string[];
      if (prebuiltPrompt) {
        prompts = Array(VARIATIONS_PER_CLICK).fill(prebuiltPrompt);
      } else if (note?.trim()) {
        const built = (await buildPromptRaw(style, note)).promptEN;
        prompts = Array(VARIATIONS_PER_CLICK).fill(built);
      } else {
        prompts = Array.from({ length: VARIATIONS_PER_CLICK }, (_, i) => assembleScene(style.key, product, i, brandDirection).promptEN);
      }

      const refs = photosRef.current.map((p) => p.base64);
      const reqs = prompts.map((promptEN) =>
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

      const pendingIds = new Set(taskIds);
      const collected: string[] = [];
      let attempts = 0;
      while (pendingIds.size > 0 && attempts < 60) {
        if (cancelRef.current) break;
        await sleep(3000);
        attempts++;
        for (const tid of Array.from(pendingIds)) {
          if (cancelRef.current) break;
          const res = await fetch(`/api/image-status?taskId=${tid}`);
          const d = await res.json();
          if (d?.status === "COMPLETED") {
            collected.push(...((d?.generated as string[]) || []));
            pendingIds.delete(tid);
            updateBatch(id, { images: [...collected] });
          } else if (d?.status === "FAILED") {
            pendingIds.delete(tid);
          }
        }
      }
      if (collected.length === 0) throw new Error("Nenhuma imagem gerada");
      updateBatch(id, { loading: false });

      // Salva no histórico permanente por e-mail (best-effort, não trava a UI)
      fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: style.key, label: style.label, images: collected, note: note || null }),
      }).catch(() => { /* histórico é best-effort */ });
    } catch (e) {
      updateBatch(id, { loading: false, error: e instanceof Error ? e.message : "Erro ao gerar" });
    }
  }

  // Vai pra tela de geração SEM gastar crédito — nada é gerado até escolher um estilo.
  function goToGeneration() {
    setStage("results");
  }

  function retryBatch(batch: Batch) {
    setBatches((prev) => prev.filter((b) => b.id !== batch.id));
    generateStyle(batch.style, batch.note, undefined, batch.isBase);
  }

  async function prepareRedo(batch: Batch) {
    const considerations = [batch.note, batch.feedbackText].filter((t) => t && t.trim()).join(". Além disso: ");
    updateBatch(batch.id, { redoPreparing: true, redoError: undefined });
    try {
      const prep = await buildPromptRaw(batch.style, considerations);
      updateBatch(batch.id, { redo: { ...prep, note: considerations }, redoPreparing: false });
    } catch {
      updateBatch(batch.id, { redoPreparing: false, redoError: "Não consegui preparar o prompt agora. Tente de novo." });
    }
  }

  function confirmRedo(batch: Batch) {
    if (!batch.redo) return;
    updateBatch(batch.id, { feedback: "redone" });
    generateStyle(batch.style, batch.redo.note, batch.redo.promptEN);
  }

  function reset() {
    cancelRef.current = true;
    setPhase("upload");
    setStage("category");
    setPhotos([]);
    setProduct(defaultProduct);
    setWithModel(false);
    setSelected(null);
    setRequest("");
    setPending(null);
    setBatches([]);
    setError(null);
    setQueueOpen(false);
    setGalleryOpen(false);
    setTimeout(() => { cancelRef.current = false; }, 50);
  }

  const styles = withModel ? STYLES_WITH_MODEL : STYLES_PRODUCT;
  const needMorePhotos = photos.length > 0 && photos.length < SUGGESTED_MIN_PHOTOS;
  const queueCount = batches.filter((b) => b.loading).length;
  const creditsUsed = batches.length * VARIATIONS_PER_CLICK;
  const progressPct = (b?: { startedAt: number }) =>
    b && now > 0 ? `${Math.min(92, Math.max(6, Math.round(((now - b.startedAt) / 50000) * 100)))}%` : "6%";

  // ── Blocos compartilhados ─────────────────────────────────────────────────
  const badges = (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "clamp(24px, 4vw, 52px)", flexWrap: "wrap", marginTop: 40 }}>
      {[[Gem, "PRODUTO FIEL AO ORIGINAL"], [Lock, "SEUS ARQUIVOS SÃO PRIVADOS"], [Zap, "RESULTADO EM MINUTOS"]].map(([Icon, t]) => {
        const I = Icon as LucideIcon;
        return (
          <div key={t as string} style={{ display: "flex", alignItems: "center", gap: 9, ...mono(9), color: foam(0.45) }}>
            <I size={13} />{t as string}
          </div>
        );
      })}
    </div>
  );

  const modelToggle = (
    <button
      onClick={() => { setWithModel((w) => !w); setSelected(null); }}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
        background: withModel ? ember(0.08) : foam(0.03),
        border: `1px solid ${withModel ? ember(0.45) : foam(0.1)}`,
        borderRadius: 14, padding: "14px 18px", cursor: "pointer", marginBottom: 18,
        transition: "all 300ms", boxSizing: "border-box", fontFamily: "'Hanken Grotesk', sans-serif",
      }}
    >
      <div style={{ width: 36, height: 21, borderRadius: 999, position: "relative", flexShrink: 0, background: withModel ? EMBER : foam(0.15), transition: "background 300ms" }}>
        <div style={{ position: "absolute", top: 2, left: withModel ? 17 : 2, width: 17, height: 17, borderRadius: "50%", background: FOAM, transition: "left 300ms cubic-bezier(0.22,1,0.36,1)" }} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: withModel ? EMBER : FOAM }}>Colocar com um modelo?</div>
        <div style={{ fontSize: 12, color: foam(0.5) }}>Uma pessoa segurando, usando ou apresentando o produto</div>
      </div>
    </button>
  );

  const header = (
    <header style={{
      position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px clamp(20px, 4vw, 48px)", background: "rgba(10,9,8,0.72)",
      backdropFilter: "blur(22px) saturate(140%)", WebkitBackdropFilter: "blur(22px) saturate(140%)",
      borderBottom: `1px solid ${foam(0.08)}`,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <div style={{ ...display, fontSize: 19, letterSpacing: "-0.02em" }}>Swell<span style={{ color: EMBER }}>.</span></div>
        <div style={{ ...mono(10, 0.22), color: foam(0.45) }}>FOTO ESTÚDIO IA</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <nav style={{ display: "flex", alignItems: "center", gap: 2, marginRight: 8 }}>
          <button onClick={reset} style={navBtn}>Novo ensaio</button>
          <button onClick={() => setGalleryOpen(true)} style={navBtn}>Galeria</button>
          <button onClick={() => setBrandOpen(true)} style={navBtn}>{brand.name ? `● ${brand.name}` : "Minha marca"}</button>
        </nav>
        <button
          onClick={() => setPricingOpen(true)}
          title="Créditos e planos"
          style={{
            display: "flex", alignItems: "center", gap: 9, background: ember(0.1), border: `1px solid ${ember(0.35)}`,
            color: EMBER, borderRadius: 999, padding: "7px 14px", ...mono(11, 0.12), cursor: "pointer",
          }}
        >
          {creditsUsed} CRÉDITOS USADOS
        </button>
        <a href="/api/logout" title="Sair" style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34,
          border: `1px solid ${foam(0.14)}`, color: foam(0.55), borderRadius: "50%", textDecoration: "none",
        }}>
          <LogOut size={14} />
        </a>
      </div>
    </header>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Hanken Grotesk', sans-serif" }}>
      {header}

      {/* ── UPLOAD ── */}
      {phase === "upload" && (
        <main style={{ flex: 1, width: "100%", maxWidth: 1180, margin: "0 auto", padding: "clamp(40px, 7vh, 90px) clamp(20px, 4vw, 48px) 80px", boxSizing: "border-box", animation: "riseIn 800ms cubic-bezier(0.22,1,0.36,1) both" }}>
          <div style={{ ...mono(11, 0.24), color: EMBER, marginBottom: 22 }}>01 · NOVO ENSAIO</div>
          <h1 style={{ ...display, fontSize: "clamp(44px, 5.6vw, 76px)", lineHeight: 0.95, margin: "0 0 20px" }}>
            Seu produto.<br /><span style={{ color: foam(0.4) }}>Pronto para vender.</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: foam(0.55), margin: "0 0 44px", maxWidth: "52ch" }}>
            Envie fotos do celular. A gente preserva cada detalhe e cria o ensaio por você.
          </p>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(Array.from(e.dataTransfer.files)); }}
            style={{ ...glass, display: "flex", alignItems: "center", gap: "clamp(20px, 3vw, 36px)", flexWrap: "wrap", borderRadius: 24, padding: "clamp(28px, 4vw, 46px)", cursor: "pointer", transition: "border-color 300ms" }}
          >
            <div style={{ width: 58, height: 58, borderRadius: 16, background: ember(0.12), border: `1px solid ${ember(0.3)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ArrowUp size={22} color={EMBER} />
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 7 }}>Comece pelas fotos do produto</div>
              <div style={{ fontSize: 14, color: foam(0.55), lineHeight: 1.55 }}>Para manter rótulo, textura e formato fiéis, envie de 3 a 6 ângulos.</div>
              <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 20, ...mono(9, 0.16), color: foam(0.4) }}>
                <span>JPG OU PNG</span><span>ATÉ 12 MB POR FOTO</span><span>CTRL+V FUNCIONA</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
              <button style={{ ...gradientBtn, padding: "14px 26px", fontSize: 14 }}>Escolher fotos</button>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
            onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; }} />

          {error && (
            <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(178,59,46,0.12)", border: "1px solid rgba(178,59,46,0.4)", borderRadius: 12, color: "#E8836F", fontSize: 13, textAlign: "center" }}>
              {error}
            </div>
          )}

          {badges}

          {onEnsaio && (
            <p style={{ textAlign: "center", marginTop: 40, fontSize: 13, color: foam(0.4) }}>
              Quer fotos suas, não de produto?{" "}
              <button onClick={onEnsaio} style={{ background: "none", border: "none", color: EMBER, cursor: "pointer", fontSize: 13, padding: 0 }}>
                Ensaio de Pessoa →
              </button>
            </p>
          )}
        </main>
      )}

      {/* ── ANALISANDO ── */}
      {phase === "analyzing" && (
        <main style={{ flex: 1, width: "100%", maxWidth: 1180, margin: "0 auto", padding: "clamp(40px, 7vh, 90px) clamp(20px, 4vw, 48px) 80px", boxSizing: "border-box", animation: "riseIn 700ms cubic-bezier(0.22,1,0.36,1) both" }}>
          <div style={{ ...mono(11, 0.24), color: EMBER, marginBottom: 22 }}>01 · NOVO ENSAIO</div>
          <div style={{ ...glass, display: "flex", alignItems: "center", gap: "clamp(24px, 3vw, 44px)", flexWrap: "wrap", borderRadius: 24, padding: "clamp(24px, 3vw, 40px)" }}>
            <div style={{ position: "relative", width: "min(280px, 100%)", aspectRatio: "1 / 1", borderRadius: 18, background: "#14110F", border: `1px solid ${foam(0.08)}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photos[0].url} alt="Seu produto" style={{ position: "absolute", inset: 24, width: "calc(100% - 48px)", height: "calc(100% - 48px)", objectFit: "cover", borderRadius: 10 }} />
              )}
              <div style={{ position: "absolute", left: 0, right: 0, height: "30%", background: `linear-gradient(180deg, ${ember(0)} 0%, ${ember(0.18)} 50%, ${ember(0)} 100%)`, animation: "scan 2.2s cubic-bezier(0.45,0,0.55,1) infinite" }} />
              {[["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h]) => (
                <div key={`${v}${h}`} style={{ position: "absolute", [v]: 14, [h]: 14, width: 22, height: 22, [`border${v[0].toUpperCase()}${v.slice(1)}` as string]: `2px solid ${foam(0.7)}`, [`border${h[0].toUpperCase()}${h.slice(1)}` as string]: `2px solid ${foam(0.7)}` } as React.CSSProperties} />
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${ember(0.4)}`, borderRadius: 999, padding: "7px 15px", marginBottom: 20 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: EMBER, display: "inline-block", animation: "softPulse 1.6s ease-in-out infinite" }} />
                <span style={{ ...mono(10, 0.2), color: EMBER }}>ANALISANDO</span>
              </div>
              <div style={{ ...display, fontWeight: 800, fontSize: "clamp(24px, 2.8vw, 32px)", letterSpacing: "-0.02em", marginBottom: 10 }}>Entendendo seu produto…</div>
              <div style={{ fontSize: 14, color: foam(0.55), lineHeight: 1.6, marginBottom: 24 }}>{ANALYZE_MSGS[msgIdx % ANALYZE_MSGS.length]}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", ...mono(9, 0.16) }}>
                <span style={{ color: FOAM, display: "flex", alignItems: "center", gap: 6 }}><Check size={11} color={EMBER} />{photos.length} FOTO{photos.length > 1 ? "S" : ""} DE REFERÊNCIA</span>
                <span style={{ color: foam(0.4) }}>· PRESERVANDO DETALHES</span>
              </div>
            </div>
          </div>
          {badges}
        </main>
      )}

      {/* ── ESTÚDIO ── */}
      {phase === "studio" && (
        <main style={{ flex: 1, width: "100%", maxWidth: 1180, margin: "0 auto", padding: "clamp(32px, 5vh, 60px) clamp(20px, 4vw, 48px) 100px", boxSizing: "border-box", animation: "riseIn 700ms cubic-bezier(0.22,1,0.36,1) both" }}>

          {/* Etapa 1: categoria + informações */}
          {stage === "category" && (
            <>
              <div style={{ ...glass, borderRadius: 24, overflow: "hidden" }}>
                <div style={{ padding: "clamp(20px, 2.5vw, 30px) clamp(22px, 3vw, 36px)", borderBottom: `1px solid ${foam(0.07)}`, background: foam(0.02) }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
                    <div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, border: `1px solid ${foam(0.2)}`, borderRadius: 999, padding: "5px 13px", marginBottom: 10 }}>
                        <Check size={11} color={EMBER} />
                        <span style={{ ...mono(9, 0.2), color: foam(0.75) }}>PRODUTO IDENTIFICADO</span>
                      </div>
                      <div style={{ ...display, fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em" }}>{product.name || "Seu produto"}</div>
                      <div style={{ ...mono(9, 0.16), color: foam(0.4), marginTop: 7 }}>
                        {[product.color, product.material].filter(Boolean).join(" · ").toUpperCase() || "DETALHES ABAIXO"}
                      </div>
                    </div>
                    {needMorePhotos && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${ember(0.4)}`, background: ember(0.07), borderRadius: 12, padding: "10px 14px", fontSize: 12, color: EMBER }}>
                        <Camera size={14} />Mais {SUGGESTED_MIN_PHOTOS - photos.length} ângulo(s) deixam o produto mais fiel
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    {photos.map((p, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={`Referência ${i + 1}`} style={{ width: 68, height: 68, objectFit: "cover", borderRadius: 12, border: `1px solid ${foam(0.12)}`, display: "block" }} />
                        <button onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} title="Remover"
                          style={{ position: "absolute", top: -7, right: -7, width: 20, height: 20, borderRadius: "50%", background: "rgba(10,9,8,0.9)", color: FOAM, border: `1px solid ${foam(0.2)}`, fontSize: 11, cursor: "pointer", lineHeight: 1, padding: 0 }}>
                          ×
                        </button>
                      </div>
                    ))}
                    {photos.length < MAX_PHOTOS && (
                      <button onClick={() => addInputRef.current?.click()} title="Adicionar mais fotos"
                        style={{ width: 68, height: 68, borderRadius: 12, border: `1px dashed ${foam(0.25)}`, background: foam(0.03), color: foam(0.55), cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, ...mono(7, 0.12) }}>
                        <Plus size={16} />ADICIONAR
                      </button>
                    )}
                    <input ref={addInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                      onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; }} />
                    <div style={{ ...mono(9, 0.16), color: foam(0.35), marginLeft: 6 }}>{photos.length} DE {MAX_PHOTOS}</div>
                  </div>
                </div>

                <div style={{ padding: "clamp(24px, 3vw, 36px)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ ...mono(11, 0.22), color: EMBER }}>AJUDE A GENTE A ACERTAR O CENÁRIO</div>
                    <div style={{ ...mono(9, 0.18), color: foam(0.45), border: `1px solid ${foam(0.15)}`, borderRadius: 999, padding: "5px 13px" }}>OPCIONAL</div>
                  </div>
                  <div style={{ ...display, fontWeight: 800, fontSize: "clamp(26px, 3vw, 36px)", letterSpacing: "-0.025em", marginBottom: 8 }}>Em qual categoria ele se encaixa?</div>
                  <p style={{ fontSize: 14, color: foam(0.55), margin: "0 0 26px" }}>Isso melhora as sugestões de luz e cenário. <strong style={{ color: FOAM }}>É opcional.</strong></p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12, marginBottom: 20 }}>
                    {CATEGORIES.map((c) => {
                      const isSel = product.category === c.value;
                      const isSuggested = c.value !== "outro" && product.category === c.value;
                      return (
                        <button key={c.value} onClick={() => setProduct((p) => ({ ...p, category: c.value }))}
                          style={{ position: "relative", display: "flex", alignItems: "center", gap: 14, textAlign: "left", padding: 18, borderRadius: 16, border: `1px solid ${isSel ? ember(0.5) : foam(0.09)}`, background: isSel ? ember(0.07) : foam(0.02), cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif", transition: "all 250ms" }}>
                          {isSuggested && (
                            <span style={{ position: "absolute", top: -9, left: 16, background: "#201C17", border: `1px solid ${foam(0.15)}`, color: foam(0.65), ...mono(8, 0.16), padding: "3px 9px", borderRadius: 999 }}>SUGERIDO</span>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: isSel ? EMBER : FOAM }}>{c.label}</div>
                          </div>
                          <div style={{ width: 17, height: 17, borderRadius: "50%", border: `1.5px solid ${isSel ? EMBER : foam(0.25)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {isSel && <div style={{ width: 8, height: 8, borderRadius: "50%", background: EMBER }} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ border: `1px solid ${foam(0.08)}`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: ember(0.1), border: `1px solid ${ember(0.3)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Plus size={15} color={EMBER} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>Conte um pouco sobre o produto</div>
                        <div style={{ fontSize: 12, color: foam(0.5) }}>Uma descrição curta já ajuda o estúdio a preservar os detalhes.</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                      {([["O que é o produto?", "name", "Ex.: vaso decorativo artesanal"], ["Cor principal", "color", "Ex.: terracota"], ["Material", "material", "Ex.: cerâmica"]] as const).map(([label, field, ph]) => (
                        <label key={field} style={{ display: "block" }}>
                          <span style={{ display: "block", fontSize: 12, color: foam(0.55), marginBottom: 7 }}>{label}</span>
                          <input value={product[field]} onChange={(e) => setProduct((p) => ({ ...p, [field]: e.target.value }))} placeholder={ph}
                            style={{ width: "100%", background: foam(0.04), border: `1px solid ${foam(0.1)}`, borderRadius: 10, padding: "12px 14px", color: FOAM, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Hanken Grotesk', sans-serif" }} />
                        </label>
                      ))}
                    </div>
                  </div>

                  {modelToggle}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 26 }}>
                    <button onClick={goToGeneration} style={{ background: "none", border: "none", color: foam(0.5), fontSize: 14, cursor: "pointer", padding: 0, fontFamily: "'Hanken Grotesk', sans-serif" }}>
                      Pular por enquanto
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                      <span style={{ ...mono(9, 0.18), color: foam(0.4) }}>NENHUM CRÉDITO AINDA · VOCÊ ESCOLHE O QUE GERAR</span>
                      <button onClick={goToGeneration} style={{ ...gradientBtn, padding: "15px 28px", fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}>
                        Escolher os estilos<ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {badges}
            </>
          )}

          {/* Etapa 2: resultado-base + próximos passos + gerações */}
          {stage === "results" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 7, border: `1px solid ${foam(0.2)}`, borderRadius: 999, padding: "6px 14px", marginBottom: 16 }}>
                    <Check size={11} color={EMBER} />
                    <span style={{ ...mono(9, 0.2), color: foam(0.7) }}>PRODUTO TRAVADO · {photos.length} REFERÊNCIA{photos.length > 1 ? "S" : ""}</span>
                  </div>
                  <div style={{ ...display, fontWeight: 800, fontSize: "clamp(28px, 3.4vw, 44px)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {product.name || "Seu produto"}
                  </div>
                  <p style={{ fontSize: 14, color: foam(0.55), margin: "10px 0 0" }}>
                    Nenhum crédito gasto ainda. Escolha um estilo abaixo — cada geração usa suas fotos só pra travar o produto e cria um cenário novo.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button onClick={() => setQueueOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: foam(0.05), border: `1px solid ${foam(0.14)}`, color: FOAM, borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                    <Layers size={14} />Ver a fila<span style={{ ...mono(10), color: EMBER }}>{queueCount}</span>
                  </button>
                </div>
              </div>

              {/* Mosaico das fotos de referência (nada é gerado — zero crédito) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginBottom: 20 }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 16, overflow: "hidden", border: `1px solid ${foam(0.1)}`, background: "#14110F" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={`Referência ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <span style={{ position: "absolute", left: 8, bottom: 8, ...mono(8, 0.14), color: foam(0.75), background: "rgba(10,9,8,0.6)", borderRadius: 6, padding: "3px 7px" }}>REF {String(i + 1).padStart(2, "0")}</span>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button onClick={() => addInputRef.current?.click()} title="Adicionar mais fotos"
                    style={{ aspectRatio: "1 / 1", borderRadius: 16, border: `1px dashed ${foam(0.25)}`, background: foam(0.03), color: foam(0.55), cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, ...mono(8, 0.12) }}>
                    <Plus size={18} />ADICIONAR
                  </button>
                )}
                <input ref={addInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; }} />
              </div>

              {/* Próximo melhor passo */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
                <div>
                  <div style={{ ...mono(11, 0.22), color: EMBER, marginBottom: 10 }}>PRÓXIMO MELHOR PASSO</div>
                  <div style={{ ...display, fontWeight: 800, fontSize: "clamp(24px, 2.8vw, 34px)", letterSpacing: "-0.025em" }}>O que você quer criar agora?</div>
                </div>
                <div style={{ fontSize: 12, color: foam(0.45) }}>1 clique · sem enviar tudo de novo</div>
              </div>

              {modelToggle}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14, marginBottom: 20 }}>
                {styles.map((s) => {
                  const isSel = selected?.key === s.key;
                  const SIcon = s.icon;
                  return (
                    <button key={s.key} onClick={() => setSelected((cur) => (cur?.key === s.key ? null : s))}
                      style={{ background: "rgba(22,18,15,0.65)", border: `1px solid ${isSel ? ember(0.6) : foam(0.09)}`, borderRadius: 16, padding: 0, cursor: "pointer", textAlign: "left", overflow: "hidden", fontFamily: "'Hanken Grotesk', sans-serif", boxShadow: isSel ? `0 0 0 1px ${ember(0.4)}` : "none", transition: "border-color 300ms" }}>
                      <div style={{ aspectRatio: "16 / 10", background: "#1B1714", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <StyleThumb styleKey={s.key} Icon={SIcon} />
                        {isSel && (
                          <div style={{ position: "absolute", right: 10, top: 10, width: 24, height: 24, borderRadius: "50%", background: EMBER, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Check size={13} color={INK} />
                          </div>
                        )}
                      </div>
                      <div style={{ padding: "13px 15px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: FOAM }}>{s.label}</span>
                          <span style={{ fontSize: 11, color: EMBER, whiteSpace: "nowrap" }}>{VARIATIONS_PER_CLICK} créditos →</span>
                        </div>
                        <div style={{ fontSize: 12, color: foam(0.5) }}>{s.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Painel de confirmação */}
              {selected && (
                <div style={{ background: "rgba(22,18,15,0.75)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: `1px solid ${ember(0.4)}`, borderRadius: 18, padding: 24, marginBottom: 40, boxShadow: "0 30px 90px rgba(0,0,0,0.5)", animation: "riseIn 450ms cubic-bezier(0.22,1,0.36,1) both" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <selected.icon size={16} color={EMBER} />
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{selected.label}</span>
                    <span style={{ ...mono(9, 0.14), color: foam(0.45), textTransform: "uppercase" }}>{selected.sub}</span>
                  </div>
                  {!pending ? (
                    <>
                      <div style={{ fontSize: 12, color: foam(0.5), marginBottom: 12 }}>Quer pedir algo específico? Descreva do seu jeito — cenário, fundo, clima. (opcional)</div>
                      <textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={2}
                        placeholder="Ex: fundo rosa claro, clima natalino, modelo da cintura pra cima…"
                        style={{ width: "100%", background: foam(0.05), border: `1px solid ${foam(0.12)}`, borderRadius: 12, padding: "12px 14px", color: FOAM, fontSize: 14, resize: "vertical", outline: "none", fontFamily: "'Hanken Grotesk', sans-serif", boxSizing: "border-box", marginBottom: 14 }} />
                      {prepError && <div style={{ fontSize: 12, color: "#E8836F", marginBottom: 10 }}>{prepError}</div>}
                      <button
                        disabled={preparing}
                        onClick={async () => {
                          if (!request.trim()) {
                            generateStyle(selected);
                            setSelected(null); setRequest("");
                            return;
                          }
                          setPreparing(true); setPrepError(null);
                          try {
                            const prep = await buildPromptRaw(selected, request);
                            setPending({ style: selected, note: request.trim(), ...prep });
                          } catch {
                            setPrepError("Não consegui preparar o prompt agora. Tente de novo.");
                          } finally {
                            setPreparing(false);
                          }
                        }}
                        style={{ width: "100%", background: preparing ? foam(0.08) : EMBER, border: "none", color: preparing ? foam(0.5) : INK, borderRadius: 12, padding: 15, fontSize: 15, fontWeight: 700, cursor: preparing ? "wait" : "pointer", fontFamily: "'Hanken Grotesk', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        {preparing ? "Entendendo o seu pedido…" : request.trim() ? "Transformar meu pedido em prompt" : `Gerar agora · ${VARIATIONS_PER_CLICK} créditos`}
                        <ArrowRight size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: foam(0.5), margin: "10px 0 8px" }}>Entendi o seu pedido assim:</div>
                      <div style={{ background: foam(0.05), border: `1px solid ${foam(0.1)}`, borderRadius: 12, padding: "14px 16px", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
                        {pending.resumoPT || "Pedido incorporado ao prompt de geração."}
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button onClick={() => { generateStyle(pending.style, pending.note, pending.promptEN); setPending(null); setSelected(null); setRequest(""); }}
                          style={{ flex: 1, minWidth: 220, background: EMBER, border: "none", color: INK, borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                          Confirmar — gerar {VARIATIONS_PER_CLICK} fotos →
                        </button>
                        <button onClick={() => setPending(null)}
                          style={{ background: foam(0.05), border: `1px solid ${foam(0.15)}`, color: foam(0.65), borderRadius: 12, padding: "14px 18px", fontSize: 13, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                          Ajustar pedido
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Gerações desta sessão */}
              {batches.length > 0 && (
                <div style={{ ...mono(11, 0.24), color: foam(0.45), margin: "40px 0 20px" }}>GERAÇÕES DESTA SESSÃO</div>
              )}
              {batches.map((batch) => (
                <BatchBlock key={batch.id} batch={batch} msgIdx={msgIdx} progressPct={progressPct}
                  onRetry={() => retryBatch(batch)} onYes={() => updateBatch(batch.id, { feedback: "yes" })}
                  onNo={() => updateBatch(batch.id, { feedback: "no" })}
                  onFeedbackText={(v) => updateBatch(batch.id, { feedbackText: v })}
                  onPrepareRedo={() => prepareRedo(batch)} onConfirmRedo={() => confirmRedo(batch)}
                  onEditRedo={() => updateBatch(batch.id, { redo: undefined })} />
              ))}
            </>
          )}
        </main>
      )}

      {/* ── Gavetas e modais ── */}
      {queueOpen && (
        <Drawer kicker="O QUE ESTÁ SENDO FEITO" title="Fila" onClose={() => setQueueOpen(false)}>
          <p style={{ fontSize: 12, color: foam(0.5), margin: "0 0 22px" }}>Tudo desta sessão, por categoria — gerando e pronto.</p>
          {batches.length === 0 && <div style={{ fontSize: 13, color: foam(0.45), textAlign: "center", padding: "30px 0" }}>Nada na fila ainda — escolha um estilo para gerar.</div>}
          {batches.map((b) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", border: `1px solid ${foam(0.08)}`, borderRadius: 14, marginBottom: 10, background: foam(0.02) }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: "#1B1714", border: `1px solid ${foam(0.08)}`, flexShrink: 0, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {b.images[0] && <img src={b.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{b.isBase ? "Base e-commerce" : b.style.label}</div>
                <div style={{ ...mono(8, 0.16), color: foam(0.4), marginTop: 4 }}>{b.images.length} FOTO{b.images.length === 1 ? "" : "S"} · {VARIATIONS_PER_CLICK} CRÉDITOS</div>
              </div>
              <span style={{ ...mono(8, 0.16), color: b.error ? "#E8836F" : b.loading ? EMBER : foam(0.6), border: `1px solid ${b.error ? "rgba(178,59,46,0.5)" : b.loading ? ember(0.5) : foam(0.2)}`, borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap", animation: b.loading ? "softPulse 1.6s ease-in-out infinite" : "none" }}>
                {b.error ? "ERRO" : b.loading ? "GERANDO" : "PRONTO"}
              </span>
            </div>
          ))}
        </Drawer>
      )}

      {galleryOpen && (
        <Drawer kicker="SUAS GERAÇÕES" title="Galeria" onClose={() => setGalleryOpen(false)}>
          <div style={{ ...mono(9, 0.14), color: historyEmail ? foam(0.5) : "#C28A1E", marginBottom: 16, wordBreak: "break-all" }}>
            {historyEmail ? `HISTÓRICO DE ${historyEmail.toUpperCase()}` : "SEM SESSÃO — FAÇA LOGIN DE NOVO PARA VER SEU HISTÓRICO"}
          </div>
          {historyLoading && (
            <div style={{ fontSize: 13, color: foam(0.45), textAlign: "center", padding: "30px 0" }}>Carregando seu histórico…</div>
          )}
          {!historyLoading && history.length === 0 && historyEmail && (
            <div style={{ fontSize: 13, color: foam(0.45), textAlign: "center", padding: "30px 0" }}>Nada por aqui ainda — tudo que você gerar fica salvo aqui, pra sempre.</div>
          )}
          {!historyLoading && history.map((g) => (
            <div key={g.id} style={{ marginBottom: 22, background: foam(0.03), border: `1px solid ${foam(0.08)}`, borderRadius: 14, padding: 14 }}>
              <div style={{ ...mono(9, 0.18), color: foam(0.4), marginBottom: 6 }}>{formatWhen(g.created_at)}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{g.label || g.style}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {g.images.map((src, i) => (
                  <a key={i} href={`/api/download?u=${encodeURIComponent(src)}&name=swell-${g.style}-${i + 1}.jpg`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" style={{ width: 56, height: 70, objectFit: "cover", borderRadius: 8, border: `1px solid ${foam(0.1)}`, display: "block" }} />
                  </a>
                ))}
              </div>
              <div style={{ fontSize: 11, color: foam(0.4), marginTop: 8 }}>{g.images.length} foto{g.images.length === 1 ? "" : "s"} · salvas pra sempre</div>
            </div>
          ))}
        </Drawer>
      )}

      {brandOpen && (
        <Drawer kicker="MINHA MARCA" title="Sua marca, no comando" onClose={() => setBrandOpen(false)}>
          <BrandForm brand={brand} onSave={saveBrand} />
        </Drawer>
      )}

      {pricingOpen && (
        <div onClick={() => setPricingOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(10,9,8,0.6)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "riseIn 350ms ease both" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(720px, 100%)", background: "rgba(20,17,15,0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", border: `1px solid ${foam(0.12)}`, borderRadius: 22, padding: 32, boxShadow: "0 50px 140px rgba(0,0,0,0.7)", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ ...mono(10, 0.24), color: foam(0.45), marginBottom: 8 }}>PLANOS</div>
                <div style={{ ...display, fontSize: "clamp(24px, 3.4vw, 32px)", lineHeight: 1 }}>Sua próxima onda<br />começa aqui<span style={{ color: EMBER }}>.</span></div>
              </div>
              <button onClick={() => setPricingOpen(false)} style={closeBtn}><X size={15} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 18 }}>
              <PlanCard kicker="AVULSO" price="R$ 79" desc={<>1 sessão · 16 fotos<br />1 produto</>} cta="Escolher" />
              <PlanCard kicker="PRO" price="R$ 249" suffix="/mês" desc={<>80 fotos por mês<br />produtos ilimitados · fila prioritária</>} cta="Assinar Pro" featured />
              <PlanCard kicker="MARCA" price="R$ 690" suffix="/mês" desc={<>Fotos ilimitadas<br />direção de arte Swell · suporte direto</>} cta="Falar com a gente" />
            </div>
            <div style={{ ...mono(10, 0.16), color: foam(0.4), textAlign: "center" }}>1 GERAÇÃO = {VARIATIONS_PER_CLICK} CRÉDITOS · VOCÊ USOU {creditsUsed} NESTA SESSÃO</div>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  background: "none", border: "none", color: foam(0.6), borderRadius: 999, padding: "8px 13px",
  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif",
};

const closeBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: "50%", background: foam(0.06), border: `1px solid ${foam(0.12)}`,
  color: FOAM, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

// ── Thumbnail do card de estilo: foto de exemplo com fallback pra ícone ──────
function StyleThumb({ styleKey, Icon }: { styleKey: string; Icon: LucideIcon }) {
  const [imgOk, setImgOk] = useState(true);
  if (imgOk) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`/exemplos/${styleKey}.jpg`} alt="" onError={() => setImgOk(false)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    );
  }
  return (
    <div style={{ width: 44, height: 44, borderRadius: 12, background: ember(0.1), border: `1px solid ${ember(0.25)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={18} color={EMBER} />
    </div>
  );
}

// ── Lote de geração (grid + feedback) ────────────────────────────────────────
function BatchBlock({ batch, msgIdx, progressPct, onRetry, onYes, onNo, onFeedbackText, onPrepareRedo, onConfirmRedo, onEditRedo }: {
  batch: Batch;
  msgIdx: number;
  progressPct: (b?: { startedAt: number }) => string;
  onRetry: () => void;
  onYes: () => void;
  onNo: () => void;
  onFeedbackText: (v: string) => void;
  onPrepareRedo: () => void;
  onConfirmRedo: () => void;
  onEditRedo: () => void;
}) {
  const BIcon = batch.style.icon;
  const showFeedback = !batch.loading && !batch.error && batch.images.length > 0 && batch.feedback !== "redone";
  return (
    <div style={{ marginBottom: 40, animation: "riseIn 550ms cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
        <BIcon size={15} color={EMBER} />
        <span style={{ fontSize: 15, fontWeight: 700 }}>{batch.style.label}</span>
        <span style={{ ...mono(9, 0.16), color: foam(0.4), textTransform: "uppercase" }}>{batch.style.sub}</span>
      </div>
      {batch.note && <div style={{ fontSize: 12, color: foam(0.5), fontStyle: "italic", marginBottom: 12 }}>com o seu pedido: “{batch.note}”</div>}
      {batch.review && !batch.loading && batch.images.length > 0 && (
        <div style={{ fontSize: 12, color: "#C28A1E", marginBottom: 10 }}>
          ⚠ Estilo de alta liberdade criativa — confira se o produto saiu fiel. Se mudou, use o “Não” abaixo.
        </div>
      )}

      {batch.error ? (
        <div style={{ padding: "12px 16px", background: "rgba(178,59,46,0.12)", border: "1px solid rgba(178,59,46,0.4)", borderRadius: 14, color: "#E8836F", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span>{batch.error}</span>
          <button onClick={onRetry} style={{ background: "none", border: "1px solid rgba(178,59,46,0.5)", color: "#E8836F", borderRadius: 10, padding: "6px 12px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>Tentar de novo</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginTop: 10 }}>
          {batch.images.map((src, i) => (
            <div key={i} style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${foam(0.1)}`, background: "#14110F", animation: "riseIn 700ms cubic-bezier(0.22,1,0.36,1) both" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${batch.style.label} ${i + 1}`} style={{ width: "100%", display: "block" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "linear-gradient(180deg, rgba(10,9,8,0) 0%, rgba(10,9,8,0.85) 100%)" }}>
                <span style={{ ...mono(9, 0.16), color: foam(0.75) }}>VAR {String(i + 1).padStart(2, "0")}</span>
                <a href={`/api/download?u=${encodeURIComponent(src)}&name=swell-${batch.style.key}-${i + 1}.jpg`}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: foam(0.12), backdropFilter: "blur(8px)", color: FOAM, borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                  <Download size={11} />Baixar
                </a>
              </div>
            </div>
          ))}
          {batch.loading && (
            <div style={{ borderRadius: 16, border: `1px solid ${foam(0.08)}`, aspectRatio: "4 / 5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: `linear-gradient(100deg, ${foam(0.03)} 40%, ${foam(0.08)} 50%, ${foam(0.03)} 60%)`, backgroundSize: "1200px 100%", animation: "shimmer 2.2s linear infinite", position: "relative", overflow: "hidden" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: ember(0.12), display: "flex", alignItems: "center", justifyContent: "center", animation: "breathe 2.4s ease-in-out infinite" }}>
                <Film size={18} color={EMBER} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: foam(0.75) }}>{PROGRESS_MSGS[msgIdx % PROGRESS_MSGS.length]}</div>
              <div style={{ ...mono(9, 0.16), color: foam(0.4) }}>30–60 SEGUNDOS</div>
              <div style={{ position: "absolute", left: 0, bottom: 0, height: 2, background: EMBER, width: progressPct(batch), transition: "width 900ms cubic-bezier(0.22,1,0.36,1)" }} />
            </div>
          )}
        </div>
      )}

      {showFeedback && (
        <div style={{ marginTop: 14, background: "rgba(22,18,15,0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid ${foam(0.09)}`, borderRadius: 14, padding: "16px 18px" }}>
          {!batch.feedback && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Essa geração foi satisfatória para você?</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={onYes} style={fbBtn}><ThumbsUp size={13} />Sim</button>
                <button onClick={onNo} style={fbBtn}><ThumbsDown size={13} />Não</button>
              </div>
            </div>
          )}
          {batch.feedback === "yes" && (
            <div style={{ fontSize: 13, color: EMBER, display: "flex", alignItems: "center", gap: 7 }}><Check size={14} />Que bom! As fotos estão prontas pra baixar.</div>
          )}
          {batch.feedback === "no" && !batch.redo && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>O que faltou? Conta do seu jeito que a gente ajusta.</div>
              <textarea value={batch.feedbackText || ""} onChange={(e) => onFeedbackText(e.target.value)} rows={2}
                placeholder="Ex: fundo mais escuro; produto maior na foto; modelo inteira…"
                style={{ width: "100%", background: foam(0.05), border: `1px solid ${foam(0.12)}`, borderRadius: 10, padding: "11px 13px", color: FOAM, fontSize: 13, resize: "vertical", outline: "none", fontFamily: "'Hanken Grotesk', sans-serif", boxSizing: "border-box", marginBottom: 12 }} />
              {batch.redoError && <div style={{ fontSize: 12, color: "#E8836F", marginBottom: 8 }}>{batch.redoError}</div>}
              <button onClick={onPrepareRedo} disabled={!batch.feedbackText?.trim() || batch.redoPreparing}
                style={{ background: batch.feedbackText?.trim() && !batch.redoPreparing ? EMBER : foam(0.08), color: batch.feedbackText?.trim() && !batch.redoPreparing ? INK : foam(0.5), border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 13, fontWeight: 700, cursor: batch.feedbackText?.trim() && !batch.redoPreparing ? "pointer" : "not-allowed", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                {batch.redoPreparing ? "Entendendo o que faltou…" : "Transformar no prompt →"}
              </button>
            </div>
          )}
          {batch.feedback === "no" && batch.redo && (
            <div>
              <div style={{ fontSize: 12, color: foam(0.5), marginBottom: 8 }}>Entendi as suas considerações assim:</div>
              <div style={{ background: foam(0.05), border: `1px solid ${foam(0.1)}`, borderRadius: 10, padding: "12px 14px", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                {batch.redo.resumoPT || "Considerações incorporadas ao prompt."}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={onConfirmRedo} style={{ flex: 1, minWidth: 220, background: EMBER, border: "none", color: INK, borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                  Confirmar — gerar {VARIATIONS_PER_CLICK} novas tentativas →
                </button>
                <button onClick={onEditRedo} style={{ background: foam(0.05), border: `1px solid ${foam(0.15)}`, color: foam(0.6), borderRadius: 10, padding: "12px 16px", fontSize: 12, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                  Ajustar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const fbBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, background: foam(0.06), border: `1px solid ${foam(0.15)}`,
  color: FOAM, borderRadius: 10, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif",
};

// ── Gaveta lateral (fila / galeria / marca) ──────────────────────────────────
function Drawer({ kicker, title, onClose, children }: { kicker: string; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,9,8,0.5)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", animation: "riseIn 300ms ease both" }} />
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(400px, 92vw)", zIndex: 61, background: "rgba(18,15,13,0.85)", backdropFilter: "blur(30px) saturate(140%)", WebkitBackdropFilter: "blur(30px) saturate(140%)", borderLeft: `1px solid ${foam(0.1)}`, padding: "26px 24px", overflowY: "auto", boxSizing: "border-box", animation: "riseIn 450ms cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ ...mono(10, 0.24), color: foam(0.45), marginBottom: 6 }}>{kicker}</div>
            <div style={{ ...display, fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em" }}>{title}<span style={{ color: EMBER }}>.</span></div>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={15} /></button>
        </div>
        <div style={{ marginTop: 14 }}>{children}</div>
      </aside>
    </>
  );
}

// ── Formulário Minha Marca (dentro da gaveta) ────────────────────────────────
function BrandForm({ brand, onSave }: { brand: BrandProfile; onSave: (b: BrandProfile) => void }) {
  const [draft, setDraft] = useState<BrandProfile>(brand);
  const set = (field: keyof BrandProfile, v: string) => setDraft((d) => ({ ...d, [field]: d[field] === v ? "" : v }));
  const chip = (active: boolean): React.CSSProperties => ({
    padding: "7px 15px", borderRadius: 999, fontSize: 13, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif",
    border: `1px solid ${active ? ember(0.6) : foam(0.15)}`, background: active ? ember(0.12) : foam(0.04),
    color: active ? EMBER : foam(0.65), transition: "all 200ms",
  });
  const label: React.CSSProperties = { ...mono(10, 0.22), color: foam(0.45), marginBottom: 9 };
  return (
    <div>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: foam(0.55), margin: "0 0 24px" }}>
        O que você define aqui guia todas as gerações — tom, clima visual e presença humana.
      </p>
      <label style={{ display: "block", marginBottom: 22 }}>
        <span style={{ display: "block", ...label }}>NOME DA MARCA</span>
        <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Ex: Mar de Dentro"
          style={{ width: "100%", background: foam(0.05), border: `1px solid ${foam(0.12)}`, borderRadius: 12, padding: "12px 14px", color: FOAM, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Hanken Grotesk', sans-serif" }} />
      </label>
      <div style={label}>TOM DA MARCA</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
        {BRAND_TONES.map((t) => <button key={t} onClick={() => set("tone", t)} style={chip(draft.tone === t)}>{t}</button>)}
      </div>
      <div style={label}>CLIMA VISUAL</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
        {BRAND_MOODS.map((m) => <button key={m} onClick={() => set("mood", m)} style={chip(draft.mood === m)}>{m}</button>)}
      </div>
      <div style={label}>PRESENÇA HUMANA</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
        {BRAND_HUMANS.map((h) => <button key={h} onClick={() => set("human", h)} style={chip(draft.human === h)}>{h}</button>)}
      </div>
      <div style={label}>COR PRINCIPAL</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 28 }}>
        <input type="color" value={draft.colorHex || "#E0742F"} onChange={(e) => setDraft((d) => ({ ...d, colorHex: e.target.value }))}
          style={{ width: 44, height: 34, border: `1px solid ${foam(0.15)}`, borderRadius: 10, background: foam(0.05), cursor: "pointer", padding: 2 }} />
        <span style={{ ...mono(12, 0.06), color: foam(0.55) }}>{draft.colorHex || "sem cor definida"}</span>
        {draft.colorHex && (
          <button onClick={() => setDraft((d) => ({ ...d, colorHex: "" }))} style={{ background: "none", border: "none", color: foam(0.45), fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
            remover
          </button>
        )}
      </div>
      <button onClick={() => onSave(draft)} style={{ width: "100%", background: EMBER, border: "none", color: INK, borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
        Salvar minha marca
      </button>
    </div>
  );
}

// ── Card de plano (modal de planos) ──────────────────────────────────────────
function PlanCard({ kicker, price, suffix, desc, cta, featured }: { kicker: string; price: string; suffix?: string; desc: React.ReactNode; cta: string; featured?: boolean }) {
  return (
    <div style={{ border: `1px solid ${featured ? ember(0.5) : foam(0.1)}`, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 10, background: featured ? ember(0.06) : "transparent", position: "relative" }}>
      {featured && (
        <div style={{ position: "absolute", top: -9, left: 16, background: EMBER, color: INK, ...mono(8, 0.18), padding: "3px 9px", borderRadius: 999, fontWeight: 700 }}>MAIS POPULAR</div>
      )}
      <div style={{ ...mono(10, 0.2), color: featured ? EMBER : foam(0.5) }}>{kicker}</div>
      <div style={{ ...display, fontWeight: 800, fontSize: 26 }}>{price}{suffix && <span style={{ fontSize: 13, fontWeight: 600, color: foam(0.5) }}>{suffix}</span>}</div>
      <div style={{ fontSize: 12, color: foam(0.55), lineHeight: 1.6 }}>{desc}</div>
      <button title="Em breve" style={{ marginTop: "auto", background: featured ? EMBER : foam(0.06), border: featured ? "none" : `1px solid ${foam(0.15)}`, color: featured ? INK : FOAM, borderRadius: 10, padding: 10, fontSize: 13, fontWeight: featured ? 700 : 600, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
        {cta}
      </button>
    </div>
  );
}
