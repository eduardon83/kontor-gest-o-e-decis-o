import { AvatarColaborador } from "./AvatarColaborador";
import type { Arquetipo } from "@/lib/jogo/tipos";
import { ARQUETIPOS } from "@/lib/jogo/tipos";

/* ============================================================
 * Apresentação legível (PT-PT) dos resultados de acções de informação.
 * Nunca mostra JSON cru ao utilizador.
 * ============================================================ */

const PAPEL_ROTULO: Record<string, string> = {
  trabalhador: "Trabalhador",
  supervisor: "Supervisor",
  gestor_linha: "Chefe de linha",
  investigador: "Investigador",
};

const PRODUTO_ROTULO: Record<string, string> = {
  cadeira: "Cadeiras",
  mesa: "Mesas",
  armario: "Armários",
};

function normalizaArq(a: unknown): Arquetipo {
  if (typeof a !== "string" || !a) return "Esteio";
  const cap = a[0].toUpperCase() + a.slice(1).toLowerCase();
  return (ARQUETIPOS as readonly string[]).includes(cap) ? (cap as Arquetipo) : "Esteio";
}

function num(v: unknown, casas = 0): string {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-PT", { maximumFractionDigits: casas, minimumFractionDigits: casas });
}

function turnoLabel(t: unknown, offset: number): string {
  const base = Number(t);
  return Number.isFinite(base) ? `T${base + offset}` : `T?+${offset}`;
}

/* ============================================================
 * DIÁLOGO (CHRO)
 * ============================================================ */
function humorFrase(h: unknown, motivacao: number): string {
  const raw = typeof h === "string" ? h : "";
  if (raw === "otimista") return "Está otimista";
  if (raw === "desanimado") return "Está desanimado";
  if (raw === "reservado") return "Está reservado";
  if (motivacao > 70) return "Está otimista";
  if (motivacao < 45) return "Está desanimado";
  return "Está reservado";
}

function antiguidadeFrase(a: unknown): string {
  const n = Math.max(0, Math.round(Number(a ?? 0)));
  if (n === 0) return "recém-chegado";
  if (n === 1) return "há 1 turno na casa";
  return `há ${n} turnos na casa`;
}

function necessidadesFrases(nec: unknown): string[] {
  const n = (nec && typeof nec === "object") ? (nec as Record<string, unknown>) : {};
  const out: string[] = [];
  if (n.formacao) out.push("Sente falta de formação técnica.");
  if (n.pausa) out.push("Pede pausas mais previsíveis.");
  if (n.reconhecimento) out.push("Gostava de mais reconhecimento visível.");
  return out;
}

function ChipMetrico({ rotulo, valor, inverso }: { rotulo: string; valor: number; inverso?: boolean }) {
  const bom = inverso ? valor < 40 : valor > 60;
  return (
    <span
      className="mono inline-flex items-baseline gap-1 rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-widest"
      style={{
        borderColor: bom ? "var(--gold)" : "color-mix(in oklab, var(--slate) 40%, transparent)",
        color: bom ? "var(--gold)" : "var(--muted-foreground)",
      }}
    >
      <span>{rotulo}</span>
      <strong className="text-foreground">{valor}</strong>
    </span>
  );
}

