import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  submeterDecisao as submeterDecisaoFn,
  executarAcaoInfo,
  atualizarNomeEmpresa as atualizarNomeEmpresaFn,
  atualizarNomePerfil as atualizarNomePerfilFn,
} from "@/lib/jogo.functions";
import { carregarChro as carregarChroFn } from "@/lib/chro.functions";
import type { Lugar, Acesso, SalaId } from "@/lib/jogo/tipos";
import { LUGARES } from "@/lib/jogo/tipos";
import type { AcaoPessoa, Contratacao } from "@/lib/jogo/schema-decisoes";
import {
  gerarRosterDemo, gerarCandidatosDemo, escolherRepresentanteDemo, novoDialogoRegistoDemo,
} from "@/lib/jogo/demo-roster";
import { derivarContagens, MAQUINAS_INICIAIS } from "@/lib/jogo/contagens";

/* ============ Tipos partilhados ============ */
export type Snapshot = Record<string, unknown> & {
  caixa?: number;
  valor?: number;
  turno?: number;
  divida?: number;
  marca?: number;
  ativos?: number;
  resultado?: number;
  fase_economica?: string;
  receita?: number;
  custos?: number;
  ebitda?: number;
  moral?: number;
  quota?: number;
};

export type SnapshotRegisto = {
  ronda_id: string;
  ronda_indice: number;
  snapshot: Snapshot;
};

export type Colaborador = {
  id: string;
  arquetipo: string | null;
  avatar_variante: number;
  papel_org: string;
  motivacao: number;
  stress_individual: number;
  antiguidade: number;
  necessidades: Record<string, unknown>;
  salario_mult: number;
};

export type Rival = { equipa_id: string; nome: string; valor: number };

export type DecisaoRegisto = {
  lugar: Lugar;
  payload: Record<string, unknown>;
  submetido_em: string | null;
  submetido_por: string | null;
};

export type PesquisaRegisto = {
  id: string;
  tipo: string;
  nivel: string | null;
  custo: number | null;
  confianca: number | null;
  resultado: Record<string, unknown> | null;
  criado_em: string;
  ronda_indice: number | null;
  lugar: Lugar;
};

export type Candidato = {
  id: string;
  arquetipo: string;
  avatar_variante: 1 | 2;
  atributos: Record<string, number>;
  salario_mensal_pedido: number;
  salario_mult: number;
  pistas: string[];
  nota: string | null;
};

type DadosJogo = {
  modo: "real" | "demo";
  competicao_id: string | null;
  competicao_nome: string;
  equipa_id: string | null;
  equipa_nome: string;
  meu_lugar_real: Lugar | null;
  ronda_id: string | null;
  ronda_indice: number;
  ronda_total: number;
  ronda_prazo: string | null;
  snapshotAtual: Snapshot | null;
  snapshots: SnapshotRegisto[];
  colaboradores: Colaborador[];
  rivais: Rival[];
  decisoes: Partial<Record<Lugar, DecisaoRegisto>>;
  pesquisas: Partial<Record<Lugar, PesquisaRegisto[]>>;
  chro_representante_id: string | null;
  chro_candidatos: Candidato[];
};

type Estado = DadosJogo & {
  acesso: Acesso;
  setAcesso: (a: Acesso) => void;
  lugarVisto: Lugar;
  setLugarVisto: (l: Lugar) => void;
  sala: SalaId;
  setSala: (s: SalaId) => void;
  podeEditar: (lugar: Lugar) => boolean;
  submetidos: Record<Lugar, boolean>;

  // Estado local do formulário de decisões (payload editável antes de submeter)
  rascunho: Partial<Record<Lugar, Record<string, unknown>>>;
  atualizarRascunho: (lugar: Lugar, payload: Record<string, unknown>) => void;
  submeterLugar: (lugar: Lugar) => Promise<void>;

  // Pesquisa
  usarPesquisa: (
    lugar: Lugar,
    opts: { tipo: string; nivel?: "L1" | "L2" | "L3"; custo?: number },
  ) => Promise<void>;
  pesquisaUsada: (lugar: Lugar) => boolean;

  // CHRO — ações pendentes (aplicadas no submit)
  chroAcoesPendentes: (colaborador_id: string) => AcaoPessoa | null;
  adicionarAcaoPessoa: (a: AcaoPessoa) => void;
  removerAcaoPessoa: (colaborador_id: string) => void;
  adicionarContratacao: (c: Contratacao) => void;
  removerContratacao: (candidato_id: string) => void;

  // Empresa / perfil
  nomeEmpresa: string;
  guardarNomeEmpresa: (n: string) => Promise<void>;
  guardarNomePerfil: (n: string) => Promise<void>;

  recarregar: () => Promise<void>;
  aCarregar: boolean;
};

