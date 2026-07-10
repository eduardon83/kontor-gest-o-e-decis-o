import { createFileRoute, Link } from "@tanstack/react-router";
import { PainelShell } from "@/components/painel/PainelShell";

export const Route = createFileRoute("/_authenticated/painel/jogador-home")({
  component: Pagina,
});

function Pagina() {
  return (
    <PainelShell
      papel="jogador"
      titulo="Bem-vindo ao Kontor"
      descricao="Entre num jogo através do código que o docente partilhou ou experimente a demo para conhecer o simulador."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Link
          to="/entrar-hansa"
          className="group rounded-lg border border-gold bg-card p-8 transition-shadow hover:shadow-lg"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold">01</p>
          <h2 className="mt-3 font-serif text-2xl text-foreground">Entrar em Hansa</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Introduza o código partilhado pelo docente para se juntar à sua equipa e assumir a
            sua pasta executiva.
          </p>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-navy group-hover:text-gold">
            Introduzir código →
          </p>
        </Link>

        <Link
          to="/painel/jogador"
          className="group rounded-lg border border-border bg-card p-8 transition-colors hover:border-gold/60"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate">02</p>
          <h2 className="mt-3 font-serif text-2xl text-foreground">Ver demo · Tutorial</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Percorra as cinco pastas (CEO · CFO · COO · CMO · CHRO) num mercado fictício. Nada é
            gravado — serve para conhecer a interface.
          </p>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-slate group-hover:text-foreground">
            Abrir demo →
          </p>
        </Link>
      </div>
    </PainelShell>
  );
}
