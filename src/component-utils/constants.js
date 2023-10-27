// Breach
import Aftershock from "../resources/Agents/Breach/Aftershock.png";

// Brimstone
import Incendiary from "../resources/Agents/Brimstone/Incendiary.png";

// Fade
import Haunt from "../resources/Agents/Fade/Haunt.png";
import Seize from "../resources/Agents/Fade/Seize.png";

// Gekko
import MoshPit from "../resources/Agents/Gekko/Mosh_Pit.png";
import Dizzy from "../resources/Agents/Gekko/Dizzy.png";
import Wingman from "../resources/Agents/Gekko/Wingman.png";

// Killjoy
import Nanoswarm from "../resources/Agents/Killjoy/Nanoswarm.png";

// Kay/O
import FRAGment from "../resources/Agents/KayO/FRAG-ment.png";
import ZEROpoint from "../resources/Agents/KayO/ZERO-point.png";
import FLASHdrive from "../resources/Agents/KayO/FLASH-drive.png";

// Sage
import BarrierOrb from "../resources/Agents/Sage/Barrier_Orb.png";
import SlowOrb from "../resources/Agents/Sage/Slow_Orb.png";

// Sova
import ReconBolt from "../resources/Agents/Sova/Recon_Bolt.png";
import ShockBolt from "../resources/Agents/Sova/Shock_Bolt.png";

// Viper
import SnakeBite from "../resources/Agents/Viper/Snake_Bite.png";
import PoisonCloud from "../resources/Agents/Viper/Poison_Cloud.png";

// Maps
import AscentMap from "../resources/Maps/ascent_map.png";
import BindMap from "../resources/Maps/bind_map.png";
import BreezeMap from "../resources/Maps/breeze_map.png";
import HavenMap from "../resources/Maps/haven_map.png";
import IceboxMap from "../resources/Maps/icebox_map.png";
import SplitMap from "../resources/Maps/split_map.png";
import FractureMap from "../resources/Maps/fracture_map.png";
import PearlMap from "../resources/Maps/pearl_map.png";
import LotusMap from "../resources/Maps/lotus_map.png";
import SunsetMap from "../resources/Maps/sunset_map.png";

export const API_URL =
  "https://uh5it8zn19.execute-api.us-east-1.amazonaws.com/development";

export const localStorageExpirationTime = 1000 * 60 * 15 * 1 * 1; // How long localStorage will keep lineup info before refreshing in milliseconds
//                                        ms     s    min  hr   days

// Use label/value because that's what react-select uses
export const AGENT_LIST = [
  // { value: 1, label: "Astra" },
  { value: 2, label: "Breach" },
  { value: 3, label: "Brimstone" },
  //  { value: 4, label: "Cypher" },
  { value: 18, label: "Fade" },
  { value: 20, label: "Gekko" },
  // { value: 19, label: "Harbor" },
  // { value: 5, label: "Jett" },
  { value: 6, label: "Killjoy" },
  { value: 16, label: "Kay/O" },
  // { value: 17, label: "Neon" },
  // { value: 7, label: "Omen" },
  // { value: 8, label: "Phoenix" },
  // { value: 9, label: "Raze" },
  // { value: 10, label: "Reyna" },
  { value: 11, label: "Sage" },
  // { value: 12, label: "Skye" },
  { value: 13, label: "Sova" },
  { value: 14, label: "Viper" },
  // { value: 15, label: "Yoru" },
];

export const ABILITY_LIST = {
  2: [{ value: 1, label: "Aftershock", icon: Aftershock }],
  3: [{ value: 1, label: "Incediary", icon: Incendiary }],
  18: [
    { value: 1, label: "Haunt", icon: Haunt },
    { value: 2, label: "Seize", icon: Seize },
  ],
  20: [
    { value: 1, label: "Mosh Pit", icon: MoshPit },
    { value: 2, label: "Wingman", icon: Wingman },
    { value: 3, label: "Dizzy", icon: Dizzy },
  ],
  6: [
    { value: 1, label: "Nanoswarm", icon: Nanoswarm },
  ],
  16: [
    { value: 1, label: "FRAG-ment", icon: FRAGment },
    { value: 2, label: "ZERO-point", icon: ZEROpoint },
    { value: 3, label: "FLASH-drive", icon: FLASHdrive },
  ],
  11: [
    { value: 1, label: "Barrier Orb", icon: BarrierOrb },
    { value: 2, label: "Slow Orb", icon: SlowOrb },
  ],
  13: [
    { value: 1, label: "Recon Bolt", icon: ReconBolt },
    { value: 2, label: "Shock Dart", icon: ShockBolt },
  ],
  14: [
    { value: 1, label: "Snake Bite", icon: SnakeBite },
    { value: 2, label: "Poison Cloud", icon: PoisonCloud },
  ],
};

export const MAP_LIST = [
  { value: 1, label: "Ascent", icon: AscentMap },
  { value: 2, label: "Bind", icon: BindMap },
  { value: 3, label: "Breeze", icon: BreezeMap },
  { value: 7, label: "Fracture", icon: FractureMap },
  { value: 4, label: "Haven", icon: HavenMap },
  { value: 5, label: "Icebox", icon: IceboxMap },
  { value: 9, label: "Lotus", icon: LotusMap },
  { value: 8, label: "Pearl", icon: PearlMap },
  { value: 6, label: "Split", icon: SplitMap },
  { value: 10, label: "Sunset", icon: SunsetMap },
];

export const TAG_LIST = [
  { value: 1, label: "Attacking" },
  { value: 2, label: "Defending" },
  { value: 3, label: "Post Plant" },
  { value: 4, label: "Retake" },
  { value: 16, label: "Fake" },
  { value: 5, label: "A Site" },
  { value: 6, label: "B Site" },
  { value: 7, label: "C Site" },
  { value: 8, label: "Mid" },
  { value: 9, label: "Easy" },
  { value: 10, label: "Medium" },
  { value: 11, label: "Hard" },
  { value: 12, label: "Crosshair Lineup" },
  { value: 13, label: "UI Lineup" },
  { value: 14, label: "Double Shock Dart" },
  { value: 15, label: "Single Shock Dart" },
];

export const getAgentFromId = (agentId) => {
  return AGENT_LIST.find((agent) => agent.value === agentId);
};

export const getAbilityFromId = (agentId, abilityId) => {
  return ABILITY_LIST[agentId].find((ability) => ability.value === abilityId);
};

export const getTagsFromIds = (tagIds) => {
  return TAG_LIST.filter((tag) => tagIds.includes(tag.value));
};

export const getImagesFromIds = (imageIds) => {
  return imageIds.map((image) => ({ id: image, text: image }));
};

export const getMapFromId = (mapId) => {
  return MAP_LIST.find((map) => map.value === mapId);
};
