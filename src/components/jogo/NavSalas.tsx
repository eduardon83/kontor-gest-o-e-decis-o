import { Briefcase, Building2, Factory, FlaskConical, Store, Newspaper } from "lucide-react";
import { useJogo } from "./JogoContext";
import { SALAS, type SalaId } from "@/lib/jogo/tipos";

const ICONE: Record<SalaId, React.ComponentType<{ className?: string }>> = {
  gabinete: Briefcase,
  board: Building2,
  fabrica: Factory,
  laboratorio: FlaskConical,
  ruas: Store,
  jornal: Newspaper,
};

export function NavSalas() {
  const { sala, setSala } = useJogo();
  return (
    <aside className="w-56 shrink-0 border-r bg-card">
      <div className="mono px-4 py-3 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        Salas
      </div>
      <ul className="space-y-0.5 px-2">
        {SALAS.map((s) => {
          const Icone = ICONE[s.id];
          const ativo = sala === s.id;
          return (
            <li key={s.id}>
              <button
                onClick={() => setSala(s.id)}
                className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors ${
                  ativo
                    ? "bg-navy text-paper"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icone className={`h-4 w-4 ${ativo ? "text-gold" : "text-muted-foreground"}`} />
                <span className={ativo ? "font-medium" : ""}>{s.nome}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
