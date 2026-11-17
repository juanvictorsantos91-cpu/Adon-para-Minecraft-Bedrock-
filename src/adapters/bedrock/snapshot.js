const SPECIES_PREFIX = "ds:species:";
const NUMBER_PREFIXES = Object.freeze({
  energy: "ds:energy:",
  hunger: "ds:hunger:",
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

  const healthComponent = entity.getComponent?.("minecraft:health");
  const health = Number.isFinite(healthComponent?.currentValue)
    ? healthComponent.currentValue
    : 100;
  const energy = readTaggedNumber(tags, NUMBER_PREFIXES.energy, 100);
  const hunger = readTaggedNumber(tags, NUMBER_PREFIXES.hunger, 100);
  const spawnTick = readTaggedNumber(tags, NUMBER_PREFIXES.spawnTick, currentTick);

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
        health: Number(other.getComponent?.("minecraft:health")?.currentValue ?? 100),
        energy: readTaggedNumber(otherTags, NUMBER_PREFIXES.energy, 100),
        lifeStage: otherTags.includes("ds:stage:hatchling") ? "hatchling" :
          otherTags.includes("ds:stage:juvenile") ? "juvenile" : "adult",
        temporaryTerritoryMigrationDue: otherTags.includes("ds:migration_due")
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
    threatDetected: environmentContext.hostileMobsNearby === true,
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
