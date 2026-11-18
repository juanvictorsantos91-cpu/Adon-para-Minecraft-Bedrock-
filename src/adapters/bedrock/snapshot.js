import { getBehaviorProfile } from "../../species/behavior-profiles.js";

const SPECIES_PREFIX = "ds:species:";
const NUMBER_PREFIXES = Object.freeze({
  energy: "ds:energy:",
  hunger: "ds:hunger:",
  aggression: "ds:aggression:",
  spawnTick: "ds:spawn_tick:"
});

export function readTaggedNumber(tags, prefix, fallback) {
  const tag = tags.find(value => value.startsWith(prefix));
  if (!tag) return fallback;
  const value = Number(tag.slice(prefix.length));
  return Number.isFinite(value) ? value : fallback;
}

export function readSpecies(tags) {
  const tag = tags.find(value => value.startsWith(SPECIES_PREFIX));
  return tag ? tag.slice(SPECIES_PREFIX.length) : null;
}

function clampPercent(value, fallback = 100) {
  const numeric = Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(100, numeric));
}

function readHealthPercent(entity) {
  const component = entity.getComponent?.("minecraft:health");
  const current = component?.currentValue;
  if (!Number.isFinite(current)) return 100;
  const maximum = Number.isFinite(component?.effectiveMax) && component.effectiveMax > 0
    ? component.effectiveMax
    : Number.isFinite(component?.defaultValue) && component.defaultValue > 0
      ? component.defaultValue : 100;
  return clampPercent((current / maximum) * 100);
}

function readTaggedId(tags, prefix) {
  const tag = tags.find(value => value.startsWith(prefix));
  return tag ? tag.slice(prefix.length) : null;
}

function readTrait(tags, name) {
  const value = readTaggedNumber(tags, `ds:trait:${name}:`, undefined);
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : undefined;
}

function readTemperatureCondition(tags, environmentContext) {
  if (tags.includes("ds:temperature:too_hot")) return "too_hot";
  if (tags.includes("ds:temperature:too_cold")) return "too_cold";
  return environmentContext.temperatureCondition ?? null;
}

function hasRelationshipTag(tags, prefix, id) {
  return tags.includes(prefix) || (id != null && tags.includes(`${prefix}:${id}`));
}

