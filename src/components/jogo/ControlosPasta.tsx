import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { useJogo } from "./JogoContext";
import { EstadoEquipa } from "./EstadoEquipa";
import { TotalComprometidoCompacto } from "./PainelCustosComprometidos";
import type { Lugar } from "@/lib/jogo/tipos";
import { capacidadeCOO, tierEfetivo, MAO_H, MAO_MULT, MACH_H, RITMO_MULT, type Tier, type Ritmo } from "@/lib/jogo/capacidade";
import { ID_NOS } from "@/lib/jogo/id-arvore";


const POSTURAS: { valor: string; titulo: string; descricao: string }[] = [
  { valor: "Crescimento", titulo: "Crescimento", descricao: "Prioriza a expansão de vendas e capacidade produtiva." },
  { valor: "Rentabilidade", titulo: "Rentabilidade", descricao: "Foca a margem e a geração de caixa." },
  { valor: "Quota", titulo: "Quota", descricao: "Ganhar mercado mesmo com margem menor." },
  { valor: "Equilibrio", titulo: "Equilíbrio", descricao: "Mistura crescimento, margem e prudência." },
];

/* Payload canónico (schema-decisoes.ts). Aqui apenas os campos essenciais que a UI edita. */
const INICIAL: Record<Lugar, Record<string, unknown>> = {
  CEO: { linhas_saida: [], teto_divida: 500_000, dividendos: 0, postura: "Equilibrio" },
  CFO: { markup: 0.35, emprestimo: 0, amortizar: 0, capex: 0, id_orcamento: 0, tesouraria: "equilibrado", usar_prejuizos: false, seguro: false },
  COO: { producao: { cadeira: 300, mesa: 150, armario: 80 }, tier: "standard", comprar_maquinas: 0, ritmo: "normal", subcontratacao: 0, id_modo: "interno" },
  CMO: { preco: { cadeira: 89, mesa: 249, armario: 399 }, marketing: 5000, canal: "grosso", forca_vendas: 4, pesquisa_mercado: 0 },
  CHRO: { salario: 1.0, formacao: 0, bonus: 0, acoes_pessoas: [], contratacoes: [] },
};


