import test from "node:test";
import assert from "node:assert/strict";
import { assessSocialGroupFormation } from "../src/ai/social-group-formation.js";

const dragon = (id, species, extra = {}) => ({ id, species, ...extra });

test("fogo e gelo só propõem pares quando há um candidato elegível", () => {
  const fire = assessSocialGroupFormation({
    dragon: dragon("f1", "fire"),
    candidates: [dragon("f2", "fire", { distance: 12 })]
  });
  assert.equal(fire.status, "formation_candidate");
  assert.deepEqual(fire.candidateIds, ["f2"]);

  const ice = assessSocialGroupFormation({
    dragon: dragon("i1", "ice"),
    candidates: [dragon("i2", "ice", { distance: 5 })]
  });
  assert.equal(ice.targetGroupSize, 2);
  assert.equal(ice.shouldForm, true);
});

test("água exige o tamanho-alvo do perfil e ignora espécies incompatíveis", () => {
  const result = assessSocialGroupFormation({
    dragon: dragon("w1", "water"),
    candidates: [
      dragon("w2", "water", { distance: 4 }),
      dragon("w3", "water", { distance: 8 }),
      dragon("f1", "fire", { distance: 2 })
    ]
  });
  assert.equal(result.targetGroupSize, 3);
  assert.equal(result.shouldForm, false);
  assert.deepEqual(result.candidateIds, ["w2", "w3"]);
});

test("Terra e Lava podem propor grupo misto, mas não absorvem membros já agrupados", () => {
  const result = assessSocialGroupFormation({
    dragon: dragon("e1", "earth"),
    candidates: [
      dragon("l1", "lava", { distance: 10 }),
      dragon("e2", "earth", { distance: 11 }),
      dragon("l2", "lava", { distance: 12, groupId: "existing" })
    ]
  });
  assert.deepEqual(result.candidateIds, ["l1", "e2"]);
  assert.equal(result.status, "insufficient_candidates");
});

test("Elétrico permanece solitário mesmo com outros elétricos próximos", () => {
  const result = assessSocialGroupFormation({
    dragon: dragon("e1", "electric"),
    candidates: [dragon("e2", "electric", { distance: 1 }), dragon("e3", "electric", { distance: 2 })]
  });
  assert.equal(result.status, "not_eligible");
  assert.equal(result.shouldForm, false);
  assert.deepEqual(result.candidateIds, []);
});

test("filtra distância, duplicatas, indisponíveis e candidatos inválidos", () => {
  const result = assessSocialGroupFormation({
    dragon: dragon("s1", "sound"),
    candidates: [
      dragon("s2", "sound", { distance: 32 }),
      dragon("s2", "sound", { distance: 2 }),
      dragon("s3", "sound", { distance: 33 }),
      dragon("s4", "sound", { distance: 1, available: false }),
      dragon("s5", "sound", { distance: 2, groupId: "g1" })
    ]
  });
  assert.deepEqual(result.candidateIds, ["s2"]);
  assert.equal(result.shouldForm, false);
});

test("não substitui grupo já associado e valida entradas", () => {
  const existing = assessSocialGroupFormation({
    dragon: dragon("f1", "fire", { groupId: "pair-1" }),
    candidates: [dragon("f2", "fire", { distance: 2 })]
  });
  assert.equal(existing.status, "already_grouped");
  assert.equal(existing.action, "maintain_existing_group");
  assert.throws(() => assessSocialGroupFormation({ dragon: dragon("x", "unknown") }), /Espécie/);
  assert.throws(() => assessSocialGroupFormation({ dragon: dragon("x", "fire"), maxDistance: -1 }), /maxDistance/);
});
