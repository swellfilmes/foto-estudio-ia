"use client";

import { useState, useRef, useEffect } from "react";
import {
  ProductInfo,
  SceneInfo,
  GeneratedPrompt,
  PhotoType,
  Tool,
  ProductCategory,
} from "@/lib/types";

const PHOTO_TYPES: { value: PhotoType; label: string; desc: string }[] = [
  { value: "fundo-limpo", label: "Fundo limpo", desc: "E-commerce, Shopee, Mercado Livre" },
  { value: "lifestyle", label: "Lifestyle / Em cena", desc: "Feed Instagram, anúncios" },
  { value: "segurando", label: "Segurando / Vestindo", desc: "Mão com produto, roupa em uso" },
  { value: "flat-lay", label: "Flat lay / De cima", desc: "Vista superior com props" },
  { value: "macro", label: "Macro / Detalhe", desc: "Textura, material, close" },
  { value: "ghost-mannequin", label: "Ghost mannequin", desc: "Roupa sem modelo visível" },
];

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
  category: "cosmetico",
  name: "",
  color: "",
  material: "",
  size: "",
  hasLabel: false,
  labelText: "",
  labelPosition: "",
};

const defaultScene: SceneInfo = {
  photoType: "fundo-limpo",
  tool: "nano-banana",
  scene: "",
  background: "",
  lightMood: "",
};

function CopyButton({ text, fullWidth }: { text: string; fullWidth?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        background: copied ? "#166534" : "var(--accent)",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: fullWidth ? "12px 16px" : "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "background 0.2s",
        width: fullWidth ? "100%" : undefined,
        marginTop: fullWidth ? 12 : undefined,
      }}
    >
      {copied ? "Copiado ✓" : "Copiar prompt"}
    </button>
  );
}

