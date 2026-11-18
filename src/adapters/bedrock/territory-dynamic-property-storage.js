import { createTerritoryWorldStorage } from "./territory-storage.js";

const DEFAULT_CHUNK_BYTES = 7000;
const POINTER_SUFFIX = "active";
const SLOT_NAMES = ["a", "b"];

function utf8Bytes(value) {
  return new TextEncoder().encode(value).length;
}

function splitUtf8(value, maxBytes) {
  const chunks = [];
  let current = "";
  let currentBytes = 0;
  for (const character of value) {
    const size = utf8Bytes(character);
    if (size > maxBytes) throw new RangeError("Um caractere excede o limite de chunk configurado.");
    if (current && currentBytes + size > maxBytes) {
      chunks.push(current);
      current = "";
      currentBytes = 0;
    }
    current += character;
    currentBytes += size;
  }
  if (current || chunks.length === 0) chunks.push(current);
  return chunks;
}

function checksum(value) {
  let hash = 2166136261;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function slotKey(base, slot, suffix) {
  return `${base}:${slot}:${suffix}`;
}

function readSlot(world, base, slot) {
  const manifestValue = world.getDynamicProperty(slotKey(base, slot, "manifest"));
  if (typeof manifestValue !== "string") return null;
  let manifest;
  try {
    manifest = JSON.parse(manifestValue);
  } catch {
    return null;
  }
  if (!manifest || manifest.version !== 1 ||
      !Number.isInteger(manifest.chunks) || manifest.chunks < 1 ||
      !Number.isInteger(manifest.generation) || manifest.generation < 1 ||
      typeof manifest.checksum !== "string" ||
      !Number.isInteger(manifest.byteLength) || manifest.byteLength < 0) return null;

  let serialized = "";
  for (let index = 0; index < manifest.chunks; index++) {
    const part = world.getDynamicProperty(slotKey(base, slot, String(index)));
    if (typeof part !== "string") return null;
    serialized += part;
  }
  if (utf8Bytes(serialized) !== manifest.byteLength ||
      checksum(serialized) !== manifest.checksum) return null;
  return { slot, generation: manifest.generation, serialized, chunks: manifest.chunks };
}

function removeSlot(world, base, slot, count) {
  for (let index = 0; index < count; index++) {
    world.setDynamicProperty(slotKey(base, slot, String(index)), undefined);
  }
  world.setDynamicProperty(slotKey(base, slot, "manifest"), undefined);
}

/**
 * Adaptador real para propriedades dinâmicas do mundo Bedrock.
 * Usa dois slots e troca o ponteiro somente após gravar e validar o novo slot,
 * reduzindo o risco de perder o último estado válido se uma gravação falhar.
 */
export function createBedrockTerritoryWorldStorage({
  world,
  key = "ds:territory_v1",
  maxChunkBytes = DEFAULT_CHUNK_BYTES
}) {
  if (!world || typeof world.getDynamicProperty !== "function" ||
      typeof world.setDynamicProperty !== "function") {
    throw new TypeError("world precisa oferecer getDynamicProperty e setDynamicProperty.");
  }
  if (typeof key !== "string" || !/^[a-z0-9_.:-]+$/i.test(key)) {
    throw new TypeError("key precisa ser um identificador válido de propriedade dinâmica.");
  }
  if (!Number.isInteger(maxChunkBytes) || maxChunkBytes < 256 || maxChunkBytes > 24000) {
    throw new RangeError("maxChunkBytes precisa estar entre 256 e 24000.");
  }

  const storage = createTerritoryWorldStorage({
    key,
    read: () => {
      const activeValue = world.getDynamicProperty(`${key}:${POINTER_SUFFIX}`);
      const active = SLOT_NAMES.includes(activeValue) ? activeValue : null;
      const preferred = active ? readSlot(world, key, active) : null;
      if (preferred) return preferred.serialized;

      const fallback = SLOT_NAMES
        .filter(slot => slot !== active)
        .map(slot => readSlot(world, key, slot))
        .filter(Boolean)
        .sort((a, b) => b.generation - a.generation)[0];
      return fallback?.serialized ?? null;
    },
    write: () => {
      // O commit é executado abaixo; este callback existe apenas para compor
      // a interface comum e não é chamado diretamente pelo método save.
    }
  });

  return {
    load: () => storage.load(),
    save(state) {
      // Reutiliza o validador e serializador do adaptador comum.
      const serialized = storageSerializer(state);
      const activeValue = world.getDynamicProperty(`${key}:${POINTER_SUFFIX}`);
      const active = SLOT_NAMES.includes(activeValue) ? activeValue : null;
      const current = active ? readSlot(world, key, active) : null;
      const generation = Math.max(
        current?.generation ?? 0,
        ...SLOT_NAMES.map(slot => readSlot(world, key, slot)?.generation ?? 0)
      ) + 1;
      const target = active === "a" ? "b" : "a";
      const chunks = splitUtf8(serialized, maxChunkBytes);

      // Escreve o conteúdo e o manifesto antes de atualizar o ponteiro ativo.
      for (let index = 0; index < chunks.length; index++) {
        world.setDynamicProperty(slotKey(key, target, String(index)), chunks[index]);
      }
      world.setDynamicProperty(slotKey(key, target, "manifest"), JSON.stringify({
        version: 1,
        generation,
        chunks: chunks.length,
        byteLength: utf8Bytes(serialized),
        checksum: checksum(serialized)
      }));
      const verified = readSlot(world, key, target);
      if (!verified || verified.serialized !== serialized) {
        throw new Error("A verificação do novo estado territorial falhou; o estado anterior foi preservado.");
      }
      world.setDynamicProperty(`${key}:${POINTER_SUFFIX}`, target);

      // A limpeza é secundária: falhas aqui não invalidam o commit já apontado.
      if (active) {
        try {
          const previous = readSlot(world, key, active);
          removeSlot(world, key, active, previous?.chunks ?? 0);
        } catch {
          // Um slot antigo órfão pode ser limpo em uma gravação futura.
        }
      }
      return utf8Bytes(serialized);
    }
  };
}

function storageSerializer(state) {
  // O serializador comum aplica a validação de esquema e dos registros.
  const probe = new Map();
  const storage = createTerritoryWorldStorage({
    read: key => probe.get(key),
    write: (key, value) => probe.set(key, value)
  });
  storage.save(state);
  return probe.get("ds:territory_state_v1");
}
