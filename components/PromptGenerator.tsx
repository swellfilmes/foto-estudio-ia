"use client";

import { useState, useRef, useEffect } from "react";
import { track as vaTrack } from "@vercel/analytics";
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
interface BrandProfile { name: string; tone: string; mood: string; human: string; colorHex: string; logo?: string; palette?: string[]; forbidden?: string; scenario?: string }
const emptyBrand: BrandProfile = { name: "", tone: "", mood: "", human: "", colorHex: "", logo: "", palette: [], forbidden: "", scenario: "" };
const BRAND_STORAGE_KEY = "swell-brand";
const BRAND_TONES = ["Minimalista", "Premium", "Acolhedor", "Vibrante", "Natural"];
const BRAND_MOODS = ["Clean", "Quente", "Escuro", "Colorido"];
const BRAND_HUMANS = ["Sem pessoas", "Só detalhes (mãos)", "Com modelo"];
const BRAND_SCENARIOS = ["Fundo claro e natural", "Fundo escuro premium", "Cena de casa / lifestyle", "Estúdio clean", "Externa / natureza"];

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

export default function PromptGenerator({ initialProjectId, initialLoggedIn }: { initialProjectId?: string; initialLoggedIn?: boolean } = {}) {
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
  const [advancedOpen, setAdvancedOpen] = useState(false); // #10 — categoria/cor/material recolhidos
  // Contador REAL de fotos já geradas (persistente — não zera ao trocar de ensaio)
  const [usedTotal, setUsedTotal] = useState(0);
  // Cota do plano (paywall) + popup de upsell
  const [usage, setUsage] = useState<{ email?: string | null; plan: string | null; quota: number | null; used: number; remaining: number | null } | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // Porta de entrada: quem NÃO está logado vê a mesma tela do estúdio; o login é
  // um modal que aparece ao tentar gerar, abrir Conta ou "Criar minha marca".
  // Em produção quem chega no /studio já tem sessão (proxy) → começa logado.
  // No modo teste (sandbox/preview) começa DESLOGADO, pra demonstrar o login.
  // O servidor (StudioPage) já sabe se há sessão válida e manda em initialLoggedIn —
  // sem piscar a tela. Deslogado vê o estúdio e o login vira modal.
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn ?? true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginStep, setLoginStep] = useState<"email" | "code">("email");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginToken, setLoginToken] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [lightbox, setLightbox] = useState<{ items: { src: string; name: string }[]; index: number } | null>(null);
  const [compare, setCompare] = useState<string | null>(null); // #6 comparar resultado × referência
  // "Adicionar": pedir algo em cima de uma foto que já saiu, sem começar do zero
  const [addTarget, setAddTarget] = useState<{ batchId: number; src: string; index: number } | null>(null);
  const [addText, setAddText] = useState("");
  const [gallerySearch, setGallerySearch] = useState(""); // busca na galeria
  const firstGenRef = useRef(false); // dispara o evento first_generation uma vez por sessão
  // #3 — baixar todas as fotos da sessão de uma vez
  const downloadAll = () => {
    const items = batches.flatMap((b) => b.images.map((s, i) => ({ src: s, name: `swell-${b.style.key}-${i + 1}.jpg` })));
    items.forEach((it, k) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = `/api/download?u=${encodeURIComponent(it.src)}&name=${encodeURIComponent(it.name)}`;
        a.download = it.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, k * 350);
    });
  };
  const renameProject = (id: number, current: string | null) => {
    const input = window.prompt("Novo nome do projeto:", current || "");
    if (input == null) return;
    const n = input.trim();
    if (!n) return;
    setHistoryProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: n } : p)));
    fetch(`/api/projects?id=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n }) }).catch(() => {});
  };

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

  function closeLogin() {
    setLoginOpen(false); setLoginStep("email"); setLoginCode(""); setLoginToken(""); setLoginErr(""); setLoginBusy(false);
  }

  // Passo 1: manda um código de 6 dígitos pro e-mail (garante que é válido e da pessoa).
  // "exists" = e-mail já cadastrado (teste esgotado) → empurra pro plano.
  async function doOtpRequest() {
    const email = loginEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setLoginErr("Digite um e-mail válido."); return; }
    setLoginErr(""); setLoginBusy(true);
    try {
      const r = await fetch("/api/otp/request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "studio" }),
      });
      const data = await r.json().catch(() => ({}));
      setLoginBusy(false);
      if (data?.status === "exists") { setLoginErr("Esse e-mail já foi cadastrado. Pra continuar, escolha um plano."); return; }
      if (!r.ok || data?.status !== "sent") { setLoginErr(typeof data?.error === "string" ? data.error : "Não deu certo. Tenta de novo."); return; }
      setLoginToken(data.token || ""); setLoginCode(""); setLoginErr(""); setLoginStep("code");
    } catch { setLoginBusy(false); setLoginErr("Sem conexão. Tenta de novo."); }
  }

  // Passo 2: confere o código e entra.
  async function doOtpVerify() {
    const code = loginCode.trim();
    if (!/^\d{6}$/.test(code)) { setLoginErr("Digite os 6 dígitos do código."); return; }
    setLoginErr(""); setLoginBusy(true);
    try {
      const r = await fetch("/api/otp/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: loginToken, code }),
      });
      const data = await r.json().catch(() => ({}));
      setLoginBusy(false);
      if (data?.status === "exists") { setLoginErr("Esse e-mail já foi cadastrado. Escolha um plano."); return; }
      if (!r.ok || data?.status !== "ok") { setLoginErr(typeof data?.error === "string" ? data.error : "Código incorreto."); return; }
      vaTrack("signup_complete", { plan: "trial" });
      setLoggedIn(true); refreshUsage(); closeLogin();
    } catch { setLoginBusy(false); setLoginErr("Sem conexão. Tenta de novo."); }
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

  const hasBrand = brand.tone || brand.colorHex || brand.mood || brand.human || (brand.palette && brand.palette.length) || brand.scenario || brand.forbidden;
  const brandDirection: BrandDirection | undefined = hasBrand
    ? {
        tone: brand.tone || undefined, colorHex: brand.colorHex || undefined, mood: brand.mood || undefined, human: brand.human || undefined,
        palette: brand.palette && brand.palette.length ? brand.palette : undefined, scenario: brand.scenario || undefined, forbidden: brand.forbidden || undefined,
      }
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

  // continuarDe = URL de uma foto JÁ GERADA. Quando vem preenchido, esta geração não
  // monta uma cena nova: ela mantém a cena da foto e aplica só o pedido ("Adicionar").
  async function generateStyle(style: StyleOption, note?: string, prebuiltPrompt?: string, isBase = false, continuarDe?: string) {
    // Paywall (pré-checagem): se a cota já zerou, mostra o upsell e nem começa a gerar
    if (usage?.quota != null && (usage.remaining ?? 0) <= 0) { setUpsellOpen(true); return; }
    if (!firstGenRef.current) { firstGenRef.current = true; vaTrack("first_generation", { style: style.key }); }
    const id = ++batchSeq.current;
    const asm = assembleScene(style.key, product, 0, brandDirection);
    setBatches((prev) => [...prev, { id, style, images: [], loading: true, note, review: asm.needsReview, isBase, startedAt: Date.now() }]);
    void ensureProject(); // começa a salvar as referências em paralelo (não trava a geração)
    // quantas fotos: o que a pessoa pediu, mas no máximo o que resta da cota
    const count = continuarDe
      ? 1 // ajuste em cima de uma foto existente: sempre 1 por vez
      : usage?.quota != null ? Math.min(variations, Math.max(1, usage.remaining ?? variations)) : variations;
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
            ...(continuarDe
              ? { referenceImageUrls: [continuarDe], keepScene: true }
              : {
                  referenceImagesBase64: refs,
                  photoType: style.photoType,
                  negativePrompt: asm.negative,
                  styleStrength: asm.styleStrength,
                }),
            aspectRatio: chosenAspect !== "auto" ? chosenAspect : undefined,
          }),
        }).then((r) => r.json())
      );
      const tasks = await Promise.all(reqs);
      if (tasks.some((t) => t?.error === "sem_sessao")) {
        updateBatch(id, { loading: false, error: "Sua sessão expirou. Entre com seu e-mail para continuar gerando." });
        return;
      }
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

  // "Adicionar" — continua em cima de uma foto já gerada, tipo conversa:
  // "coloca uma folha ao lado", "deixa o fundo mais escuro", "tira a sombra da direita".
  // A cena é preservada; o pedido entra por cima. Custa 1 foto da cota, como qualquer geração.
  async function adicionarNaFoto() {
    const alvo = addTarget;
    const pedido = addText.trim();
    if (!alvo || !pedido) return;
    if (usage?.quota != null && (usage.remaining ?? 0) <= 0) { setAddTarget(null); setUpsellOpen(true); return; }
    const base = batches.find((b) => b.id === alvo.batchId);
    const style = base?.style ?? styles[0];
    setAddTarget(null);
    setAddText("");

    // Traduz/estrutura o pedido em inglês. Se o serviço falhar, manda o texto cru —
    // é pior, mas nunca deixa a pessoa sem resposta.
    let promptEN = `Keep the reference image exactly as it is. Apply only this change: ${pedido}`;
    try {
      const r = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basePrompt: "Keep the scene of the reference image exactly as it is — same composition, framing, lighting, colour and background.",
          clientRequest: pedido,
        }),
      });
      const d = await r.json();
      if (d?.promptEN) promptEN = d.promptEN;
    } catch { /* segue com o texto cru */ }

    void generateStyle(style, pedido, promptEN, false, alvo.src);
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
        <div style={{ fontSize: 14, fontWeight: 700, color: withModel ? EMBER : FOAM }}>Mostrar uma pessoa (modelo)?</div>
        <div style={{ fontSize: 12, color: foam(0.5) }}>Rosto e corpo. (Só a mão, pra dar escala, já está no estilo “Na Mão” abaixo.)</div>
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
          <button onClick={() => (loggedIn ? setGalleryOpen(true) : setLoginOpen(true))} style={navBtn}>Galeria</button>
          <a href="/marca" title="Configure sua marca — logo, paleta, cenário e o que nunca deve aparecer"
            onClick={(e) => { if (!loggedIn) { e.preventDefault(); setLoginOpen(true); } }}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", background: ember(0.14), border: `1px solid ${ember(0.5)}`, color: EMBER, borderRadius: 999, padding: "8px 15px", fontSize: 13, fontWeight: 700, fontFamily: "'Hanken Grotesk', sans-serif" }}>
            <Sparkles size={13} />{loggedIn && brand.name ? brand.name : "Criar minha marca"}
          </a>
          <button onClick={() => (loggedIn ? setProfileOpen(true) : setLoginOpen(true))} style={navBtn}>Conta</button>
        </nav>
        <button
          onClick={() => (!loggedIn ? setLoginOpen(true) : quotaLow ? setUpsellOpen(true) : setPricingOpen(true))}
          title={loggedIn ? "Suas fotos e planos" : "Entrar"}
          style={{
            display: "flex", alignItems: "center", gap: 9,
            background: quotaLow ? "rgba(178,59,46,0.14)" : ember(0.1),
            border: `1px solid ${quotaLow ? "rgba(178,59,46,0.5)" : ember(0.35)}`,
            color: quotaLow ? "#E8836F" : EMBER, borderRadius: 999, padding: "7px 14px", ...mono(11, 0.12), cursor: "pointer",
          }}
        >
          {!loggedIn
            ? "ENTRAR"
            : hasQuota
              ? `${Math.round(((usage!.remaining ?? 0) / (usage!.quota || 1)) * 100)}%`
              : `${usedTotal} FOTO${usedTotal === 1 ? "" : "S"} GERADA${usedTotal === 1 ? "" : "S"}`}
        </button>
        <button onClick={() => (loggedIn ? setProfileOpen(true) : setLoginOpen(true))} title="Sua conta" style={{
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
            onClick={() => (loggedIn ? fileInputRef.current?.click() : setLoginOpen(true))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (!loggedIn) { setLoginOpen(true); return; } addFiles(Array.from(e.dataTransfer.files)); }}
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

                  {/* #5 — Detalhes que não podem mudar (EDITÁVEL) */}
                  <div style={{ marginTop: 18, border: `1px solid ${ember(0.3)}`, background: ember(0.05), borderRadius: 14, padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 13 }}>
                      <Lock size={13} color={EMBER} />
                      <span style={{ ...mono(9, 0.18), color: EMBER }}>DETALHES QUE NÃO PODEM MUDAR</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                      {([["Rótulo / texto", "labelText", "Ex.: Wella Invigo"], ["Cor", "color", "Ex.: laranja salmão"], ["Material", "material", "Ex.: plástico"], ["Formato", "size", "Ex.: 1 litro"]] as const).map(([label, field, ph]) => (
                        <label key={field} style={{ display: "block" }}>
                          <span style={{ display: "block", ...mono(8, 0.14), color: foam(0.5), marginBottom: 6 }}>{label.toUpperCase()}</span>
                          <input value={(product[field] as string) || ""} onChange={(e) => setProduct((p) => ({ ...p, [field]: e.target.value }))} placeholder={ph}
                            style={{ width: "100%", background: foam(0.06), border: `1px solid ${foam(0.14)}`, borderRadius: 9, padding: "9px 11px", color: FOAM, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Hanken Grotesk', sans-serif" }} />
                        </label>
                      ))}
                    </div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.5, color: foam(0.5), marginTop: 12 }}>A gente preserva isto fiel à sua foto. Confira e corrija aqui se algo estiver errado antes de gerar.</div>
                  </div>
                </div>

                <div style={{ padding: "clamp(24px, 3vw, 36px)" }}>
                  <button onClick={() => setAdvancedOpen((o) => !o)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 12, background: foam(0.03), border: `1px solid ${foam(0.1)}`, borderRadius: 12, padding: "13px 16px", cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif", marginBottom: advancedOpen ? 22 : 0 }}>
                    <span style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: FOAM }}>Ajustes avançados</span>
                      <span style={{ fontSize: 12, color: foam(0.5) }}>Categoria, cor e material — já preenchidos pela análise. Mexa só se quiser.</span>
                    </span>
                    <span style={{ color: EMBER, fontSize: 22, lineHeight: 1 }}>{advancedOpen ? "−" : "+"}</span>
                  </button>
                  {advancedOpen && (<>
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
                  </>)}

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
                  <button onClick={() => setStage("category")} title="Voltar pra corrigir categoria, cor, material e os detalhes"
                    style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: `1px solid ${foam(0.16)}`, color: foam(0.72), borderRadius: 10, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                    ← Ajustar produto e detalhes
                  </button>
                  {batches.reduce((n, b) => n + b.images.length, 0) > 0 && (
                    <button onClick={downloadAll} title="Baixar todas as fotos desta sessão"
                      style={{ marginTop: 14, marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 7, background: foam(0.05), border: `1px solid ${foam(0.16)}`, color: FOAM, borderRadius: 10, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                      <Download size={14} />Baixar todas ({batches.reduce((n, b) => n + b.images.length, 0)})
                    </button>
                  )}
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
                        <img key={`${g.id}-${i}`} src={src} alt="" onClick={() => setLightbox({ items: g.images.map((s, k) => ({ src: s, name: `swell-${g.style}-${k + 1}.jpg` })), index: i })} title="Ampliar" style={{ flexShrink: 0, width: 92, height: 116, objectFit: "cover", borderRadius: 12, border: `1px solid ${foam(0.1)}`, display: "block", cursor: "zoom-in" }} />
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
                  onCompare={(src) => setCompare(src)}
                  onAdd={(src, index) => { setAddText(""); setAddTarget({ batchId: batch.id, src, index }); }}
                  onExpand={(src) => {
                    const items = batches.flatMap((b) => b.images.map((s, i) => ({ src: s, name: `swell-${b.style.key}-${i + 1}.jpg` })));
                    const idx = items.findIndex((it) => it.src === src);
                    setLightbox({ items, index: idx < 0 ? 0 : idx });
                  }} />
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

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: foam(0.04), border: `1px solid ${foam(0.12)}`, borderRadius: 10, padding: "9px 12px", marginBottom: 16 }}>
            <Search size={14} color={foam(0.5)} />
            <input value={gallerySearch} onChange={(e) => setGallerySearch(e.target.value)} placeholder="Buscar por produto ou estilo…"
              style={{ flex: 1, background: "none", border: "none", color: FOAM, fontSize: 13, outline: "none", fontFamily: "'Hanken Grotesk', sans-serif", minWidth: 0 }} />
            {gallerySearch && <button onClick={() => setGallerySearch("")} title="Limpar" style={{ background: "none", border: "none", color: foam(0.5), cursor: "pointer", padding: 0, lineHeight: 0 }}><X size={13} /></button>}
          </div>

          {!historyLoading && historyProjects.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ ...mono(9, 0.2), color: foam(0.45), marginBottom: 10 }}>PROJETOS · ABRIR PRA GERAR MAIS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {historyProjects.filter((p) => !gallerySearch.trim() || (p.name || "").toLowerCase().includes(gallerySearch.trim().toLowerCase())).map((p) => {
                  const openP = () => { window.location.href = `/studio?project=${p.id}`; };
                  return (
                  <div key={p.id} style={{ background: foam(0.03), border: `1px solid ${foam(0.09)}`, borderRadius: 12, overflow: "hidden" }}>
                    <div onClick={openP} title="Abrir projeto" style={{ aspectRatio: "4 / 3", background: "#1B1714", position: "relative", cursor: "pointer" }}>
                      {p.ref_images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.ref_images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      )}
                      <span style={{ position: "absolute", right: 6, top: 6, ...mono(7, 0.12), color: FOAM, background: "rgba(10,9,8,0.65)", borderRadius: 999, padding: "3px 7px" }}>{p.gen_count}</span>
                    </div>
                    <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                      <div onClick={openP} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name || "Produto"}</div>
                        <div style={{ ...mono(8, 0.12), color: EMBER, marginTop: 3 }}>ABRIR ↗</div>
                      </div>
                      <button onClick={() => renameProject(p.id, p.name)} title="Renomear projeto"
                        style={{ flex: "none", background: foam(0.06), border: `1px solid ${foam(0.12)}`, color: foam(0.6), borderRadius: 8, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {historyLoading && (
            <div style={{ fontSize: 13, color: foam(0.45), textAlign: "center", padding: "30px 0" }}>Carregando seu histórico…</div>
          )}
          {!historyLoading && history.length === 0 && historyEmail && (
            <div style={{ fontSize: 13, color: foam(0.45), textAlign: "center", padding: "30px 0" }}>Nada por aqui ainda — tudo que você gerar fica salvo aqui, pra sempre.</div>
          )}
          {!historyLoading && history.filter((g) => !gallerySearch.trim() || (g.label || g.style || "").toLowerCase().includes(gallerySearch.trim().toLowerCase())).map((g) => (
            <div key={g.id} style={{ marginBottom: 22, background: foam(0.03), border: `1px solid ${foam(0.08)}`, borderRadius: 14, padding: 14 }}>
              <div style={{ ...mono(9, 0.18), color: foam(0.4), marginBottom: 6 }}>{formatWhen(g.created_at)}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{g.label || g.style}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {g.images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" onClick={() => setLightbox({ items: g.images.map((s, k) => ({ src: s, name: `swell-${g.style}-${k + 1}.jpg` })), index: i })} title="Ampliar" style={{ width: 56, height: 70, objectFit: "cover", borderRadius: 8, border: `1px solid ${foam(0.1)}`, display: "block", cursor: "zoom-in" }} />
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

      {/* ── FAZER LOGIN (mock no preview) — depois de entrar, segue na geração ── */}
      {loginOpen && (
        <div onClick={closeLogin} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(6,5,4,0.82)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "riseIn 320ms ease both" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(420px, 100%)", background: "rgba(20,17,15,0.94)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", border: `1px solid ${foam(0.12)}`, borderRadius: 22, padding: 28, boxShadow: "0 50px 140px rgba(0,0,0,0.7)", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ ...mono(10, 0.24), color: foam(0.45), marginBottom: 8 }}>ENTRAR</div>
                <div style={{ ...display, fontSize: 26, lineHeight: 1 }}>{loginStep === "email" ? "Comece agora" : "Confirme o código"}<span style={{ color: EMBER }}>.</span></div>
                <div style={{ fontSize: 13, color: foam(0.5), marginTop: 8 }}>
                  {loginStep === "email" ? "Seu e-mail — a gente manda um código de 6 dígitos." : <>Enviamos um código pra <strong style={{ color: FOAM }}>{loginEmail.trim()}</strong>.</>}
                </div>
              </div>
              <button onClick={closeLogin} style={closeBtn}><X size={15} /></button>
            </div>

            {loginStep === "email" ? (
              <form onSubmit={(e) => { e.preventDefault(); doOtpRequest(); }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); if (loginErr) setLoginErr(""); }} type="email" inputMode="email" autoComplete="email" placeholder="seu@email.com" aria-label="e-mail" autoFocus
                  style={{ width: "100%", background: foam(0.06), border: `1px solid ${loginErr ? "rgba(232,131,111,0.7)" : foam(0.16)}`, borderRadius: 12, padding: "14px 16px", color: FOAM, fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 16, outline: "none", textAlign: "center", boxSizing: "border-box" }} />
                <button type="submit" disabled={loginBusy} style={{ ...gradientBtn, width: "100%", padding: "15px", fontSize: 15, opacity: loginBusy ? 0.7 : 1, cursor: loginBusy ? "default" : "pointer" }}>{loginBusy ? "Enviando…" : "Enviar código"}</button>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); doOtpVerify(); }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={loginCode} onChange={(e) => { setLoginCode(e.target.value.replace(/\D/g, "").slice(0, 6)); if (loginErr) setLoginErr(""); }} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" aria-label="código" autoFocus maxLength={6}
                  style={{ width: "100%", background: foam(0.06), border: `1px solid ${loginErr ? "rgba(232,131,111,0.7)" : foam(0.16)}`, borderRadius: 12, padding: "14px 16px", color: FOAM, fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, letterSpacing: "0.34em", outline: "none", textAlign: "center", boxSizing: "border-box" }} />
                <button type="submit" disabled={loginBusy} style={{ ...gradientBtn, width: "100%", padding: "15px", fontSize: 15, opacity: loginBusy ? 0.7 : 1, cursor: loginBusy ? "default" : "pointer" }}>{loginBusy ? "Entrando…" : "Entrar"}</button>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <button type="button" onClick={() => { setLoginStep("email"); setLoginErr(""); setLoginCode(""); }} style={{ background: "none", border: "none", color: foam(0.5), fontSize: 12.5, cursor: "pointer", padding: 0 }}>← trocar e-mail</button>
                  <button type="button" onClick={doOtpRequest} disabled={loginBusy} style={{ background: "none", border: "none", color: EMBER, fontSize: 12.5, cursor: loginBusy ? "default" : "pointer", padding: 0 }}>reenviar código</button>
                </div>
              </form>
            )}
            {loginErr && <div style={{ color: "#E8836F", fontSize: 13, lineHeight: 1.45, textAlign: "center" }}>{loginErr}</div>}
            <div style={{ fontSize: 10.5, lineHeight: 1.5, color: foam(0.3), textAlign: "center" }}>Ao continuar, você concorda com os Termos e a Política de Privacidade.</div>
          </div>
        </div>
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
      {lightbox && (() => {
        const cur = lightbox.items[lightbox.index];
        const many = lightbox.items.length > 1;
        const go = (d: number) => setLightbox((lb) => (lb ? { ...lb, index: (lb.index + d + lb.items.length) % lb.items.length } : lb));
        const navBtn: React.CSSProperties = { position: "absolute", top: "50%", transform: "translateY(-50%)", width: 46, height: 46, borderRadius: "50%", background: "rgba(10,9,8,0.6)", backdropFilter: "blur(6px)", border: `1px solid ${foam(0.18)}`, color: FOAM, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 };
        return (
          <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(6,5,4,0.92)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 4vw, 48px)", gap: 16, animation: "riseIn 250ms ease both" }}>
            <button onClick={() => setLightbox(null)} title="Fechar" style={{ position: "absolute", top: 18, right: 18, ...closeBtn }}><X size={16} /></button>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "min(1100px, 92vw)" }}>
              {many && (
                <button onClick={(e) => { e.stopPropagation(); go(-1); }} title="Anterior" style={{ ...navBtn, left: 6 }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cur.src} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "74vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 40px 120px rgba(0,0,0,0.6)" }} />
              {many && (
                <button onClick={(e) => { e.stopPropagation(); go(1); }} title="Próximo" style={{ ...navBtn, right: 6 }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}
            </div>
            {many && <div style={{ ...mono(10, 0.18), color: foam(0.6) }}>{lightbox.index + 1} / {lightbox.items.length}</div>}
            <a href={`/api/download?u=${encodeURIComponent(cur.src)}&name=${encodeURIComponent(cur.name)}`} onClick={(e) => e.stopPropagation()}
              style={{ ...gradientBtn, display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 28px", fontSize: 14, textDecoration: "none" }}>
              <Download size={16} />Baixar foto
            </a>
          </div>
        );
      })()}

      {/* #6 — Comparar: sua foto × resultado gerado, lado a lado */}
      {/* "Adicionar" — pede algo em cima de uma foto que já saiu */}
      {addTarget && (
        <div onClick={() => setAddTarget(null)} style={{ position: "fixed", inset: 0, zIndex: 82, background: "rgba(6,5,4,0.92)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 4vw, 40px)", animation: "riseIn 250ms ease both" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "rgba(22,18,15,0.92)", border: `1px solid ${ember(0.35)}`, borderRadius: 20, padding: "clamp(20px, 3vw, 30px)", width: "min(760px, 96vw)", boxShadow: "0 30px 90px rgba(0,0,0,0.55)" }}>
            <button onClick={() => setAddTarget(null)} title="Fechar" style={{ position: "absolute", top: 18, right: 18, ...closeBtn }}><X size={16} /></button>
            <div style={{ ...mono(10, 0.22), color: EMBER, marginBottom: 16 }}>ADICIONAR NESTA FOTO</div>
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={addTarget.src} alt="" style={{ width: "min(220px, 40vw)", borderRadius: 12, border: `1px solid ${foam(0.14)}`, display: "block" }} />
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontSize: 13, color: foam(0.6), lineHeight: 1.55, marginBottom: 12 }}>
                  A cena continua igual — mesma luz, mesmo fundo, mesmo enquadramento. Escreva só o que muda.
                </div>
                <textarea
                  value={addText}
                  onChange={(e) => setAddText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void adicionarNaFoto(); }}
                  autoFocus
                  placeholder="Ex.: coloca uma folha de eucalipto encostada na base — ou — tira a sombra da direita"
                  style={{ width: "100%", minHeight: 96, background: foam(0.05), border: `1px solid ${foam(0.14)}`, borderRadius: 12, color: FOAM, padding: "12px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", resize: "vertical", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                  <span style={{ ...mono(9, 0.16), color: foam(0.4) }}>CUSTA 1 FOTO DA SUA COTA</span>
                  <button
                    onClick={() => void adicionarNaFoto()}
                    disabled={!addText.trim()}
                    style={{ background: addText.trim() ? EMBER : foam(0.12), color: addText.trim() ? "#0A0908" : foam(0.35), border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: addText.trim() ? "pointer" : "default", fontFamily: "'Hanken Grotesk', sans-serif" }}
                  >
                    Gerar ajuste
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {compare && (
        <div onClick={() => setCompare(null)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(6,5,4,0.94)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 4vw, 48px)", gap: 18, animation: "riseIn 250ms ease both" }}>
          <button onClick={() => setCompare(null)} title="Fechar" style={{ position: "absolute", top: 18, right: 18, ...closeBtn }}><X size={16} /></button>
          <div style={{ ...mono(10, 0.22), color: EMBER }}>CONFIRA A FIDELIDADE</div>
          <div style={{ display: "flex", gap: "clamp(10px, 2vw, 20px)", alignItems: "center", justifyContent: "center", flexWrap: "wrap", maxWidth: "96vw" }}>
            <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[0]?.url} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "min(440px, 42vw)", maxHeight: "64vh", objectFit: "contain", borderRadius: 10, border: `1px solid ${foam(0.14)}` }} />
              <figcaption style={{ ...mono(9, 0.16), color: foam(0.6) }}>SUA FOTO</figcaption>
            </figure>
            <ArrowRight size={22} color={EMBER} style={{ flex: "none" }} />
            <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={compare} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "min(440px, 42vw)", maxHeight: "64vh", objectFit: "contain", borderRadius: 10, border: `1px solid ${ember(0.5)}`, boxShadow: "0 0 60px rgba(224,116,47,0.15)" }} />
              <figcaption style={{ ...mono(9, 0.16), color: EMBER }}>GERADA NO SWELL</figcaption>
            </figure>
          </div>
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
function BatchBlock({ batch, msgIdx, progressPct, onRetry, onYes, onNo, onFeedbackText, onPrepareRedo, onConfirmRedo, onEditRedo, onCompare, onExpand, onAdd }: {
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
  onCompare: (src: string) => void;
  onExpand: (src: string, name: string) => void;
  onAdd: (src: string, index: number) => void;
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
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => onAdd(src, i)} title="Pedir algo a mais nesta foto"
                    style={{ display: "flex", alignItems: "center", gap: 5, background: ember(0.9), color: "#0A0908", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                    + Adicionar
                  </button>
                  <button onClick={() => onCompare(src)} title="Comparar com sua foto"
                    style={{ display: "flex", alignItems: "center", gap: 5, background: foam(0.12), backdropFilter: "blur(8px)", color: FOAM, borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                    ⇆ Comparar
                  </button>
                  <a href={`/api/download?u=${encodeURIComponent(src)}&name=swell-${batch.style.key}-${i + 1}.jpg`}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: foam(0.12), backdropFilter: "blur(8px)", color: FOAM, borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                    <Download size={11} />Baixar
                  </a>
                </div>
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
  const [newColor, setNewColor] = useState("#E0742F");
  const set = (field: keyof BrandProfile, v: string) => setDraft((d) => ({ ...d, [field]: d[field] === v ? "" : v }));
  const addColor = (hex: string) => setDraft((d) => ({ ...d, palette: [...(d.palette || []), hex].slice(0, 6) }));
  const removeColor = (i: number) => setDraft((d) => ({ ...d, palette: (d.palette || []).filter((_, k) => k !== i) }));
  const onLogo = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setDraft((d) => ({ ...d, logo: String(r.result) }));
    r.readAsDataURL(file);
  };
  const chip = (active: boolean): React.CSSProperties => ({
    padding: "7px 15px", borderRadius: 999, fontSize: 13, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif",
    border: `1px solid ${active ? ember(0.6) : foam(0.15)}`, background: active ? ember(0.12) : foam(0.04),
    color: active ? EMBER : foam(0.65), transition: "all 200ms",
  });
  const label: React.CSSProperties = { ...mono(10, 0.22), color: foam(0.45), marginBottom: 9 };
  const field: React.CSSProperties = { width: "100%", background: foam(0.05), border: `1px solid ${foam(0.12)}`, borderRadius: 12, padding: "12px 14px", color: FOAM, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Hanken Grotesk', sans-serif" };
  return (
    <div>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: foam(0.55), margin: "0 0 24px" }}>
        Isto guia todas as gerações — pra sua marca ficar <strong style={{ color: FOAM }}>consistente</strong>: logo, paleta, cenário e o que <strong style={{ color: FOAM }}>nunca</strong> deve aparecer.
      </p>

      <label style={{ display: "block", marginBottom: 22 }}>
        <span style={{ display: "block", ...label }}>NOME DA MARCA</span>
        <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Ex: Mar de Dentro" style={field} />
      </label>

      {/* LOGO */}
      <div style={label}>LOGO DA MARCA</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: 14, border: `1px solid ${foam(0.14)}`, background: draft.logo ? "#0A0908" : foam(0.04), display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flex: "none" }}>
          {draft.logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={draft.logo} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            : <ImageIcon size={22} color={foam(0.3)} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ ...chip(false), display: "inline-flex", alignItems: "center", gap: 7 }}>
            <ArrowUp size={13} />{draft.logo ? "Trocar logo" : "Enviar logo"}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: "none" }} onChange={(e) => { onLogo(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          {draft.logo && <button onClick={() => setDraft((d) => ({ ...d, logo: "" }))} style={{ background: "none", border: "none", color: foam(0.45), fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: 0, textAlign: "left" }}>remover</button>}
          <span style={{ fontSize: 11, color: foam(0.4) }}>PNG com fundo transparente fica melhor.</span>
        </div>
      </div>

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

      {/* PALETA */}
      <div style={label}>PALETA DA MARCA</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
        {(draft.palette || []).map((c, i) => (
          <button key={i} onClick={() => removeColor(i)} title="Remover cor"
            style={{ width: 34, height: 34, borderRadius: 9, background: c, border: `1px solid ${foam(0.2)}`, cursor: "pointer", position: "relative", padding: 0 }}>
            <span style={{ position: "absolute", top: -6, right: -6, width: 15, height: 15, borderRadius: "50%", background: "#0A0908", color: FOAM, border: `1px solid ${foam(0.25)}`, fontSize: 9, lineHeight: "13px" }}>×</span>
          </button>
        ))}
        {(draft.palette || []).length < 6 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
              style={{ width: 34, height: 34, border: `1px dashed ${foam(0.25)}`, borderRadius: 9, background: foam(0.04), cursor: "pointer", padding: 2 }} />
            <button onClick={() => addColor(newColor)} style={{ ...chip(false), padding: "6px 12px" }}>+ Adicionar</button>
          </span>
        )}
      </div>
      <span style={{ display: "block", fontSize: 11, color: foam(0.4), marginBottom: 24 }}>Até 6 cores. A gente evita cores fora da sua paleta nas fotos.</span>

      {/* CENÁRIO */}
      <div style={label}>CENÁRIO PREFERIDO</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {BRAND_SCENARIOS.map((s) => <button key={s} onClick={() => set("scenario", s)} style={chip(draft.scenario === s)}>{s}</button>)}
      </div>

      {/* ELEMENTOS PROIBIDOS */}
      <div style={label}>O QUE NUNCA DEVE APARECER</div>
      <textarea value={draft.forbidden || ""} onChange={(e) => setDraft((d) => ({ ...d, forbidden: e.target.value }))} rows={2}
        placeholder="Ex: sem plástico brilhante, sem fundo vermelho, sem texto na foto, sem pessoas…"
        style={{ ...field, resize: "vertical", marginBottom: 28 }} />

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
