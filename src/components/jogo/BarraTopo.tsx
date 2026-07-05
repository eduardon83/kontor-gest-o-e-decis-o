import { Settings } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useJogo } from "./JogoContext";
import { Livre } from "./Livre";
import { LUGARES, type Acesso } from "@/lib/jogo/tipos";
import { EMPRESA_INICIAL } from "@/lib/jogo/dados-exemplo";

export function BarraTopo() {
  const { nomeEmpresa, acesso, setAcesso } = useJogo();
  const navigate = useNavigate();

  const inicial = nomeEmpresa.trim().charAt(0).toUpperCase() || "K";

  function mudarAcesso(v: string) {
    if (v === "docente") setAcesso({ modo: "docente" });
    else setAcesso({ modo: "jogador", meuLugar: v as Acesso extends { modo: "jogador"; meuLugar: infer L } ? L : never });
  }

  return (
    <header className="surface-navy border-b" style={{ borderColor: "color-mix(in oklab, var(--gold) 30%, transparent)" }}>
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-6 py-3">
        {/* Empresa */}
        <div className="flex items-center gap-3">
          <Livre inicial={inicial} size={40} />
          <div className="leading-tight">
            <div className="font-serif text-lg text-paper">{nomeEmpresa}</div>
            <div className="mono text-[10px] uppercase tracking-[0.24em] text-gold">Kontor</div>
          </div>
        </div>

        {/* Turno */}
        <div className="hidden items-center gap-6 border-l pl-6 md:flex" style={{ borderColor: "color-mix(in oklab, var(--gold) 25%, transparent)" }}>
          <Bloco rotulo="Turno" valor={`${EMPRESA_INICIAL.turno} / ${EMPRESA_INICIAL.turnos_total}`} />
          <Bloco rotulo="Prazo" valor={EMPRESA_INICIAL.prazo} mono />
          <Bloco rotulo="Fase" valor={EMPRESA_INICIAL.fase_economica} />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Bloco rotulo="Caixa" valor={`${(EMPRESA_INICIAL.caixa / 1000).toFixed(1)}k €`} mono />
          <Bloco rotulo="Valor" valor={`${(EMPRESA_INICIAL.valor / 1000).toFixed(0)}k €`} mono />

          {/* Seletor de acesso */}
          <select
            value={acesso.modo === "docente" ? "docente" : acesso.meuLugar}
            onChange={(e) => mudarAcesso(e.target.value)}
            className="mono cursor-pointer rounded-sm border bg-transparent px-2 py-1 text-[11px] uppercase tracking-widest text-paper focus:outline-none focus:ring-1"
            style={{ borderColor: "var(--gold)" }}
          >
            <option value="docente" className="text-foreground">Docente — demo</option>
            {LUGARES.map((l) => (
              <option key={l} value={l} className="text-foreground">Jogador · {l}</option>
            ))}
          </select>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
            className="rounded-sm p-1.5 text-paper transition-colors hover:bg-gold/10"
            aria-label="Definições"
            title="Definições"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
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
