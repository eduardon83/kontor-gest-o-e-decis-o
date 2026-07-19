import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PainelShell } from "@/components/painel/PainelShell";
import { CopiarCodigo } from "@/components/painel/CopiarCodigo";
import { Campo, Input, Select, Numero } from "@/components/nova-hansa/campos";
import { criarHansa, type NovaHansaInput } from "@/lib/nova-hansa.functions";

export const Route = createFileRoute("/_authenticated/nova-hansa")({
  component: NovaHansaPage,
});

const LUGARES = ["CEO", "CFO", "COO", "CMO", "CHRO"] as const;
type Lugar = (typeof LUGARES)[number];

type Membro = { lugar: Lugar; email: string; nome: string };
type EquipaAlunos = { nome: string; membros: Membro[] };

const AMBITOS: { valor: NovaHansaInput["ambito"]; nome: string }[] = [
  { valor: "intra_turma", nome: "Intra-turma" },
  { valor: "intra_escola", nome: "Intra-escola" },
  { valor: "inter_escola", nome: "Inter-escola" },
];

const MODOS: { valor: NovaHansaInput["modo"]; nome: string; desc: string }[] = [
  { valor: "so_equipas", nome: "Só equipas", desc: "Apenas equipas de alunos competem." },
  { valor: "vs_computador", nome: "vs. Computador", desc: "Alunos jogam contra adversários IA." },
  { valor: "misto", nome: "Misto", desc: "Equipas de alunos e adversários IA em conjunto." },
];

function equipaVazia(indice: number): EquipaAlunos {
  return {
    nome: `Casa ${indice + 1}`,
    membros: LUGARES.map((l) => ({ lugar: l, email: "", nome: "" })),
  };
}

