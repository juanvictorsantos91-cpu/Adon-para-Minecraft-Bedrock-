import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";
import { assessDragonRelationships } from "../src/ai/dragon-relationships.js";

const speciesCases = [
  ["water", 2],
  ["fire", 1],
  ["ice", 1],
  ["electric", 0],
  ["earth", 5],
  ["lava", 5]
];

console.log("=== Dragon Survival: simulação social ===");
for (const [species, nearbySameSpeciesCount] of speciesCases) {
  const decision = decideDragonBehavior({
    species,
    energy: 90,
    hunger: 90,
    health: 100,
    immediateDanger: false,
    safeToExplore: true,
    nearbySameSpeciesCount,
    sameSpeciesGroupNearby: nearbySameSpeciesCount > 0
  });
  console.log(
    `${species}: ação=${decision.action}; padrão=${decision.groupPlan.pattern}; ` +
    `grupo desejado=${decision.groupPlan.targetGroupSize}`
  );
}

const parent = {
  id: "earth-parent",
  species: "earth",
  lifeStage: "adult",
  hasYoung: true,
  youngNeedsFood: true
};
const child = {
  id: "earth-hatchling",
  species: "earth",
  lifeStage: "hatchling",
  parentIds: ["earth-parent"]
};
const family = assessDragonRelationships(parent, [child]);
console.log(
  `família Terra: relação=${family.recognized[0].relationship}; ` +
  `ação parental=${family.parentalAction}`
);
