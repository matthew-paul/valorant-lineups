import { useEffect, useMemo, useRef, useState } from "react";
import { MdReplay } from "react-icons/md";
import { loadYouTubePlayerApi, type YouTubePlayer } from "../../services/youtube-player";
import { normalizeYouTubeVideo } from "../../services/youtube-video";

export interface YoutubeEmbedProps {
  embedId: string;
}

const formatTimestamp = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${remainder}`
    : `${minutes}:${remainder}`;
};

const VideoPlayer = ({ video }: { video: string }): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const url = useMemo(() => {
    const embedUrl = new URL(`https://www.youtube.com/embed/${video}`);
    embedUrl.searchParams.set("rel", "0");
    embedUrl.searchParams.set("enablejsapi", "1");
    embedUrl.searchParams.set("origin", window.location.origin);
    return embedUrl.toString();
  }, [video]);
  const startSeconds = Number(new URL(url).searchParams.get("start") ?? 0);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    // YouTube removes the iframe on destroy; keep its DOM inside a React-owned host.
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.title = "Embedded youtube";
    iframe.setAttribute("frameborder", "0");
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    container.appendChild(iframe);

    let disposed = false;
    let player: YouTubePlayer | undefined;
    void loadYouTubePlayerApi().then((api) => {
      if (disposed) return;
      player = new api.Player(iframe, {
        events: {
          onReady: () => {
            if (disposed || player === undefined) return;
            playerRef.current = player;
            setStatus("ready");
          },
          onError: () => {
            if (!disposed) setStatus("unavailable");
          },
        },
      });
    }).catch(() => {
      if (!disposed) setStatus("unavailable");
    });

    return () => {
      disposed = true;
      playerRef.current = null;
      player?.destroy();
      iframe.remove();
    };
  }, [url]);

  const replay = (): void => {
    playerRef.current?.seekTo(startSeconds, true);
    playerRef.current?.playVideo();
  };

  return (
    <>
      <div className="video-controls">
        <button
          type="button"
          className="video-replay"
          disabled={status !== "ready"}
          onClick={replay}
        >
          <MdReplay aria-hidden="true" />
          Replay from {formatTimestamp(startSeconds)}
        </button>
        {status === "unavailable" && (
          <p role="status">Replay unavailable. Use the video controls.</p>
        )}
      </div>
      <div className="video-responsive" ref={containerRef} />
    </>
  );
};

const YoutubeEmbed = ({ embedId }: YoutubeEmbedProps): JSX.Element | null => {
  const video = normalizeYouTubeVideo(embedId);
  return video === null ? null : <VideoPlayer key={video} video={video} />;
};

export default YoutubeEmbed;
