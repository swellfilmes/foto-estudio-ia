"use client";

import { useState } from "react";
import { Image as ImageIcon, ArrowUp } from "lucide-react";

/* ── tokens (mesmo design do estúdio) ── */
const EMBER = "#E0742F";
const INK = "#0A0908";
const FOAM = "#F4EFE6";
const foam = (a: number) => `rgba(244,239,230,${a})`;
const ember = (a: number) => `rgba(224,116,47,${a})`;
const mono = (size: number, spacing = 0.18): React.CSSProperties => ({
  fontFamily: "'IBM Plex Mono', monospace", fontSize: size, letterSpacing: `${spacing}em`,
});

/* ── perfil "Minha Marca" ── */
export interface BrandProfile {
  name: string; tone: string; mood: string; human: string; colorHex: string;
  logo?: string; palette?: string[]; forbidden?: string; scenario?: string;
}
export const emptyBrand: BrandProfile = { name: "", tone: "", mood: "", human: "", colorHex: "", logo: "", palette: [], forbidden: "", scenario: "" };
export const BRAND_STORAGE_KEY = "swell-brand";
const BRAND_TONES = ["Minimalista", "Premium", "Acolhedor", "Vibrante", "Natural"];
const BRAND_MOODS = ["Clean", "Quente", "Escuro", "Colorido"];
const BRAND_HUMANS = ["Sem pessoas", "Só detalhes (mãos)", "Com modelo"];
const BRAND_SCENARIOS = ["Fundo claro e natural", "Fundo escuro premium", "Cena de casa / lifestyle", "Estúdio clean", "Externa / natureza"];

export function loadBrand(): BrandProfile {
  try {
    const raw = localStorage.getItem(BRAND_STORAGE_KEY);
    if (raw) return { ...emptyBrand, ...JSON.parse(raw) };
  } catch {}
  return emptyBrand;
}
export function saveBrand(b: BrandProfile) {
  try { localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(b)); } catch {}
}

export function BrandForm({ brand, onSave }: { brand: BrandProfile; onSave: (b: BrandProfile) => void }) {
  const [draft, setDraft] = useState<BrandProfile>(brand);
  const [newColor, setNewColor] = useState("#E0742F");
  const set = (fieldKey: keyof BrandProfile, v: string) => setDraft((d) => ({ ...d, [fieldKey]: d[fieldKey] === v ? "" : v }));
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

      <div style={label}>CENÁRIO PREFERIDO</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {BRAND_SCENARIOS.map((s) => <button key={s} onClick={() => set("scenario", s)} style={chip(draft.scenario === s)}>{s}</button>)}
      </div>

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
