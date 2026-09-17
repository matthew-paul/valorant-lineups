export interface SelectOption {
  value: number;
  label: string;
}

export type AgentOption = SelectOption;
export type TagOption = SelectOption;

export interface AbilityOption extends SelectOption {
  icon?: string;
}

export interface MapOption extends SelectOption {
  icon: string;
}

export interface LineupRecord {
  id: string;
  name: string;
  description: string;
  agent: number;
  ability: number;
  mapId: number;
  tags: number[];
  images: string[];
  video: string;
  credits: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
}

export type LineupsByMap = Partial<Record<number, LineupRecord[]>>;

export interface Point {
  x: number;
  y: number;
}

export interface ClusterPoint {
  id: string;
  startX: number;
  startY: number;
}

export interface LineupCluster {
  center: Point;
  points: ClusterPoint[];
  ability: number;
  agent: number;
}

export interface MapArrow {
  x: number;
  y: number;
  startX: number;
  startY: number;
}

export interface MapTransform {
  scale: number;
  translation: Point;
}

export interface ImageTag {
  id: string;
  text: string;
}

export type InfoMessageType = "info" | "success" | "error";

export interface InfoMessage {
  type: InfoMessageType;
  value: string;
}

export interface LineupFormValues {
  name: string;
  description: string;
  agent: AgentOption | null;
  ability: AbilityOption | null;
  map: MapOption;
  tags: TagOption[];
  images: ImageTag[];
  video: string;
  credits: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  infoMessage: InfoMessage;
  apiKey: string;
}

export type MutationRequestType = "add" | "edit" | "delete";
