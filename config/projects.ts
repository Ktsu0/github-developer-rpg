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
