import { createFileRoute, Link } from "@tanstack/react-router";
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
  lugar: z.enum(["CEO", "CFO", "COO", "CMO", "CHRO"]).optional(),
});

export const Route = createFileRoute("/_authenticated/painel/professor/conduzir/$competicao/$equipa")({
  validateSearch: (s) => searchSchema.parse(s),
  component: PaginaConducao,
});

function PaginaConducao() {
  const { competicao, equipa } = Route.useParams();
  const { lugar } = Route.useSearch();
  return (
    <TemaDaEquipa equipaId={equipa}>
      <JogoProvider
        equipaId={equipa}
        lugarInicial={(lugar as Lugar | undefined) ?? "CEO"}
        condutorCompeticaoId={competicao}
      >
        <div className="min-h-screen bg-background text-foreground">
          <BarraTopo />
          <div className="border-b bg-muted/30 px-6 py-2">
            <div className="mx-auto max-w-[1400px]">
              <Link
                to="/painel/professor/competicao/$id"
                params={{ id: competicao }}
                className="mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                ← voltar à competição
              </Link>
            </div>
          </div>
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
