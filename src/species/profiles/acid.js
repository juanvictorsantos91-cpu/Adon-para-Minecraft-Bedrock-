export const acidDragonProfile = {
  species: "acid",
  restRecoveryPerMinute: 2,
  environmentRecovery: { acidicCavern: 4, humidCave: 2.5 },
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
    physicalAttack: 2.2, fly: 1.2, glide: 0.8, fastFly: 2.2,
    acidSpit: 5, acidJet: 9, corrosivePool: 13, armorCorrosion: 7
  },
  diet: ["meat", "small_animals", "insects"],
  preferredFood: ["rabbit", "spider", "cave_spider", "chicken"]
};
