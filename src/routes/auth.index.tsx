import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogoKontor } from "@/components/marca/LogoKontor";

export const Route = createFileRoute("/auth/")({
  component: AuthPage,
});

type Mode = "login" | "registo";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);
  const [emailEnviadoPara, setEmailEnviadoPara] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setACarregar(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/painel", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirmado`,
            data: { nome },
          },
        });
        if (error) throw error;

        // Se a confirmação de email estiver ativa (default), NÃO há sessão ainda.
        // Se o professor tiver desativado a confirmação (auto-confirm), já há sessão.
        if (data.session) {
          navigate({ to: "/painel", replace: true });
        } else {
          setEmailEnviadoPara(email);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ocorreu um erro.";
      setErro(traduzErro(msg));
    } finally {
      setACarregar(false);
    }
  }

  async function reenviarEmail() {
    if (!emailEnviadoPara) return;
    setErro(null);
    setACarregar(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailEnviadoPara,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirmado` },
      });
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível reenviar o email.";
      setErro(traduzErro(msg));
    } finally {
      setACarregar(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex min-h-screen max-w-6xl">
        <aside className="surface-navy hidden w-1/2 flex-col justify-between p-12 md:flex">
          <Link to="/" className="flex items-center gap-3">
            <LogoKontor size={36} cor="gold" />
            <span className="font-serif text-2xl text-paper" style={{ fontWeight: 800 }}>Kontor</span>
          </Link>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold">
              Área de docente / instituição
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-paper">
              A gestão de uma empresa, aprendida a decidir.
            </h1>
            <p className="mt-6 max-w-md text-sm text-paper/70">
              Aceda ao seu espaço para preparar turmas, criar jogos de Hansa e acompanhar as
              decisões das equipas.
            </p>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-paper/40">
            Navy · Gold · Paper
          </div>
        </aside>

        <main className="flex w-full items-center justify-center p-6 md:w-1/2 md:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 md:hidden">
              <Link to="/" className="flex items-center gap-3">
                <LogoKontor size={32} cor="navy" />
                <span className="font-serif text-2xl" style={{ fontWeight: 800 }}>Kontor</span>
              </Link>
            </div>

            {emailEnviadoPara ? (
              <div className="rounded-md border border-border bg-card p-6">
                <h2 className="font-serif text-2xl">Confirme o seu email</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Enviámos um email de confirmação para{" "}
                  <strong className="text-foreground">{emailEnviadoPara}</strong>.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Abra o email e clique no link para ativar a sua conta. Sem esta confirmação
                  não é possível iniciar sessão.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Não recebeu? Verifique a pasta de <em>spam</em> ou <em>promoções</em>. O email
                  pode demorar alguns minutos a chegar.
                </p>

                {erro && (
                  <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {erro}
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={reenviarEmail}
                    disabled={aCarregar}
                    className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
                  >
                    {aCarregar ? "A reenviar…" : "Reenviar email de confirmação"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailEnviadoPara(null);
                      setMode("login");
                      setErro(null);
                    }}
                    className="w-full rounded-md px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Já confirmei — iniciar sessão
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex gap-1 rounded-md border border-border bg-card p-1 text-sm">
                  {(["login", "registo"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMode(m);
                        setErro(null);
                      }}
                      className={`flex-1 rounded px-3 py-2 font-medium transition-colors ${
                        mode === m
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m === "login" ? "Entrar" : "Criar conta"}
                    </button>
                  ))}
                </div>

                <h2 className="font-serif text-2xl">
                  {mode === "login" ? "Bem-vindo de volta" : "Criar a sua conta"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === "login"
                    ? "Introduza o email e palavra-passe."
                    : "Registo com email e palavra-passe. Vai receber um email de confirmação."}
                </p>

                <form onSubmit={submeter} className="mt-6 space-y-4">
                  {mode === "registo" && (
                    <Campo
                      id="nome"
                      label="Nome"
                      value={nome}
                      onChange={setNome}
                      autoComplete="name"
                      required
                    />
                  )}
                  <Campo
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                    required
                  />
                  <Campo
                    id="password"
                    label="Palavra-passe"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                    minLength={6}
                  />

                  {erro && (
                    <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {erro}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={aCarregar}
                    className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {aCarregar
                      ? "A processar…"
                      : mode === "login"
                        ? "Entrar"
                        : "Criar conta"}
                  </button>
                </form>

                {mode === "login" && (
                  <div className="mt-4 text-center text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email.trim()) {
                          setErro("Introduza o email primeiro para reenviarmos a confirmação.");
                          return;
                        }
                        setErro(null);
                        setACarregar(true);
                        try {
                          const { error } = await supabase.auth.resend({
                            type: "signup",
                            email: email.trim(),
                            options: {
                              emailRedirectTo: `${window.location.origin}/auth/confirmado`,
                            },
                          });
                          if (error) throw error;
                          setEmailEnviadoPara(email.trim());
                        } catch (err) {
                          const msg =
                            err instanceof Error ? err.message : "Não foi possível reenviar.";
                          setErro(traduzErro(msg));
                        } finally {
                          setACarregar(false);
                        }
                      }}
                      className="text-gold hover:underline"
                    >
                      Não recebeu o email de confirmação? Reenviar.
                    </button>
                  </div>
                )}

                <div className="mt-6 border-t border-border pt-6 text-center text-xs text-muted-foreground">
                  É aluno num jogo?{" "}
                  <Link to="/entrar-hansa" className="text-gold hover:underline">
                    Entrar com código de Hansa
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Campo(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1.5 block text-sm font-medium text-foreground">
        {props.label}
      </label>
      <input
        id={props.id}
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        required={props.required}
        minLength={props.minLength}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </div>
  );
}

