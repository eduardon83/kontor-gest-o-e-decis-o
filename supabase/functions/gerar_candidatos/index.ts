// gerar_candidatos — devolve deterministicamente o pool de candidatos e o
// representante do turno para uma dada equipa/ronda. Consultivo (não escreve).
import { admin, corsHeaders, json } from "../_shared/supabase.ts";
import { escolherRepresentante, gerarPoolCandidatos } from "../_shared/candidatos.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { equipa_id, ronda_id } = await req.json();
    if (!equipa_id || !ronda_id) throw new Error("equipa_id/ronda_id em falta");
    const sb = admin();

    const { data: eq } = await sb.from("equipas").select("mercado_id").eq("id", equipa_id).maybeSingle();
    if (!eq) throw new Error("equipa não encontrada");
    const { data: merc } = await sb.from("mercados").select("competicao_id").eq("id", eq.mercado_id).maybeSingle();
    if (!merc) throw new Error("mercado não encontrado");
    const { data: comp } = await sb.from("competicoes").select("seed").eq("id", merc.competicao_id).maybeSingle();
    const { data: ronda } = await sb.from("rondas").select("indice").eq("id", ronda_id).maybeSingle();
    if (!comp || !ronda) throw new Error("competição/ronda em falta");

    const fonte = {
      competicaoSeed: Number(comp.seed),
      rondaIndice: Number(ronda.indice),
      equipaId: equipa_id as string,
    };
    const candidatos = gerarPoolCandidatos(fonte);

    const { data: cols } = await sb.from("colaboradores")
      .select("id").eq("equipa_id", equipa_id).eq("ativo", true);
    const representante_id = escolherRepresentante(fonte, (cols ?? []).map((c) => c.id));

    return json({ ok: true, candidatos, representante_id });
  } catch (e) {
    console.error("[gerar_candidatos]", e);
    return json({ ok: false, error: (e as Error).message }, 400);
  }
});
