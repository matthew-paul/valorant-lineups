export interface YouTubePlayer {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  destroy: () => void;
}

export interface YouTubePlayerApi {
  Player: new (
    iframe: HTMLIFrameElement,
    options: { events: { onReady: () => void; onError: () => void } }
  ) => YouTubePlayer;
}

type YouTubeWindow = Window & {
  YT?: YouTubePlayerApi;
  onYouTubeIframeAPIReady?: () => void;
};

let pendingApi: Promise<YouTubePlayerApi> | undefined;

export const loadYouTubePlayerApi = (): Promise<YouTubePlayerApi> => {
  const youtubeWindow = window as YouTubeWindow;
  if (typeof youtubeWindow.YT?.Player === "function") {
    return Promise.resolve(youtubeWindow.YT);
  }
  if (pendingApi) return pendingApi;

  pendingApi = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const previousReady = youtubeWindow.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => fail(), 30000);

    const cleanup = (): void => {
      window.clearTimeout(timeout);
      script.removeEventListener("error", fail);
      if (youtubeWindow.onYouTubeIframeAPIReady === ready) {
        if (previousReady) {
          youtubeWindow.onYouTubeIframeAPIReady = previousReady;
        } else {
          delete youtubeWindow.onYouTubeIframeAPIReady;
        }
      }
    };

    const fail = (): void => {
      cleanup();
      script.remove();
      pendingApi = undefined;
      reject(new Error("The YouTube player controls could not load."));
    };

    const ready = (): void => {
      if (typeof youtubeWindow.YT?.Player === "function") {
        cleanup();
        resolve(youtubeWindow.YT);
      } else {
        fail();
      }
      previousReady?.call(window);
    };

    youtubeWindow.onYouTubeIframeAPIReady = ready;
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.addEventListener("error", fail);
    document.head.appendChild(script);
  });

  return pendingApi;
};
