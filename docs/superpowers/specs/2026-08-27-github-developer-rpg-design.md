# GitHub Developer RPG — Design

**Data:** 2026-08-27
**Autor:** Gabriel Wagner (Ktsu0), com Claude Code
**Status:** Aprovado para planejamento de implementação

## 1. Pitch

O perfil GitHub de Gabriel Wagner (`Ktsu0`) deixa de ser um README tradicional
(bio + badges + lista de tecnologias) e passa a ser a interface de um RPG,
onde:

- **Gabriel** = personagem (um cavaleiro a cavalo, silhueta monocromática);
- **GitHub** = o mundo do jogo;
- **Repositórios reais** = regiões do mapa e quests;
- **Commits/PRs/releases** = XP;
- **Nível** = evolução calculada a partir do XP;
- **Bugs/incidentes difíceis** = bosses (conteúdo manual/narrativo);
- **Conquistas baseadas em métricas reais** = achievements;
- **README** = a tela do jogo.

O personagem não coleciona equipamentos (sem espadas/armaduras). Ele é
construído literalmente por fragmentos de código que se encaixam — a
metáfora central do projeto é: **um desenvolvedor é construído pelo que
aprende e cria.**

Este documento consolida a especificação original do usuário (71 seções, ver
transcrição na conversa que originou este spec) com as decisões visuais e
arquiteturais fechadas durante o brainstorming (companheiro visual +
diálogo). Ele cobre o projeto completo em 14 fases — não apenas um MVP.

## 2. Identidade visual (fechada)

### 2.1 Personagem: cavaleiro a cavalo

Decisão final, após comparar 4 estilos (pixel-art, silhueta humana simples,
dev sentado, abstrato/wireframe) e uma iteração customizada: o personagem é
**um cavaleiro montado a cavalo**, desenhado como ilustração vetorial
artesanal (não gerado por máscara de pixels), fornecida pelo usuário como
arquivo-fonte de referência.

- **Traço:** silhueta monocromática, preenchimento sólido, sem gradientes.
- **Cor:** branco puro (`#FFFFFF`) sobre fundo escuro do projeto
  (`#0b0f14`) — sem cor de destaque ciano/laranja no personagem em si
  (essas cores ficam reservadas para UI: barras de XP, ícones de status,
  glow do marcador de posição no mapa).
- **Sem equipamentos/armas.** O cavalo é montaria (locomoção), não um
  "item" do inventário — não conflita com a regra de "sem sistema de
  equipamentos" da spec original.
- **Elemento de identidade:** uma pequena flâmula/bandeira com `</>` presa
  a uma haste atrás do cavaleiro, reforçando a metáfora "construído por
  código" sem virar arma.

Arquivo-fonte: `assets/character/horse-rider.svg`, com os `<path>`
agrupados e nomeados por parte anatômica (corpo do cavalo, pernas
dianteiras, pernas traseiras, pescoço/cabeça, cauda, crina, torso do
cavaleiro, cabeça do cavaleiro, chapéu, bandeira). Essa nomeação é o que
permite ao gerador (seção 6) reconstruir a animação de montagem no Hero e
reaproveitar o cavaleiro dentro do World Map.

### 2.2 Paleta e tema

```
Fundo:            #0b0f14  (quase preto, base do "terminal")
Personagem:       #FFFFFF  (silhueta do cavaleiro/cavalo)
Grid/paths base:  #22303a  (trilhas do mapa ainda não percorridas)
Destaque/glow:    #ffb454  (marcador de posição atual, XP, alertas)
Acento secundário:#54e0c7  (barras de progresso, ícones de UI, texto de status)
```

Tipografia: monoespaçada (estética terminal/código), sem serifa.
Sem GIFs, sem emojis em excesso, sem neon saturado — visual "produto
profissional com identidade criativa" (seção 64 da spec original).

### 2.3 Movimento no World Map (fechado)

O README não executa JavaScript — qualquer movimento é animação SVG nativa
(SMIL: `animate`, `animateMotion`, `animateTransform`) embutida no arquivo
gerado, validada como funcional em `<img>` no GitHub (o mesmo mecanismo
usado por geradores populares como "readme-typing-svg").

Comportamento aprovado, uma sequência única por carregamento de página
(sem loop interminável, exceto o idle final):

1. **Trilha:** uma linha se desenha (`stroke-dashoffset` animado) ligando,
   em ordem cronológica, as regiões cujas quests estão `[✓] COMPLETED`.
