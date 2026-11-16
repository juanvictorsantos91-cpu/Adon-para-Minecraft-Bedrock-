import { decideZombieAction } from "../src/brains/zombie-brain.js";

const situations = [
  {
    name: "Zumbi ferido com jogador à vista",
    state: { health: 4, maxHealth: 20, targetVisible: true, targetInAttackRange: false }
  },
  {
    name: "Jogador perto",
    state: { health: 20, maxHealth: 20, targetVisible: true, targetInAttackRange: true }
  },
  {
    name: "Jogador longe, mas visível",
    state: { health: 20, maxHealth: 20, targetVisible: true, targetInAttackRange: false }
  },
  {
    name: "Nenhum jogador à vista",
    state: { health: 20, maxHealth: 20, targetVisible: false, targetInAttackRange: false }
  }
];

for (const situation of situations) {
  const decision = decideZombieAction(situation.state);
  console.log(`\n${situation.name}`);
  console.log(`Ação: ${decision.action}`);
  console.log(`Regra: ${decision.rule}`);
  console.log(`Motivo: ${decision.reason}`);
}
