import { createFileRoute } from "@tanstack/react-router";
import { PainelShell, Placeholder } from "@/components/painel/PainelShell";

export const Route = createFileRoute("/_authenticated/painel/jogador")({
  component: () => (
    <PainelShell
      papel="jogador"
      titulo="A sua empresa"
      descricao="Decida com a sua equipa, semana após semana. O mercado responde."
    >
      <Placeholder
        items={[
          { t: "Pasta executiva", d: "A sua área de decisão dentro da equipa." },
          { t: "Semana em curso", d: "Propostas, debate e submissão em equipa." },
          { t: "Mercado", d: "Preços, procura, concorrência e indicadores." },
        ]}
      />
    </PainelShell>
  ),
});
