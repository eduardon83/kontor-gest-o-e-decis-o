// Lida com todos os fluxos de confirmação de email do Supabase:
//   - PKCE novo: ?code=... (exchangeCodeForSession)
//   - OTP:       ?token_hash=...&type=signup|recovery|invite|email|email_change (verifyOtp)
//   - Implicit:  #access_token=...&refresh_token=... (detectSessionInUrl trata sozinho)
// Após confirmar, encaminha para /painel (que redireciona por papel).
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Estado = "a_verificar" | "sucesso" | "erro";

export function ConfirmacaoEmail() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>("a_verificar");
  const [mensagem, setMensagem] = useState<string>("A confirmar a sua conta…");

  useEffect(() => {
    let cancelado = false;

    async function tratar() {
      try {
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const url = typeof window !== "undefined" ? new URL(window.location.href) : null;

        const errorDesc =
          url?.searchParams.get("error_description") ?? url?.searchParams.get("error");
        if (errorDesc) throw new Error(decodeURIComponent(errorDesc));

        const code = url?.searchParams.get("code");
        const token_hash = url?.searchParams.get("token_hash");
        const type = url?.searchParams.get("type");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "signup" | "email" | "recovery" | "invite" | "email_change",
          });
          if (error) throw error;
        } else if (hash.includes("access_token")) {
          // O cliente hidrata sozinho via detectSessionInUrl.
          await new Promise((r) => setTimeout(r, 300));
        }

        const { data } = await supabase.auth.getSession();
        if (cancelado) return;

        if (data.session) {
          setEstado("sucesso");
          setMensagem("Conta confirmada. A encaminhar para o painel…");
          setTimeout(() => navigate({ to: "/painel", replace: true }), 900);
        } else {
          setEstado("sucesso");
          setMensagem("Conta confirmada. Já pode iniciar sessão.");
          setTimeout(() => navigate({ to: "/auth", replace: true }), 1200);
        }
      } catch (err) {
        if (cancelado) return;
        const raw = err instanceof Error ? err.message : "Não foi possível confirmar a conta.";
        setEstado("erro");
        setMensagem(traduzErroConfirmacao(raw));
      }
    }

    tratar();
    return () => {
      cancelado = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center">
        <Link to="/" className="mb-8 font-serif text-2xl">
          Kontor
        </Link>
        <div className="w-full rounded-md border border-border bg-card p-8">
          {estado === "a_verificar" && (
            <>
              <h1 className="font-serif text-2xl">A verificar…</h1>
              <p className="mt-3 text-sm text-muted-foreground">{mensagem}</p>
            </>
          )}
          {estado === "sucesso" && (
            <>
              <h1 className="font-serif text-2xl text-foreground">Conta confirmada</h1>
              <p className="mt-3 text-sm text-muted-foreground">{mensagem}</p>
            </>
          )}
          {estado === "erro" && (
            <>
              <h1 className="font-serif text-2xl text-destructive">Não foi possível confirmar</h1>
              <p className="mt-3 text-sm text-muted-foreground">{mensagem}</p>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  to="/auth"
                  className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Ir para o início de sessão
                </Link>
                <p className="text-xs text-muted-foreground">
                  No ecrã de entrada pode pedir um novo email de confirmação.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function traduzErroConfirmacao(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("expired") || m.includes("expirou"))
    return "O link de confirmação expirou. Peça um novo email de confirmação no ecrã de entrada.";
  if (m.includes("invalid") || m.includes("inválid"))
    return "O link de confirmação é inválido ou já foi utilizado. Se já confirmou, tente iniciar sessão.";
  if (m.includes("otp"))
    return "O código de confirmação já não é válido. Peça um novo email no ecrã de entrada.";
  if (m.includes("access_denied"))
    return "A confirmação foi cancelada. Volte a tentar a partir do email recebido.";
  return msg;
}
