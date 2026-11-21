import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dragonBalance } from "../src/species/balance.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const species = Object.keys(dragonBalance);
const readJson = async (relative) => JSON.parse(await readFile(path.join(root, relative), "utf8"));
const exists = async (relative) => readFile(path.join(root, relative));
const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}
function checkUv(uv, textureWidth, textureHeight, context) {
  if (Array.isArray(uv)) {
    check(uv.length >= 2 && uv[0] >= 0 && uv[1] >= 0 &&
      uv[0] <= textureWidth && uv[1] <= textureHeight, context + ": UV simples fora da textura");
    return;
  }
  check(uv && typeof uv === "object", context + ": UV ausente ou inválido");
  for (const [face, data] of Object.entries(uv ?? {})) {
    const [u, v] = data.uv ?? [];
    const [w, h] = data.uv_size ?? [];
    check([u, v, w, h].every(Number.isFinite) && u >= 0 && v >= 0 &&
      w >= 0 && h >= 0 && u + w <= textureWidth && v + h <= textureHeight,
      context + ": UV da face " + face + " fora da textura");
  }
}
function pngDimensions(buffer) {
  check(buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    "Textura não possui assinatura PNG válida");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

for (const id of species) {
  const prefix = "bedrock/resource_pack/";
  const geometryPath = prefix + "models/entity/dragon_" + id + ".geo.json";
  const animationPath = prefix + "animations/dragon_" + id + ".animation.json";
  const clientPath = prefix + "entity/dragon_" + id + ".entity.json";
  const controllerPath = prefix + "animation_controllers/dragon_" + id + ".animation_controllers.json";
  const renderPath = prefix + "render_controllers/dragon_" + id + ".render_controllers.json";
  const texturePath = prefix + "textures/entity/dragon_" + id + ".png";
  const bpPath = "bedrock/behavior_pack/entities/" + id + "_dragon.json";

  try {
    const geometryFile = await readJson(geometryPath);
    const geometry = geometryFile["minecraft:geometry"]?.[0];
    check(!!geometry, id + ": minecraft:geometry ausente");
    if (!geometry) continue;

    const bones = geometry.bones ?? [];
    const names = new Set(bones.map((bone) => bone.name));
    check(names.size === bones.length, id + ": nomes de ossos duplicados");
    for (const bone of bones) {
      if (bone.parent) check(names.has(bone.parent), id + ": pai inexistente em " + bone.name);
      for (const [index, cube] of (bone.cubes ?? []).entries()) {
        check(cube.origin?.length === 3 && cube.size?.length === 3 &&
          [...cube.origin, ...cube.size].every(Number.isFinite) &&
          cube.size.every((value) => value > 0),
          id + ": cubo inválido em " + bone.name + " #" + index);
        checkUv(cube.uv, geometry.description.texture_width, geometry.description.texture_height,
          id + "/" + bone.name + "/" + index);
      }
    }

    const animationFile = await readJson(animationPath);
    for (const [animationId, animation] of Object.entries(animationFile.animations ?? {})) {
      for (const boneName of Object.keys(animation.bones ?? {})) {
        check(names.has(boneName), id + ": animação " + animationId + " referencia osso inexistente " + boneName);
      }
    }

    const client = (await readJson(clientPath))["minecraft:client_entity"]?.description;
    const bp = (await readJson(bpPath))["minecraft:entity"]?.description;
    check(client?.identifier === bp?.identifier, id + ": identificadores BP/RP divergentes");
    check(client?.geometry?.default === geometry.description.identifier,
      id + ": identificador de geometria não corresponde ao client entity");

    await readJson(controllerPath);
    await readJson(renderPath);
    const texture = await exists(texturePath);
    const dimensions = pngDimensions(texture);
    check(dimensions.width === geometry.description.texture_width &&
      dimensions.height === geometry.description.texture_height,
      id + ": dimensões PNG não correspondem à geometria");

    const bone = (name) => names.has(name);
    if (id === "poison") {
      check(bone("front_leg_left") && bone("front_leg_right"),
        "Veneno: deve preservar as duas patas dianteiras");
      check(!bone("rear_leg_left") && !bone("rear_leg_right"),
        "Veneno: não deve possuir patas traseiras");
    } else {
      check(bone("front_leg_left") && bone("front_leg_right") &&
        bone("rear_leg_left") && bone("rear_leg_right"),
        id + ": anatomia quadrúpede incompleta");
    }
    if (id === "wind") {
      for (const name of [
        "wing_left", "wing_right", "wing_rear_left", "wing_rear_right",
        "wing_tip_rear_left", "wing_tip_rear_right",
        "wing_membrane_rear_left", "wing_membrane_rear_right"
      ]) check(bone(name), "Vento: osso obrigatório ausente " + name);
      const animated = new Set(Object.values(animationFile.animations ?? {})
        .flatMap((animation) => Object.keys(animation.bones ?? {})));
      check(animated.has("wing_rear_left") && animated.has("wing_rear_right") &&
        animated.has("wing_tip_rear_left") && animated.has("wing_tip_rear_right"),
        "Vento: segundo par de asas não está totalmente referenciado nas animações");
    }
  } catch (error) {
    errors.push(id + ": falha ao validar arquivos: " + error.message);
  }
}

if (errors.length) {
  console.error("Validação dos recursos Dragon Survival falhou:");
  for (const error of errors) console.error("- " + error);
  process.exitCode = 1;
} else {
  console.log("Validação estrutural aprovada para " + species.length + " espécies.");
}
