import { chooseAction } from "./rule-engine.js";
import { decideSurvivalAction } from "./survival-decisions.js";
import { getBehaviorProfile } from "../species/behavior-profiles.js";

const commandActions = {
  follow: "follow_owner",
  stay: "stay_in_place",
  defend: "defend_owner",
  attack_target: "attack_designated_target",
  return_nest: "return_to_nest",
  land: "land_safely",
  fly_to: "travel_to_destination",
  explore: "explore_with_owner"
};

function behaviorRules(profile) {
  return [
    {
      name: "obey-trained-command", priority: 1,
      when: s => Boolean(s.trainingCommand && commandActions[s.trainingCommand]),
      action: s => commandActions[s.trainingCommand],
      reason: "Executa um comando reconhecido do treinador."
    },
    {
      name: "protect-young", priority: 2,
      when: s => s.hasYoung === true && s.youngInDanger === true,
      action: "protect_young",
      reason: "Protege os filhotes quando existe uma ameaça próxima."
    },
    {
      name: "protect-nest", priority: 3,
      when: s => s.nestThreatened === true,
      action: "guard_nest",
      reason: "A proteção do ninho é uma prioridade natural."
    },
    {
      name: "protect-owner", priority: 4,
      when: s => s.ownerInDanger === true && s.bondLevel >= 2,
      action: "defend_owner",
      reason: "Defende o dono com quem desenvolveu vínculo."
    },
    {
      name: "respond-to-threat", priority: 5,
      when: s => s.threatDetected === true,
      action: s => {
        if (s.health <= 40 || s.energy <= 25) return "retreat_to_safety";
        if (profile.aggression >= 0.7) return "confront_threat";
        if (profile.caution >= 0.8) return "keep_distance_and_observe";
        return profile.threatResponse;
      },
      reason: "Avalia a ameaça conforme saúde, energia e personalidade."
    },
    {
      name: "follow-bonded-owner", priority: 6,
      when: s => s.ownerNearby === true && s.bondLevel >= 2 && s.trainingCommand !== "stay",
      action: "stay_near_owner",
      reason: "Mantém proximidade voluntária com o dono de confiança."
    },
    {
      name: "care-for-young", priority: 7,
      when: s => s.hasYoung === true && s.youngNeedsCare === true,
      action: "care_for_young",
      reason: "Cuida dos filhotes quando estão seguros e precisam de atenção."
    },
    {
      name: "socialize-compatible-dragon", priority: 8,
      when: s => s.compatibleDragonNearby === true && s.socialOpportunity === true,
      action: "socialize_with_dragon",
      reason: "Interage socialmente com outro dragão compatível."
    },
    {
      name: "rest-in-preferred-place", priority: 9,
      when: s => s.safeToRest === true && s.energy < 65,
      action: "rest_in_preferred_habitat",
      reason: "Escolhe um local seguro e adequado para descansar."
    },
    {
      name: "species-environment-behavior", priority: 10,
      when: s => profile.preferredEnvironment.includes(s.environment),
      action: () => profile.preferredActivities[0],
      reason: "Escolhe uma atividade natural no ambiente preferido da espécie."
    },
    {
      name: "explore-by-curiosity", priority: 11,
      when: s => s.safeToExplore === true && profile.curiosity >= 0.6,
      action: "explore_environment",
      reason: "A curiosidade da espécie favorece a exploração segura."
    },
    {
      name: "idle-observe", priority: 12,
      when: () => true,
      action: "observe_environment",
      reason: "Observa o ambiente enquanto nenhuma necessidade prioritária exige ação."
    }
  ];
}

/**
 * Integra comportamento ao MIS: necessidades críticas sempre têm precedência.
 * O contexto descreve fatos percebidos pelo adaptador do jogo; este módulo não
 * acessa a API Minecraft diretamente.
 */
export function decideDragonBehavior(state) {
  if (!state || typeof state !== "object") {
    throw new TypeError("O estado do dragão precisa ser um objeto.");
  }

  const survival = decideSurvivalAction(state);
  if (survival.action !== "species_behavior") {
    return { ...survival, system: "MIS", species: state.species ?? null };
  }

  const profile = getBehaviorProfile(state.species);
  const decision = chooseAction(state, behaviorRules(profile), "observe_environment");
  return {
    ...decision,
    action: typeof decision.action === "function" ? decision.action(state) : decision.action,
    system: "DBS",
    species: state.species,
    temperament: profile.temperament
  };
}

export { commandActions };
