import ReconBolt from '../resources/Agents/Sova/Recon_Bolt.png'
import ShockBolt from '../resources/Agents/Sova/Shock_Bolt.png'
import AscentMap from '../resources/Maps/ascent_map.png'
import BindMap from '../resources/Maps/bind_map.png'
import BreezeMap from '../resources/Maps/breeze_map.png'
import HavenMap from '../resources/Maps/haven_map.png'
import IceboxMap from '../resources/Maps/icebox_map.png'
import SplitMap from '../resources/Maps/split_map.png'

export const API_URL = 'https://cxvofre6jj.execute-api.us-east-1.amazonaws.com/lineups'

export const AGENT_LIST = [
    { value: 1, label: "Astra" },
    { value: 2, label: "Breach" },
    { value: 3, label: "Brimstone" },
    { value: 4, label: "Cypher" },
    { value: 5, label: "Jett" },
    { value: 6, label: "Killjoy" },
    { value: 16, label: "Kay/O" },
    { value: 7, label: "Omen" },
    { value: 8, label: "Phoenix" },
    { value: 9, label: "Raze" },
    { value: 10, label: "Reyna" },
    { value: 11, label: "Sage" },
    { value: 12, label: "Skye" },
    { value: 13, label: "Sova" },
    { value: 14, label: "Viper" },
    { value: 15, label: "Yoru" },
]

export const ABILITY_LIST = {
    13: [
        { value: 1, label: "Recon Bolt", icon: ReconBolt },
        { value: 2, label: "Shock Dart", icon: ShockBolt },
    ]
}

export const MAP_LIST = [
    { value: 1, label: "Ascent", icon: AscentMap },
    { value: 2, label: "Bind", icon: BindMap },
    { value: 3, label: "Breeze", icon: BreezeMap },
    { value: 4, label: "Haven", icon: HavenMap },
    { value: 5, label: "Icebox", icon: IceboxMap },
    { value: 6, label: "Split", icon: SplitMap },
]

export const TAG_LIST = [
    { value: 1, label: "Attacking" },
    { value: 2, label: "Defending" },
    { value: 3, label: "Post Plant" },
    { value: 4, label: "Retake" },
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
]