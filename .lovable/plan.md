# A Crónica da Casa + narrativa das pessoas

Feature que dá à Sala da Board três separadores (**Missão**, **Crónica**, **Atas**) e enriquece o roster do CHRO com a história de cada colaborador. Toda a escrita é determinística, PT-PT, e só gerada quando há motivo.

---

## 1. Base de dados (migração única)

### Nova tabela `cronica_entradas`
- `equipa_id uuid` (FK equipas)
- `ronda_id uuid` (FK rondas, nullable p/ segurança)
- `indice_turno int`
- `tipo text` (ex: `primeiro_lucro`, `credito`, `quota_up`, `evento_greve`, `pessoa_contratada`, `pessoa_promovida`, `pessoa_saiu`, `sem_registo`, ...)
- `texto text` (frase final em PT-PT)
- `destaque boolean default false`
- `dados jsonb` (payload determinístico usado para render/reprodução)
- `criado_em timestamptz default now()`
- Índice em `(equipa_id, indice_turno)`.
- GRANTs: `SELECT` a `authenticated`; `ALL` a `service_role` (sem `anon`).
- RLS:
  - SELECT: `sou_membro_da_equipa(equipa_id)` OR `pode_gerir_competicao(competicao_da_equipa(equipa_id))`.
  - INSERT/UPDATE/DELETE: nenhum (só service-role escreve).

### Novas colunas em `colaboradores`
- `entrou_ronda int` (indice_turno em que entrou; para os iniciais fica 1 via UPDATE inicial)
- `promocoes int not null default 0`
- `ultima_promocao_ronda int` (nullable)
- `competencia_inicial numeric` (snapshot da competência à entrada; preencher para existentes com o valor atual)

---

## 2. Motor (`supabase/functions/resolver_ronda/index.ts`)

No fim de cada turno resolvido, antes do `upsert` final:

1. Calcula sinais de notabilidade comparando snapshot do turno corrente com o(s) anterior(es), `resultados`, `eventos`, `log_auditoria` e alterações a `colaboradores`.
2. Gera lista de `EntradaCronica { tipo, texto, destaque, dados }` a partir de **moldes PT-PT** (helper novo `supabase/functions/_shared/cronica.ts`):
   - primeiro lucro / prejuízo (destaque no primeiro)
   - regresso ao lucro após ≥2 turnos negativos
   - uso de crédito automático / teto de dívida / piso de tesouraria
   - variação de quota ≥5 pp (ganho/perda) e mudança de ranking
   - eventos §7.4 já existentes em `eventos`
   - desbloqueio de nó I&D / mudança de tier de qualidade
   - decisões ajustadas/anuladas por precedência (a partir de `log_auditoria`)
   - pessoas: contratações, despedimentos, promoções (comparar `colaboradores` antes/depois)
   - séries: 3 turnos consecutivos a crescer/perder em valor da empresa
3. Se a lista ficar vazia → inserir 1 linha `{tipo: 'sem_registo', texto: 'Turno N — sem registo digno de nota.'}`.
4. Inserir em `cronica_entradas` com `service-role` (idempotente: apagar entradas existentes desse `(equipa_id, indice_turno)` antes de reinserir, para casos de reprocessamento).
5. Actualizar `colaboradores`: quando promoção → `promocoes+1`, `ultima_promocao_ronda`. Quando contratação nova → `entrou_ronda`, `competencia_inicial`.

Regras de voz: 1–3 frases, pretérito, terceira pessoa sobre "a casa"; cada tipo tem 2–4 variantes seleccionadas por hash determinístico de `(equipa_id, indice_turno, tipo)`.

---

## 3. Frontend — Sala da Board com separadores

Ficheiro `src/components/jogo/salas/SalaBoard.tsx` passa a ter três abas locais (state simples, sem router). Mantém o conteúdo atual dentro de "Missão".

### Novo `CronicaTab.tsx`
- Server fn nova em `src/lib/competicao.functions.ts` (ou novo `cronica.functions.ts`): `listarCronica(equipaId)` com `requireSupabaseAuth`.
- Lista por `indice_turno` desc, agrupada; entradas com `destaque=true` recebem tratamento visual (barra dourada + tipografia serif maior).
- Botão "Descarregar a Crónica" → gera Markdown no cliente e faz download (`.md`). PDF fica de fora nesta ronda (o Markdown é suficiente para "documento que a equipa leva"; podemos usar `window.print()` como fallback estilizado se necessário).

### Novo `AtasTab.tsx`
- Server fn `listarAtas(equipaId)`: agrega `log_auditoria` (que já regista decisões aplicadas/ajustadas/anuladas) por `(indice_turno, lugar)`.
- Renderiza tabela seca: turno · lugar · decisão · estado.

### Demo
- Em modo demo, alimentar `CronicaTab` e `AtasTab` a partir de fixtures estáticos em `src/lib/jogo/dados-exemplo.ts` para não quebrar o tutorial.

---

## 4. Roster CHRO — linha de história

`src/components/jogo/salas/RosterCHRO.tsx`:
- Nova mini-linha por colaborador, imediatamente abaixo do papel/salário, mostrando: antiguidade (`entrou_ronda` vs turno corrente), promoções (`promocoes`, `ultima_promocao_ronda`), evolução de competência (`competencia_inicial` → atual, arredondado a 2 casas).
- Reaproveita helpers já existentes; nenhum novo endpoint (dados já vêm em `colaboradores`).

`src/components/jogo/salas/Gabinete.tsx` (diálogo do representante): prepend de 1 frase factual usando os mesmos campos ("Está na casa há N turnos e nunca foi promovido.", etc.).

---

## 5. Notas técnicas

- Tema PT-PT preservado; todos os moldes escritos em pretérito, terceira pessoa sobre "a casa".
- Determinismo: seleção de variante por `hash(equipa_id + indice_turno + tipo) % variantes.length`.
- Idempotência do resolver: `DELETE FROM cronica_entradas WHERE equipa_id=? AND indice_turno=?` antes de inserir garante que reprocessar um turno não duplica.
- Sem alterações ao Jornal, RelatorioFinanceiro ou motor económico.
- Sem deploy.

## Confirmação de escopo
A crónica **só escreve** quando há gatilho de notabilidade activo; caso contrário insere uma única linha discreta `sem_registo`, para o histórico ficar contínuo sem enchimento.
