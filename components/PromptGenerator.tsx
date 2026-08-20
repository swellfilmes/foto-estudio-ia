"use client";

import { useState, useRef, useEffect } from "react";
import { ProductInfo, PhotoType, ProductCategory } from "@/lib/types";
import { assembleScene, BrandDirection } from "@/lib/scene-blocks";
import {
  ArrowRight, ArrowUp, Camera, Check, Clapperboard, Coffee, Download, Film, Gem, Hand,
  Image as ImageIcon, Layers, LayoutGrid, Lock, LogOut, Plus, Search, Smartphone,
  Sparkles, ThumbsDown, ThumbsUp, User, X, Zap, type LucideIcon,
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

// Ordem do funil Riverflow: identificar → inspecionar → entender → desejar
const STYLES_PRODUCT: StyleOption[] = [
  { key: "fundo-branco", label: "Fundo Branco", sub: "e-commerce · marketplace", icon: ImageIcon, photoType: "fundo-limpo" },
  { key: "detalhe", label: "Detalhe", sub: "close · inspeção", icon: Search, photoType: "macro" },
  { key: "na-mao", label: "Na Mão", sub: "escala real", icon: Hand, photoType: "segurando" },
  { key: "flat-lay", label: "Visto de cima", sub: "flat lay · kit/props", icon: LayoutGrid, photoType: "flat-lay" },
  { key: "lifestyle", label: "Em cena real", sub: "lifestyle · desejo", icon: Coffee, photoType: "lifestyle" },
  { key: "hero", label: "Foto de campanha", sub: "principal · máximo impacto", icon: Sparkles, photoType: "lifestyle" },
  { key: "cg", label: "Visual 3D premium", sub: "render digital", icon: Gem, photoType: "fundo-limpo" },
];

const STYLES_WITH_MODEL: StyleOption[] = [
  { key: "estudio-modelo", label: "No Corpo", sub: "escala real · vestindo", icon: Gem, photoType: "segurando" },
  { key: "mostruario-modelo", label: "Em Uso", sub: "mãos · rotina", icon: Hand, photoType: "segurando" },
  { key: "influencia", label: "Cliente Real", sub: "UGC · como um cliente postaria", icon: Smartphone, photoType: "segurando" },
  { key: "comercial-modelo", label: "Campanha", sub: "modelo · alto impacto", icon: Clapperboard, photoType: "lifestyle" },
];

const VARIATIONS_PER_CLICK = 2;
const MAX_PHOTOS = 6;
const SUGGESTED_MIN_PHOTOS = 3;
const VARIATION_CHOICES = [1, 2, 3, 4, 5];
const ASPECTS: { v: string; label: string }[] = [
  { v: "auto", label: "Auto" },
  { v: "1:1", label: "1:1 · quadrado" },
  { v: "4:5", label: "4:5 · feed" },
  { v: "9:16", label: "9:16 · story" },
  { v: "16:9", label: "16:9 · site" },
];

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

export default function PromptGenerator({ onEnsaio, initialProjectId }: { onEnsaio?: () => void; initialProjectId?: string } = {}) {
  const [phase, setPhase] = useState<Phase>(initialProjectId ? "analyzing" : "upload");
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
  const [historyProjects, setHistoryProjects] = useState<{ id: number; name: string | null; ref_images: string[]; gen_count: number; updated_at: string }[]>([]);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [now, setNow] = useState(0);
  // Controles de geração: quantas fotos por clique e a proporção
  const [variations, setVariations] = useState(VARIATIONS_PER_CLICK);
  const [aspect, setAspect] = useState<string>("auto");
  // Contador REAL de fotos já geradas (persistente — não zera ao trocar de ensaio)
  const [usedTotal, setUsedTotal] = useState(0);
  // Cota do plano (paywall) + popup de upsell
  const [usage, setUsage] = useState<{ email?: string | null; plan: string | null; quota: number | null; used: number; remaining: number | null } | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);

  // ── Projeto (produto salvo = fotos-referência + análise + suas gerações) ──
  const [projectName, setProjectName] = useState<string>("");
  const [projectGens, setProjectGens] = useState<{ id: number; style: string; label: string | null; images: string[]; note: string | null; created_at: string }[]>([]);
  const projectIdRef = useRef<number | null>(null);
  const projectCreateRef = useRef<Promise<number | null> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);
  const batchSeq = useRef(0);
  const photosRef = useRef<Photo[]>([]);
  const productRef = useRef<ProductInfo>(product);
  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => { productRef.current = product; }, [product]);

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

  // Total real de fotos já geradas por esta conta — contador honesto e persistente
  useEffect(() => {
    let alive = true;
    fetch("/api/generations")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const gens = Array.isArray(d.generations) ? d.generations : [];
        setUsedTotal(gens.reduce((n: number, g: { images?: string[] }) => n + (g.images?.length || 0), 0));
      })
      .catch(() => { /* silencioso */ });
    return () => { alive = false; };
  }, []);

  // Cota real do plano (paywall)
  useEffect(() => {
    let alive = true;
    fetch("/api/usage").then((r) => r.json()).then((d) => { if (alive) setUsage(d); }).catch(() => { /* silencioso */ });
    return () => { alive = false; };
  }, []);

  function refreshUsage() {
    fetch("/api/usage").then((r) => r.json()).then(setUsage).catch(() => { /* silencioso */ });
  }

  // Carrega o histórico permanente (por e-mail) quando a Galeria abre
  useEffect(() => {
    if (!galleryOpen) return;
    const t = setTimeout(() => {
      setHistoryLoading(true);
      Promise.all([
        fetch("/api/projects").then((r) => r.json()).catch(() => ({})),
        fetch("/api/generations").then((r) => r.json()).catch(() => ({})),
      ])
        .then(([p, d]) => {
          setHistoryProjects(Array.isArray(p.projects) ? p.projects : []);
          setHistory(Array.isArray(d.generations) ? d.generations : []);
          setHistoryEmail(d.email ?? p.email ?? null);
        })
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

  // Reabrir um projeto: carrega fotos-referência + análise e vai direto pra geração
  useEffect(() => {
    if (!initialProjectId) return;
    let alive = true;
    fetch(`/api/projects?id=${encodeURIComponent(initialProjectId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d?.project) { if (alive) setPhase("upload"); return; }
        projectIdRef.current = d.project.id;
        setProjectName(d.project.name || "");
        setProduct({
          category: d.project.category || "outro",
          name: d.project.name || "",
          color: d.project.color || "",
          material: d.project.material || "",
          size: d.project.size || "",
          hasLabel: false, labelText: "", labelPosition: "",
        });
        const refs: string[] = Array.isArray(d.refsBase64) ? d.refsBase64 : [];
        setPhotos(refs.map((b64) => ({ url: `data:image/jpeg;base64,${b64}`, base64: b64 })));
        setProjectGens(Array.isArray(d.generations) ? d.generations : []);
        setPhase("studio");
        setStage("results");
      })
      .catch(() => { if (alive) setPhase("upload"); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProjectId]);

  // ── Geração ───────────────────────────────────────────────────────────────
  function updateBatch(id: number, patch: Partial<Batch>) {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  // Garante que existe um Projeto pra esta sessão (cria 1x, salvando as referências).
  // É disparado no início da 1ª geração e só resolvido na hora de salvar — não trava a geração.
  function ensureProject(): Promise<number | null> {
    if (projectIdRef.current) return Promise.resolve(projectIdRef.current);
    if (!projectCreateRef.current) {
      const p = productRef.current;
      const refs = photosRef.current.map((ph) => ph.base64);
      projectCreateRef.current = fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: p.name || "", category: p.category, color: p.color, material: p.material, size: p.size,
          refImagesBase64: refs,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          const id = d?.project?.id ?? null;
          if (id) { projectIdRef.current = id; if (!projectName) setProjectName(p.name || ""); }
          return id;
        })
        .catch(() => null);
    }
    return projectCreateRef.current;
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
    // Paywall (pré-checagem): se a cota já zerou, mostra o upsell e nem começa a gerar
    if (usage?.quota != null && (usage.remaining ?? 0) <= 0) { setUpsellOpen(true); return; }
    const id = ++batchSeq.current;
    const asm = assembleScene(style.key, product, 0, brandDirection);
    setBatches((prev) => [...prev, { id, style, images: [], loading: true, note, review: asm.needsReview, isBase, startedAt: Date.now() }]);
    void ensureProject(); // começa a salvar as referências em paralelo (não trava a geração)
    // quantas fotos: o que a pessoa pediu, mas no máximo o que resta da cota
    const count = usage?.quota != null ? Math.min(variations, Math.max(1, usage.remaining ?? variations)) : variations;
    const chosenAspect = aspect;       // proporção escolhida (ou "auto")
    try {
      let prompts: string[];
      if (prebuiltPrompt) {
        prompts = Array(count).fill(prebuiltPrompt);
      } else if (note?.trim()) {
        const built = (await buildPromptRaw(style, note)).promptEN;
        prompts = Array(count).fill(built);
      } else {
        prompts = Array.from({ length: count }, (_, i) => assembleScene(style.key, product, i, brandDirection).promptEN);
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
            aspectRatio: chosenAspect !== "auto" ? chosenAspect : undefined,
          }),
        }).then((r) => r.json())
      );
      const tasks = await Promise.all(reqs);
      const limited = tasks.some((t) => t?.error === "limite_atingido");
      if (limited) { setUpsellOpen(true); refreshUsage(); }
      const taskIds = tasks.map((t) => t?.task_id).filter(Boolean) as string[];
      if (taskIds.length === 0) {
        if (limited) { updateBatch(id, { loading: false, error: "Você atingiu o limite de fotos do seu plano." }); return; }
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
      setUsedTotal((n) => n + collected.length); // contador real e persistente
      refreshUsage(); // atualiza a cota do plano (used/remaining)

      // Salva no histórico permanente por e-mail + linka ao projeto (best-effort, não trava a UI)
      const projectId = await ensureProject();
      fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: style.key, label: style.label, images: collected, note: note || null, projectId }),
      })
        .then((r) => r.json())
        .then((saved) => { if (saved?.generation) setProjectGens((prev) => [saved.generation, ...prev]); })
        .catch(() => { /* histórico é best-effort */ });
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
    setBrandOpen(false);
    setPricingOpen(false);
    setPreparing(false);
    setPrepError(null);
    projectIdRef.current = null;
    projectCreateRef.current = null;
    setProjectName("");
    setProjectGens([]);
    setTimeout(() => { cancelRef.current = false; }, 50);
  }

  const styles = withModel ? STYLES_WITH_MODEL : STYLES_PRODUCT;
  const needMorePhotos = photos.length > 0 && photos.length < SUGGESTED_MIN_PHOTOS;
  const queueCount = batches.filter((b) => b.loading).length;
  const creditsUsed = usedTotal;
  const hasQuota = usage?.quota != null;
  const quotaLow = hasQuota && (usage!.remaining ?? 0) <= 3;
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
        <button onClick={reset} title="Voltar ao início" style={{ ...display, fontSize: 19, letterSpacing: "-0.02em", background: "none", border: "none", color: FOAM, cursor: "pointer", padding: 0 }}>Swell<span style={{ color: EMBER }}>.</span></button>
        <div style={{ ...mono(10, 0.22), color: foam(0.45) }}>FOTO ESTÚDIO IA</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <nav style={{ display: "flex", alignItems: "center", gap: 2, marginRight: 8 }}>
          <button onClick={reset} style={navBtn}>Criar fotos</button>
          <button onClick={() => setGalleryOpen(true)} style={navBtn}>Galeria</button>
          <button onClick={() => setBrandOpen(true)} style={navBtn}>{brand.name ? `● ${brand.name}` : "Minha marca"}</button>
          <button onClick={() => setProfileOpen(true)} style={navBtn}>Conta</button>
        </nav>
        <button
          onClick={() => (quotaLow ? setUpsellOpen(true) : setPricingOpen(true))}
          title="Suas fotos e planos"
          style={{
            display: "flex", alignItems: "center", gap: 9,
            background: quotaLow ? "rgba(178,59,46,0.14)" : ember(0.1),
            border: `1px solid ${quotaLow ? "rgba(178,59,46,0.5)" : ember(0.35)}`,
            color: quotaLow ? "#E8836F" : EMBER, borderRadius: 999, padding: "7px 14px", ...mono(11, 0.12), cursor: "pointer",
          }}
        >
          {hasQuota
            ? `${usage!.remaining} DE ${usage!.quota} FOTOS`
            : `${usedTotal} FOTO${usedTotal === 1 ? "" : "S"} GERADA${usedTotal === 1 ? "" : "S"}`}
        </button>
        <button onClick={() => setProfileOpen(true)} title="Sua conta" style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34,
          border: `1px solid ${foam(0.14)}`, background: foam(0.04), color: foam(0.65), borderRadius: "50%", cursor: "pointer",
        }}>
          <User size={15} />
        </button>
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
                    <span style={{ ...mono(9, 0.2), color: foam(0.7) }}>{projectName ? `PROJETO · ${photos.length} REFERÊNCIA${photos.length > 1 ? "S" : ""}` : `PRODUTO TRAVADO · ${photos.length} REFERÊNCIA${photos.length > 1 ? "S" : ""}`}</span>
                  </div>
                  <div style={{ ...display, fontWeight: 800, fontSize: "clamp(28px, 3.4vw, 44px)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {projectName || product.name || "Seu produto"}
                  </div>
                  <p style={{ fontSize: 14, color: foam(0.55), margin: "10px 0 0" }}>
                    {projectGens.length > 0
                      ? "Você está continuando este projeto — gere mais fotos no mesmo produto, com as referências já travadas."
                      : "Nenhum crédito gasto ainda. Escolha um estilo abaixo — cada geração usa suas fotos só pra travar o produto e cria um cenário novo."}
                  </p>
                </div>
                {queueCount > 0 && (
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button onClick={() => setQueueOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: foam(0.05), border: `1px solid ${foam(0.14)}`, color: FOAM, borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                      <Layers size={14} />Ver a fila<span style={{ ...mono(10), color: EMBER }}>{queueCount}</span>
                    </button>
                  </div>
                )}
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

              {/* Já feitas neste projeto (quando reabre um projeto salvo) */}
              {projectGens.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ ...mono(11, 0.24), color: foam(0.45), marginBottom: 12 }}>
                    JÁ FEITAS NESTE PROJETO · {projectGens.reduce((n, g) => n + g.images.length, 0)}
                  </div>
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
                    {projectGens.flatMap((g) =>
                      g.images.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={`${g.id}-${i}`} src={src} alt="" onClick={() => setLightbox({ src, name: `swell-${g.style}-${i + 1}.jpg` })} title="Ampliar" style={{ flexShrink: 0, width: 92, height: 116, objectFit: "cover", borderRadius: 12, border: `1px solid ${foam(0.1)}`, display: "block", cursor: "zoom-in" }} />
                      ))
                    )}
                  </div>
                </div>
              )}

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
                          <span style={{ fontSize: 11, color: EMBER, whiteSpace: "nowrap" }}>{isSel ? "Selecionado" : "Escolher →"}</span>
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
                        style={{ width: "100%", background: foam(0.05), border: `1px solid ${foam(0.12)}`, borderRadius: 12, padding: "12px 14px", color: FOAM, fontSize: 14, resize: "vertical", outline: "none", fontFamily: "'Hanken Grotesk', sans-serif", boxSizing: "border-box", marginBottom: 16 }} />

                      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
                        <div>
                          <div style={{ ...mono(9, 0.18), color: foam(0.45), marginBottom: 8 }}>QUANTAS FOTOS</div>
                          <div style={{ display: "flex", gap: 7 }}>
                            {VARIATION_CHOICES.map((n) => (
                              <button key={n} onClick={() => setVariations(n)} style={{ ...miniChip(variations === n), minWidth: 42, textAlign: "center" }}>{n}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={{ ...mono(9, 0.18), color: foam(0.45), marginBottom: 8 }}>PROPORÇÃO</div>
                          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                            {ASPECTS.map((a) => (
                              <button key={a.v} onClick={() => setAspect(a.v)} style={miniChip(aspect === a.v)}>{a.label}</button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {hasQuota && (
                        <div style={{ ...mono(10.5, 0.1), color: foam(0.6), marginBottom: 14, display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                          <Zap size={12} color={EMBER} />
                          <span>Esta geração usa <strong style={{ color: FOAM }}>{variations} foto{variations === 1 ? "" : "s"}</strong> · restarão <strong style={{ color: EMBER }}>{Math.max(0, (usage!.remaining ?? 0) - variations)}</strong> de {usage!.quota}</span>
                        </div>
                      )}
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
                        {preparing ? "Entendendo o seu pedido…" : request.trim() ? "Revisar meu pedido" : `Gerar agora · ${variations} foto${variations === 1 ? "" : "s"}`}
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
                          Confirmar — gerar {variations} foto{variations === 1 ? "" : "s"} →
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
                  onEditRedo={() => updateBatch(batch.id, { redo: undefined })}
                  onExpand={(src, name) => setLightbox({ src, name })} />
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
                <div style={{ ...mono(8, 0.16), color: foam(0.4), marginTop: 4 }}>{b.images.length} FOTO{b.images.length === 1 ? "" : "S"}</div>
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
          <a href="/galeria" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: foam(0.05), border: `1px solid ${foam(0.14)}`, color: FOAM, borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 16 }}>
            Abrir galeria completa ↗
          </a>
          <div style={{ ...mono(9, 0.14), color: historyEmail ? foam(0.5) : "#C28A1E", marginBottom: 16, wordBreak: "break-all" }}>
            {historyEmail ? `HISTÓRICO DE ${historyEmail.toUpperCase()}` : "SEM SESSÃO — FAÇA LOGIN DE NOVO PARA VER SEU HISTÓRICO"}
          </div>

          {!historyLoading && historyProjects.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ ...mono(9, 0.2), color: foam(0.45), marginBottom: 10 }}>PROJETOS · ABRIR PRA GERAR MAIS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {historyProjects.map((p) => (
                  <a key={p.id} href={`/studio?project=${p.id}`} style={{ textDecoration: "none", color: "inherit", background: foam(0.03), border: `1px solid ${foam(0.09)}`, borderRadius: 12, overflow: "hidden", display: "block" }}>
                    <div style={{ aspectRatio: "4 / 3", background: "#1B1714", position: "relative" }}>
                      {p.ref_images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.ref_images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      )}
                      <span style={{ position: "absolute", right: 6, top: 6, ...mono(7, 0.12), color: FOAM, background: "rgba(10,9,8,0.65)", borderRadius: 999, padding: "3px 7px" }}>{p.gen_count}</span>
                    </div>
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name || "Produto"}</div>
                      <div style={{ ...mono(8, 0.12), color: EMBER, marginTop: 3 }}>ABRIR ↗</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" onClick={() => setLightbox({ src, name: `swell-${g.style}-${i + 1}.jpg` })} title="Ampliar" style={{ width: 56, height: 70, objectFit: "cover", borderRadius: 8, border: `1px solid ${foam(0.1)}`, display: "block", cursor: "zoom-in" }} />
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

      {profileOpen && (
        <Drawer kicker="SUA CONTA" title="Perfil" onClose={() => setProfileOpen(false)}>
          <ProfilePanel usage={usage} />
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
              <PlanCard kicker="SIMPLES" price="R$ 79,90" suffix="/mês" desc={<>35 fotos por mês<br />foto de produto + ensaio de pessoa</>} cta="Assinar Simples" />
              <PlanCard kicker="MÉDIO" price="R$ 159,90" suffix="/mês" desc={<>80 fotos por mês<br />todos os estilos · fila prioritária</>} cta="Assinar Médio" featured />
              <PlanCard kicker="GRANDE" price="R$ 299,90" suffix="/mês" desc={<>180 fotos por mês<br />direção de arte Swell · suporte direto</>} cta="Assinar Grande" />
            </div>
            <div style={{ ...mono(10, 0.16), color: foam(0.4), textAlign: "center" }}>VOCÊ JÁ GEROU {usedTotal} FOTO{usedTotal === 1 ? "" : "S"} NESTA CONTA</div>
          </div>
        </div>
      )}

      {/* Lightbox — clicar na foto amplia, com botão de baixar */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(6,5,4,0.92)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 4vw, 48px)", gap: 20, animation: "riseIn 250ms ease both" }}>
          <button onClick={() => setLightbox(null)} title="Fechar" style={{ position: "absolute", top: 18, right: 18, ...closeBtn }}><X size={16} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.src} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "min(1100px, 92vw)", maxHeight: "76vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 40px 120px rgba(0,0,0,0.6)" }} />
          <a href={`/api/download?u=${encodeURIComponent(lightbox.src)}&name=${encodeURIComponent(lightbox.name)}`} onClick={(e) => e.stopPropagation()}
            style={{ ...gradientBtn, display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 28px", fontSize: 14, textDecoration: "none" }}>
            <Download size={16} />Baixar foto
          </a>
        </div>
      )}

      {/* Upsell — quando a cota do plano acaba */}
      {upsellOpen && (
        <div onClick={() => setUpsellOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 75, background: "rgba(10,9,8,0.72)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "riseIn 300ms ease both" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(440px, 100%)", background: "rgba(20,17,15,0.96)", border: `1px solid ${ember(0.45)}`, borderRadius: 22, padding: 32, boxShadow: "0 50px 140px rgba(0,0,0,0.7)", textAlign: "center", boxSizing: "border-box" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: ember(0.14), border: `1px solid ${ember(0.4)}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Zap size={24} color={EMBER} />
            </div>
            <div style={{ ...display, fontSize: 25, lineHeight: 1.05, marginBottom: 12 }}>Você usou todas<br />as suas fotos<span style={{ color: EMBER }}>.</span></div>
            <p style={{ fontSize: 14, color: foam(0.6), lineHeight: 1.6, margin: "0 0 24px" }}>
              {usage?.quota != null
                ? `Seu plano inclui ${usage.quota} fotos por mês e você já usou todas. `
                : "Você chegou ao limite do seu teste grátis. "}
              Suba de plano pra continuar gerando agora mesmo.
            </p>
            <button onClick={() => { setUpsellOpen(false); setPricingOpen(true); }} style={{ ...gradientBtn, width: "100%", padding: 15, fontSize: 15, marginBottom: 12 }}>
              Ver planos →
            </button>
            <button onClick={() => setUpsellOpen(false)} style={{ background: "none", border: "none", color: foam(0.5), fontSize: 13, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
              Agora não
            </button>
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

const miniChip = (active: boolean): React.CSSProperties => ({
  padding: "8px 13px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  fontFamily: "'Hanken Grotesk', sans-serif", transition: "all 180ms",
  border: `1px solid ${active ? ember(0.6) : foam(0.14)}`, background: active ? ember(0.12) : foam(0.04),
  color: active ? EMBER : foam(0.7),
});

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
function BatchBlock({ batch, msgIdx, progressPct, onRetry, onYes, onNo, onFeedbackText, onPrepareRedo, onConfirmRedo, onEditRedo, onExpand }: {
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
  onExpand: (src: string, name: string) => void;
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
              <img src={src} alt={`${batch.style.label} ${i + 1}`} onClick={() => onExpand(src, `swell-${batch.style.key}-${i + 1}.jpg`)} title="Ampliar" style={{ width: "100%", display: "block", cursor: "zoom-in" }} />
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
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>O que faltou? Toque num motivo ou escreva do seu jeito.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
                {["O produto mudou", "O rótulo/texto saiu errado", "A cor mudou", "O cenário não ficou bom", "A mão/pessoa ficou estranha", "O enquadramento não funcionou"].map((r) => (
                  <button key={r} onClick={() => onFeedbackText((batch.feedbackText ? batch.feedbackText.trim() + "; " : "") + r)}
                    style={{ background: foam(0.05), border: `1px solid ${foam(0.14)}`, color: foam(0.82), borderRadius: 999, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>{r}</button>
                ))}
              </div>
              <textarea value={batch.feedbackText || ""} onChange={(e) => onFeedbackText(e.target.value)} rows={2}
                placeholder="Ex: fundo mais escuro; produto maior na foto; modelo inteira…"
                style={{ width: "100%", background: foam(0.05), border: `1px solid ${foam(0.12)}`, borderRadius: 10, padding: "11px 13px", color: FOAM, fontSize: 13, resize: "vertical", outline: "none", fontFamily: "'Hanken Grotesk', sans-serif", boxSizing: "border-box", marginBottom: 12 }} />
              {batch.redoError && <div style={{ fontSize: 12, color: "#E8836F", marginBottom: 8 }}>{batch.redoError}</div>}
              <button onClick={onPrepareRedo} disabled={!batch.feedbackText?.trim() || batch.redoPreparing}
                style={{ background: batch.feedbackText?.trim() && !batch.redoPreparing ? EMBER : foam(0.08), color: batch.feedbackText?.trim() && !batch.redoPreparing ? INK : foam(0.5), border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 13, fontWeight: 700, cursor: batch.feedbackText?.trim() && !batch.redoPreparing ? "pointer" : "not-allowed", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                {batch.redoPreparing ? "Entendendo o que faltou…" : "Preparar nova versão →"}
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
                  Confirmar — gerar novas tentativas →
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

// ── Perfil / Conta (gaveta) ──────────────────────────────────────────────────
const PLAN_LABELS: Record<string, string> = { essencial: "Simples", pro: "Médio", marca: "Grande", trial: "Teste grátis", dono: "Acesso de dono" };

function ProfilePanel({ usage }: { usage: { email?: string | null; plan: string | null; quota: number | null; used: number; remaining: number | null } | null }) {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [cancelStep, setCancelStep] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { try { setName(localStorage.getItem("swell-profile-name") || ""); } catch { /* ignora */ } }, 0);
    return () => clearTimeout(t);
  }, []);

  function saveName() {
    try { localStorage.setItem("swell-profile-name", name.trim()); } catch { /* ignora */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const email = usage?.email || "";
  const planLabel = usage?.plan ? (PLAN_LABELS[usage.plan] || usage.plan) : "—";
  // Cancelamento é confirmado pela equipe via Kiwify (mantém acesso até o fim do ciclo).
  // TODO(João): se a Kiwify tiver um link de autoatendimento de cancelamento, trocar o mailto por ele.
  const cancelMailto = `mailto:contato@swellfilmes.com.br?subject=${encodeURIComponent("Cancelamento de plano")}&body=${encodeURIComponent(`Quero cancelar meu plano.\n\nMeu e-mail de acesso: ${email}`)}`;
  const label: React.CSSProperties = { ...mono(10, 0.22), color: foam(0.45), marginBottom: 9 };

  return (
    <div>
      <div style={label}>E-MAIL DA CONTA</div>
      <div style={{ fontSize: 14, color: FOAM, marginBottom: 24, wordBreak: "break-all" }}>{email || "—"}</div>

      <div style={label}>SEU PLANO</div>
      <div style={{ border: `1px solid ${foam(0.1)}`, borderRadius: 14, padding: "14px 16px", marginBottom: 26 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: EMBER }}>{planLabel}</div>
        <div style={{ fontSize: 12, color: foam(0.55), marginTop: 4 }}>
          {usage?.quota != null
            ? `${usage.used}/${usage.quota} fotos usadas este mês`
            : `${usage?.used ?? 0} foto${(usage?.used ?? 0) === 1 ? "" : "s"} geradas`}
        </div>
      </div>

      <div style={label}>SEU NOME</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como quer ser chamada"
        style={{ width: "100%", background: foam(0.05), border: `1px solid ${foam(0.12)}`, borderRadius: 12, padding: "12px 14px", color: FOAM, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Hanken Grotesk', sans-serif", marginBottom: 10 }} />
      <button onClick={saveName} style={{ width: "100%", background: foam(0.06), border: `1px solid ${foam(0.15)}`, color: FOAM, borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif", marginBottom: 28 }}>
        {saved ? "Salvo ✓" : "Salvar nome"}
      </button>

      <div style={{ borderTop: `1px solid ${foam(0.08)}`, paddingTop: 22 }}>
        {!cancelStep ? (
          <button onClick={() => setCancelStep(true)} style={{ width: "100%", background: "none", border: `1px solid ${foam(0.15)}`, color: foam(0.6), borderRadius: 10, padding: 12, fontSize: 13, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
            Cancelar plano
          </button>
        ) : (
          <div style={{ border: "1px solid rgba(178,59,46,0.35)", borderRadius: 12, padding: 16, background: "rgba(178,59,46,0.06)" }}>
            <div style={{ fontSize: 13, color: FOAM, fontWeight: 600, marginBottom: 8 }}>Cancelar seu plano?</div>
            <div style={{ fontSize: 12, color: foam(0.55), lineHeight: 1.65, marginBottom: 14 }}>
              Você continua com acesso até o fim do ciclo já pago. Duas formas:<br /><br />
              <strong style={{ color: foam(0.78) }}>1.</strong> No e-mail <strong style={{ color: foam(0.78) }}>“Pagamento de assinatura aprovado”</strong> da Kiwify, toque em <strong style={{ color: foam(0.78) }}>“Gerenciar assinatura”</strong> e cancele — é na hora, <strong style={{ color: foam(0.78) }}>sem login nem conta</strong>.<br /><br />
              <strong style={{ color: foam(0.78) }}>2.</strong> Perdeu o e-mail? A gente cancela pra você:
            </div>
            <a href={cancelMailto} style={{ display: "block", textAlign: "center", background: "#B23B2E", color: FOAM, borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 700, textDecoration: "none", marginBottom: 8 }}>Solicitar cancelamento</a>
            <button onClick={() => setCancelStep(false)} style={{ width: "100%", background: "none", border: "none", color: foam(0.5), fontSize: 12, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>Voltar</button>
          </div>
        )}
      </div>

      <a href="/api/logout" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20, color: foam(0.5), fontSize: 13, textDecoration: "none" }}>
        <LogOut size={14} /> Sair da conta
      </a>
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
