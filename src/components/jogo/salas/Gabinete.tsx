import { useJogo } from "../JogoContext";
import { FundoGabinete } from "./FundoGabinete";
import { KpiDashboard } from "../KpiDashboard";
import { ObjetoPesquisa } from "../ObjetoPesquisa";
import { ControlosPasta } from "../ControlosPasta";
import { RosterCHRO } from "./RosterCHRO";

export function Gabinete() {
  const { lugarVisto } = useJogo();

  return (
    <div className="space-y-6">
      <FundoGabinete lugar={lugarVisto} />

      <KpiDashboard lugar={lugarVisto} comSeparadores={lugarVisto === "CEO"} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ObjetoPesquisa lugar={lugarVisto} />
        <ControlosPasta lugar={lugarVisto} />
      </div>

      {lugarVisto === "CHRO" && <RosterCHRO />}
    </div>
  );
}
