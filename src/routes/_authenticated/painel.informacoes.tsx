import { createFileRoute } from "@tanstack/react-router";
import { PainelShell } from "@/components/painel/PainelShell";
import {
  SecaoCard,
  Formula,
  Var,
  Nota,
  TabelaInfo,
  ListaPassos,
  GrelhaLugares,
  CartaoFamilia,
  Kpi,
  BlocoCampo,
} from "@/components/painel/informacoes/blocos";

export const Route = createFileRoute("/_authenticated/painel/informacoes")({
  component: PaginaInformacoes,
});

type GrupoIndice = {
  titulo: string;
  itens: { href: string; num: string; label: string }[];
};

const GRUPOS_INDICE: GrupoIndice[] = [
  {
    titulo: "Visão geral",
    itens: [
      { href: "#s0", num: "00", label: "Introdução" },
      { href: "#s1", num: "01", label: "Objetivo e vitória" },
    ],
  },
  {
    titulo: "Como se joga",
    itens: [
      { href: "#s2", num: "02", label: "Estrutura" },
      { href: "#s3", num: "03", label: "Fluxo do turno" },
      { href: "#s4", num: "04", label: "Decisões por lugar" },
      { href: "#s5", num: "05", label: "Resolução por precedência" },
    ],
  },
  {
    titulo: "O motor",
    itens: [
      { href: "#s6", num: "06", label: "Modelo económico" },
      { href: "#s7", num: "07", label: "Camada organizacional" },
      { href: "#s8", num: "08", label: "Ações de informação" },
      { href: "#s9", num: "09", label: "Árvore de I&D" },
      { href: "#s10", num: "10", label: "Seed" },
    ],
  },
  {
    titulo: "Competição & relatórios",
    itens: [
      { href: "#s11", num: "11", label: "Modos de competição" },
      { href: "#s12", num: "12", label: "Relatório de turno" },
    ],
  },
  {
    titulo: "Plataforma",
    itens: [
      { href: "#s13", num: "13", label: "Acessos" },
      { href: "#s14", num: "14", label: "Camadas de utilização" },
      { href: "#s15", num: "15", label: "Ecrãs e interface" },
    ],
  },
  {
    titulo: "Famílias de produto",
    itens: [{ href: "#familias", num: "—", label: "Geral · HR · Saúde" }],
  },
];

function PaginaInformacoes() {
  return (
    <PainelShell
      papel="professor"
      titulo="Informações gerais"
      descricao="O desenho completo do simulador, pela ordem do documento de design."
    >
      <div className="mb-8 flex flex-wrap gap-2">
        <Kpi>Indústria-piloto: mobiliário</Kpi>
        <Kpi>Equipa: 3–5 lugares</Kpi>
        <Kpi>Turno: 1 semana · época 10–40</Kpi>
        <Kpi>Vitória: valor da empresa</Kpi>
      </div>

      <div className="grid items-start gap-8 min-[900px]:grid-cols-[240px_1fr]">
        <IndiceLateral />
        <div className="min-w-0 space-y-5">
          <SeccaoIntroducao />
          <SeccaoObjetivo />
          <SeccaoEstrutura />
          <SeccaoFluxo />
          <SeccaoDecisoes />
          <SeccaoPrecedencia />
          <SeccaoModeloEconomico />
          <SeccaoOrganizacional />
          <SeccaoInformacao />
          <SeccaoID />
          <SeccaoSeed />
          <SeccaoModos />
          <SeccaoRelatorio />
          <SeccaoAcessos />
          <SeccaoCamadas />
          <SeccaoEcras />
          <SeccaoFamilias />
        </div>
      </div>
    </PainelShell>
  );
}

