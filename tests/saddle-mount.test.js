import test from "node:test";
import assert from "node:assert/strict";
import { canUseSaddleOnDragon, SADDLED_TAG, MOUNTED_TAG } from "../src/adapters/bedrock/saddle-mount.js";

function dragon(species = "fire", tags = ["ds:stage:adult", "ds:tamed"]) {
  return { typeId: `dragon_survival:${species}_dragon`, getTags: () => tags };
}

test("sela aceita dragão adulto e domesticado", () => {
  assert.equal(canUseSaddleOnDragon(dragon()), true);
});
test("sela rejeita filhote ou dragão não domesticado", () => {
  assert.equal(canUseSaddleOnDragon(dragon("fire", ["ds:stage:juvenile", "ds:tamed"])), false);
  assert.equal(canUseSaddleOnDragon(dragon("fire", ["ds:stage:adult"])), false);
});
test("Dragão de Lava nunca aceita sela", () => {
  assert.equal(canUseSaddleOnDragon(dragon("lava")), false);
});
test("não permite equipar novamente enquanto montado", () => {
  assert.equal(canUseSaddleOnDragon(dragon("fire", ["ds:stage:adult", "ds:tamed", MOUNTED_TAG, SADDLED_TAG])), false);
});
test("rejeita entidades que não são dragões Dragon Survival", () => {
  assert.equal(canUseSaddleOnDragon({ typeId: "minecraft:horse", getTags: () => [] }), false);
});