2. **Cavalgada:** o cavaleiro percorre essa trilha (`animateMotion` com
   `rotate="auto"`, mais um leve balanço de galope via
   `animateTransform`) até a região da quest `[→] IN PROGRESS` (Current
   Quest).
3. **Chegada/Idle:** ao chegar, a trilha termina num marcador pulsante
   (`ffb454`) e o cavaleiro entra num loop suave de "respiração" (escala
   leve, `repeatCount="indefinite"`), indicando presença sem fingir
   progresso que não existe.

Esse comportamento reflete dados reais (quests completas/atual) — nunca é
puramente decorativo. Se não houver nenhuma quest completa ainda, a trilha
começa vazia e o cavaleiro aparece direto na primeira região com o idle.

**Acessibilidade/fallback:** todo SVG animado tem `<title>`/`<desc>` e uma
pose estática coerente como primeiro frame — se a animação não rodar (o
GitHub eventualmente muda como faz proxy de imagens), o personagem
continua visível e legível parado na posição correta.

## 3. Arquitetura: dois repositórios

```
github-developer-rpg (motor)              Ktsu0/Ktsu0 (perfil)
┌───────────────────────────┐             ┌───────────────────────┐
│ TypeScript + Node.js       │   GitHub    │ README.md              │
│ Data Collector (Octokit)   │   Actions   │  <!-- RPG:START:X -->  │
│ RPG Engine (XP/Level/      │──commit────>│  conteúdo gerado       │
│  Quests/Achievements)      │   via       │  <!-- RPG:END:X -->    │
│ SVG Generator               │  GITHUB_    │  ... texto manual       │
│ README Generator            │  TOKEN      │      preservado ...    │
└───────────────────────────┘             └───────────────────────┘
```

- `github-developer-rpg` é o único lugar com código/lógica. Roda 1x/dia via
  GitHub Actions (cron), lê dados reais via GitHub REST API (`@octokit/rest`)
  do usuário `Ktsu0` e de todos os seus repositórios públicos, recalcula o
  `DeveloperProfile` inteiro, regenera os 3 SVGs e o miolo do README, e
  finaliza com um commit automático no repositório `Ktsu0/Ktsu0` usando um
  token com permissão mínima necessária (guardado como GitHub Actions
  Secret, nunca hardcoded — seção 45 da spec original).
- `Ktsu0/Ktsu0` só contém o `README.md` (com marcadores) e os SVGs gerados
  mais recentes. Nada de lógica ali.
- **Cache-busting:** o GitHub e navegadores fazem cache agressivo de
  imagens referenciadas por URL fixa. O README referencia os SVGs via
  `raw.githubusercontent.com/Ktsu0/Ktsu0/main/generated/<arquivo>.svg` com
  uma query string que muda a cada execução (`?v=<sha-do-commit>` ou
  timestamp Unix), gerada pelo próprio script — sem isso, o perfil pareceria
  "travado" mesmo após a Action rodar com sucesso.

## 4. Modelo de dados

TypeScript como fonte única de verdade, validado com `zod` nas bordas
(resposta da API do GitHub → modelo interno):

```
DeveloperProfile
├── identity        { username, name, class: "Full Stack Developer" }
├── level            number                 (derivado de xp)
├── xp               number                 (derivado de eventos reais)
├── attributes        { intelligence, crafting, exploration,
│                       automation, problemSolving }  (0–100, ver §7)
├── statistics        { repositories, commits, pullRequests, issues,
│                       releases, contributions }      (dados reais)
├── projects          Project[]
├── quests            Quest[]               (subset narrativo de projects)
├── achievements      Achievement[]         (auto + manuais)
├── bosses            Boss[]                (100% manual/narrativo)
└── currentQuest      { objective, statusPercent, nextObjective } (manual)

Project
├── name, repository, description (manual, opcional)
├── category: "games" | "backend" | "finance" | "team" |
│             "projects" | "starting-grounds" | "uncharted"
├── region: MapNode (posição, ícone)
├── status: "completed" | "in-progress" | "planned" | "blocked"
├── curated: boolean     (veio de config/projects.ts ou foi auto-detectado)
└── source: { language, topics, createdAt, pushedAt }   (dados reais)

MapNode { id, label, icon, x, y, category }
Piece   { id, group, initialPos, finalPos, initialRotation,
          finalRotation, delay, duration }   (usadas no Hero/character.svg)
Boss        { id, name, icon, description }              (manual)
Achievement { id, name, icon, description, auto: boolean, unlockedAt? }
```

