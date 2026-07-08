import type { Snapshot } from "./JogoContext";

/* Formata € em pt-PT (sem casas decimais por defeito) */
export function fmtEUR(n: number): string {
  return `€${Math.round(n).toLocaleString("pt-PT")}`;
}
function fmtSigned(n: number): string {
  return `${n < 0 ? "−" : ""}${fmtEUR(Math.abs(n))}`;
}

/** Extrai o bloco financeiro do snapshot (ou null se ainda não existir). */
export function financeiroDo(snap: Snapshot | null | undefined): any | null {
  return (snap as any)?.financeiro ?? null;
}

const NOMES_PROD: Record<string, string> = {
  cadeira: "Cadeira", mesa: "Mesa", armario: "Armário",
};

export function PnLBalanco({ fin, turno }: { fin: any; turno: number }) {
  const pnl = fin.pnl;
  const bal = fin.balanco;
  const rec = fin.reconciliacao_caixa;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* P&L */}
      <section className="rounded-sm border bg-card">
        <header className="flex items-center justify-between border-b px-3 py-2">
          <h4 className="font-serif text-sm">Demonstração de resultados · T{turno}</h4>
          <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">P&amp;L</span>
        </header>
        <dl className="mono divide-y text-xs">
          <Bloco titulo="Receita (líquida do canal)">
            {(["cadeira","mesa","armario"] as const).map((p) => (
              <Row key={p} k={NOMES_PROD[p]} v={fmtEUR(Number(pnl.receita.por_linha?.[p] ?? 0))} />
            ))}
            <Row k="Receita total" v={fmtEUR(pnl.receita.total)} destaque />
          </Bloco>
          <Bloco titulo="COGS">
            {(["cadeira","mesa","armario"] as const).map((p) => (
              <Row key={p} k={NOMES_PROD[p]} v={`(${fmtEUR(Number(pnl.cogs.por_linha?.[p] ?? 0))})`} />
            ))}
            <Row k="COGS total" v={`(${fmtEUR(pnl.cogs.total)})`} destaque />
          </Bloco>
          <Row k="Margem bruta" v={fmtSigned(pnl.margem_bruta)} destaque />
          <Bloco titulo="Custos de estrutura">
            <Row k="Salários · trabalhadores" v={`(${fmtEUR(pnl.estrutura.salarios.trabalhadores)})`} />
            <Row k="Salários · supervisores" v={`(${fmtEUR(pnl.estrutura.salarios.supervisores)})`} />
            <Row k="Salários · investigadores" v={`(${fmtEUR(pnl.estrutura.salarios.investigadores)})`} />
            <Row k="Renda" v={`(${fmtEUR(pnl.estrutura.renda)})`} />
            <Row k="Depreciação" v={`(${fmtEUR(pnl.estrutura.depreciacao)})`} />
            <Row k="Marketing" v={`(${fmtEUR(pnl.estrutura.marketing)})`} />
            <Row k={`Força de vendas (${pnl.estrutura.forca_vendas.unidades} un)`} v={`(${fmtEUR(pnl.estrutura.forca_vendas.custo)})`} />
            <Row k="Formação" v={`(${fmtEUR(pnl.estrutura.formacao)})`} />
            <Row k="Bónus" v={`(${fmtEUR(pnl.estrutura.bonus)})`} />
            <Row k="Pesquisa de mercado" v={`(${fmtEUR(pnl.estrutura.pesquisa_mercado)})`} />
            <Row k="Ações de informação" v={`(${fmtEUR(pnl.estrutura.pesquisas_info)})`} />
            <Row k="Custos de estrutura" v={`(${fmtEUR(pnl.estrutura.total)})`} destaque />
          </Bloco>
          <Bloco titulo={`I&D (${pnl.id.modo})`}>
            {pnl.id.orcamento > 0 && <Row k="Orçamento" v={`(${fmtEUR(pnl.id.orcamento)})`} />}
            {pnl.id.licenca > 0 && <Row k="Licença" v={`(${fmtEUR(pnl.id.licenca)})`} />}
            {pnl.id.investigadores_custo > 0 && <Row k="Investigadores" v={`(${fmtEUR(pnl.id.investigadores_custo)})`} />}
            <Row k="I&D total" v={`(${fmtEUR(pnl.id.total)})`} destaque />
          </Bloco>
          <Row k="Juros" v={`(${fmtEUR(pnl.juros)})`} />
          <Row k="Resultado antes de impostos" v={fmtSigned(pnl.resultado_antes_impostos)} destaque />
          <Row
            k={`Imposto (${Math.round(pnl.imposto.taxa * 100)}%)${pnl.imposto.escudo_prejuizos > 0 ? ` · escudo ${fmtEUR(pnl.imposto.escudo_prejuizos)}` : ""}`}
            v={`(${fmtEUR(pnl.imposto.valor)})`}
          />
          <Row k="Resultado líquido" v={fmtSigned(pnl.resultado_liquido)} destaque />
        </dl>
      </section>

      {/* Balanço + reconciliação */}
      <section className="rounded-sm border bg-card">
        <header className="flex items-center justify-between border-b px-3 py-2">
          <h4 className="font-serif text-sm">Balanço fim de T{turno}</h4>
          <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Balance sheet</span>
        </header>
        <dl className="mono divide-y text-xs">
          <Bloco titulo="Ativo">
            <Row k="Caixa" v={fmtEUR(bal.ativo.caixa)} />
            <Row k="Ativos produtivos (máquinas)" v={fmtEUR(bal.ativo.ativos_produtivos)} />
            <Row k="Ativo total" v={fmtEUR(bal.ativo.total)} destaque />
          </Bloco>
          <Bloco titulo="Passivo">
            <Row k="Dívida" v={fmtEUR(bal.passivo.divida)} />
            <Row k="Passivo total" v={fmtEUR(bal.passivo.total)} destaque />
          </Bloco>
          <Row k="Capital próprio (residual)" v={fmtEUR(bal.capital_proprio)} destaque />
          <Row k="Marca (valor contab.)" v={fmtEUR(bal.marca_valor)} />
          <Row k="Valor da empresa" v={fmtEUR(bal.valor_empresa)} destaque />
          <Row
            k="Ativo = Passivo + Capital"
            v={bal.fecha ? "✓ fecha" : "✗ não fecha"}
          />
        </dl>

        <header className="flex items-center justify-between border-b border-t px-3 py-2">
          <h4 className="font-serif text-sm">Reconciliação da caixa</h4>
        </header>
        <dl className="mono divide-y text-xs">
          <Row k="Caixa inicial" v={fmtEUR(rec.caixa_inicial)} />
          <Row k="+ Resultado líquido" v={fmtSigned(rec.resultado_liquido)} />
          <Row k="− CAPEX (máquinas)" v={`(${fmtEUR(rec.capex)})`} />
          <Row k="+ Empréstimo novo" v={fmtEUR(rec.emprestimo_novo)} />
          <Row k="− Amortização" v={`(${fmtEUR(rec.amortizar)})`} />
          <Row k="− Dividendos" v={`(${fmtEUR(rec.dividendos)})`} />
          <Row k="− Indemnizações" v={`(${fmtEUR(rec.indemnizacoes)})`} />
          <Row k="Caixa final" v={fmtEUR(rec.caixa_final)} destaque />
          <Row k="Reconciliação" v={rec.fecha ? "✓ fecha" : "✗ não fecha"} />
        </dl>
      </section>
    </div>
  );
}

