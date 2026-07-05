import { ID_ARVORE, type NoIeD } from "@/lib/jogo/dados-exemplo";
import { CheckCircle2, Loader2, Lock } from "lucide-react";

export function Laboratorio() {
  const produto = ID_ARVORE.filter((n) => n.ramo === "produto");
  const processo = ID_ARVORE.filter((n) => n.ramo === "processo");

  return (
    <div
      className="rounded-sm border p-6"
      style={{
        backgroundColor: "#0E2740",
        backgroundImage:
          "linear-gradient(color-mix(in oklab, #C9A24B 15%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, #C9A24B 15%, transparent) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <div className="mb-6">
        <div className="mono text-[10px] uppercase tracking-[0.28em] text-gold">Blueprint · I&D</div>
        <h2 className="font-serif text-2xl text-paper">Árvore de investigação</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Ramo titulo="Ramo · Produto" nos={produto} />
        <Ramo titulo="Ramo · Processo" nos={processo} />
      </div>
    </div>
  );
}

function Ramo({ titulo, nos }: { titulo: string; nos: NoIeD[] }) {
  return (
    <div>
      <h3 className="mono mb-3 text-[10px] uppercase tracking-widest text-gold">{titulo}</h3>
      <ul className="space-y-3">
        {nos.map((n) => (
          <li
            key={n.id}
            className="rounded-sm border p-3"
            style={{
              backgroundColor: "color-mix(in oklab, #08182B 70%, transparent)",
              borderColor: "color-mix(in oklab, #C9A24B 40%, transparent)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-serif text-base text-paper">{n.nome}</div>
                <p className="text-sm" style={{ color: "color-mix(in oklab, #F5F1E8 70%, transparent)" }}>
                  {n.descricao}
                </p>
              </div>
              <EstadoBadge estado={n.estado} />
            </div>
            <div className="mt-2 h-1 rounded-full" style={{ background: "color-mix(in oklab, #F5F1E8 15%, transparent)" }}>
              <div className="h-full rounded-full" style={{ width: `${n.progresso}%`, background: "var(--gold)" }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: NoIeD["estado"] }) {
  if (estado === "concluido") return <CheckCircle2 className="h-4 w-4 text-gold" />;
  if (estado === "em_curso") return <Loader2 className="h-4 w-4 animate-spin text-paper/60" />;
  return <Lock className="h-4 w-4 text-paper/40" />;
}
