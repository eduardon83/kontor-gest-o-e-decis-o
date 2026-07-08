import { Check, Circle } from "lucide-react";
import { useJogo } from "./JogoContext";
import { LUGARES, PAPEL_COMPLETO } from "@/lib/jogo/tipos";

export function EstadoEquipa() {
  const { submetidos } = useJogo();
  const feitos = LUGARES.filter((l) => submetidos[l]).length;
  const faltam = LUGARES.length - feitos;

  return (
    <div className="rounded-sm border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Estado da equipa
        </div>
        <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {faltam === 0 ? "Todos submetidos" : `Faltam ${faltam} de ${LUGARES.length}`}
        </div>
      </div>
      <ul className="grid grid-cols-5 gap-2">
        {LUGARES.map((l) => {
          const ok = submetidos[l];
          return (
            <li
              key={l}
              className={`flex flex-col items-center gap-1 rounded-sm border px-2 py-2 text-center ${
                ok ? "border-gold/40 bg-gold/5" : "border-border"
              }`}
              title={ok ? "Submetido" : "Pendente"}
            >
              {ok ? (
                <Check className="h-3.5 w-3.5 text-gold" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
              <div className="font-serif text-sm leading-none">{l}</div>
              <div className="mono text-[9px] uppercase tracking-widest text-muted-foreground">
                {PAPEL_COMPLETO[l]}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
