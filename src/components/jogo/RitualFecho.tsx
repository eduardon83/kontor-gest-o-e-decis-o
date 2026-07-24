import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useJogo } from "./JogoContext";
import { financeiroDo, fmtEUR } from "./RelatorioFinanceiro";
import { waterfallDaPnL, manchetePrincipal, type Manchete } from "@/lib/jogo/jornal-real";

function prefereMenosMovimento(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RitualFecho({ open, onDone }: { open: boolean; onDone: () => void }) {
  const {
    snapshotAtual, snapshots, rivais, competicao_nome, equipa_nome, ronda_indice,
  } = useJogo() as any;

  const [batida, setBatida] = useState(0);
  const reduzido = useMemo(prefereMenosMovimento, []);

  const fin = financeiroDo(snapshotAtual);
  const passos = useMemo(() => waterfallDaPnL(fin), [fin]);

  const snapshotAnterior = useMemo(() => {
    if (!Array.isArray(snapshots) || snapshots.length < 2) return null;
    return snapshots[snapshots.length - 2]?.snapshot ?? null;
  }, [snapshots]);

  const manchete: Manchete = useMemo(() => manchetePrincipal({
    rivaisAtuais: rivais ?? [], rivaisAnteriores: [],
    snapshotAtual, snapshotAnterior,
    competicao_nome: competicao_nome ?? "Kontor",
    equipa_nome: equipa_nome ?? "a nossa casa",
    turno: Number((snapshotAtual as any)?.turno ?? ronda_indice ?? 0),
  }), [rivais, snapshotAtual, snapshotAnterior, competicao_nome, equipa_nome, ronda_indice]);

  // Escapar / saltar
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onDone(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onDone]);

  // Coreografia
  useEffect(() => {
    if (!open) return;
    setBatida(0);
    if (reduzido) { const t = setTimeout(onDone, 300); return () => clearTimeout(t); }
    const t1 = setTimeout(() => setBatida(1), 1300);
    const t2 = setTimeout(() => setBatida(2), 2500);
    const t3 = setTimeout(onDone, 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [open, reduzido, onDone]);

  if (!open) return null;

  const maxAbs = Math.max(1, ...passos.map((p) => Math.abs(p.valor)));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fecho do turno"
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ backgroundColor: "color-mix(in oklab, var(--navy) 92%, black)" }}
    >
      <button
        type="button"
        onClick={onDone}
        className="mono absolute right-6 top-6 inline-flex items-center gap-2 rounded-sm border border-gold/60 bg-navy/60 px-3 py-1.5 text-[11px] uppercase tracking-widest text-gold hover:bg-navy"
      >
        <X className="h-3 w-3" /> Saltar
      </button>

      <div className="w-full max-w-3xl">
        {/* Batida 1 — Waterfall */}
        <section
          className={`rounded-sm border border-gold/40 bg-navy/40 p-6 transition-opacity duration-500 ${
            batida >= 1 ? "opacity-40" : "opacity-100"
          }`}
        >
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-gold">O livro-razão fecha</div>
          <h2 className="mt-1 font-serif text-2xl text-paper">
            Turno {Number((snapshotAtual as any)?.turno ?? ronda_indice)}
          </h2>
          {passos.length === 0 ? (
            <p className="mt-4 text-sm text-paper/70">Sem demonstração de resultados neste turno.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {passos.map((p, i) => (
                <li key={p.rotulo} className="flex items-center gap-3">
                  <span className="mono w-40 shrink-0 text-[10px] uppercase tracking-widest text-paper/70">
                    {p.rotulo}
                  </span>
                  <div className="flex-1">
                    <div
                      className="h-3 rounded-sm"
                      style={{
                        width: `${(Math.abs(p.valor) / maxAbs) * 100}%`,
                        background: p.tipo === "acumulado"
                          ? "var(--gold)"
                          : p.tipo === "positivo"
                            ? "color-mix(in oklab, var(--gold) 75%, transparent)"
                            : "color-mix(in oklab, var(--slate) 55%, transparent)",
                        transformOrigin: "left center",
                        transform: reduzido ? "scaleX(1)" : "scaleX(0)",
                        animation: reduzido ? undefined : `desenharBarra 380ms ease-out ${i * 130}ms forwards`,
                      }}
                    />
                  </div>
                  <span
                    className={`mono w-28 text-right text-xs ${p.valor >= 0 ? "text-gold" : "text-paper/80"}`}
                    style={{
                      opacity: reduzido ? 1 : 0,
                      animation: reduzido ? undefined : `revelarTexto 260ms ease-out ${i * 130 + 200}ms forwards`,
                    }}
                  >
                    {p.valor >= 0 ? "" : "−"}{fmtEUR(Math.abs(p.valor))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Batida 2 — Manchete */}
        {batida >= 1 && (
          <section
            className="mt-4 rounded-sm border border-gold/60 p-6 shadow-lg"
            style={{
              backgroundColor: "var(--paper)",
              opacity: 0,
              animation: reduzido ? "revelarTexto 0ms forwards" : "revelarTexto 500ms ease-out forwards",
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0, transparent 22px, color-mix(in oklab, var(--slate) 8%, transparent) 22px, color-mix(in oklab, var(--slate) 8%, transparent) 23px)",
            }}
          >
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-gold">Gazeta Comercial · impressa</div>
            <div className="mono mt-1 text-[10px] uppercase tracking-widest text-slate">{manchete.tag}</div>
            <h1 className="mt-1 font-serif text-3xl leading-tight text-navy">{manchete.titulo}</h1>
            {manchete.sub && <p className="mt-2 text-sm text-navy/80">{manchete.sub}</p>}
            {batida >= 2 && (
              <div className="mono mt-4 text-[10px] uppercase tracking-widest text-gold">
                A crónica registou este turno →
              </div>
            )}
          </section>
        )}
      </div>

      <style>{`
        @keyframes desenharBarra { to { transform: scaleX(1); } }
        @keyframes revelarTexto { to { opacity: 1; } }
      `}</style>
    </div>
  );
}
