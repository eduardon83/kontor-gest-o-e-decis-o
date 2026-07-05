import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NOME_PAPEL, type Papel } from "@/lib/painel";

export function PainelShell({
  papel,
  titulo,
  descricao,
  children,
}: {
  papel: Papel;
  titulo: string;
  descricao: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="surface-navy">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-serif text-xl text-paper">Kontor</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-gold sm:inline">
              {NOME_PAPEL[papel]}
            </span>
          </Link>
          <button
            onClick={sair}
            className="rounded-md border border-gold/50 px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-gold/10"
          >
            Terminar sessão
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate">
          Painel · {NOME_PAPEL[papel]}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground">{titulo}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{descricao}</p>
        <div className="mt-10">{children}</div>
      </main>
    </div>
  );
}

export function Placeholder({ items }: { items: { t: string; d: string }[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.t}
          className="rounded-lg border border-dashed border-border bg-card p-6"
        >
          <h3 className="font-serif text-lg">{it.t}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{it.d}</p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-gold">
            Em breve
          </p>
        </div>
      ))}
    </div>
  );
}
