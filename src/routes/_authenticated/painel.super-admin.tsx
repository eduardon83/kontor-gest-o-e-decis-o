import { createFileRoute } from "@tanstack/react-router";
import { PainelShell, Placeholder } from "@/components/painel/PainelShell";

export const Route = createFileRoute("/_authenticated/painel/super-admin")({
  component: () => (
    <PainelShell
      papel="super_admin"
      titulo="Gestão global do Kontor"
      descricao="Supervisão de instituições, licenças, papéis e configuração do simulador."
    >
      <Placeholder
        items={[
          { t: "Instituições", d: "Criar, editar e suspender instituições parceiras." },
          { t: "Utilizadores globais", d: "Atribuir papéis e resolver acessos." },
          { t: "Parâmetros do motor", d: "Constantes de mercado e regras de jogo." },
        ]}
      />
    </PainelShell>
  ),
});
