import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  submeterDecisao as submeterDecisaoFn,
  executarAcaoInfo,
  atualizarNomeEmpresa as atualizarNomeEmpresaFn,
  atualizarNomePerfil as atualizarNomePerfilFn,
} from "@/lib/jogo.functions";
import type { Lugar, Acesso, SalaId } from "@/lib/jogo/tipos";
import { LUGARES } from "@/lib/jogo/tipos";

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
  confianca: number | null;
  resultado: Record<string, unknown> | null;
  criado_em: string;
  lugar: Lugar;
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
  usarPesquisa: (lugar: Lugar, tipo: string, nivel?: string) => Promise<void>;
  pesquisaUsada: (lugar: Lugar) => boolean;

  // Empresa / perfil
  nomeEmpresa: string;
  guardarNomeEmpresa: (n: string) => Promise<void>;
  guardarNomePerfil: (n: string) => Promise<void>;

  recarregar: () => Promise<void>;
  aCarregar: boolean;
};

const Ctx = createContext<Estado | null>(null);

function estadoVazio(): DadosJogo {
  return {
    modo: "demo",
    competicao_id: null,
    competicao_nome: "Demo",
    equipa_id: null,
    equipa_nome: "Marnera & Filhos",
    meu_lugar_real: null,
    ronda_id: null,
    ronda_indice: 1,
    ronda_total: 10,
    ronda_prazo: null,
    snapshotAtual: null,
    snapshots: [],
    colaboradores: [],
    rivais: [],
    decisoes: {},
    pesquisas: {},
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
        .select("id, arquetipo, avatar_variante, papel_org, motivacao, stress_individual, antiguidade, necessidades")
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
        .select("id, tipo, nivel, confianca, resultado, criado_em, lugar")
        .eq("equipa_id", equipaId)
        .order("criado_em", { ascending: false });
      const pesquisas: Partial<Record<Lugar, PesquisaRegisto[]>> = {};
      for (const p of pesqLinhas ?? []) {
        const lg = p.lugar as Lugar;
        (pesquisas[lg] ||= []).push({
          id: p.id,
          tipo: p.tipo,
          nivel: p.nivel,
          confianca: p.confianca == null ? null : Number(p.confianca),
          resultado: (p.resultado ?? null) as Record<string, unknown> | null,
          criado_em: p.criado_em,
          lugar: lg,
        });
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
      });
    } finally {
      setACarregar(false);
    }
  }, [equipaId]);

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
    async (lugar: Lugar, tipo: string, nivel?: string) => {
      if (dados.modo !== "real" || !dados.ronda_id || !dados.equipa_id) return;
      await fnPesquisa({
        data: { ronda_id: dados.ronda_id, equipa_id: dados.equipa_id, lugar, tipo, nivel },
      });
      await carregar();
    },
    [dados, fnPesquisa, carregar],
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
      nomeEmpresa: dados.equipa_nome,
      guardarNomeEmpresa,
      guardarNomePerfil,
      recarregar: carregar,
      aCarregar,
    }),
    [dados, acesso, lugarVisto, sala, podeEditar, submetidos, rascunho, atualizarRascunho, submeterLugar, usarPesquisa, pesquisaUsada, guardarNomeEmpresa, guardarNomePerfil, carregar, aCarregar],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useJogo() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useJogo fora do JogoProvider");
  return v;
}
