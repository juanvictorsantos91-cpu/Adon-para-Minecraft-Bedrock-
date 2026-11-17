import test from "node:test";
import assert from "node:assert/strict";
import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";
import { behaviorProfiles, getBehaviorProfile } from "../src/species/behavior-profiles.js";

const healthy = (species, extra = {}) => ({
  species, energy: 90, hunger: 90, health: 100,
  immediateDanger: false, safeToExplore: true, ...extra
});

test("as seis espécies possuem personalidades próprias", () => {
  assert.deepEqual(Object.keys(behaviorProfiles).sort(), [
    "earth", "electric", "fire", "ice", "lava", "water"
  ]);
  for (const profile of Object.values(behaviorProfiles)) {
    for (const trait of ["aggression", "caution", "curiosity", "protectiveness", "sociability", "independence"]) {
      assert.ok(profile[trait] >= 0 && profile[trait] <= 1);
    }
    assert.ok(profile.preferredActivities.length > 0);
  }
});

test("o MIS mantém prioridade sobre comportamentos de rotina", () => {
  const result = decideDragonBehavior(healthy("fire", {
    energy: 10, hunger: 90, health: 100, immediateDanger: true
  }));
  assert.equal(result.system, "MIS");
  assert.equal(result.action, "escape_danger");
});

test("cada espécie escolhe comportamento associado ao seu ambiente", () => {
  const cases = [
    ["electric", "mountain", "scan_high_ground"],
    ["water", "water", "swim_patrol"],
    ["ice", "snow", "observe_quietly"],
    ["fire", "hot", "patrol_territory"],
    ["earth", "forest", "dig_explore"],
    ["lava", "volcanic", "patrol_hot_ground"]
  ];
  for (const [species, environment, expected] of cases) {
    const result = decideDragonBehavior(healthy(species, { environment }));
    assert.equal(result.action, expected);
    assert.equal(result.system, "DBS");
  }
});

test("dragão protege filhotes e ninho antes de atividades naturais", () => {
  assert.equal(decideDragonBehavior(healthy("earth", {
    hasYoung: true, youngInDanger: true, nestThreatened: true
  })).action, "protect_young");
  assert.equal(decideDragonBehavior(healthy("water", {
    nestThreatened: true
  })).action, "guard_nest");
});

test("personalidade e condição física influenciam resposta a ameaças", () => {
  assert.equal(decideDragonBehavior(healthy("fire", {
    threatDetected: true
  })).action, "confront_threat");
  assert.equal(decideDragonBehavior(healthy("water", {
    threatDetected: true
  })).action, "keep_distance_and_observe");
  assert.equal(decideDragonBehavior(healthy("fire", {
    threatDetected: true, health: 30
  })).action, "retreat_to_safety");
});

test("vínculo permite proteger e acompanhar o dono", () => {
  assert.equal(decideDragonBehavior(healthy("electric", {
    ownerInDanger: true, bondLevel: 2
  })).action, "defend_owner");
  assert.equal(decideDragonBehavior(healthy("ice", {
    ownerNearby: true, bondLevel: 3
  })).action, "stay_near_owner");
});

test("comandos reconhecidos do treinamento são executados", () => {
  assert.equal(decideDragonBehavior(healthy("earth", {
    trainingCommand: "return_nest"
  })).action, "return_to_nest");
  assert.equal(decideDragonBehavior(healthy("lava", {
    trainingCommand: "stay"
  })).action, "stay_in_place");
});

test("descanso seguro, socialização e exploração são considerados", () => {
  assert.equal(decideDragonBehavior(healthy("earth", {
    energy: 50, safeToRest: true
  })).action, "rest_in_preferred_habitat");
  assert.equal(decideDragonBehavior(healthy("water", {
    compatibleDragonNearby: true, socialOpportunity: true
  })).action, "socialize_with_dragon");
  assert.equal(decideDragonBehavior(healthy("electric", {
    environment: "plains", safeToExplore: true
  })).action, "explore_environment");
});

test("espécie desconhecida é rejeitada", () => {
  assert.throws(() => getBehaviorProfile("unknown"), RangeError);
});
