import { getSpeciesDiet } from "../species/diets/species-diets.js";

const foodValues = {
  salmon: 15, cod: 15, tropical_fish: 12, rabbit: 12, chicken: 10,
  beef: 25, porkchop: 20, mutton: 20, cooked_beef: 25,
  small_animal: 8, aquatic_animal: 16, magma_cream: 12
};

function matchesDiet(species, prey) {
  const diet = getSpeciesDiet(species);
  const foodId = prey.foodId ?? prey.type;
  return diet.preferred.includes(foodId) ||
    diet.foods.includes(prey.dietCategory) ||
    diet.foods.includes(foodId);
}

export function assessHuntingPlan(self, nearbyPrey = [], context = {}) {
  if (!self || typeof self !== "object" || !Array.isArray(nearbyPrey)) {
    throw new TypeError("Estado do dragão e lista de presas são necessários.");
  }
  const hunger = Number.isFinite(self.hunger) ? self.hunger : 100;
  const candidates = nearbyPrey
    .filter(prey => prey && prey.id && matchesDiet(self.species, prey))
    .filter(prey => prey.isTamed !== true && prey.isOwned !== true && prey.isFarmAnimal !== true)
    .filter(prey => prey.protectedByPlayer !== true && prey.isBaby !== true)
    .map(prey => {
      const distance = Number.isFinite(prey.distance) ? Math.max(0, prey.distance) : Infinity;
      const risk = Math.max(0, Math.min(100, Number(prey.risk ?? 0)));
      const foodId = prey.foodId ?? prey.type;
      const nutrition = Number.isFinite(prey.nutrition) ? prey.nutrition : (foodValues[foodId] ?? 8);
      const score = nutrition * 2 - distance * 0.7 - risk * 1.2;
      return { prey, distance, risk, nutrition, score };
    })
    .filter(item => item.distance <= (context.huntRange ?? 32) && item.risk < 80)
    .sort((a, b) => b.score - a.score);
  const selected = candidates[0] ?? null;
  const cooperative = context.compatibleHuntersNearby === true && self.energy > 35 && self.health > 50;
  let action = "continue_normal_behavior";
  if (hunger <= 20) action = selected ? "hunt_urgent_prey" : "search_food_safely";
  else if (hunger <= 50) action = selected ? "hunt_selected_prey" : "search_food_safely";
  else if (hunger <= 70 && selected) action = "consider_hunting_prey";
  if (selected && cooperative && hunger <= 65) action = "coordinate_cooperative_hunt";
  return {
    action,
    selectedPreyId: selected?.prey.id ?? null,
    distance: selected?.distance ?? null,
    estimatedNutrition: selected?.nutrition ?? 0,
    risk: selected?.risk ?? null,
    candidateCount: candidates.length,
    cooperative,
    shouldHunt: Boolean(selected && hunger <= 70),
    protectedPreyExcluded: true
  };
}