function NovaHansaPage() {
  const navigate = useNavigate();
  const criar = useServerFn(criarHansa);

  const [passo, setPasso] = useState(1);
  const [nome, setNome] = useState("");
  const [ambito, setAmbito] = useState<NovaHansaInput["ambito"]>("intra_turma");
  const industria = "mobiliario" as const;

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [taxaJuro, setTaxaJuro] = useState(2);
  const [inflacao, setInflacao] = useState(2);
  const [crescimento, setCrescimento] = useState(1);
  const [confianca, setConfianca] = useState(100);
  const [elasticidade, setElasticidade] = useState(1.85);
  const [capital, setCapital] = useState(60000);

  const [duracao, setDuracao] = useState(12);
  const [duracaoRondaHoras, setDuracaoRondaHoras] = useState(168); // 1 semana; 0 = manual


  const [modo, setModo] = useState<NovaHansaInput["modo"]>("so_equipas");
  const [nMercados, setNMercados] = useState(1);
  const [nEquipas, setNEquipas] = useState(4);
  const [nIA, setNIA] = useState(0);
  const [equipas, setEquipas] = useState<EquipaAlunos[]>(() =>
    Array.from({ length: 4 }, (_, i) => equipaVazia(i)),
  );

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ codigo: string; competicao_id: string; emails_pendentes: string[] } | null>(null);

  // Sincroniza equipas com nEquipas
  function ajustaEquipas(n: number) {
    setNEquipas(n);
    setEquipas((atual) => {
      if (n === atual.length) return atual;
      if (n > atual.length) {
        return [...atual, ...Array.from({ length: n - atual.length }, (_, i) => equipaVazia(atual.length + i))];
      }
      return atual.slice(0, n);
    });
  }

  function alteraEquipa(idx: number, patch: Partial<EquipaAlunos>) {
    setEquipas((atual) => atual.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }

  function alteraMembro(idxE: number, idxM: number, patch: Partial<Membro>) {
    setEquipas((atual) =>
      atual.map((e, i) =>
        i === idxE ? { ...e, membros: e.membros.map((m, j) => (j === idxM ? { ...m, ...patch } : m)) } : e,
      ),
    );
  }

  const totalEquipas = useMemo(() => (modo === "vs_computador" ? 0 : nEquipas) + (modo === "so_equipas" ? 0 : nIA), [modo, nEquipas, nIA]);

  async function submeter() {
    setEnviando(true);
    setErro(null);
    try {
      const equipasEnviar = modo === "vs_computador" ? [] : equipas.slice(0, nEquipas);
      const res = await criar({
        data: {
          nome: nome.trim(),
          ambito,
          industria,
          seed,
          params: {
            taxa_juro: taxaJuro,
            inflacao,
            crescimento,
            confianca,
            elasticidade,
            capital_inicial: capital,
          },
          duracao_turnos: duracao,
          duracao_ronda_horas: duracaoRondaHoras,

          modo,
          n_mercados: nMercados,
          equipas_alunos: equipasEnviar.map((e) => ({
            nome: e.nome,
            membros: e.membros
              .filter((m) => m.email || m.nome)
              .map((m) => ({ lugar: m.lugar, email: m.email, nome: m.nome })),
          })),
          n_ia: modo === "so_equipas" ? 0 : nIA,
        },
      });
      setResultado(res);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar a Hansa.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PainelShell papel="professor" titulo="Nova Hansa" descricao="Configure um novo jogo em cinco passos.">
      {resultado ? (
        <ResultadoPainel
          resultado={resultado}
          onAbrir={() =>
            navigate({
              to: "/painel/professor/competicao/$id",
              params: { id: resultado.competicao_id },
            })
          }
          onVoltar={() => navigate({ to: "/painel/professor" })}
        />

      ) : (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <Passos actual={passo} total={5} />

          {passo === 1 && (
            <section className="mt-8 space-y-6">
              <h2 className="font-serif text-2xl">Identidade</h2>
              <Campo label="Nome da competição">
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Hansa da Turma 3B" />
              </Campo>
              <Campo label="Âmbito">
                <Select value={ambito} onChange={(v) => setAmbito(v as NovaHansaInput["ambito"])}>
                  {AMBITOS.map((a) => (
                    <option key={a.valor} value={a.valor}>
                      {a.nome}
                    </option>
                  ))}
                </Select>
              </Campo>
              <Campo label="Indústria" hint="Nesta versão, apenas Mobiliário está disponível.">
                <Select value={industria} onChange={() => undefined}>
                  <option value="mobiliario">Mobiliário</option>
                </Select>
              </Campo>
            </section>
          )}

          {passo === 2 && (
            <section className="mt-8 space-y-6">
              <h2 className="font-serif text-2xl">Economia & seed</h2>
              <Campo label="Seed" hint="Determina o mundo económico oculto (procura, custos, eventos).">
                <div className="flex gap-2">
                  <Numero value={seed} onChange={setSeed} min={0} />
                  <button
                    type="button"
                    onClick={() => setSeed(Math.floor(Math.random() * 1_000_000))}
                    className="rounded-md border border-gold px-3 py-2 text-xs font-medium text-navy transition-colors hover:bg-gold/10"
                  >
                    Gerar aleatória
                  </button>
                </div>
              </Campo>

              <div className="grid gap-5 md:grid-cols-2">
                <Campo label="Taxa de juro inicial" hint="0–8 %">
                  <Numero value={taxaJuro} onChange={setTaxaJuro} min={0} max={8} step={0.1} suffix="%" />
                </Campo>
                <Campo label="Inflação" hint="−1–12 %">
                  <Numero value={inflacao} onChange={setInflacao} min={-1} max={12} step={0.1} suffix="%" />
                </Campo>
                <Campo label="Crescimento" hint="0,85–1,15">
                  <Numero value={crescimento} onChange={setCrescimento} min={0.85} max={1.15} step={0.01} />
                </Campo>
                <Campo label="Confiança" hint="70–130">
                  <Numero value={confianca} onChange={setConfianca} min={70} max={130} step={1} />
                </Campo>
                <Campo label="Elasticidade (ELAST)" hint="1,20–2,50 · omissão 1,85">
                  <Numero value={elasticidade} onChange={setElasticidade} min={1.2} max={2.5} step={0.05} />
                </Campo>
                <Campo label="Capital inicial" hint="Omissão €60 000">
                  <Numero value={capital} onChange={setCapital} min={0} step={500} suffix="€" />
                </Campo>
              </div>
            </section>
          )}

          {passo === 3 && (
            <section className="mt-8 space-y-6">
              <h2 className="font-serif text-2xl">Calendário</h2>
              <Campo label="Duração (turnos)" hint="1 a 40 turnos.">
                <Numero value={duracao} onChange={setDuracao} min={1} max={40} />
              </Campo>
              <Campo label="Duração de cada ronda" hint="O relógio do servidor avança quando o prazo expira. 0 = só avanço manual pelo professor.">
                <div className="flex flex-wrap gap-2">
                  {[
                    { h: 0, r: "Manual" },
                    { h: 1, r: "1 hora" },
                    { h: 24, r: "1 dia" },
                    { h: 72, r: "3 dias" },
                    { h: 168, r: "1 semana" },
                  ].map((o) => (
                    <button
                      key={o.h}
                      type="button"
                      onClick={() => setDuracaoRondaHoras(o.h)}
                      className={
                        "rounded-md border px-3 py-1.5 text-sm transition-colors " +
                        (duracaoRondaHoras === o.h ? "border-gold bg-gold/10" : "border-border hover:border-gold/60")
                      }
                    >
                      {o.r}
                    </button>
                  ))}
                </div>
              </Campo>
            </section>
          )}


          {passo === 4 && (
            <section className="mt-8 space-y-6">
              <h2 className="font-serif text-2xl">Equipas & modo</h2>

              <Campo label="Modo de jogo">
                <div className="grid gap-3 md:grid-cols-3">
                  {MODOS.map((m) => (
                    <button
                      type="button"
                      key={m.valor}
                      onClick={() => setModo(m.valor)}
                      className={
                        "rounded-md border p-4 text-left transition-colors " +
                        (modo === m.valor
                          ? "border-gold bg-gold/10"
                          : "border-border hover:border-gold/60")
                      }
                    >
                      <div className="font-serif text-base">{m.nome}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </Campo>

              <div className="grid gap-5 md:grid-cols-3">
                <Campo label="Nº de mercados">
                  <Numero value={nMercados} onChange={(v) => setNMercados(Math.max(1, Math.min(8, v)))} min={1} max={8} />
                </Campo>
                {modo !== "vs_computador" && (
                  <Campo label="Equipas de alunos">
                    <Numero value={nEquipas} onChange={(v) => ajustaEquipas(Math.max(0, Math.min(24, v)))} min={0} max={24} />
                  </Campo>
                )}
                {modo !== "so_equipas" && (
                  <Campo label="Adversários do computador">
                    <Numero value={nIA} onChange={(v) => setNIA(Math.max(0, Math.min(12, v)))} min={0} max={12} />
                  </Campo>
                )}
              </div>

              {modo !== "vs_computador" && nEquipas > 0 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg">Equipas de alunos</h3>
                  {equipas.slice(0, nEquipas).map((eq, i) => (
                    <div key={i} className="rounded-md border border-border bg-background p-4">
                      <div className="mb-3">
                        <Campo label={`Casa ${i + 1} — nome`}>
                          <Input value={eq.nome} onChange={(e) => alteraEquipa(i, { nome: e.target.value })} />
                        </Campo>
                      </div>
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-slate">
                        Lugares (acumulação permitida: CEO+CFO, COO+CHRO, CMO)
                      </p>
                      <div className="grid gap-2">
                        {eq.membros.map((m, j) => (
                          <div key={m.lugar} className="grid gap-2 md:grid-cols-[80px_1fr_1fr]">
                            <div className="flex items-center rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-slate">
                              {m.lugar}
                            </div>
                            <Input
                              placeholder="Nome"
                              value={m.nome}
                              onChange={(e) => alteraMembro(i, j, { nome: e.target.value })}
                            />
                            <Input
                              type="email"
                              placeholder="email@escola.pt"
                              value={m.email}
                              onChange={(e) => alteraMembro(i, j, { email: e.target.value })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="font-mono text-xs text-slate">
                Total de equipas no mercado: <span className="text-gold">{totalEquipas}</span>
              </p>
            </section>
          )}

          {passo === 5 && (
            <section className="mt-8 space-y-6">
              <h2 className="font-serif text-2xl">Abrir Hansa</h2>
              <p className="text-sm text-muted-foreground">
                Ao abrir, gera-se um código único, criam-se mercados, equipas e a ronda inicial (aberta),
                e o servidor gera imediatamente a economia oculta e os colaboradores a partir da seed.
              </p>
              <Resumo
                nome={nome}
                ambito={ambito}
                seed={seed}
                duracao={duracao}
                modo={modo}
                nMercados={nMercados}
                nEquipas={modo === "vs_computador" ? 0 : nEquipas}
                nIA={modo === "so_equipas" ? 0 : nIA}
              />
              {erro && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  {erro}
                </div>
              )}
            </section>
          )}

          <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
            <button
              type="button"
              disabled={passo === 1 || enviando}
              onClick={() => setPasso((p) => Math.max(1, p - 1))}
              className="rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              Anterior
            </button>
            {passo < 5 ? (
              <button
                type="button"
                onClick={() => setPasso((p) => Math.min(5, p + 1))}
                disabled={passo === 1 && nome.trim().length === 0}
                className="rounded-md bg-navy px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-deep disabled:opacity-40"
              >
                Seguinte
              </button>
            ) : (
              <button
                type="button"
                onClick={submeter}
                disabled={enviando || nome.trim().length === 0}
                className="rounded-md bg-gold px-5 py-2 text-sm font-medium text-navy transition-colors hover:brightness-95 disabled:opacity-50"
              >
                {enviando ? "A abrir…" : "Abrir Hansa"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link to="/painel/professor" className="font-mono text-xs uppercase tracking-[0.24em] text-slate hover:text-navy">
          ← Voltar ao painel
        </Link>
      </div>
    </PainelShell>
  );
}

function Passos({ actual, total }: { actual: number; total: number }) {
  const nomes = ["Identidade", "Economia", "Calendário", "Equipas", "Abrir"];
  return (
    <ol className="flex items-center gap-3 overflow-x-auto">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
        const activo = n === actual;
        const feito = n < actual;
        return (
          <li key={n} className="flex items-center gap-2">
            <span
              className={
                "flex h-8 w-8 items-center justify-center rounded-full border font-mono text-xs " +
                (activo
                  ? "border-gold bg-gold text-navy"
                  : feito
                    ? "border-navy bg-navy text-paper"
                    : "border-border bg-card text-slate")
              }
            >
              {n}
            </span>
            <span className={"font-mono text-[11px] uppercase tracking-[0.2em] " + (activo ? "text-navy" : "text-slate")}>
              {nomes[n - 1]}
            </span>
            {n < total && <span className="mx-1 h-px w-6 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

function Resumo(props: {
  nome: string;
  ambito: string;
  seed: number;
  duracao: number;
  modo: string;
  nMercados: number;
  nEquipas: number;
  nIA: number;
}) {
  const linhas = [
    ["Nome", props.nome || "—"],
    ["Âmbito", AMBITOS.find((a) => a.valor === props.ambito)?.nome ?? props.ambito],
    ["Seed", String(props.seed)],
    ["Duração", `${props.duracao} turnos`],
    ["Modo", MODOS.find((m) => m.valor === props.modo)?.nome ?? props.modo],
    ["Mercados", String(props.nMercados)],
    ["Equipas de alunos", String(props.nEquipas)],
    ["Adversários IA", String(props.nIA)],
  ];
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <dl className="grid gap-2 md:grid-cols-2">
        {linhas.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-border/50 py-1 last:border-none md:border-none">
            <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate">{k}</dt>
            <dd className="font-mono text-xs text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ResultadoPainel({
  resultado,
  onAbrir,
  onVoltar,
}: {
  resultado: { codigo: string; competicao_id: string; emails_pendentes: string[] };
  onAbrir: () => void;
  onVoltar: () => void;
}) {
  return (
    <div className="rounded-lg border border-gold bg-card p-8 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold">Hansa aberta</p>
      <h2 className="mt-2 font-serif text-3xl">A sua Hansa está pronta.</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Partilhe o código com os alunos. Eles podem entrar em "Entrar com código de Hansa".
      </p>
      <div className="mt-6 flex items-center justify-between gap-4 rounded-md border border-navy/20 bg-navy p-6 text-paper">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold">Código</p>
          <p className="mt-1 font-mono text-3xl text-paper">{resultado.codigo}</p>
        </div>
        <CopiarCodigo codigo={resultado.codigo} variante="escuro" />
      </div>
      {resultado.emails_pendentes.length > 0 && (
        <div className="mt-6 rounded-md border border-border bg-background p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate">
            {resultado.emails_pendentes.length} email(s) sem conta ainda
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Estes alunos podem registar-se e depois entrar com o código para se juntarem à equipa:
          </p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-foreground">
            {resultado.emails_pendentes.map((e) => (
              <li key={e}>· {e}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={onAbrir}
          className="rounded-md bg-gold px-5 py-2 text-sm font-semibold text-navy hover:brightness-95"
        >
          Abrir a competição →
        </button>
        <button
          onClick={onVoltar}
          className="rounded-md border border-border bg-background px-5 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Voltar às minhas Hansas
        </button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Próximos passos: partilhar o código com as equipas, conduzir uma equipa para demonstrar
        ou avançar o turno quando todos estiverem submetidos.
      </p>
    </div>
  );
}