const Ctx = createContext<Estado | null>(null);

function estadoVazio(): DadosJogo {
  // Estado pré-semeado para o modo demo/tutorial: turno 5 de 16, com histórico
  // coerente com HISTORICO_TURNOS / KPIS (últimos 4 turnos concluídos).
  return {
    modo: "demo",
    competicao_id: null,
    competicao_nome: "Kontor — Demo jogável",
    equipa_id: null,
    equipa_nome: "Marnera & Filhos",
    meu_lugar_real: null,
    ronda_id: null,
    ronda_indice: 5,
    ronda_total: 16,
    ronda_prazo: null,
    snapshotAtual: {
      caixa: 148_500,
      valor: 612_300,
      turno: 4,
      divida: 72_000,
      marca: 42,
      ativos: 8,
      resultado: 46_800,
      fase_economica: "Expansão moderada",
      receita: 118_200,
      custos: 71_400,
      ebitda: 46_800,
      moral: 68,
      quota: 18.4,
      prejuizos_acum: 24_500,
    },
    snapshots: [],
    colaboradores: (() => {
      const roster = gerarRosterDemo("demo:marnera:t5");
      return roster;
    })(),
    rivais: [
      { equipa_id: "demo-a", nome: "Nordis", valor: 704_200 },
      { equipa_id: "demo-b", nome: "Torvel", valor: 588_100 },
      { equipa_id: "demo-c", nome: "Lumiar", valor: 462_900 },
    ],
    decisoes: {
      CEO: {
        lugar: "CEO",
        payload: { postura: "Equilibrio" },
        submetido_em: new Date().toISOString(),
        submetido_por: "demo",
      },
      CFO: {
        lugar: "CFO",
        payload: {},
        submetido_em: new Date().toISOString(),
        submetido_por: "demo",
      },
    },
    pesquisas: {},
    chro_representante_id: (() => {
      const roster = gerarRosterDemo("demo:marnera:t5");
      return escolherRepresentanteDemo(roster, 5);
    })(),
    chro_candidatos: gerarCandidatosDemo("demo:marnera:t5:cands"),
  };
}

