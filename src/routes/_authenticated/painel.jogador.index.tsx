import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
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
import type { Lugar } from "@/lib/jogo/tipos";
import { TemaDaEquipa } from "@/components/tema/TemaDaEquipa";

const searchSchema = z.object({
  equipa: z.string().uuid().optional(),
  lugar: z.enum(["CEO", "CFO", "COO", "CMO", "CHRO"]).optional(),
});

export const Route = createFileRoute("/_authenticated/painel/jogador/")({
  validateSearch: (s) => searchSchema.parse(s),
  component: PaginaJogo,
});

function PaginaJogo() {
  const { equipa, lugar } = Route.useSearch();
  return (
    <TemaDaEquipa equipaId={equipa ?? null}>
      <JogoProvider equipaId={equipa ?? null} lugarInicial={(lugar as Lugar | undefined) ?? null}>
        <div className="min-h-screen bg-background text-foreground">
          <BarraTopo />
          <BarraLugares />
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

function SalaAtual() {
  const { sala } = useJogo();
  switch (sala) {
    case "gabinete": return <Gabinete />;
    case "board": return <SalaBoard />;
    case "fabrica": return <ChaoFabrica />;
    case "laboratorio": return <Laboratorio />;
    case "ruas": return <Ruas />;
    case "jornal": return <Jornal />;
  }
}
