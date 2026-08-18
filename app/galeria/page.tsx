"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download, FolderOpen, Plus, X } from "lucide-react";

const EMBER = "#E0742F";
const FOAM = "#F4EFE6";
const foam = (a: number) => `rgba(244,239,230,${a})`;
const mono = (size: number, spacing = 0.18): React.CSSProperties => ({
  fontFamily: "'IBM Plex Mono', monospace", fontSize: size, letterSpacing: `${spacing}em`,
});
const display: React.CSSProperties = { fontFamily: "'Archivo', sans-serif", fontWeight: 900, letterSpacing: "-0.03em" };

interface Gen {
  id: number;
  style: string;
  label: string | null;
  images: string[];
  note: string | null;
  created_at: string;
}
interface Project {
  id: number;
  name: string | null;
  category: string | null;
  ref_images: string[];
  updated_at: string;
  gen_count: number;
}

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

export default function GaleriaPage() {
  const [gens, setGens] = useState<Gen[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);

  useEffect(() => {
    document.title = "Galeria — Swell Studio";
    Promise.all([
      fetch("/api/projects").then((r) => r.json()).catch(() => ({})),
      fetch("/api/generations").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([p, g]) => {
        setProjects(Array.isArray(p.projects) ? p.projects : []);
        setGens(Array.isArray(g.generations) ? g.generations : []);
        setEmail(g.email ?? p.email ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = gens.reduce((n, g) => n + g.images.length, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0908", color: FOAM, fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px clamp(20px, 4vw, 48px)", background: "rgba(10,9,8,0.72)", backdropFilter: "blur(22px) saturate(140%)", WebkitBackdropFilter: "blur(22px) saturate(140%)", borderBottom: `1px solid ${foam(0.08)}` }}>
        <a href="/studio" style={{ display: "flex", alignItems: "baseline", gap: 14, textDecoration: "none" }}>
          <span style={{ ...display, fontSize: 19, letterSpacing: "-0.02em", color: FOAM }}>Swell<span style={{ color: EMBER }}>.</span></span>
          <span style={{ ...mono(10, 0.22), color: foam(0.45) }}>GALERIA</span>
        </a>
        <a href="/studio" style={{ display: "flex", alignItems: "center", gap: 8, background: foam(0.05), border: `1px solid ${foam(0.14)}`, color: FOAM, borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <ArrowLeft size={14} />Voltar ao estúdio
        </a>
      </header>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(32px, 5vh, 60px) clamp(20px, 4vw, 48px) 100px" }}>
        <div style={{ ...mono(11, 0.24), color: EMBER, marginBottom: 12 }}>SEU TRABALHO</div>
        <h1 style={{ ...display, fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 0.95, margin: "0 0 10px" }}>
          Galeria<span style={{ color: EMBER }}>.</span>
        </h1>
        <div style={{ ...mono(9, 0.14), color: email ? foam(0.5) : "#C28A1E", marginBottom: 44, wordBreak: "break-all" }}>
          {email ? `${projects.length} PROJETO${projects.length === 1 ? "" : "S"} · ${total} FOTO${total === 1 ? "" : "S"} · ${email.toUpperCase()}` : "SEM SESSÃO — FAÇA LOGIN PARA VER SEU HISTÓRICO"}
        </div>

        {loading && <div style={{ fontSize: 14, color: foam(0.45), textAlign: "center", padding: "60px 0" }}>Carregando seu histórico…</div>}

        {/* ── Projetos ── */}
        {!loading && email && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ ...mono(11, 0.24), color: foam(0.5), marginBottom: 16 }}>SEUS PROJETOS</div>
            {projects.length === 0 ? (
              <div style={{ fontSize: 14, color: foam(0.45), border: `1px dashed ${foam(0.15)}`, borderRadius: 16, padding: "34px 20px", textAlign: "center" }}>
                Nenhum projeto ainda. Cada produto que você sobe e gera vira um projeto aqui — dá pra reabrir e criar mais fotos quando quiser.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {projects.map((p) => {
                  const cover = p.ref_images?.[0];
                  return (
                    <a key={p.id} href={`/studio?project=${p.id}`} style={{ textDecoration: "none", color: "inherit", background: "rgba(22,18,15,0.65)", border: `1px solid ${foam(0.09)}`, borderRadius: 18, overflow: "hidden", display: "block" }}>
                      <div style={{ aspectRatio: "4 / 3", background: "#1B1714", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : (
                          <FolderOpen size={26} color={foam(0.3)} />
                        )}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,9,8,0) 45%, rgba(10,9,8,0.85) 100%)" }} />
                        <span style={{ position: "absolute", right: 10, top: 10, ...mono(8, 0.14), color: FOAM, background: "rgba(10,9,8,0.6)", borderRadius: 999, padding: "4px 9px" }}>{p.gen_count} GERAÇÃO{p.gen_count === 1 ? "" : "ÕES"}</span>
                        <div style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name || "Produto sem nome"}</div>
                          <div style={{ ...mono(8, 0.14), color: foam(0.55), marginTop: 3 }}>{formatWhen(p.updated_at)}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", ...mono(10, 0.14), color: EMBER, borderTop: `1px solid ${foam(0.07)}` }}>
                        <Plus size={13} />ABRIR E GERAR MAIS
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Todas as fotos (fluxo cronológico) ── */}
        {!loading && email && gens.length > 0 && (
          <section>
            <div style={{ ...mono(11, 0.24), color: foam(0.5), marginBottom: 16 }}>TODAS AS FOTOS</div>
            {gens.map((g) => (
              <div key={g.id} style={{ marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{g.label || g.style}</span>
                  <span style={{ ...mono(9, 0.16), color: foam(0.4) }}>{formatWhen(g.created_at)}</span>
                </div>
                {g.note && <div style={{ fontSize: 12, color: foam(0.5), fontStyle: "italic", marginBottom: 12 }}>com o seu pedido: “{g.note}”</div>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                  {g.images.map((src, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${foam(0.1)}`, background: "#14110F" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" onClick={() => setLightbox({ src, name: `swell-${g.style}-${i + 1}.jpg` })} title="Ampliar" style={{ width: "100%", display: "block", cursor: "zoom-in" }} />
                      <a href={`/api/download?u=${encodeURIComponent(src)}&name=swell-${g.style}-${i + 1}.jpg`}
                        style={{ position: "absolute", bottom: 10, right: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(10,9,8,0.7)", backdropFilter: "blur(8px)", color: FOAM, borderRadius: 8, padding: "6px 11px", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                        <Download size={11} />Baixar
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {!loading && email && projects.length === 0 && gens.length === 0 && (
          <div style={{ fontSize: 14, color: foam(0.45), textAlign: "center", padding: "40px 0" }}>
            Nada por aqui ainda — tudo que você gerar fica salvo aqui, pra sempre.
          </div>
        )}
      </main>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(6,5,4,0.92)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 4vw, 48px)", gap: 20 }}>
          <button onClick={() => setLightbox(null)} title="Fechar" style={{ position: "absolute", top: 18, right: 18, width: 36, height: 36, borderRadius: "50%", background: foam(0.08), border: `1px solid ${foam(0.15)}`, color: FOAM, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.src} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "min(1100px, 92vw)", maxHeight: "76vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 40px 120px rgba(0,0,0,0.6)" }} />
          <a href={`/api/download?u=${encodeURIComponent(lightbox.src)}&name=${encodeURIComponent(lightbox.name)}`} onClick={(e) => e.stopPropagation()}
            style={{ display: "inline-flex", alignItems: "center", gap: 9, background: EMBER, color: "#0A0908", borderRadius: 12, padding: "14px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            <Download size={16} />Baixar foto
          </a>
        </div>
      )}
    </div>
  );
}
