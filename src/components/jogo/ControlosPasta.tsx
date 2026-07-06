import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { useJogo } from "./JogoContext";
import type { Lugar } from "@/lib/jogo/tipos";

/* Payload canónico (schema-decisoes.ts). Aqui apenas os campos essenciais que a UI edita. */
const INICIAL: Record<Lugar, Record<string, unknown>> = {
  CEO: { linhas_saida: [], teto_divida: 500_000, dividendos: 0, postura: "" },
  CFO: { markup: 0.35, emprestimo: 0, amortizar: 0, capex: 0, id_orcamento: 0, tesouraria: "equilibrado", usar_prejuizos: false, seguro: false },
  COO: { producao: { cadeira: 300, mesa: 150, armario: 80 }, tier: "standard", comprar_maquinas: 0, ritmo: "normal", subcontratacao: 0, id_modo: "interno" },
  CMO: { preco: { cadeira: 89, mesa: 249, armario: 399 }, marketing: 5000, canal: "grosso", forca_vendas: 4, pesquisa_mercado: 0 },
  CHRO: { salario: 1.0, formacao: 0, bonus: 0, acoes_pessoas: [], contratacoes: [] },
};

export function ControlosPasta({ lugar }: { lugar: Lugar }) {
  const { podeEditar, submetidos, submeterLugar, decisoes, atualizarRascunho, rascunho, guardarNomeEmpresa, nomeEmpresa } = useJogo();
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
              <textarea value={valor.postura ?? ""} disabled={!editavel} onChange={(e) => up({ postura: e.target.value })}
                className="mt-1 w-full rounded-sm border bg-background px-3 py-2 text-sm disabled:opacity-60" rows={2} />
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
            <Toggle rotulo="Usar prejuízos acumulados" v={!!valor.usar_prejuizos} onChange={(t) => up({ usar_prejuizos: t })} disabled={!editavel} />
            <Toggle rotulo="Seguro" v={!!valor.seguro} onChange={(t) => up({ seguro: t })} disabled={!editavel} />
          </>
        )}

        {lugar === "COO" && (
          <>
            {(["cadeira","mesa","armario"] as const).map((p) => (
              <NumericoField key={p} rotulo={`Produção · ${p}`} v={valor.producao?.[p] ?? 0} min={0} max={500} step={10}
                onChange={(n) => up({ producao: { ...(valor.producao ?? {}), [p]: n } })} disabled={!editavel} unidade="un" />
            ))}
            <Opcoes rotulo="Tier" v={valor.tier} opcoes={["standard","fine","artisan"]} onChange={(o) => up({ tier: o })} disabled={!editavel} />
            <NumericoField rotulo="Comprar máquinas" v={valor.comprar_maquinas} min={0} max={20} step={1} onChange={(n) => up({ comprar_maquinas: n })} disabled={!editavel} />
            <Opcoes rotulo="Ritmo" v={valor.ritmo} opcoes={["ferias","folga","normal","horas_extra"]} onChange={(o) => up({ ritmo: o })} disabled={!editavel} />
            <Slider rotulo="Subcontratação" v={valor.subcontratacao} min={0} max={1} step={0.05} onChange={(n) => up({ subcontratacao: n })} disabled={!editavel} sufixo={(v) => `${Math.round(v*100)}%`} />
            <Opcoes rotulo="Modo I&D" v={valor.id_modo} opcoes={["interno","licenca"]} onChange={(o) => up({ id_modo: o })} disabled={!editavel} />
          </>
        )}

        {lugar === "CMO" && (
          <>
            {(["cadeira","mesa","armario"] as const).map((p) => (
              <NumericoField key={p} rotulo={`Preço · ${p}`} v={valor.preco?.[p] ?? 0} min={20} max={999} step={1}
                onChange={(n) => up({ preco: { ...(valor.preco ?? {}), [p]: n } })} disabled={!editavel} unidade="€" />
            ))}
            <NumericoField rotulo="Marketing (€)" v={valor.marketing} min={0} max={80_000} step={500} onChange={(n) => up({ marketing: n })} disabled={!editavel} />
            <Opcoes rotulo="Canal" v={valor.canal} opcoes={["grosso","direto","exportacao"]} onChange={(o) => up({ canal: o })} disabled={!editavel} />
            <NumericoField rotulo="Força de vendas" v={valor.forca_vendas} min={0} max={40} step={1} onChange={(n) => up({ forca_vendas: n })} disabled={!editavel} />
            <NumericoField rotulo="Pesquisa de mercado (€)" v={valor.pesquisa_mercado} min={0} max={40_000} step={500} onChange={(n) => up({ pesquisa_mercado: n })} disabled={!editavel} />
          </>
        )}

        {lugar === "CHRO" && (
          <>
            <Slider rotulo="Salário (× mercado)" v={valor.salario} min={0.7} max={1.6} step={0.05} onChange={(n) => up({ salario: n })} disabled={!editavel} sufixo={(v) => v.toFixed(2)} />
            <NumericoField rotulo="Formação (€)" v={valor.formacao} min={0} max={40_000} step={500} onChange={(n) => up({ formacao: n })} disabled={!editavel} />
            <NumericoField rotulo="Bónus (€)" v={valor.bonus} min={0} max={80_000} step={500} onChange={(n) => up({ bonus: n })} disabled={!editavel} />
            <NumericoField rotulo="Contratar" v={valor.contratar} min={0} max={20} step={1} onChange={(n) => up({ contratar: n })} disabled={!editavel} />
            <NumericoField rotulo="Despedir" v={valor.despedir} min={0} max={20} step={1} onChange={(n) => up({ despedir: n })} disabled={!editavel} />
            <Toggle rotulo="Promover supervisor" v={!!valor.promover_supervisor} onChange={(t) => up({ promover_supervisor: t })} disabled={!editavel} />
            <NumericoField rotulo="Contratar investigadores" v={valor.contratar_investigadores} min={0} max={10} step={1} onChange={(n) => up({ contratar_investigadores: n })} disabled={!editavel} />
          </>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Estado da equipa</div>
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
