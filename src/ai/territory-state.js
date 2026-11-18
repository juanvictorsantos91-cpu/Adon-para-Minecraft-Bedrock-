/**
 * Estado lógico dos territórios. Independente da API do Minecraft Bedrock.
 * A persistência real será fornecida futuramente por um adaptador do mundo.
 */

const VALID_STATUSES = new Set(["active", "abandoned"]);

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} precisa ser um texto não vazio.`);
  }
  return value.trim();
}

function validTick(value, field = "tick") {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${field} precisa ser um inteiro não negativo.`);
  }
  return value;
}

function copyCenter(center) {
  if (!center || ![center.x, center.y, center.z].every(Number.isFinite)) {
    throw new TypeError("center precisa conter coordenadas x, y e z válidas.");
  }
  return { x: center.x, y: center.y, z: center.z };
}

export function createTerritory({
  id, species, ownerGroupId, center, radius, createdTick,
  temporary = false, expiresTick = null
}) {
  const territory = {
    id: requiredText(id, "id"),
    species: requiredText(species, "species"),
    ownerGroupId: requiredText(ownerGroupId, "ownerGroupId"),
    center: copyCenter(center),
    radius,
    createdTick: validTick(createdTick, "createdTick"),
    updatedTick: createdTick,
    temporary: temporary === true,
    expiresTick,
    status: "active",
    revision: 1,
    history: [{ type: "created", tick: createdTick, ownerGroupId }]
  };
  if (!Number.isFinite(radius) || radius <= 0) {
    throw new RangeError("radius precisa ser um número positivo.");
  }
  if (expiresTick !== null && (!Number.isInteger(expiresTick) || expiresTick < createdTick)) {
    throw new RangeError("expiresTick precisa ser null ou maior/igual a createdTick.");
  }
  return territory;
}

function assertActive(territory) {
  if (!territory || territory.status !== "active") {
    throw new Error("O território precisa estar ativo para essa operação.");
  }
}

export function transferTerritory(territory, {
  newOwnerGroupId, tick, reason = "conquest"
}) {
  assertActive(territory);
  const owner = requiredText(newOwnerGroupId, "newOwnerGroupId");
  validTick(tick);
  if (tick < territory.updatedTick) throw new RangeError("tick não pode retroceder.");
  if (owner === territory.ownerGroupId) throw new Error("O novo proprietário já é o proprietário atual.");
  const event = { type: "transferred", tick, from: territory.ownerGroupId, to: owner, reason };
  return {
    ...territory,
    ownerGroupId: owner,
    updatedTick: tick,
    revision: territory.revision + 1,
    history: [...territory.history, event]
  };
}

export function abandonTerritory(territory, { tick, reason = "abandoned" }) {
  assertActive(territory);
  validTick(tick);
  if (tick < territory.updatedTick) throw new RangeError("tick não pode retroceder.");
  return {
    ...territory,
    status: "abandoned",
    updatedTick: tick,
    revision: territory.revision + 1,
    history: [...territory.history, { type: "abandoned", tick, ownerGroupId: territory.ownerGroupId, reason }]
  };
}

/**
 * Move um território temporário sem trocar seu identificador ou proprietário.
 * Adequado à migração periódica do Dragão de Terra.
 */
export function relocateTemporaryTerritory(territory, { center, tick, expiresTick = null }) {
  assertActive(territory);
  if (territory.temporary !== true) {
    throw new Error("Somente territórios temporários podem ser relocados.");
  }
  validTick(tick);
  if (tick < territory.updatedTick) throw new RangeError("tick não pode retroceder.");
  if (expiresTick !== null && (!Number.isInteger(expiresTick) || expiresTick < tick)) {
    throw new RangeError("expiresTick precisa ser null ou maior/igual ao tick atual.");
  }
  const nextCenter = copyCenter(center);
  return {
    ...territory,
    center: nextCenter,
    expiresTick,
    updatedTick: tick,
    revision: territory.revision + 1,
    history: [...territory.history, {
      type: "relocated", tick, center: nextCenter, ownerGroupId: territory.ownerGroupId
    }]
  };
}

