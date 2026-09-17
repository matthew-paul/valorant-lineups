const parseStartSeconds = (value: string | null): number => {
  if (value === null || value === "") return 0;

  let seconds: number;
  if (/^\d+$/.test(value)) {
    seconds = Number(value);
  } else {
    const duration = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
    if (duration === null) return 0;
    seconds = Number(duration[1] ?? 0) * 3600
      + Number(duration[2] ?? 0) * 60
      + Number(duration[3] ?? 0);
  }

  return Number.isSafeInteger(seconds) ? seconds : 0;
};

// Keep the existing string field and bare IDs, adding only a normalized start time.
export const normalizeYouTubeVideo = (input: string): string | null => {
  const trimmed = input.trim();
  const validId = /^[a-zA-Z0-9_-]{11}$/;
  if (validId.test(trimmed)) return trimmed;

  try {
    // Accept saved ID?start=seconds values when an existing lineup is edited.
    const url = new URL(
      /^[a-zA-Z0-9_-]{11}[?#]/.test(trimmed)
        ? `https://youtu.be/${trimmed}`
        : trimmed
    );
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;

    let videoId: string | null = null;
    if (url.hostname === "youtu.be") {
      videoId = /^\/([^/]+)\/?$/.exec(url.pathname)?.[1] ?? null;
    } else if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(
        url.hostname
      )
    ) {
      videoId =
        url.pathname === "/watch"
          ? url.searchParams.get("v")
          : /^\/(?:embed|shorts|live)\/([^/]+)\/?$/.exec(url.pathname)?.[1] ?? null;
    }

    if (videoId === null || !validId.test(videoId)) return null;
    const startSeconds = parseStartSeconds(
      url.searchParams.get("start")
        ?? url.searchParams.get("t")
        ?? new URLSearchParams(url.hash.slice(1)).get("t")
    );
    return startSeconds > 0 ? `${videoId}?start=${startSeconds}` : videoId;
  } catch {
    return null;
  }
};
