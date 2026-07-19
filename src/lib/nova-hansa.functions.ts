import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LUGARES = ["CEO", "CFO", "COO", "CMO", "CHRO"] as const;

const membroSchema = z.object({
  lugar: z.enum(LUGARES),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  nome: z.string().trim().max(120).optional().or(z.literal("")),
});

const equipaAlunosSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  membros: z.array(membroSchema).max(5),
});

const paramsSchema = z.object({
  taxa_juro: z.number().min(0).max(8),
  inflacao: z.number().min(-1).max(12),
  crescimento: z.number().min(0.85).max(1.15),
  confianca: z.number().min(70).max(130),
  elasticidade: z.number().min(1.2).max(2.5),
  capital_inicial: z.number().min(0).max(10_000_000),
});

const inputSchema = z.object({
  nome: z.string().trim().min(1).max(160),
  ambito: z.enum(["intra_turma", "intra_escola", "inter_escola"]),
  industria: z.literal("mobiliario"),
  seed: z.number().int(),
  params: paramsSchema,
  duracao_turnos: z.number().int().min(1).max(40),
  // 0 = sem prazo automático (só avanço manual pelo professor). Default 168h = 1 semana.
  duracao_ronda_horas: z.number().min(0).max(24 * 60).default(168),
  modo: z.enum(["so_equipas", "vs_computador", "misto"]),
  n_mercados: z.number().int().min(1).max(8),
  equipas_alunos: z.array(equipaAlunosSchema).min(0).max(24),
  n_ia: z.number().int().min(0).max(12),
});


export type NovaHansaInput = z.infer<typeof inputSchema>;