export default function PromptGenerator() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [product, setProduct] = useState<ProductInfo>(defaultProduct);
  const [scene, setScene] = useState<SceneInfo>(defaultScene);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imageProgress, setImageProgress] = useState<string>("Enviando para geração...");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  // Suporte a colar imagem (Cmd+V / Ctrl+V)
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (step !== 1) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) analyzeImage(file);
          break;
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const updateProduct = (field: keyof ProductInfo, value: string | boolean) => {
    setProduct((p) => ({ ...p, [field]: value }));
  };
  const updateScene = (field: keyof SceneInfo, value: string) => {
    setScene((s) => ({ ...s, [field]: value }));
  };

  // Redimensiona e converte para base64 via canvas (funciona com imagens grandes)
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

  async function analyzeImage(file: File) {
    setAnalyzing(true);
    setAnalyzed(false);
    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
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
      setAnalyzed(true);
    } catch (e) {
      console.error("Erro análise:", e);
      setError("Não foi possível analisar a imagem. Preencha os campos manualmente.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function generateImages(prompt: string) {
    cancelRef.current = false;
    setGeneratingImages(true);
    setImageProgress("Enviando para geração...");
    setStep(4);
    try {
      const requests = Array.from({ length: 4 }, () =>
        fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, referenceImageBase64: referenceBase64, photoType: scene.photoType }),
        }).then(r => r.json())
      );
      const tasks = await Promise.all(requests);
      const taskIds = tasks.map(t => t?.task_id).filter(Boolean) as string[];
      if (taskIds.length === 0) throw new Error("Nenhuma tarefa criada — verifique os créditos Magnific");

      setImageProgress(`Gerando ${taskIds.length} fotos... aguarde 30–60s`);

      const images: string[] = [...generatedImages];
      const pending = new Set(taskIds);
      let attempts = 0;
      while (pending.size > 0 && attempts < 60) {
        if (cancelRef.current) break;
        await new Promise(r => setTimeout(r, 3000));
        attempts++;
        for (const taskId of Array.from(pending)) {
          if (cancelRef.current) break;
          const res = await fetch(`/api/image-status?taskId=${taskId}`);
          const data = await res.json();
          if (data?.status === "COMPLETED") {
            const urls: string[] = data?.generated || [];
            images.push(...urls);
            pending.delete(taskId);
            setGeneratedImages([...images]);
            setImageProgress(
              pending.size > 0
                ? `${images.length} foto(s) prontas — aguardando ${pending.size} restante(s)...`
                : "Tudo pronto!"
            );
          } else if (data?.status === "FAILED") {
            pending.delete(taskId);
          }
        }
      }
      if (!cancelRef.current && images.length === 0) throw new Error("Nenhuma imagem gerada");
    } catch (e) {
      if (!cancelRef.current) {
        console.error("Erro geração:", e);
        setError(e instanceof Error ? e.message : "Erro ao gerar imagens.");
        setStep(3);
      }
    } finally {
      setGeneratingImages(false);
    }
  }

  function resetAll() {
    cancelRef.current = true;
    setStep(1);
    setResult(null);
    setProduct(defaultProduct);
    setScene(defaultScene);
    setPreviewUrl(null);
    setReferenceBase64(null);
    setAnalyzed(false);
    setGeneratedImages([]);
    setError(null);
  }

  const canProceed1 = product.name.trim() && product.color.trim() && product.material.trim();
  const canProceed2 = scene.photoType && scene.tool;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, scene }),
      });
      if (!res.ok) throw new Error("Erro na geração");
      const data = await res.json();
      setResult(data);
      setStep(3);
    } catch {
      setError("Não foi possível gerar o prompt. Verifique a chave da API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
          Swell Filmes
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Foto Estúdio IA
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Foto de celular → prompt de estúdio em segundos
        </p>
      </div>

      {/* Steps indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            style={{
              height: 3,
              flex: 1,
              borderRadius: 2,
              background: step >= s ? "var(--accent)" : "var(--border)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>

      {/* STEP 1 — Produto */}
      {step === 1 && (
        <div>
          <SectionTitle step={1} title="Seu produto" />

          {/* Upload de foto */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              Foto do produto <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opcional — IA preenche os campos automaticamente)</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) analyzeImage(file);
              }}
              style={{
                border: `2px dashed ${previewUrl ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 10,
                padding: previewUrl ? 0 : "28px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.2s",
                overflow: "hidden",
                position: "relative",
                background: previewUrl ? "transparent" : "var(--surface2)",
              }}
            >
              {previewUrl ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={previewUrl}
                    alt="Produto"
                    style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: analyzing ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s",
                  }}>
                    {analyzing && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, marginBottom: 8 }}>🔍</div>
                        <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>Analisando produto...</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Preenchendo os campos</div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setProduct(defaultProduct); setAnalyzed(false); }}
                    style={{
                      position: "absolute", top: 8, right: 8,
                      background: "rgba(0,0,0,0.7)", border: "none", color: "#fff",
                      borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer",
                    }}
                  >
                    Trocar foto
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                    {analyzing ? "Analisando..." : "Cole, arraste ou clique para enviar"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Cmd+V · arraste · ou clique — a IA preenche os campos automaticamente
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) analyzeImage(file);
              }}
            />
            {analyzed && !analyzing && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#4ade80", fontWeight: 600 }}>
                ✓ Campos preenchidos — revise e ajuste se necessário
              </div>
            )}
          </div>

          <Field label="Categoria">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.value}
                  selected={product.category === c.value}
                  onClick={() => updateProduct("category", c.value)}
                  label={c.label}
                />
              ))}
            </div>
          </Field>

          <Field label="Descreva o produto" hint="Ex: garrafa de azeite 250ml, vidro verde escuro">
            <Input
              value={product.name}
              onChange={(v) => updateProduct("name", v)}
              placeholder="Tipo + descrição básica"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Cor" hint="Seja específico: não 'azul', mas 'azul marinho quase preto'">
              <Input
                value={product.color}
                onChange={(v) => updateProduct("color", v)}
                placeholder="Ex: terracota queimado"
              />
            </Field>
            <Field label="Material">
              <Input
                value={product.material}
                onChange={(v) => updateProduct("material", v)}
                placeholder="Ex: vidro fosco, algodão, cerâmica"
              />
            </Field>
          </div>

          <Field label="Tamanho aproximado" hint="Opcional mas ajuda">
            <Input
              value={product.size}
              onChange={(v) => updateProduct("size", v)}
              placeholder="Ex: 250ml, cabe numa mão, 35cm de largura"
            />
          </Field>

          <Field label="Tem rótulo, logo ou estampa?">
            <div style={{ display: "flex", gap: 8 }}>
              <Chip selected={product.hasLabel} onClick={() => updateProduct("hasLabel", true)} label="Sim" />
              <Chip selected={!product.hasLabel} onClick={() => updateProduct("hasLabel", false)} label="Não" />
            </div>
          </Field>

          {product.hasLabel && (
            <>
              <Field label="Texto/logo do rótulo" hint="O que está escrito ou desenhado">
                <Input
                  value={product.labelText}
                  onChange={(v) => updateProduct("labelText", v)}
                  placeholder="Ex: 'Mel do Vale' escrito à mão, logo oval dourado"
                />
              </Field>
              <Field label="Onde fica o rótulo">
                <Input
                  value={product.labelPosition}
                  onChange={(v) => updateProduct("labelPosition", v)}
                  placeholder="Ex: frente, centralizado, terço superior da garrafa"
                />
              </Field>
            </>
          )}

          <NavButton disabled={!canProceed1} onClick={() => setStep(2)}>
            Próximo →
          </NavButton>
        </div>
      )}

      {/* STEP 2 — Foto */}
      {step === 2 && (
        <div>
          <SectionTitle step={2} title="Tipo de foto" />

          <Field label="Qual tipo de foto você quer?">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PHOTO_TYPES.map((pt) => (
                <PhotoTypeOption
                  key={pt.value}
                  selected={scene.photoType === pt.value}
                  onClick={() => updateScene("photoType", pt.value)}
                  label={pt.label}
                  desc={pt.desc}
                />
              ))}
            </div>
          </Field>

          <Field label="Qual ferramenta vai usar?">
            <div style={{ display: "flex", gap: 8 }}>
              <ToolOption
                selected={scene.tool === "chatgpt"}
                onClick={() => updateScene("tool", "chatgpt")}
                label="ChatGPT"
                desc="Gratuito · ótimo para cena e lifestyle"
              />
              <ToolOption
                selected={scene.tool === "nano-banana"}
                onClick={() => updateScene("tool", "nano-banana")}
                label="Nano Banana"
                desc="Magnific · fidelidade superior de rótulo"
              />
            </div>
          </Field>

          <Field label="Descreva a cena (opcional)" hint="Onde está o produto, quais objetos ao redor">
            <textarea
              value={scene.scene}
              onChange={(e) => updateScene("scene", e.target.value)}
              placeholder="Ex: mesa de mármore branco, toalha de linho dobrada à esquerda, gotículas de água na superfície, luz de manhã pela janela"
              rows={3}
              style={{
                width: "100%",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 12px",
                color: "var(--text)",
                fontSize: 14,
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Fundo / Background">
              <Input
                value={scene.background}
                onChange={(v) => updateScene("background", v)}
                placeholder="Ex: branco, cinza claro, madeira"
              />
            </Field>
            <Field label="Clima / Atmosfera">
              <Input
                value={scene.lightMood}
                onChange={(v) => updateScene("lightMood", v)}
                placeholder="Ex: clean, aconchegante, minimalista"
              />
            </Field>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            <button
              onClick={() => { setStep(1); setError(null); }}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "12px 20px", fontSize: 14, cursor: "pointer" }}
            >
              ← Voltar
            </button>
            <NavButton disabled={!canProceed2 || loading} onClick={generate} style={{ flex: 1 }}>
              {loading ? "Gerando..." : "Gerar prompt →"}
            </NavButton>
          </div>

          {error && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — Resultado */}
      {step === 3 && result && (
        <div>
          <SectionTitle step={3} title="Prompt pronto" />

          {/* Prompt — colapsado com fade, botão copiar em destaque */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>
                {scene.tool === "chatgpt" ? "Prompt gerado" : "Prompt gerado"}
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <p style={{
                fontSize: 13, lineHeight: 1.7, color: "var(--text)", whiteSpace: "pre-wrap",
                fontFamily: "monospace", maxHeight: 80, overflow: "hidden",
                maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
              }}>
                {result.promptEN}
              </p>
            </div>
            <CopyButton text={result.promptEN} fullWidth />
          </div>

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <div style={{ background: "#1c1500", border: "1px solid #5c3d00", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f59e0b", marginBottom: 8 }}>
                Atenção
              </div>
              {result.warnings.map((w, i) => (
                <p key={i} style={{ fontSize: 13, color: "#fcd34d", marginBottom: i < result.warnings.length - 1 ? 6 : 0 }}>
                  • {w}
                </p>
              ))}
            </div>
          )}

          {/* Instruções — só para ChatGPT (usuário que vai usar manualmente) */}
          {scene.tool === "chatgpt" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
                Como usar no ChatGPT
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text)", whiteSpace: "pre-wrap" }}>
                {result.instructionsPT}
              </p>
              {result.toolTips && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12, lineHeight: 1.7, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  {result.toolTips}
                </p>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginBottom: 16, padding: "12px 16px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Ação principal: Nano Banana gera automaticamente */}
          {scene.tool === "nano-banana" ? (
            <button
              onClick={() => generateImages(result.promptEN)}
              style={{
                width: "100%", background: "var(--accent)",
                border: "none", color: "#fff", borderRadius: 8, padding: "15px",
                fontSize: 15, cursor: "pointer", fontWeight: 700, marginBottom: 10,
              }}
            >
              Gerar fotos agora →
            </button>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginBottom: 16, padding: "10px", background: "var(--surface2)", borderRadius: 8 }}>
              Copiou o prompt? Cole no ChatGPT junto com a foto do produto.
            </div>
          )}

          <button
            onClick={resetAll}
            style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "12px", fontSize: 14, cursor: "pointer" }}
          >
            Novo produto
          </button>
        </div>
      )}

      {/* STEP 4 — Imagens geradas */}
      {step === 4 && (
        <div>
          <SectionTitle step={4} title="Imagens geradas" />

          {generatingImages && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>🍌</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                Gerando suas fotos...
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{imageProgress}</div>
              {generatedImages.length > 0 && (
                <div style={{ marginTop: 24, fontSize: 12, color: "#4ade80" }}>
                  {generatedImages.length} imagem(ns) prontas enquanto aguarda as demais
                </div>
              )}
            </div>
          )}

          {generatedImages.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {generatedImages.map((url, i) => (
                <div key={i} style={{ borderRadius: 8, overflow: "hidden", position: "relative", background: "var(--surface2)" }}>
                  <img src={url} alt={`Gerada ${i + 1}`} style={{ width: "100%", display: "block" }} />
                  <a
                    href={url}
                    download={`foto-estudio-${i + 1}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      position: "absolute", bottom: 8, right: 8,
                      background: "rgba(0,0,0,0.75)", color: "#fff",
                      borderRadius: 6, padding: "5px 10px", fontSize: 11,
                      fontWeight: 600, textDecoration: "none",
                    }}
                  >
                    Baixar
                  </a>
                </div>
              ))}
            </div>
          )}

          {!generatingImages && (
            <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
              <button
                onClick={() => result && generateImages(result.promptEN)}
                style={{ width: "100%", background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "13px", fontSize: 14, cursor: "pointer", fontWeight: 700 }}
              >
                + 4 novas variações
              </button>
              <button
                onClick={() => setStep(3)}
                style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "12px", fontSize: 14, cursor: "pointer" }}
              >
                ← Ver prompt
              </button>
              <button
                onClick={() => { setStep(1); setResult(null); setProduct(defaultProduct); setScene(defaultScene); setPreviewUrl(null); setAnalyzed(false); setGeneratedImages([]); }}
                style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "12px", fontSize: 14, cursor: "pointer" }}
              >
                Novo produto
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Small components ──────────────────────────────────────────────────────────

