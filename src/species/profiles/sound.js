export const soundDragonProfile = {
  species: "sound",
  restRecoveryPerMinute: 2.1,
  environmentRecovery: { quietCave: 4, shelteredValley: 3 },
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
    walk: 0, run: 1, swim: 1.5, fastSwim: 2.5,
    physicalAttack: 2, fly: 1, glide: 0.7,
    fastFly: 2, echoPulse: 2, sonicImpact: 9,
    disorientingRoar: 12, vibrationTracking: 1
  },
  diet: ["small_animals", "fish", "meat"],
  preferredFood: ["rabbit", "chicken", "salmon"]
};
