import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BOARD } from "@/lib/jogo/dados-exemplo";
import { useJogo } from "../JogoContext";
import { listarCronica, listarAtas } from "@/lib/cronica.functions";

type Aba = "missao" | "cronica" | "atas";

type CronicaEntrada = {
  id: string;
  indice_turno: number;
  tipo: string;
  texto: string;
  destaque: boolean;
  dados: Record<string, unknown> | null;
};

type Ata = {
  id: string;
  indice: number;
  estado: string;
  decisoes: Array<{ lugar: string; submetido_em: string | null; payload: Record<string, unknown> }>;
  auditoria: Array<{ acao: string; payload: Record<string, unknown> }>;
};

export function SalaBoard() {
  const { modo, equipa_id } = useJogo();
  const [aba, setAba] = useState<Aba>("missao");
  const [cronica, setCronica] = useState<CronicaEntrada[] | null>(null);
  const [atas, setAtas] = useState<Ata[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const carregarCronica = useServerFn(listarCronica);
  const carregarAtas = useServerFn(listarAtas);

  useEffect(() => {
    if (modo !== "real" || !equipa_id) return;
    if (aba === "cronica" && cronica == null) {
      setCarregando(true);
      carregarCronica({ data: { equipa_id } })
        .then((r: any) => setCronica(r.entradas ?? []))
        .catch(() => setCronica([]))
        .finally(() => setCarregando(false));
    }
    if (aba === "atas" && atas == null) {
      setCarregando(true);
      carregarAtas({ data: { equipa_id } })
        .then((r: any) => setAtas(r.rondas ?? []))
        .catch(() => setAtas([]))
        .finally(() => setCarregando(false));
    }
  }, [aba, modo, equipa_id, cronica, atas, carregarCronica, carregarAtas]);

  return (
    <div className="space-y-6">
      <nav className="flex gap-1 border-b" aria-label="Sala da Board">
        <BotaoAba activa={aba === "missao"} onClick={() => setAba("missao")}>Missão</BotaoAba>
        <BotaoAba activa={aba === "cronica"} onClick={() => setAba("cronica")}>Crónica</BotaoAba>
        <BotaoAba activa={aba === "atas"} onClick={() => setAba("atas")}>Atas</BotaoAba>
      </nav>

      {aba === "missao" && <AbaMissao />}
      {aba === "cronica" && (
        <AbaCronica
          modo={modo}
          entradas={cronica ?? (modo === "demo" ? CRONICA_DEMO : [])}
          carregando={carregando}
        />
      )}
      {aba === "atas" && (
        <AbaAtas
          modo={modo}
          rondas={atas ?? (modo === "demo" ? ATAS_DEMO : [])}
          carregando={carregando}
        />
      )}
    </div>
  );
}

function BotaoAba({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`mono px-4 py-2 text-[11px] uppercase tracking-widest ${
        activa
          ? "border-b-2 border-gold text-foreground"
          : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function AbaMissao() {
  return (
    <>
      <section className="rounded-sm border bg-card p-6">
        <div className="mono text-[10px] uppercase tracking-widest text-gold">Missão da Administração</div>
        <p className="mt-3 font-serif text-xl leading-snug text-foreground">
          &ldquo;{BOARD.missao}&rdquo;
        </p>
        <div className="mono mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
          — Presidente do Conselho de Administração
        </div>
      </section>

      <section className="rounded-sm border bg-card">
        <header className="border-b px-6 py-4">
          <div className="mono text-[10px] uppercase tracking-widest text-gold">Economia atribuída · Seed</div>
          <h2 className="font-serif text-2xl">Ponto de partida</h2>
        </header>
        <dl className="grid gap-6 p-6 sm:grid-cols-2">
          <Campo rotulo="Indústria" valor={BOARD.seed.industria} />
          <Campo rotulo="Mercado-alvo" valor={BOARD.seed.mercado_alvo} />
          <Campo rotulo="Capital inicial" valor={`${(BOARD.seed.capital_inicial / 1000).toFixed(0)}k €`} mono />
          <Campo rotulo="Dívidas iniciais" valor={`${(BOARD.seed.dividas_iniciais / 1000).toFixed(0)}k €`} mono />
          <Campo rotulo="Ativos" valor={BOARD.seed.ativos_iniciais.join(" · ")} />
          <Campo rotulo="Concorrentes" valor={`${BOARD.seed.concorrentes}`} mono />
        </dl>
      </section>
    </>
  );
}

function AbaCronica({ modo, entradas, carregando }: { modo: string; entradas: CronicaEntrada[]; carregando: boolean }) {
  const porTurno = new Map<number, CronicaEntrada[]>();
  for (const e of entradas) {
    const arr = porTurno.get(e.indice_turno) ?? [];
    arr.push(e);
    porTurno.set(e.indice_turno, arr);
  }
  const turnos = Array.from(porTurno.keys()).sort((a, b) => a - b);

  function descarregar() {
    const md = ["# A Crónica da Casa", ""];
    for (const t of turnos) {
      md.push(`## Turno ${t}`, "");
      for (const e of porTurno.get(t)!) md.push(`- ${e.destaque ? "**" : ""}${e.texto}${e.destaque ? "**" : ""}`);
      md.push("");
    }
    const blob = new Blob([md.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cronica.md"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-sm border bg-card">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <div className="mono text-[10px] uppercase tracking-widest text-gold">Retrospetiva acumulada</div>
          <h2 className="font-serif text-2xl">A Crónica da Casa</h2>
        </div>
        {entradas.length > 0 && (
          <button
            onClick={descarregar}
            className="mono rounded-sm border border-gold bg-gold/10 px-3 py-1.5 text-[11px] uppercase tracking-widest text-gold hover:bg-gold/20"
          >
            Descarregar
          </button>
        )}
      </header>
      <div className="p-6">
        {carregando && <p className="text-sm text-muted-foreground">A ler a crónica…</p>}
        {!carregando && entradas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {modo === "demo" ? "Sem entradas na demo." : "A crónica começa a escrever-se depois do primeiro turno resolvido."}
          </p>
        )}
        {!carregando && turnos.map((t) => (
          <div key={t} className="mb-6 grid grid-cols-[80px_1fr] gap-4">
            <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Turno {t}</div>
            <ul className="space-y-2">
              {porTurno.get(t)!.map((e) => (
                <li
                  key={e.id}
                  className={
                    e.destaque
                      ? "rounded-sm border-l-4 border-gold bg-gold/5 p-3 font-serif text-[15px] leading-snug"
                      : "font-serif text-[14px] leading-snug text-foreground/90"
                  }
                >
                  {e.texto}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

const ROTULOS_ACAO: Record<string, string> = {
  "ronda:linha_credito_automatica": "linha de crédito automática",
  "ronda:pessoa_despedida": "despedimento",
  "ronda:pessoa_promovida": "promoção",
  "ronda:promocao_merito": "promoção de mérito",
  "ronda:contratacao": "contratação",
  "ronda:id_alvo_ignorado": "alvo de I&D ignorado",
  "ronda:promo_invalida": "promoção inválida",
  "ronda:ausente_aplicado": "decisão em falta — política aplicada",
};

function AbaAtas({ modo, rondas, carregando }: { modo: string; rondas: Ata[]; carregando: boolean }) {
  return (
    <section className="rounded-sm border bg-card">
      <header className="border-b px-6 py-4">
        <div className="mono text-[10px] uppercase tracking-widest text-gold">Registo administrativo</div>
        <h2 className="font-serif text-2xl">Atas</h2>
      </header>
      <div className="divide-y">
        {carregando && <p className="p-6 text-sm text-muted-foreground">A ler as atas…</p>}
        {!carregando && rondas.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">
            {modo === "demo" ? "Sem atas na demo." : "Sem rondas resolvidas."}
          </p>
        )}
        {!carregando && rondas.map((r) => (
          <div key={r.id} className="p-6">
            <div className="mono mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Turno {r.indice} · {r.estado}
            </div>
            {r.decisoes.length > 0 && (
              <div className="mb-3">
                <div className="mono text-[10px] uppercase tracking-widest text-gold">Decisões submetidas</div>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {r.decisoes.map((d, i) => (
                    <li key={i} className="text-foreground/90">
                      <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{d.lugar}</span>
                      {" · "}
                      {d.submetido_em ? "aplicada" : "em falta"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.auditoria.length > 0 && (
              <div>
                <div className="mono text-[10px] uppercase tracking-widest text-gold">Ajustes e eventos</div>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {r.auditoria.map((a, i) => (
                    <li key={i} className="text-foreground/80">
                      · {ROTULOS_ACAO[a.acao] ?? a.acao}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Campo({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div>
      <dt className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{rotulo}</dt>
      <dd className={`mt-1 ${mono ? "mono text-lg" : "font-serif text-lg"}`}>{valor}</dd>
    </div>
  );
}

// ─── Fixtures da demo ────────────────────────────────────────────────────
const CRONICA_DEMO: CronicaEntrada[] = [
  { id: "d1", indice_turno: 1, tipo: "silencio", texto: "Turno 1 — sem registo digno de nota.", destaque: false, dados: null },
  { id: "d2", indice_turno: 2, tipo: "primeiro_lucro", texto: "A casa fechou o turno 2 com o seu primeiro lucro: 12,4 k€. Ficou assente que era possível.", destaque: true, dados: null },
  { id: "d3", indice_turno: 3, tipo: "quota_ganha", texto: "Ganhou 6,2 pontos de quota, para 21,3%.", destaque: false, dados: null },
  { id: "d4", indice_turno: 4, tipo: "breakthrough", texto: "O laboratório teve uma noite feliz: um avanço inesperado destrancou trabalho de meses.", destaque: true, dados: null },
  { id: "d5", indice_turno: 5, tipo: "promocao_aprendiz", texto: "Tomás Ferreira, que entrou como aprendiz, foi promovido a supervisor. A casa cresceu-lhe dentro.", destaque: true, dados: null },
];

const ATAS_DEMO: Ata[] = [
  {
    id: "a1", indice: 1, estado: "resolvida",
    decisoes: [
      { lugar: "CEO", submetido_em: "x", payload: {} },
      { lugar: "CFO", submetido_em: "x", payload: {} },
      { lugar: "COO", submetido_em: "x", payload: {} },
      { lugar: "CMO", submetido_em: "x", payload: {} },
      { lugar: "CHRO", submetido_em: null, payload: {} },
    ],
    auditoria: [{ acao: "ronda:ausente_aplicado", payload: {} }],
  },
];
