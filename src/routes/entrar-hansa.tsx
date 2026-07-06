import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { entrarPorCodigo } from "@/lib/jogo.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/entrar-hansa")({
  component: EntrarHansa,
});

type Equipa = { equipa_id: string; equipa_nome: string; lugar: string };

function EntrarHansa() {
  const navigate = useNavigate();
  const acionar = useServerFn(entrarPorCodigo);
  const [codigo, setCodigo] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [equipas, setEquipas] = useState<Equipa[] | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAutenticado(!!data.session));
  }, []);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setAviso(null);
    if (!autenticado) {
      navigate({ to: "/auth" });
      return;
    }
    setCarregando(true);
    try {
      const r = await acionar({ data: { codigo } });
      if (r.equipas.length === 1) {
        navigate({
          to: "/painel/jogador",
          search: { equipa: r.equipas[0].equipa_id, lugar: r.equipas[0].lugar } as never,
        });
      } else {
        setEquipas(r.equipas);
      }
    } catch (err) {
      setAviso((err as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen surface-deep">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-serif text-2xl text-paper">Kontor</Link>
        <Link to="/auth" className="text-sm text-paper/70 hover:text-paper">Sou docente</Link>
      </header>

      <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-16 text-center md:pt-24">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold">Entrar num jogo</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-paper">Código de Hansa</h1>
        <p className="mt-4 max-w-sm text-sm text-paper/70">
          O código foi partilhado pelo docente. Introduza-o para se juntar à sua equipa.
        </p>

        {!equipas ? (
          <form onSubmit={submeter} className="mt-10 w-full">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="EX: HANSA-4F2K"
              className="mono w-full rounded-md border border-gold/40 bg-transparent px-4 py-4 text-center text-xl tracking-[0.35em] text-paper placeholder:text-paper/30 outline-none focus:border-gold"
              maxLength={16}
              autoFocus
            />
            <button
              type="submit"
              disabled={carregando || !codigo}
              className="mt-4 w-full rounded-md bg-gold px-4 py-3 text-sm font-semibold text-gold-foreground disabled:opacity-50"
            >
              {carregando ? "A entrar…" : "Entrar"}
            </button>
            {autenticado === false && (
              <p className="mt-4 text-xs text-paper/60">
                Precisa de <Link to="/auth" className="underline">iniciar sessão</Link> primeiro.
              </p>
            )}
          </form>
        ) : (
          <div className="mt-10 w-full space-y-3 text-left">
            <p className="text-sm text-paper/70">Escolha a equipa:</p>
            {equipas.map((e) => (
              <button
                key={`${e.equipa_id}-${e.lugar}`}
                onClick={() =>
                  navigate({
                    to: "/painel/jogador",
                    search: { equipa: e.equipa_id, lugar: e.lugar } as never,
                  })
                }
                className="flex w-full items-center justify-between rounded-md border border-gold/40 bg-navy/40 px-4 py-3 text-left text-paper hover:bg-navy/60"
              >
                <span className="font-serif">{e.equipa_nome}</span>
                <span className="mono text-xs uppercase tracking-widest text-gold">{e.lugar}</span>
              </button>
            ))}
          </div>
        )}

        {aviso && (
          <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-paper/90">
            {aviso}
          </p>
        )}

        <div className="mt-10 flex w-full flex-col items-center gap-3">
          <Link
            to="/demo"
            className="mono w-full rounded-md border border-gold/40 px-4 py-3 text-center text-xs uppercase tracking-widest text-paper hover:bg-gold/10"
          >
            Ver demo · Tutorial
          </Link>
          <p className="text-[11px] text-paper/50">
            Explora o Kontor sem precisar de código — nada é gravado.
          </p>
        </div>

        <Link to="/" className="mt-8 text-xs text-paper/50 hover:text-paper">← Voltar</Link>
      </main>
    </div>
  );
}
