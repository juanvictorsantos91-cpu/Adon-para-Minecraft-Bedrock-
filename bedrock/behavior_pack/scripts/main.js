import { system, world } from "@minecraft/server";
import { decideDragonBehavior } from "./core/ai/dragon-behavior.js";
import { buildDragonSnapshot, actionIntentTag } from "./core/adapters/bedrock/snapshot.js";
import { executeDragonAction } from "./core/adapters/bedrock/action-executor.js";
import { writeSocialMemory } from "./core/adapters/bedrock/social-memory-writer.js";
import { initializeDragonEntity } from "./core/adapters/bedrock/dragon-initializer.js";

const TICK_INTERVAL = 40;
const QUERY_RADIUS = 32;
const DIMENSIONS = ["overworld", "nether", "the_end"];
const pendingSocialObservations = new Map();

function isDragonEntity(entity) {
  if (!entity) return false;
  try {
    return entity.hasTag?.("ds:dragon") === true ||
      entity.typeId?.startsWith("dragon_survival:") === true;
  } catch {
    return false;
  }
}

function queueHostileSocialObservation(event) {
  const victim = event?.hurtEntity;
  const attacker = event?.damageSource?.damagingEntity;
  if (!isDragonEntity(victim) || !isDragonEntity(attacker) || victim.id === attacker.id) return;

  const observations = pendingSocialObservations.get(victim.id) ?? [];
  // Limita eventos acumulados entre ciclos e evita duplicar o mesmo agressor.
  const existing = observations.find(item => item.entityId === attacker.id);
  if (existing) existing.interaction = "hostile";
  else if (observations.length < 16) {
    observations.push({ entityId: attacker.id, interaction: "hostile" });
  }
  pendingSocialObservations.set(victim.id, observations);
}

try {
  world.afterEvents.entityHurt.subscribe(queueHostileSocialObservation);
} catch {
  // Se o evento não estiver disponível nesta versão, a memória ainda registra encontros.
}

function initializeSpawnedDragon(event) {
  const entity = event?.entity;
  if (!entity?.typeId?.startsWith("dragon_survival:")) return;
  try {
    initializeDragonEntity(entity, system.currentTick);
  } catch {
    // A inicialização será tentada novamente quando a entidade entrar no ciclo de IA.
  }
}

try {
  world.afterEvents.entitySpawn.subscribe(initializeSpawnedDragon);
} catch {
  // O primeiro ciclo de IA também inicializa dragões já existentes no mundo.
}

function inferEnvironment(dimension, location) {
  const context = { tags: [], immediateHazard: false };
  try {
    const biome = dimension.getBiome(location);
    const biomeId = typeof biome === "string" ? biome : biome?.id ?? "";
    context.biome = biomeId;
    if (location.y >= 120) context.tags.push("high_altitude", "wind");
    else if (location.y >= 90) context.tags.push("wind");
    const normalized = biomeId.toLowerCase();
    if (/ocean|river|beach/.test(normalized)) context.tags.push("water");
    if (/snow|frozen|ice|grove/.test(normalized)) context.tags.push("cold");
    if (/desert|badlands|savanna/.test(normalized)) context.tags.push("hot");
    if (/jungle|forest|taiga/.test(normalized)) context.tags.push("forest");
    if (/mountain|peak|windswept/.test(normalized)) context.tags.push("mountain");
    if (/nether|basalt|crimson|warped/.test(normalized)) context.tags.push("volcanic");
  } catch {
    context.biome = "unavailable";
  }

  try {
    const below = dimension.getBlock({
      x: Math.floor(location.x),
      y: Math.floor(location.y) - 1,
      z: Math.floor(location.z)
    });
    const blockId = below?.typeId ?? "";
    if (blockId.includes("lava")) {
      context.lavaNearby = true;
      context.immediateHazard = true;
    }
  } catch {
    // Bloco em chunk descarregado: não interrompe a atualização do dragão.
  }
  return context;
}

function publishIntent(entity, action) {
  try {
    for (const tag of entity.getTags()) {
      if (tag.startsWith("ds:action:")) entity.removeTag(tag);
    }
    entity.addTag(actionIntentTag(action));
  } catch {
    // Entidade pode ter sido removida/descarregada durante a atualização.
  }
}

function updateDimension(dimension, currentTick) {
  let dragons = [];
  try {
    // Todas as espécies Dragon Survival declaram esta família no Behavior Pack.
    // A etiqueta ds:dragon é adicionada aqui, em vez de ser exigida antes da descoberta.
    dragons = dimension.getEntities({ families: ["dragon_survival"] });
  } catch {
    return;
  }

  for (const entity of dragons) {
    try {
      initializeDragonEntity(entity, currentTick);
      const nearby = dimension.getEntities({
        location: entity.location,
        maxDistance: QUERY_RADIUS
      });
      const environmentContext = inferEnvironment(dimension, entity.location);
      const state = buildDragonSnapshot(entity, nearby, environmentContext, currentTick);
      if (!state) continue;
      state.socialObservations = pendingSocialObservations.get(entity.id) ?? [];
      pendingSocialObservations.delete(entity.id);
      const decision = decideDragonBehavior(state);
      try {
        writeSocialMemory(entity, decision.socialMemory ?? []);
      } catch {
        // Uma falha de persistência não deve impedir a ação do dragão neste ciclo.
      }
      if (state.species === "earth" && decision.migrationStatus?.due === true) {
        if (!entity.hasTag("ds:migration_due")) entity.addTag("ds:migration_due");
      } else if (entity.hasTag("ds:migration_due")) {
        entity.removeTag("ds:migration_due");
      }
      publishIntent(entity, decision.action);
      executeDragonAction(entity, decision, nearby, {
        threatDetected: state.threatDetected,
        immediateDanger: environmentContext.immediateHazard === true
      });
    } catch {
      // Uma entidade inválida não deve interromper a IA das demais.
    }
  }
}

system.runInterval(() => {
  for (const dimensionId of DIMENSIONS) {
    try {
      updateDimension(world.getDimension(dimensionId), system.currentTick);
    } catch {
      // Dimensão indisponível: será consultada no próximo ciclo.
    }
  }
}, TICK_INTERVAL);
