import type { YouTubePlayerApi } from "./youtube-player";

const youtubeWindow = window as Window & {
  YT?: YouTubePlayerApi;
  onYouTubeIframeAPIReady?: () => void;
};

const makeApi = (): YouTubePlayerApi => ({
  Player: jest.fn(() => ({
    seekTo: jest.fn(),
    playVideo: jest.fn(),
    destroy: jest.fn(),
  })),
});

describe("loadYouTubePlayerApi", () => {
  let loadYouTubePlayerApi: typeof import("./youtube-player").loadYouTubePlayerApi;
  let scripts: HTMLScriptElement[];

  beforeEach(async () => {
    jest.resetModules();
    jest.useFakeTimers();
    delete youtubeWindow.YT;
    delete youtubeWindow.onYouTubeIframeAPIReady;
    scripts = [];
    const appendChild = document.head.appendChild.bind(document.head);
    jest.spyOn(document.head, "appendChild").mockImplementation((node) => {
      if (node instanceof HTMLScriptElement) scripts.push(node);
      return appendChild(node);
    });
    ({ loadYouTubePlayerApi } = await import("./youtube-player"));
  });

  afterEach(() => {
    scripts.forEach((script) => script.remove());
    delete youtubeWindow.YT;
    delete youtubeWindow.onYouTubeIframeAPIReady;
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test("reuses a ready API without adding a script or changing its callback", async () => {
    const api = makeApi();
    const callback = jest.fn();
    youtubeWindow.YT = api;
    youtubeWindow.onYouTubeIframeAPIReady = callback;

    await expect(loadYouTubePlayerApi()).resolves.toBe(api);
    expect(scripts).toHaveLength(0);
    expect(youtubeWindow.onYouTubeIframeAPIReady).toBe(callback);
  });

  test("shares one pending script and chains then restores an existing callback", async () => {
    const callback = jest.fn();
    youtubeWindow.onYouTubeIframeAPIReady = callback;
    const first = loadYouTubePlayerApi();
    const second = loadYouTubePlayerApi();

    expect(second).toBe(first);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe("https://www.youtube.com/iframe_api");
    expect(scripts[0].async).toBe(true);
    const api = makeApi();
    youtubeWindow.YT = api;
    youtubeWindow.onYouTubeIframeAPIReady?.();

    await expect(first).resolves.toBe(api);
    await expect(second).resolves.toBe(api);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(youtubeWindow.onYouTubeIframeAPIReady).toBe(callback);
    expect(jest.getTimerCount()).toBe(0);
  });

  test("rejects script failures, restores callbacks, and allows a fresh retry", async () => {
    const callback = jest.fn();
    youtubeWindow.onYouTubeIframeAPIReady = callback;
    const failed = loadYouTubePlayerApi();
    scripts[0].dispatchEvent(new Event("error"));
    await expect(failed).rejects.toThrow("could not load");

    expect(scripts[0].isConnected).toBe(false);
    expect(youtubeWindow.onYouTubeIframeAPIReady).toBe(callback);
    expect(jest.getTimerCount()).toBe(0);
    const retry = loadYouTubePlayerApi();
    expect(retry).not.toBe(failed);
    expect(scripts).toHaveLength(2);
    const api = makeApi();
    youtubeWindow.YT = api;
    youtubeWindow.onYouTubeIframeAPIReady?.();
    await expect(retry).resolves.toBe(api);
  });

  test("rejects stalled loading without overwriting a newer ready callback", async () => {
    const pending = loadYouTubePlayerApi();
    const replacement = jest.fn();
    youtubeWindow.onYouTubeIframeAPIReady = replacement;
    jest.advanceTimersByTime(30000);
    await expect(pending).rejects.toThrow("could not load");

    expect(scripts[0].isConnected).toBe(false);
    expect(youtubeWindow.onYouTubeIframeAPIReady).toBe(replacement);
    expect(replacement).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  test("rejects a readiness callback without a usable API and removes its callback", async () => {
    const pending = loadYouTubePlayerApi();
    youtubeWindow.onYouTubeIframeAPIReady?.();
    await expect(pending).rejects.toThrow("could not load");

    expect(youtubeWindow.onYouTubeIframeAPIReady).toBeUndefined();
    expect(scripts[0].isConnected).toBe(false);
  });
});
