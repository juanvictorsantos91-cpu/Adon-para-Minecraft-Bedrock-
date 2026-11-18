import test from "node:test";
import assert from "node:assert/strict";
import {
  createTerritory, createTerritoryDomain, annexTerritoryToDomain,
  getDomainTerritoryIds
} from "../src/ai/territory-state.js";

function setup() {
  const capital = createTerritory({
    id: "fire-capital", species: "fire", ownerGroupId: "fire-kingdom",
    center: { x: 0, y: 64, z: 0 }, radius: 224, createdTick: 10
  });
  const conquered = createTerritory({
    id: "ice-north", species: "ice", ownerGroupId: "ice-clan",
    center: { x: 400, y: 70, z: 0 }, radius: 192, createdTick: 5
  });
  const domain = createTerritoryDomain({
    id: "fire-realm", ownerGroupId: "fire-kingdom",
    capitalTerritoryId: capital.id, createdTick: 10
  });
  return { capital, conquered, domain };
}

test("domínio nasce com a capital como seu primeiro território", () => {
  const { domain, capital } = setup();
  assert.deepEqual(getDomainTerritoryIds(domain), [capital.id]);
  assert.equal(domain.ownerGroupId, "fire-kingdom");
});

test("conquista anexa uma nova região sem abandonar nem apagar a região original", () => {
  const { domain, capital, conquered } = setup();
  const result = annexTerritoryToDomain(domain, conquered, {
    tick: 300, reason: "kingdom_conquest"
  });

  assert.deepEqual(getDomainTerritoryIds(result.domain), ["fire-capital", "ice-north"]);
  assert.equal(result.territory.id, "ice-north");
  assert.deepEqual(result.territory.center, conquered.center);
  assert.equal(result.territory.radius, conquered.radius);
  assert.equal(result.territory.status, "active");
  assert.equal(result.territory.ownerGroupId, "fire-kingdom");
  assert.equal(result.territory.domainId, "fire-realm");
  assert.equal(result.domain.history.at(-1).type, "territory_annexed");
  assert.equal(result.territory.history.at(-1).fromOwnerGroupId, "ice-clan");
  assert.equal(result.territory.history.at(-1).toOwnerGroupId, "fire-kingdom");
  assert.equal(capital.status, "active");
  assert.equal(capital.ownerGroupId, "fire-kingdom");
});

test("impede anexar duas vezes o mesmo território", () => {
  const { domain, conquered } = setup();
  const once = annexTerritoryToDomain(domain, conquered, { tick: 300 });
  assert.throws(() => annexTerritoryToDomain(once.domain, once.territory, {
    tick: 301
  }), /já faz parte/);
});

test("não anexa território abandonado nem aceita data anterior", () => {
  const { domain, conquered } = setup();
  const abandoned = { ...conquered, status: "abandoned" };
  assert.throws(() => annexTerritoryToDomain(domain, abandoned, {
    tick: 300
  }), /precisa estar ativo/);
  assert.throws(() => annexTerritoryToDomain(domain, conquered, {
    tick: 1
  }), /não pode retroceder/);
});
