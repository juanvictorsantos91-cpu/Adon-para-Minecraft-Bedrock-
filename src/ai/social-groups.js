import { getBehaviorProfile } from "../species/behavior-profiles.js";

const mixedGroupSpecies = new Set(["earth", "lava"]);

/**
 * Planeja a coesão social. Terra e Lava são aliados gregários e podem formar
 * bandos mistos; os demais mantêm o padrão específico da própria espécie.
 */
export function getSocialGroupPlan(species, nearbySameSpeciesCount = 0, nearbyDragons = []) {
  if (!Number.isInteger(nearbySameSpeciesCount) || nearbySameSpeciesCount < 0) {
    throw new RangeError("A quantidade de dragões próximos deve ser um inteiro não negativo.");
  }
  if (!Array.isArray(nearbyDragons)) {
    throw new TypeError(" nearbyDragons precisa ser uma lista.");
  }

  const profile = getBehaviorProfile(species);
  const sameSpeciesCount = nearbySameSpeciesCount;
  const mixedCompanions = mixedGroupSpecies.has(species)
    ? nearbyDragons.filter(dragon =>
        dragon && dragon.species !== species && mixedGroupSpecies.has(dragon.species) &&
        dragon.lifeStage !== "hatchling"
      ).length
    : 0;
  const observedGroupSize = 1 + sameSpeciesCount + mixedCompanions;
  const targetGroupSize = profile.preferredGroupSize ?? 1;

  if (profile.socialPattern === "solitary") {
    return {
      pattern: "solitary", targetGroupSize: 1, observedGroupSize: 1 + sameSpeciesCount,
      mixedCompanions: 0, action: "remain_solo", seekingMembers: false, mixedGroup: false
    };
  }

  if (mixedGroupSpecies.has(species)) {
    const hasMixedCompanion = mixedCompanions > 0;
    const hasSameSpeciesCompanion = sameSpeciesCount > 0;
    return {
      pattern: "large_groups",
      targetGroupSize,
      observedGroupSize,
      mixedCompanions,
      action: hasMixedCompanion
        ? "travel_with_mixed_earth_lava_group"
        : hasSameSpeciesCompanion ? "travel_with_species_group" : "seek_earth_lava_group",
      seekingMembers: observedGroupSize < targetGroupSize,
      mixedGroup: hasMixedCompanion
    };
  }

  const seekingMembers = observedGroupSize < targetGroupSize;
  return {
    pattern: profile.socialPattern, targetGroupSize, observedGroupSize,
    mixedCompanions: 0,
    action: sameSpeciesCount === 0 ? "seek_group_members" : "travel_with_species_group",
    seekingMembers, mixedGroup: false
  };
}
