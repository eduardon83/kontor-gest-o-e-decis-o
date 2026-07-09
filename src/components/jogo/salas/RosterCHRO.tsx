import { useState } from "react";
import { MoreVertical, UserPlus, X, Loader2 } from "lucide-react";
import { AvatarColaborador } from "../AvatarColaborador";
import { useJogo, type Candidato } from "../JogoContext";
import type { Arquetipo } from "@/lib/jogo/tipos";
import { ARQUETIPOS } from "@/lib/jogo/tipos";
import type { AcaoPessoa, TipoAcaoPessoa } from "@/lib/jogo/schema-decisoes";

const PAPEL_ROTULO: Record<string, string> = {
  trabalhador: "Trabalhador",
  supervisor: "Supervisor",
  gestor_linha: "Chefe de linha",
  investigador: "Investigador",
};

const BASE_SAL_MENSAL = 3320;

function fmtEur(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)} k€`;
  return `${Math.round(v)} €`;
}

function normalizaArq(a: string | null | undefined): Arquetipo {
  if (!a) return "Esteio";
  const cap = a[0].toUpperCase() + a.slice(1).toLowerCase();
  return (ARQUETIPOS as readonly string[]).includes(cap) ? (cap as Arquetipo) : "Esteio";
}

function opcoesPara(papel_org: string): { tipo: TipoAcaoPessoa; label: string }[] {
  switch (papel_org) {
    case "trabalhador":
      return [
        { tipo: "promover_supervisor", label: "Promover a supervisor" },
        { tipo: "promover_merito", label: "Promoção de mérito" },
        { tipo: "despedir", label: "Despedir" },
      ];
    case "supervisor":
      return [
        { tipo: "promover_chefe_linha", label: "Promover a chefe de linha" },
        { tipo: "promover_merito", label: "Promoção de mérito" },
        { tipo: "despedir", label: "Despedir" },
      ];
    default:
      return [
        { tipo: "promover_merito", label: "Promoção de mérito" },
        { tipo: "despedir", label: "Despedir" },
      ];
  }
}

function descreveAcao(
  tipo: TipoAcaoPessoa,
  salarioAtualMensal: number,
  nome: string,
): { titulo: string; efeito: string } {
  const salNovoSupervisor = BASE_SAL_MENSAL * 1.4;
  const salNovoChefe = BASE_SAL_MENSAL * 2.0;
  const salNovoMerito = salarioAtualMensal * 1.12;
  const indemn = salarioAtualMensal * 2;
  switch (tipo) {
    case "promover_supervisor":
      return {
        titulo: `Promover ${nome} a supervisor`,
        efeito: `Salário mensal passa a ${fmtEur(salNovoSupervisor)} (×1,4). +5 moral.`,
      };
    case "promover_chefe_linha":
      return {
        titulo: `Promover ${nome} a chefe de linha`,
        efeito: `Salário mensal passa a ${fmtEur(salNovoChefe)} (×2,0). +5 moral.`,
      };
    case "promover_merito":
      return {
        titulo: `Promoção de mérito a ${nome}`,
        efeito: `Salário mensal passa a ${fmtEur(salNovoMerito)} (+12%). +5 moral.`,
      };
    case "despedir":
      return {
        titulo: `Despedir ${nome}`,
        efeito: `Indemnização de 2× salário mensal = ${fmtEur(indemn)} em caixa no fim do turno.`,
      };
  }
}

export function RosterCHRO() {
  const {
    modo, colaboradores, chro_candidatos, podeEditar,
    chroAcoesPendentes, adicionarAcaoPessoa, removerAcaoPessoa,
    adicionarContratacao, removerContratacao, rascunho, decisoes,
  } = useJogo();
  const editavel = podeEditar("CHRO");

  const contratacoes = (
    (rascunho.CHRO as any)?.contratacoes
    ?? (decisoes.CHRO?.payload as any)?.contratacoes
    ?? []
  ) as { candidato_id: string }[];

  if (modo !== "real" && colaboradores.length === 0) {
    return (
      <section className="rounded-sm border bg-card p-4 text-sm text-muted-foreground">
        Sem colaboradores para mostrar.
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-sm border bg-card">
        <header className="flex items-baseline justify-between border-b px-4 py-3">
          <h3 className="font-serif text-lg">Pessoas · Roster</h3>
          <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {colaboradores.length} colaboradores
          </span>
        </header>
        {colaboradores.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Sem colaboradores registados ainda.</p>
        ) : (
          <ul className="grid gap-3 p-4 sm:grid-cols-2">
            {colaboradores.map((c) => (
              <LinhaColaborador
                key={c.id}
                colaborador={c}
                editavel={editavel}
                pendente={chroAcoesPendentes(c.id)}
                onAplicar={adicionarAcaoPessoa}
                onCancelar={() => removerAcaoPessoa(c.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <PoolCandidatos
        candidatos={chro_candidatos}
        editavel={editavel}
        contratacoes={contratacoes}
        onContratar={(c) => adicionarContratacao({ candidato_id: c.id })}
        onRemover={(id) => removerContratacao(id)}
      />
    </div>
  );
}

/* ============================================================
 * Linha do colaborador
 * ============================================================ */
function LinhaColaborador({
  colaborador,
  editavel,
  pendente,
  onAplicar,
  onCancelar,
}: {
  colaborador: any;
  editavel: boolean;
  pendente: AcaoPessoa | null;
  onAplicar: (a: AcaoPessoa) => void;
  onCancelar: () => void;
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmar, setConfirmar] = useState<TipoAcaoPessoa | null>(null);
  const salarioAtualMensal = BASE_SAL_MENSAL * Number(colaborador.salario_mult ?? 1);

  const arq = normalizaArq(colaborador.arquetipo);
  const variante = (colaborador.avatar_variante === 2 ? 2 : 1) as 1 | 2;

  return (
    <li className="relative flex items-center gap-3 rounded-sm border bg-background p-3">
      <AvatarColaborador arquetipo={arq} variante={variante} size={56} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0 truncate font-serif text-sm">
            {(colaborador.nome && String(colaborador.nome).trim()) || "Colaborador"}
          </div>
          <span className="mono shrink-0 text-[9px] uppercase tracking-widest text-gold">{arq}</span>
        </div>
        <div className="mono truncate text-[10px] uppercase tracking-widest text-muted-foreground">
          {PAPEL_ROTULO[colaborador.papel_org] ?? colaborador.papel_org} · {fmtEur(salarioAtualMensal)}/mês
        </div>
        <div className="mt-2 space-y-1">
          <Barra rotulo="Moral" valor={Math.round(Number(colaborador.motivacao))} />
          <Barra rotulo="Stress" valor={Math.round(Number(colaborador.stress_individual))} inverso />
        </div>
        {pendente && (
          <div className="mono mt-2 flex items-center justify-between rounded-sm border border-gold/60 bg-gold/10 px-2 py-1 text-[10px] uppercase tracking-widest text-gold">
            <span>Pendente · {rotuloAcao(pendente.tipo)}</span>
            <button onClick={onCancelar} className="hover:text-foreground" aria-label="Cancelar">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={!editavel}
        onClick={() => setMenuAberto((s) => !s)}
        aria-label="Ações sobre esta pessoa"
        className="rounded-sm border p-1 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {menuAberto && (
        <div className="absolute right-2 top-12 z-10 w-48 rounded-sm border bg-card shadow-md">
          <ul className="divide-y">
            {opcoesPara(colaborador.papel_org).map((op) => (
              <li key={op.tipo}>
                <button
                  onClick={() => { setMenuAberto(false); setConfirmar(op.tipo); }}
                  className="mono block w-full px-3 py-2 text-left text-[11px] uppercase tracking-widest hover:bg-muted"
                >
                  {op.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmar && (
        <ModalConfirmar
          titulo={descreveAcao(confirmar, salarioAtualMensal).titulo}
          efeito={descreveAcao(confirmar, salarioAtualMensal).efeito}
          onCancel={() => setConfirmar(null)}
          onConfirm={() => {
            onAplicar({ colaborador_id: colaborador.id, tipo: confirmar });
            setConfirmar(null);
          }}
        />
      )}
    </li>
  );
}

function rotuloAcao(t: TipoAcaoPessoa) {
  return {
    promover_supervisor: "Promover a supervisor",
    promover_chefe_linha: "Promover a chefe de linha",
    promover_merito: "Promoção de mérito",
    despedir: "Despedir",
  }[t];
}

/* ============================================================
 * Pool de candidatos
 * ============================================================ */
function PoolCandidatos({
  candidatos,
  editavel,
  contratacoes,
  onContratar,
  onRemover,
}: {
  candidatos: Candidato[];
  editavel: boolean;
  contratacoes: { candidato_id: string }[];
  onContratar: (c: Candidato) => void;
  onRemover: (id: string) => void;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <section className="rounded-sm border bg-card">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-serif text-lg">Recrutamento</h3>
          <p className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Contratações aplicadas no fim do turno · {contratacoes.length} em fila
          </p>
        </div>
        <button
          type="button"
          disabled={!editavel}
          onClick={() => setAberto((s) => !s)}
          className="mono inline-flex items-center gap-2 rounded-sm bg-navy px-3 py-2 text-[11px] uppercase tracking-widest text-paper hover:bg-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserPlus className="h-3.5 w-3.5 text-gold" />
          {aberto ? "Fechar" : "Contratar"}
        </button>
      </header>

      {contratacoes.length > 0 && (
        <ul className="divide-y border-b">
          {contratacoes.map((ct) => {
            const cand = candidatos.find((c) => c.id === ct.candidato_id);
            return (
              <li key={ct.candidato_id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <span className="font-serif">
                    Contratação {cand ? `· ${cand.arquetipo}` : "· candidato antigo"}
                  </span>
                  <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {cand ? `${fmtEur(cand.salario_mensal_pedido)}/mês` : "não visível no pool actual"}
                  </div>
                </div>
                <button
                  onClick={() => onRemover(ct.candidato_id)}
                  className="mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  remover
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {aberto && (
        <div className="p-4">
          {candidatos.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> A carregar candidatos…
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {candidatos.map((c) => {
                const jaEmFila = contratacoes.some((x) => x.candidato_id === c.id);
                return (
                  <li key={c.id} className="flex items-start gap-3 rounded-sm border bg-background p-3">
                    <AvatarColaborador
                      arquetipo={normalizaArq(c.arquetipo)}
                      variante={c.avatar_variante}
                      size={48}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="mono text-[10px] uppercase tracking-widest text-gold">
                          {normalizaArq(c.arquetipo)}
                        </span>
                        <span className="mono text-[10px] uppercase tracking-widest">
                          {fmtEur(c.salario_mensal_pedido)}/mês
                        </span>
                      </div>
                      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {c.pistas.map((p, i) => <li key={i}>· {p}</li>)}
                      </ul>
                      <div className="mt-2">
                        <button
                          type="button"
                          disabled={!editavel || jaEmFila}
                          onClick={() => onContratar(c)}
                          className="mono rounded-sm border border-gold bg-gold/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-gold hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {jaEmFila ? "Em fila" : "Adicionar à fila"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

/* ============================================================
 * Modal de confirmação
 * ============================================================ */
function ModalConfirmar({
  titulo, efeito, onConfirm, onCancel,
}: {
  titulo: string; efeito: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-sm border bg-card p-5 shadow-lg">
        <h4 className="font-serif text-lg">{titulo}</h4>
        <p className="mt-2 text-sm text-muted-foreground">{efeito}</p>
        <p className="mono mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          Aplicada no fim do turno · podes cancelar antes de submeter
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="mono rounded-sm border px-3 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="mono inline-flex items-center gap-2 rounded-sm bg-navy px-3 py-1.5 text-[11px] uppercase tracking-widest text-paper hover:bg-deep"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function Barra({ rotulo, valor, inverso }: { rotulo: string; valor: number; inverso?: boolean }) {
  const bom = inverso ? valor < 40 : valor > 60;
  return (
    <div>
      <div className="mono flex justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
        <span>{rotulo}</span><span>{valor}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(0, Math.min(100, valor))}%`,
            background: bom ? "var(--gold)" : "var(--slate)",
          }}
        />
      </div>
    </div>
  );
}
