import { chooseAction } from "./rule-engine.js";
import { decideSurvivalAction } from "./survival-decisions.js";
import { getBehaviorProfile } from "../species/behavior-profiles.js";
import { getSocialGroupPlan } from "./social-groups.js";
import { assessDragonRelationships } from "./dragon-relationships.js";
import { getMigrationStatus } from "./migration-cycle.js";
import { assessSocialInteractions } from "./social-interactions.js";

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
      name: "obey-trained-command", priority: 5,
      when: s => Boolean(s.trainingCommand && commandActions[s.trainingCommand]),
      action: s => commandActions[s.trainingCommand],
      reason: "Executa um comando reconhecido do treinador."
    },
    {
      name: "protect-young", priority: 1,
      when: s => s.hasYoung === true && s.youngInDanger === true && profile.protectiveness >= 0.6,
      action: "protect_young",
      reason: "Protege os filhotes quando existe uma ameaça próxima."
    },
    {
      name: "protect-nest", priority: 2,
      when: s => s.nestThreatened === true,
      action: "guard_nest",
      reason: "A proteção do ninho é uma prioridade natural."
    },
    {
      name: "protect-owner", priority: 3,
      when: s => s.ownerInDanger === true && s.bondLevel >= 2 && profile.protectiveness >= 0.7,
      action: "defend_owner",
      reason: "Defende o dono com quem desenvolveu vínculo."
    },
    {
      name: "respond-to-threat", priority: 4,
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
      when: s => s.ownerNearby === true && s.bondLevel >= (profile.independence >= 0.8 ? 3 : 2) && s.trainingCommand !== "stay",
      action: "stay_near_owner",
      reason: "Mantém proximidade voluntária com o dono de confiança."
    },
    {
      name: "care-for-young", priority: 7,
      when: s => s.relationships?.parentalAction !== null && s.relationships?.parentalAction !== undefined,
      action: s => s.relationships?.parentalAction ?? "care_for_young",
      reason: "Cuida dos filhotes quando estão seguros e precisam de atenção."
    },
    {
      name: "long-cycle-migration", priority: 8,
      when: s => profile.migrationPattern === "long_cycle" &&
        s.migrationDue === true && s.migrationRouteSafe === true &&
        s.ownerNearby !== true && s.hasYoung !== true,
      action: "begin_long_migration",
      reason: "Inicia uma grande migração quando o ciclo natural da espécie chega e a rota é segura."
    },
    {
      name: "respond-to-dragon-aggression", priority: 9,
      when: s => s.socialInteractions?.action && s.socialInteractions.kind !== "peaceful",
      action: s => s.socialInteractions.action,
      reason: "Responde a agressão ou conflito territorial de outro dragão sem iniciar hostilidade automaticamente."
    },
    {
      name: "peaceful-cross-species-interaction", priority: 12,
      when: s => s.socialInteractions?.action === "perform_peaceful_cross_species_interaction",
      action: "perform_peaceful_cross_species_interaction",
      reason: "Realiza uma interação pacífica com outra espécie quando existe oportunidade segura."
    },
    {
      name: "travel-with-mixed-earth-lava-group", priority: 10,
      when: s => s.groupPlan?.action === "travel_with_mixed_earth_lava_group" && s.safeToExplore === true,
      action: "travel_with_mixed_earth_lava_group",
      reason: "Terra e Lava reconhecem a aliança social e mantêm deslocamento em um grupo misto."
    },
    {
      name: "maintain-natural-group", priority: 9,
      when: s => profile.socialPattern !== "solitary" &&
        s.sameSpeciesGroupNearby === true &&
        s.groupPlan?.action !== "travel_with_mixed_earth_lava_group",
      action: "stay_with_species_group",
      reason: "Mantém a coesão do grupo natural da espécie."
    },
    {
      name: "form-natural-group", priority: 10,
      when: s => profile.socialPattern !== "solitary" &&
        Number.isFinite(s.nearbySameSpeciesCount) &&
        s.nearbySameSpeciesCount >= 1 && s.safeToExplore === true,
      action: () => ({
        pairs: "travel_in_pair",
        small_groups: "travel_in_small_group",
        large_groups: "travel_in_large_group"
      }[profile.socialPattern]),
      reason: "Procura formar ou integrar o tipo de grupo característico da espécie."
    },
    {
      name: "form-compatible-pair", priority: 11,
      when: s => s.relationships?.canFormPair === true,
      action: "approach_compatible_mate",
      reason: "Procura aproximar-se de um parceiro adulto compatível e sem parentesco próximo."
    },
    {
      name: "socialize-compatible-dragon", priority: 12,
      when: s => s.compatibleDragonNearby === true && s.socialOpportunity === true && profile.sociability >= 0.5,
      action: "socialize_with_dragon",
      reason: "Interage socialmente com outro dragão compatível."
    },
    {
      name: "rest-in-preferred-place", priority: 13,
      when: s => s.safeToRest === true && s.energy < 65,
      action: "rest_in_preferred_habitat",
      reason: "Escolhe um local seguro e adequado para descansar."
    },
    {
      name: "species-environment-behavior", priority: 14,
      when: s => profile.preferredEnvironment.includes(s.environment),
      action: () => profile.preferredActivities[0],
      reason: "Escolhe uma atividade natural no ambiente preferido da espécie."
    },
    {
      name: "explore-by-curiosity", priority: 15,
      when: s => s.safeToExplore === true && profile.curiosity >= 0.6,
      action: "explore_environment",
      reason: "A curiosidade da espécie favorece a exploração segura."
    },
    {
      name: "idle-observe", priority: 16,
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
  const relationships = assessDragonRelationships(state, state.nearbyDragons ?? []);
  const migrationStatus = Number.isInteger(state.currentTick)
    ? getMigrationStatus({
        species: state.species,
        currentTick: state.currentTick,
        spawnTick: state.spawnTick,
        lastMigrationTick: state.lastMigrationTick,
        cycleDurationTicks: state.migrationCycleTicks
      })
    : { migratory: profile.migrationPattern === "long_cycle", due: false };
  const socialInteractions = assessSocialInteractions(state, state.nearbyDragons ?? [], state);
  const groupPlan = getSocialGroupPlan(
    state.species,
    Number.isInteger(state.nearbySameSpeciesCount) ? state.nearbySameSpeciesCount : 0,
    state.nearbyDragons ?? []
  );
  const enrichedState = {
    ...state,
    relationships,
    socialInteractions,
    groupPlan,
    migrationDue: state.migrationDue === true || migrationStatus.due
  };
  const decision = chooseAction(enrichedState, behaviorRules(profile), "observe_environment");
  return {
    ...decision,
    action: typeof decision.action === "function" ? decision.action(enrichedState) : decision.action,
    system: "DBS",
    species: state.species,
    temperament: profile.temperament,
    relationships,
    migrationStatus,
    groupPlan,
    socialInteractions
  };
}

export { commandActions };