function IndiceLateral() {
  return (
    <nav
      aria-label="Índice das secções"
      className="min-[900px]:sticky min-[900px]:top-6 min-[900px]:max-h-[calc(100vh-3rem)] min-[900px]:overflow-y-auto"
    >
      <div className="rounded-lg border border-border bg-card p-4 min-[900px]:border-0 min-[900px]:bg-transparent min-[900px]:p-0">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gold">Índice</p>
        {GRUPOS_INDICE.map((grupo) => (
          <div key={grupo.titulo} className="mb-4 last:mb-0">
            <p className="mb-1.5 font-serif text-xs font-semibold uppercase tracking-[0.08em] text-slate">
              {grupo.titulo}
            </p>
            <ul className="space-y-0.5">
              {grupo.itens.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="flex items-center gap-2 rounded-sm px-1 py-1 text-[13px] text-foreground/80 outline-none transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2"
                  >
                    <span className="w-6 shrink-0 font-mono text-[11px] font-semibold text-gold">
                      {item.num}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

function SeccaoIntroducao() {
  return (
    <SecaoCard id="s0" numero="00" titulo="Introdução">
      <p>
        Kontor é um simulador de gestão inspirado em aprendizagem baseada em jogos e em
        predecessores como o GMC. Permite que alunos de gestão e economia, em equipa, compreendam e
        avaliem os impactos das suas decisões ao longo de vários turnos, levando uma empresa ao
        sucesso num mercado competitivo.
      </p>
      <p>
        Preparado para equipas de 3–5 jogadores, contra IA, contra outras equipas ou ambos. O
        protótipo cobre uma indústria (mobiliário); no futuro alarga-se a outros produtos e serviços
        e a novas avenidas (cadeias de valor, RH, inovação).
      </p>
      <Nota>
        Valores em euros; contexto socioeconómico inspirado num país centro-europeu da UE, 2026.
      </Nota>
    </SecaoCard>
  );
}

function SeccaoObjetivo() {
  return (
    <SecaoCard id="s1" numero="01" titulo="Objetivo e vitória">
      <p>
        Cada equipa gere uma empresa num mercado partilhado e economia simulada (protótipo: fabrico
        de mobiliário). Critério de vitória único: o <b>valor da empresa</b> no fim da época.
        Restantes dados (decisões, progresso, fundamentação, coordenação, indicadores) vão para o
        docente.
      </p>
      <Formula rotulo="Cálculo do valor">
        <Var>valor</Var> = caixa + ativos_fixos·mv + marca·k_marca − dívida + max(0,
        resultado)·k_lucro
        <br />
        <span className="text-paper/70">com </span>
        <Var>mv</Var> = €30 000, <Var>k_marca</Var> = 1 500, <Var>k_lucro</Var> = 2
      </Formula>
    </SecaoCard>
  );
}

function SeccaoEstrutura() {
  return (
    <SecaoCard id="s2" numero="02" titulo="Estrutura">
      <p>Cinco lugares executivos:</p>
      <GrelhaLugares
        lugares={[
          { nome: "CEO", area: "Direção & Capital" },
          { nome: "CFO", area: "Finanças & Risco" },
          { nome: "COO", area: "Operações & Produção" },
          { nome: "CMO", area: "Mercado & Vendas" },
          { nome: "CHRO", area: "Pessoas & Organização" },
        ]}
      />
      <p>
        Equipa 3–5 (5 ideal, um por lugar; 3 mínimo com acumulação CEO+CFO, COO+CHRO, CMO). Turno =
        1 semana; época 1–40 (piloto 10–16). Cadência: iniciantes 1 turno/semana, fim de curso até
        2/semana.
      </p>
      <p>Mercado: N equipas partilham a mesma seed/economia (modos em §11).</p>
    </SecaoCard>
  );
}

function SeccaoFluxo() {
  return (
    <SecaoCard id="s3" numero="03" titulo="Fluxo do turno">
      <ListaPassos
        items={[
          "Início de turno — condições iniciais (missão da Board).",
          "Cada lugar submete decisões + (opcional) 1 ação de informação [não bloqueante].",
          "Política de ausente (status-quo | pior caso).",
          "Resolução por precedência (§5).",
          "Eventos imediatos (greve, push) ajustam capacidade.",
          "Resolução económica (§6) com multiplicadores organizacionais (§7).",
          "Eventos diferidos (breakthrough, saída de talento, burnout).",
          "Atualização de fatores (vigora no turno seguinte).",
          "Relatório e notícias (§12).",
        ]}
      />
      <Nota titulo="Consequência com lag.">
        A economia resolve-se com os fatores herdados do início do turno; as decisões deste turno
        atualizam os fatores para o turno seguinte.
      </Nota>
    </SecaoCard>
  );
}

function SeccaoDecisoes() {
  return (
    <SecaoCard id="s4" numero="04" titulo="Decisões por lugar" tag="25 decisões + I&D">
      <p>Uma tabela por lugar, colunas: Decisão | Tipo | Intervalo/guardrail.</p>

      <BlocoCampo titulo="CEO · Direção & Capital">
        <TabelaInfo
          colunas={[
            { cabecalho: "Decisão", chave: "d" },
            { cabecalho: "Tipo", chave: "t" },
            { cabecalho: "Intervalo / guardrail", chave: "g" },
          ]}
          linhas={[
            {
              d: "Postura estratégica",
              t: "enum",
              g: "Crescimento / Rentabilidade / Quota / Equilíbrio",
            },
            { d: "Dividendos", t: "% lucro", g: "0–100 %, só lucro positivo" },
            {
              d: "Capital próprio",
              t: "emitir/nada/recomprar + valor",
              g: "emissão ≤ 1× capital atual/turno",
            },
            { d: "Teto de dívida", t: "€", g: "0–€300 000, enquadra o CFO" },
            { d: "Portefólio", t: "linhas ativas/saída", g: "só linhas desbloqueadas" },
            { d: "(I&D) Alvo de produto", t: "nó §9", g: "abre nova linha" },
          ]}
        />
      </BlocoCampo>

      <BlocoCampo titulo="CFO · Finanças & Risco">
        <TabelaInfo
          colunas={[
            { cabecalho: "Decisão", chave: "d" },
            { cabecalho: "Tipo", chave: "t" },
            { cabecalho: "Intervalo / guardrail", chave: "g" },
          ]}
          linhas={[
            { d: "Margem mínima", t: "% markup", g: "10–80 %, enquadra o CMO" },
            {
              d: "Financiamento",
              t: "pedir/nada/amortizar + valor",
              g: "pedido ≤ teto CEO − dívida atual",
            },
            {
              d: "Tesouraria",
              t: "enum",
              g: "Conservador min €20k / Equilibrado min €8k / Agressivo min €0k",
            },
            { d: "Orçamento de capex", t: "€", g: "0–caixa, enquadra o COO" },
            {
              d: "Fiscalidade",
              t: "usar prejuízos/seguro",
              g: "seguro custa €1 500 fixo e corta 50 % do custo de eventos adversos",
            },
            { d: "(I&D) Orçamento de I&D", t: "€", g: "0–caixa" },
          ]}
        />
      </BlocoCampo>

      <BlocoCampo titulo="COO · Operações & Produção">
        <TabelaInfo
          colunas={[
            { cabecalho: "Decisão", chave: "d" },
            { cabecalho: "Tipo", chave: "t" },
            { cabecalho: "Intervalo / guardrail", chave: "g" },
          ]}
          linhas={[
            { d: "Produção por linha", t: "unidades", g: "0–capacidade·1,5, excesso descartado" },
            { d: "Capacidade máquinas Δ", t: "inteiro", g: "compra €60 000 ≤ capex CFO" },
            {
              d: "Horas extra",
              t: "h/semana",
              g: "0–40; >0 agrava stress e custo unitário — 1,5× custo/hora, +10 stress",
            },
            {
              d: "Subcontratação",
              t: "% por linha",
              g: "0–50 %, +18 % custo unitário, −15 % qualidade",
            },
            { d: "Qualidade", t: "enum", g: "Standard/Fine/Artisan; Fine/Artisan exigem I&D §9" },
            {
              d: "(I&D) Processo + modo",
              t: "nó §9 + interno/licença",
              g: "licença = €45 000 imediato",
            },
          ]}
        />
      </BlocoCampo>

      <BlocoCampo titulo="CMO · Mercado & Vendas">
        <TabelaInfo
          colunas={[
            { cabecalho: "Decisão", chave: "d" },
            { cabecalho: "Tipo", chave: "t" },
            { cabecalho: "Intervalo / guardrail", chave: "g" },
          ]}
          linhas={[
            { d: "Preço por linha", t: "€", g: "≥ preço-piso do CFO, sobe ao piso se abaixo" },
            { d: "Marketing", t: "€", g: "0–caixa" },
            {
              d: "Canais",
              t: "enum",
              g: "Grosso 0,85× preço +10 % alcance / Direto 1× preço +2 marca/turno −10 % alcance / Exportação ×0,72 preço líquido +procura externa",
            },
            { d: "Força de vendas", t: "inteiro", g: "€2 500/turno por unidade, +4 % apelo" },
            { d: "(Informação) Pesquisa de mercado", t: "nível 1/2/3", g: "§8" },
          ]}
        />
      </BlocoCampo>

      <BlocoCampo titulo="CHRO · Pessoas & Organização">
        <TabelaInfo
          colunas={[
            { cabecalho: "Decisão", chave: "d" },
            { cabecalho: "Tipo", chave: "t" },
            { cabecalho: "Intervalo / guardrail", chave: "g" },
          ]}
          linhas={[
            {
              d: "Salário vs. mercado",
              t: "%",
              g: "85–120 %; <100 % agrava attrition, −8 moral, 90 %→4 pp, 85 %→6 pp; ≥110 % +6 moral",
            },
            {
              d: "Contratar/despedir",
              t: "inteiros",
              g: "despedir −6 moral/vaga e custo; contratar entra a 0,8 competência",
            },
            {
              d: "Promoção",
              t: "supervisor/chefe de linha/carreira",
              g: "+5 moral; supervisor 1,4× salário e produz a 80 %, gestor de linha 2× dedicado; mérito +12 % salário",
            },
            {
              d: "Contratar investigadores",
              t: "inteiro",
              g: "alimenta I&D interna e informação do COO",
            },
            {
              d: "Formação",
              t: "€",
              g: "€1 000/trabalhador → +0,02 competência, teto +0,06, +3 moral, com lag",
            },
            {
              d: "Organização/motivação",
              t: "supervisão, bónus, horas extra",
              g: "1 supervisor por ~8 trabalhadores, 1 gestor de linha a partir de 24, senão −0,01 produtividade/trabalhador",
            },
            {
              d: "Descanso/esforço",
              t: "férias, folga, horas extra",
              g: "férias zeram stress +5 moral sem produção; folga surge com produção < capacidade; horas extra até 1,5× +10 stress 1,5× salário",
            },
          ]}
        />
      </BlocoCampo>
    </SecaoCard>
  );
}

function SeccaoPrecedencia() {
  return (
    <SecaoCard id="s5" numero="05" titulo="Resolução por precedência">
      <p>
        Ordem <b>CEO → CFO → COO/CMO/CHRO</b>. Cada decisor principal cria um "envelope
        vinculativo"; decisões posteriores são ajustadas ou anuladas. Exemplos:
      </p>
      <ul className="ml-4 list-disc space-y-1">
        <li>Linha em saída (CEO) + produção agendada (COO) → produção anulada.</li>
        <li>Empréstimo (CFO) acima do teto (CEO) → clamp ao teto.</li>
        <li>Compra de máquinas (COO) acima do capex (CFO) → reduzida ao orçamento.</li>
        <li>Preço (CMO) abaixo do piso (CFO) → subido ao piso.</li>
      </ul>
      <Nota>
        Cada anulação/clamp reduz o Alinhamento (§7) no turno seguinte. Ausência: cadeia de
        prioridade (lugar coberto pelo CEO/capitão); se ninguém cobrir, política da competição —
        status-quo ou pior caso.
      </Nota>
    </SecaoCard>
  );
}

function SeccaoModeloEconomico() {
  return (
    <SecaoCard id="s6" numero="06" titulo="Modelo económico">
      <p>
        Definido por uma <b>seed</b> (estrutura única de variáveis e progressão; cada seed =
        experiência diferente, com replicabilidade e rastreabilidade).
      </p>

      <h3 className="mt-4 font-serif text-base font-semibold text-navy">
        6.1 · Variáveis macro{" "}
        <span className="font-sans text-xs font-normal text-slate">
          (geradas por seed, ocultas, reveladas por §8)
        </span>
      </h3>
      <TabelaInfo
        colunas={[
          { cabecalho: "Variável", chave: "v" },
          { cabecalho: "Inicial", chave: "i" },
          { cabecalho: "↓", chave: "min" },
          { cabecalho: "↑", chave: "max" },
          { cabecalho: "Δ máx/turno", chave: "delta" },
          { cabecalho: "Efeito", chave: "efeito" },
        ]}
        linhas={[
          {
            v: "Taxa de juro base",
            i: "2,4 %",
            min: "0,0 %",
            max: "8,0 %",
            delta: "±0,5 pp",
            efeito: "custo de financiamento (+spread 3,6 %)",
          },
          {
            v: "Inflação (anual)",
            i: "2,5 %",
            min: "−1 %",
            max: "12 %",
            delta: "±1,0 pp",
            efeito: "drift de custos e referências de preço",
          },
          {
            v: "Índice de crescimento",
            i: "1,00",
            min: "0,85",
            max: "1,15",
            delta: "±0,04",
            efeito: "escala a procura agregada",
          },
          {
            v: "Confiança do mercado",
            i: "100",
            min: "70",
            max: "130",
            delta: "±8",
            efeito: "multiplica a procura (conf/100)",
          },
          {
            v: "Procura-base por linha",
            i: "seed",
            min: "−30 %",
            max: "+30 %",
            delta: "choque pontual",
            efeito: "nível de procura da linha",
          },
        ]}
      />
      <Nota>
        Os valores iniciais variam por seed, dentro das guardrails; evolução ao longo de até 40
        turnos.
      </Nota>

      <h3 className="mt-5 font-serif text-base font-semibold text-navy">
        6.2 · Custos{" "}
        <span className="font-sans text-xs font-normal text-slate">
          (drift por inflação, ≤ ±10 %/turno)
        </span>
      </h3>
      <p>
        Custos unitários derivam das quantidades físicas (§6.3) a preços-fator: madeira €320/m³,
        energia €0,15 + €0,021/kWh, mão-de-obra €20,74/h (com 22 % encargos) × tier de qualidade.
        Inclui prémio de horas extra (1,5×) e subcontratação (+18 %). Imposto sobre lucros 30 %, com
        reporte de prejuízos até 7 períodos.
      </p>

      <h3 className="mt-5 font-serif text-base font-semibold text-navy">6.3 · Produtos base</h3>
      <TabelaInfo
        colunas={[
          { cabecalho: "Linha", chave: "l" },
          { cabecalho: "Madeira m³", chave: "madeira" },
          { cabecalho: "Mão-obra h", chave: "mo" },
          { cabecalho: "Energia kWh", chave: "en" },
          { cabecalho: "Consumíveis €", chave: "cons" },
          { cabecalho: "Ref. preço €", chave: "ref" },
          { cabecalho: "Procura-base", chave: "proc" },
        ]}
        linhas={[
          {
            l: "Cadeira",
            madeira: "0,025",
            mo: "0,6",
            en: "8",
            cons: "3,5",
            ref: "72",
            proc: "2 600",
          },
          { l: "Mesa", madeira: "0,08", mo: "1,4", en: "14", cons: "9", ref: "150", proc: "900" },
          {
            l: "Armário",
            madeira: "0,12",
            mo: "2,2",
            en: "18",
            cons: "14",
            ref: "245",
            proc: "480",
          },
        ]}
      />
      <p>
        Tiers: Standard (mão-obra ×1,00, qualidade 0,70), Fine (×1,58, 0,86), Artisan (×~2,1, ~0,96,
        via I&D). A cadeira é alto-volume/baixa-margem; o armário o oposto.
      </p>

      <h3 className="mt-5 font-serif text-base font-semibold text-navy">6.4 · Quota e procura</h3>
      <Formula rotulo="Quota e procura">
        <Var>apelo_i</Var> = (qualidade_tier · qualMult_i) · √(0,5 + marca_i/100) ·
        (ref/preço_i)^ELAST · (1 + 0,04·forçaVendas_i) · apMod_i
        <br />
        <Var>quota_i</Var> = apelo_i / Σ apelo
        <br />
        <Var>procura_linha</Var> = procura_base · (ref/preço_médio)^0,4 · crescimento ·
        (confiança/100) · perfil_seed_linha
        <br />
        <Var>vendas_i</Var> = min(round(procura_linha · quota_i), produção_i){"    "}
        <span className="text-paper/70">// ELAST = 1,85</span>
      </Formula>
      <p>Excedente é stock perdido no protótipo.</p>

      <h3 className="mt-5 font-serif text-base font-semibold text-navy">6.5 · P&amp;L</h3>
      <Formula rotulo="Demonstração de resultados">
        <Var>receita</Var> = Σ vendas_i · preço_i{"    "}
        <span className="text-paper/70">// Exportação ×0,72</span>
        <br />
        <Var>custo_produção</Var> = Σ produção_i · custo_unit_i{"    "}
        <span className="text-paper/70">// inclui horas extra e subcontratação</span>
        <br />
        <Var>estrutura</Var> = salários·(salário_ratio) + renda + depreciação + marketing +
        força_vendas + formação
        <br />
        <Var>custo_I&amp;D</Var> = orçamento_I&amp;D (ou €45 000 se licença) +
        investigadores·custo-hora
        <br />
        <Var>juros</Var> = dívida·(juro_base + 3,6 %)/12
        <br />
        <Var>pré-imposto</Var> = receita − custo_produção − estrutura − custo_I&amp;D − juros
        <br />
        <Var>imposto</Var> = max[0, (pré-imposto − prejuízos_últ_7_anos)·30 %]
        <br />
        <Var>resultado</Var> = pré-imposto − imposto
        <br />
        <Var>caixa'</Var> = caixa + resultado − capex + empréstimo − amortização + capital_próprio −
        dividendos
      </Formula>
    </SecaoCard>
  );
}

function SeccaoOrganizacional() {
  return (
    <SecaoCard id="s7" numero="07" titulo="Camada organizacional">
      <h3 className="font-serif text-base font-semibold text-navy">
        7.1 · Fatores{" "}
        <span className="font-sans text-xs font-normal text-slate">(estado por equipa, 0–100)</span>
      </h3>
      <p>Moral (M), Alinhamento (A), Stress (S), atualizam no fecho com lag.</p>
      <Formula rotulo="Fatores">
        <Var>ΔM</Var> = (salário≥110%? +6 : salário≥100%? +1 : −8) + (formação? +3) + (bónus? +4) +
        (promoção? +5) + (horas_extra? −4) − efeitos_evento
        <br />
        <Var>ΔS</Var> = (horas_extra? +10 : −6) + (burnout? +10)
        <br />
        <Var>ΔA</Var> = +2 − 3·(nº de anulações/clamps do turno)
      </Formula>

      <h3 className="mt-5 font-serif text-base font-semibold text-navy">
        7.2 · Multiplicadores{" "}
        <span className="font-sans text-xs font-normal text-slate">(guardrails fixos)</span>
      </h3>
      <Formula rotulo="Multiplicadores">
        <Var>prodMult</Var> = clamp(1 + 0,30·((M−50)/50) − 0,25·max(0,S−40)/60 + 0,10·((A−50)/50) −
        penalização_amplitude, 0,5, 1,4)
        <br />
        <Var>qualMult</Var> = clamp(1 + 0,20·(competência−1) + 0,10·((M−50)/50), 0,7, 1,35)
        <br />
        <Var>attrition</Var> = clamp(0,02 + 0,35·max(0,(50−M)/50) + 0,40·max(0,1−salário_ratio) +
        0,25·max(0,(S−70)/30), 0, 0,60)
        <br />
        <Var>penalização_amplitude</Var> = max(0, trabalhadores − supervisores·8)·0,01
      </Formula>

      <h3 className="mt-5 font-serif text-base font-semibold text-navy">
        7.3 · Perfis emergentes{" "}
        <span className="font-sans text-xs font-normal text-slate">(janela móvel de 3 turnos)</span>
      </h3>
      <TabelaInfo
        colunas={[
          { cabecalho: "Perfil", chave: "p" },
          { cabecalho: "Gatilho", chave: "g" },
          { cabecalho: "Efeito", chave: "e" },
        ]}
        linhas={[
          {
            p: "Inovação",
            g: "I&D + investigadores·1500 ≥ €4 000/turno ou ≥8 % receita",
            e: "I&D ×1,4, qualidade ×1,05",
          },
          { p: "Pessoas", g: "salário ≥108 % + formação", e: "greve ×0,5" },
          { p: "Mercado", g: "marketing ≥€3 500/turno ou ≥6 % receita", e: "apelo ×1,10" },
          { p: "Produção", g: "utilização ≥90 % ou produção ≥1 000 u.", e: "push ×1,5" },
          { p: "Equilibrada", g: "nenhum dominante", e: "neutro" },
        ]}
      />

      <h3 className="mt-5 font-serif text-base font-semibold text-navy">7.4 · Eventos</h3>
      <TabelaInfo
        colunas={[
          { cabecalho: "Evento", chave: "ev" },
          { cabecalho: "Efeito", chave: "ef" },
          { cabecalho: "Timing", chave: "t" },
        ]}
        linhas={[
          { ev: "Greve", ef: "produção ×0,55", t: "imediato" },
          { ev: "Push", ef: "output ×1,15", t: "imediato" },
          { ev: "Breakthrough I&D", ef: "desbloqueia nó §9", t: "diferido" },
          { ev: "Saída de talento", ef: "−0,15 competência (∝ attrition)", t: "turno seguinte" },
          { ev: "Burnout (S>70)", ef: "+stress", t: "turno seguinte" },
        ]}
      />
      <Nota>
        Greve sobe com moral baixa/stress alto/salário abaixo (metade no perfil Pessoas); push
        premeia moral alta e stress baixo (ampliado no perfil Produção).
      </Nota>
      <Formula rotulo="Progresso de I&D">
        <Var>progresso</Var> = (investigadores·4 + orçamento_I&amp;D/1500)·(0,7 + 0,3·M/100)·rdMod
      </Formula>

      <h3 className="mt-5 font-serif text-base font-semibold text-navy">7.5 · Pessoas</h3>
      <p>
        Equipa composta por indivíduos gerados pela stream "pessoas" da seed, atributos 0–100
        (exceto competência e produtividade base ~1,0): motivação (→ Moral), stress individual,
        resiliência (amortece stress), aptidão de gestão (supervisão eficaz), produtividade base,
        competência (cresce com formação/experiência, cai com saída de talento). Rollup
        indivíduo→equipa (médias). Saída de talento remove primeiro competência alta (≥1,11) +
        motivação baixa (≤0,8).
      </p>
      <p>
        <b>Arquétipos:</b>
      </p>
      <ul className="ml-4 list-disc space-y-1">
        <li>Veterano — competência alta, ambição baixa, resiliente.</li>
        <li>Talento — produtividade/ambição altas, exige progressão.</li>
        <li>Esteio — estável, resiliente, motivação média.</li>
        <li>Inquieto — produtividade alta, motivação volátil.</li>
        <li>Aprendiz — competência baixa, cresce rápido com formação.</li>
      </ul>
      <p>
        Cada arquétipo tem necessidades que, se ignoradas, baixam a motivação e podem levá-lo a
        sair.
      </p>
    </SecaoCard>
  );
}

function SeccaoInformacao() {
  return (
    <SecaoCard id="s8" numero="08" titulo="Ações de informação" tag="1 por lugar/turno">
      <p>Não bloqueante; determinístico por seed + ruído.</p>
      <ul className="ml-4 list-disc space-y-1.5">
        <li>
          <b>CFO — Estudo económico:</b> macro e procura agregada t+1..t+3, confiança 75/85/95 %
          (custo crescente), saída = valores previstos + banda.
        </li>
        <li>
          <b>CMO — Pesquisa de mercado (3 níveis):</b> nível 1 tendências por categoria; nível 2 +
          interesses/linhas a abrir e sensibilidade ao preço; nível 3 + segmentação, elasticidade
          por linha, posicionamento.
        </li>
        <li>
          <b>CEO — Pesquisa de concorrência:</b> por rival (perfil, preços recentes, capacidade
          aprox., marca); parcial/ruidosa, atraso possível de 1 turno.
        </li>
        <li>
          <b>COO — Análise ao I&D:</b> só com investigador sénior (progresso, turnos até
          breakthrough, interno vs. licença).
        </li>
        <li>
          <b>CHRO — Diálogo com funcionários:</b> ramificado; fidelidade conforme escolhas; nunca
          expõe a probabilidade de greve.
        </li>
      </ul>
    </SecaoCard>
  );
}

function SeccaoID() {
  return (
    <SecaoCard id="s9" numero="09" titulo="Árvore de I&D">
      <p>
        Pontos acumulam por turno (progresso §7.4); nó desbloqueia quando pontos do ramo ≥ custo, ou
        por Breakthrough. Modo interno (orçamento + investigadores, probabilístico) ou licença (€45
        000, imediato). A seed determina que novas linhas ganham procura e quando.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <BlocoCampo titulo="Ramo Produto">
          <TabelaInfo
            colunas={[
              { cabecalho: "Nó", chave: "n" },
              { cabecalho: "Pré-requisito", chave: "pr" },
              { cabecalho: "Custo (pontos)", chave: "c" },
            ]}
            linhas={[
              { n: "Secretária", pr: "—", c: "8" },
              { n: "Estante", pr: "—", c: "8" },
              { n: "Cama painéis", pr: "Secretária ou Estante", c: "12" },
              { n: "Estofo", pr: "—", c: "12" },
              { n: "Sofá", pr: "Estofo", c: "16" },
              { n: "Modular premium", pr: "Sofá + Fine", c: "20" },
            ]}
          />
        </BlocoCampo>
        <BlocoCampo titulo="Ramo Processo / Qualidade">
          <TabelaInfo
            colunas={[
              { cabecalho: "Nó", chave: "n" },
              { cabecalho: "Pré-requisito", chave: "pr" },
              { cabecalho: "Custo (pontos)", chave: "c" },
            ]}
            linhas={[
              { n: "Qualidade Fine", pr: "—", c: "10" },
              { n: "Qualidade Artisan", pr: "Fine", c: "18" },
              { n: "Eficiência materiais", pr: "—", c: "8, −8 % madeira/u." },
              { n: "Eficiência energética", pr: "—", c: "8, −15 % energia/u." },
              {
                n: "Automação",
                pr: "Materiais ou Energia",
                c: "14, +20 % capacidade-máquina −10 % mão-obra/u.",
              },
              { n: "Lean", pr: "Automação", c: "16, +0,10 ao teto de prodMult" },
            ]}
          />
        </BlocoCampo>
      </div>
    </SecaoCard>
  );
}

function SeccaoSeed() {
  return (
    <SecaoCard id="s10" numero="10" titulo="Seed">
      <p>
        PRNG determinístico com streams independentes (economia / pessoas / ruído de informação).
        Gera e oculta: trajetória macro (§6.1), perfis de procura por linha (nível, tendência,
        sazonalidade, choques), linhas emergentes, eventos macro/setoriais. Mesma seed para todas as
        equipas do mercado. Reprodutível (replay/auditoria).
      </p>
    </SecaoCard>
  );
}

function SeccaoModos() {
  return (
    <SecaoCard id="s11" numero="11" titulo="Modos de competição">
      <ul className="ml-4 list-disc space-y-1">
        <li>
          <b>Só equipas</b> — N equipas humanas.
        </li>
        <li>
          <b>vs. Computador</b> — humanas + IA (seed determina comportamento/tipologia).
        </li>
        <li>
          <b>Misto</b> — humanas + IA no mesmo mercado.
        </li>
      </ul>
      <p>
        IA usa arquétipos com regras (custo, premium, equilibrado, inovação), decisões coerentes,
        reage ao mercado, sujeita às mesmas regras de resolução, fatores e eventos.
      </p>
    </SecaoCard>
  );
}

function SeccaoRelatorio() {
  return (
    <SecaoCard id="s12" numero="12" titulo="Relatório de turno" tag="Jornal + dashboard">
      <ul className="ml-4 list-disc space-y-1">
        <li>
          <b>Demonstrações financeiras</b> (P&amp;L, evolução de caixa e valor).
        </li>
        <li>
          <b>Decisões por lugar</b>, marcando as anuladas/ajustadas por precedência.
        </li>
        <li>
          <b>Concorrência</b> (só o valor de cada equipa, sem internos dos rivais).
        </li>
        <li>
          <b>Notícias do mundo</b> (manchetes fictícias plausíveis, coerentes com as variáveis
          macro).
        </li>
      </ul>
    </SecaoCard>
  );
}

function SeccaoAcessos() {
  return (
    <SecaoCard id="s13" numero="13" titulo="Acessos">
      <p>
        Cada ecrã visível a toda a equipa, editável só pelo titular do lugar (RLS). Modo{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          desbloqueio_total
        </code>{" "}
        (docente/teste) liberta todos os ecrãs. Economia da seed inacessível ao cliente; resolução
        server-authoritative.
      </p>
    </SecaoCard>
  );
}

function SeccaoCamadas() {
  return (
    <SecaoCard id="s14" numero="14" titulo="Camadas de utilização" tag="4 camadas">
      <div className="grid gap-4 sm:grid-cols-2">
        <BlocoCampo titulo="14.1 · Super-administrador">
          <p>
            Contexto visual do jogo; indústria da "run"; competições inter-escolas; gestão de
            utilizadores; logs e exportação.
          </p>
        </BlocoCampo>
        <BlocoCampo titulo="14.2 · Administração escolar">
          <p>
            Autoriza/gere utilizadores da escola; competições intra-escola; dados estatísticos e
            métricas.
          </p>
        </BlocoCampo>
        <BlocoCampo titulo="14.3 · Professor/Docente">
          <p>
            Define grupos e responsabilidade de cada aluno; define seed (aleatória ou
            pré-determinada) e parâmetros base — elasticidade, capital inicial, fórmula de valor
            (k_marca/k_lucro), guardrails macro, duração, transparência, modo, tema; gere alunos e
            turnos.
          </p>
        </BlocoCampo>
        <BlocoCampo titulo="14.4 · Equipas/alunos">
          <p>
            Jogam os cinco lugares; submetem decisões e ações de informação; acompanham relatórios e
            classificação.
          </p>
        </BlocoCampo>
      </div>
    </SecaoCard>
  );
}

function SeccaoEcras() {
  return (
    <SecaoCard id="s15" numero="15" titulo="Ecrãs e interface">
      <p>
        A interface materializa este desenho em ecrãs coerentes com a identidade Kontor (azul-escuro
        & dourado; Fraunces/Inter/IBM Plex Mono): landing pública, entrada por código na Hansa,
        página de jogo (HUD, sede, ecrã de lugar, ação de informação), relatório de fim de turno em
        forma de jornal, backoffice de criação da Hansa. As competições designam-se "Hansa".
      </p>
    </SecaoCard>
  );
}

function SeccaoFamilias() {
  return (
    <div id="familias" className="scroll-mt-28 space-y-5">
      <div className="pt-2">
        <h2 className="font-serif text-2xl text-foreground">Famílias de produto</h2>
        <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
          Cada cartão: cabeçalho navy, um badge de estado, e corpo com Lugares / Decisões /
          Indicadores. Os indicadores em pequenos badges mono.
        </p>
      </div>

      <CartaoFamilia
        eyebrow="Simulador geral"
        nome="Kontor — Simulador geral"
        descricao="A experiência-piloto (mobiliário), com todo o motor acima."
        estado="disponivel"
      >
        <BlocoCampo titulo="Lugares">
          <p>CEO · CFO · COO · CMO · CHRO.</p>
        </BlocoCampo>
        <BlocoCampo titulo="Indicadores">
          <div className="flex flex-wrap gap-2">
            <Kpi>Valor da empresa</Kpi>
            <Kpi>Resultado (P&amp;L)</Kpi>
            <Kpi>Quota por linha</Kpi>
            <Kpi>Caixa</Kpi>
            <Kpi>Moral/Stress</Kpi>
          </div>
        </BlocoCampo>
      </CartaoFamilia>

      <CartaoFamilia
        eyebrow="Variante · Recursos Humanos"
        nome="Kontor HR — variante Recursos Humanos"
        descricao="A gestão de pessoas passa de camada de apoio a protagonista; vocacionado para licenciaturas e mestrados em RH, desenhado em diálogo com a coordenação de RH do ISCAP."
        estado="conceção"
      >
        <BlocoCampo titulo="O que muda">
          <p>
            A empresa e o mercado ficam como pano de fundo; a superfície de decisão desdobra a pasta
            CHRO em áreas jogáveis.
          </p>
        </BlocoCampo>
        <BlocoCampo titulo="Lugares propostos">
          <GrelhaLugares
            lugares={[
              { nome: "Dir. RH", area: "Estratégia & orçamento" },
              { nome: "Talento", area: "Recrutamento & seleção" },
              { nome: "Recompensa", area: "Salários & benefícios" },
              { nome: "Desenvolvimento", area: "Formação & carreira" },
              { nome: "Clima", area: "Relações & bem-estar" },
            ]}
          />
        </BlocoCampo>
        <BlocoCampo titulo="Decisões destacadas">
          <p>
            Planeamento de força de trabalho, funil de recrutamento e employer branding, política
            salarial e benefícios, formação e progressão, avaliação de desempenho, organização e
            amplitude de supervisão, negociação laboral e prevenção de burnout.
          </p>
        </BlocoCampo>
        <BlocoCampo titulo="Indicadores">
          <div className="flex flex-wrap gap-2">
            <Kpi>Attrition</Kpi>
            <Kpi>Engagement/eNPS</Kpi>
            <Kpi>Time-to-fill</Kpi>
            <Kpi>Custo por contratação</Kpi>
            <Kpi>Absentismo</Kpi>
            <Kpi>Competência média</Kpi>
            <Kpi>Massa salarial/receita</Kpi>
          </div>
        </BlocoCampo>
      </CartaoFamilia>

      <CartaoFamilia
        eyebrow="Variante · Saúde"
        nome="Kontor Saúde — variante Saúde"
        descricao="Gestão de uma unidade de saúde num sistema com recursos limitados; pensado para a Escola Superior de Saúde, cruzando economia da saúde, operações e gestão de equipas clínicas."
        estado="conceção"
      >
        <BlocoCampo titulo="O que muda">
          <p>
            O "produto" passa a ser o cuidado prestado — as linhas tornam-se serviços/percursos
            clínicos, a procura torna-se afluência e listas de espera, a qualidade mede-se em
            segurança e resultados; o motor de custos, turnos, eventos e fatores de equipa mantém-se
            (ótimo para explorar sobrecarga e burnout das equipas).
          </p>
        </BlocoCampo>
        <BlocoCampo titulo="Lugares propostos">
          <GrelhaLugares
            lugares={[
              { nome: "Direção", area: "Estratégia & orçamento" },
              { nome: "Financeiro", area: "Financiamento & custos" },
              { nome: "Operações", area: "Capacidade & fluxo" },
              { nome: "Clínico", area: "Qualidade & segurança" },
              { nome: "Pessoas", area: "Equipas & escalas" },
            ]}
          />
        </BlocoCampo>
        <BlocoCampo titulo="Decisões destacadas">
          <p>
            Dimensionamento de capacidade e camas/consultas, escalas e dotações seguras, gestão de
            listas de espera e acesso, orçamento e aprovisionamento clínico, protocolos e percursos,
            qualidade e segurança do doente, equilíbrio carga/bem-estar.
          </p>
        </BlocoCampo>
        <BlocoCampo titulo="Indicadores">
          <div className="flex flex-wrap gap-2">
            <Kpi>Tempos de espera</Kpi>
            <Kpi>Ocupação</Kpi>
            <Kpi>Reinternamentos</Kpi>
            <Kpi>Eventos de segurança</Kpi>
            <Kpi>Burnout das equipas</Kpi>
            <Kpi>Custo por episódio</Kpi>
            <Kpi>Satisfação do utente</Kpi>
          </div>
        </BlocoCampo>
      </CartaoFamilia>

      <Nota>
        As variantes HR e Saúde são propostas de roadmap — reutilizam o motor do Kontor mas ainda
        não estão disponíveis; os lugares, decisões e indicadores são um ponto de partida para
        validar com cada parceiro académico.
      </Nota>
    </div>
  );
}