/** Repositório em memória para testes e simulações; não grava no mundo Bedrock. */
export class InMemoryTerritoryRepository {
  #territories = new Map();

  get(id) {
    const territory = this.#territories.get(id);
    return territory ? structuredClone(territory) : null;
  }

  save(territory) {
    if (!territory || typeof territory.id !== "string" || !VALID_STATUSES.has(territory.status)) {
      throw new TypeError("Registro de território inválido.");
    }
    const current = this.#territories.get(territory.id);
    if (current && territory.revision < current.revision) {
      throw new Error("Não é possível sobrescrever uma revisão mais recente.");
    }
    this.#territories.set(territory.id, structuredClone(territory));
    return this.get(territory.id);
  }

  list({ status } = {}) {
    return [...this.#territories.values()]
      .filter(item => status === undefined || item.status === status)
      .map(item => structuredClone(item));
  }

  delete(id) {
    return this.#territories.delete(id);
  }
}


/**
 * Cria um domínio territorial (reino) composto por territórios independentes.
 * O território-capital continua sendo um território normal do domínio.
 */
export function createTerritoryDomain({ id, ownerGroupId, capitalTerritoryId, createdTick }) {
  const domainId = requiredText(id, "id");
  const owner = requiredText(ownerGroupId, "ownerGroupId");
  const capitalId = requiredText(capitalTerritoryId, "capitalTerritoryId");
  validTick(createdTick, "createdTick");
  return {
    id: domainId,
    ownerGroupId: owner,
    capitalTerritoryId: capitalId,
    territoryIds: [capitalId],
    createdTick,
    updatedTick: createdTick,
    revision: 1,
    history: [{ type: "domain_created", tick: createdTick, capitalTerritoryId: capitalId }]
  };
}

/**
 * Anexa um território conquistado ao domínio sem apagar nem abandonar
 * o território de origem. Preserva ID, centro e raio da região anexada.
 */
export function annexTerritoryToDomain(domain, territory, { tick, reason = "conquest" }) {
  if (!domain || !Array.isArray(domain.territoryIds)) {
    throw new TypeError("Domínio territorial inválido.");
  }
  assertActive(territory);
  validTick(tick);
  if (tick < domain.updatedTick || tick < territory.updatedTick) {
    throw new RangeError("tick não pode retroceder.");
  }
  if (domain.territoryIds.includes(territory.id)) {
    throw new Error("Este território já faz parte do domínio.");
  }
  if (territory.id === domain.capitalTerritoryId) {
    throw new Error("A capital não pode ser anexada novamente.");
  }

  const previousOwnerGroupId = territory.ownerGroupId;
  const annexedTerritory = {
    ...territory,
    ownerGroupId: domain.ownerGroupId,
    domainId: domain.id,
    updatedTick: tick,
    revision: territory.revision + 1,
    history: [...territory.history, {
      type: "annexed_to_domain",
      tick,
      fromOwnerGroupId: previousOwnerGroupId,
      toOwnerGroupId: domain.ownerGroupId,
      domainId: domain.id,
      reason
    }]
  };
  const nextDomain = {
    ...domain,
    territoryIds: [...domain.territoryIds, territory.id],
    updatedTick: tick,
    revision: domain.revision + 1,
    history: [...domain.history, {
      type: "territory_annexed",
      tick,
      territoryId: territory.id,
      previousOwnerGroupId,
      domainId: domain.id,
      reason
    }]
  };
  return { domain: nextDomain, territory: annexedTerritory };
}

/** Retorna cópia da lista de regiões que compõem o domínio. */
export function getDomainTerritoryIds(domain) {
  if (!domain || !Array.isArray(domain.territoryIds)) {
    throw new TypeError("Domínio territorial inválido.");
  }
  return [...domain.territoryIds];
}
