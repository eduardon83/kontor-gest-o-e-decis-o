import { createFileRoute } from "@tanstack/react-router";
import { PainelShell, Placeholder } from "@/components/painel/PainelShell";

export const Route = createFileRoute("/_authenticated/painel/admin-escolar")({
  component: () => (
    <PainelShell
      papel="admin_escolar"
      titulo="Administração da instituição"
      descricao="Turmas, docentes e licenças de utilização do Kontor na sua instituição."
    >
      <Placeholder
        items={[
          { t: "Docentes", d: "Convidar e gerir os docentes da instituição." },
          { t: "Turmas", d: "Organizar cursos, turmas e grupos de alunos." },
          { t: "Relatórios", d: "Utilização e desempenho por curso." },
        ]}
      />
    </PainelShell>
  ),
});
