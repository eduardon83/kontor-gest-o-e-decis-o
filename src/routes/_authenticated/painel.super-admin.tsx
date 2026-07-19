import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PainelShell } from "@/components/painel/PainelShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  listarInstituicoes,
  criarInstituicao,
  atualizarNomeInstituicao,
  listarCompeticoesSuperAdmin,
  listarLogAuditoria,
} from "@/lib/super-admin.functions";
import {
  atualizarTemaInstituicao,
  atualizarTemaCompeticao,
  atualizarIndustria,
} from "@/lib/tema.functions";
import { TemaProvider, useTema } from "@/components/tema/TemaProvider";
import type { Tema, TemaSlots, TemaTokens } from "@/lib/tema/tipos";
import { ConvitesPapel } from "@/components/painel/ConvitesPapel";
import { PedidosDocente } from "@/components/painel/PedidosDocente";

export const Route = createFileRoute("/_authenticated/painel/super-admin")({
  component: Pagina,
});

type Instituicao = { id: string; nome: string; tema: Tema | null };
type Comp = { id: string; nome: string; industria: string; instituicao_id: string | null; tema: Tema | null; estado: string };
type Log = { id: string; acao: string; alvo: string | null; payload: any; ts: string; ator_user_id: string | null };

function Pagina() {
  const [aba, setAba] = useState<"instituicoes" | "convites" | "tema" | "auditoria">("instituicoes");
  return (
    <PainelShell papel="super_admin" titulo="Gestão global do Kontor" descricao="Instituições, temas, indústria e auditoria.">
      <div className="mb-6 flex gap-2 border-b border-border">
        {[
          ["instituicoes", "Instituições"],
          ["convites", "Convites"],
          ["tema", "Temas"],
          ["auditoria", "Auditoria"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setAba(k as any)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              aba === k ? "border-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      {aba === "instituicoes" && <AbaInstituicoes />}
      {aba === "convites" && <AbaConvites />}
      {aba === "tema" && <AbaTema />}
      {aba === "auditoria" && <AbaAuditoria />}
    </PainelShell>
  );
}

function AbaConvites() {
  const listar = useServerFn(listarInstituicoes);
  const [insts, setInsts] = useState<Instituicao[]>([]);
  useEffect(() => {
    (async () => { try { setInsts((await listar()) as Instituicao[]); } catch {} })();
  }, []);
  return <ConvitesPapel papelDoUtilizador="super_admin" instituicoes={insts.map((i) => ({ id: i.id, nome: i.nome }))} />;
}

function AbaInstituicoes() {
  const listar = useServerFn(listarInstituicoes);
  const criar = useServerFn(criarInstituicao);
  const renomear = useServerFn(atualizarNomeInstituicao);
  const [lista, setLista] = useState<Instituicao[]>([]);
  const [nome, setNome] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function recarregar() {
    try { setLista((await listar()) as Instituicao[]); } catch (e: any) { setMsg(e.message); }
  }
  useEffect(() => { recarregar(); }, []);

  async function submeter() {
    if (!nome.trim()) return;
    try { await criar({ data: { nome: nome.trim() } }); setNome(""); recarregar(); }
    catch (e: any) { setMsg(e.message); }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-xl">Nova instituição</h2>
        <div className="mt-4 flex gap-2">
          <Input placeholder="Nome da instituição" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Button onClick={submeter}>Criar</Button>
        </div>
        {msg && <p className="mt-3 text-sm text-destructive">{msg}</p>}
      </div>
      <div className="rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="p-3">Nome</th><th className="p-3">ID</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {lista.map((i) => (
              <LinhaInst key={i.id} inst={i} onRename={async (n) => { await renomear({ data: { id: i.id, nome: n } }); recarregar(); }} />
            ))}
            {lista.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Sem instituições.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LinhaInst({ inst, onRename }: { inst: Instituicao; onRename: (nome: string) => Promise<void> }) {
  const [nome, setNome] = useState(inst.nome);
  const [editar, setEditar] = useState(false);
  return (
    <tr className="border-t border-border">
      <td className="p-3">
        {editar ? (
          <div className="flex gap-2">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            <Button size="sm" onClick={async () => { await onRename(nome); setEditar(false); }}>Guardar</Button>
          </div>
        ) : (
          <span className="font-medium">{inst.nome}</span>
        )}
      </td>
      <td className="p-3 font-mono text-xs text-muted-foreground">{inst.id.slice(0, 8)}…</td>
      <td className="p-3 text-right">
        <Button size="sm" variant="ghost" onClick={() => setEditar((v) => !v)}>{editar ? "Cancelar" : "Editar"}</Button>
      </td>
    </tr>
  );
}

function AbaTema() {
  const listarInst = useServerFn(listarInstituicoes);
  const listarComp = useServerFn(listarCompeticoesSuperAdmin);
  const [insts, setInsts] = useState<Instituicao[]>([]);
  const [comps, setComps] = useState<Comp[]>([]);
  const [tipo, setTipo] = useState<"instituicao" | "competicao">("instituicao");
  const [alvo, setAlvo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try { setInsts((await listarInst()) as Instituicao[]); } catch {}
      try { setComps((await listarComp()) as Comp[]); } catch {}
    })();
  }, []);

  const atual =
    tipo === "instituicao"
      ? insts.find((i) => i.id === alvo) ?? null
      : comps.find((c) => c.id === alvo) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={tipo}
          onChange={(e) => { setTipo(e.target.value as any); setAlvo(null); }}
        >
          <option value="instituicao">Tema por instituição</option>
          <option value="competicao">Tema por competição</option>
        </select>
        <select
          className="min-w-[280px] rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={alvo ?? ""}
          onChange={(e) => setAlvo(e.target.value || null)}
        >
          <option value="">— escolher —</option>
          {tipo === "instituicao"
            ? insts.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)
            : comps.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      {atual && (
        <EditorTema
          key={atual.id}
          tipo={tipo}
          alvo={atual as any}
          onGravado={async () => {
            if (tipo === "instituicao") setInsts((await listarInst()) as Instituicao[]);
            else setComps((await listarComp()) as Comp[]);
          }}
        />
      )}
    </div>
  );
}

