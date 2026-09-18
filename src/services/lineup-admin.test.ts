import { API_URL } from "../component-utils/constants";
import type { LineupFormValues } from "../types/lineup";
import type { MutationRequestArguments } from "./lineup-admin";
import {
  buildAddPayload,
  buildDeletePayload,
  buildEditPayload,
  createMutationRequest,
  imageTagsToUrls,
  sendLineupMutation,
  validateLineupForm,
} from "./lineup-admin";

const makeFormValues = (
  overrides: Partial<LineupFormValues> = {}
): LineupFormValues => ({
  name: "Ascent recon",
  description: "Stand in the corner and aim at the roof.",
  agent: { value: 13, label: "Sova" },
  ability: { value: 1, label: "Recon Bolt", icon: "recon.png" },
  map: { value: 1, label: "Ascent", icon: "ascent.png" },
  tags: [
    { value: 1, label: "Attacking" },
    { value: 5, label: "A Site" },
  ],
  images: [
    { id: "first", text: "https://example.com/first.jpg" },
    { id: "second", text: "https://example.com/second.jpg" },
  ],
  video: "abcdefghijk",
  credits: "https://example.com/source",
  x: 100,
  y: 200,
  startX: 300,
  startY: 400,
  infoMessage: { type: "info", value: "" },
  apiKey: "secret-key",
  ...overrides,
});

const responseWithText = (
  body: string,
  options: { ok?: boolean; status?: number } = {}
): Response =>
  ({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    text: async () => body,
  } as Response);

describe("validateLineupForm", () => {
  test.each([
    ["title", { name: "" }, "Enter a lineup title"],
    ["blank title", { name: "  " }, "Enter a lineup title"],
    ["agent", { agent: null }, "Select an agent"],
    ["ability", { ability: null }, "Select an ability"],
    ["blank image", { images: [{ id: "empty", text: " " }] }, "Enter an image link"],
    ["video", { video: "" }, "Enter a youtube video id"],
    ["blank video", { video: " " }, "Enter a youtube video id"],
    ["invalid video", { video: "invalid" }, "Enter a valid YouTube video ID or URL"],
    ["position", { x: -1 }, "Select a lineup position"],
    ["vertical position", { y: -1 }, "Select a lineup position"],
    ["nonfinite position", { x: NaN }, "Select a lineup position"],
    ["out-of-map position", { y: 1001 }, "Select a lineup position"],
    ["start position", { startX: -1 }, "Select a start position"],
    ["vertical start position", { startY: -1 }, "Select a start position"],
    ["nonfinite start position", { startY: Infinity }, "Select a start position"],
    ["API key", { apiKey: " " }, "Enter an API key"],
  ] satisfies Array<
    [string, Partial<LineupFormValues>, string]
  >)("rejects a missing %s", (_field, overrides, message) => {
    expect(validateLineupForm(makeFormValues(overrides))).toEqual({
      valid: false,
      message,
    });
  });

  test("accepts a complete form", () => {
    expect(validateLineupForm(makeFormValues())).toEqual({
      valid: true,
      message: "",
    });
  });

  test("accepts a video-only lineup without images", () => {
    expect(validateLineupForm(makeFormValues({ images: [] }))).toEqual({
      valid: true,
      message: "",
    });
  });

  test.each([
    ["", "Enter a youtube video id"],
    ["invalid", "Enter a valid YouTube video ID or URL"],
  ])("still requires a valid video when images are absent: %s", (video, message) => {
    expect(validateLineupForm(makeFormValues({ images: [], video }))).toEqual({
      valid: false,
      message,
    });
  });
});

describe("image normalization", () => {
  test("converts image tags without changing their order", () => {
    expect(imageTagsToUrls(makeFormValues().images)).toEqual([
      "https://example.com/first.jpg",
      "https://example.com/second.jpg",
    ]);
  });

  test("trims surrounding whitespace in image URLs", () => {
    expect(imageTagsToUrls([{ id: "one", text: " https://example.com/a.jpg " }]))
      .toEqual(["https://example.com/a.jpg"]);
  });
});

