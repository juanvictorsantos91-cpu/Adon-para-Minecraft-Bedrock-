const SCHEMA_VERSION = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateRecordArray(value, label, key = "id") {
  if (!Array.isArray(value)) throw new TypeError(`${label} precisa ser uma lista.`);
  const seen = new Set();
  for (const item of value) {
    if (!item || typeof item[key] !== "string" || item[key].trim() === "") {
      throw new TypeError(`Cada registro de ${label} precisa ter ${key} válido.`);
    }
    if (seen.has(item[key])) throw new Error(`Identificador duplicado em ${label}: ${item[key]}.`);
    seen.add(item[key]);
  }
}

/**
 * Serializa o estado lógico para armazenamento durável fornecido pelo host.
 * O host pode mapear read/write para propriedades dinâmicas ou outro backend.
 */
export function serializeTerritoryWorldState({
  savedTick,
  territories = [],
  domains = []
}) {
  if (!Number.isInteger(savedTick) || savedTick < 0) {
    throw new RangeError("savedTick precisa ser um inteiro não negativo.");
  }
  validateRecordArray(territories, "territórios");
  validateRecordArray(domains, "domínios");
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    savedTick,
    territories: clone(territories),
    domains: clone(domains)
  };
  return JSON.stringify(payload);
}

export function deserializeTerritoryWorldState(serialized) {
  if (typeof serialized !== "string" || serialized.length === 0) {
    throw new TypeError("Estado territorial serializado precisa ser um texto não vazio.");
  }
  let payload;
  try {
    payload = JSON.parse(serialized);
  } catch {
    throw new Error("Estado territorial contém JSON inválido.");
  }
  if (payload?.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Versão de estado territorial não suportada: ${payload?.schemaVersion}.`);
  }
  if (!Number.isInteger(payload.savedTick) || payload.savedTick < 0) {
    throw new Error("savedTick inválido no estado territorial.");
  }
  validateRecordArray(payload.territories, "territórios");
  validateRecordArray(payload.domains, "domínios");
  return clone(payload);
}

/**
 * Adaptador de armazenamento por callbacks, sem assumir uma API específica
 * do Bedrock ou um limite de tamanho de propriedade dinâmica.
 */
export function createTerritoryWorldStorage({ read, write, key = "ds:territory_state_v1" }) {
  if (typeof read !== "function" || typeof write !== "function") {
    throw new TypeError("As funções read e write são obrigatórias.");
  }
  return {
    load() {
      const serialized = read(key);
      return serialized == null ? null : deserializeTerritoryWorldState(serialized);
    },
    save(state) {
      const serialized = serializeTerritoryWorldState(state);
      write(key, serialized);
      return serialized.length;
    }
  };
}

export const TERRITORY_STORAGE_SCHEMA_VERSION = SCHEMA_VERSION;
