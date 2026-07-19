import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PainelShell } from "@/components/painel/PainelShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarPedidoDocente, meuPedidoDocente } from "@/lib/pedidos-docente.functions";

export const Route = createFileRoute("/_authenticated/painel/jogador-home")({
  component: Pagina,
});

type Pedido = { id: string; estado: string; criado_em: string; decidido_em: string | null } | null;

function Pagina() {
  const criar = useServerFn(criarPedidoDocente);
  const meu = useServerFn(meuPedidoDocente);
  const [pedido, setPedido] = useState<Pedido>(null);
  const [instituicao, setInstituicao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);

  async function carregar() {
    try {
      const r = (await meu()) as Pedido;
      setPedido(r);
    } catch {
      /* silencioso */
    }
  }
  useEffect(() => {
    carregar();
  }, []);

  async function enviar() {
    setErro(null);
    setAEnviar(true);
    try {
      await criar({ data: { instituicao: instituicao || null, mensagem: mensagem || null } });
      await carregar();
      setAberto(false);
    } catch (e: any) {
      setErro(e?.message ?? "Não foi possível enviar o pedido.");
    } finally {
      setAEnviar(false);
    }
  }

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

      <section className="mt-8 rounded-lg border border-border bg-card p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate">
          É docente?
        </p>
        <h3 className="mt-2 font-serif text-xl text-foreground">
          Peça acesso para criar as suas próprias Hansas
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Para preparar turmas e conduzir jogos, precisa do papel de docente. O seu pedido é
          revisto por um administrador da instituição.
        </p>

        {pedido && pedido.estado === "pendente" && (
          <p className="mt-4 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
            Pedido enviado em {new Date(pedido.criado_em).toLocaleDateString()}. A aguardar
            decisão de um administrador.
          </p>
        )}
        {pedido && pedido.estado === "aprovado" && (
          <p className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
            Pedido aprovado. Termine sessão e volte a entrar para o painel de docente ficar
            activo.
          </p>
        )}
        {pedido && pedido.estado === "rejeitado" && (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
            Pedido anterior recusado. Pode submeter novo pedido com mais detalhes.
          </p>
        )}

        {(!pedido || pedido.estado !== "pendente") && !aberto && (
          <div className="mt-4">
            <Button variant="outline" onClick={() => setAberto(true)}>
              Pedir acesso de docente
            </Button>
          </div>
        )}

        {aberto && (
          <div className="mt-4 space-y-3">
            <div>
              <Label>Instituição</Label>
              <Input
                className="mt-1"
                placeholder="Ex.: ISCTE, FEP, Universidade do Minho…"
                value={instituicao}
                onChange={(e) => setInstituicao(e.target.value)}
              />
            </div>
            <div>
              <Label>Mensagem (opcional)</Label>
              <textarea
                className="mt-1 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Uma linha sobre a unidade curricular ou contexto."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
              />
            </div>
            {erro && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erro}
              </p>
            )}
            <div className="flex gap-2">
              <Button onClick={enviar} disabled={aEnviar}>
                {aEnviar ? "A enviar…" : "Enviar pedido"}
              </Button>
              <Button variant="ghost" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </section>
    </PainelShell>
  );
}
