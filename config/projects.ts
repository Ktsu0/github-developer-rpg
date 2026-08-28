import type { CuratedProject } from "../src/rpg/categorize";
import type { ManualQuest } from "../src/types";

/**
 * Fixed list, not a heuristic (decision recorded in spec §5.1): the
 * user's first course projects, confirmed against real GitHub data on
 * 2026-08-27.
 */
export const startingGroundsProjects: CuratedProject[] = [
  {
    repository: "portifolio_wagner",
    name: "Portfólio Wagner",
    description: "A primeira fortaleza erguida nesta jornada: um portfólio simples que marcou a virada de estudante para desenvolvedor.",
    category: "starting-grounds",
    status: "completed",
    icon: "🌱",
  },
  {
    repository: "portifolio_react",
    name: "Portfólio React",
    description: "Segunda expedição, primeira vez pisando em terras React — testando os limites do que tinha acabado de aprender.",
    category: "starting-grounds",
    status: "completed",
    icon: "🌱",
  },
  {
    repository: "login_page",
    name: "Tela de Login",
    description: "Uma arena de treino: formulários, validação e as primeiras batalhas contra bugs de front-end em JavaScript puro.",
    category: "starting-grounds",
    status: "completed",
    icon: "🌱",
  },
  {
    repository: "front_end_react",
    name: "Front End React",
    description: "Missão da matéria de Back-end que virou desculpa pra praticar front-end de verdade.",
    category: "starting-grounds",
    status: "completed",
    icon: "🌱",
  },
];

export const curatedProjects: CuratedProject[] = [
  ...startingGroundsProjects,
  {
    repository: "Financeiro",
    name: "Financeiro",
    description: "Um cofre digital forjado pra domar o caos das finanças pessoais — registra gastos, revela padrões, devolve controle.",
    category: "finance",
    status: "completed",
    icon: "🏦",
  },
  {
    repository: "antes-de-dormir",
    name: "Antes de Dormir",
    description: "Uma plataforma pensada pra dar palco a histórias curtas, escritas antes que o sono vença.",
    category: "projects",
    status: "completed",
    icon: "🏠",
  },
  {
    repository: "PlantaGamer",
    name: "PlantaGamer",
    description: "Missão em grupo: aplicar Scrum de verdade, sobreviver às sprints e sair inteiro do outro lado com a equipe.",
    category: "team",
    status: "completed",
    icon: "🤝",
  },
  // As quatro abaixo não têm descrição no GitHub — o enredo é meu, baseado
  // no nome/stack de cada uma. Ajuste à vontade se quiser algo mais preciso.
  {
    repository: "siteMysticReact",
    name: "Site Mystic",
    description: "Site pessoal construído em React, testando um visual mais autoral e místico.",
    category: "projects",
    status: "completed",
    icon: "🏠",
  },
  {
    repository: "Copa-do-Mundo",
    name: "Copa do Mundo",
    description: "Tributo em código à maior competição do futebol — lógica, dados e interface na mesma partida.",
    category: "projects",
    status: "completed",
    icon: "🏠",
  },
  {
    repository: "API_Ecomerce",
    name: "API E-commerce",
    description: "Os bastidores de uma loja virtual: rotas, produtos e pedidos costurados numa API.",
    category: "backend",
    status: "completed",
    icon: "⚙️",
  },
  {
    repository: "HarvestProgrammer",
    name: "Harvest Programmer",
    description: "Publicado ao vivo em harvest-programmer.vercel.app — um projeto colhido do código e posto pra rodar em produção.",
    category: "games",
    status: "completed",
    icon: "🎮",
  },
];

/**
 * Quests with no backing GitHub repo the collector can see (spec: private
 * repos never appear via GET /users/{username}/repos, regardless of
 * token). Hand-authored end to end, including the link — Quest Log only,
 * never on the World Map (no ProjectSource/region to place it there).
 */
export const manualQuests: ManualQuest[] = [
  {
    name: "Termo Infinito",
    description: "Um mundo de mini-jogos — o projeto mais ambicioso da jornada até aqui. Hoje é privado, mas roda ao vivo.",
    status: "completed",
    url: "https://termo-infinito.vercel.app/",
    icon: "🎮",
  },
];
