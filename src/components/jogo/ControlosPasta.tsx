import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { useJogo } from "./JogoContext";
import { EstadoEquipa } from "./EstadoEquipa";
import type { Lugar } from "@/lib/jogo/tipos";

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

const MAO_MULT: Record<string, number> = { standard: 1.0, fine: 1.58, artisan: 2.1 };
const MAO: Record<string, number> = { cadeira: 0.6, mesa: 1.4, armario: 2.2 };
const MACH_H: Record<string, number> = { cadeira: 1, mesa: 2.5, armario: 4 };

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
  const snap = (snapshot ?? {}) as Record<string, number | undefined>;
  const trabalhadores = Number(snap.trabalhadores ?? 0);
  const supervisores = Number(snap.supervisores ?? 0);
  const maquinas = Number(snap.maquinas ?? 0) + Math.max(0, Number(valor.comprar_maquinas ?? 0));
  const moralOrg = Number(snap.moral ?? 50);
  const ambicao = 50; // aproximação — não disponível no snapshot cliente
  const stress = 40;

  const cobertos = Math.min(trabalhadores, supervisores * 8);
  const descobertos = Math.max(0, trabalhadores - supervisores * 8);
  const coordPen = descobertos * 0.01;
  const prodMult = Math.min(1.4, Math.max(0.5,
    1 + 0.30 * ((moralOrg - 50) / 50)
      - 0.25 * (Math.max(0, stress - 40) / 60)
      + 0.10 * ((ambicao - 50) / 50)
      - coordPen,
  ));

  const ritmo = String(valor.ritmo ?? "normal");
  const overtime = ritmo === "horas_extra" ? 40 : 0;
  const tier = String(valor.tier ?? "standard");
  const idDesbl: string[] = Array.isArray((snap as any).id?.desbloqueados) ? (snap as any).id.desbloqueados : [];
  const automacao = idDesbl.includes("AUTOMACAO") ? 1.15 : 1;

  const capLabour = (trabalhadores * 160 + overtime * trabalhadores) * prodMult;
  const capMachine = maquinas * 450 * prodMult * automacao;

  const alvo = (valor.producao ?? {}) as Record<string, number>;
  const labNeed = (["cadeira","mesa","armario"] as const)
    .reduce((s, p) => s + Number(alvo[p] ?? 0) * MAO[p] * MAO_MULT[tier], 0);
  const machNeed = (["cadeira","mesa","armario"] as const)
    .reduce((s, p) => s + Number(alvo[p] ?? 0) * MACH_H[p], 0);
  const totalAlvo = Number(alvo.cadeira ?? 0) + Number(alvo.mesa ?? 0) + Number(alvo.armario ?? 0);

  const scaleLab = labNeed > 0 ? capLabour / labNeed : Infinity;
  const scaleMach = machNeed > 0 ? capMachine / machNeed : Infinity;
  const scale = Math.min(1, scaleLab, scaleMach);
  const capacidadeAlvo = Math.floor(totalAlvo * (scale === Infinity ? 1 : scale));
  const limitante = scaleLab < scaleMach ? "mão-de-obra" : "máquinas";
  const excede = totalAlvo > 0 && scale < 1;

  return (
    <div className="space-y-3 rounded-sm border border-gold/30 bg-gold/5 p-3">
      <div>
        <div className="mono text-[10px] uppercase tracking-widest text-gold">Capacidade estimada</div>
        <p className="mt-1 text-sm">
          {totalAlvo > 0 ? (
            <>
              ≈ <span className="mono font-semibold">{capacidadeAlvo}</span> de{" "}
              <span className="mono">{totalAlvo}</span> un pedidas · limitada por{" "}
              <span className="font-semibold">{limitante}</span>
            </>
          ) : (
            <>Define alvos de produção para veres a capacidade.</>
          )}
        </p>
        {excede && (
          <p className="mt-1 text-xs font-medium text-destructive">
            Estás a pedir {totalAlvo}; a capacidade é ~{capacidadeAlvo}. Reduz alvos, sobe máquinas ou usa horas extra.
          </p>
        )}
        <div className="mono mt-2 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>capLabour ≈ <span className="text-foreground">{Math.round(capLabour)}</span> h</div>
          <div>capMachine ≈ <span className="text-foreground">{Math.round(capMachine)}</span> h</div>
          <div>labNeed ≈ <span className="text-foreground">{Math.round(labNeed)}</span> h</div>
          <div>machNeed ≈ <span className="text-foreground">{Math.round(machNeed)}</span> h</div>
        </div>
      </div>
      <div className="border-t border-gold/20 pt-3">
        <div className="mono text-[10px] uppercase tracking-widest text-gold">Cobertura de supervisão</div>
        <p className="mt-1 text-sm">
          <span className="mono">{supervisores}</span> supervisor{supervisores === 1 ? "" : "es"} cobre{supervisores === 1 ? "" : "m"}{" "}
          <span className="mono">{supervisores * 8}</span> de <span className="mono">{trabalhadores}</span> trabalhador{trabalhadores === 1 ? "" : "es"}
          {descobertos > 0 ? (
            <> · <span className="font-semibold text-destructive">{descobertos} descoberto{descobertos === 1 ? "" : "s"}</span> → penalização prodMult −{coordPen.toFixed(2)}</>
          ) : (
            <> · <span className="text-gold">rácio adequado</span> (1 supervisor por 8)</>
          )}
        </p>
      </div>
    </div>
  );
}

