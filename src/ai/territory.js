import { scoreEnvironmentCandidate } from "./environment-awareness.js";

export const TERRITORY_RULES = Object.freeze({
  sameSpeciesAvoidOverlap: 128,
  sameSpeciesPreferredSeparation: 256,
  sameSpeciesComfortableSeparation: 512
});

export const SPECIES_TERRITORY_RADII = Object.freeze({
  electric: 256, water: 160, ice: 192, fire: 224, earth: 160,
  lava: 192, wind: 96, sound: 128, poison: 112, plasma: null
});

export function getTerritoryRadius(species, override) {
  if (Number.isFinite(override)) return Math.max(0, override);
  if (!(species in SPECIES_TERRITORY_RADII)) throw new RangeError(`Espécie desconhecida: ${species}`);
  return SPECIES_TERRITORY_RADII[species];
}

export function assessTerritorialSpacing(self, nearbyDragons = []) {
  if (!self || typeof self !== "object" || !Array.isArray(nearbyDragons)) {
    throw new TypeError("Estado do dragão e lista de vizinhos são necessários.");
  }
  const sameSpecies = [];
  const otherSpecies = [];
  for (const other of nearbyDragons) {
    if (!other || other.id === self.id || !Number.isFinite(other.distance) || other.distance < 0) continue;
    if (other.species === self.species) sameSpecies.push(other);
    else otherSpecies.push(other);
  }
  const independentGroups = sameSpecies.filter(other =>
    self.territoryId && other.territoryId && self.territoryId !== other.territoryId
  );
  const sharedGroup = sameSpecies.filter(other =>
    self.territoryId && other.territoryId === self.territoryId
  );
  const overlapRisk = independentGroups.filter(other => other.distance <= TERRITORY_RULES.sameSpeciesAvoidOverlap);
  const preferredSpacing = independentGroups.filter(other => other.distance < TERRITORY_RULES.sameSpeciesPreferredSeparation);
  const comfortableSpacing = independentGroups.filter(other => other.distance >= TERRITORY_RULES.sameSpeciesComfortableSeparation);
  return {
    sameSpeciesNearby: sameSpecies.length,
    sharedTerritoryMembers: sharedGroup.length,
    independentSameSpeciesGroups: independentGroups.length,
    overlapRiskCount: overlapRisk.length,
    preferredSpacingCount: preferredSpacing.length,
    comfortableSpacingCount: comfortableSpacing.length,
    crossSpeciesVisitors: otherSpecies.length,
    shouldAvoidSameSpeciesGroup: overlapRisk.length > 0,
    crossSpeciesConflictAutomatic: false
  };
}

export function assessTerritory(self, nearbyDragons = [], context = {}) {
  if (!self || typeof self !== "object" || !Array.isArray(nearbyDragons)) {
    throw new TypeError("Estado do dragão e lista de vizinhos são necessários.");
  }
  const radius = getTerritoryRadius(self.species, context.territoryRadius);
  const isNomadic = radius === null;
  const temporaryTerritory = self.species === "earth";
  const relocationDue = temporaryTerritory && context.migrationDue === true;
  const visitors = isNomadic ? [] : nearbyDragons.filter(other =>
    other && other.id !== self.id && Number.isFinite(other.distance) &&
    other.distance <= radius &&
    (!context.territoryId || !other.territoryId || other.territoryId !== context.territoryId)
  );
  const knownVisitors = visitors.filter(other => other.knownToSelf === true || other.isTamed === true);
  const unknownDragons = visitors.filter(other => other.knownToSelf !== true && other.isTamed !== true);
  const nestThreatened = context.nestThreatened === true ||
    visitors.some(other => other.nearNest === true && other.hostile === true);
  const territoryIntruded = !isNomadic && (context.territoryIntruded === true || visitors.length > 0);
  const canDefend = self.health > 40 && self.energy > 30 && self.injury?.severity !== "severe";
  const action = isNomadic ? "remain_nomadic"
    : nestThreatened ? "guard_nest"
    : relocationDue ? "prepare_temporary_territory_relocation"
    : territoryIntruded && canDefend ? "challenge_territory_intruder"
    : territoryIntruded ? "observe_intruder_from_safety"
    : "patrol_territory";
  return {
    territoryId: isNomadic ? null : (context.territoryId ?? null),
    radius, isNomadic, temporaryTerritory,
    territoryActive: temporaryTerritory ? !relocationDue : !isNomadic,
    relocationDue, territoryIntruded, nestThreatened,
    intruderCount: visitors.length,
    knownVisitorCount: knownVisitors.length,
    unknownDragonCount: unknownDragons.length,
    canDefend, action,
    spacing: assessTerritorialSpacing(self, nearbyDragons)
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
    reasons: { habitatScore: environmentScore, dangerPenalty, privacyBonus, distanceBonus }
  };
}