function RenderDialogo({ r }: { r: any }) {
  const rep = r?.representante ?? null;
  const clima = r?.clima ?? r?.clima_equipa ?? {};
  const queixasRaw: unknown[] = Array.isArray(r?.queixas) ? r.queixas : [];
  const queixasHeur = rep ? necessidadesFrases(rep.necessidades) : [];
  const queixas = (queixasRaw.length ? queixasRaw.map(String) : queixasHeur).filter(Boolean);

  if (!rep) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem representante disponível neste turno — a equipa não tem colaboradores ativos.
      </p>
    );
  }

  const arq = normalizaArq(rep.arquetipo);
  const variante = (Number(rep.avatar_variante) === 2 ? 2 : 1) as 1 | 2;
  const nome = (rep.nome && String(rep.nome).trim()) || "Colaborador";
  const papel = PAPEL_ROTULO[String(rep.papel_org ?? "")] ?? "Colaborador";
  const moral = Math.round(Number(rep.moral ?? rep.motivacao ?? 0));
  const stress = Math.round(Number(rep.stress ?? 0));
  const climaLeitura = String(clima?.leitura ?? "clima estável, sem grande entusiasmo");
  const moralMedia = Math.round(Number(clima?.moral_media ?? 0));
  const stressMedio = Math.round(Number(clima?.stress_medio ?? clima?.stress_media ?? 0));

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <AvatarColaborador arquetipo={arq} variante={variante} size={56} />
        <div className="min-w-0 flex-1">
          <div className="font-serif text-base leading-tight">{nome}</div>
          <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {papel} · {arq} · {antiguidadeFrase(rep.antiguidade)}
          </div>
          <div className="mt-1 text-sm">{humorFrase(r?.humor, moral)}.</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ChipMetrico rotulo="Moral" valor={moral} />
            <ChipMetrico rotulo="Stress" valor={stress} inverso />
          </div>
        </div>
      </div>

      <div>
        <div className="mono mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          Queixas e observações
        </div>
        {queixas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Não trouxe queixas de maior.</p>
        ) : (
          <ul className="space-y-0.5 text-sm">
            {queixas.map((q, i) => (
              <li key={i}>· {q}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-sm border bg-muted/20 p-3">
        <div className="mono mb-1 text-[10px] uppercase tracking-widest text-gold">
          Leitura da equipa
        </div>
        <p className="text-sm">
          {climaLeitura[0].toUpperCase() + climaLeitura.slice(1)}.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <ChipMetrico rotulo="Moral média" valor={moralMedia} />
          <ChipMetrico rotulo="Stress médio" valor={stressMedio} inverso />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * ESTUDO ECONÓMICO (CFO)
 * ============================================================ */
function RenderEstudoEconomico({ r }: { r: any }) {
  const janela: any[] = Array.isArray(r?.janela) ? r.janela : [];
  const conf = Number(r?.confianca ?? 0);
  if (!janela.length) {
    return <p className="text-sm text-muted-foreground">Estudo sem projeções disponíveis.</p>;
  }
  return (
    <div className="space-y-2">
      <p className="text-sm">
        Trajetória macro projetada para os próximos {janela.length} turnos, com{" "}
        <strong>{Math.round(conf * 100)}%</strong> de confiança.
      </p>
      <div className="overflow-hidden rounded-sm border">
        <table className="w-full text-sm">
          <thead className="mono bg-muted/40 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-2 py-1 text-left">Turno</th>
              <th className="px-2 py-1 text-right">Juro</th>
              <th className="px-2 py-1 text-right">Inflação</th>
              <th className="px-2 py-1 text-right">Crescimento</th>
              <th className="px-2 py-1 text-right">Confiança</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {janela.map((m, i) => (
              <tr key={i}>
                <td className="mono px-2 py-1 text-[11px] uppercase tracking-widest">T{Number(m.turno)}</td>
                <td className="mono px-2 py-1 text-right">{num(m.juro, 1)}%</td>
                <td className="mono px-2 py-1 text-right">{num(m.inflacao, 1)}%</td>
                <td className="mono px-2 py-1 text-right">{num(m.crescimento, 1)}%</td>
                <td className="mono px-2 py-1 text-right">{num(m.confianca_mercado ?? m.confianca, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
 * PESQUISA DE MERCADO (CMO)
 * ============================================================ */
function RenderPesquisaMercado({ r }: { r: any }) {
  const proc = (r?.procura_relativa ?? {}) as Record<string, unknown>;
  const emerg: any[] = Array.isArray(r?.emergentes_visiveis) ? r.emergentes_visiveis : [];
  const conf = Number(r?.confianca ?? 0);
  const entradas = Object.entries(proc);

  const ordenadas = entradas
    .map(([k, v]) => ({ k, v: Number(v) }))
    .filter((x) => Number.isFinite(x.v))
    .sort((a, b) => b.v - a.v);

  return (
    <div className="space-y-2 text-sm">
      <p>
        O que o mercado procura hoje ({Math.round(conf * 100)}% de confiança):
      </p>
      {ordenadas.length === 0 ? (
        <p className="text-muted-foreground">Sem sinal claro nas linhas conhecidas.</p>
      ) : (
        <ul className="space-y-0.5">
          {ordenadas.map((x, i) => (
            <li key={x.k}>
              <strong>{PRODUTO_ROTULO[x.k] ?? x.k}</strong>{" "}
              — procura relativa {num(x.v, 2)}
              {i === 0 && ordenadas.length > 1 && (
                <span className="mono ml-2 text-[10px] uppercase tracking-widest text-gold">mais procurado</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {emerg.length > 0 && (
        <div className="rounded-sm border bg-muted/20 p-3">
          <div className="mono mb-1 text-[10px] uppercase tracking-widest text-gold">Tendências emergentes</div>
          <ul className="space-y-0.5">
            {emerg.map((e, i) => (
              <li key={i}>
                Linha <strong>{e.nome ?? "?"}</strong> em {PRODUTO_ROTULO[String(e.produto)] ?? e.produto}
                {" — "}ganho aparente de {num(Number(e.ganho ?? 0) * 100, 0)}%.
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * CONCORRÊNCIA (CEO)
 * ============================================================ */
function RenderConcorrencia({ r }: { r: any }) {
  const rivais: any[] = Array.isArray(r?.rivais) ? r.rivais : [];
  const conf = Number(r?.confianca ?? 0);
  if (!rivais.length) {
    return <p className="text-sm text-muted-foreground">Sem informação disponível sobre rivais ainda.</p>;
  }
  return (
    <div className="space-y-2 text-sm">
      <p>Perfil aparente dos rivais ({Math.round(conf * 100)}% de confiança):</p>
      <ul className="divide-y rounded-sm border">
        {rivais.map((v, i) => {
          const precos = v?.precos as Record<string, number> | undefined;
          return (
            <li key={i} className="p-2">
              <div className="font-serif text-sm">{v.nome ?? "Rival"}</div>
              <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Marca aparente {num(v.marca)}{v.ritmo ? ` · ritmo ${v.ritmo}` : ""}
              </div>
              {precos && (
                <div className="mt-1 text-xs">
                  Preços estimados —{" "}
                  {Object.entries(precos).map(([k, val], j, arr) => (
                    <span key={k}>
                      {PRODUTO_ROTULO[k] ?? k} €{num(Number(val), 0)}
                      {j < arr.length - 1 ? " · " : ""}
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ============================================================
 * ANÁLISE I&D (COO)
 * ============================================================ */
function RenderAnaliseId({ r }: { r: any }) {
  const bt: any[] = Array.isArray(r?.breakthroughs_visiveis) ? r.breakthroughs_visiveis : [];
  const conf = Number(r?.confianca ?? 0);
  const prog = r?.progresso;
  const dist = r?.distancia_breakthrough ?? r?.distancia;
  return (
    <div className="space-y-2 text-sm">
      <p>
        Estado da investigação ({Math.round(conf * 100)}% de confiança).
      </p>
      {prog != null && (
        <p>
          Progresso acumulado: <strong>{num(prog, 0)}</strong>.
        </p>
      )}
      {dist != null && (
        <p>
          Distância ao próximo <em>breakthrough</em>: <strong>{num(dist, 0)}</strong>.
        </p>
      )}
      {bt.length > 0 ? (
        <div>
          <div className="mono mb-1 text-[10px] uppercase tracking-widest text-gold">
            Breakthroughs à vista
          </div>
          <ul className="space-y-0.5">
            {bt.map((e, i) => (
              <li key={i}>
                <strong>{e.nome ?? "?"}</strong> em {PRODUTO_ROTULO[String(e.produto)] ?? e.produto}
                {" — "}ganho previsto de {num(Number(e.ganho ?? 0) * 100, 0)}%.
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-muted-foreground">Sem breakthroughs à vista nos próximos turnos.</p>
      )}
    </div>
  );
}

/* ============================================================
 * DESPACHO — escolhe a apresentação certa por tipo.
 * ============================================================ */
export function ResultadoPesquisa({
  tipo,
  resultado,
}: {
  tipo: string;
  resultado: Record<string, unknown> | null;
}) {
  if (!resultado) {
    return (
      <div className="mono mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        Resultado ainda em processamento…
      </div>
    );
  }
  switch (tipo) {
    case "dialogo":
      return <RenderDialogo r={resultado} />;
    case "estudo_economico":
      return <RenderEstudoEconomico r={resultado} />;
    case "pesquisa_mercado":
      return <RenderPesquisaMercado r={resultado} />;
    case "concorrencia":
      return <RenderConcorrencia r={resultado} />;
    case "analise_id":
      return <RenderAnaliseId r={resultado} />;
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Resultado registado (sem apresentação dedicada disponível).
        </p>
      );
  }
}
