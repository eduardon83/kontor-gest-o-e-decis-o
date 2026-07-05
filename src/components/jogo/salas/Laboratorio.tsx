import { ID_NOS, ID_INICIAL, estadoDoNo, proximoElegivel, type IdEstado, type IdNo } from "@/lib/jogo/id-arvore";
import { CheckCircle2, Loader2, Lock } from "lucide-react";

type Props = { estado?: IdEstado };

export function Laboratorio({ estado }: Props = {}) {
  const est = estado ?? ID_INICIAL;
  const produto = ID_NOS.filter((n) => n.ramo === "produto");
  const processo = ID_NOS.filter((n) => n.ramo === "processo");
  const prox = proximoElegivel(est);

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
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.28em] text-gold">Blueprint · I&D</div>
          <h2 className="font-serif text-2xl text-paper">Árvore de investigação</h2>
        </div>
        {prox && (
          <div className="mono text-[10px] uppercase tracking-widest text-paper/70">
            Próximo: <span className="text-gold">{prox.nome}</span> · {Math.min(est.progresso, prox.custo).toFixed(0)}/{prox.custo}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Ramo titulo="Ramo · Processo" nos={processo} estado={est} />
        <Ramo titulo="Ramo · Produto" nos={produto} estado={est} />
      </div>
    </div>
  );
}

function Ramo({ titulo, nos, estado }: { titulo: string; nos: IdNo[]; estado: IdEstado }) {
  return (
    <div>
      <h3 className="mono mb-3 text-[10px] uppercase tracking-widest text-gold">{titulo}</h3>
      <ul className="space-y-3">
        {nos.map((n) => {
          const st = estadoDoNo(n, estado);
          const progresso = st === "desbloqueado" ? 100
            : st === "em_curso" ? Math.min(100, (estado.progresso / n.custo) * 100)
            : 0;
          return (
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
                  {n.prereq.length > 0 && (
                    <p className="mono mt-1 text-[10px] uppercase tracking-widest text-paper/50">
                      Requer: {n.prereq.join(" + ")}
                    </p>
                  )}
                </div>
                <EstadoBadge estado={st} />
              </div>
              <div className="mt-2 h-1 rounded-full" style={{ background: "color-mix(in oklab, #F5F1E8 15%, transparent)" }}>
                <div className="h-full rounded-full" style={{ width: `${progresso}%`, background: "var(--gold)" }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: "desbloqueado" | "em_curso" | "bloqueado" }) {
  if (estado === "desbloqueado") return <CheckCircle2 className="h-4 w-4 text-gold" />;
  if (estado === "em_curso") return <Loader2 className="h-4 w-4 animate-spin text-paper/60" />;
  return <Lock className="h-4 w-4 text-paper/40" />;
}
