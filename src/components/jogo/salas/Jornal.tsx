import { JORNAL } from "@/lib/jogo/dados-exemplo";
import { useJogo } from "../JogoContext";
import { fmtEUR, financeiroDo } from "../RelatorioFinanceiro";
import {
  manchetePrincipal, noticiasEconomia, colunaOpiniao,
  anunciosDasCasas, cartasAoDiretor, necrologia,
} from "@/lib/jogo/jornal-real";

const CORES_ESTADO = {
  aplicado: "text-gold",
  ajustado: "text-slate",
  anulado: "text-destructive",
} as const;

export function Jornal() {
  const { modo, snapshotAtual, snapshots, rivais, competicao_nome, equipa_nome, ronda_indice, setSala, decisoes } = useJogo() as any;
  const fin = financeiroDo(snapshotAtual);
  const turnoFin = Number((snapshotAtual as any)?.turno ?? 0);

  const emReal = modo === "real";
  const ultimoResolvido = snapshots.length ? snapshots[snapshots.length - 1] : null;
  const turnoUltimo = ultimoResolvido?.ronda_indice ?? Math.max(0, ronda_indice - 1);
  const faseEcon = (snapshotAtual as any)?.fase_economica ?? (ultimoResolvido?.snapshot as any)?.macro?.fase ?? null;

  // Manchetes: em modo real são derivadas da economia macro e do próprio desempenho.
  const macroAtual = (snapshotAtual as any)?.macro as
    | { juro: number; inflacao: number; crescimento: number; confianca: number }
    | undefined;
  const macroAnterior = (ultimoResolvido?.snapshot as any)?.macro as
    | { juro: number; inflacao: number; crescimento: number; confianca: number }
    | undefined;
  const notas = ((snapshotAtual as any)?.notas ?? []) as { acao: string; payload?: Record<string, unknown> }[];

  const manchetesReais = (() => {
    if (!emReal) return null;
    const arr: { tag: string; titulo: string }[] = [];
    if (faseEcon) arr.push({ tag: "Economia", titulo: `Fase macroeconómica: ${faseEcon}` });
    if (macroAtual) {
      const dJuro = macroAnterior ? macroAtual.juro - macroAnterior.juro : 0;
      if (Math.abs(dJuro) >= 0.25) {
        arr.push({
          tag: "Política monetária",
          titulo: `Juro base ${dJuro > 0 ? "sobe" : "desce"} para ${macroAtual.juro.toFixed(2)}%`,
        });
      } else {
        arr.push({ tag: "Política monetária", titulo: `Juro base estabiliza em ${macroAtual.juro.toFixed(2)}%` });
      }
      arr.push({ tag: "Preços", titulo: `Inflação a ${macroAtual.inflacao.toFixed(1)}%` });
      arr.push({
        tag: "Ciclo",
        titulo: `Crescimento ${(macroAtual.crescimento * 100 - 100).toFixed(1)}% · confiança ${Math.round(macroAtual.confianca)}`,
      });
    }
    if (fin?.pnl?.resultado_liquido != null) {
      const rl = Number(fin.pnl.resultado_liquido);
      arr.push({
        tag: "Resultados",
        titulo:
          rl >= 0
            ? `${equipa_nome} fecha turno com lucro de ${fmtEUR(rl)}`
            : `${equipa_nome} apura prejuízo de ${fmtEUR(Math.abs(rl))}`,
      });
    }
    if (rivais.length) {
      const top = [...rivais].sort((a, b) => b.valor - a.valor)[0];
      if (top) arr.push({ tag: "Concorrência", titulo: `${top.nome} lidera a praça com ${fmtEUR(top.valor)}` });
    }
    if (!arr.length) arr.push({ tag: competicao_nome, titulo: "Sem turnos resolvidos — o jornal aparece após a primeira ronda." });
    return arr;
  })();

  // Decisões da ronda anterior: em modo real deixamos indicadores neutros; o registo
  // completo vive no gabinete. Sem dados fictícios.
  const decisoesReais = emReal ? [] : JORNAL.decisoes;
  const concorrenciaReal = emReal
    ? [...rivais].sort((a, b) => b.valor - a.valor).slice(0, 3).map((r) => ({ inicial: r.nome[0] ?? "?", valor: r.valor, nome: r.nome }))
    : JORNAL.concorrencia.map((c) => ({ ...c, nome: c.inicial }));

  return (
    <div className="space-y-6">
      {/* Jornal principal */}
      <article
        className="rounded-sm border p-8"
        style={{
          backgroundColor: "var(--paper)",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 27px, color-mix(in oklab, var(--slate) 8%, transparent) 27px, color-mix(in oklab, var(--slate) 8%, transparent) 28px)",
        }}
      >
        <header className="border-b-2 border-navy pb-4">
          <div className="mono flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-slate">
            <span>Gazeta Comercial{emReal ? ` · ${competicao_nome}` : ""}</span>
            <span>{emReal ? `Turno ${turnoUltimo || ronda_indice}` : JORNAL.data}</span>
          </div>
          <h1 className="mt-2 font-serif text-4xl leading-none text-navy">
            {emReal ? "A ronda em revista" : "A Semana em Revista"}
          </h1>
        </header>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {(manchetesReais ?? JORNAL.manchetes).map((m, i) => (
            <div key={`${m.titulo}-${i}`} className="border-l-2 border-gold pl-4">
              <div className="mono text-[10px] uppercase tracking-widest text-gold">{m.tag}</div>
              <h2 className="mt-1 font-serif text-xl leading-tight text-navy">{m.titulo}</h2>
            </div>
          ))}
        </div>
      </article>

      {/* Faixa de dashboard */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-sm border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-lg">Demonstração de resultados</h3>
            {fin && (
              <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">T{turnoFin}</span>
            )}
          </div>
          {fin ? (
            <>
              <dl className="mono mt-3 space-y-1 text-sm">
                <Linha rotulo="Receita" valor={fmtEUR(fin.pnl.receita.total)} />
                <Linha rotulo="Margem bruta" valor={fmtEUR(fin.pnl.margem_bruta)} />
                <Linha rotulo="Resultado líquido" valor={fmtEUR(fin.pnl.resultado_liquido)} destaque />
                <Linha rotulo="Caixa final" valor={fmtEUR(fin.balanco.ativo.caixa)} />
              </dl>
              <button
                type="button"
                onClick={() => setSala("gabinete")}
                className="mono mt-3 text-[10px] uppercase tracking-widest text-gold hover:underline"
              >
                Ver detalhe no histórico →
              </button>
            </>
          ) : emReal ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Sem P&amp;L disponível — o relatório completo surge após o primeiro turno resolvido.
            </p>
          ) : (
            <dl className="mono mt-3 space-y-1 text-sm">
              <Linha rotulo="Receita" valor={`${(JORNAL.demonstracao.receita / 1000).toFixed(1)}k €`} />
              <Linha rotulo="Custos" valor={`(${(JORNAL.demonstracao.custos / 1000).toFixed(1)}k €)`} />
              <Linha rotulo="EBITDA" valor={`${(JORNAL.demonstracao.ebitda / 1000).toFixed(1)}k €`} destaque />
            </dl>
          )}
        </div>

        <div className="rounded-sm border bg-card p-4">
          <h3 className="font-serif text-lg">Decisões desta ronda</h3>
          {emReal ? (
            notas.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Sem eventos de decisão registados neste turno.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {notas.slice(0, 8).map((n, i) => {
                  const estado = n.acao.includes("ignorad") || n.acao.includes("invalid") || n.acao.includes("anulad")
                    ? "anulado"
                    : n.acao.includes("clampad") || n.acao.includes("reduzid") || n.acao.includes("subid") || n.acao.includes("limit") || n.acao.includes("status_quo") || n.acao.includes("credito_automatica")
                      ? "ajustado"
                      : "aplicado";
                  return (
                    <li key={i} className="flex items-start justify-between gap-2">
                      <div>
                        <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {n.acao.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className={`mono shrink-0 text-[10px] uppercase tracking-widest ${CORES_ESTADO[estado as keyof typeof CORES_ESTADO]}`}>
                        {estado}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {decisoesReais.map((d, i) => (
                <li key={i} className="flex items-start justify-between gap-2">
                  <div>
                    <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{d.pasta}</span>
                    <div className="text-foreground">{d.texto}</div>
                  </div>
                  <span className={`mono shrink-0 text-[10px] uppercase tracking-widest ${CORES_ESTADO[d.estado]}`}>
                    {d.estado}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>


        <div className="rounded-sm border bg-card p-4">
          <h3 className="font-serif text-lg">Concorrência (valor)</h3>
          {concorrenciaReal.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Ainda sem rivais avaliados.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {concorrenciaReal.map((c, i) => (
                <li key={`${c.inicial}-${i}`} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-sm border font-serif"
                      style={{ backgroundColor: "var(--navy)", color: "var(--gold)", borderColor: "var(--gold)" }}
                    >
                      {c.inicial}
                    </span>
                    {emReal && <span className="text-sm text-foreground">{c.nome}</span>}
                  </div>
                  <span className="mono text-lg">{(c.valor / 1000).toFixed(0)}k €</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`flex justify-between border-b py-1 last:border-0 ${destaque ? "text-gold" : ""}`}>
      <dt>{rotulo}</dt>
      <dd>{valor}</dd>
    </div>
  );
}
