import { createFileRoute } from "@tanstack/react-router";
import { ConfirmacaoEmail } from "@/components/auth/ConfirmacaoEmail";

export const Route = createFileRoute("/auth/confirmado")({
  component: ConfirmacaoEmail,
});
