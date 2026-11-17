/**
 * Personalidade e tendências comportamentais experimentais por espécie.
 * Valores de 0 a 1 representam tendências, não probabilidades aleatórias.
 */
export const behaviorProfiles = {
  electric: {
    temperament: "alert_territorial",
    aggression: 0.55, caution: 0.7, curiosity: 0.85, protectiveness: 0.75,
    sociability: 0.45, independence: 0.8,
    preferredActivities: ["scan_high_ground", "patrol_territory", "explore"],
    preferredEnvironment: ["mountain", "cold", "high_altitude"],
    threatResponse: "charge_warning"
  },
  water: {
    temperament: "cautious_guardian",
    aggression: 0.35, caution: 0.9, curiosity: 0.65, protectiveness: 0.8,
    sociability: 0.6, independence: 0.65,
    preferredActivities: ["swim_patrol", "dive_explore", "rest_near_water"],
    preferredEnvironment: ["water", "river", "ocean", "waterfall"],
    threatResponse: "retreat_to_water"
  },
  ice: {
    temperament: "reserved_defensive",
    aggression: 0.45, caution: 0.85, curiosity: 0.4, protectiveness: 0.7,
    sociability: 0.35, independence: 0.85,
    preferredActivities: ["observe_quietly", "patrol_snow", "rest_in_cold"],
    preferredEnvironment: ["snow", "ice", "glacier", "cold"],
    threatResponse: "frost_warning"
  },
  fire: {
    temperament: "dominant_aggressive",
    aggression: 0.9, caution: 0.3, curiosity: 0.55, protectiveness: 0.65,
    sociability: 0.3, independence: 0.75,
    preferredActivities: ["patrol_territory", "display_strength", "sun_warm"],
    preferredEnvironment: ["hot", "volcanic", "lava", "desert"],
    threatResponse: "roar_and_stand_ground"
  },
  earth: {
    temperament: "calm_protector",
    aggression: 0.3, caution: 0.75, curiosity: 0.7, protectiveness: 0.95,
    sociability: 0.7, independence: 0.55,
    preferredActivities: ["dig_explore", "tend_nest", "rest_underground"],
    preferredEnvironment: ["forest", "cave", "underground", "lush"],
    threatResponse: "guard_and_block"
  },
  lava: {
    temperament: "confident_territorial",
    aggression: 0.7, caution: 0.45, curiosity: 0.5, protectiveness: 0.65,
    sociability: 0.25, independence: 0.9,
    preferredActivities: ["patrol_hot_ground", "absorb_heat", "volcanic_roam"],
    preferredEnvironment: ["volcanic", "lava", "hot_cave"],
    threatResponse: "heat_warning"
  }
};

export function getBehaviorProfile(species) {
  const profile = behaviorProfiles[species];
  if (!profile) throw new RangeError(`Personalidade não cadastrada: ${species}`);
  return profile;
}
