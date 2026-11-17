import { getBehaviorProfile } from "../species/behavior-profiles.js";

/**
 * Planeja a coesão social sem obrigar indivíduos a permanecerem juntos.
 * nearbySameSpeciesCount conta outros dragões próximos, não inclui o próprio.
 */
export function getSocialGroupPlan(species, nearbySameSpeciesCount = 0) {
  if (!Number.isInteger(nearbySameSpeciesCount) || nearbySameSpeciesCount < 0) {
    throw new RangeError("A quantidade de dragões próximos deve ser um inteiro não negativo.");
  }

  const profile = getBehaviorProfile(species);
  const targetGroupSize = profile.preferredGroupSize ?? 1;

  if (profile.socialPattern === "solitary") {
    return {
      pattern: "solitary",
      targetGroupSize: 1,
      observedGroupSize: 1 + nearbySameSpeciesCount,
      action: "remain_solo",
      seekingMembers: false
    };
  }

  const observedGroupSize = 1 + nearbySameSpeciesCount;
  const seekingMembers = observedGroupSize < targetGroupSize;

  return {
    pattern: profile.socialPattern,
    targetGroupSize,
    observedGroupSize,
    action: nearbySameSpeciesCount === 0
      ? "seek_group_members"
      : "travel_with_species_group",
    seekingMembers
  };
}
