import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Lugar, Acesso, SalaId } from "@/lib/jogo/tipos";
import { EMPRESA_INICIAL, CONTROLOS_INICIAIS, PESQUISAS_INICIAIS, type Pesquisa, type ControloDec } from "@/lib/jogo/dados-exemplo";

type Estado = {
  acesso: Acesso;
  setAcesso: (a: Acesso) => void;
  lugarVisto: Lugar;
  setLugarVisto: (l: Lugar) => void;
  sala: SalaId;
  setSala: (s: SalaId) => void;
  nomeEmpresa: string;
  setNomeEmpresa: (n: string) => void;
  controlos: Record<Lugar, ControloDec[]>;
  atualizarControlo: (lugar: Lugar, chave: string, valor: ControloDec["valor"]) => void;
  submetidos: Record<Lugar, boolean>;
  submeter: (lugar: Lugar) => void;
  pesquisas: Record<Lugar, Pesquisa[]>;
  adicionarPesquisa: (lugar: Lugar, p: Pesquisa) => void;
  podeEditar: (lugar: Lugar) => boolean;
};

const Ctx = createContext<Estado | null>(null);

export function JogoProvider({ children }: { children: ReactNode }) {
  const [acesso, setAcesso] = useState<Acesso>({ modo: "docente" });
  const [lugarVisto, setLugarVisto] = useState<Lugar>("CEO");
  const [sala, setSala] = useState<SalaId>("gabinete");
  const [nomeEmpresa, setNomeEmpresa] = useState(EMPRESA_INICIAL.nome);
  const [controlos, setControlos] = useState(CONTROLOS_INICIAIS);
  const [submetidos, setSubmetidos] = useState<Record<Lugar, boolean>>({
    CEO: false, CFO: false, COO: true, CMO: false, CHRO: true,
  });
  const [pesquisas, setPesquisas] = useState(PESQUISAS_INICIAIS);

  const value = useMemo<Estado>(
    () => ({
      acesso, setAcesso,
      lugarVisto, setLugarVisto,
      sala, setSala,
      nomeEmpresa, setNomeEmpresa,
      controlos,
      atualizarControlo: (lugar, chave, valor) =>
        setControlos((c) => ({
          ...c,
          [lugar]: c[lugar].map((k) => (k.chave === chave ? { ...k, valor } : k)),
        })),
      submetidos,
      submeter: (lugar) => setSubmetidos((s) => ({ ...s, [lugar]: true })),
      pesquisas,
      adicionarPesquisa: (lugar, p) =>
        setPesquisas((pr) => ({ ...pr, [lugar]: [p, ...pr[lugar]] })),
      podeEditar: (lugar) =>
        acesso.modo === "docente" ? true : acesso.meuLugar === lugar,
    }),
    [acesso, lugarVisto, sala, nomeEmpresa, controlos, submetidos, pesquisas],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useJogo() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useJogo fora do JogoProvider");
  return v;
}
