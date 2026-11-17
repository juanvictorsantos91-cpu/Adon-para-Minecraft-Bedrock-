import { electricDragonProfile } from "./electric.js";
import { waterDragonProfile } from "./water.js";
import { iceDragonProfile } from "./ice.js";
import { fireDragonProfile } from "./fire.js";
import { earthDragonProfile } from "./earth.js";
import { lavaDragonProfile } from "./lava.js";
import { windDragonProfile } from "./wind.js";
import { soundDragonProfile } from "./sound.js";
import { poisonDragonProfile } from "./poison.js";

export const speciesProfiles = {
  electric: electricDragonProfile,
  water: waterDragonProfile,
  ice: iceDragonProfile,
  fire: fireDragonProfile,
  earth: earthDragonProfile,
  lava: lavaDragonProfile,
  wind: windDragonProfile,
  sound: soundDragonProfile,
  poison: poisonDragonProfile
};

export function getSpeciesProfile(species) {
  const profile = speciesProfiles[species];
  if (!profile) throw new RangeError(`Perfil de espécie não encontrado: ${species}`);
  return profile;
}
