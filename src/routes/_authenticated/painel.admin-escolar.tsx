import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PainelShell } from "@/components/painel/PainelShell";
import { Button } from "@/components/ui/button";
import { ConvitesPapel } from "@/components/painel/ConvitesPapel";
import {
  listarUtilizadoresInstituicao,
  alterarPapelUtilizador,
  listarCompeticoesInstituicao,
  metricasInstituicao,
} from "@/lib/admin-escolar.functions";

export const Route = createFileRoute("/_authenticated/painel/admin-escolar")({
  component: Pagina,
});

type User = { id: string; nome: string; email: string; papel: string; criado_em: string };
type Comp = { id: string; nome: string; ambito: string; industria: string; estado: string; criado_em: string };

function Pagina() {
  const listarU = useServerFn(listarUtilizadoresInstituicao);
  const listarC = useServerFn(listarCompeticoesInstituicao);
  const metricas = useServerFn(metricasInstituicao);
  const alterarPapel = useServerFn(alterarPapelUtilizador);

  const [users, setUsers] = useState<User[]>([]);
  const [comps, setComps] = useState<Comp[]>([]);
  const [mets, setMets] = useState<{ utilizadores: number; competicoes: number; equipas: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function carregar() {
    try {
      setUsers((await listarU()) as User[]);
      setComps((await listarC()) as Comp[]);
      setMets((await metricas()) as any);
    } catch (e: any) { setMsg(e.message); }
  }
  useEffect(() => { carregar(); }, []);

  async function trocarPapel(user_id: string, papel: string) {
    try { await alterarPapel({ data: { user_id, papel: papel as any } }); carregar(); }
    catch (e: any) { setMsg(e.message); }
  }

  return (
    <PainelShell papel="admin_escolar" titulo="Administração da instituição" descricao="Utilizadores, docentes e competições intra-escola.">
      {mets && (
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {[
            ["Utilizadores", mets.utilizadores],
            ["Competições", mets.competicoes],
            ["Equipas", mets.equipas],
          ].map(([l, v]) => (
            <div key={l as string} className="rounded-lg border border-border bg-card p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-slate">{l}</p>
              <p className="mt-2 font-serif text-3xl">{v as number}</p>
            </div>
          ))}
        </div>
      )}
      {msg && <p className="mb-4 text-sm text-destructive">{msg}</p>}

      <section className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">Convites de acesso</h2>
        <ConvitesPapel papelDoUtilizador="admin_escolar" />
      </section>


      <section className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">Utilizadores</h2>
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="p-3">Nome</th><th className="p-3">Email</th><th className="p-3">Papel</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3 font-medium">{u.nome || "—"}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    {u.papel === "super_admin" ? (
                      <span className="inline-block rounded-md border border-gold/50 bg-gold/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-gold">
                        Super-administrador
                      </span>
                    ) : (
                      <select
                        className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                        value={u.papel}
                        onChange={(e) => trocarPapel(u.id, e.target.value)}
                      >
                        <option value="jogador">Jogador</option>
                        <option value="professor">Professor</option>
                        <option value="admin_escolar">Admin escolar</option>
                      </select>
                    )}
                  </td>
                  <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={carregar}>↻</Button></td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sem utilizadores.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-2xl">Competições intra-escola</h2>
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="p-3">Nome</th><th className="p-3">Âmbito</th><th className="p-3">Estado</th><th className="p-3">Criada</th></tr>
            </thead>
            <tbody>
              {comps.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-medium">{c.nome}</td>
                  <td className="p-3">{c.ambito}</td>
                  <td className="p-3">{c.estado}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{new Date(c.criado_em).toLocaleDateString()}</td>
                </tr>
              ))}
              {comps.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sem competições.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </PainelShell>
  );
}
