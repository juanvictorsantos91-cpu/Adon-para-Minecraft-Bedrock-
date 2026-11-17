export const speciesDiets = {
  electric: { foods: ["fish", "small_animals"], preferred: ["salmon", "cod"] },
  water: { foods: ["fish", "aquatic_animals"], preferred: ["salmon", "cod", "tropical_fish"] },
  ice: { foods: ["fish", "cold_biome_animals"], preferred: ["salmon", "cod", "rabbit"] },
  fire: { foods: ["meat", "land_animals"], preferred: ["beef", "porkchop", "mutton"] },
  earth: { foods: ["land_animals", "minerals"], preferred: ["beef", "mutton", "iron_nugget", "copper_ingot"] },
  lava: { foods: ["meat", "special_food"], preferred: ["beef", "cooked_beef", "magma_cream"] }
};

export function getSpeciesDiet(species) {
  const diet = speciesDiets[species];
  if (!diet) throw new RangeError(`Espécie sem dieta cadastrada: ${species}`);
  return diet;
}

export function canEat(species, foodId) {
  const diet = getSpeciesDiet(species);
  return diet.preferred.includes(foodId) || diet.foods.includes(foodId);
}
