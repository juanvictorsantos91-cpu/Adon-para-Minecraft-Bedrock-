/**
 * Integra a sela vanilla do Minecraft à montaria Dragon Survival.
 * O sistema de domesticação existente deve marcar o dragão com ds:tamed.
 */
export const SADDLE_ITEM_ID = "minecraft:saddle";
export const MOUNTED_TAG = "ds:mounted";
export const SADDLED_TAG = "ds:saddled";

export function canUseSaddleOnDragon(entity) {
  if (!entity || typeof entity.typeId !== "string" ||
      !entity.typeId.startsWith("dragon_survival:")) return false;
  const species = entity.typeId.slice("dragon_survival:".length).replace(/_dragon$/, "");
  if (species === "lava") return false;
  const tags = typeof entity.getTags === "function" ? entity.getTags() : [];
  const adult = tags.includes("ds:stage:adult");
  const tamed = tags.includes("ds:tamed");
  const alreadyMounted = tags.includes(MOUNTED_TAG);
  return adult && tamed && !alreadyMounted;
}

function consumeHeldSaddle(player, eventItemStack) {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  const slot = player.selectedSlotIndex;
  if (!inventory || !Number.isInteger(slot)) return false;
  const stack = inventory.getItem(slot);
  if (!stack || stack.typeId !== SADDLE_ITEM_ID ||
      (eventItemStack && eventItemStack.typeId !== SADDLE_ITEM_ID)) return false;
  if (stack.amount > 1) {
    stack.amount -= 1;
    inventory.setItem(slot, stack);
  } else {
    inventory.setItem(slot, undefined);
  }
  return true;
}

/**
 * Registra a interação com a sela. A alteração de entidade/inventário é
 * adiada para system.run porque playerInteractWithEntity é um before-event.
 */
export function registerSaddleMounting(world, system) {
  const before = world.beforeEvents?.playerInteractWithEntity;
  if (!before?.subscribe) return false;
  before.subscribe(event => {
    const dragon = event.target;
    const player = event.player;
    if (event.itemStack?.typeId !== SADDLE_ITEM_ID ||
        !canUseSaddleOnDragon(dragon)) return;
    event.cancel = true;
    system.run(() => {
      try {
        if (!canUseSaddleOnDragon(dragon)) return;
        if (typeof dragon.addRider !== "function") return;
        const mounted = dragon.addRider(player);
        if (mounted === false) return;
        if (!consumeHeldSaddle(player, event.itemStack)) {
          try { dragon.removeRider(player); } catch { /* Mantém o dragão seguro. */ }
          return;
        }
        dragon.addTag(SADDLED_TAG);
        dragon.addTag(MOUNTED_TAG);
        dragon.addTag("ds:mount:player_controlled");
      } catch {
        // Dragão ou jogador pode ter sido removido antes do próximo tick.
      }
    });
  });
  return true;
}
