import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
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
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/painel`,
            data: { nome },
          },
        });
        if (error) throw error;
      }
      navigate({ to: "/painel", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ocorreu um erro.";
      setErro(traduzErro(msg));
    } finally {
      setACarregar(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex min-h-screen max-w-6xl">
        <aside className="surface-navy hidden w-1/2 flex-col justify-between p-12 md:flex">
          <Link to="/" className="font-serif text-2xl text-paper">
            Kontor
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
              <Link to="/" className="font-serif text-2xl">
                Kontor
              </Link>
            </div>

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
                : "Registo com email e palavra-passe."}
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

            <div className="mt-6 border-t border-border pt-6 text-center text-xs text-muted-foreground">
              É aluno num jogo?{" "}
              <Link to="/entrar-hansa" className="text-gold hover:underline">
                Entrar com código de Hansa
              </Link>
            </div>
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
  if (/invalid login/i.test(msg)) return "Credenciais inválidas.";
  if (/already registered|already exists/i.test(msg))
    return "Já existe uma conta com este email.";
  if (/password/i.test(msg) && /6/.test(msg))
    return "A palavra-passe deve ter pelo menos 6 caracteres.";
  return msg;
}
