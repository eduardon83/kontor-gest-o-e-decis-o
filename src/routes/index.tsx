import { createFileRoute, Link } from "@tanstack/react-router";
import { LogoKontor } from "@/components/marca/LogoKontor";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-paper text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden surface-navy">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, var(--gold) 0, transparent 40%), radial-gradient(circle at 80% 80%, var(--gold) 0, transparent 45%)",
          }}
        />
        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link to="/" className="flex items-center gap-3">
            <LogoKontor size={36} cor="gold" />
            <span className="font-serif tracking-tight text-paper" style={{ fontWeight: 800, fontSize: "1.5rem" }}>Kontor</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-gold sm:inline">
              simulador de gestão
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/auth"
              className="rounded-md px-3 py-2 text-sm font-medium text-paper/80 transition-colors hover:text-paper"
            >
              Entrar
            </Link>
          </nav>
        </header>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-28 md:pt-24 md:pb-36">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold">
            Ensino superior · Gestão · Simulação
          </p>
          <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-[1.05] text-paper md:text-6xl">
            A gestão de uma empresa, aprendida a decidir.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-paper/80 md:text-lg">
            Em equipa, cada aluno assume uma pasta executiva e gere uma empresa num mercado vivo e
            único a cada jogo. Decidem juntos, semana após semana, e o mercado responde. Vence quem
            criar mais valor.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-md bg-gold px-5 py-3 text-sm font-semibold text-gold-foreground shadow-[0_1px_0_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-[1px]"
            >
              Sou docente / instituição
            </Link>
            <Link
              to="/entrar-hansa"
              className="inline-flex items-center justify-center rounded-md border border-gold/60 px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-gold/10"
            >
              Entrar com código de Hansa
            </Link>
          </div>
        </div>

        {/* fade to paper */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-paper" />
      </section>

      {/* O QUE É */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate">01 · O que é</p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl md:text-4xl">
              Um simulador sério, onde a decisão coletiva constrói a empresa.
            </h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: "01",
              t: "Cinco pastas",
              d: "CEO · CFO · COO · CMO · CHRO. Cada aluno lidera uma área e responde pelo seu impacto.",
            },
            {
              n: "02",
              t: "Decisões semanais",
              d: "Cada ronda é uma semana de gestão: preços, produção, capital, marca, pessoas.",
            },
            {
              n: "03",
              t: "Mercado único",
              d: "A cada jogo, um cenário e uma procura próprios. Não há duas partidas iguais.",
            },
            {
              n: "04",
              t: "Cresce o valor",
              d: "Vence quem construir a empresa de maior valor — não quem calcular mais rápido.",
            },
          ].map((c) => (
            <article
              key={c.n}
              className="group relative rounded-lg border border-border bg-card p-6 transition-colors hover:border-gold/60"
            >
              <div className="mono text-xs tracking-widest text-gold">{c.n}</div>
              <h3 className="mt-3 font-serif text-xl text-foreground">{c.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* COMO SE COMPETE */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate">
              02 · Como se compete
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl md:text-4xl">
              Três formatos, uma mesma exigência: decidir e responder.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                t: "Só equipas",
                d: "Todas as empresas do mercado são geridas por equipas de alunos. Confronto direto entre pares.",
              },
              {
                t: "vs. Computador",
                d: "A equipa mede-se contra oponentes controlados pelo simulador, com perfis distintos de gestão.",
              },
              {
                t: "Misto",
                d: "Equipas de alunos convivem com concorrentes automatizados, para densidade e variedade de mercado.",
              },
            ].map((c) => (
              <article
                key={c.t}
                className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-gold/60"
              >
                <h3 className="font-serif text-xl">{c.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="surface-deep">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold">Começar</p>
            <h3 className="mt-3 max-w-xl font-serif text-2xl text-paper md:text-3xl">
              Prepare a próxima turma para decidir com o mercado a responder.
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-md bg-gold px-5 py-3 text-sm font-semibold text-gold-foreground transition-transform hover:-translate-y-[1px]"
            >
              Área de docente
            </Link>
            <Link
              to="/entrar-hansa"
              className="inline-flex items-center justify-center rounded-md border border-gold/60 px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-gold/10"
            >
              Entrar com código
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span className="font-mono tracking-widest">KONTOR</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
