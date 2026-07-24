"use client";

import { useState, useRef, useEffect } from "react";
import { ENSAIO_STYLES, EnsaioStyle, EnsaioStyleId } from "@/lib/ensaio-styles";
import type { PersonInfo } from "@/app/api/generate-ensaio-prompt/route";

// Quantas fotos gerar por ensaio (paralelo)
const ENSAIO_COUNT = 8;
// Máximo de fotos de referência da pessoa
const MAX_REFS = 3;

interface RefImage {
  previewUrl: string;
  base64: string;
}

const defaultPerson: PersonInfo = {
  genderPresentation: "",
  ageRange: "",
  skinTone: "",
  hairColor: "",
  hairTexture: "",
  build: "",
  distinguishingContext: "",
};

export default function EnsaioStudio({ onBack }: { onBack?: () => void } = {}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [refs, setRefs] = useState<RefImage[]>([]);
  const [person, setPerson] = useState<PersonInfo>(defaultPerson);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [styleId, setStyleId] = useState<EnsaioStyleId | null>(null);
  const [customAdjustment, setCustomAdjustment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string>("Preparando...");
  const [images, setImages] = useState<string[]>([]);
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
          if (file) addReference(file);
          break;
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, refs.length]);

  function resizeAndConvert(file: File): Promise<{ base64: string; mediaType: string; url: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1400;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const c = document.createElement("canvas");
        c.width = width; c.height = height;
        c.getContext("2d")!.drawImage(img, 0, 0, width, height);
        const dataUrl = c.toDataURL("image/jpeg", 0.88);
        resolve({ base64: dataUrl.split(",")[1], mediaType: "image/jpeg", url: objectUrl });
      };
      img.onerror = reject;
      img.src = objectUrl;
    });
  }

  async function addReference(file: File) {
    if (refs.length >= MAX_REFS) {
      setError(`Você pode enviar até ${MAX_REFS} fotos de referência.`);
      return;
    }
    setError(null);
    try {
      const { base64, url } = await resizeAndConvert(file);
      const newRefs = [...refs, { previewUrl: url, base64 }];
      setRefs(newRefs);

      // Analisa só na primeira foto (as outras só reforçam a referência visual)
      if (newRefs.length === 1) {
        analyzePerson(base64);
      }
    } catch {
      setError("Erro ao processar a imagem.");
    }
  }

  async function analyzePerson(base64: string) {
    setAnalyzing(true);
    setAnalyzed(false);
    try {
      const res = await fetch("/api/analyze-person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType: "image/jpeg" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro");
      setPerson({
        genderPresentation: data.genderPresentation || "",
        ageRange: data.ageRange || "",
        skinTone: data.skinTone || "",
        hairColor: data.hairColor || "",
        hairTexture: data.hairTexture || "",
        build: data.build || "",
        distinguishingContext: data.distinguishingContext || "",
      });
      setAnalyzed(true);
    } catch {
      setError("Não foi possível analisar a foto — você pode preencher manualmente ou seguir sem análise.");
    } finally {
      setAnalyzing(false);
    }
  }

  function removeReference(i: number) {
    URL.revokeObjectURL(refs[i].previewUrl);
    const newRefs = refs.filter((_, idx) => idx !== i);
    setRefs(newRefs);
    if (newRefs.length === 0) {
      setPerson(defaultPerson);
      setAnalyzed(false);
    }
  }

  async function generateEnsaio() {
    if (!styleId) return;
    cancelRef.current = false;
    setGenerating(true);
    setImages([]);
    setError(null);
    setProgress("Gerando prompt...");
    setStep(4);

    try {
      // Passo 1: gera o prompt do ensaio (1 chamada, retorna template usado nas N gerações)
      const promptRes = await fetch("/api/generate-ensaio-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person, styleId, customAdjustment }),
      });
      const promptData = await promptRes.json();
      if (!promptRes.ok || promptData.error) {
        throw new Error(promptData.error || "Erro ao gerar prompt");
      }
      const { promptEN, negativeEN, aspectRatio } = promptData;

      setProgress(`Enviando ${ENSAIO_COUNT} fotos pra geração...`);

      // Passo 2: dispara N gerações em paralelo no Magnific
      const referenceImagesBase64 = refs.map((r) => r.base64);
      const referenceText = "Reference photo(s) of the person — preserve the exact face, hair and body proportions";

      const requests = Array.from({ length: ENSAIO_COUNT }, () =>
        fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptEN,
            negativePrompt: negativeEN,
            referenceImagesBase64,
            referenceText,
            aspectRatio,
          }),
        }).then((r) => r.json())
      );
      const tasks = await Promise.all(requests);
      const taskIds = tasks.map((t) => t?.task_id).filter(Boolean) as string[];
      if (taskIds.length === 0) throw new Error("Nenhuma geração iniciada — verifique créditos Magnific");

      setProgress(`Gerando ${taskIds.length} fotos do ensaio... (30–60s)`);

      // Passo 3: polling até completar
      const collected: string[] = [];
      const pending = new Set(taskIds);
      let attempts = 0;
      while (pending.size > 0 && attempts < 80) {
        if (cancelRef.current) break;
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
        for (const tid of Array.from(pending)) {
          if (cancelRef.current) break;
          const r = await fetch(`/api/image-status?taskId=${tid}`);
          const d = await r.json();
          if (d?.status === "COMPLETED") {
            const urls: string[] = d?.generated || [];
            collected.push(...urls);
            pending.delete(tid);
            setImages([...collected]);
            setProgress(
              pending.size > 0
                ? `${collected.length} fotos prontas — aguardando ${pending.size}...`
                : "Ensaio pronto ✓"
            );
          } else if (d?.status === "FAILED") {
            pending.delete(tid);
          }
        }
      }

      if (!cancelRef.current && collected.length === 0) {
        throw new Error("Nenhuma foto gerada");
      }
    } catch (e) {
      if (!cancelRef.current) {
        setError(e instanceof Error ? e.message : "Erro ao gerar ensaio");
      }
    } finally {
      setGenerating(false);
    }
  }

  function resetAll() {
    cancelRef.current = true;
    refs.forEach((r) => URL.revokeObjectURL(r.previewUrl));
    setStep(1);
    setRefs([]);
    setPerson(defaultPerson);
    setAnalyzed(false);
    setStyleId(null);
    setCustomAdjustment("");
    setImages([]);
    setError(null);
  }

  const canProceed1 = refs.length > 0 && !analyzing;
  const canProceed2 = styleId !== null;
  const selectedStyle: EnsaioStyle | null = styleId ? ENSAIO_STYLES.find((s) => s.id === styleId) || null : null;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px" }}>
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
          Swell · Ensaio de Pessoa
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Ensaio nível Swell
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Fotos de referência → catálogo de estilos → 8 fotos do seu ensaio em minutos
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} style={{ height: 3, flex: 1, borderRadius: 2, background: step >= s ? "var(--accent)" : "var(--border)", transition: "background 0.3s" }} />
        ))}
      </div>

      {/* STEP 1 — Fotos de referência */}
      {step === 1 && (
        <div>
          <SectionTitle step={1} title="Suas fotos de referência" />
          <P>
            Envie <strong>1 a {MAX_REFS} fotos</strong> da pessoa que vai virar o ensaio. Ideal: rosto bem visível, boa luz, ângulos variados (frente + perfil ajudam).
            A IA vai preservar rosto, cabelo e corpo dessas fotos em todas as imagens geradas.
          </P>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${MAX_REFS}, 1fr)`, gap: 12, marginTop: 24, marginBottom: 20 }}>
            {Array.from({ length: MAX_REFS }).map((_, i) => {
              const ref = refs[i];
              if (ref) {
                return (
                  <div key={i} style={{ position: "relative", aspectRatio: "3/4", borderRadius: 10, overflow: "hidden", background: "var(--surface2)" }}>
                    <img src={ref.previewUrl} alt={`Ref ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      onClick={() => removeReference(i)}
                      style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.75)", border: "none", color: "#fff", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}
                    >
                      Remover
                    </button>
                  </div>
                );
              }
              return (
                <button
                  key={i}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    aspectRatio: "3/4",
                    border: "2px dashed var(--border)",
                    borderRadius: 10,
                    background: "var(--surface2)",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <div style={{ fontSize: 22 }}>+</div>
                  <div>Adicionar</div>
                </button>
              );
            })}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) addReference(file);
              e.target.value = "";
            }}
          />

          {analyzing && (
            <div style={{ padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
              🔍 Analisando a pessoa na foto para dar contexto ao ensaio...
            </div>
          )}
          {analyzed && !analyzing && (
            <div style={{ padding: "12px 16px", background: "#0e2018", border: "1px solid #1e4a3a", borderRadius: 8, color: "#4ade80", fontSize: 13, marginBottom: 16 }}>
              ✓ Análise concluída — traços gerais captados: <em>{person.ageRange || "-"}, {person.skinTone || "-"}, cabelo {person.hairColor || "-"} {person.hairTexture || "-"}</em>
            </div>
          )}

          {error && (
            <div style={{ padding: "12px 16px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ padding: "14px 16px", background: "var(--surface2)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            <strong style={{ color: "var(--text)" }}>Dica:</strong> Fotos com rosto bem iluminado, sem óculos escuros, sem sombra no rosto geram ensaios mais fiéis. Se enviar múltiplas, a IA usa todas como referência da mesma pessoa.
          </div>

          <NavButton disabled={!canProceed1} onClick={() => setStep(2)}>Escolher estilo →</NavButton>
        </div>
      )}

      {/* STEP 2 — Estilo */}
      {step === 2 && (
        <div>
          <SectionTitle step={2} title="Estilo do ensaio" />
          <P>Escolha um estilo do catálogo Swell. Cada estilo tem direção de arte, luz e wardrobe próprios.</P>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24, marginBottom: 20 }}>
            {ENSAIO_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setStyleId(style.id)}
                style={{
                  padding: "16px 14px",
                  borderRadius: 10,
                  cursor: "pointer",
                  border: `1px solid ${styleId === style.id ? "var(--accent)" : "var(--border)"}`,
                  background: styleId === style.id ? "rgba(200,121,65,0.08)" : "var(--surface)",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{style.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: styleId === style.id ? "var(--accent)" : "var(--text)", marginBottom: 4 }}>
                  {style.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {style.description}
                </div>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              onClick={() => setStep(1)}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "12px 20px", fontSize: 14, cursor: "pointer" }}
            >
              ← Voltar
            </button>
            <NavButton disabled={!canProceed2} onClick={() => setStep(3)} style={{ flex: 1 }}>
              Ajustes finais →
            </NavButton>
          </div>
        </div>
      )}

      {/* STEP 3 — Ajuste livre + revisão */}
      {step === 3 && selectedStyle && (
        <div>
          <SectionTitle step={3} title="Ajustes finais" />

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
              Estilo escolhido
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
              {selectedStyle.icon} {selectedStyle.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {selectedStyle.description}
            </div>
          </div>

          <Field label="Ajuste personalizado (opcional)" hint="Adicione detalhes específicos que quer no ensaio">
            <textarea
              value={customAdjustment}
              onChange={(e) => setCustomAdjustment(e.target.value)}
              placeholder="Ex: cabelo preso, óculos escuros, segurando uma taça de vinho, cidade específica ao fundo, luz de manhã em vez de fim de tarde..."
              rows={4}
              style={{
                width: "100%",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "12px 14px",
                color: "var(--text)",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </Field>

          <div style={{ padding: "12px 14px", background: "var(--surface2)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
            <strong style={{ color: "var(--text)" }}>Sugestões pra este estilo:</strong>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              {selectedStyle.suggestions.map((s, i) => <li key={i} style={{ marginBottom: 3 }}>{s}</li>)}
            </ul>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              onClick={() => setStep(2)}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "12px 20px", fontSize: 14, cursor: "pointer" }}
            >
              ← Trocar estilo
            </button>
            <NavButton onClick={generateEnsaio} style={{ flex: 1 }}>
              Gerar {ENSAIO_COUNT} fotos →
            </NavButton>
          </div>
        </div>
      )}

      {/* STEP 4 — Ensaio */}
      {step === 4 && (
        <div>
          <SectionTitle step={4} title="Seu ensaio" />

          {generating && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>📸</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                Gerando o ensaio...
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{progress}</div>
              {images.length > 0 && (
                <div style={{ marginTop: 20, fontSize: 12, color: "#4ade80" }}>
                  {images.length} foto(s) já prontas
                </div>
              )}
            </div>
          )}

          {images.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {images.map((url, i) => (
                <div key={i} style={{ borderRadius: 10, overflow: "hidden", position: "relative", background: "var(--surface2)" }}>
                  <img src={url} alt={`Ensaio ${i + 1}`} style={{ width: "100%", display: "block" }} />
                  <a
                    href={url}
                    download={`swell-ensaio-${i + 1}.jpg`}
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

          {error && (
            <div style={{ padding: "12px 16px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {!generating && (
            <div style={{ display: "flex", gap: 10, flexDirection: "column", marginTop: 16 }}>
              <button
                onClick={generateEnsaio}
                style={{ width: "100%", background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "14px", fontSize: 15, cursor: "pointer", fontWeight: 700 }}
              >
                Gerar novo ensaio no mesmo estilo →
              </button>
              <button
                onClick={() => setStep(2)}
                style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "12px", fontSize: 14, cursor: "pointer" }}
              >
                Trocar estilo
              </button>
              <button
                onClick={resetAll}
                style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "12px", fontSize: 14, cursor: "pointer" }}
              >
                Nova pessoa
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
    <div style={{ marginBottom: 24 }}>
      <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Passo {step} de 4
      </span>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{title}</h2>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, margin: "10px 0" }}>{children}</p>;
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
