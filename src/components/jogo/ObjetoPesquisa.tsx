import { useState } from "react";
import { Info, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useJogo } from "./JogoContext";
import type { Lugar } from "@/lib/jogo/tipos";

/* ============================================================
 * Metadados por lugar — título, explicação e tipo enviado ao backend.
 * (CHRO fica com a versão antiga; será redesenhado na próxima mensagem.)
 * ============================================================ */
type MetaLugar = {
  objetoRotulo: string;
  objetoIcone: string;
  tituloPainel: string;
  subtitulo: string;
  descricao: string;
  tipoAcao: string;
};

const META: Record<Lugar, MetaLugar> = {
  CEO: {
    objetoRotulo: "Telefone",
    objetoIcone: "📞",
    tituloPainel: "Pesquisa da concorrência",
    subtitulo: "Ligar a um contacto",
    descricao:
      "Revela pistas sobre um rival: perfil aparente, preços e capacidade estimados. A informação pode chegar com 1 turno de atraso.",
    tipoAcao: "concorrencia",
  },
  CFO: {
    objetoRotulo: "Relatório do banco",
    objetoIcone: "📊",
    tituloPainel: "Estudo económico",
    subtitulo: "Ler relatório do banco central",
    descricao:
      "Revela a trajetória provável da economia (juro, inflação, crescimento e confiança) nos próximos turnos.",
    tipoAcao: "estudo_economico",
  },
  COO: {
    objetoRotulo: "Nota do investigador",
    objetoIcone: "🧪",
    tituloPainel: "Análise ao I&D",
    subtitulo: "Consultar o investigador de processo",
    descricao:
      "Revela o progresso da I&D e a distância ao próximo breakthrough — produto ou processo.",
    tipoAcao: "analise_id",
  },
  CMO: {
    objetoRotulo: "Dossiê de mercado",
    objetoIcone: "📁",
    tituloPainel: "Pesquisa de mercado",
    subtitulo: "Abrir dossiê de retalho",
    descricao:
      "Revela que linhas e atributos o mercado procura e a sensibilidade ao preço por segmento.",
    tipoAcao: "pesquisa_mercado",
  },
  CHRO: {
    objetoRotulo: "Representante",
    objetoIcone: "🤝",
    tituloPainel: "Escuta ao terreno",
    subtitulo: "Ouvir representante dos colaboradores",
    descricao: "Sonda um colaborador aleatório — motivação, stress e necessidades aparentes.",
    tipoAcao: "dialogo",
  },
};

type Nivel = "L1" | "L2" | "L3";

const NIVEIS: { id: Nivel; rotulo: string; custo: number; confianca: number; nota: string }[] = [
  { id: "L1", rotulo: "Nível 1", custo: 1_000, confianca: 0.75, nota: "Rápido e barato" },
  { id: "L2", rotulo: "Nível 2", custo: 3_000, confianca: 0.85, nota: "Equilibrado" },
  { id: "L3", rotulo: "Nível 3", custo: 6_000, confianca: 0.95, nota: "Máximo detalhe" },
];

