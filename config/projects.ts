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
    description: "Meus primeiros passos em desenvolvimento web.",
    category: "starting-grounds",
    status: "completed",
    icon: "🌱",
  },
  {
    repository: "portifolio_react",
    name: "Portfólio React",
    description: "Primeiro contato com React, ainda aprendendo.",
    category: "starting-grounds",
    status: "completed",
    icon: "🌱",
  },
  {
    repository: "login_page",
    name: "Tela de Login",
    description: "Prática de formulários e validação em JavaScript puro.",
    category: "starting-grounds",
    status: "completed",
    icon: "🌱",
  },
  {
    repository: "front_end_react",
    name: "Front End React",
    description: "Projeto de front-end para a matéria de Back-end.",
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
    description: "Dashboard para controle de gastos pessoais.",
    category: "finance",
    status: "completed",
    icon: "🏦",
  },
  {
    repository: "antes-de-dormir",
    name: "Antes de Dormir",
    description: "Plataforma para publicar histórias curtas.",
    category: "projects",
    status: "completed",
    icon: "🏠",
  },
  {
    repository: "PlantaGamer",
    name: "PlantaGamer",
    description: "Projeto em time aplicando Scrum.",
    category: "team",
    status: "completed",
    icon: "🤝",
  },
  // Descrições genéricas abaixo — os repositórios não têm descrição no
  // GitHub, então usei o que dá pra inferir honestamente do nome/stack.
  // Vale ajustar se quiser um texto mais narrativo.
  {
    repository: "siteMysticReact",
    name: "Site Mystic",
    description: "Site pessoal construído em React.",
    category: "projects",
    status: "completed",
    icon: "🏠",
  },
  {
    repository: "Copa-do-Mundo",
    name: "Copa do Mundo",
    description: "Projeto sobre a Copa do Mundo.",
    category: "projects",
    status: "completed",
    icon: "🏠",
  },
  {
    repository: "API_Ecomerce",
    name: "API E-commerce",
    description: "API para uma loja virtual.",
    category: "backend",
    status: "completed",
    icon: "⚙️",
  },
  {
    repository: "HarvestProgrammer",
    name: "Harvest Programmer",
    description: "Projeto publicado em harvest-programmer.vercel.app.",
    category: "games",
    status: "completed",
    icon: "🎮",
  },
];

/**
 * Quests with no backing GitHub repo the collector can see (spec: private
 * repos never appear via GET /users/{username}/repos, regardless of
 * token). Hand-authored end to end, including the link — Quest Log only,
 * never on the World Map.
 *
 * TODO: add Termo Infinito here once its live-site URL is confirmed —
 * it's private, so its link should point to the site instead of GitHub.
 */
export const manualQuests: ManualQuest[] = [];
