import { Settings, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useJogo } from "./JogoContext";
import { Livre } from "./Livre";
import { LogoKontor } from "@/components/marca/LogoKontor";
import { LUGARES, type Acesso } from "@/lib/jogo/tipos";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";



function fmtPrazo(iso: string | null): string {
  if (!iso) return "—";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expirado";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

import { RitualFecho } from "./RitualFecho";

export function BarraTopo() {
  const {
    nomeEmpresa, acesso, setAcesso, modo, meu_lugar_real,
    ronda_indice, ronda_total, ronda_prazo, snapshotAtual, guardarNomePerfil,
    competicao_id, equipa_id,
    condutor, submeterTodos, resolverTurno, submetidos, setSala,
  } = useJogo() as any;

  const navigate = useNavigate();
  const [defAberto, setDefAberto] = useState(false);
  const [nomePerfil, setNomePerfil] = useState("");
  const [ocupadoCond, setOcupadoCond] = useState<"" | "submeter" | "resolver">("");
  const [confirmarResolver, setConfirmarResolver] = useState(false);
  const [ritualAberto, setRitualAberto] = useState(false);

  useEffect(() => {
    if (defAberto) {
      supabase.from("perfis").select("nome").eq("id", (supabase.auth as any)?._session?.user?.id ?? "")
        .then(async () => {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            const { data: p } = await supabase.from("perfis").select("nome").eq("id", data.user.id).maybeSingle();
            setNomePerfil(p?.nome ?? "");
          }
        });
    }
  }, [defAberto]);

  const inicial = nomeEmpresa.trim().charAt(0).toUpperCase() || "K";
  const caixa = Number(snapshotAtual?.caixa ?? 0);
  const valor = Number(snapshotAtual?.valor ?? 0);

  function mudarAcesso(v: string) {
    if (v === "docente") setAcesso({ modo: "docente" });
    else if (v === "condutor") setAcesso({ modo: "condutor" });
    else setAcesso({ modo: "jogador", meuLugar: v as Acesso extends { modo: "jogador"; meuLugar: infer L } ? L : never });
  }

  // Em modo real só permite alternar para o próprio lugar; docente demo continua a funcionar em modo demo.
  // Em modo condução (professor), mantém o próprio modo — não faz sentido alternar.
  const seletorOpcoes: { valor: string; rotulo: string; disabled?: boolean }[] =
    condutor
      ? [{ valor: "condutor", rotulo: "Condução — todos os lugares" }]
      : modo === "real"
      ? [
          { valor: "docente", rotulo: "Docente — pré-visualização" },
          ...LUGARES.map((l) => ({ valor: l, rotulo: `Jogador · ${l}`, disabled: meu_lugar_real !== l })),
        ]
      : [
          { valor: "docente", rotulo: "Docente — demo" },
          ...LUGARES.map((l) => ({ valor: l, rotulo: `Jogador · ${l}` })),
        ];

  const acessoValor = acesso.modo === "docente"
    ? "docente"
    : acesso.modo === "condutor"
    ? "condutor"
    : acesso.meuLugar;
  const todosSubmetidos = LUGARES.every((l) => submetidos?.[l]);

  return (
    <header className="surface-navy border-b" style={{ borderColor: "color-mix(in oklab, var(--gold) 30%, transparent)" }}>
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-6 py-3">
        <Link to="/painel" className="flex items-center gap-3" title="Voltar ao painel">
          <LogoKontor size={28} cor="gold" />
          <span className="font-serif text-base text-paper" style={{ fontWeight: 800 }}>Kontor</span>
          <span aria-hidden className="mx-1 h-6 w-px" style={{ background: "color-mix(in oklab, var(--gold) 30%, transparent)" }} />
          <Livre inicial={inicial} size={36} />
          <div className="leading-tight">
            <div className="font-serif text-lg text-paper">{nomeEmpresa}</div>
            <div className="mono text-[10px] uppercase tracking-[0.24em] text-gold">Kontor · painel</div>
          </div>
        </Link>


        <div className="hidden items-center gap-6 border-l pl-6 md:flex" style={{ borderColor: "color-mix(in oklab, var(--gold) 25%, transparent)" }}>
          <Bloco rotulo="Turno" valor={`${ronda_indice} / ${ronda_total}`} />
          <Bloco rotulo="Prazo" valor={fmtPrazo(ronda_prazo)} mono />
          <Bloco rotulo="Fase" valor={String(snapshotAtual?.fase_economica ?? "—")} />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Bloco rotulo="Caixa" valor={`${(caixa / 1000).toFixed(1)}k €`} mono />
          <Bloco rotulo="Valor" valor={`${(valor / 1000).toFixed(0)}k €`} mono />

          <select
            value={acessoValor}
            disabled={condutor}
            onChange={(e) => mudarAcesso(e.target.value)}
            className="mono cursor-pointer rounded-sm border bg-transparent px-2 py-1 text-[11px] uppercase tracking-widest text-paper focus:outline-none"
            style={{ borderColor: "var(--gold)" }}
          >
            {seletorOpcoes.map((o) => (
              <option key={o.valor} value={o.valor} disabled={o.disabled} className="text-foreground">
                {o.rotulo}
              </option>
            ))}
          </select>

          {competicao_id && equipa_id && (
            <Link
              to="/painel/jogador/competicao"
              search={{ competicao: competicao_id, equipa: equipa_id }}
              className="mono rounded-sm border px-2 py-1 text-[10px] uppercase tracking-widest text-paper hover:bg-gold/10"
              style={{ borderColor: "var(--gold)" }}
              title="Classificação"
            >
              <BarChart3 className="inline h-3 w-3" /> Classificação
            </Link>
          )}

          <button onClick={() => setDefAberto((v) => !v)} className="rounded-sm p-1.5 text-paper hover:bg-gold/10" title="Definições">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {condutor && (
        <div
          className="border-t px-6 py-2"
          style={{
            background: "color-mix(in oklab, var(--gold) 14%, transparent)",
            borderColor: "color-mix(in oklab, var(--gold) 35%, transparent)",
          }}
        >
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3">
            <span className="mono text-[10px] uppercase tracking-[0.24em] text-gold">
              Modo condução
            </span>
            <span className="font-serif text-sm text-paper">{nomeEmpresa}</span>
            <span className="mono text-[10px] uppercase tracking-widest text-paper/70">
              professor a conduzir todos os lugares
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                disabled={todosSubmetidos || ocupadoCond !== ""}
                onClick={async () => {
                  setOcupadoCond("submeter");
                  try { await submeterTodos(); } finally { setOcupadoCond(""); }
                }}
                className="mono rounded-sm border px-3 py-1 text-[10px] uppercase tracking-widest text-paper hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: "var(--gold)" }}
              >
                {ocupadoCond === "submeter" ? "A submeter…" : todosSubmetidos ? "Todos submetidos" : "Submeter todos os lugares"}
              </button>
              <button
                type="button"
                disabled={ocupadoCond !== ""}
                onClick={() => setConfirmarResolver(true)}
                className="mono rounded-sm bg-gold px-3 py-1 text-[10px] uppercase tracking-widest text-navy hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {ocupadoCond === "resolver" ? "A resolver…" : "Resolver turno agora"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={confirmarResolver} onOpenChange={setConfirmarResolver}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolver o turno agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Vou fechar a ronda atual, calcular resultados e abrir automaticamente a próxima ronda.
              As decisões submetidas ficam registadas; as pendentes serão consideradas em branco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirmarResolver(false);
                setOcupadoCond("resolver");
                try {
                  await resolverTurno();
                  setRitualAberto(true);
                } finally { setOcupadoCond(""); }
              }}
            >
              Resolver turno
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RitualFecho
        open={ritualAberto}
        onDone={() => { setRitualAberto(false); try { setSala?.("jornal"); } catch {} }}
      />


      {defAberto && (
        <div className="border-t bg-card px-6 py-3 text-foreground" style={{ borderColor: "color-mix(in oklab, var(--gold) 25%, transparent)" }}>
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3">
            <label className="mono text-[10px] uppercase tracking-widest text-muted-foreground">O meu nome</label>
            <input value={nomePerfil} onChange={(e) => setNomePerfil(e.target.value)}
              onBlur={() => nomePerfil.trim() && guardarNomePerfil(nomePerfil.trim())}
              className="rounded-sm border bg-background px-2 py-1 text-sm" />
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}
              className="mono ml-auto rounded-sm border px-3 py-1 text-[10px] uppercase tracking-widest hover:bg-muted"
            >
              Terminar sessão
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function Bloco({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div className="leading-tight">
      <div className="mono text-[9px] uppercase tracking-[0.24em] text-gold">{rotulo}</div>
      <div className={`${mono ? "mono" : "font-serif"} text-sm text-paper`}>{valor}</div>
    </div>
  );
}