function fmtEur(v: number | null | undefined): string {
  if (v == null) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k €`;
  return `${v} €`;
}

/* ============================================================
 * Componente principal
 * ============================================================ */
export function ObjetoPesquisa({ lugar }: { lugar: Lugar }) {
  const { pesquisas, usarPesquisa, podeEditar, ronda_indice, chro_representante_id, colaboradores } = useJogo();
  const meta = META[lugar];
  const lista = pesquisas[lugar] ?? [];
  const editavel = podeEditar(lugar);
  const [nivelEscolhido, setNivelEscolhido] = useState<Nivel>("L2");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // "1 pesquisa por lugar por turno" — bate com a regra do backend.
  const jaUsouNesteTurno = lista.some((p) => p.ronda_indice === ronda_indice);
  const bloqueado = !editavel || jaUsouNesteTurno;
  const escolhido = NIVEIS.find((n) => n.id === nivelEscolhido)!;

  async function confirmar() {
    setErro(null);
    setOcupado(true);
    try {
      if (lugar === "CHRO") {
        // Diálogo — sem níveis, sem custo.
        await usarPesquisa(lugar, { tipo: meta.tipoAcao });
      } else {
        await usarPesquisa(lugar, { tipo: meta.tipoAcao, nivel: escolhido.id, custo: escolhido.custo });
      }
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  // ── Variante CHRO: sem níveis, representante destacado ──
  if (lugar === "CHRO") {
    const rep = colaboradores.find((c) => c.id === chro_representante_id) ?? null;
    return (
      <section className="rounded-sm border bg-card">
        <header
          className="flex items-start gap-4 border-b p-4"
          style={{ background: "color-mix(in oklab, var(--gold) 6%, var(--card))" }}
        >
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border bg-navy text-2xl"
            style={{ borderColor: "var(--gold)" }}
            aria-hidden
          >
            {meta.objetoIcone}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mono text-[10px] uppercase tracking-[0.24em] text-gold">
              Diálogo · uma vez por turno
            </div>
            <h3 className="mt-0.5 font-serif text-xl leading-tight">Ouvir o representante do turno</h3>
            <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
              <span>
                Cada turno um funcionário é designado como representante. Uma conversa franca revela
                moral, stress, necessidades e o clima do resto da equipa.
              </span>
            </p>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="text-xs text-muted-foreground">
            {rep ? (
              <div>
                Representante deste turno:{" "}
                <strong className="font-serif text-foreground">
                  #{rep.id.slice(0, 4).toUpperCase()}
                </strong>{" "}
                <span className="mono text-[10px] uppercase tracking-widest text-gold">
                  {rep.arquetipo ?? "—"}
                </span>
              </div>
            ) : (
              <div>Ainda sem representante — precisa de colaboradores ativos.</div>
            )}
            <div className="mono mt-1 text-[10px] uppercase tracking-widest">1 diálogo por turno</div>
          </div>
          <button
            type="button"
            onClick={confirmar}
            disabled={bloqueado || ocupado || !rep}
            className="inline-flex items-center gap-2 rounded-sm bg-navy px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: "var(--gold)" }}
          >
            {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-gold" />}
            {ocupado ? "A dialogar…" : jaUsouNesteTurno ? "Já dialogou este turno" : "Dialogar"}
          </button>
        </div>

        {erro && (
          <div className="border-b bg-destructive/5 px-4 py-2 text-sm text-destructive">
            <XCircle className="mr-1 inline h-3.5 w-3.5" /> {erro}
          </div>
        )}

        <div>
          <div className="mono flex items-center justify-between border-b px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <span>Diálogos anteriores</span>
            <span>{lista.length} registo{lista.length === 1 ? "" : "s"}</span>
          </div>
          <ul className="divide-y">
            {lista.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">Ainda sem diálogos registados.</li>
            )}
            {lista.map((p) => (
              <li key={p.id} className="p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-serif text-sm">Diálogo com representante</div>
                  <div className="mono flex shrink-0 items-baseline gap-3 text-[10px] uppercase tracking-widest">
                    {p.ronda_indice != null && <span className="text-muted-foreground">T{p.ronda_indice}</span>}
                  </div>
                </div>
                {p.resultado ? (
                  <pre className="mt-2 max-h-64 overflow-auto rounded-sm bg-muted/30 p-3 text-xs text-muted-foreground">
                    {JSON.stringify(p.resultado, null, 2)}
                  </pre>
                ) : (
                  <div className="mono mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    Resultado ainda em processamento…
                  </div>
                )}
                <div className="mono mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {new Date(p.criado_em).toLocaleString("pt-PT")}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }


  return (
    <section className="rounded-sm border bg-card">
      {/* Cabeçalho — objeto e título */}
      <header
        className="flex items-start gap-4 border-b p-4"
        style={{ background: "color-mix(in oklab, var(--gold) 6%, var(--card))" }}
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border bg-navy text-2xl"
          style={{ borderColor: "var(--gold)" }}
          aria-hidden
        >
          {meta.objetoIcone}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mono text-[10px] uppercase tracking-[0.24em] text-gold">
            {meta.objetoRotulo} · {meta.subtitulo}
          </div>
          <h3 className="mt-0.5 font-serif text-xl leading-tight">{meta.tituloPainel}</h3>
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
            <span>{meta.descricao}</span>
          </p>
        </div>
      </header>

      {/* Seleção de nível */}
      <div className="border-b p-4">
        <div className="mono mb-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Escolher nível — mais custo, mais confiança
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {NIVEIS.map((n) => {
            const ativo = nivelEscolhido === n.id;
            return (
              <button
                key={n.id}
                type="button"
                disabled={bloqueado}
                onClick={() => setNivelEscolhido(n.id)}
                className={`flex flex-col rounded-sm border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  ativo
                    ? "border-gold bg-gold/10"
                    : "border-border hover:border-gold/60 hover:bg-muted/40"
                }`}
                style={ativo ? { boxShadow: "inset 0 0 0 1px var(--gold)" } : undefined}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-base">{n.rotulo}</span>
                  <span className="mono text-[10px] uppercase tracking-widest text-gold">
                    {Math.round(n.confianca * 100)}%
                  </span>
                </div>
                <div className="mono mt-1 text-sm">{fmtEur(n.custo)}</div>
                <div className="mono mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {n.nota}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="text-xs text-muted-foreground">
          <div>
            Vai gastar{" "}
            <strong className="font-mono text-foreground">{fmtEur(escolhido.custo)}</strong> em
            caixa para uma pesquisa com{" "}
            <strong className="font-mono text-foreground">
              {Math.round(escolhido.confianca * 100)}%
            </strong>{" "}
            de confiança.
          </div>
          <div className="mono mt-1 text-[10px] uppercase tracking-widest">
            1 pesquisa por lugar por turno
          </div>
        </div>
        <button
          type="button"
          onClick={confirmar}
          disabled={bloqueado || ocupado}
          className="inline-flex items-center gap-2 rounded-sm bg-navy px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: "var(--gold)" }}
        >
          {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-gold" />}
          {ocupado ? "A pesquisar…" : "Confirmar pesquisa"}
        </button>
      </div>

      {erro && (
        <div className="border-b bg-destructive/5 px-4 py-2 text-sm text-destructive">
          <XCircle className="mr-1 inline h-3.5 w-3.5" /> {erro}
        </div>
      )}

      {/* Pesquisas anteriores */}
      <div>
        <div className="mono flex items-center justify-between border-b px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          <span>Pesquisas anteriores</span>
          <span>
            {lista.length} registo{lista.length === 1 ? "" : "s"}
          </span>
        </div>
        <ul className="divide-y">
          {lista.length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">Ainda sem pesquisas registadas.</li>
          )}
          {lista.map((p) => (
            <li key={p.id} className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-serif text-sm">
                  {meta.tituloPainel}
                  {p.nivel ? (
                    <span className="mono ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {p.nivel === "L1" ? "Nível 1" : p.nivel === "L2" ? "Nível 2" : p.nivel === "L3" ? "Nível 3" : p.nivel}
                    </span>
                  ) : null}
                </div>
                <div className="mono flex shrink-0 items-baseline gap-3 text-[10px] uppercase tracking-widest">
                  {p.ronda_indice != null && (
                    <span className="text-muted-foreground">T{p.ronda_indice}</span>
                  )}
                  <span className="text-foreground">{fmtEur(p.custo)}</span>
                  {p.confianca != null && (
                    <span className="text-gold">
                      conf. {Math.round(Number(p.confianca) * 100)}%
                    </span>
                  )}
                </div>
              </div>
              {p.resultado ? (
                <pre className="mt-2 max-h-64 overflow-auto rounded-sm bg-muted/30 p-3 text-xs text-muted-foreground">
                  {JSON.stringify(p.resultado, null, 2)}
                </pre>
              ) : (
                <div className="mono mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Resultado ainda em processamento…
                </div>
              )}
              <div className="mono mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                {new Date(p.criado_em).toLocaleString("pt-PT")}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
