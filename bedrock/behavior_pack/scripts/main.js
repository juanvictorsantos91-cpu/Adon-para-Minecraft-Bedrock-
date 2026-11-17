import { system, world } from "@minecraft/server";
import { decideDragonBehavior } from "./core/ai/dragon-behavior.js";
import { buildDragonSnapshot, actionIntentTag } from "./core/adapters/bedrock/snapshot.js";\nimport { executeDragonAction } from "./core/adapters/bedrock/action-executor.js";

const TICK_INTERVAL = 40;
const QUERY_RADIUS = 32;
const DIMENSIONS = ["overworld", "nether", "the_end"];

function inferEnvironment(dimension, location) {
  const context = { tags: [], immediateHazard: false };
  try {
    const biome = dimension.getBiome(location);
    const biomeId = typeof biome === "string" ? biome : biome?.id ?? "";
    context.biome = biomeId;\n    if (location.y >= 120) context.tags.push("high_altitude", "wind");\n    else if (location.y >= 90) context.tags.push("wind");
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
    dragons = dimension.getEntities({ tags: ["ds:dragon"] });
  } catch {
    return;
  }

  for (const entity of dragons) {
    try {
      const nearby = dimension.getEntities({
        location: entity.location,
        maxDistance: QUERY_RADIUS
      });
      const environmentContext = inferEnvironment(dimension, entity.location);
      const state = buildDragonSnapshot(entity, nearby, environmentContext, currentTick);
      if (!state) continue;
      const decision = decideDragonBehavior(state);
      publishIntent(entity, decision.action);
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
