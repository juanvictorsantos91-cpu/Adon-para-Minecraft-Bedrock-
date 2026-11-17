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
  const sameSpecies = [], otherSpecies = [];
  for (const other of nearbyDragons) {
    if (!other || other.id === self.id || !Number.isFinite(other.distance) || other.distance < 0) continue;
    if (other.species === self.species) sameSpecies.push(other);
    else otherSpecies.push(other);
  }
  const independentGroups = sameSpecies.filter(other => self.territoryId && other.territoryId && self.territoryId !== other.territoryId);
  const sharedGroup = sameSpecies.filter(other => self.territoryId && other.territoryId === self.territoryId);
  const overlapRisk = independentGroups.filter(other => other.distance <= TERRITORY_RULES.sameSpeciesAvoidOverlap);
  const preferredSpacing = independentGroups.filter(other => other.distance < TERRITORY_RULES.sameSpeciesPreferredSeparation);
  const comfortableSpacing = independentGroups.filter(other => other.distance >= TERRITORY_RULES.sameSpeciesComfortableSeparation);
  return {
    sameSpeciesNearby: sameSpecies.length, sharedTerritoryMembers: sharedGroup.length,
    independentSameSpeciesGroups: independentGroups.length, overlapRiskCount: overlapRisk.length,
    preferredSpacingCount: preferredSpacing.length, comfortableSpacingCount: comfortableSpacing.length,
    crossSpeciesVisitors: otherSpecies.length, shouldAvoidSameSpeciesGroup: overlapRisk.length > 0,
    crossSpeciesConflictAutomatic: false
  };
}


const MIGRATION_CONFRONTATION_CHANCE = Object.freeze({
  fire: 0.72, water: 0.38, electric: 0.55, ice: 0.42, earth: 0.45,
  wind: 0.32, sound: 0.40, poison: 0.78, plasma: 0.60
});

function stableRoll(seed) {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

/**
 * Dragões de outras espécies consideram o grupo migratório de Terra intruso.
 * A chance define se partem para confronto ou apenas intimidam/observam.
 * Lava é a única espécie que tolera a passagem.
 */
export function assessEarthMigrationReception(owner, earthDragon, context = {}) {
  if (!owner || !earthDragon || earthDragon.species !== "earth" ||
      earthDragon.temporaryTerritoryMigrationDue !== true) {
    return { applies: false, accepts: false, conflict: false, action: null, chance: 0 };
  }
  if (owner.species === "lava") {
    return { applies: true, accepts: true, conflict: false,
      action: "tolerate_earth_migration_passage", chance: 0 };
  }
  const chance = MIGRATION_CONFRONTATION_CHANCE[owner.species] ?? 0.5;
  const roll = stableRoll(`${owner.id ?? owner.species}:${earthDragon.id ?? "earth"}:${context.migrationCycle ?? "current"}`);
  const conflict = roll < chance;
  return {
    applies: true, accepts: false, conflict, chance, roll,
    action: conflict ? "challenge_migrating_earth_group" : "warn_migrating_earth_group"
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
  const visitors = isNomadic ? [] : nearbyDragons.filter(other => {
    if (!other || other.id === self.id || !Number.isFinite(other.distance) || other.distance > radius) return false;
    if (other.species === self.species && context.territoryId && other.territoryId === context.territoryId) return false;
    if (self.species === "lava" && other.species === "earth" && other.temporaryTerritoryMigrationDue === true) return false;
    return true;
  });
  const migratingEarth = self.species !== "earth" && self.species !== "lava"
    ? visitors.filter(other => other.species === "earth" && other.temporaryTerritoryMigrationDue === true)
    : [];
  const migrationReception = migratingEarth.map(earth =>
    assessEarthMigrationReception(self, earth, { migrationCycle: context.migrationCycle })
  );
  const earthMigrationTargets = self.species === "earth" && relocationDue
    ? nearbyDragons.filter(other => other && other.species !== "earth" &&
        Number.isFinite(other.distance) && other.territoryId &&
        other.distance <= (getTerritoryRadius(other.species) ?? 0))
        .map(owner => assessEarthMigrationReception(owner, self, { migrationCycle: context.migrationCycle }))
    : [];
  const allMigrationReceptions = [...migrationReception, ...earthMigrationTargets];
  const migrationConflict = migrationReception.some(result => result.conflict);
  const nestThreatened = context.nestThreatened === true ||
    visitors.some(other => other.nearNest === true || other.hostile === true);
  const territoryIntruded = !isNomadic && (
    context.territoryIntruded === true || visitors.length > 0 || migratingEarth.length > 0
  );
  const canDefend = self.health > 40 && self.energy > 30 && self.injury?.severity !== "severe";
  const action = isNomadic ? "remain_nomadic"
    : nestThreatened ? "guard_nest"
    : relocationDue ? "prepare_temporary_territory_relocation"
    : migrationConflict && canDefend ? "challenge_migrating_earth_group"
    : migratingEarth.length > 0 ? "warn_migrating_earth_group"
    : territoryIntruded && canDefend ? "challenge_territory_intruder"
    : territoryIntruded ? "observe_intruder_from_safety"
    : "patrol_territory";
  return {
    territoryId: isNomadic ? null : (context.territoryId ?? null),
    radius, isNomadic, temporaryTerritory,
    territoryActive: temporaryTerritory ? !relocationDue : !isNomadic,
    relocationDue, territoryIntruded, nestThreatened,
    intruderCount: visitors.length, knownVisitorCount: visitors.filter(other => other.knownToSelf === true || other.isTamed === true).length,
    unknownDragonCount: visitors.filter(other => other.knownToSelf !== true && other.isTamed !== true).length,
    canDefend, action, migrationReception: allMigrationReceptions,
    toleratedEarthMigrationCount: nearbyDragons.filter(other => self.species === "lava" &&
      other?.species === "earth" && other.temporaryTerritoryMigrationDue === true &&
      Number.isFinite(other.distance) && other.distance <= radius).length,
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
  return { score, suitable: score >= 65 && candidate.protectedFromWeather !== false,
    reasons: { habitatScore: environmentScore, dangerPenalty, privacyBonus, distanceBonus } };
}
