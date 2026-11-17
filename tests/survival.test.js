import test from "node:test";
import assert from "node:assert/strict";
import { spendEnergy, recoverEnergy, canSpendEnergy } from "../src/survival/energy.js";
import { reduceHunger, feedHunger } from "../src/survival/hunger.js";
import { damageHealth, recoverHealth } from "../src/survival/health.js";
import { applyInjury, progressInjury } from "../src/survival/injuries.js";
import { tickMetabolism } from "../src/survival/metabolism.js";
import { decideSurvivalAction } from "../src/ai/survival-decisions.js";
import { electricDragonProfile } from "../src/species/profiles/electric.js";

test("energia nunca ultrapassa 100 nem fica abaixo de zero", () => {
  assert.equal(spendEnergy(10, 20), 0);
  assert.equal(recoverEnergy(95, 20), 100);
});

test("reserva de energia só pode ser usada em emergência", () => {
  assert.equal(canSpendEnergy(20, 10, { reserve: 15 }), false);
  assert.equal(canSpendEnergy(20, 10, { reserve: 15, emergency: true }), true);
});

test("alimentação e consumo respeitam limites da fome", () => {
  assert.equal(reduceHunger(3, 10), 0);
  assert.equal(feedHunger(95, 20), 100);
});

test("saúde respeita os limites de 0 a 100", () => {
  assert.equal(damageHealth(5, 10), 0);
  assert.equal(recoverHealth(95, 10), 100);
});

test("mantém no máximo um ferimento e prioriza o mais grave", () => {
  const light = { type: "wing", severity: "light" };
  const severe = { type: "wing", severity: "severe" };
  assert.equal(applyInjury(light, severe).severity, "severe");
  assert.equal(progressInjury({ ...severe, recovery: 95 }, 5), null);
});

test("descanso seguro recupera energia e saúde", () => {
  const before = { energy: 40, hunger: 80, health: 70, injury: null };
  const after = tickMetabolism(before, electricDragonProfile, {
    minutes: 2, resting: true, safe: true, stationary: true, environment: "night"
  });
  assert.ok(after.energy > before.energy);
  assert.ok(after.health > before.health);
});

test("perigo imediato vence as necessidades de rotina", () => {
  const result = decideSurvivalAction({
    energy: 5, hunger: 0, health: 10, immediateDanger: true
  });
  assert.equal(result.action, "escape_danger");
});

test("fome extrema leva o dragão a procurar comida", () => {
  const result = decideSurvivalAction({
    energy: 70, hunger: 10, health: 100, immediateDanger: false
  });
  assert.equal(result.action, "search_food");
});
