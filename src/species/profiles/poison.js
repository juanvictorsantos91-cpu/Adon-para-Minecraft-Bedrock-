export const poisonDragonProfile = {
  species: "poison",
  restRecoveryPerMinute: 2,
  environmentRecovery: { humidForest: 3, swamp: 3.5 },
  hungerPerMinute: 0.05,
  starvationGraceMinutes: 60,
  starvationDamagePerMinute: 0.1,
  lowHungerEnergyMultiplier: 0.5,
  emergencyReserve: 15,
  maxNutritionPerMeal: 100,
  maxEnergyFromMeal: 15,
  healthRecoveryPerMinute: 0.15,
  injuryRecoveryPerMinute: 1,
  activityCosts: {
    walk: 0, run: 1.2, swim: 1.5, fastSwim: 2.5,
    physicalAttack: 2, fly: 1.2, glide: 0.8, fastFly: 2.2,
    venomSpit: 5, venomBreath: 9, camouflageMist: 7
  },
  diet: ["small_animals", "land_animals", "fish"],
  preferredFood: ["rabbit", "chicken", "cod"]
};
