import { Settings, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useJogo } from "./JogoContext";
import { Livre } from "./Livre";
import { LUGARES, type Acesso } from "@/lib/jogo/tipos";


function fmtPrazo(iso: string | null): string {
  if (!iso) return "—";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expirado";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export function BarraTopo() {
  const {
    nomeEmpresa, acesso, setAcesso, modo, meu_lugar_real,
    ronda_indice, ronda_total, ronda_prazo, snapshotAtual, guardarNomePerfil,
  } = useJogo();
  const navigate = useNavigate();
  const [defAberto, setDefAberto] = useState(false);
  const [nomePerfil, setNomePerfil] = useState("");

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
    else setAcesso({ modo: "jogador", meuLugar: v as Acesso extends { modo: "jogador"; meuLugar: infer L } ? L : never });
  }

  // Em modo real só permite alternar para o próprio lugar; docente demo continua a funcionar em modo demo.
  const seletorOpcoes: { valor: string; rotulo: string; disabled?: boolean }[] =
    modo === "real"
      ? [
          { valor: "docente", rotulo: "Docente — pré-visualização" },
          ...LUGARES.map((l) => ({ valor: l, rotulo: `Jogador · ${l}`, disabled: meu_lugar_real !== l })),
        ]
      : [
          { valor: "docente", rotulo: "Docente — demo" },
          ...LUGARES.map((l) => ({ valor: l, rotulo: `Jogador · ${l}` })),
        ];

  return (
    <header className="surface-navy border-b" style={{ borderColor: "color-mix(in oklab, var(--gold) 30%, transparent)" }}>
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <Livre inicial={inicial} size={40} />
          <div className="leading-tight">
            <div className="font-serif text-lg text-paper">{nomeEmpresa}</div>
            <div className="mono text-[10px] uppercase tracking-[0.24em] text-gold">Kontor</div>
          </div>
        </div>

        <div className="hidden items-center gap-6 border-l pl-6 md:flex" style={{ borderColor: "color-mix(in oklab, var(--gold) 25%, transparent)" }}>
          <Bloco rotulo="Turno" valor={`${ronda_indice} / ${ronda_total}`} />
          <Bloco rotulo="Prazo" valor={fmtPrazo(ronda_prazo)} mono />
          <Bloco rotulo="Fase" valor={String(snapshotAtual?.fase_economica ?? "—")} />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Bloco rotulo="Caixa" valor={`${(caixa / 1000).toFixed(1)}k €`} mono />
          <Bloco rotulo="Valor" valor={`${(valor / 1000).toFixed(0)}k €`} mono />

          <select
            value={acesso.modo === "docente" ? "docente" : acesso.meuLugar}
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

          <button onClick={() => setDefAberto((v) => !v)} className="rounded-sm p-1.5 text-paper hover:bg-gold/10" title="Definições">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

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
