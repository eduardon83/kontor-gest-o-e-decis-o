import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROTAS_POR_PAPEL, type Papel } from "@/lib/painel";

export const Route = createFileRoute("/_authenticated/painel/")({
  component: Encaminhador,
});

function Encaminhador() {
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      const { data, error } = await supabase
        .from("perfis")
        .select("papel")
        .eq("id", userRes.user.id)
        .maybeSingle();
      if (error) {
        setErro(error.message);
        return;
      }
      const papel = (data?.papel as Papel) ?? "jogador";
      navigate({ to: ROTAS_POR_PAPEL[papel], replace: true });
    })();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate">Kontor</p>
        <p className="mt-3 font-serif text-lg">
          {erro ? `Erro: ${erro}` : "A preparar o seu painel…"}
        </p>
      </div>
    </div>
  );
}