function gerarCodigo(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "HANSA-";
  for (let i = 0; i < 4; i++) {
    out += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return out;
}

export const criarHansa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => inputSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verifica papel
    const { data: perfil, error: erroPerfil } = await supabase
      .from("perfis")
      .select("papel, instituicao_id")
      .eq("id", userId)
      .maybeSingle();

    if (erroPerfil || !perfil) throw new Error("Perfil não encontrado.");
    if (perfil.papel !== "professor" && perfil.papel !== "admin_escolar" && perfil.papel !== "super_admin") {
      throw new Error("Sem autorização para criar Hansas.");
    }

    // Código único (retry algumas vezes)
    let codigo = gerarCodigo();
    for (let tentativa = 0; tentativa < 6; tentativa++) {
      const { data: existente } = await supabase
        .from("competicoes")
        .select("id")
        .eq("codigo", codigo)
        .maybeSingle();
      if (!existente) break;
      codigo = gerarCodigo();
    }

    // Cria competicao
    const { data: comp, error: erroComp } = await supabase
      .from("competicoes")
      .insert({
        nome: data.nome,
        ambito: data.ambito,
        industria: data.industria,
        seed: data.seed,
        params: { ...data.params, duracao_ronda_horas: data.duracao_ronda_horas },
        duracao_turnos: data.duracao_turnos,
        instituicao_id: perfil.instituicao_id,
        criado_por: userId,
        codigo,
        estado: "aberta",
      })
      .select("id, codigo")
      .single();
    if (erroComp || !comp) throw new Error(erroComp?.message ?? "Falha a criar competição.");

    // Cria mercados
    const mercadosPayload = Array.from({ length: data.n_mercados }, (_, i) => ({
      competicao_id: comp.id,
      nome: `Mercado ${i + 1}`,
    }));
    const { data: mercados, error: erroMercados } = await supabase
      .from("mercados")
      .insert(mercadosPayload)
      .select("id, nome");
    if (erroMercados || !mercados) throw new Error(erroMercados?.message ?? "Falha a criar mercados.");

    // Distribui equipas por mercados
    const equipasParaCriar: { mercado_id: string; nome: string; is_ia: boolean }[] = [];
    const equipasAlunosMeta: { nome: string; membros: NovaHansaInput["equipas_alunos"][number]["membros"] }[] = [];

    if (data.modo !== "vs_computador") {
      data.equipas_alunos.forEach((eq, idx) => {
        equipasParaCriar.push({
          mercado_id: mercados[idx % mercados.length].id,
          nome: eq.nome,
          is_ia: false,
        });
        equipasAlunosMeta.push(eq);
      });
    }
    if (data.modo !== "so_equipas") {
      for (let i = 0; i < data.n_ia; i++) {
        equipasParaCriar.push({
          mercado_id: mercados[i % mercados.length].id,
          nome: `Adversário ${i + 1}`,
          is_ia: true,
        });
      }
    }

    let equipasCriadas: { id: string; nome: string; is_ia: boolean }[] = [];
    if (equipasParaCriar.length > 0) {
      const { data: eqs, error: erroEqs } = await supabase
        .from("equipas")
        .insert(equipasParaCriar)
        .select("id, nome, is_ia");
      if (erroEqs || !eqs) throw new Error(erroEqs?.message ?? "Falha a criar equipas.");
      equipasCriadas = eqs;
    }

    // Membros por email — usa cliente admin para resolver user_ids já existentes; para os
    // restantes emails guarda um convite com `email_convite` (o utilizador liga a si próprio
    // ao entrar por código com o email correspondente).
    const emailsParaResolver = new Set<string>();
    for (const eq of equipasAlunosMeta) {
      for (const m of eq.membros) {
        if (m.email && m.email.trim()) emailsParaResolver.add(m.email.trim().toLowerCase());
      }
    }

    const mapaEmailUser = new Map<string, string>();
    const emailsPendentes: string[] = [];
    if (emailsParaResolver.size > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const emails = Array.from(emailsParaResolver);
      const { data: perfis } = await supabaseAdmin
        .from("perfis")
        .select("id, email")
        .in("email", emails);
      for (const p of perfis ?? []) {
        if (p.email) mapaEmailUser.set(p.email.toLowerCase(), p.id);
      }
      for (const e of emails) if (!mapaEmailUser.has(e)) emailsPendentes.push(e);
    }

    const membrosPayload: { equipa_id: string; user_id: string | null; lugar: string; email_convite: string | null }[] = [];
    const equipasAlunosCriadas = equipasCriadas.filter((e) => !e.is_ia);
    equipasAlunosMeta.forEach((meta, idx) => {
      const equipa = equipasAlunosCriadas[idx];
      if (!equipa) return;
      const lugaresUsados = new Set<string>();
      for (const m of meta.membros) {
        const email = m.email?.trim().toLowerCase() || null;
        if (!email) continue;
        const chave = `${equipa.id}:${m.lugar}`;
        if (lugaresUsados.has(chave)) continue;
        lugaresUsados.add(chave);
        const uid = mapaEmailUser.get(email) ?? null;
        membrosPayload.push({ equipa_id: equipa.id, user_id: uid, lugar: m.lugar, email_convite: email });
      }
    });

    if (membrosPayload.length > 0) {
      const { error: erroMembros } = await supabase.from("membros_equipa").insert(membrosPayload);
      if (erroMembros) throw new Error(erroMembros.message);
    }

    // Ronda 1 aberta (com ou sem prazo automático).
    const abreEm = new Date();
    const prazoEm = data.duracao_ronda_horas > 0
      ? new Date(abreEm.getTime() + data.duracao_ronda_horas * 3_600_000).toISOString()
      : null;
    const { error: erroRonda } = await supabase.from("rondas").insert({
      competicao_id: comp.id,
      indice: 1,
      estado: "aberta",
      abre_em: abreEm.toISOString(),
      prazo_em: prazoEm,
    });
    if (erroRonda) throw new Error(erroRonda.message);


    // Fase 5 · chama a Edge Function `gerar_economia` (server-authoritative,
    // service-role) para produzir a economia oculta e os colaboradores a partir da seed.
    // Falhas aqui têm de ser visíveis: sem economia, o resolver não corre.
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error("Configuração do servidor em falta: SUPABASE_URL/SERVICE_ROLE_KEY.");
    }
    let respGE: Response;
    try {
      respGE = await fetch(`${url}/functions/v1/gerar_economia`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceKey}`,
          "apikey": serviceKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({ competicao_id: comp.id }),
      });
    } catch (e) {
      console.error("[gerar_economia] falha ao invocar", e);
      throw new Error(`Falha ao invocar gerar_economia: ${(e as Error).message}`);
    }
    const bodyGE = await respGE.json().catch(() => ({} as any));
    if (!respGE.ok || bodyGE?.ok === false) {
      console.error("[gerar_economia] erro", respGE.status, bodyGE);
      throw new Error(bodyGE?.error ?? `gerar_economia falhou (${respGE.status}).`);
    }

    return {
      competicao_id: comp.id,
      codigo: comp.codigo!,
      emails_pendentes: emailsPendentes,
    };
  });