`DeveloperProfile` é o objeto central: o `SVG Generator` e o
`README Generator` só consomem esse modelo, nunca a resposta crua da API do
GitHub — separação estrita entre coleta de dados e renderização (seção 39
da spec original).

## 5. Categorização de projetos: modelo híbrido

- `config/projects.ts` cura manualmente os projetos que o usuário quer
  destacar com narrativa própria (nome de exibição, descrição, região,
  ícone, status). É aqui que moram os "quests" com identidade — ex.:
  `Financeiro`, `antes-de-dormir`, `PlantaGamer`.
- Na coleta diária, todo repositório público não-fork do usuário é
  consultado. Repositório já presente em `config/projects.ts` (incluindo os
  4 fixados em "Starting Grounds", §5.1) usa os dados curados. Qualquer
  outro repositório, não curado, aparece automaticamente como quest/região
  genérica: **"🌫️ Uncharted Land — `<nome-do-repo>`"**, categorizado por
  linguagem principal + topics do GitHub (heurística simples: mapa de
  linguagem→categoria em `src/rpg/categorize.ts`), até que o usuário o
  promova para `config/projects.ts`.
  - "Starting Grounds" **não** tem heurística automática própria — é
    unicamente a lista fixa da §5.1. Um repositório novo em HTML/CSS/JS
    puro que apareça no futuro entra em "Uncharted Land" como qualquer
    outro, e só migra para "Starting Grounds" se o usuário decidir
    manualmente que ele pertence à mesma era de aprendizado (edição em
    `config/projects.ts`).
- Isso preserva a voz narrativa do usuário nos projetos que importam, e
  ainda entrega o efeito "o mapa cresce sozinho quando crio um repo novo"
  pedido explicitamente na conversa.

### 5.1 Região especial: 🌱 Starting Grounds

Representa os primeiros projetos de curso do usuário — pequenos, iniciantes,
escritos só em HTML/CSS/JS, antes da virada para TypeScript/NestJS em
outubro de 2025. Identificados via GitHub API real (`api.github.com/users/
Ktsu0/repos`) e confirmados manualmente pelo usuário. **Lista fixa em
`config/projects.ts`** (não heurística — decisão explícita do usuário):

| Repositório | Criado em | Stack |
|---|---|---|
| `portifolio_wagner` | 2025-04-10 | CSS/JS/HTML |
| `portifolio_react` | 2025-05-17 | JS/CSS/HTML |
| `login_page` | 2025-05-26 | JS/SCSS/CSS/HTML |
| `front_end_react` | 2025-09-26 | JS/SCSS/CSS/HTML |

