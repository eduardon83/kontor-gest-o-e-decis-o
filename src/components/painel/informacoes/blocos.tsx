import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Cartão de secção numerada — selo dourado + título serif, usado por todo o documento. */
export function SecaoCard({
  id,
  numero,
  titulo,
  tag,
  children,
}: {
  id: string;
  numero: string;
  titulo: string;
  tag?: string;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-28 border-border">
      <CardHeader className="flex flex-row flex-wrap items-baseline gap-3 border-b border-border pb-4">
        <span className="rounded-md border border-gold/40 bg-gold/15 px-2.5 py-1 font-mono text-sm font-semibold text-gold">
          {numero}
        </span>
        <h2 className="font-serif text-xl text-foreground">{titulo}</h2>
        {tag && (
          <span className="ml-auto whitespace-nowrap rounded-md border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {tag}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-5 text-sm leading-relaxed text-foreground/90">
        {children}
      </CardContent>
    </Card>
  );
}

/** Bloco de fórmula: fundo navy, rótulo dourado em maiúsculas, mono. Use <Var> para realçar variáveis-chave. */
export function Formula({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-navy px-4 py-4 font-mono text-[13px] leading-7 text-paper">
      <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
        {rotulo}
      </span>
      <div className="whitespace-pre-wrap">{children}</div>
    </div>
  );
}

/** Variável-chave realçada a dourado, para usar dentro de <Formula>. */
export function Var({ children }: { children: ReactNode }) {
  return <b className="font-semibold text-gold">{children}</b>;
}

/** Nota ou aviso: fundo dourado suave, borda-esquerda dourada. */
export function Nota({ children, titulo }: { children: ReactNode; titulo?: string }) {
  return (
    <div className="rounded-r-md border-l-4 border-gold bg-gold/10 px-4 py-3 text-sm text-foreground/90">
      {titulo && <b className="font-semibold text-navy">{titulo} </b>}
      {children}
    </div>
  );
}

export type ColunaTabela = { cabecalho: string; chave: string; mono?: boolean; nowrap?: boolean };

/** Tabela shadcn com cabeçalho mono/maiúsculas e 1ª coluna a bold navy; envolvida em overflow-x-auto. */
export function TabelaInfo({
  colunas,
  linhas,
}: {
  colunas: ColunaTabela[];
  linhas: Record<string, ReactNode>[];
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {colunas.map((c) => (
              <TableHead
                key={c.chave}
                className="whitespace-nowrap bg-muted/60 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground"
              >
                {c.cabecalho}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((linha, i) => (
            <TableRow key={i}>
              {colunas.map((c, j) => (
                <TableCell
                  key={c.chave}
                  className={cn(
                    "align-top text-sm",
                    j === 0 && "font-semibold text-navy",
                    c.mono && "font-mono text-[13px]",
                    c.nowrap && "whitespace-nowrap",
                  )}
                >
                  {linha[c.chave]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Lista numerada em passos, para o fluxo do turno. */
export function ListaPassos({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-0">
      {items.map((item, i) => (
        <li key={i} className={cn("flex gap-3 py-2 text-sm", i > 0 && "border-t border-border")}>
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy font-mono text-[11px] text-gold">
            {i + 1}
          </span>
          <span className="text-foreground/90">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/** Mini-cartão de lugar/papel (CEO, CFO, ...). */
export function CartaoLugar({ nome, area }: { nome: string; area: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2.5">
      <p className="font-serif text-base font-semibold text-navy">{nome}</p>
      <p className="text-[11.5px] text-muted-foreground">{area}</p>
    </div>
  );
}

export function GrelhaLugares({ lugares }: { lugares: { nome: string; area: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {lugares.map((l) => (
        <CartaoLugar key={l.nome} {...l} />
      ))}
    </div>
  );
}

/** Badge mono para indicadores/KPIs. */
export function Kpi({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1 font-mono text-[11px] text-navy">
      {children}
    </span>
  );
}

/** Cartão destacado de família de produto (Kontor / HR / Saúde). */
export function CartaoFamilia({
  eyebrow,
  nome,
  descricao,
  estado,
  children,
}: {
  eyebrow: string;
  nome: string;
  descricao: string;
  estado: "disponivel" | "conceção";
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border p-0">
      <div className="flex flex-wrap items-start justify-between gap-4 bg-navy px-6 py-5 text-paper">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{eyebrow}</p>
          <h3 className="mt-1 font-serif text-2xl text-paper">{nome}</h3>
          <p className="mt-1.5 max-w-[60ch] text-[13.5px] text-paper/75">{descricao}</p>
        </div>
        <span
          className={cn(
            "h-fit whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em]",
            estado === "disponivel"
              ? "bg-gold text-navy"
              : "border border-paper/30 bg-transparent text-paper/80",
          )}
        >
          {estado === "disponivel" ? "Disponível · protótipo" : "Em conceção"}
        </span>
      </div>
      <CardContent className="space-y-4 bg-card p-6 pt-5">{children}</CardContent>
    </Card>
  );
}

export function BlocoCampo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-1.5 font-serif text-sm font-semibold text-navy">{titulo}</h4>
      <div className="text-sm text-foreground/90">{children}</div>
    </div>
  );
}