/* ────────────── CSV export ────────────── */

export function relatorioParaCSV(fin: any, extras: { equipa: string; competicao: string; turno: number }): string {
  const rows: (string | number)[][] = [];
  rows.push(["Relatório de gestão"]);
  rows.push(["Competição", extras.competicao]);
  rows.push(["Equipa", extras.equipa]);
  rows.push(["Turno", extras.turno]);
  rows.push([]);
  rows.push(["P&L", "Valor (€)"]);
  const pnl = fin.pnl;
  for (const p of ["cadeira","mesa","armario"]) {
    rows.push([`Receita ${p}`, Math.round(Number(pnl.receita.por_linha?.[p] ?? 0))]);
  }
  rows.push(["Receita total", Math.round(pnl.receita.total)]);
  for (const p of ["cadeira","mesa","armario"]) {
    rows.push([`COGS ${p}`, -Math.round(Number(pnl.cogs.por_linha?.[p] ?? 0))]);
  }
  rows.push(["COGS total", -Math.round(pnl.cogs.total)]);
  rows.push(["Margem bruta", Math.round(pnl.margem_bruta)]);
  rows.push(["Salários trabalhadores", -Math.round(pnl.estrutura.salarios.trabalhadores)]);
  rows.push(["Salários supervisores", -Math.round(pnl.estrutura.salarios.supervisores)]);
  rows.push(["Salários investigadores", -Math.round(pnl.estrutura.salarios.investigadores)]);
  rows.push(["Renda", -Math.round(pnl.estrutura.renda)]);
  rows.push(["Depreciação", -Math.round(pnl.estrutura.depreciacao)]);
  rows.push(["Marketing", -Math.round(pnl.estrutura.marketing)]);
  rows.push(["Força de vendas", -Math.round(pnl.estrutura.forca_vendas.custo)]);
  rows.push(["Formação", -Math.round(pnl.estrutura.formacao)]);
  rows.push(["Bónus", -Math.round(pnl.estrutura.bonus)]);
  rows.push(["Pesquisa de mercado", -Math.round(pnl.estrutura.pesquisa_mercado)]);
  rows.push(["Ações de informação", -Math.round(pnl.estrutura.pesquisas_info)]);
  rows.push(["I&D total", -Math.round(pnl.id.total)]);
  rows.push(["Juros", -Math.round(pnl.juros)]);
  rows.push(["Resultado antes de impostos", Math.round(pnl.resultado_antes_impostos)]);
  rows.push(["Imposto", -Math.round(pnl.imposto.valor)]);
  rows.push(["Escudo prejuízos usado", Math.round(pnl.imposto.escudo_prejuizos)]);
  rows.push(["Resultado líquido", Math.round(pnl.resultado_liquido)]);
  rows.push([]);
  const bal = fin.balanco;
  rows.push(["Balanço", "Valor (€)"]);
  rows.push(["Caixa", Math.round(bal.ativo.caixa)]);
  rows.push(["Ativos produtivos", Math.round(bal.ativo.ativos_produtivos)]);
  rows.push(["Ativo total", Math.round(bal.ativo.total)]);
  rows.push(["Dívida", Math.round(bal.passivo.divida)]);
  rows.push(["Capital próprio (residual)", Math.round(bal.capital_proprio)]);
  rows.push(["Marca (valor)", Math.round(bal.marca_valor)]);
  rows.push(["Valor da empresa", Math.round(bal.valor_empresa)]);
  rows.push([]);
  const rec = fin.reconciliacao_caixa;
  rows.push(["Reconciliação da caixa", "Valor (€)"]);
  rows.push(["Caixa inicial", Math.round(rec.caixa_inicial)]);
  rows.push(["Resultado líquido", Math.round(rec.resultado_liquido)]);
  rows.push(["CAPEX", -Math.round(rec.capex)]);
  rows.push(["Empréstimo novo", Math.round(rec.emprestimo_novo)]);
  rows.push(["Amortização", -Math.round(rec.amortizar)]);
  rows.push(["Dividendos", -Math.round(rec.dividendos)]);
  rows.push(["Indemnizações", -Math.round(rec.indemnizacoes)]);
  rows.push(["Caixa final", Math.round(rec.caixa_final)]);
  rows.push([]);
  if (Array.isArray(fin.eventos) && fin.eventos.length) {
    rows.push(["Eventos"]);
    for (const e of fin.eventos) rows.push([String(e)]);
  }
  return rows.map((r) => r.map(cellCsv).join(",")).join("\n");
}

function cellCsv(v: string | number): string {
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function descarregarCSV(nome: string, conteudo: string) {
  const blob = new Blob([`\uFEFF${conteudo}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome.endsWith(".csv") ? nome : `${nome}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ────────────── Sub-componentes ────────────── */

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="p-3">
      <div className="mono mb-1 text-[9px] uppercase tracking-widest text-muted-foreground">{titulo}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Row({ k, v, destaque }: { k: string; v: string; destaque?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 px-3 py-1 ${destaque ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
      <span className="min-w-0 flex-1 truncate">{k}</span>
      <span className={destaque ? "text-foreground" : ""}>{v}</span>
    </div>
  );
}
