# GitHub Developer RPG

## O que é este projeto

O perfil GitHub de Gabriel Wagner (`Ktsu0`) é reimaginado como a interface
de um RPG: o usuário é um cavaleiro a cavalo que percorre um mundo onde
repositórios reais viram regiões e quests, commits/PRs/releases viram XP,
e o README do perfil (`Ktsu0/Ktsu0`) é gerado e atualizado automaticamente
a partir de dados reais do GitHub. Este repositório (`github-developer-rpg`)
é o motor: TypeScript + GitHub API + geração de SVG + GitHub Actions — sem
nenhuma lógica de jogo fictícia; tudo deriva de dados reais ou de curadoria
manual explícita em `config/`.

**Spec completo:** `docs/superpowers/specs/2026-08-27-github-developer-rpg-design.md`
— leia antes de propor mudanças de arquitetura ou de identidade visual.

**Plano de implementação do Bloco A:** `docs/superpowers/plans/2026-08-27-github-developer-rpg-bloco-a.md`.

## Decisões já travadas (não reabrir sem o usuário pedir)

- **Personagem final:** um cavaleiro a cavalo, silhueta branca monocromática
  sobre fundo `#0b0f14`, sem armas/armaduras. Ver spec §2.
- **Faseamento:** a fase atual (Bloco A) usa um **emoji** (🧑‍💻) como
  personagem provisório enquanto o pipeline de dados/automação é validado
  sem bugs. O cavaleiro (Bloco B) só entra depois — ver spec §13.
- **Arquitetura cross-repo:** este repositório é o motor; ele escreve no
  repositório de perfil `Ktsu0/Ktsu0` via GitHub Actions + token com escopo
  mínimo (secret `PROFILE_REPO_TOKEN`, nunca hardcoded). Ver spec §3.
- **Categorização de projetos:** híbrida — `config/projects.ts` cura
  projetos com narrativa própria; repositórios não curados viram
  "Uncharted Land" automaticamente. A região "Starting Grounds" (primeiros
  projetos de curso) é uma lista manual fixa, não heurística. Ver spec §5.

## Regras fáceis de esquecer

- **Sem sistema de equipamentos.** Nada de espadas/escudos/armaduras. O
  cavalo é montaria, não item.
- **Sem "%" de skill inventados.** Barras de atributo (0–100) sempre
  derivam de uma fórmula documentada a partir de dados reais
  (`src/rpg/attributes.ts`), nunca de um número chutado.
- **O README não executa JavaScript.** Qualquer interatividade/movimento é
  SVG nativo (SMIL), gerado com antecedência — nunca lógica client-side.
- **Segredos sempre via GitHub Actions Secrets.** Nunca hardcoded no
  código nem commitado em `.env`.
- **Cache-busting obrigatório** nas URLs de imagem do README
  (`?v=<algo que muda a cada execução>`), senão o perfil parece "travado".

## Convenção de pastas

```
config/         curadoria manual (developer, projects, bosses, currentQuest)
src/types.ts    modelo de domínio (DeveloperProfile e afins)
src/github/     coleta de dados reais via GitHub API (Octokit)
src/rpg/        XP, Level, atributos, categorização, achievements
src/svg/        geradores de character.svg / world-map.svg / stats.svg
src/readme/     aplica marcadores <!-- RPG:START:X --> no README
src/pipeline/   orquestra tudo acima (generate(), testável sem rede real)
scripts/        CLI fino que lê env vars e chama src/pipeline
generated/      saída local dos SVGs/README (não é o perfil real)
```

## Estado atual (2026-08-27)

Bloco A implementado e com toda a suíte de testes passando localmente
(`npm test`, `npm run build`). Ainda **não publicado** no perfil real —
falta a ativação manual (criar `Ktsu0/Ktsu0` com o README a partir de
`README.template.md`, gerar o PAT, configurar o secret
`PROFILE_REPO_TOKEN`, disparar o workflow manualmente uma vez). Ver Tarefa
20 do plano de implementação para o passo a passo.

## Como continuar este projeto em outra sessão/máquina

1. Leia este arquivo e o spec (`docs/superpowers/specs/2026-08-27-github-developer-rpg-design.md`).
2. Confira o roadmap na spec §13 para saber em qual bloco/tarefa o projeto está.
3. Rode `npm test` para confirmar que o pipeline ainda passa antes de mudar algo.
4. Bloco B (cavaleiro SVG animado) só começa depois que o Bloco A estiver
   publicando de verdade em `Ktsu0/Ktsu0` sem bugs conhecidos.
