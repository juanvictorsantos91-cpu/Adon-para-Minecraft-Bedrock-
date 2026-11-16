import { chooseAction } from "../ai/rule-engine.js";

const zombieRules = [
  {
    name: "low-health-retreat",
    priority: 1,
    when: (state) => state.health <= state.maxHealth * 0.25 && state.targetVisible,
    action: "retreat",
    reason: "Vida abaixo ou igual a 25% e há uma ameaça visível."
  },
  {
    name: "attack-in-range",
    priority: 2,
    when: (state) => state.targetVisible && state.targetInAttackRange,
    action: "attack",
    reason: "O alvo está visível e dentro do alcance de ataque."
  },
  {
    name: "approach-target",
    priority: 3,
    when: (state) => state.targetVisible,
    action: "approach",
    reason: "O alvo está visível, mas ainda está longe."
  },
  {
    name: "wander",
    priority: 4,
    when: () => true,
    action: "wander",
    reason: "Não há alvo visível; continuar explorando."
  }
];

export function decideZombieAction(state) {
  validateZombieState(state);
  return chooseAction(state, zombieRules, "wander");
}

function validateZombieState(state) {
  const required = ["health", "maxHealth", "targetVisible", "targetInAttackRange"];
  for (const key of required) {
    if (!(key in state)) {
      throw new Error(`Estado do zumbi sem o campo obrigatório: ${key}`);
    }
  }

  if (state.maxHealth <= 0 || state.health < 0) {
    throw new Error("A vida deve ser válida e a vida máxima maior que zero.");
  }
}
