"use client";

import { useState, useRef, useEffect } from "react";
import {
  ApparelInfo,
  ApparelSceneInfo,
  ApparelStyle,
  ApparelCategory,
  APPAREL_STYLES,
  APPAREL_CATEGORIES,
  STYLE_STRENGTH_MATRIX,
  isCombinationRecommended,
  getStyleStrength,
} from "@/lib/apparel-engine";

interface GeneratedApparelPrompt {
  promptEN: string;
  negativeEN: string;
  instructionsPT: string;
  toolTips: string;
  warnings: string[];
}

const defaultInfo: ApparelInfo = {
  garmentType: "",
  fit: "",
  color: "",
  fabric: "",
  print: "",
  details: "",
  blocks: "",
  notes: "",
};

const defaultScene: ApparelSceneInfo = {
  style: "realista",
  category: "model-studio",
  scene: "",
  colorHex: "",
  modelProfile: "",
};

function CopyButton({ text, fullWidth, label }: { text: string; fullWidth?: boolean; label?: string }) {
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
        width: fullWidth ? "100%" : undefined,
        marginTop: fullWidth ? 10 : undefined,
      }}
    >
      {copied ? "Copiado ✓" : label || "Copiar"}
    </button>
  );
}

export default function ApparelStudio({ onBack }: { onBack?: () => void } = {}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [info, setInfo] = useState<ApparelInfo>(defaultInfo);
  const [scene, setScene] = useState<ApparelSceneInfo>(defaultScene);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedApparelPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imageProgress, setImageProgress] = useState<string>("Enviando para geração...");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

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

  function updateInfo(field: keyof ApparelInfo, value: string) {
    setInfo((p) => ({ ...p, [field]: value }));
  }
  function updateScene<K extends keyof ApparelSceneInfo>(field: K, value: ApparelSceneInfo[K]) {
    setScene((p) => ({ ...p, [field]: value }));
  }

  function resizeAndConvert(file: File): Promise<{ base64: string; mediaType: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const c = document.createElement("canvas");
        c.width = width; c.height = height;
        c.getContext("2d")!.drawImage(img, 0, 0, width, height);
        const dataUrl = c.toDataURL("image/jpeg", 0.85);
        resolve({ base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
      };
      img.onerror = reject;
      img.src = url;
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
      const res = await fetch("/api/analyze-apparel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro na análise");
      setInfo({
        garmentType: data.garmentType || "",
        fit: data.fit || "",
        color: data.color || "",
        fabric: data.fabric || "",
        print: data.print || "",
        details: data.details || "",
        blocks: data.blocks || "",
        notes: data.notes || "",
      });
      setAnalyzed(true);
    } catch (e) {
      console.error("Erro análise apparel:", e);
      setError("Não foi possível analisar a peça. Preencha os campos manualmente.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      if (!isCombinationRecommended(scene.category, scene.style)) {
        throw new Error(`Categoria "${scene.category}" não é compatível com estilo "${scene.style}". Troque para "realista".`);
      }
      const res = await fetch("/api/generate-apparel-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ info, scene }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro");
      setResult(data);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível gerar o prompt.");
    } finally {
      setLoading(false);
    }
  }

  async function generateImages(prompt: string, negative: string) {
    cancelRef.current = false;
    setGeneratingImages(true);
    setImageProgress("Enviando para geração...");
    setStep(4);
    try {
      const strength = getStyleStrength(scene.category, scene.style);
      const requests = Array.from({ length: 4 }, () =>
        fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            referenceImageBase64: referenceBase64,
            photoType: scene.category,
            negativePrompt: negative,
            styleStrength: strength,
          }),
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
          const r = await fetch(`/api/image-status?taskId=${taskId}`);
          const d = await r.json();
          if (d?.status === "COMPLETED") {
            const urls: string[] = d?.generated || [];
            images.push(...urls);
            pending.delete(taskId);
            setGeneratedImages([...images]);
            setImageProgress(
              pending.size > 0
                ? `${images.length} foto(s) prontas — aguardando ${pending.size} restante(s)...`
                : "Tudo pronto!"
            );
          } else if (d?.status === "FAILED") {
            pending.delete(taskId);
          }
        }
      }
      if (!cancelRef.current && images.length === 0) throw new Error("Nenhuma imagem gerada");
    } catch (e) {
      if (!cancelRef.current) {
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
    setInfo(defaultInfo);
    setScene(defaultScene);
    setPreviewUrl(null);
    setReferenceBase64(null);
    setAnalyzed(false);
    setGeneratedImages([]);
    setError(null);
  }

  const canProceed1 = info.garmentType.trim() && info.color.trim() && info.fabric.trim();
  const canProceed2 = isCombinationRecommended(scene.category, scene.style);
  const currentCat = APPAREL_CATEGORIES.find(c => c.value === scene.category)!;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 12 }}
          >
            ← Trocar modo
          </button>
        )}
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
          Swell · Modo Pessoas / Roupa
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Ensaio humanizado
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Peça de roupa → estúdio, ghost mannequin, modelo, lifestyle, UGC ou editorial
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            style={{
              height: 3, flex: 1, borderRadius: 2,
              background: step >= s ? "var(--accent)" : "var(--border)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>

      {/* STEP 1 — Peça */}
      {step === 1 && (
        <div>
          <SectionTitle step={1} title="A peça" />

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              Foto da peça <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opcional — IA extrai os detalhes)</span>
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
                overflow: "hidden",
                position: "relative",
                background: previewUrl ? "transparent" : "var(--surface2)",
              }}
            >
              {previewUrl ? (
                <div style={{ position: "relative" }}>
                  <img src={previewUrl} alt="Peça" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: analyzing ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {analyzing && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, marginBottom: 8 }}>🔍</div>
                        <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>Extraindo detalhes da peça...</div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setInfo(defaultInfo); setAnalyzed(false); }}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}
                  >
                    Trocar foto
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>👕</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                    {analyzing ? "Analisando..." : "Cole, arraste ou clique para enviar"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Foto da peça sozinha (plana ou em cabide) funciona melhor
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
                ✓ Campos preenchidos — revise abaixo
              </div>
            )}
            {error && (
              <div style={{ marginTop: 8, padding: "10px 12px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>

          <Field label="Tipo da peça" hint="Ex: camiseta cropped babylook, moletom oversized, vestido midi de linho">
            <Input value={info.garmentType} onChange={(v) => updateInfo("garmentType", v)} placeholder="Categoria + descrição básica" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Corte / comprimento" hint="Com medida se for crítico">
              <Input value={info.fit} onChange={(v) => updateInfo("fit", v)} placeholder="Ex: cropped, barra ~10cm da axila" />
            </Field>
            <Field label="Cor" hint="Tom + hex se souber">
              <Input value={info.color} onChange={(v) => updateInfo("color", v)} placeholder="Ex: off-white creme #F2ECE0" />
            </Field>
          </div>

          <Field label="Tecido / material">
            <Input value={info.fabric} onChange={(v) => updateInfo("fabric", v)} placeholder="Ex: malha 100% algodão penteado" />
          </Field>

          <Field label="Estampa / print" hint="Deixe vazio se não tiver">
            <Input value={info.print} onChange={(v) => updateInfo("print", v)} placeholder="Ex: estampa peito ~12cm, letras SWELL em preto" />
          </Field>

          <Field label="Detalhes construtivos" hint="Ribana, gola, punho, botão, zíper, bolso">
            <Input value={info.details} onChange={(v) => updateInfo("details", v)} placeholder="Ex: gola careca com ribana fina" />
          </Field>

          <Field label="Logos de terceiros a bloquear" hint="Se aparece marca alheia na foto de referência">
            <Input value={info.blocks} onChange={(v) => updateInfo("blocks", v)} placeholder="Ex: logo Nike no lado esquerdo" />
          </Field>

          <NavButton disabled={!canProceed1} onClick={() => setStep(2)}>Próximo →</NavButton>
        </div>
      )}

      {/* STEP 2 — Estilo + Categoria */}
      {step === 2 && (
        <div>
          <SectionTitle step={2} title="Estilo e categoria" />

          <Field label="Estilo visual">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {APPAREL_STYLES.map((s) => (
                <RadioCard
                  key={s.value}
                  selected={scene.style === s.value}
                  onClick={() => updateScene("style", s.value)}
                  label={s.label}
                  desc={s.desc}
                />
              ))}
            </div>
          </Field>

          <Field label="Categoria da foto">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {APPAREL_CATEGORIES.map((c) => {
                const compat = isCombinationRecommended(c.value, scene.style);
                return (
                  <CategoryOption
                    key={c.value}
                    selected={scene.category === c.value}
                    onClick={() => compat && updateScene("category", c.value)}
                    label={c.label}
                    desc={c.desc}
                    hasPerson={c.hasPerson}
                    disabled={!compat}
                    strengthRange={STYLE_STRENGTH_MATRIX[c.value][scene.style]}
                  />
                );
              })}
            </div>
            {!canProceed2 && (
              <div style={{ marginTop: 10, padding: "10px 12px", background: "#1c1500", border: "1px solid #5c3d00", borderRadius: 8, color: "#fcd34d", fontSize: 12 }}>
                Essa combinação de estilo × categoria não é recomendada. Escolha outra categoria ou volte e mude o estilo.
              </div>
            )}
          </Field>

          {currentCat.hasPerson && (
            <Field label="Perfil do modelo" hint="Represente o seu público real — gênero, idade, tom de pele">
              <Input
                value={scene.modelProfile}
                onChange={(v) => updateScene("modelProfile", v)}
                placeholder="Ex: mulher 28 anos, pele parda, cabelo cacheado ombro"
              />
            </Field>
          )}

          <Field label="Cena / contexto (opcional)" hint="Local, mood, hora do dia">
            <textarea
              value={scene.scene}
              onChange={(e) => updateScene("scene", e.target.value)}
              placeholder={
                scene.category === "model-lifestyle"
                  ? "Ex: café de esquina em São Paulo, mesa de mármore, xícara vazia, luz de fim de tarde"
                  : scene.category === "campaign-editorial"
                  ? "Ex: fundo azul cobalto liso, headroom grande no topo pra receber logo depois"
                  : "Ex: fundo cinza claro, luz suave lateral"
              }
              rows={3}
              style={textareaStyle}
            />
          </Field>

          <Field label="Cor hex (opcional)" hint="Se o fundo for a cor da marca">
            <Input value={scene.colorHex} onChange={(v) => updateScene("colorHex", v)} placeholder="Ex: #0F3B82" />
          </Field>

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

      {/* STEP 3 — Prompt pronto */}
      {step === 3 && result && (
        <div>
          <SectionTitle step={3} title="Prompt pronto" />

          {/* Prompt principal */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>
                Prompt (EN)
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Style Strength: {getStyleStrength(scene.category, scene.style)}
              </span>
            </div>
            <p style={{
              fontSize: 13, lineHeight: 1.7, color: "var(--text)", whiteSpace: "pre-wrap",
              fontFamily: "monospace", maxHeight: 80, overflow: "hidden",
              maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
            }}>
              {result.promptEN}
            </p>
            <CopyButton text={result.promptEN} fullWidth label="Copiar prompt" />
          </div>

          {/* Negative */}
          {result.negativeEN && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Negative (EN)
                </span>
                <CopyButton text={result.negativeEN} label="Copiar" />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "monospace" }}>
                {result.negativeEN}
              </p>
            </div>
          )}

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <div style={{ background: "#1c1500", border: "1px solid #5c3d00", borderRadius: 10, padding: 16, marginBottom: 16 }}>
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

          {/* Instruções */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
              Como usar
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

          {error && (
            <div style={{ marginBottom: 16, padding: "12px 16px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            onClick={() => generateImages(result.promptEN, result.negativeEN || "")}
            style={{ width: "100%", background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "15px", fontSize: 15, cursor: "pointer", fontWeight: 700, marginBottom: 10 }}
          >
            Gerar 4 fotos agora →
          </button>

          <button
            onClick={resetAll}
            style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "12px", fontSize: 14, cursor: "pointer" }}
          >
            Nova peça
          </button>
        </div>
      )}

      {/* STEP 4 — Imagens */}
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
                  {generatedImages.length} imagem(ns) prontas
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
                    download={`swell-apparel-${i + 1}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.75)", color: "#fff", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, textDecoration: "none" }}
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
                onClick={() => result && generateImages(result.promptEN, result.negativeEN || "")}
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
                onClick={resetAll}
                style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "12px", fontSize: 14, cursor: "pointer" }}
              >
                Nova peça
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── UI helpers ────────────────────────────────────────────────────────────────

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

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 12px",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: "inherit",
  resize: "vertical",
};

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
  );
}

function RadioCard({ selected, onClick, label, desc }: { selected: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "14px 16px",
        borderRadius: 8,
        cursor: "pointer",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        background: selected ? "rgba(200,121,65,0.1)" : "var(--surface2)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: selected ? "var(--accent)" : "var(--text-muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
    </button>
  );
}

function CategoryOption({ selected, onClick, label, desc, hasPerson, disabled, strengthRange }: {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc: string;
  hasPerson: boolean;
  disabled: boolean;
  strengthRange: [number, number] | null;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        background: selected ? "rgba(200,121,65,0.1)" : "var(--surface2)",
        textAlign: "left",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div
        style={{
          width: 14, height: 14, borderRadius: "50%",
          border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`,
          background: selected ? "var(--accent)" : "transparent",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: selected ? "var(--text)" : "var(--text-muted)" }}>
          {label} {hasPerson && <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, marginLeft: 6 }}>· com pessoa</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{desc}</div>
      </div>
      {strengthRange ? (
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
          SS {strengthRange[0]}–{strengthRange[1]}
        </div>
      ) : (
        <div style={{ fontSize: 10, color: "#f59e0b", fontFamily: "monospace" }}>n/a</div>
      )}
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
        marginTop: 8,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