function EditorTema({
  tipo,
  alvo,
  onGravado,
}: {
  tipo: "instituicao" | "competicao";
  alvo: Instituicao | Comp;
  onGravado: () => Promise<void>;
}) {
  const gravarInst = useServerFn(atualizarTemaInstituicao);
  const gravarComp = useServerFn(atualizarTemaCompeticao);
  const gravarIndustria = useServerFn(atualizarIndustria);
  const [tokens, setTokens] = useState<TemaTokens>(alvo.tema?.tokens ?? {});
  const [slots, setSlots] = useState<TemaSlots>(alvo.tema?.slots ?? {});
  const [industria, setIndustria] = useState<string>((alvo as Comp).industria ?? "mobiliario");
  const [msg, setMsg] = useState<string | null>(null);

  const camposTokens: { k: keyof TemaTokens; l: string; placeholder: string }[] = [
    { k: "navy", l: "Cor primária (navy)", placeholder: "oklch(0.28 0.06 250) ou #0E2740" },
    { k: "gold", l: "Cor de acento (gold)", placeholder: "oklch(0.74 0.12 82)" },
    { k: "paper", l: "Cor de fundo (paper)", placeholder: "oklch(0.96 0.015 85)" },
    { k: "goldForeground", l: "Texto sobre acento", placeholder: "" },
    { k: "fonteSerif", l: "Família serif", placeholder: '"Fraunces", Georgia, serif' },
    { k: "fonteMono", l: "Família mono", placeholder: '"JetBrains Mono", monospace' },
  ];
  const camposSlots: { k: keyof TemaSlots; l: string }[] = [
    { k: "logo", l: "Logo" },
    { k: "landing", l: "Imagem da landing" },
    { k: "cena_sede", l: "Cena da sede" },
    { k: "gabinete_CEO", l: "Gabinete CEO" },
    { k: "gabinete_CFO", l: "Gabinete CFO" },
    { k: "gabinete_COO", l: "Gabinete COO" },
    { k: "gabinete_CMO", l: "Gabinete CMO" },
    { k: "gabinete_CHRO", l: "Gabinete CHRO" },
    { k: "blueprint", l: "Blueprint (I&D)" },
    { k: "jornal_cabecalho", l: "Cabeçalho do jornal" },
  ];

  async function guardar() {
    try {
      const tema = { tokens, slots };
      if (tipo === "instituicao") await gravarInst({ data: { instituicao_id: alvo.id, tema } });
      else {
        await gravarComp({ data: { competicao_id: alvo.id, tema } });
        if (industria !== (alvo as Comp).industria) {
          await gravarIndustria({ data: { competicao_id: alvo.id, industria } });
        }
      }
      setMsg("Guardado.");
      onGravado();
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-serif text-xl">Editar tema — {alvo.nome}</h3>
        {tipo === "competicao" && (
          <div className="mt-4">
            <Label>Indústria</Label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={industria}
              onChange={(e) => setIndustria(e.target.value)}
            >
              <option value="mobiliario">Mobiliário</option>
            </select>
          </div>
        )}
        <div className="mt-6">
          <h4 className="font-mono text-xs uppercase tracking-widest text-slate">Tokens</h4>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {camposTokens.map((c) => (
              <div key={c.k}>
                <Label>{c.l}</Label>
                <Input
                  className="mt-1"
                  placeholder={c.placeholder}
                  value={(tokens[c.k] as string) ?? ""}
                  onChange={(e) => setTokens((t) => ({ ...t, [c.k]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <h4 className="font-mono text-xs uppercase tracking-widest text-slate">Slots de imagem (URL)</h4>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {camposSlots.map((c) => (
              <div key={c.k}>
                <Label>{c.l}</Label>
                <Input
                  className="mt-1"
                  placeholder="https://…"
                  value={(slots[c.k] as string) ?? ""}
                  onChange={(e) => setSlots((s) => ({ ...s, [c.k]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={guardar}>Guardar tema</Button>
          {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-slate">Pré-visualização</p>
        <TemaProvider temaCompeticao={{ tokens, slots }} escopo="container">
          <PreviewTema slots={slots} />
        </TemaProvider>
      </div>
    </div>
  );
}

function PreviewTema({ slots }: { slots: TemaSlots }) {
  const { slot } = useTema();
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="surface-navy p-6">
        {slot("logo") ? (
          <img src={slot("logo")} alt="logo" className="h-8" />
        ) : (
          <p className="font-serif text-xl text-paper">Kontor</p>
        )}
        <p className="mt-4 font-serif text-2xl text-paper">A gestão, decidida em equipa.</p>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-gold">Pré-visualização</p>
      </div>
      <div className="grid grid-cols-2 gap-2 bg-paper p-2">
        {(["cena_sede", "gabinete_CEO", "blueprint", "jornal_cabecalho"] as const).map((k) =>
          slots[k] ? (
            <img key={k} src={slots[k]!} alt={k} className="aspect-[3/2] w-full rounded object-cover" />
          ) : (
            <div key={k} className="flex aspect-[3/2] items-center justify-center rounded border border-dashed border-border text-[10px] uppercase text-muted-foreground">
              {k}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function AbaAuditoria() {
  const listarComp = useServerFn(listarCompeticoesSuperAdmin);
  const listarLog = useServerFn(listarLogAuditoria);
  const [comps, setComps] = useState<Comp[]>([]);
  const [competicao, setCompeticao] = useState<string>("");
  const [equipa, setEquipa] = useState<string>("");
  const [linhas, setLinhas] = useState<Log[]>([]);

  useEffect(() => { (async () => { try { setComps((await listarComp()) as Comp[]); } catch {} })(); }, []);

  async function pesquisar() {
    const dados: any = { limite: 200 };
    if (competicao) dados.competicao_id = competicao;
    if (equipa) dados.equipa_id = equipa;
    try { setLinhas((await listarLog({ data: dados })) as Log[]); } catch {}
  }
  useEffect(() => { pesquisar(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={competicao} onChange={(e) => setCompeticao(e.target.value)}>
          <option value="">Todas as competições</option>
          {comps.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <Input placeholder="Equipa UUID (opcional)" value={equipa} onChange={(e) => setEquipa(e.target.value)} className="max-w-[320px]" />
        <Button onClick={pesquisar}>Filtrar</Button>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="p-3">Quando</th><th className="p-3">Ação</th><th className="p-3">Alvo</th><th className="p-3">Payload</th></tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id} className="border-t border-border align-top">
                <td className="p-3 whitespace-nowrap font-mono text-xs text-muted-foreground">{new Date(l.ts).toLocaleString()}</td>
                <td className="p-3 font-medium">{l.acao}</td>
                <td className="p-3 font-mono text-xs">{l.alvo ?? "—"}</td>
                <td className="p-3 font-mono text-[11px] text-muted-foreground"><pre className="max-w-[420px] whitespace-pre-wrap break-words">{JSON.stringify(l.payload)}</pre></td>
              </tr>
            ))}
            {linhas.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sem registos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
