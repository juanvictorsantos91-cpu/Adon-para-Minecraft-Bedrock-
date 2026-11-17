import { recoverEnergy, spendEnergy } from "./energy.js";
import { reduceHunger } from "./hunger.js";
import { damageHealth, recoverHealth } from "./health.js";
import { progressInjury } from "./injuries.js";

export function tickMetabolism(state, profile, context = {}) {
  const minutes = context.minutes ?? 1;
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new RangeError("minutes deve ser maior que zero.");
  }

  const next = { ...state };
  const activity = context.activity ?? "idle";
  const activityCost = (profile.activityCosts?.[activity] ?? 0) * minutes;
  next.energy = spendEnergy(next.energy, activityCost);

  const hungerRate = profile.hungerPerMinute ?? 0.05;
  next.hunger = reduceHunger(next.hunger, hungerRate * minutes);

  if (context.resting && context.safe && context.stationary) {
    const specialRate = profile.environmentRecovery?.[context.environment] ?? null;
    const recoveryRate = specialRate ?? profile.restRecoveryPerMinute ?? 2;
    next.energy = recoverEnergy(next.energy, recoveryRate * minutes);
    next.health = recoverHealth(next.health, (profile.healthRecoveryPerMinute ?? 0.15) * minutes);
    if (next.injury) {
      next.injury = progressInjury(next.injury, (profile.injuryRecoveryPerMinute ?? 1) * minutes);
    }
  }

  if (next.hunger === 0) {
    next.starvationMinutes = (state.starvationMinutes ?? 0) + minutes;
    const grace = profile.starvationGraceMinutes ?? 60;
    if (next.starvationMinutes > grace) {
      const damage = (profile.starvationDamagePerMinute ?? 0.1) *
        (next.starvationMinutes - Math.max(grace, state.starvationMinutes ?? 0));
      next.health = damageHealth(next.health, damage);
    }
  } else {
    next.starvationMinutes = 0;
  }

  return next;
}
