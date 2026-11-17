import { scoreEnvironmentCandidate } from "./environment-awareness.js";

export function assessTerritory(self, nearbyDragons = [], context = {}) {
  if (!self || typeof self !== "object" || !Array.isArray(nearbyDragons)) {
    throw new TypeError("Estado do dragão e lista de vizinhos são necessários.");
  }
  const radius = Number.isFinite(context.territoryRadius) ? Math.max(0, context.territoryRadius) : 48;
  const intruders = nearbyDragons.filter(other =>
    other && other.id !== self.id &&
    other.distance <= radius &&
    other.territoryId && context.territoryId &&
    other.territoryId === context.territoryId &&
    other.id !== context.territoryOwnerId
  );
  const unknownDragons = nearbyDragons.filter(other =>
    other && other.id !== self.id && other.distance <= radius &&
    other.knownToSelf !== true && other.isTamed !== true
  );
  const nestThreatened = context.nestThreatened === true ||
    intruders.some(other => other.nearNest === true || other.hostile === true);
  const territoryIntruded = context.territoryIntruded === true || intruders.length > 0;
  const canDefend = self.health > 40 && self.energy > 30 && self.injury?.severity !== "severe";
  const action = nestThreatened ? "guard_nest"
    : territoryIntruded && canDefend ? "challenge_territory_intruder"
    : territoryIntruded ? "observe_intruder_from_safety"
    : "patrol_territory";
  return {
    territoryId: context.territoryId ?? null,
    radius,
    territoryIntruded,
    nestThreatened,
    intruderCount: intruders.length,
    unknownDragonCount: unknownDragons.length,
    canDefend,
    action
  };
}

export function evaluateNestSite(species, candidate = {}) {
  const environmentScore = scoreEnvironmentCandidate(species, candidate);
  const dangerPenalty = (candidate.predatorNearby === true ? 45 : 0) +
    (candidate.floodRisk === true ? 35 : 0) +
    (candidate.collapseRisk === true ? 40 : 0) +
    (candidate.playerBuildNearby === true ? 20 : 0);
  const privacyBonus = candidate.hidden === true ? 8 : 0;
  const distanceBonus = Number.isFinite(candidate.distanceFromThreat) ?
    Math.min(12, Math.max(0, candidate.distanceFromThreat / 8)) : 0;
  const score = Math.max(0, Math.min(100, Math.round(environmentScore - dangerPenalty + privacyBonus + distanceBonus)));
  return {
    score,
    suitable: score >= 65 && candidate.protectedFromWeather !== false,
    reasons: {
      habitatScore: environmentScore,
      dangerPenalty,
      privacyBonus,
      distanceBonus
    }
  };
}
