import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Tema } from "@/lib/tema/tipos";

const temaSchema = z.object({
  tokens: z
    .object({
      navy: z.string().max(120).optional(),
      gold: z.string().max(120).optional(),
      goldForeground: z.string().max(120).optional(),
      paper: z.string().max(120).optional(),
      fonteSerif: z.string().max(200).optional(),
      fonteMono: z.string().max(200).optional(),
    })
    .partial()
    .optional(),
  slots: z
    .object({
      logo: z.string().url().max(600).optional().or(z.literal("")),
      cena_sede: z.string().url().max(600).optional().or(z.literal("")),
      gabinete_CEO: z.string().url().max(600).optional().or(z.literal("")),
      gabinete_CFO: z.string().url().max(600).optional().or(z.literal("")),
      gabinete_COO: z.string().url().max(600).optional().or(z.literal("")),
      gabinete_CMO: z.string().url().max(600).optional().or(z.literal("")),
      gabinete_CHRO: z.string().url().max(600).optional().or(z.literal("")),
      blueprint: z.string().url().max(600).optional().or(z.literal("")),
      jornal_cabecalho: z.string().url().max(600).optional().or(z.literal("")),
      landing: z.string().url().max(600).optional().or(z.literal("")),
    })
    .partial()
    .optional(),
});

function limpar(t: Tema): Tema {
  const tokens = t.tokens ? Object.fromEntries(Object.entries(t.tokens).filter(([, v]) => v)) : undefined;
  const slots = t.slots ? Object.fromEntries(Object.entries(t.slots).filter(([, v]) => v)) : undefined;
  return { tokens, slots };
}

/** Atualiza o tema de uma instituição. Autorizado a super_admin ou admin_escolar da própria instituição. */
export const atualizarTemaInstituicao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ instituicao_id: z.string().uuid(), tema: temaSchema }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("instituicoes")
      .update({ tema: limpar(data.tema) as never })
      .eq("id", data.instituicao_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Atualiza o tema de uma competição. Autorizado ao criador da competição, admin_escolar da instituição, ou super_admin. */
export const atualizarTemaCompeticao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ competicao_id: z.string().uuid(), tema: temaSchema }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("competicoes")
      .update({ tema: limpar(data.tema) as never })
      .eq("id", data.competicao_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Atualiza a indústria da competição (por agora só "mobiliario", mas o campo é livre). */
export const atualizarIndustria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ competicao_id: z.string().uuid(), industria: z.string().min(1).max(48) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("competicoes")
      .update({ industria: data.industria })
      .eq("id", data.competicao_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
