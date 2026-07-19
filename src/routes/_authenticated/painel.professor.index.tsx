import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PainelShell } from "@/components/painel/PainelShell";
import { CopiarCodigo } from "@/components/painel/CopiarCodigo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/painel/professor/")({
  component: PainelProfessor,
});

const NOME_AMBITO: Record<string, string> = {
  intra_turma: "Intra-turma",
  intra_escola: "Intra-escola",
  inter_escola: "Inter-escola",
};

function PainelProfessor() {
  const { data: competicoes, isLoading, error } = useQuery({
    queryKey: ["professor", "competicoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competicoes")
        .select("id, nome, codigo, estado, ambito, duracao_turnos, criado_em")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <PainelShell
      papel="professor"
      titulo="Os seus jogos de Hansa"
      descricao="Prepare mercados, forme equipas, avance turnos e acompanhe decisões."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-foreground">Hansas ativas</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/demo"
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-gold"
          >
            Ver demo jogável
          </Link>
          <Link
            to="/nova-hansa"
            className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-navy transition-colors hover:brightness-95"
          >
            + Nova Hansa
          </Link>
        </div>
      </div>

      {isLoading && <p className="font-mono text-xs text-slate">A carregar…</p>}
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro a carregar competições."}
        </p>
      )}

      {competicoes && competicoes.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="font-serif text-lg">Ainda não tem Hansas.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie a primeira com o botão "Nova Hansa" acima.
          </p>
        </div>
      )}

      {competicoes && competicoes.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2">
          {competicoes.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg">{c.nome}</h3>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-slate">
                    {NOME_AMBITO[c.ambito] ?? c.ambito} · {c.duracao_turnos} turnos
                  </p>
                </div>
                <span
                  className={
                    "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] " +
                    (c.estado === "aberta"
                      ? "bg-gold/20 text-navy"
                      : "bg-muted text-muted-foreground")
                  }
                >
                  {c.estado}
                </span>
              </div>
              {c.codigo && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-md bg-navy px-3 py-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold">Código</p>
                    <p className="font-mono text-base text-paper">{c.codigo}</p>
                  </div>
                  <CopiarCodigo codigo={c.codigo} variante="escuro" />
                </div>
              )}
              <div className="mt-4">
                <Link
                  to="/painel/professor/competicao/$id"
                  params={{ id: c.id }}
                  className="inline-flex w-full items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy transition-colors hover:brightness-95"
                >
                  Ver competição →
                </Link>
              </div>

            </li>
          ))}
        </ul>
      )}
    </PainelShell>
  );
}