export function distanceBetween(a, b) {
  if (!a || !b) return Infinity;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function buildDragonSnapshot(entity, nearbyEntities = [], environmentContext = {}, currentTick = 0) {
  if (!entity || typeof entity.getTags !== "function") {
    throw new TypeError("Uma entidade Bedrock válida é necessária.");
  }
  const tags = entity.getTags();
  const species = readSpecies(tags);
  if (!species) return null;

  const profile = getBehaviorProfile(species);
  // O núcleo do MIS usa escalas percentuais de 0 a 100, independentemente
  // do máximo absoluto configurado na entidade Bedrock (por exemplo, 120 HP).
  const health = readHealthPercent(entity);
  const energy = clampPercent(readTaggedNumber(tags, NUMBER_PREFIXES.energy, 100));
  const hunger = clampPercent(readTaggedNumber(tags, NUMBER_PREFIXES.hunger, 100));
  const aggression = Math.max(0, Math.min(1,
    readTaggedNumber(tags, NUMBER_PREFIXES.aggression, profile.aggression ?? 0)
  ));
  const spawnTick = readTaggedNumber(tags, NUMBER_PREFIXES.spawnTick, currentTick);
  const territoryId = readTaggedId(tags, "ds:territory:");
  const isTamed = tags.includes("ds:tamed");
  const isOwned = tags.includes("ds:owned") || tags.some(tag => tag.startsWith("ds:owner:"));
  const injurySeverity = tags.includes("ds:injury:severe") ? "severe" :
    tags.includes("ds:injury:moderate") ? "moderate" :
    tags.includes("ds:injury:minor") ? "minor" : "none";

  const nearbyDragons = [];
  const nearbyPrey = [];
  const nearbyHostiles = [];
  for (const other of nearbyEntities) {
    if (!other || other.id === entity.id) continue;
    const distance = distanceBetween(entity.location, other.location);
    const otherTags = other.getTags?.() ?? [];
    const otherSpecies = readSpecies(otherTags);
    if (otherSpecies) {
      nearbyDragons.push({
        id: other.id,
        species: otherSpecies,
        distance,
        health: readHealthPercent(other),
        energy: clampPercent(readTaggedNumber(otherTags, NUMBER_PREFIXES.energy, 100)),
        hunger: clampPercent(readTaggedNumber(otherTags, NUMBER_PREFIXES.hunger, 100)),
        isTamed: otherTags.includes("ds:tamed"),
        isOwned: otherTags.includes("ds:owned") || otherTags.some(tag => tag.startsWith("ds:owner:")),
        knownToSelf: hasRelationshipTag(otherTags, "ds:known", entity.id),
        hostile: hasRelationshipTag(otherTags, "ds:hostile", entity.id),
        nearNest: otherTags.includes("ds:near_nest"),
        lifeStage: otherTags.includes("ds:stage:hatchling") ? "hatchling" :
          otherTags.includes("ds:stage:juvenile") ? "juvenile" : "adult",
        temporaryTerritoryMigrationDue: otherTags.includes("ds:migration_due"),
        territoryId: readTaggedId(otherTags, "ds:territory:")
      });
      continue;
    }

    if (isHostileType(other.typeId)) {
      nearbyHostiles.push({ id: other.id, typeId: other.typeId, distance });
      continue;
    }
    const foodId = preyFoodId(other.typeId);
    if (!foodId) continue;
    // Só entidades marcadas explicitamente como selvagens podem ser caçadas.
    // Isso evita atacar animais de fazendas do jogador por engano.
    const explicitlyWild = otherTags.includes("ds:wild");
    nearbyPrey.push({
      id: other.id,
      type: foodId,
      foodId,
      distance,
      isTamed: otherTags.includes("ds:tamed"),
      isOwned: otherTags.includes("ds:owned"),
      isFarmAnimal: otherTags.includes("ds:farm"),
      protectedByPlayer: !explicitlyWild || otherTags.includes("ds:protected"),
      isBaby: otherTags.includes("ds:baby")
    });
  }

  return {
    id: entity.id,
    species,
    aggression,
    territoryId,
    isTamed,
    isOwned,
    hasYoung: tags.includes("ds:has_young"),
    injury: { severity: injurySeverity },
    immediateDanger: environmentContext.immediateHazard === true || tags.includes("ds:immediate_danger"),
    energy,
    hunger,
    health,
    spawnTick,
    currentTick,
    nearbyDragons,
    nearbyPrey,
    nearbyHostiles,
    threatDetected: nearbyHostiles.length > 0 || environmentContext.hostileMobsNearby === true,
    nearbySameSpeciesCount: nearbyDragons.filter(dragon => dragon.species === species).length,
    sameSpeciesGroupNearby: nearbyDragons.some(dragon => dragon.species === species),
    environmentContext,
    environment: environmentContext.environment ?? "unknown",
    safeToExplore: environmentContext.immediateHazard !== true,
    safeToRest: environmentContext.immediateHazard !== true,
    sleepRequested: tags.includes("ds:sleep_requested"),
    playOpportunity: tags.includes("ds:play_opportunity") || environmentContext.playOpportunity === true,
    explorationOpportunity: tags.includes("ds:exploration_opportunity") || environmentContext.explorationOpportunity === true,
    quietObservationOpportunity: tags.includes("ds:quiet_observation") || environmentContext.quietObservationOpportunity === true,
    temperatureCondition: readTemperatureCondition(tags, environmentContext),
    personality: Object.fromEntries([
      ["curiosity", readTrait(tags, "curiosity")],
      ["sociability", readTrait(tags, "sociability")],
      ["independence", readTrait(tags, "independence")],
      ["playfulness", readTrait(tags, "playfulness")]
    ].filter(([, value]) => Number.isFinite(value))),
    ownerNearby: tags.includes("ds:owner_nearby"),
    windAbilityRequested: tags.includes("ds:wind_gust_requested"),
    bondLevel: readTaggedNumber(tags, "ds:bond:", 0),
    isEgg: tags.includes("ds:egg"),
    lifeStage: tags.includes("ds:stage:hatchling") ? "hatchling" :
      tags.includes("ds:stage:juvenile") ? "juvenile" :
      tags.includes("ds:stage:adult") ? "adult" : undefined
  };
}

function isHostileType(typeId = "") {
  return /minecraft:(zombie|husk|drowned|skeleton|stray|bogged|creeper|spider|cave_spider|witch|pillager|vindicator|ravager|phantom|warden|blaze|ghast|magma_cube|slime)$/.test(typeId);
}

function preyFoodId(typeId = "") {
  const id = typeId.replace(/^minecraft:/, "");
  const known = {
    salmon: "salmon", cod: "cod", tropical_fish: "tropical_fish",
    rabbit: "rabbit", chicken: "chicken", cow: "beef",
    pig: "porkchop", sheep: "mutton"
  };
  return known[id] ?? null;
}

export function actionIntentTag(action) {
  if (typeof action !== "string" || !/^[a-z0-9_]+$/.test(action)) {
    throw new TypeError("Ação inválida para registro no adaptador Bedrock.");
  }
  return `ds:action:${action}`;
}
