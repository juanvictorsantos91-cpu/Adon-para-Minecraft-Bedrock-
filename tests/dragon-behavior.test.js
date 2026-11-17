import test from "node:test";
import assert from "node:assert/strict";
import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";
import { behaviorProfiles, getBehaviorProfile } from "../src/species/behavior-profiles.js";
import { getSocialGroupPlan } from "../src/ai/social-groups.js";

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

test("padrões sociais naturais são diferentes por espécie", () => {
  assert.equal(getBehaviorProfile("water").socialPattern, "small_groups");
  assert.equal(getBehaviorProfile("fire").socialPattern, "pairs");
  assert.equal(getBehaviorProfile("ice").socialPattern, "pairs");
  assert.equal(getBehaviorProfile("electric").socialPattern, "solitary");
  assert.equal(getBehaviorProfile("earth").socialPattern, "large_groups");
  assert.equal(getBehaviorProfile("lava").socialPattern, "large_groups");
  assert.equal(getBehaviorProfile("electric").migrationPattern, "long_cycle");
});

test("água, fogo, gelo, terra e lava procuram seus grupos naturais", () => {
  const cases = [
    ["water", "travel_in_small_group"],
    ["fire", "travel_in_pair"],
    ["ice", "travel_in_pair"],
    ["earth", "travel_in_large_group"],
    ["lava", "travel_in_large_group"]
  ];
  for (const [species, expected] of cases) {
    const result = decideDragonBehavior(healthy(species, {
      nearbySameSpeciesCount: 2, safeToExplore: true
    }));
    assert.equal(result.action, expected);
  }
});

test("dragões elétricos permanecem solitários e migram em ciclos longos seguros", () => {
  const alone = decideDragonBehavior(healthy("electric", {
    nearbySameSpeciesCount: 3, sameSpeciesGroupNearby: true
  }));
  assert.notEqual(alone.action, "travel_in_large_group");
  assert.notEqual(alone.action, "travel_in_small_group");
  const migrate = decideDragonBehavior(healthy("electric", {
    migrationDue: true, migrationRouteSafe: true
  }));
  assert.equal(migrate.action, "begin_long_migration");
  const unsafe = decideDragonBehavior(healthy("electric", {
    migrationDue: true, migrationRouteSafe: false
  }));
  assert.notEqual(unsafe.action, "begin_long_migration");
});


test("planejador social respeita o tamanho preferido de cada espécie", () => {
  const cases = [
    ["water", 3, 1, "seek_group_members"],
    ["fire", 2, 1, "seek_group_members"],
    ["ice", 2, 1, "seek_group_members"],
    ["earth", 6, 2, "travel_with_species_group"],
    ["lava", 6, 5, "travel_with_species_group"]
  ];

  for (const [species, target, nearby, action] of cases) {
    const plan = getSocialGroupPlan(species, nearby);
    assert.equal(plan.targetGroupSize, target);
    assert.equal(plan.observedGroupSize, nearby + 1);
    assert.equal(plan.action, action);
  }
});

test("o elétrico mantém padrão solitário mesmo com outros dragões próximos", () => {
  const plan = getSocialGroupPlan("electric", 5);
  assert.equal(plan.targetGroupSize, 1);
  assert.equal(plan.action, "remain_solo");
  assert.equal(plan.seekingMembers, false);
});

test("o plano social é incluído nas decisões DBS e não substitui o MIS", () => {
  const normal = decideDragonBehavior(healthy("water", {
    nearbySameSpeciesCount: 1
  }));
  assert.equal(normal.groupPlan.targetGroupSize, 3);
  assert.equal(normal.groupPlan.action, "travel_with_species_group");

  const critical = decideDragonBehavior(healthy("water", {
    energy: 10, immediateDanger: true, nearbySameSpeciesCount: 2
  }));
  assert.equal(critical.system, "MIS");
  assert.equal(critical.groupPlan, undefined);
});

test("o planejador rejeita quantidades inválidas de indivíduos próximos", () => {
  assert.throws(() => getSocialGroupPlan("water", -1), RangeError);
  assert.throws(() => getSocialGroupPlan("water", 1.5), RangeError);
});
