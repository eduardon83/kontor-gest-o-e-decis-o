import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { JogoProvider, useJogo } from "@/components/jogo/JogoContext";
import { BarraTopo } from "@/components/jogo/BarraTopo";
import { BarraLugares } from "@/components/jogo/BarraLugares";
import { NavSalas } from "@/components/jogo/NavSalas";
import { Gabinete } from "@/components/jogo/salas/Gabinete";
import { SalaBoard } from "@/components/jogo/salas/SalaBoard";
import { ChaoFabrica } from "@/components/jogo/salas/ChaoFabrica";
import { Laboratorio } from "@/components/jogo/salas/Laboratorio";
import { Ruas } from "@/components/jogo/salas/Ruas";
import { Jornal } from "@/components/jogo/salas/Jornal";
import { TemaDaEquipa } from "@/components/tema/TemaDaEquipa";
import { SALAS, LUGARES, type SalaId, type Lugar } from "@/lib/jogo/tipos";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo jogável — Kontor" },
      {
        name: "description",
        content:
          "Explore o Kontor em modo demonstração: alterne entre CEO, CFO, COO, CMO e CHRO num turno pré-semeado.",
      },
      { property: "og:title", content: "Demo jogável — Kontor" },
      {
        property: "og:description",
        content: "Tutorial interativo do Kontor com todos os lugares desbloqueados.",
      },
    ],
  }),
  component: PaginaDemo,
});

function PaginaDemo() {
  return (
    <TemaDaEquipa equipaId={null}>
      <JogoProvider equipaId={null} lugarInicial={null}>
        <div className="min-h-screen bg-background text-foreground">
          <FaixaDemo />
          <BarraTopo />
          <BarraLugares />
          <DicaSala />
          <div className="mx-auto flex max-w-[1400px]">
            <NavSalas />
            <main className="flex-1 p-6">
              <SalaAtual />
            </main>
          </div>
        </div>
      </JogoProvider>
    </TemaDaEquipa>
  );
}

function FaixaDemo() {
  return (
    <div
      className="border-b"
      style={{
        background: "color-mix(in oklab, var(--gold) 18%, var(--paper))",
        borderColor: "color-mix(in oklab, var(--gold) 40%, transparent)",
      }}
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-6 py-2 text-navy">
        <span className="inline-flex items-center gap-2 rounded-sm border border-navy/40 bg-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
          <GraduationCap className="h-3 w-3" /> Demo · Tutorial
        </span>
        <span className="text-sm">
          Está a explorar o Kontor num turno pré-semeado (turno 5 de 16). Nada é gravado.
        </span>
        <span className="hidden text-xs text-navy/70 sm:inline">
          Use o seletor no canto superior direito para alternar entre CEO, CFO, COO, CMO e CHRO.
        </span>
        <Link
          to="/"
          className="mono ml-auto inline-flex items-center gap-1 rounded-sm border border-navy/30 px-2 py-1 text-[10px] uppercase tracking-widest hover:bg-navy/10"
        >
          <ArrowLeft className="h-3 w-3" /> Sair da demo
        </Link>
      </div>
    </div>
  );
}

const DICAS_SALA: Record<SalaId, string> = {
  gabinete:
    "Gabinete do cargo atual — aqui vê os KPIs do lugar e ajusta as decisões desta ronda.",
  board:
    "Sala da Board — missão, seed da empresa e visão consolidada de todos os lugares.",
  fabrica:
    "Chão de fábrica — linhas de produção, capacidade, defeitos e utilização do COO.",
  laboratorio:
    "Laboratório — árvore de I&D com nós concluídos, em curso e bloqueados por pré-requisito.",
  ruas:
    "Ruas — a sua loja, os rivais visíveis no mercado e o movimento do porto.",
  jornal:
    "Jornal do turno — manchetes macro, demonstração de resultados e resumo das decisões aplicadas.",
};

const DICAS_LUGAR: Record<Lugar, string> = {
  CEO: "CEO · define prioridade estratégica, apetite ao risco e comunica ao conselho.",
  CFO: "CFO · gere dívida, dividendos, reservas e o capex disponível para o COO.",
  COO: "COO · define produção por linha e compra de máquinas (limitada pelo capex do CFO).",
  CMO: "CMO · fixa preços por produto e investimento em publicidade.",
  CHRO: "CHRO · contratações, formação e bónus — impacta moral, stress e produtividade.",
};

function DicaSala() {
  const { sala, acesso } = useJogo();
  const dicaS = DICAS_SALA[sala];
  const dicaL =
    acesso.modo === "jogador" ? DICAS_LUGAR[acesso.meuLugar] : "Vista de docente — pré-visualiza todos os lugares.";
  return (
    <div className="border-b bg-card/60">
      <div className="mx-auto max-w-[1400px] px-6 py-2 text-xs text-muted-foreground">
        <span className="mono text-[10px] uppercase tracking-[0.24em] text-gold">Dica</span>{" "}
        <span className="text-foreground">{dicaS}</span>
        <span className="ml-2 text-muted-foreground">· {dicaL}</span>
      </div>
    </div>
  );
}

function SalaAtual() {
  const { sala } = useJogo();
  switch (sala) {
    case "gabinete":
      return <Gabinete />;
    case "board":
      return <SalaBoard />;
    case "fabrica":
      return <ChaoFabrica />;
    case "laboratorio":
      return <Laboratorio />;
    case "ruas":
      return <Ruas />;
    case "jornal":
      return <Jornal />;
  }
}

// Referência para evitar aviso de import não usado quando o schema muda.
void SALAS;
void LUGARES;