function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Passo {step} de 4
      </span>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{title}</h2>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: hint ? 2 : 8 }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>{hint}</p>}
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
      style={{
        width: "100%",
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "10px 12px",
        color: "var(--text)",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function Chip({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: selected ? 600 : 400,
        cursor: "pointer",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        background: selected ? "rgba(200,121,65,0.15)" : "var(--surface2)",
        color: selected ? "var(--accent)" : "var(--text-muted)",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function PhotoTypeOption({ selected, onClick, label, desc }: { selected: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 8,
        cursor: "pointer",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        background: selected ? "rgba(200,121,65,0.1)" : "var(--surface2)",
        textAlign: "left",
        transition: "all 0.15s",
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`,
          background: selected ? "var(--accent)" : "transparent",
          flexShrink: 0,
          transition: "all 0.15s",
        }}
      />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: selected ? "var(--text)" : "var(--text-muted)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{desc}</div>
      </div>
    </button>
  );
}

function ToolOption({ selected, onClick, label, desc }: { selected: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "14px 16px",
        borderRadius: 8,
        cursor: "pointer",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        background: selected ? "rgba(200,121,65,0.1)" : "var(--surface2)",
        textAlign: "center",
        transition: "all 0.15s",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: selected ? "var(--accent)" : "var(--text-muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
    </button>
  );
}

function NavButton({ children, disabled, onClick, style }: { children: React.ReactNode; disabled?: boolean; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "var(--surface2)" : "var(--accent)",
        color: disabled ? "var(--text-muted)" : "#fff",
        border: "none",
        borderRadius: 8,
        padding: "13px 24px",
        fontSize: 14,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s",
        marginTop: 8,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
