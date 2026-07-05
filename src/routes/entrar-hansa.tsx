import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/entrar-hansa")({
  component: EntrarHansa,
});

function EntrarHansa() {
  const [codigo, setCodigo] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    // A lógica de jogo (Edge Functions) vem depois.
    setAviso("A entrada por código estará disponível quando o motor de jogo for ligado.");
  }

  return (
    <div className="min-h-screen surface-deep">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-serif text-2xl text-paper">
          Kontor
        </Link>
        <Link to="/auth" className="text-sm text-paper/70 hover:text-paper">
          Sou docente
        </Link>
      </header>

      <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-16 text-center md:pt-24">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold">
          Entrar num jogo
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-paper">
          Código de Hansa
        </h1>
        <p className="mt-4 max-w-sm text-sm text-paper/70">
          O código foi partilhado pelo seu docente. Introduza-o para se juntar à sua equipa.
        </p>

        <form onSubmit={submeter} className="mt-10 w-full">
          <label htmlFor="codigo" className="sr-only">
            Código de Hansa
          </label>
          <input
            id="codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="EX: HANSA-4F2K"
            className="mono w-full rounded-md border border-gold/40 bg-transparent px-4 py-4 text-center text-xl tracking-[0.35em] text-paper placeholder:text-paper/30 outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            maxLength={16}
            autoFocus
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-gold px-4 py-3 text-sm font-semibold text-gold-foreground transition-transform hover:-translate-y-[1px]"
          >
            Entrar
          </button>
        </form>

        {aviso && (
          <p className="mt-6 rounded-md border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-paper/80">
            {aviso}
          </p>
        )}

        <Link to="/" className="mt-10 text-xs text-paper/50 hover:text-paper">
          ← Voltar
        </Link>
      </main>
    </div>
  );
}
