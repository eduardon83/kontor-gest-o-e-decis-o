import { ID_NOS, ID_INICIAL, estadoDoNo, proximoElegivel, type IdEstado, type IdNo } from "@/lib/jogo/id-arvore";
import { CheckCircle2, Loader2, Lock, Target } from "lucide-react";
import { useJogo } from "../JogoContext";

const CUSTO_INVESTIGADOR_MES = 20.74 * 160 * 1.6; // custo_hora · 160h · 1,6× salário investigador
const CUSTO_LICENCA = 45_000;

export function Laboratorio() {
  const { snapshotAtual, rascunho, decisoes, podeEditar, atualizarRascunho } = useJogo();

  const snap = (snapshotAtual ?? {}) as Record<string, any>;
  const est: IdEstado = snap.id ?? ID_INICIAL;
  const investigadores = Number(snap.investigadores ?? 0);

  const cooGuardado = (decisoes.COO?.payload ?? {}) as Record<string, unknown>;
  const cooLocal = (rascunho.COO ?? {}) as Record<string, unknown>;
  const idAlvoAtual = (cooLocal.id_alvo ?? cooGuardado.id_alvo ?? null) as string | null;
  const idModo = (cooLocal.id_modo ?? cooGuardado.id_modo ?? "interno") as string;
  const editavel = podeEditar("COO");

  const produto = ID_NOS.filter((n) => n.ramo === "produto");
  const processo = ID_NOS.filter((n) => n.ramo === "processo");
  const prox = proximoElegivel(est);
  const alvo = idAlvoAtual ? ID_NOS.find((n) => n.id === idAlvoAtual) ?? prox : prox;

  function escolherAlvo(id: string) {
    atualizarRascunho("COO", { id_alvo: id });
  }

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
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.28em] text-gold">Blueprint · I&D</div>
          <h2 className="font-serif text-2xl text-paper">Árvore de investigação</h2>
          <p className="mt-1 text-xs text-paper/70">
            Escolhe o próximo nó a investigar. A tua escolha liga-se à decisão do COO.
          </p>
        </div>
        {alvo && (
          <div className="mono rounded-sm border border-gold/40 bg-navy/60 px-3 py-2 text-[10px] uppercase tracking-widest text-paper/80">
            Próximo alvo: <span className="text-gold">{alvo.nome}</span>
            <div className="mt-1 normal-case tracking-normal text-paper/70">
              Progresso {Math.min(est.progresso, alvo.custo).toFixed(0)}/{alvo.custo} pts · faltam{" "}
              {Math.max(0, alvo.custo - est.progresso).toFixed(0)}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Ramo
          titulo="Ramo · Processo"
          nos={processo}
          estado={est}
          idAlvo={idAlvoAtual}
          idModo={idModo}
          investigadores={investigadores}
          editavel={editavel}
          onEscolher={escolherAlvo}
        />
        <Ramo
          titulo="Ramo · Produto"
          nos={produto}
          estado={est}
          idAlvo={idAlvoAtual}
          idModo={idModo}
          investigadores={investigadores}
          editavel={editavel}
          onEscolher={escolherAlvo}
        />
      </div>
    </div>
  );
}

function Ramo({
  titulo, nos, estado, idAlvo, idModo, investigadores, editavel, onEscolher,
}: {
  titulo: string;
  nos: IdNo[];
  estado: IdEstado;
  idAlvo: string | null;
  idModo: string;
  investigadores: number;
  editavel: boolean;
  onEscolher: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mono mb-3 text-[10px] uppercase tracking-widest text-gold">{titulo}</h3>
      <ul className="space-y-3">
        {nos.map((n) => {
          const st = estadoDoNo(n, estado);
          const progresso = st === "desbloqueado" ? 100
            : st === "em_curso" ? Math.min(100, (estado.progresso / n.custo) * 100)
            : 0;
          const alvo = idAlvo === n.id;
          const prereqOk = n.prereq.every((p) => estado.desbloqueados.includes(p));
          const selecionavel = editavel && prereqOk && st !== "desbloqueado";
          return (
            <li
              key={n.id}
              className="rounded-sm border p-3"
              style={{
                backgroundColor: alvo
                  ? "color-mix(in oklab, #C9A24B 18%, #08182B)"
                  : "color-mix(in oklab, #08182B 70%, transparent)",
                borderColor: alvo
                  ? "var(--gold)"
                  : "color-mix(in oklab, #C9A24B 40%, transparent)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-serif text-base text-paper">{n.nome}</div>
                    {alvo && <Target className="h-3.5 w-3.5 text-gold" />}
                  </div>
                  <p className="text-sm" style={{ color: "color-mix(in oklab, #F5F1E8 70%, transparent)" }}>
                    {n.descricao}
                  </p>
                  {n.prereq.length > 0 && (
                    <p className="mono mt-1 text-[10px] uppercase tracking-widest text-paper/50">
                      Requer: {n.prereq.join(" + ")}
                    </p>
                  )}
                  <div className="mono mt-2 grid gap-0.5 text-[10px] uppercase tracking-widest text-paper/60">
                    <div>Custo interno: <span className="text-paper">{n.custo} pts</span></div>
                    <div>
                      Licença: <span className="text-paper">€{CUSTO_LICENCA.toLocaleString("pt-PT")}</span>
                      {idModo === "licenca" && alvo && <span className="ml-2 text-gold">(modo atual)</span>}
                    </div>
                    <div>
                      Investigadores: <span className="text-paper">{investigadores}</span> · custo/mês ≈{" "}
                      <span className="text-paper">€{Math.round(investigadores * CUSTO_INVESTIGADOR_MES).toLocaleString("pt-PT")}</span>
                    </div>
                  </div>
                </div>
                <EstadoBadge estado={st} />
              </div>
              <div className="mt-2 h-1 rounded-full" style={{ background: "color-mix(in oklab, #F5F1E8 15%, transparent)" }}>
                <div className="h-full rounded-full" style={{ width: `${progresso}%`, background: "var(--gold)" }} />
              </div>
              {selecionavel && (
                <button
                  type="button"
                  onClick={() => onEscolher(n.id)}
                  disabled={alvo}
                  className="mono mt-3 w-full rounded-sm border border-gold/60 bg-gold/10 px-2 py-1.5 text-[10px] uppercase tracking-widest text-gold transition-colors hover:bg-gold/20 disabled:opacity-60"
                >
                  {alvo ? "Alvo escolhido" : "Escolher como próximo alvo"}
                </button>
              )}
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
