import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CATALOGO_MOLDES,
  CATEGORIAS,
  MOLDES_POR_CHAVE,
  type CategoriaMolde,
} from "@/lib/textos/catalogo";
import { interpolar, linhasParaVariantes, variaveisInvalidas } from "@/lib/textos/render";
import { listarMoldesDoEscopo, guardarMolde, reporMolde } from "@/lib/textos.functions";

type Escopo = "global" | "instituicao" | "competicao";

export function EditorTextos({
  escopo,
  instituicao_id = null,
  competicao_id = null,
  rotuloEscopo,
  categorias,
}: {
  escopo: Escopo;
  instituicao_id?: string | null;
  competicao_id?: string | null;
  rotuloEscopo: string;
  categorias?: CategoriaMolde[];
}) {
  const listar = useServerFn(listarMoldesDoEscopo);
  const guardar = useServerFn(guardarMolde);
  const repor = useServerFn(reporMolde);

  const categoriasVisiveis = useMemo(
    () => CATEGORIAS.filter((c) => !categorias || categorias.includes(c.id)),
    [categorias],
  );
  const [categoria, setCategoria] = useState<CategoriaMolde>(categoriasVisiveis[0]?.id ?? "board");
  const [pesquisa, setPesquisa] = useState("");
  const [gravados, setGravados] = useState<Record<string, string>>({});
  const [chave, setChave] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement | null>(null);

  async function recarregar() {
    try {
      const linhas = (await listar({ data: { escopo, instituicao_id, competicao_id } })) as {
        chave: string;
        texto: string;
      }[];
      const m: Record<string, string> = {};
      for (const l of linhas) m[l.chave] = l.texto;
      setGravados(m);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha a carregar os textos.");
    }
  }
  useEffect(() => {
    recarregar();
    setChave(null);
  }, [escopo, instituicao_id, competicao_id]);

  const lista = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    return CATALOGO_MOLDES.filter((m) => m.categoria === categoria).filter(
      (m) =>
        !termo ||
        m.rotulo.toLowerCase().includes(termo) ||
        m.chave.toLowerCase().includes(termo) ||
        m.variantes.some((v) => v.toLowerCase().includes(termo)),
    );
  }, [categoria, pesquisa]);

  const molde = chave ? MOLDES_POR_CHAVE[chave] : null;
  const personalizado = chave ? gravados[chave] != null : false;
  const variantes = linhasParaVariantes(rascunho);
  const invalidas = molde ? variaveisInvalidas(variantes, molde.variaveis.map((v) => v.nome)) : [];

  function abrir(k: string) {
    setChave(k);
    setMsg(null);
    setErro(null);
    setRascunho(gravados[k] ?? MOLDES_POR_CHAVE[k].variantes.join("\n"));
  }

  function inserirVariavel(nome: string) {
    const el = area.current;
    const marca = `{${nome}}`;
    if (!el) return setRascunho((t) => t + marca);
    const i = el.selectionStart ?? rascunho.length;
    const j = el.selectionEnd ?? i;
    setRascunho(rascunho.slice(0, i) + marca + rascunho.slice(j));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(i + marca.length, i + marca.length);
    });
  }

  async function gravarAgora() {
    if (!molde) return;
    setMsg(null);
    setErro(null);
    if (!variantes.length) return setErro("O molde tem de ter pelo menos uma formulação.");
    if (invalidas.length) {
      return setErro(
        `Variáveis inexistentes neste molde: ${invalidas.map((v) => `{${v}}`).join(", ")}.`,
      );
    }
    try {
      await guardar({ data: { chave: molde.chave, escopo, instituicao_id, competicao_id, texto: rascunho } });
      await recarregar();
      setMsg(`Gravado · ${variantes.length} formulação(ões).`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao gravar.");
    }
  }

  async function reporAgora() {
    if (!molde) return;
    setMsg(null);
    setErro(null);
    try {
      await repor({ data: { chave: molde.chave, escopo, instituicao_id, competicao_id } });
      await recarregar();
      setRascunho(molde.variantes.join("\n"));
      setMsg("Reposto o texto original.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao repor.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-sm">
        <span className="font-medium">A editar: {rotuloEscopo}.</span>{" "}
        <span className="text-muted-foreground">
          Os textos seguem a cascata competição → instituição → global → texto original do produto.
          Apagando tudo, o Kontor continua a funcionar com os textos originais.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {categoriasVisiveis.map((c) => (
          <button
            key={c.id}
            onClick={() => { setCategoria(c.id); setChave(null); }}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              categoria === c.id ? "border-gold bg-gold/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}
            title={c.nota}
          >
            {c.rotulo}
          </button>
        ))}
        <Input
          className="ml-auto max-w-[280px]"
          placeholder="Pesquisar molde ou texto…"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="max-h-[560px] overflow-auto rounded-lg border border-border bg-card">
          {lista.map((m) => (
            <button
              key={m.chave}
              onClick={() => abrir(m.chave)}
              className={`block w-full border-b border-border px-4 py-3 text-left text-sm last:border-0 transition-colors ${
                chave === m.chave ? "bg-secondary/60" : "hover:bg-secondary/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{m.rotulo}</span>
                {gravados[m.chave] != null && (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-gold">editado</span>
                )}
              </div>
              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.variantes[0]}</div>
            </button>
          ))}
          {lista.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Sem moldes para esta pesquisa.</p>
          )}
        </div>

        {molde ? (
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div>
              <h3 className="font-serif text-xl">{molde.rotulo}</h3>
              <p className="font-mono text-[11px] text-muted-foreground">{molde.chave}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {personalizado ? "Este escopo tem um texto próprio." : "A usar o texto original do produto."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_240px]">
              <div>
                <Label>Formulações (uma por linha — escolhidas por seed/turno)</Label>
                <Textarea
                  ref={area}
                  className="mt-1 min-h-[200px] font-mono text-[13px]"
                  value={rascunho}
                  onChange={(e) => setRascunho(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {variantes.length} formulação(ões). Acrescente linhas para variar o texto de turno para turno.
                </p>
              </div>
              <div>
                <Label>Variáveis disponíveis</Label>
                <div className="mt-1 space-y-1">
                  {molde.variaveis.length === 0 && (
                    <p className="text-xs text-muted-foreground">Este molde não usa variáveis.</p>
                  )}
                  {molde.variaveis.map((v) => (
                    <button
                      key={v.nome}
                      onClick={() => inserirVariavel(v.nome)}
                      className="block w-full rounded-md border border-border px-2 py-1.5 text-left text-xs hover:border-gold"
                    >
                      <span className="font-mono text-gold">{`{${v.nome}}`}</span>
                      <span className="block text-[11px] text-muted-foreground">{v.descricao}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-secondary/30 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Pré-visualização com dados de exemplo
              </p>
              <ul className="mt-2 space-y-2">
                {variantes.map((v, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    {interpolar(v, molde.exemplo) || <span className="text-muted-foreground">(vazio)</span>}
                  </li>
                ))}
                {variantes.length === 0 && (
                  <li className="text-sm text-muted-foreground">Sem formulações.</li>
                )}
              </ul>
            </div>

            {invalidas.length > 0 && (
              <p className="text-sm text-destructive">
                Variáveis inexistentes neste molde: {invalidas.map((v) => `{${v}}`).join(", ")}.
              </p>
            )}
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={gravarAgora} disabled={invalidas.length > 0}>Guardar texto</Button>
              <Button variant="ghost" onClick={reporAgora} disabled={!personalizado}>
                Repor o texto original
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-10 text-sm text-muted-foreground">
            Escolha um molde à esquerda para o editar.
          </div>
        )}
      </div>
    </div>
  );
}
