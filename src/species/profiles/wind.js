export const windDragonProfile = {
  species: "wind",
  restRecoveryPerMinute: 2.2,
  environmentRecovery: { strongWind: 4, highAltitude: 3 },
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
    walk: 0, run: 1, swim: 2, fastSwim: 3,
    physicalAttack: 2, fly: 0.8, glideWithWind: 0.25,
    fastFly: 1.8, windGust: 7, aerialPush: 5
  },
  diet: ["meat", "small_animals", "fish"],
  preferredFood: ["rabbit", "chicken", "salmon"]
};