function traduzErro(msg: string): string {
  const m = msg.toLowerCase();

  // Credenciais / login
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "Email ou palavra-passe incorretos.";
  if (m.includes("email not confirmed") || m.includes("not confirmed"))
    return "A sua conta ainda não foi confirmada. Verifique o email que lhe enviámos.";

  // Registo — email já usado
  if (
    m.includes("already registered") ||
    m.includes("already exists") ||
    m.includes("user already")
  )
    return "Já existe uma conta com este email. Tente iniciar sessão.";

  // Palavra-passe — força / HIBP
  if (
    m.includes("password is known to be weak") ||
    m.includes("pwned") ||
    m.includes("compromised") ||
    (m.includes("weak") && m.includes("password"))
  )
    return "Esta palavra-passe é demasiado fraca ou é conhecida publicamente. Escolha outra mais segura.";
  if (m.includes("password should be at least") || (m.includes("password") && m.includes("6")))
    return "A palavra-passe deve ter pelo menos 6 caracteres.";
  if (m.includes("password") && (m.includes("short") || m.includes("length")))
    return "A palavra-passe é demasiado curta.";

  // Email inválido / formato
  if (m.includes("invalid email") || m.includes("email address") && m.includes("invalid"))
    return "O endereço de email é inválido.";
  if (m.includes("email") && m.includes("required"))
    return "Introduza o seu email.";

  // Rate limit
  if (m.includes("rate limit") || m.includes("too many"))
    return "Demasiadas tentativas. Aguarde alguns minutos e tente novamente.";
  if (m.includes("for security purposes") && m.includes("seconds"))
    return "Por segurança, aguarde alguns segundos antes de tentar novamente.";

  // OTP / link expirado
  if (m.includes("expired") || m.includes("token has expired"))
    return "O link expirou. Peça um novo email de confirmação.";
  if (m.includes("otp") && m.includes("invalid"))
    return "Código de confirmação inválido ou já utilizado.";

  // Signup desativado
  if (m.includes("signups not allowed") || m.includes("signup disabled"))
    return "Novos registos estão temporariamente desativados.";

  // Rede
  if (m.includes("network") || m.includes("failed to fetch"))
    return "Sem ligação. Verifique a sua rede e tente novamente.";

  return msg;
}
