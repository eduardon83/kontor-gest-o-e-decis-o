import { createFileRoute } from "@tanstack/react-router";
import { PainelShell, Placeholder } from "@/components/painel/PainelShell";

export const Route = createFileRoute("/_authenticated/painel/professor")({
  component: () => (
    <PainelShell
      papel="professor"
      titulo="Os seus jogos de Hansa"
      descricao="Prepare mercados, forme equipas, avance semanas e acompanhe decisões."
    >
      <Placeholder
        items={[
          { t: "Novo jogo", d: "Configurar um mercado e gerar códigos de Hansa." },
          { t: "Equipas", d: "Distribuir pastas: CEO, CFO, COO, CMO, CHRO." },
          { t: "Acompanhamento", d: "Ver decisões semanais e resposta do mercado." },
        ]}
      />
    </PainelShell>
  ),
});
