import test from "node:test";
import assert from "node:assert/strict";
import { assessFlightPolicy, flightProfiles } from "../src/ai/flight-control.js";

const healthy = { energy: 90, hunger: 90, health: 100, injury: null };

test("voo normal permanece em cruzeiro quando as necessidades estão saudáveis", () => {
  const result = assessFlightPolicy(healthy, "fire");
  assert.equal(result.mode, "cruise");
  assert.equal(result.shouldDescend, false);
  assert.equal(result.shouldConserve, false);
});

test("energia baixa ou fome baixa recomenda planar para economizar", () => {
  assert.equal(assessFlightPolicy({ ...healthy, energy: 30 }, "wind").mode, "glide");
  assert.equal(assessFlightPolicy({ ...healthy, hunger: 10 }, "fire").mode, "glide");
});

test("saúde crítica, energia crítica e ferimento grave recomendam descida", () => {
  assert.equal(assessFlightPolicy({ ...healthy, health: 20 }, "fire").mode, "descend");
  assert.equal(assessFlightPolicy({ ...healthy, energy: 10 }, "wind").mode, "descend");
  assert.equal(assessFlightPolicy({ ...healthy, injury: { severity: "severe" } }, "earth").mode, "descend");
});

test("as quinze espécies têm perfis de voo distintos e limites coerentes", () => {
  assert.equal(Object.keys(flightProfiles).length, 15);
  for (const species of Object.keys(flightProfiles)) {
    const result = assessFlightPolicy(healthy, species);
    assert.ok(result.maxAltitude > 0);
    assert.ok(result.maxRange > 0);
    assert.ok(result.descentImpulse >= 0.045 && result.descentImpulse <= 0.12);
  }
  assert.ok(flightProfiles.wind.glideEfficiency > flightProfiles.earth.glideEfficiency);
  assert.ok(flightProfiles.electric.preferredAltitude === "very_high");
});

test("estado inválido é rejeitado", () => {
  assert.throws(() => assessFlightPolicy({ energy: -1, hunger: 50, health: 50 }, "fire"), TypeError);
});
