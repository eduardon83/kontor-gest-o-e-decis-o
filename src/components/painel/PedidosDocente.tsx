// Lista e resolve pedidos de acesso de docente pendentes.
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { listarPedidosDocente, decidirPedidoDocente } from "@/lib/pedidos-docente.functions";

type Pedido = {
  id: string;
  email: string;
  nome: string | null;
  instituicao: string | null;
  mensagem: string | null;
  criado_em: string;
};

export function PedidosDocente() {
  const listar = useServerFn(listarPedidosDocente);
  const decidir = useServerFn(decidirPedidoDocente);
  const [lista, setLista] = useState<Pedido[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function carregar() {
    try {
      setLista(((await listar()) as Pedido[]) ?? []);
    } catch (e: any) {
      setMsg(e.message);
    }
  }
  useEffect(() => {
    carregar();
  }, []);

  async function resolver(id: string, aprovar: boolean) {
    try {
      await decidir({ data: { id, aprovar } });
      carregar();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  if (lista.length === 0 && !msg) return null;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-serif text-lg">Pedidos de acesso de docente</h3>
        <Button size="sm" variant="ghost" onClick={carregar}>
          ↻
        </Button>
      </div>
      {msg && <p className="px-4 py-2 text-sm text-destructive">{msg}</p>}
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="p-3">Utilizador</th>
            <th className="p-3">Instituição</th>
            <th className="p-3">Mensagem</th>
            <th className="p-3">Data</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => (
            <tr key={p.id} className="border-t border-border align-top">
              <td className="p-3">
                <div className="font-medium">{p.nome || "—"}</div>
                <div className="text-xs text-muted-foreground">{p.email}</div>
              </td>
              <td className="p-3">{p.instituicao || "—"}</td>
              <td className="p-3 text-muted-foreground">{p.mensagem || "—"}</td>
              <td className="p-3 font-mono text-xs text-muted-foreground">
                {new Date(p.criado_em).toLocaleDateString()}
              </td>
              <td className="p-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" onClick={() => resolver(p.id, true)}>
                    Aprovar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => resolver(p.id, false)}>
                    Recusar
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
