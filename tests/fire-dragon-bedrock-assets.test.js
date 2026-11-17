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

  assert.ok(names.has("wing_left") && names.has("wing_right"));
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
test("Fire Dragon texture is a valid 128x128 PNG", async () => {
  const png = await readFile(new URL("../bedrock/resource_pack/textures/entity/dragon_fire.png", import.meta.url));
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 128);
  assert.equal(png.readUInt32BE(20), 128);
});

test("Fire Dragon client entity references its texture, render controller and animations", async () => {
  const clientEntity = await readJson("../bedrock/resource_pack/entity/dragon_fire.entity.json");
  const description = clientEntity["minecraft:client_entity"].description;
  assert.equal(description.textures.default, "textures/entity/dragon_fire");
  assert.equal(description.render_controllers[0], "controller.render.dragon_survival.fire");
  assert.ok(clientEntity["minecraft:client_entity"].animation_controllers.some((entry) => entry.fire_controller === "controller.animation.dragon_survival.fire"));
  assert.equal(Object.hasOwn(description, "animation_controllers"), false, "animation_controllers belongs beside description, not inside it");
  assert.deepEqual(description.scripts.animate, ["fire_controller"]);
  assert.equal(description.spawn_egg.texture, "dragon_survival:fire_dragon_spawn_egg");
  assert.equal(description.animations.fire_idle, "animation.dragon_survival.fire.idle");
  assert.equal(description.animations.fire_walk, "animation.dragon_survival.fire.walk");
  assert.equal(description.animations.fire_fly, "animation.dragon_survival.fire.fly");
});

test("Fire Dragon animation files and render controller are connected", async () => {
  const animationFile = await readJson("../bedrock/resource_pack/animations/dragon_fire.animation.json");
  const controllerFile = await readJson("../bedrock/resource_pack/animation_controllers/dragon_fire.animation_controllers.json");
  const renderFile = await readJson("../bedrock/resource_pack/render_controllers/dragon_fire.render_controllers.json");
  const animations = animationFile.animations;
  const states = controllerFile.animation_controllers["controller.animation.dragon_survival.fire"].states;

  assert.ok(animations["animation.dragon_survival.fire.idle"]);
  assert.ok(animations["animation.dragon_survival.fire.walk"]);
  assert.ok(animations["animation.dragon_survival.fire.fly"]);
  assert.deepEqual(states.idle.animations, ["fire_idle"]);
  assert.deepEqual(states.walk.animations, ["fire_walk"]);
  assert.deepEqual(states.fly.animations, ["fire_fly"]);
  assert.ok(renderFile.render_controllers["controller.render.dragon_survival.fire"]);
});

test("Fire Dragon has a distinct custom spawn egg texture and localized name", async () => {
  const png = await readFile(new URL("../bedrock/resource_pack/textures/items/dragon_fire_spawn_egg.png", import.meta.url));
  const itemAtlas = await readJson("../bedrock/resource_pack/textures/item_texture.json");
  const languages = await readJson("../bedrock/resource_pack/texts/languages.json");
  const pt = await readFile(new URL("../bedrock/resource_pack/texts/pt_BR.lang", import.meta.url), "utf8");
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 16);
  assert.equal(png.readUInt32BE(20), 16);
  assert.ok(itemAtlas.texture_data["dragon_survival:fire_dragon_spawn_egg"]);
  assert.ok(languages.languages.includes("pt_BR"));
  assert.match(pt, /Ovo de Invocação do Dragão de Fogo/);
});

test("Bedrock dragon discovery uses the declared dragon_survival family", async () => {
  const main = await readFile(new URL("../bedrock/behavior_pack/scripts/main.js", import.meta.url), "utf8");
  const behavior = await readJson("../bedrock/behavior_pack/entities/fire_dragon.json");
  const families = behavior["minecraft:entity"].components["minecraft:type_family"].family;
  assert.ok(families.includes("dragon_survival"));
  assert.ok(main.includes('getEntities({ families: ["dragon_survival"] })'));
  assert.ok(main.includes('entity.addTag("ds:dragon")'));
});


test("Dragon Survival 0.1.2 manifests and RP dependency are synchronized", async () => {
  const behavior = await readJson("../bedrock/behavior_pack/manifest.json");
  const resource = await readJson("../bedrock/resource_pack/manifest.json");
  assert.deepEqual(behavior.header.version, [0, 1, 2]);
  assert.deepEqual(resource.header.version, [0, 1, 2]);
  assert.deepEqual(behavior.modules.map((module) => module.version), [[0, 1, 2], [0, 1, 2]]);
  assert.deepEqual(resource.modules[0].version, [0, 1, 2]);
  assert.deepEqual(resource.dependencies[0].version, behavior.header.version);
  assert.equal(resource.dependencies[0].uuid, behavior.header.uuid);
});

test("Fire Dragon client entity keeps controller registration at valid client-entity level", async () => {
  const clientEntity = await readJson("../bedrock/resource_pack/entity/dragon_fire.entity.json");
  assert.ok(clientEntity["minecraft:client_entity"].description);
  assert.ok(Array.isArray(clientEntity["minecraft:client_entity"].animation_controllers));
  assert.equal(
    clientEntity["minecraft:client_entity"].animation_controllers[0].fire_controller,
    "controller.animation.dragon_survival.fire"
  );
  assert.deepEqual(clientEntity["minecraft:client_entity"].description.scripts.animate, ["fire_controller"]);
});
