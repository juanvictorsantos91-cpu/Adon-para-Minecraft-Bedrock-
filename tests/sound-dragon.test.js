import test from "node:test";
import assert from "node:assert/strict";
import { speciesProfiles, getSpeciesProfile } from "../src/species/profiles/index.js";
import { behaviorProfiles, getBehaviorProfile } from "../src/species/behavior-profiles.js";
import { getSpeciesDiet, canEat } from "../src/species/diets/species-diets.js";
import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";

const healthySoundDragon = extra => ({
  species: "sound", energy: 90, hunger: 90, health: 100,
  immediateDanger: false, safeToExplore: true, ...extra
});

test("Dragão de Som possui metabolismo, dieta e personalidade próprios", () => {
  const profile = getSpeciesProfile("sound");
  assert.equal(profile.species, "sound");
  assert.ok(profile.activityCosts.echoPulse > 0);
  assert.ok(profile.activityCosts.sonicImpact > profile.activityCosts.echoPulse);
  assert.equal(getBehaviorProfile("sound").soundSensing, true);
  assert.equal(getSpeciesDiet("sound").preferred.includes("salmon"), true);
  assert.equal(canEat("sound", "rabbit"), true);
});

test("Dragão de Som usa ecos para mapear o ambiente", () => {
  const result = decideDragonBehavior(healthySoundDragon({
    soundScanRequested: true
  }));
  assert.equal(result.action, "perform_echo_localization");
});

test("Dragão de Som rastreia vibrações quando detecta movimento", () => {
  const result = decideDragonBehavior(healthySoundDragon({
    vibrationDetected: true
  }));
  assert.equal(result.action, "track_target_by_vibration");
});

test("onda sonora exige ameaça e energia suficiente", () => {
  const ready = decideDragonBehavior(healthySoundDragon({
    sonicImpactRequested: true, threatDetected: true, energy: 60
  }));
  assert.equal(ready.action, "perform_sonic_impact_wave");
  const tired = decideDragonBehavior(healthySoundDragon({
    sonicImpactRequested: true, threatDetected: true, energy: 20
  }));
  assert.notEqual(tired.action, "perform_sonic_impact_wave");
});

test("as oito espécies estão registradas no catálogo metabólico", () => {
  assert.deepEqual(Object.keys(speciesProfiles).sort(), [
    "earth", "electric", "fire", "ice", "lava", "sound", "water", "wind"
  ]);
  assert.equal(Object.keys(behaviorProfiles).length, 9);
});
