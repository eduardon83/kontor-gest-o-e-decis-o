import { Lock } from "lucide-react";
import { useJogo } from "./JogoContext";
import { LUGARES, PAPEL_COMPLETO } from "@/lib/jogo/tipos";

export function BarraLugares() {
  const { lugarVisto, setLugarVisto, podeEditar, submetidos } = useJogo();
  return (
    <nav className="border-b bg-card">
      <div className="mx-auto flex max-w-[1400px] items-stretch gap-0 overflow-x-auto px-6">
        {LUGARES.map((l) => {
          const ativo = l === lugarVisto;
          const editavel = podeEditar(l);
          const sub = submetidos[l];
          return (
            <button
              key={l}
              onClick={() => setLugarVisto(l)}
              className={`group relative flex min-w-[130px] items-center gap-2 border-b-2 px-4 py-3 text-left transition-colors ${
                ativo
                  ? "border-gold bg-muted/40"
                  : "border-transparent hover:bg-muted/30"
              }`}
              aria-current={ativo}
            >
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-base text-foreground">{l}</span>
                  {!editavel && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
                <div className="mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  {PAPEL_COMPLETO[l]}
                </div>
              </div>
              <span
                className={`ml-auto inline-block h-1.5 w-1.5 rounded-full ${
                  sub ? "bg-gold" : "bg-muted-foreground/40"
                }`}
                title={sub ? "Submetido" : "Por submeter"}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
