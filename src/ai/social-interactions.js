import { getBehaviorProfile } from "../species/behavior-profiles.js";

const peacefulPairs = {
  "earth|lava": ["share_shelter", "travel_together", "cooperate_in_excavation"],
  "ice|water": ["play_near_water", "explore_under_ice"],
  "fire|lava": ["share_warm_ground", "display_strength"],
  "earth|water": ["share_water_source", "coexist_near_river"],
  "electric|earth": ["patrol_mountain_together", "inspect_mineral_caves"],
  "electric|fire": ["display_elemental_power", "keep_respectful_distance"],
  "electric|lava": ["observe_volcanic_storms", "patrol_high_ground"],
  "electric|ice": ["observe_storm", "patrol_mountain_together"],
  "electric|water": ["signal_during_storm", "keep_safe_distance_near_water"],
  "fire|earth": ["practice_strength_display", "share_sunlit_resting_area"],
  "ice|earth": ["explore_cool_caves", "share_sheltered_nest_area"],
  "ice|fire": ["exchange_warning_displays", "respect_temperature_boundaries"],
  "ice|lava": ["observe_steam_from_safe_distance", "avoid_thermal_clash"],
  "lava|water": ["create_steam_signal", "observe_from_safe_distance"]
};

function pairKey(a, b) {
  return [a, b].sort().join("|");
}

/**
 * Interações entre espécies são possibilidades condicionais, não animações
 * automáticas. O adaptador informa ameaças, conflitos e oportunidades reais.
 */
export function assessSocialInteractions(self, nearbyDragons = [], context = {}) {
  if (!self || typeof self !== "object" || !Array.isArray(nearbyDragons)) {
    throw new TypeError("Estado próprio e dragões próximos são necessários.");
  }
  const profile = getBehaviorProfile(self.species);
  const others = nearbyDragons.filter(other => other && other.id !== self.id);
  const differentSpecies = others.filter(other => other.species !== self.species);
  const peaceful = [];
  for (const other of differentSpecies) {
    const options = peacefulPairs[pairKey(self.species, other.species)] ?? ["observe_without_hostility"];
    peaceful.push({
      targetId: other.id ?? null,
      species: other.species,
      options,
      kind: "peaceful"
    });
  }

  let action = null;
  let targetId = null;
  let kind = null;
  const earthLavaMigrationOpportunity =
    (self.species === "earth" && context.migrationDue === true && differentSpecies.some(other => other.species === "lava")) ||
    (self.species === "lava" && differentSpecies.some(other => other.species === "earth" && other.temporaryTerritoryMigrationDue === true));
  if (context.attackedByDragon === true) {
    action = self.health <= 40 || self.energy <= 25
      ? "retreat_from_dragon_attack"
      : "defend_against_dragon";
    kind = "aggressive_defense";
    targetId = context.attackerId ?? null;
  } else if (context.territoryConflict === true && profile.aggression >= 0.6) {
    action = "challenge_intruding_dragon";
    kind = "territorial_aggression";
    targetId = context.conflictingDragonId ?? null;
  } else if (earthLavaMigrationOpportunity) {
    action = "coordinate_temporary_territory_migration";
    kind = "peaceful_migration";
    targetId = differentSpecies.find(other => other.species === (self.species === "earth" ? "lava" : "earth"))?.id ?? null;
  } else if (context.socialOpportunity === true && peaceful.length > 0 && profile.sociability >= 0.3) {
    action = "perform_peaceful_cross_species_interaction";
    kind = "peaceful";
    targetId = peaceful[0].targetId;
  }

  return {
    nearbyDifferentSpeciesCount: differentSpecies.length,
    peacefulInteractions: peaceful,
    action,
    kind,
    targetId,
    mixedEarthLavaGroup: mixedEarthLavaPresent(self, differentSpecies),
    migrationRoles: earthLavaMigrationOpportunity ? {
      earth: "excavate_route_and_temporary_shelters",
      lava: "warm_subterranean_passages_and_cross_hot_terrain",
      coordination: "travel_together_between_temporary_territories"
    } : null
  };
}

function mixedEarthLavaPresent(self, others) {
  return ["earth", "lava"].includes(self.species) &&
    others.some(other => ["earth", "lava"].includes(other.species));
}
