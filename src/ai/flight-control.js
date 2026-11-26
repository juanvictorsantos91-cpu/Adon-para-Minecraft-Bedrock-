/**
 * Política de voo do Dragon Survival.
 * Decide quando manter voo, economizar energia ou iniciar descida.
 * Não substitui a física do Bedrock: aplica apenas orientação conservadora
 * através de impulsos pequenos e tags de estado.
 */
import { getDragonBalance } from "../species/balance.js";

export const flightProfiles = Object.freeze({
  fire:       { style: "powerful", agility: 0.55, glideEfficiency: 0.55, preferredAltitude: "medium" },
  water:      { style: "low_and_stable", agility: 0.55, glideEfficiency: 0.60, preferredAltitude: "low" },
  ice:        { style: "steady", agility: 0.50, glideEfficiency: 0.65, preferredAltitude: "medium" },
  electric:   { style: "high_altitude_fast", agility: 0.85, glideEfficiency: 0.70, preferredAltitude: "very_high" },
  earth:      { style: "heavy_and_limited", agility: 0.25, glideEfficiency: 0.35, preferredAltitude: "low" },
  lava:       { style: "heavy_powerful", agility: 0.40, glideEfficiency: 0.45, preferredAltitude: "medium" },
  wind:       { style: "agile_long_glide", agility: 1.00, glideEfficiency: 1.00, preferredAltitude: "high" },
  sound:      { style: "fast_maneuverable", agility: 0.90, glideEfficiency: 0.65, preferredAltitude: "medium_high" },
  poison:     { style: "quiet_low_flight", agility: 0.70, glideEfficiency: 0.60, preferredAltitude: "low" },
  sand:       { style: "short_burst", agility: 0.60, glideEfficiency: 0.45, preferredAltitude: "low" },
  light:      { style: "smooth_patrol", agility: 0.70, glideEfficiency: 0.75, preferredAltitude: "medium_high" },
  plasma:     { style: "rare_evasive", agility: 0.90, glideEfficiency: 0.75, preferredAltitude: "high" },
  acid:       { style: "controlled_hunter", agility: 0.55, glideEfficiency: 0.55, preferredAltitude: "low_medium" },
  radioactive:{ style: "heavy_endurance", agility: 0.40, glideEfficiency: 0.60, preferredAltitude: "medium" },
  shadow:     { style: "silent_night_flight", agility: 0.85, glideEfficiency: 0.80, preferredAltitude: "low_medium" }
});

export function getFlightProfile(species) {
  const profile = flightProfiles[species];
  if (!profile) throw new RangeError(`Espécie sem perfil de voo: ${species}`);
  return profile;
}

export function assessFlightPolicy(state, species) {
  if (!state || !["energy", "hunger", "health"].every(key =>
    Number.isFinite(state[key]) && state[key] >= 0 && state[key] <= 100)) {
    throw new TypeError("Estado de sobrevivência inválido para avaliar o voo.");
  }
  const profile = getFlightProfile(species);
  const balance = getDragonBalance(species);
  const severeInjury = state.injury?.severity === "severe";
  const moderateInjury = state.injury?.severity === "moderate";
  const emergencyLanding = state.health <= 25 || state.energy <= 12 ||
    state.hunger <= 8 || severeInjury;
  const conserveFlight = !emergencyLanding &&
    (state.energy <= 35 || state.hunger <= 15 || moderateInjury);

  return Object.freeze({
    mode: emergencyLanding ? "descend" : conserveFlight ? "glide" : "cruise",
    shouldDescend: emergencyLanding,
    shouldConserve: conserveFlight,
    style: profile.style,
    agility: profile.agility,
    glideEfficiency: profile.glideEfficiency,
    preferredAltitude: profile.preferredAltitude,
    maxAltitude: balance.maxFlightAltitude,
    maxRange: balance.flightRange,
    descentImpulse: Math.max(0.045, Math.min(0.12, 0.075 / balance.mass))
  });
}
