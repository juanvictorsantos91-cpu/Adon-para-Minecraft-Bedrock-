import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readJson = async (relativePath) =>
  JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"));

test("Fire Dragon Bedrock manifests and entity identifiers are linked", async () => {
  const behaviorManifest = await readJson("../bedrock/behavior_pack/manifest.json");
  const resourceManifest = await readJson("../bedrock/resource_pack/manifest.json");
  const behaviorEntity = await readJson("../bedrock/behavior_pack/entities/fire_dragon.json");
  const clientEntity = await readJson("../bedrock/resource_pack/entity/dragon_fire.entity.json");

  assert.equal(
    resourceManifest.dependencies[0].uuid,
    behaviorManifest.header.uuid,
    "Resource Pack must depend on the existing Behavior Pack"
  );
  assert.equal(
    behaviorEntity["minecraft:entity"].description.identifier,
    "dragon_survival:fire_dragon"
  );
  assert.equal(
    clientEntity["minecraft:client_entity"].description.identifier,
    "dragon_survival:fire_dragon"
  );
});

test("Fire Dragon geometry contains the approved basic anatomy", async () => {
  const geometryFile = await readJson("../bedrock/resource_pack/models/entity/dragon_fire.geo.json");
  const geometry = geometryFile["minecraft:geometry"][0];
  const bones = geometry.description && geometry.bones;

  assert.equal(geometry.description.identifier, "geometry.dragon_survival.fire");
  assert.ok(Array.isArray(bones) && bones.length > 0);

  const names = new Set(bones.map((bone) => bone.name));
  for (const required of [
    "root", "body", "head", "jaw", "wing_left", "wing_right",
    "front_leg_left", "front_leg_right", "rear_leg_left", "rear_leg_right",
    "tail_base", "tail_mid", "tail_tip"
  ]) {
    assert.ok(names.has(required), `Missing required bone: ${required}`);
  }

  assert.equal([...names].filter((name) => name.startsWith("wing_")).length, 2);
  assert.equal([...names].filter((name) => name.includes("_leg_")).length, 4);

  for (const bone of bones) {
    for (const cube of bone.cubes ?? []) {
      assert.equal(cube.origin.length, 3, `Invalid origin in bone ${bone.name}`);
      assert.equal(cube.size.length, 3, `Invalid size in bone ${bone.name}`);
      assert.ok(cube.size.every((value) => value > 0), `Non-positive cube size in bone ${bone.name}`);
      assert.equal(cube.uv.length, 2, `Invalid UV in bone ${bone.name}`);
    }
  }
});