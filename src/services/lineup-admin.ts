import { API_URL } from "../component-utils/constants";
import { normalizeYouTubeVideo } from "./youtube-video";
import type {
  LineupFormValues,
  LineupRecord,
  MutationRequestType,
} from "../types/lineup";

export type AddLineupPayload = Omit<LineupRecord, "id">;
export type EditLineupPayload = LineupRecord;
export type DeleteLineupPayload = Pick<LineupRecord, "id" | "mapId">;
interface MutationPayloadByType {
  add: AddLineupPayload;
  edit: EditLineupPayload;
  delete: DeleteLineupPayload;
}

export type MutationPayload = MutationPayloadByType[MutationRequestType];

export type MutationRequestArguments = {
  [Type in MutationRequestType]: [
    requestType: Type,
    apiKey: string,
    payload: MutationPayloadByType[Type]
  ];
}[MutationRequestType];

export interface ValidationResult {
  valid: boolean;
  message: string;
}

export interface SendLineupMutationOptions {
  fetcher?: typeof fetch;
  url?: string;
}

type SendLineupMutationArguments = {
  [Type in MutationRequestType]: [
    requestType: Type,
    apiKey: string,
    payload: MutationPayloadByType[Type],
    options?: SendLineupMutationOptions
  ];
}[MutationRequestType];

const isMapCoordinate = (coordinate: number): boolean =>
  Number.isFinite(coordinate) && coordinate >= 0 && coordinate <= 1000;

export const validateLineupForm = (
  state: LineupFormValues
): ValidationResult => {
  if (state.name.trim() === "")
    return { valid: false, message: "Enter a lineup title" };
  if (state.agent === null) return { valid: false, message: "Select an agent" };
  if (state.ability === null)
    return { valid: false, message: "Select an ability" };
  if (state.images.some((image) => image.text.trim() === ""))
    return { valid: false, message: "Enter an image link" };
  if (state.video.trim() === "")
    return { valid: false, message: "Enter a youtube video id" };
  if (normalizeYouTubeVideo(state.video) === null)
    return { valid: false, message: "Enter a valid YouTube video ID or URL" };
  if (!isMapCoordinate(state.x) || !isMapCoordinate(state.y))
    return { valid: false, message: "Select a lineup position" };
  if (!isMapCoordinate(state.startX) || !isMapCoordinate(state.startY))
    return { valid: false, message: "Select a start position" };
  if (state.apiKey.trim() === "")
    return { valid: false, message: "Enter an API key" };
  return { valid: true, message: "" };
};

export const imageTagsToUrls = (
  images: LineupFormValues["images"]
): string[] => images.map((image) => image.text.trim());

export const buildAddPayload = (
  state: LineupFormValues,
  video: string
): AddLineupPayload => {
  if (state.agent === null || state.ability === null) {
    throw new Error("Agent and ability are required");
  }

  return {
    name: state.name.trim(),
    description: state.description,
    agent: state.agent.value,
    ability: state.ability.value,
    mapId: state.map.value,
    tags: state.tags.map((tag) => tag.value),
    images: imageTagsToUrls(state.images),
    video,
    credits: state.credits,
    x: state.x,
    y: state.y,
    startX: state.startX,
    startY: state.startY,
  };
};

export const buildEditPayload = (
  state: LineupFormValues,
  id: string
): EditLineupPayload => {
  const video = normalizeYouTubeVideo(state.video);
  if (video === null) {
    throw new Error("Enter a valid YouTube video ID or URL");
  }
  return { ...buildAddPayload(state, video), id };
};

export const buildDeletePayload = (
  id: string,
  originalMapId: number
): DeleteLineupPayload => ({ id, mapId: originalMapId });

const buildMutationRequest = (
  requestType: MutationRequestType,
  apiKey: string,
  payload: MutationPayload
): RequestInit => ({
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "request-type": requestType,
  },
  body: JSON.stringify(payload),
});

export const createMutationRequest: (
  ...args: MutationRequestArguments
) => RequestInit = buildMutationRequest;

export const sendLineupMutation = async (
  ...[
    requestType,
    apiKey,
    payload,
    { fetcher = fetch, url = API_URL } = {},
  ]: SendLineupMutationArguments
): Promise<string> => {
  const response = await fetcher(
    url,
    buildMutationRequest(requestType, apiKey, payload)
  );
  const responseBody = await response.text();

  if (!response.ok) {
    const details =
      responseBody.trim() === "" ? "" : `: ${responseBody.trim()}`;
    throw new Error(
      `Lineup ${requestType} request failed with status ${response.status}${details}`
    );
  }

  return responseBody;
};
