export const electricDragonProfile = {
  species: "electric",
  restRecoveryPerMinute: 2,
  environmentRecovery: {
    thunderstorm: 5,
    night: 3
  },
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
    walk: 0,
    run: 1.2,
    swim: 1.5,
    fastSwim: 2.5,
    physicalAttack: 2,
    fly: 1.2,
    fastFly: 2.5,
    electricDischarge: 6,
    electricBoost: 8
  },
  diet: ["fish", "small_animals"],
  preferredFood: ["salmon", "cod"]
};
