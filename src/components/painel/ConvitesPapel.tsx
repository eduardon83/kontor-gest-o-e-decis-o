// Formulário para pré-atribuir papel a um email antes do registo.
// Usado pelo painel admin_escolar e super_admin.
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { criarConvite, listarConvites, revogarConvite } from "@/lib/convites.functions";

type Papel = "jogador" | "professor" | "admin_escolar" | "super_admin";
type Convite = {
  email: string;
  papel: Papel;
  instituicao_id: string | null;
  criado_em: string;
  usado_em: string | null;
};

const NOME_PAPEL: Record<Papel, string> = {
  jogador: "Jogador",
  professor: "Professor",
  admin_escolar: "Admin escolar",
  super_admin: "Super-admin",
};

export function ConvitesPapel({
  papelDoUtilizador,
  instituicoes,
}: {
  papelDoUtilizador: "admin_escolar" | "super_admin";
  instituicoes?: Array<{ id: string; nome: string }>;
}) {
  const criar = useServerFn(criarConvite);
  const listar = useServerFn(listarConvites);
  const revogar = useServerFn(revogarConvite);

  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("professor");
  const [instituicaoId, setInstituicaoId] = useState<string>("");
  const [lista, setLista] = useState<Convite[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [revogarAlvo, setRevogarAlvo] = useState<string | null>(null);

  async function carregar() {
    try {
      setLista(((await listar()) as Convite[]) ?? []);
    } catch (e: any) {
      setMsg(e.message);
    }
  }
  useEffect(() => {
    carregar();
  }, []);

  const papeisDisponiveis: Papel[] =
    papelDoUtilizador === "super_admin"
      ? ["jogador", "professor", "admin_escolar", "super_admin"]
      : ["jogador", "professor", "admin_escolar"];

  async function submeter() {
    if (!email.trim()) return;
    try {
      const resp = (await criar({
        data: {
          email: email.trim(),
          papel,
          instituicao_id: instituicaoId || null,
        },
      })) as { aplicado_imediatamente?: boolean };
      setMsg(
        resp?.aplicado_imediatamente
          ? "Convite criado — utilizador já existia; papel aplicado de imediato."
          : "Convite guardado. O papel será aplicado quando o utilizador se registar.",
      );
      setEmail("");
      carregar();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  async function apagar(emailAlvo: string) {
    try {
      await revogar({ data: { email: emailAlvo } });
      carregar();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-serif text-xl">Convidar utilizador</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pré-atribui um papel a um email. Quando essa pessoa se registar, o papel
          e a instituição são aplicados automaticamente. Se já existir conta com esse
          email, o papel é actualizado de imediato.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_220px_auto]">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="nome@instituicao.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Papel</Label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              value={papel}
              onChange={(e) => setPapel(e.target.value as Papel)}
            >
              {papeisDisponiveis.map((p) => (
                <option key={p} value={p}>
                  {NOME_PAPEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Instituição</Label>
            {papelDoUtilizador === "super_admin" && instituicoes ? (
              <select
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                value={instituicaoId}
                onChange={(e) => setInstituicaoId(e.target.value)}
              >
                <option value="">— sem instituição —</option>
                {instituicoes.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                className="mt-1"
                disabled
                value="(a sua instituição)"
              />
            )}
          </div>
          <div className="flex items-end">
            <Button onClick={submeter}>Convidar</Button>
          </div>
        </div>
        {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-serif text-lg">Convites</h3>
          <Button size="sm" variant="ghost" onClick={carregar}>
            ↻
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Papel</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Criado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.email} className="border-t border-border">
                <td className="p-3 font-medium">{c.email}</td>
                <td className="p-3">{NOME_PAPEL[c.papel]}</td>
                <td className="p-3 font-mono text-xs">
                  {c.usado_em ? (
                    <span className="text-emerald-700">aplicado {new Date(c.usado_em).toLocaleDateString()}</span>
                  ) : (
                    <span className="text-gold">pendente</span>
                  )}
                </td>
                <td className="p-3 font-mono text-xs text-muted-foreground">
                  {new Date(c.criado_em).toLocaleDateString()}
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setRevogarAlvo(c.email)}>
                    Revogar
                  </Button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Sem convites.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!revogarAlvo} onOpenChange={(v) => !v && setRevogarAlvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar convite?</AlertDialogTitle>
            <AlertDialogDescription>
              O convite para <strong>{revogarAlvo}</strong> deixa de estar disponível. Se a pessoa ainda não
              se registou, terá de ser convidada novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const alvo = revogarAlvo;
                setRevogarAlvo(null);
                if (alvo) await apagar(alvo);
              }}
            >
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