export function ControlosPasta({ lugar }: { lugar: Lugar }) {
  const { podeEditar, submetidos, submeterLugar, decisoes, atualizarRascunho, rascunho, guardarNomeEmpresa, nomeEmpresa, snapshotAtual } = useJogo();
  const editavel = podeEditar(lugar);
  const submetido = submetidos[lugar];

  const guardado = decisoes[lugar]?.payload ?? {};
  const local = rascunho[lugar] ?? {};
  const valor = { ...INICIAL[lugar], ...guardado, ...local } as Record<string, any>;

  const [ocupado, setOcupado] = useState(false);
  const [nomeLocal, setNomeLocal] = useState(nomeEmpresa);
  useEffect(() => setNomeLocal(nomeEmpresa), [nomeEmpresa]);

  function up(patch: Record<string, unknown>) {
    atualizarRascunho(lugar, patch);
  }

  async function submeter() {
    setOcupado(true);
    try { await submeterLugar(lugar); } finally { setOcupado(false); }
  }

  return (
    <section className="rounded-sm border bg-card">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-serif text-lg">Decisões · {lugar}</h3>
          <p className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {editavel ? (submetido ? "Submetido" : "A preencher") : "Só-leitura"}
          </p>
        </div>
        {!editavel && <Lock className="h-4 w-4 text-muted-foreground" />}
      </header>

      <div className="space-y-5 p-4">
        {lugar === "CEO" && (
          <>
            <Campo rotulo="Nome da empresa">
              <input
                type="text"
                value={nomeLocal}
                disabled={!editavel}
                onChange={(e) => setNomeLocal(e.target.value)}
                onBlur={() => nomeLocal !== nomeEmpresa && guardarNomeEmpresa(nomeLocal)}
                className="w-full rounded-sm border bg-background px-3 py-2 font-serif focus:border-gold focus:outline-none disabled:opacity-60"
              />
            </Campo>
            <NumericoField rotulo="Teto de dívida (€)" v={valor.teto_divida} min={0} max={2_000_000} step={10_000} onChange={(n) => up({ teto_divida: n })} disabled={!editavel} />
            <NumericoField rotulo="Dividendos (€)" v={valor.dividendos} min={0} max={500_000} step={1_000} onChange={(n) => up({ dividendos: n })} disabled={!editavel} />
            <Campo rotulo="Postura estratégica">
              <div className="grid gap-1.5 sm:grid-cols-2">
                {POSTURAS.map((p) => {
                  const ativo = valor.postura === p.valor;
                  return (
                    <button
                      key={p.valor}
                      type="button"
                      disabled={!editavel}
                      onClick={() => up({ postura: p.valor })}
                      className={`rounded-sm border p-2 text-left transition-colors disabled:opacity-60 ${
                        ativo ? "border-gold bg-gold/10" : "border-border hover:bg-muted"
                      }`}
                    >
                      <div className="font-serif text-sm">{p.titulo}</div>
                      <div className="text-[11px] leading-snug text-muted-foreground">{p.descricao}</div>
                    </button>
                  );
                })}
              </div>
            </Campo>
          </>
        )}

        {lugar === "CFO" && (
          <>
            <NumericoField rotulo="Empréstimo novo (€)" v={valor.emprestimo} min={0} max={500_000} step={5_000} onChange={(n) => up({ emprestimo: n })} disabled={!editavel} />
            <NumericoField rotulo="Amortizar (€)" v={valor.amortizar} min={0} max={500_000} step={5_000} onChange={(n) => up({ amortizar: n })} disabled={!editavel} />
            <NumericoField rotulo="CAPEX (€)" v={valor.capex} min={0} max={500_000} step={5_000} onChange={(n) => up({ capex: n })} disabled={!editavel} />
            <NumericoField rotulo="Orçamento I&D (€)" v={valor.id_orcamento} min={0} max={200_000} step={1_000} onChange={(n) => up({ id_orcamento: n })} disabled={!editavel} />
            <Opcoes rotulo="Tesouraria" v={valor.tesouraria} opcoes={["conservador","equilibrado","agressivo"]} onChange={(o) => up({ tesouraria: o })} disabled={!editavel} />
            <PrejuizosBox
              prejuizos={Number((snapshotAtual as any)?.prejuizos_acum ?? 0)}
              ativo={!!valor.usar_prejuizos}
              onChange={(t) => up({ usar_prejuizos: t })}
              disabled={!editavel}
            />
            <SeguroBox ativo={!!valor.seguro} onChange={(t) => up({ seguro: t })} disabled={!editavel} />
          </>
        )}

        {lugar === "COO" && (
          <>
            {(["cadeira","mesa","armario"] as const).map((p) => (
              <NumericoField key={p} rotulo={`Produção · ${p}`} v={valor.producao?.[p] ?? 0} min={0} max={500} step={10}
                onChange={(n) => up({ producao: { ...(valor.producao ?? {}), [p]: n } })} disabled={!editavel} unidade="un" />
            ))}
            <OpcoesDescr
              rotulo="Tier"
              v={valor.tier}
              opcoes={[
                { valor: "standard", titulo: "Standard", descricao: "Sem I&D. Custo base." },
                { valor: "fine", titulo: "Fine", descricao: "Requer FINE. +58% mão-de-obra, melhor qualidade." },
                { valor: "artisan", titulo: "Artisan", descricao: "Requer ARTISAN. +110% mão-de-obra, top qualidade." },
              ]}
              onChange={(o) => up({ tier: o })}
              disabled={!editavel}
            />
            <MaquinasField
              v={valor.comprar_maquinas}
              maquinasAtuais={Number((snapshotAtual as any)?.maquinas ?? 0)}
              onChange={(n) => up({ comprar_maquinas: n })}
              disabled={!editavel}
            />
            <OpcoesDescr
              rotulo="Ritmo"
              v={valor.ritmo}
              opcoes={[
                { valor: "ferias", titulo: "Férias", descricao: "Reinicia o stress mas produz ~0 no turno." },
                { valor: "folga", titulo: "Folga", descricao: "Alivia stress; reduz capacidade." },
                { valor: "normal", titulo: "Normal", descricao: "Ritmo base (160 h/trabalhador)." },
                { valor: "horas_extra", titulo: "Horas extra", descricao: "+40 h/trabalhador; mão-de-obra a 1,5×; +stress." },
              ]}
              onChange={(o) => up({ ritmo: o })}
              disabled={!editavel}
            />
            <Slider rotulo="Subcontratação" v={valor.subcontratacao} min={0} max={1} step={0.05} onChange={(n) => up({ subcontratacao: n })} disabled={!editavel} sufixo={(v) => `${Math.round(v*100)}%`} />
            <OpcoesDescr
              rotulo="Modo I&D"
              v={valor.id_modo}
              opcoes={[
                { valor: "interno", titulo: "Interno", descricao: "Investigadores desenvolvem ao longo dos turnos (custo = salário dos investigadores)." },
                { valor: "licenca", titulo: "Licença", descricao: "Pagamento único de €45.000 — desbloqueia já a tecnologia." },
              ]}
              onChange={(o) => up({ id_modo: o })}
              disabled={!editavel}
            />
            <PainelCapacidadeCOO valor={valor} snapshot={snapshotAtual} />
          </>
        )}

        {lugar === "CMO" && (
          <>
            {(["cadeira","mesa","armario"] as const).map((p) => (
              <PrecoLinha
                key={p}
                produto={p}
                v={Number(valor.preco?.[p] ?? 0)}
                onChange={(n) => up({ preco: { ...(valor.preco ?? {}), [p]: n } })}
                disabled={!editavel}
              />
            ))}
            <Campo rotulo="Marketing (€)">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={valor.marketing ?? 0}
                    min={0}
                    max={80_000}
                    step={500}
                    disabled={!editavel}
                    onChange={(e) => up({ marketing: Number(e.target.value) })}
                    className="mono w-32 rounded-sm border bg-background px-2 py-1 text-sm disabled:opacity-60"
                  />
                  <span className="mono text-[10px] uppercase text-muted-foreground">€ · por turno</span>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Aumenta apelo e alcance com retornos decrescentes (cada euro extra rende menos).
                </p>
              </div>
            </Campo>
            <OpcoesDescr
              rotulo="Canal"
              v={valor.canal}
              opcoes={[
                { valor: "grosso", titulo: "Grosso", descricao: "Preço realizado ×0,85, +10% alcance — mais volume a margem menor." },
                { valor: "direto", titulo: "Direto", descricao: "Preço ×1,00, marca +2/turno, −10% alcance; marketing rende ×1,15." },
                { valor: "exportacao", titulo: "Exportação", descricao: "Preço ×0,72; abre procura externa adicional." },
              ]}
              onChange={(o) => up({ canal: o })}
              disabled={!editavel}
            />
            <ForcaVendasField
              v={Number(valor.forca_vendas ?? 0)}
              onChange={(n) => up({ forca_vendas: n })}
              disabled={!editavel}
            />
            <NumericoField rotulo="Pesquisa de mercado (€)" v={valor.pesquisa_mercado} min={0} max={40_000} step={500} onChange={(n) => up({ pesquisa_mercado: n })} disabled={!editavel} />
          </>
        )}

        {lugar === "CHRO" && (
          <>
            <Slider rotulo="Salário global (× mercado)" v={valor.salario} min={0.7} max={1.6} step={0.05} onChange={(n) => up({ salario: n })} disabled={!editavel} sufixo={(v) => v.toFixed(2)} />
            <NumericoField rotulo="Formação (€)" v={valor.formacao} min={0} max={40_000} step={500} onChange={(n) => up({ formacao: n })} disabled={!editavel} />
            <NumericoField rotulo="Bónus (€)" v={valor.bonus} min={0} max={80_000} step={500} onChange={(n) => up({ bonus: n })} disabled={!editavel} />
            <p className="mono rounded-sm border border-dashed border-gold/40 bg-gold/5 p-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Promoções, despedimentos e contratações fazem-se no roster ao lado — cada pessoa tem o seu menu.
            </p>
          </>
        )}

        <div className="space-y-3 border-t pt-4">
          <EstadoEquipa />
          <TotalComprometidoCompacto />
          <div className="flex justify-end">
            <button
              disabled={!editavel || submetido || ocupado}
              onClick={submeter}
              className="mono inline-flex items-center gap-1.5 rounded-sm bg-navy px-3 py-2 text-[11px] uppercase tracking-widest text-paper transition-colors hover:bg-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submetido && <Check className="h-3 w-3 text-gold" />}
              {submetido ? "Submetido" : ocupado ? "A submeter…" : "Submeter o meu ecrã"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mono block text-[10px] uppercase tracking-widest text-muted-foreground">{rotulo}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function NumericoField(props: { rotulo: string; v: number; min: number; max: number; step: number; onChange: (n: number) => void; disabled?: boolean; unidade?: string }) {
  return (
    <Campo rotulo={props.rotulo}>
      <div className="flex items-center gap-2">
        <input type="number" value={props.v ?? 0} min={props.min} max={props.max} step={props.step}
          disabled={props.disabled}
          onChange={(e) => props.onChange(Number(e.target.value))}
          className="mono w-32 rounded-sm border bg-background px-2 py-1 text-sm disabled:opacity-60" />
        {props.unidade && <span className="mono text-[10px] uppercase text-muted-foreground">{props.unidade}</span>}
      </div>
    </Campo>
  );
}

function Slider(props: { rotulo: string; v: number; min: number; max: number; step: number; onChange: (n: number) => void; disabled?: boolean; sufixo?: (v: number) => string }) {
  return (
    <Campo rotulo={props.rotulo}>
      <div className="flex items-center gap-3">
        <input type="range" value={props.v ?? props.min} min={props.min} max={props.max} step={props.step}
          disabled={props.disabled} onChange={(e) => props.onChange(Number(e.target.value))}
          className="flex-1 accent-[var(--gold)] disabled:opacity-50" />
        <span className="mono w-16 text-right text-xs">{props.sufixo ? props.sufixo(props.v ?? props.min) : props.v}</span>
      </div>
    </Campo>
  );
}

function Toggle({ rotulo, v, onChange, disabled }: { rotulo: string; v: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Campo rotulo={rotulo}>
      <button disabled={disabled} onClick={() => onChange(!v)}
        className={`inline-flex h-6 w-11 items-center rounded-full border ${v ? "bg-gold border-gold" : "bg-muted border-border"} disabled:opacity-50`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${v ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </Campo>
  );
}

function Opcoes({ rotulo, v, opcoes, onChange, disabled }: { rotulo: string; v: string; opcoes: string[]; onChange: (o: string) => void; disabled?: boolean }) {
  return (
    <Campo rotulo={rotulo}>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map((o) => (
          <button key={o} disabled={disabled} onClick={() => onChange(o)}
            className={`rounded-sm border px-2.5 py-1 text-xs disabled:opacity-50 ${v === o ? "border-gold bg-gold/10" : "border-border text-muted-foreground hover:bg-muted"}`}>
            {o}
          </button>
        ))}
      </div>
    </Campo>
  );
}

function PrejuizosBox({ prejuizos, ativo, onChange, disabled }: { prejuizos: number; ativo: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const tem = prejuizos > 0;
  return (
    <Campo rotulo="Usar prejuízos acumulados">
      <div className="space-y-2 rounded-sm border border-dashed border-border p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {tem ? (
              <>Prejuízos por usar: <span className="mono text-foreground">€{prejuizos.toLocaleString("pt-PT")}</span></>
            ) : (
              "Sem prejuízos acumulados a usar"
            )}
          </div>
          <button
            type="button"
            disabled={disabled || !tem}
            onClick={() => onChange(!ativo)}
            className={`inline-flex h-6 w-11 items-center rounded-full border ${ativo ? "bg-gold border-gold" : "bg-muted border-border"} disabled:opacity-50`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${ativo ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Ao usar, cria escudo fiscal que reduz o imposto do turno.
        </p>
      </div>
    </Campo>
  );
}

function SeguroBox({ ativo, onChange, disabled }: { ativo: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Campo rotulo="Seguro">
      <div className="space-y-2 rounded-sm border border-dashed border-border p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Custo: <span className="mono text-foreground">~€1.500/turno</span>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!ativo)}
            className={`inline-flex h-6 w-11 items-center rounded-full border ${ativo ? "bg-gold border-gold" : "bg-muted border-border"} disabled:opacity-50`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${ativo ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Reduz em ~50% o impacto financeiro de eventos adversos neste turno.
        </p>
      </div>
    </Campo>
  );
}

/* ============================ Helpers COO ============================ */



function OpcoesDescr({
  rotulo, v, opcoes, onChange, disabled,
}: {
  rotulo: string;
  v: string;
  opcoes: { valor: string; titulo: string; descricao: string }[];
  onChange: (o: string) => void;
  disabled?: boolean;
}) {
  return (
    <Campo rotulo={rotulo}>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {opcoes.map((o) => {
          const ativo = v === o.valor;
          return (
            <button
              key={o.valor}
              type="button"
              disabled={disabled}
              onClick={() => onChange(o.valor)}
              className={`rounded-sm border p-2 text-left transition-colors disabled:opacity-60 ${
                ativo ? "border-gold bg-gold/10" : "border-border hover:bg-muted"
              }`}
            >
              <div className="font-serif text-sm">{o.titulo}</div>
              <div className="text-[11px] leading-snug text-muted-foreground">{o.descricao}</div>
            </button>
          );
        })}
      </div>
    </Campo>
  );
}

function MaquinasField({
  v, maquinasAtuais, onChange, disabled,
}: { v: number; maquinasAtuais: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <Campo rotulo="Comprar máquinas">
      <div className="rounded-sm border border-dashed border-border p-3">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          <div className="text-muted-foreground">
            Máquinas atuais: <span className="mono text-foreground">{maquinasAtuais}</span>
          </div>
          <div className="text-muted-foreground">
            Custo por máquina: <span className="mono text-foreground">€60.000</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={v ?? 0}
            min={0}
            max={20}
            step={1}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            className="mono w-24 rounded-sm border bg-background px-2 py-1 text-sm disabled:opacity-60"
          />
          <span className="mono text-[10px] uppercase text-muted-foreground">
            → €{((v ?? 0) * 60_000).toLocaleString("pt-PT")} · frota final: {maquinasAtuais + (v ?? 0)}
          </span>
        </div>
      </div>
    </Campo>
  );
}

function PainelCapacidadeCOO({ valor, snapshot }: { valor: Record<string, any>; snapshot: any }) {
  const snap = (snapshot ?? {}) as Record<string, any>;
  const trabalhadores = Number(snap.trabalhadores ?? 0);
  const supervisores = Number(snap.supervisores ?? 0);
  const gestores = Number(snap.gestores ?? 0);
  const maquinas = Number(snap.maquinas ?? 0) + Math.max(0, Number(valor.comprar_maquinas ?? 0));
  const moralOrg = Number(snap.moral ?? 50);
  const ambicao = 50; const stress = 40;

  const supNeed = Math.ceil(trabalhadores / 8) || 0;
  const gestNeed = trabalhadores > 24 ? Math.ceil(trabalhadores / 24) : 0;
  const descobertos = Math.max(0, trabalhadores - supervisores * 8);
  const coordPen = descobertos * 0.01;
  const prodMult = Math.min(1.4, Math.max(0.5,
    1 + 0.30 * ((moralOrg - 50) / 50)
      - 0.25 * (Math.max(0, stress - 40) / 60)
      + 0.10 * ((ambicao - 50) / 50)
      - coordPen,
  ));

  const idDesbl: string[] = Array.isArray(snap.id?.desbloqueados) ? snap.id.desbloqueados : [];
  const ritmoPedido = (valor.ritmo ?? "normal") as Ritmo;
  const tierPedido = (valor.tier ?? "standard") as Tier;
  const tierRes = tierEfetivo(tierPedido, idDesbl);
  const tier = tierRes.aplicado;

  const cap = capacidadeCOO({
    trabalhadores,
    maquinas,
    prodMult,
    tier,
    ritmo: ritmoPedido,
    alvo: (valor.producao ?? {}) as Record<string, number>,
    subcontratacao: Number(valor.subcontratacao ?? 0),
    automacao: idDesbl.includes("AUTOMACAO"),
  });

  const excede = cap.totalAlvo > 0 && cap.scale < 1;
  const capSubUn = Math.floor(cap.capIntUn * cap.subEff);
  const sub = Math.max(0, Math.min(1, Number(valor.subcontratacao ?? 0)));
  const ritmoMultPct = Math.round(cap.ritmoMult * 100);

  return (
    <div className="space-y-3 rounded-sm border border-gold/30 bg-gold/5 p-3">
      {tierRes.reduzido && (
        <p className="rounded-sm border border-destructive/40 bg-destructive/5 p-2 text-xs font-medium text-destructive">
          Tier <span className="mono">{tierPedido}</span> requer o nó de I&D <span className="mono">{tierRes.faltaNo}</span> — o resolver aplica <span className="mono">{tier}</span>.
        </p>
      )}
      {ritmoPedido === "ferias" && (
        <p className="rounded-sm border border-destructive/40 bg-destructive/5 p-2 text-xs font-medium text-destructive">
          Ritmo <span className="mono">férias</span> — capacidade de mão-de-obra = 0. A produção será nula neste turno.
        </p>
      )}
      <div>
        <div className="mono text-[10px] uppercase tracking-widest text-gold">Capacidade estimada</div>
        {cap.totalAlvo === 0 ? (
          <p className="mt-1 text-sm">Define alvos de produção para veres a capacidade.</p>
        ) : excede ? (
          <>
            <p className="mt-1 text-sm">
              ≈ <span className="mono font-semibold">{cap.producaoUn}</span> de{" "}
              <span className="mono">{cap.totalAlvo}</span> un pedidas · limitada por{" "}
              <span className="font-semibold">{cap.limitante}</span>
            </p>
            <p className="mt-1 text-xs font-medium text-destructive">
              Estás a pedir {cap.totalAlvo}; a capacidade é ~{cap.producaoUn}. Reduz alvos, sobe máquinas, usa horas extra ou aumenta subcontratação.
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm">
            Capacidade suficiente · podes produzir até ~<span className="mono font-semibold">{cap.maxTotalUn}</span> un
            <span className="text-muted-foreground"> (folga ~{Math.round(cap.folga * 100)}%)</span>
          </p>
        )}
        <div className="mono mt-2 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>capLabour ≈ <span className="text-foreground">{Math.round(cap.capLabour)}</span> h</div>
          <div>capMachine ≈ <span className="text-foreground">{Math.round(cap.capMachine)}</span> h</div>
          <div>labNeed ≈ <span className="text-foreground">{Math.round(cap.labNeed)}</span> h</div>
          <div>machNeed ≈ <span className="text-foreground">{Math.round(cap.machNeed)}</span> h</div>
        </div>
        <div className="mono mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          tier <span className="text-foreground">{tier}</span> (mão ×{MAO_MULT[tier].toFixed(2)}) · ritmo <span className="text-foreground">{ritmoPedido.replace("_"," ")}</span> ({ritmoMultPct}% base{cap.overtime > 0 ? ` + ${cap.overtime}h` : ""})
        </div>
      </div>

      <div className="border-t border-gold/20 pt-3">
        <div className="mono text-[10px] uppercase tracking-widest text-gold">I&D · nós desbloqueados</div>
        {idDesbl.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">Nenhum nó desbloqueado ainda. Tier limitado a Standard; sem AUTOMACAO nem LEAN.</p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {idDesbl.map((id) => {
              const no = ID_NOS.find((n) => n.id === id);
              return (
                <span key={id} className="mono rounded-sm border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                  {id}{no ? ` · ${no.nome}` : ""}
                </span>
              );
            })}
          </div>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">
          Tier disponível: <span className="mono">standard</span>
          {idDesbl.includes("FINE") ? <> · <span className="mono">fine</span></> : <> · <span className="mono line-through opacity-60">fine (requer FINE)</span></>}
          {idDesbl.includes("ARTISAN") ? <> · <span className="mono">artisan</span></> : <> · <span className="mono line-through opacity-60">artisan (requer ARTISAN)</span></>}
        </p>
      </div>

      <div className="border-t border-gold/20 pt-3">
        <div className="mono text-[10px] uppercase tracking-widest text-gold">Subcontratação</div>
        {sub === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Desligada. Ativa para adicionar capacidade externa (até 50% da capacidade interna) — +18% custo e −15% qualidade nessas unidades.
          </p>
        ) : cap.totalAlvo === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.round(cap.subEff * 100)}% → +{Math.round(cap.subEff * 100)}% de capacidade sobre a interna (+18% custo, −15% qualidade nessas unidades).
          </p>
        ) : cap.subUn > 0 ? (
          <p className="mt-1 text-sm">
            A <span className="mono">{Math.round(sub * 100)}%</span>{sub > 0.5 && <span className="text-muted-foreground"> (aplicado {Math.round(cap.subEff*100)}% — teto 50%)</span>} →
            {" "}+<span className="mono font-semibold">{cap.subUn}</span> un externas
            <span className="text-muted-foreground"> (interna {cap.capIntUn} un · disponível +{capSubUn} un)</span>
            <span className="text-[11px] text-muted-foreground"> · custo +18%, qualidade −15% nessas unidades</span>
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Disponível mas não utilizada — a produção cabe na capacidade interna ({cap.capIntUn} un ≥ {cap.totalAlvo} un).
          </p>
        )}
      </div>

      <div className="border-t border-gold/20 pt-3">
        <div className="mono text-[10px] uppercase tracking-widest text-gold">Hierarquia de gestão</div>
        <p className="mt-1 text-sm">
          <span className="mono">{trabalhadores}</span> trabalhador{trabalhadores === 1 ? "" : "es"} ·{" "}
          <span className="mono">{supervisores}</span> supervisor{supervisores === 1 ? "" : "es"}{" "}
          <span className="text-muted-foreground">
            ({supNeed === 0 ? "nenhum necessário" : `bastam ${supNeed}`})
          </span>
          {" · "}
          <span className="mono">{gestores}</span> chefe{gestores === 1 ? "" : "s"} de linha{" "}
          <span className="text-muted-foreground">
            ({gestNeed === 0 ? "não necessário abaixo de 24" : `necessário ${gestNeed}`})
          </span>
        </p>
        {descobertos > 0 && (
          <p className="mt-1 text-xs font-medium text-destructive">
            Faltam supervisores — {descobertos} trabalhador{descobertos === 1 ? "" : "es"} descoberto{descobertos === 1 ? "" : "s"} → penalização prodMult −{coordPen.toFixed(2)}
          </p>
        )}
        {descobertos === 0 && (supervisores > supNeed + 1 || (gestNeed === 0 && gestores > 0)) && (
          <p className="mt-1 text-xs text-muted-foreground">
            Estrutura sobredimensionada para a dimensão atual — considera reafectar gestão a produção.
          </p>
        )}
        {descobertos === 0 && supervisores >= supNeed && !(supervisores > supNeed + 1 || (gestNeed === 0 && gestores > 0)) && (
          <p className="mt-1 text-xs text-gold">Estrutura adequada.</p>
        )}
      </div>
    </div>
  );
}


/* ============================ Helpers CMO ============================ */

const REF_PRECO: Record<string, number> = { cadeira: 72, mesa: 150, armario: 245 };
const NOMES_PROD: Record<string, string> = { cadeira: "Cadeira", mesa: "Mesa", armario: "Armário" };

function PrecoLinha({
  produto, v, onChange, disabled,
}: { produto: "cadeira" | "mesa" | "armario"; v: number; onChange: (n: number) => void; disabled?: boolean }) {
  const ref = REF_PRECO[produto];
  const delta = v > 0 ? Math.round(((v - ref) / ref) * 100) : 0;
  return (
    <Campo rotulo={`Preço · ${NOMES_PROD[produto]}`}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={v ?? 0}
          min={20}
          max={999}
          step={1}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mono w-32 rounded-sm border bg-background px-2 py-1 text-sm disabled:opacity-60"
        />
        <span className="mono text-[10px] uppercase text-muted-foreground">€</span>
        <span className="mono ml-auto text-[10px] uppercase text-muted-foreground">
          ref €{ref}
          {v > 0 && (
            <span className={`ml-2 ${delta > 0 ? "text-gold" : delta < 0 ? "text-destructive" : ""}`}>
              {delta > 0 ? "+" : ""}{delta}%
            </span>
          )}
        </span>
      </div>
    </Campo>
  );
}

function ForcaVendasField({
  v, onChange, disabled,
}: { v: number; onChange: (n: number) => void; disabled?: boolean }) {
  const custo = Math.max(0, v) * 2500;
  const apelo = Math.max(0, v) * 4;
  return (
    <Campo rotulo="Força de vendas">
      <div className="space-y-2 rounded-sm border border-dashed border-border p-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={v ?? 0}
            min={0}
            max={40}
            step={1}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            className="mono w-24 rounded-sm border bg-background px-2 py-1 text-sm disabled:opacity-60"
          />
          <span className="mono text-[10px] uppercase text-muted-foreground">vendedores</span>
        </div>
        <div className="mono grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>custo <span className="text-foreground">€{custo.toLocaleString("pt-PT")}</span></div>
          <div>apelo <span className="text-foreground">+{apelo}%</span></div>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          €2.500 por vendedor · +4% de apelo por unidade. Investimento por turno.
        </p>
      </div>
    </Campo>
  );
}

