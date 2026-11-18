import test from "node:test";
import assert from "node:assert/strict";
import { assessNaturalBehavior } from "../src/ai/natural-behavior.js";
import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";

const profile = { curiosity: 0.8, playfulness: 0.6 };
const safe = {
  health: 100, energy: 80, hunger: 80, safeToRest: true,
  safeToExplore: true, threatDetected: false
};

test("prioriza segurança e necessidades críticas sobre hábitos", () => {
  const result = assessNaturalBehavior({
    ...safe, groomingNeeded: true, threatDetected: true
  }, profile);
  assert.equal(result.eligible, false);
  assert.equal(result.action, null);
  assert.equal(result.reason, "survival_or_safety_priority");
});

test("responde ao ciclo de sono apenas em local seguro", () => {
  const result = assessNaturalBehavior({ ...safe, sleepRequested: true }, profile);
  assert.equal(result.action, "sleep_in_safe_shelter");
});

test("autocuidado considera temperatura e higiene", () => {
  assert.equal(assessNaturalBehavior({
    ...safe, temperatureStress: "too_hot"
  }, profile).action, "seek_shade_or_cool_area");
  assert.equal(assessNaturalBehavior({
    ...safe, groomingNeeded: true
  }, profile).action, "groom_scales");
});

test("filhotes podem brincar quando estão seguros e com energia", () => {
  const result = assessNaturalBehavior({
    ...safe, lifeStage: "juvenile", playOpportunity: true
  }, profile);
  assert.equal(result.action, "play_and_practice_movement");
});

test("adultos não usam a regra de brincadeira juvenil", () => {
  const result = assessNaturalBehavior({
    ...safe, lifeStage: "adult", playOpportunity: true
  }, profile);
  assert.notEqual(result.action, "play_and_practice_movement");
});

test("curiosidade individual pode favorecer exploração segura", () => {
  const result = assessNaturalBehavior({
    ...safe, explorationOpportunity: true,
    personality: { curiosity: 0.95 }
  }, { curiosity: 0.2 });
  assert.equal(result.action, "investigate_surroundings");
});

test("não explora quando energia ou fome estão baixas", () => {
  const result = assessNaturalBehavior({
    ...safe, energy: 20, explorationOpportunity: true
  }, profile);
  assert.notEqual(result.action, "investigate_surroundings");
});

test("autocuidado respeita diferenças naturais entre espécies", () => {
  const fire = assessNaturalBehavior({
    ...safe, species: "fire", groomingNeeded: true
  }, profile);
  const water = assessNaturalBehavior({
    ...safe, species: "water", groomingNeeded: true
  }, profile);
  const ice = assessNaturalBehavior({
    ...safe, species: "ice", bathingOpportunity: true
  }, profile);
  assert.equal(fire.action, "shake_ash_from_scales");
  assert.equal(water.action, "clean_scales_in_water");
  assert.equal(ice.action, "roll_in_snow");
});

test("sociabilidade e independência influenciam escolhas cotidianas", () => {
  const social = assessNaturalBehavior({
    ...safe, socialOpportunity: true, knownDragonNearby: true,
    personality: { sociability: 0.9 }
  }, { sociability: 0.2 });
  const independent = assessNaturalBehavior({
    ...safe, soloExplorationOpportunity: true,
    personality: { independence: 0.95 }
  }, { independence: 0.2 });
  assert.equal(social.action, "approach_known_dragon_peacefully");
  assert.equal(independent.action, "explore_independently_nearby");
});

test("MIS integra rotina natural na escolha final de comportamento", () => {
  const result = decideDragonBehavior({
    species: "fire", health: 100, energy: 80, hunger: 80,
    safeToRest: true, safeToExplore: true, sleepRequested: true,
    threatDetected: false, immediateDanger: false,
    nearbyDragons: [], nearbyPrey: []
  });
  assert.equal(result.action, "sleep_in_safe_shelter");
  assert.equal(result.naturalBehavior.category, "rest");
});

test("coragem individual alta favorece aviso firme sem iniciar ataque", () => {
  const result = decideDragonBehavior({
    species: "water", health: 90, energy: 80, hunger: 80,
    safeToRest: true, safeToExplore: true,
    threatDetected: true, immediateDanger: false,
    personality: { courage: 0.95 },
    nearbyDragons: [], nearbyPrey: []
  });
  assert.equal(result.action, "stand_ground_and_warn");
});
