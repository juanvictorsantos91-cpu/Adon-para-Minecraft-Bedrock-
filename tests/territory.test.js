import test from "node:test";
import assert from "node:assert/strict";
import {
  SPECIES_TERRITORY_RADII, TERRITORY_RULES, getTerritoryRadius,
  assessTerritorialSpacing, assessTerritory
} from "../src/ai/territory.js";

test("cada espécie recebe seu raio territorial inicial", () => {
  assert.deepEqual(SPECIES_TERRITORY_RADII, {
    electric: 256, water: 160, ice: 192, fire: 224, earth: 160,
    lava: 192, wind: 96, sound: 128, poison: 112, plasma: null
  });
  assert.equal(getTerritoryRadius("electric"), 256);
  assert.equal(getTerritoryRadius("plasma"), null);
  assert.equal(getTerritoryRadius("water", 180), 180);
  assert.throws(() => getTerritoryRadius("unknown"), RangeError);
});

test("indivíduos do mesmo grupo compartilham território sem serem invasores", () => {
  const self = { id: "a", species: "water", territoryId: "water-west", health: 90, energy: 80 };
  const result = assessTerritory(self, [
    { id: "b", species: "water", territoryId: "water-west", distance: 30 }
  ], { territoryId: "water-west" });
  assert.equal(result.intruderCount, 0);
  assert.equal(result.spacing.sharedTerritoryMembers, 1);
  assert.equal(result.action, "patrol_territory");
});

test("grupos independentes da mesma espécie evitam sobreposição", () => {
  const self = { id: "a", species: "fire", territoryId: "fire-a" };
  const result = assessTerritorialSpacing(self, [
    { id: "b", species: "fire", territoryId: "fire-b", distance: 100 },
    { id: "c", species: "fire", territoryId: "fire-c", distance: 200 },
    { id: "d", species: "fire", territoryId: "fire-d", distance: 600 }
  ]);
  assert.equal(result.overlapRiskCount, 1);
  assert.equal(result.preferredSpacingCount, 2);
  assert.equal(result.comfortableSpacingCount, 1);
  assert.equal(result.shouldAvoidSameSpeciesGroup, true);
  assert.equal(TERRITORY_RULES.sameSpeciesAvoidOverlap, 128);
});

test("espécies diferentes podem visitar áreas compartilhadas sem combate automático", () => {
  const self = { id: "a", species: "water", health: 90, energy: 90 };
  const result = assessTerritory(self, [
    { id: "b", species: "wind", distance: 50, hostile: false }
  ], { territoryId: "water-home" });
  assert.equal(result.territoryIntruded, true);
  assert.equal(result.spacing.crossSpeciesVisitors, 1);
  assert.equal(result.spacing.crossSpeciesConflictAutomatic, false);
  assert.equal(result.action, "challenge_territory_intruder");
});

test("Plasma não mantém território fixo nem reage como defensor territorial", () => {
  const self = { id: "p", species: "plasma", health: 100, energy: 90 };
  const result = assessTerritory(self, [{ id: "x", species: "fire", distance: 10 }]);
  assert.equal(result.isNomadic, true);
  assert.equal(result.radius, null);
  assert.equal(result.territoryIntruded, false);
  assert.equal(result.action, "remain_nomadic");
});

test("dragão debilitado observa o visitante em vez de desafiar", () => {
  const self = { id: "a", species: "ice", health: 30, energy: 20 };
  const result = assessTerritory(self, [{ id: "b", species: "fire", distance: 20 }], { territoryId: "ice-home" });
  assert.equal(result.action, "observe_intruder_from_safety");
});
