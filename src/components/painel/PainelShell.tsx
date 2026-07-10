import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MENU_POR_PAPEL, NOME_PAPEL, ROTAS_POR_PAPEL, type Papel } from "@/lib/painel";

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
  const [nomeUtilizador, setNomeUtilizador] = useState<string>("");
  const [emailUtilizador, setEmailUtilizador] = useState<string>("");
  const [papelReal, setPapelReal] = useState<Papel>(papel);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmailUtilizador(u.user.email ?? "");
      const { data: p } = await supabase
        .from("perfis")
        .select("nome, papel")
        .eq("id", u.user.id)
        .maybeSingle();
      if (p) {
        setNomeUtilizador(p.nome ?? "");
        if (p.papel) setPapelReal(p.papel as Papel);
      }
    })();
  }, []);

  // super_admin é superconjunto — mostra o menu completo
  const menu = MENU_POR_PAPEL[papelReal] ?? MENU_POR_PAPEL[papel];

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const ehSuperAdmin = papelReal === "super_admin";

  return (
    <div className="min-h-screen bg-paper">
      <header className="surface-navy">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <span className="font-serif text-xl text-paper">Kontor</span>
            </Link>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-gold sm:inline">
              {NOME_PAPEL[papelReal]}
            </span>
          </div>

          <nav className="order-3 flex w-full flex-wrap items-center gap-1 border-t border-gold/20 pt-2 md:order-none md:w-auto md:border-0 md:pt-0">
            {menu.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
                  (l.destaque
                    ? "bg-gold text-navy hover:brightness-95"
                    : "text-paper/80 hover:bg-gold/10 hover:text-paper")
                }
                activeProps={{ className: "rounded-md px-3 py-1.5 text-xs font-medium bg-gold/20 text-paper" }}
              >
                {l.label}
              </Link>
            ))}
            {ehSuperAdmin && (
              <select
                aria-label="Ver como"
                defaultValue=""
                onChange={(e) => {
                  const v = e.target.value as Papel | "";
                  if (v) navigate({ to: ROTAS_POR_PAPEL[v] });
                  e.currentTarget.value = "";
                }}
                className="ml-2 rounded-md border border-gold/40 bg-navy px-2 py-1.5 text-[11px] text-paper"
              >
                <option value="">Ver como…</option>
                <option value="jogador">Jogador (home)</option>
                <option value="professor">Professor</option>
                <option value="admin_escolar">Admin escolar</option>
                <option value="super_admin">Super-admin</option>
              </select>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="font-mono text-[11px] leading-tight text-paper">{nomeUtilizador || emailUtilizador}</p>
              {nomeUtilizador && emailUtilizador && (
                <p className="font-mono text-[9px] leading-tight text-paper/50">{emailUtilizador}</p>
              )}
            </div>
            <button
              onClick={sair}
              className="rounded-md border border-gold/50 px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-gold/10"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
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
