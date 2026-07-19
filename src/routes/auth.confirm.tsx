// Alias para /auth/confirm — nome usado pelos templates default do Supabase.
import { createFileRoute } from "@tanstack/react-router";
import { ConfirmacaoEmail } from "@/components/auth/ConfirmacaoEmail";

export const Route = createFileRoute("/auth/confirm")({
  component: ConfirmacaoEmail,
});
