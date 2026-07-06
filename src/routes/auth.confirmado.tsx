import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/confirmado")({
  component: ConfirmadoPage,
});

type Estado = "a_verificar" | "sucesso" | "erro";

function ConfirmadoPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>("a_verificar");
  const [mensagem, setMensagem] = useState<string>("A confirmar a sua conta…");

  useEffect(() => {
    let cancelado = false;

    async function tratar() {
      try {
        // Fluxo antigo (implicit): tokens no hash da URL — o cliente Supabase
        // já processa automaticamente via detectSessionInUrl.
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const url = typeof window !== "undefined" ? new URL(window.location.href) : null;

        // Fluxo novo (PKCE / verifyOtp): parâmetros na query string.
        const token_hash = url?.searchParams.get("token_hash");
        const type = url?.searchParams.get("type");
        const errorDesc = url?.searchParams.get("error_description") ?? url?.searchParams.get("error");

        if (errorDesc) {
          throw new Error(errorDesc);
        }

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "signup" | "email" | "recovery" | "invite" | "email_change",
          });
          if (error) throw error;
        } else if (hash.includes("access_token")) {
          // O cliente hidrata a sessão sozinho; damos-lhe um instante.
          await new Promise((r) => setTimeout(r, 300));
        }

        const { data } = await supabase.auth.getSession();
        if (cancelado) return;

        if (data.session) {
          setEstado("sucesso");
          setMensagem("Conta confirmada com sucesso. A encaminhar para o painel…");
          setTimeout(() => {
            navigate({ to: "/painel", replace: true });
          }, 1200);
        } else {
          setEstado("sucesso");
          setMensagem("Conta confirmada. Já pode iniciar sessão.");
          setTimeout(() => {
            navigate({ to: "/auth", replace: true });
          }, 1500);
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function traduzErroConfirmacao(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("expired") || m.includes("expirou"))
    return "O link de confirmação expirou. Peça um novo email de confirmação.";
  if (m.includes("invalid") || m.includes("inválid"))
    return "O link de confirmação é inválido ou já foi utilizado.";
  if (m.includes("otp"))
    return "O código de confirmação já não é válido. Registe-se novamente ou peça um novo link.";
  return msg;
}