No World Map, essa região aparece **antes** de todas as outras no traçado
cronológico da trilha (seção 2.3) — é literalmente o ponto de partida da
jornada. Ícone: 🌱. Cada projeto entra no Quest Log com status
`[✓] COMPLETED` e uma descrição curta indicando que foi um projeto de
aprendizado (texto manual, ex.: "Meus primeiros passos em desenvolvimento
web").

## 6. Pipeline de geração de SVG

Três arquivos gerados em `generated/`, sempre a partir do
`DeveloperProfile`:

1. **`character.svg`** — a animação Hero. Lê `assets/character/
   horse-rider.svg`, decompõe os grupos nomeados em `Piece[]` (posição
   inicial fora de tela/rotacionada, posição final = pose de repouso do
   cavaleiro), intercala com fragmentos de código soltos (`</>`, `{ }`,
   `const`, `TS`, `git`) e partículas de fundo (20–50, sutis). Duração
   total ~4–6s, termina estático na pose final com o texto "Gabriel
   Wagner · Full Stack Developer" e um botão-link "[ ENTER WORLD ]"
   apontando para o portfólio do usuário.
2. **`world-map.svg`** — reaproveita o `#horseRider` do mesmo arquivo-fonte
   (via `<use>` ou reinjeção do grupo) para a sequência de trilha +
   cavalgada + idle descrita em 2.3, sobre o traçado de regiões construído
   a partir de `Project[]`.
3. **`stats.svg`** — HUD estática (sem animação) com Level, barra de XP,
   atributos e contadores reais (repositórios, commits, PRs, contribuições).

Todos os três: **estáticos primeiro, animação depois** (seção 53 da spec
original) — cada gerador produz uma variante sem `<animate*>` para debug
visual rápido antes de habilitar a animação. `<title>`/`<desc>` obrigatórios
em cada SVG. Orçamento de peso: cada SVG deve ficar abaixo de ~50KB.

## 7. XP, Level e Atributos

Fórmulas simples e arbitrárias (não pretendem precisão, só progressão
visualmente satisfatória — seção 21 da spec original):

```
XP:
  commit         → +1
  pull request   → +15
  issue          → +10
  repository     → +50
  release        → +100
  quest (projeto curado concluído) → +150

Level:
  level = floor(1 + sqrt(xp / 40))
  (curva suave: não trava em nível baixo, não dispara nos primeiros commits)
```

Atributos (0–100, barras de progresso, nunca "%" fingindo precisão de
skill — seção 19): derivados de proporções reais dentro dos dados
coletados, por exemplo:

```
INTELLIGENCE     → diversidade de linguagens/topics usadas
CRAFTING         → nº de repositórios com releases/tags (indica polimento)
EXPLORATION      → nº de tecnologias distintas experimentadas nos últimos 6 meses
AUTOMATION       → nº de repositórios com GitHub Actions/workflows configurados
PROBLEM SOLVING  → nº de issues fechadas + PRs mesclados
```

Cada fórmula normaliza para uma escala 0–100 com um teto razoável (definido
em `src/rpg/attributes.ts`), documentado em comentário no próprio código —
não é um "score" que a spec original pede para tratar como preciso, apenas
visualmente proporcional aos dados reais.

## 8. Atualização do README (marcadores)

Conforme seções 46–48 da spec original:

```md
<!-- RPG:START:HERO --> ... <!-- RPG:END:HERO -->
<!-- RPG:START:PROFILE --> ... <!-- RPG:END:PROFILE -->
<!-- RPG:START:INVENTORY --> ... <!-- RPG:END:INVENTORY -->
<!-- RPG:START:WORLDMAP --> ... <!-- RPG:END:WORLDMAP -->
<!-- RPG:START:QUESTS --> ... <!-- RPG:END:QUESTS -->
<!-- RPG:START:BOSSES --> ... <!-- RPG:END:BOSSES -->
<!-- RPG:START:ACHIEVEMENTS --> ... <!-- RPG:END:ACHIEVEMENTS -->
<!-- RPG:START:STATS --> ... <!-- RPG:END:STATS -->
<!-- RPG:START:CURRENTQUEST --> ... <!-- RPG:END:CURRENTQUEST -->
```

O `README Generator` só reescreve o conteúdo entre cada par de marcadores.
Texto fora deles (About Me, narrativa livre, contato) nunca é tocado —
propriedade do usuário, editado manualmente e versionado normalmente.
Conteúdo manual vs. automático segue exatamente a separação da seção 48 da
spec original (Bosses, Current Quest e as descrições narrativas de
projetos curados são sempre manuais; estatísticas, XP, Level e achievements
automáticos são sempre gerados).

## 9. Automação (GitHub Actions)

```yaml
# github-developer-rpg/.github/workflows/update-profile.yml (conceitual)
on:
  schedule: [cron diário]
  workflow_dispatch: {}   # permite rodar manualmente sob demanda
```

Fluxo: checkout → instala deps → roda `scripts/generate.ts` (coleta API →
RPG Engine → SVG Generator → README Generator, tudo local ao workspace) →
checkout do `Ktsu0/Ktsu0` num diretório separado (token com escopo mínimo,
Secret) → copia `generated/*.svg` e o `README.md` atualizado → commit e
push condicionais (só se houve diff real, para não gerar commits vazios
todo dia). Frequência: 1x/dia (seção 44).

## 10. Stack técnica

```
TypeScript + Node.js
@octokit/rest      → GitHub REST API
zod                → validação de schema nas bordas (API → modelo)
vitest              → testes unitários (RPG Engine, categorização, XP/Level)
GitHub Actions      → agendamento e deploy cross-repo
```

Sem `sharp`/técnica de máscara de pixels (seção 54–57 da spec original) —
não se aplica: o personagem é uma ilustração vetorial artesanal fornecida
pelo usuário, decomposta em peças nomeadas diretamente no SVG-fonte, não
gerada a partir de um bitmap.

## 11. Estrutura de pastas

```
github-developer-rpg/
├── .claude/
│   └── CLAUDE.md                 # ver seção 12
├── .github/workflows/update-profile.yml
├── assets/
│   └── character/horse-rider.svg # arquivo-fonte do cavaleiro
├── config/
│   ├── developer.ts               # identidade, classe
│   ├── projects.ts                # curadoria manual + Starting Grounds
│   ├── bosses.ts                  # narrativa manual
│   └── currentQuest.ts            # objetivo atual, manual
├── src/
│   ├── github/                    # Octokit client, coleta de dados
│   ├── rpg/                       # XP, Level, atributos, categorização,
│   │                               #   achievements automáticos
│   ├── svg/                       # geradores de character/world-map/stats
│   └── readme/                    # aplica marcadores no README.md
├── generated/                     # character.svg, world-map.svg, stats.svg
├── docs/superpowers/specs/        # este documento e specs futuras
├── scripts/generate.ts            # orquestra o pipeline completo
├── package.json / tsconfig.json
└── README.md                      # README deste repositório (o motor)
```

## 12. `.claude/CLAUDE.md` do projeto

Pedido explícito do usuário: preservar a essência do projeto entre sessões
e entre máquinas diferentes. Diferente da memória pessoal do assistente
(local a esta máquina), o `.claude/CLAUDE.md` fica **versionado no git**,
então viaja com qualquer `git clone` do repositório. Conteúdo:

- O pitch de 1 parágrafo (seção 1 deste documento).
- As decisões visuais e arquiteturais já travadas (seção 2–3), para que uma
  sessão futura não as reabra do zero nem "reinvente" o personagem.
- As regras fáceis de esquecer: sem sistema de equipamentos/armas, sem "%"
  de skill inventados, README nunca roda JS, segredos sempre via GitHub
  Secrets.
- Ponteiro para este documento (`docs/superpowers/specs/2026-08-27-github-
  developer-rpg-design.md`) e para o roadmap de 14 fases (seção 13).
- Convenção de pastas (seção 11) resumida.

## 13. Roadmap (14 fases, da spec original do usuário)

Mantido integralmente como o plano de execução de longo prazo:

```
1. Identidade visual        → FECHADA neste documento (seção 2)
2. Criar avatar               → FECHADA (cavaleiro, assets/character/horse-rider.svg)
3. SVG estático                → character.svg sem animação
4. Separar avatar em peças     → grupos nomeados no SVG-fonte
5. Criar animação               → SMIL (Hero + World Map)
6. README estático              → primeira versão com dados reais, sem Actions
7. Modelos TypeScript            → seção 4 deste documento
8. GitHub API                     → src/github/
9. RPG Engine                      → src/rpg/ (XP, Level, categorização §5, §7)
10. Gerar SVG automaticamente        → src/svg/
11. GitHub Actions                    → seção 9
12. World Map                          → regiões reais + Starting Grounds (§5.1)
13. Achievements/Bosses                 → auto + manual (§4)
14. Otimização                            → orçamento de peso, SVGO, cache-busting (§3)
```

Fases 1–7 formam o que a spec original chama de MVP (visual, sem
automação); fases 8–14 fecham o motor de automação completo. Este spec
cobre as 14 fases porque o usuário optou por planejar o projeto inteiro de
uma vez, não em specs separados.

## 14. Riscos e considerações técnicas conhecidas

- **Cache-busting de imagens** (seção 3) — sem query string variável, o
  perfil parece "travado" mesmo com a Action rodando.
- **SMIL em `<img>`:** funciona no GitHub (precedente confirmado por
  geradores populares de SVG animado em READMEs), mas deve ser testado
  diretamente no perfil real antes de finalizar cada fase de animação
  (seção 59 da spec original já alertava para isso).
- **Rate limit da API do GitHub:** a coleta diária de todos os
  repositórios + linguagens por repositório (uma chamada extra por repo)
  deve caber confortavelmente no limite de um token autenticado
  (5000 req/h), mas o `Data Collector` deve cachear/paralelizar com
  moderação para não desperdiçar chamadas em repositórios que não
  mudaram (`pushed_at` inalterado desde a última execução).
- **Commits vazios:** o workflow só deve commitar no `Ktsu0/Ktsu0` quando
  houver diff real, para não poluir o histórico com um commit idêntico
  todo dia.