/* ============ Provider ============ */
export function JogoProvider({
  equipaId,
  lugarInicial,
  children,
}: {
  equipaId?: string | null;
  lugarInicial?: Lugar | null;
  children: ReactNode;
}) {
  const [dados, setDados] = useState<DadosJogo>(estadoVazio());
  const [acesso, setAcesso] = useState<Acesso>(
    equipaId && lugarInicial
      ? { modo: "jogador", meuLugar: lugarInicial }
      : { modo: "docente" },
  );
  const [lugarVisto, setLugarVisto] = useState<Lugar>(lugarInicial ?? "CEO");
  const [sala, setSala] = useState<SalaId>("gabinete");
  const [rascunho, setRascunho] = useState<Partial<Record<Lugar, Record<string, unknown>>>>({});
  const [aCarregar, setACarregar] = useState<boolean>(!!equipaId);

  const fnSubmeter = useServerFn(submeterDecisaoFn);
  const fnPesquisa = useServerFn(executarAcaoInfo);
  const fnNomeEmpresa = useServerFn(atualizarNomeEmpresaFn);
  const fnNomePerfil = useServerFn(atualizarNomePerfilFn);
  const fnCarregarChro = useServerFn(carregarChroFn);

  const carregar = useCallback(async () => {
    if (!equipaId) {
      setDados(estadoVazio());
      setACarregar(false);
      return;
    }
    setACarregar(true);
    try {
      // Equipa + mercado + competição
      const { data: eq } = await supabase
        .from("equipas")
        .select("id, nome, mercado_id, mercados(competicao_id, competicoes(id, nome, duracao_turnos))")
        .eq("id", equipaId)
        .maybeSingle();

      const comp = (eq as any)?.mercados?.competicoes;
      const competicao_id = comp?.id ?? null;

      // Ronda aberta
      let ronda: { id: string; indice: number; prazo_em: string | null } | null = null;
      if (competicao_id) {
        const { data: r } = await supabase
          .from("rondas")
          .select("id, indice, prazo_em")
          .eq("competicao_id", competicao_id)
          .eq("estado", "aberta")
          .order("indice", { ascending: false })
          .limit(1)
          .maybeSingle();
        ronda = r ?? null;
      }

      // Meu lugar
      const { data: me } = await supabase
        .from("membros_equipa")
        .select("lugar")
        .eq("equipa_id", equipaId)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
        .maybeSingle();

      // Snapshots
      const { data: estadoLinhas } = await supabase
        .from("estado_empresa")
        .select("ronda_id, snapshot, rondas(indice)")
        .eq("equipa_id", equipaId)
        .order("criado_em", { ascending: true });

      const snapshots: SnapshotRegisto[] =
        (estadoLinhas ?? []).map((r: any) => ({
          ronda_id: r.ronda_id,
          ronda_indice: r.rondas?.indice ?? 0,
          snapshot: (r.snapshot ?? {}) as Snapshot,
        })) ?? [];
      const snapshotAtual = snapshots.length ? snapshots[snapshots.length - 1].snapshot : null;

      // Colaboradores
      const { data: cols } = await supabase
        .from("colaboradores")
        .select("id, arquetipo, avatar_variante, papel_org, motivacao, stress_individual, antiguidade, necessidades, salario_mult")
        .eq("equipa_id", equipaId)
        .eq("ativo", true);

      // Rivais (resultados da ronda anterior mais recente)
      let rivais: Rival[] = [];
      if (competicao_id) {
        const { data: ultimasRondas } = await supabase
          .from("rondas")
          .select("id, indice")
          .eq("competicao_id", competicao_id)
          .eq("estado", "resolvida")
          .order("indice", { ascending: false })
          .limit(1);
        const rid = ultimasRondas?.[0]?.id;
        if (rid) {
          const { data: res } = await supabase
            .from("resultados")
            .select("equipa_id, valor, equipas(nome)")
            .eq("ronda_id", rid);
          rivais = (res ?? []).map((r: any) => ({
            equipa_id: r.equipa_id,
            nome: r.equipas?.nome ?? "?",
            valor: Number(r.valor ?? 0),
          }));
        }
      }

      // Decisões da ronda aberta
      let decisoes: Partial<Record<Lugar, DecisaoRegisto>> = {};
      if (ronda) {
        const { data: dec } = await supabase
          .from("decisoes")
          .select("lugar, payload, submetido_em, submetido_por")
          .eq("ronda_id", ronda.id)
          .eq("equipa_id", equipaId);
        for (const d of dec ?? []) {
          decisoes[d.lugar as Lugar] = {
            lugar: d.lugar as Lugar,
            payload: (d.payload ?? {}) as Record<string, unknown>,
            submetido_em: d.submetido_em,
            submetido_por: d.submetido_por,
          };
        }
      }

      // Pesquisas (todas as da equipa)
      const { data: pesqLinhas } = await supabase
        .from("acoes_informacao")
        .select("id, tipo, nivel, custo, confianca, resultado, criado_em, lugar, ronda_id, rondas(indice)")
        .eq("equipa_id", equipaId)
        .order("criado_em", { ascending: false });
      const pesquisas: Partial<Record<Lugar, PesquisaRegisto[]>> = {};
      for (const p of (pesqLinhas ?? []) as any[]) {
        const lg = p.lugar as Lugar;
        (pesquisas[lg] ||= []).push({
          id: p.id,
          tipo: p.tipo,
          nivel: p.nivel,
          custo: p.custo == null ? null : Number(p.custo),
          confianca: p.confianca == null ? null : Number(p.confianca),
          resultado: (p.resultado ?? null) as Record<string, unknown> | null,
          criado_em: p.criado_em,
          ronda_indice: p.rondas?.indice ?? null,
          lugar: lg,
        });
      }

      // CHRO — representante do turno + pool de candidatos determinístico
      let chro_representante_id: string | null = null;
      let chro_candidatos: Candidato[] = [];
      if (ronda?.id) {
        try {
          const r = await fnCarregarChro({ data: { equipa_id: equipaId, ronda_id: ronda.id } });
          chro_representante_id = r.representante_id;
          chro_candidatos = r.candidatos as Candidato[];
        } catch (e) {
          console.warn("[JogoContext] carregarChro falhou", e);
        }
      }

      setDados({
        modo: "real",
        competicao_id,
        competicao_nome: comp?.nome ?? "Hansa",
        equipa_id: equipaId,
        equipa_nome: eq?.nome ?? "Equipa",
        meu_lugar_real: (me?.lugar as Lugar) ?? null,
        ronda_id: ronda?.id ?? null,
        ronda_indice: ronda?.indice ?? 1,
        ronda_total: comp?.duracao_turnos ?? 10,
        ronda_prazo: ronda?.prazo_em ?? null,
        snapshotAtual,
        snapshots,
        colaboradores: (cols ?? []) as Colaborador[],
        rivais,
        decisoes,
        pesquisas,
        chro_representante_id,
        chro_candidatos,
      });
    } finally {
      setACarregar(false);
    }
  }, [equipaId, fnCarregarChro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const submetidos = useMemo<Record<Lugar, boolean>>(() => {
    const s: Record<Lugar, boolean> = { CEO: false, CFO: false, COO: false, CMO: false, CHRO: false };
    for (const l of LUGARES) if (dados.decisoes[l]?.submetido_em) s[l] = true;
    return s;
  }, [dados.decisoes]);

  const podeEditar = useCallback(
    (lugar: Lugar) => {
      if (dados.modo === "demo") return acesso.modo === "docente" || acesso.meuLugar === lugar;
      if (!dados.ronda_id) return false;
      if (!dados.meu_lugar_real) return false;
      return dados.meu_lugar_real === lugar && !submetidos[lugar];
    },
    [dados.modo, dados.ronda_id, dados.meu_lugar_real, submetidos, acesso],
  );

  const atualizarRascunho = useCallback((lugar: Lugar, payload: Record<string, unknown>) => {
    setRascunho((r) => ({ ...r, [lugar]: { ...(r[lugar] ?? {}), ...payload } }));
  }, []);

  const submeterLugar = useCallback(
    async (lugar: Lugar) => {
      if (dados.modo !== "real" || !dados.ronda_id || !dados.equipa_id) return;
      const payload = { ...(dados.decisoes[lugar]?.payload ?? {}), ...(rascunho[lugar] ?? {}) };
      await fnSubmeter({
        data: { ronda_id: dados.ronda_id, equipa_id: dados.equipa_id, lugar, payload, submeter: true },
      });
      await carregar();
    },
    [dados, rascunho, fnSubmeter, carregar],
  );

  const usarPesquisa = useCallback(
    async (
      lugar: Lugar,
      opts: { tipo: string; nivel?: "L1" | "L2" | "L3"; custo?: number },
    ) => {
      // Modo demo: gera resultado fictício local (só CHRO/dialogo tem UI activa por agora).
      if (dados.modo !== "real") {
        if (lugar === "CHRO" && opts.tipo === "dialogo") {
          const rep = dados.colaboradores.find((c) => c.id === dados.chro_representante_id) ?? null;
          const reg = novoDialogoRegistoDemo(rep, dados.colaboradores, dados.ronda_indice);
          setDados((d) => ({
            ...d,
            pesquisas: { ...d.pesquisas, CHRO: [reg, ...(d.pesquisas.CHRO ?? [])] },
          }));
        }
        return;
      }
      if (!dados.ronda_id || !dados.equipa_id) return;
      await fnPesquisa({
        data: {
          ronda_id: dados.ronda_id,
          equipa_id: dados.equipa_id,
          lugar,
          tipo: opts.tipo,
          nivel: opts.nivel,
          custo: opts.custo,
        },
      });
      await carregar();
    },
    [dados, fnPesquisa, carregar],
  );

  // CHRO — rascunho de ações pessoais e contratações
  const lerCHRORasc = useCallback(() => {
    const cur = (rascunho.CHRO ?? {}) as Record<string, unknown>;
    const guardado = (dados.decisoes.CHRO?.payload ?? {}) as Record<string, unknown>;
    const acoes = (Array.isArray(cur.acoes_pessoas) ? cur.acoes_pessoas
      : Array.isArray(guardado.acoes_pessoas) ? guardado.acoes_pessoas : []) as AcaoPessoa[];
    const contr = (Array.isArray(cur.contratacoes) ? cur.contratacoes
      : Array.isArray(guardado.contratacoes) ? guardado.contratacoes : []) as Contratacao[];
    return { acoes, contr };
  }, [rascunho.CHRO, dados.decisoes.CHRO]);

  const chroAcoesPendentes = useCallback(
    (colaborador_id: string) => {
      const { acoes } = lerCHRORasc();
      return acoes.find((a) => a.colaborador_id === colaborador_id) ?? null;
    },
    [lerCHRORasc],
  );

  const adicionarAcaoPessoa = useCallback(
    (a: AcaoPessoa) => {
      // Demo: aplica o efeito directamente no estado local (sem passar por rascunho).
      if (dados.modo !== "real") {
        setDados((d) => {
          const cols = [...d.colaboradores];
          const i = cols.findIndex((c) => c.id === a.colaborador_id);
          if (i < 0) return d;
          const c = cols[i];
          if (a.tipo === "despedir") {
            cols.splice(i, 1);
          } else if (a.tipo === "promover_supervisor") {
            cols[i] = { ...c, papel_org: "supervisor", salario_mult: 1.4, motivacao: Math.min(100, c.motivacao + 5) };
          } else if (a.tipo === "promover_chefe_linha") {
            cols[i] = { ...c, papel_org: "gestor_linha", salario_mult: 2.0, motivacao: Math.min(100, c.motivacao + 5) };
          } else if (a.tipo === "promover_merito") {
            cols[i] = { ...c, salario_mult: Number((c.salario_mult * 1.12).toFixed(3)), motivacao: Math.min(100, c.motivacao + 5) };
          }
          return { ...d, colaboradores: cols };
        });
        return;
      }
      const { acoes, contr } = lerCHRORasc();
      const outros = acoes.filter((x) => x.colaborador_id !== a.colaborador_id);
      setRascunho((r) => ({
        ...r,
        CHRO: { ...(r.CHRO ?? {}), acoes_pessoas: [...outros, a], contratacoes: contr },
      }));
    },
    [dados.modo, lerCHRORasc],
  );

  const removerAcaoPessoa = useCallback(
    (colaborador_id: string) => {
      if (dados.modo !== "real") return; // demo aplica já: nada a retirar do rascunho
      const { acoes, contr } = lerCHRORasc();
      setRascunho((r) => ({
        ...r,
        CHRO: {
          ...(r.CHRO ?? {}),
          acoes_pessoas: acoes.filter((a) => a.colaborador_id !== colaborador_id),
          contratacoes: contr,
        },
      }));
    },
    [dados.modo, lerCHRORasc],
  );

  const adicionarContratacao = useCallback(
    (c: Contratacao) => {
      if (dados.modo !== "real") {
        setDados((d) => {
          const cand = d.chro_candidatos.find((x) => x.id === c.candidato_id);
          if (!cand) return d;
          if (d.colaboradores.some((k) => k.id === `demo-col-hire-${cand.id}`)) return d;
          const novo = {
            id: `demo-col-hire-${cand.id}`,
            arquetipo: cand.arquetipo,
            avatar_variante: cand.avatar_variante,
            papel_org: "trabalhador",
            motivacao: Number(cand.atributos.motivacao ?? 60),
            stress_individual: Number(cand.atributos.stress ?? 30),
            antiguidade: 0,
            necessidades: {},
            salario_mult: cand.salario_mult,
          } as Colaborador;
          return {
            ...d,
            colaboradores: [...d.colaboradores, novo],
            chro_candidatos: d.chro_candidatos.filter((x) => x.id !== c.candidato_id),
          };
        });
        return;
      }
      const { acoes, contr } = lerCHRORasc();
      if (contr.some((x) => x.candidato_id === c.candidato_id)) return;
      setRascunho((r) => ({
        ...r,
        CHRO: { ...(r.CHRO ?? {}), acoes_pessoas: acoes, contratacoes: [...contr, c] },
      }));
    },
    [dados.modo, lerCHRORasc],
  );

  const removerContratacao = useCallback(
    (candidato_id: string) => {
      if (dados.modo !== "real") return; // demo aplica já
      const { acoes, contr } = lerCHRORasc();
      setRascunho((r) => ({
        ...r,
        CHRO: {
          ...(r.CHRO ?? {}),
          acoes_pessoas: acoes,
          contratacoes: contr.filter((c) => c.candidato_id !== candidato_id),
        },
      }));
    },
    [dados.modo, lerCHRORasc],
  );


  const pesquisaUsada = useCallback(
    (lugar: Lugar) => {
      if (dados.modo !== "real" || !dados.ronda_id) return false;
      const list = dados.pesquisas[lugar] ?? [];
      return list.some((p) => {
        // Pesquisa da ronda atual não expõe ronda_id aqui, mas listamos apenas por criado_em > prazo…
        // Alternativa: recontar via cliente. Para simplicidade, se há pelo menos uma acção nesta ronda
        // não conseguimos distinguir sem ronda_id. Confiamos no gate do backend também.
        return !!p; // conservador: se existe alguma na lista, o backend rejeita duplicados na ronda actual
      }) && list.some((p) => new Date(p.criado_em).getTime() > 0);
    },
    [dados],
  );

  const guardarNomeEmpresa = useCallback(
    async (n: string) => {
      if (dados.modo !== "real" || !dados.equipa_id) {
        setDados((d) => ({ ...d, equipa_nome: n }));
        return;
      }
      await fnNomeEmpresa({ data: { equipa_id: dados.equipa_id, nome: n } });
      setDados((d) => ({ ...d, equipa_nome: n }));
    },
    [dados, fnNomeEmpresa],
  );

  const guardarNomePerfil = useCallback(
    async (n: string) => {
      await fnNomePerfil({ data: { nome: n } });
    },
    [fnNomePerfil],
  );

  const value = useMemo<Estado>(
    () => ({
      ...dados,
      acesso,
      setAcesso,
      lugarVisto,
      setLugarVisto,
      sala,
      setSala,
      podeEditar,
      submetidos,
      rascunho,
      atualizarRascunho,
      submeterLugar,
      usarPesquisa,
      pesquisaUsada,
      chroAcoesPendentes,
      adicionarAcaoPessoa,
      removerAcaoPessoa,
      adicionarContratacao,
      removerContratacao,
      nomeEmpresa: dados.equipa_nome,
      guardarNomeEmpresa,
      guardarNomePerfil,
      recarregar: carregar,
      aCarregar,
    }),
    [dados, acesso, lugarVisto, sala, podeEditar, submetidos, rascunho, atualizarRascunho, submeterLugar, usarPesquisa, pesquisaUsada, chroAcoesPendentes, adicionarAcaoPessoa, removerAcaoPessoa, adicionarContratacao, removerContratacao, guardarNomeEmpresa, guardarNomePerfil, carregar, aCarregar],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useJogo() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useJogo fora do JogoProvider");
  return v;
}