describe("lineup mutation payloads", () => {
  test("builds an add payload from select options and image tags", () => {
    expect(buildAddPayload(makeFormValues(), "video-id")).toEqual({
      name: "Ascent recon",
      description: "Stand in the corner and aim at the roof.",
      agent: 13,
      ability: 1,
      mapId: 1,
      tags: [1, 5],
      images: [
        "https://example.com/first.jpg",
        "https://example.com/second.jpg",
      ],
      video: "video-id",
      credits: "https://example.com/source",
      x: 100,
      y: 200,
      startX: 300,
      startY: 400,
    });
  });

  test.each([
    { agent: null },
    { ability: null },
  ] satisfies Array<Partial<LineupFormValues>>)(
    "refuses to build an add payload without its select values",
    (overrides) => {
      expect(() =>
        buildAddPayload(makeFormValues(overrides), "video-id")
      ).toThrow("Agent and ability are required");
    }
  );

  test("builds an edit payload with the stable ID and stored video ID", () => {
    expect(buildEditPayload(makeFormValues(), "lineup-id")).toMatchObject({
      id: "lineup-id",
      video: "abcdefghijk",
      agent: 13,
      mapId: 1,
    });
  });

  test("normalizes video URLs in edit payloads", () => {
    expect(
      buildEditPayload(
        makeFormValues({ video: "https://www.youtube.com/watch?v=abcdefghijk" }),
        "lineup-id"
      ).video
    ).toBe("abcdefghijk");
  });

  test.each([
    "https://youtu.be/04K6YaRNtE8?t=70",
    "04K6YaRNtE8?start=70",
  ])("preserves a timestamp through form validation and editing: %s", (video) => {
    const state = makeFormValues({ video });
    expect(validateLineupForm(state).valid).toBe(true);
    expect(buildEditPayload(state, "lineup-id")).toMatchObject({
      id: "lineup-id", video: "04K6YaRNtE8?start=70",
    });
  });

  test("does not submit an invalid embed ID in an edit payload", () => {
    expect(() =>
      buildEditPayload(makeFormValues({ video: "invalid" }), "lineup-id")
    ).toThrow("Enter a valid YouTube video ID or URL");
  });

  test("uses the original map for a delete payload", () => {
    expect(buildDeletePayload("lineup-id", 7)).toEqual({
      id: "lineup-id",
      mapId: 7,
    });
  });
});

describe("lineup mutation requests", () => {
  const addPayload = buildAddPayload(makeFormValues(), "abcdefghijk");
  const editPayload = buildEditPayload(makeFormValues(), "lineup-id");
  const deletePayload = buildDeletePayload("lineup-id", 1);

  test.each<MutationRequestArguments>([
    ["add", "secret-key", addPayload],
    ["edit", "secret-key", editPayload],
    ["delete", "secret-key", deletePayload],
  ])(
    "creates the expected %s request headers and JSON body",
    (...args) => {
      const [requestType, , payload] = args;
      expect(
        createMutationRequest(...args)
      ).toEqual({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "secret-key",
          "request-type": requestType,
        },
        body: JSON.stringify(payload),
      });
    }
  );

  test("posts to the shared API URL and returns the response body", async () => {
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetcher.mockResolvedValue(responseWithText("updated"));

    await expect(
      sendLineupMutation("edit", "secret-key", editPayload, { fetcher })
    ).resolves.toBe("updated");
    expect(fetcher).toHaveBeenCalledWith(
      API_URL,
      createMutationRequest("edit", "secret-key", editPayload)
    );
  });

  test("supports an injected URL for isolated callers and tests", async () => {
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetcher.mockResolvedValue(responseWithText("created", { status: 201 }));

    await sendLineupMutation("add", "secret-key", addPayload, {
      fetcher,
      url: "https://example.test/lineups",
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://example.test/lineups",
      expect.objectContaining({ method: "POST" })
    );
  });

  test("rejects a non-success response with its status and body", async () => {
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetcher.mockResolvedValue(
      responseWithText("invalid api key", { ok: false, status: 403 })
    );

    await expect(
      sendLineupMutation("delete", "bad-key", deletePayload, { fetcher })
    ).rejects.toThrow(
      "Lineup delete request failed with status 403: invalid api key"
    );
  });

  test("does not turn a network rejection into a false success", async () => {
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetcher.mockRejectedValue(new Error("network unavailable"));

    await expect(
      sendLineupMutation(
        "edit",
        "secret-key",
        editPayload,
        { fetcher }
      )
    ).rejects.toThrow("network unavailable");
  });
});
