import { useEffect, useMemo, useRef, useState } from "react";
import { MdPause, MdPlayArrow, MdReplay } from "react-icons/md";
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

interface PlaybackPosition {
  seconds: number;
  playing: boolean;
  rate: number;
  volume: number;
  muted: boolean;
}

const isPlayingState = (state: number): boolean => state === 1 || state === 3;

const readPlaybackPosition = (player: YouTubePlayer | null, initialSeconds: number): PlaybackPosition | null => {
  if (player === null) return null;
  try {
    const state = player.getPlayerState();
    // Before playback, getCurrentTime can be zero despite a saved start parameter.
    const seconds = state === -1 || state === 5 ? initialSeconds : player.getCurrentTime();
    return Number.isFinite(seconds) && seconds >= 0
      ? {
        seconds,
        playing: isPlayingState(state),
        rate: player.getPlaybackRate(),
        volume: player.getVolume(),
        muted: player.isMuted(),
      }
      : null;
  } catch {
    // Fall back to native controls even when the player cannot answer API calls.
    return null;
  }
};

const VideoPlayer = ({ video }: { video: string }): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const resumeRef = useRef<PlaybackPosition | null>(null);
  const [mode, setMode] = useState<"minimal" | "standard" | "fallback">("minimal");
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const url = useMemo(() => {
    const embedUrl = new URL(`https://www.youtube.com/embed/${video}`);
    embedUrl.searchParams.set("rel", "0");
    embedUrl.searchParams.set("enablejsapi", "1");
    embedUrl.searchParams.set("origin", window.location.origin);
    embedUrl.searchParams.set("playsinline", "1");
    return embedUrl.toString();
  }, [video]);
  const startSeconds = Number(new URL(url).searchParams.get("start") ?? 0);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    setReady(false);
    setPlaying(false);

    const embedUrl = new URL(url);
    embedUrl.searchParams.set("controls", mode === "minimal" ? "0" : "1");
    const resume = resumeRef.current;
    if (resume !== null) embedUrl.searchParams.set("start", String(Math.floor(resume.seconds)));
    if (mode === "fallback") embedUrl.searchParams.delete("enablejsapi");

    // YouTube removes the iframe on destroy; keep its DOM inside a React-owned host.
    const iframe = document.createElement("iframe");
    iframe.src = embedUrl.toString();
    iframe.title = "Embedded youtube";
    iframe.setAttribute("frameborder", "0");
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    container.appendChild(iframe);

    if (mode === "fallback") return () => iframe.remove();

    let disposed = false;
    let failed = false;
    let player: YouTubePlayer | undefined;
    const fail = (): void => {
      if (disposed || failed) return;
      failed = true;
      window.clearTimeout(readyTimeout);
      resumeRef.current = readPlaybackPosition(playerRef.current, resume?.seconds ?? startSeconds) ?? resume;
      playerRef.current = null;
      setReady(false);
      setMode("fallback");
    };
    // The API script can load even when the embedded player never becomes ready.
    const readyTimeout = window.setTimeout(fail, 30000);
    void loadYouTubePlayerApi().then((api) => {
      if (disposed || failed) return;
      player = new api.Player(iframe, {
        events: {
          onReady: () => {
            if (disposed || failed || player === undefined) return;
            window.clearTimeout(readyTimeout);
            playerRef.current = player;
            setReady(true);
            setPlaying(isPlayingState(player.getPlayerState()));
            if (resume !== null) {
              player.setPlaybackRate(resume.rate);
              player.setVolume(resume.volume);
              if (resume.muted) player.mute();
              else player.unMute();
              player.seekTo(resume.seconds, true);
              if (resume.playing) player.playVideo();
              else player.pauseVideo();
            }
          },
          onError: fail,
          onStateChange: ({ data }) => {
            if (!disposed && !failed) setPlaying(isPlayingState(data));
          },
        },
      });
    }).catch(fail);

    return () => {
      disposed = true;
      window.clearTimeout(readyTimeout);
      playerRef.current = null;
      player?.destroy();
      iframe.remove();
    };
  }, [url, mode, startSeconds]);

  const togglePlayback = (): void => {
    const player = playerRef.current;
    if (player === null) return;
    if (isPlayingState(player.getPlayerState())) player.pauseVideo();
    else player.playVideo();
  };

  const toggleControls = (): void => {
    resumeRef.current = readPlaybackPosition(playerRef.current, resumeRef.current?.seconds ?? startSeconds) ?? resumeRef.current;
    setMode(mode === "minimal" ? "standard" : "minimal");
  };

  const replay = (): void => {
    playerRef.current?.seekTo(startSeconds, true);
    playerRef.current?.playVideo();
  };

  return (
    <>
      <div className="video-controls">
        <button
          type="button"
          className="video-control"
          aria-label={playing ? "Pause video" : "Play video"}
          disabled={!ready}
          onClick={togglePlayback}
        >
          {playing ? <MdPause aria-hidden="true" /> : <MdPlayArrow aria-hidden="true" />}
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="video-control"
          disabled={!ready}
          onClick={replay}
        >
          <MdReplay aria-hidden="true" />
          Replay from {formatTimestamp(startSeconds)}
        </button>
        {mode !== "fallback" && (
          <button type="button" className="video-control" onClick={toggleControls}>
            {mode === "minimal" ? "Show YouTube controls" : "Hide YouTube controls"}
          </button>
        )}
        {mode === "fallback" && (
          <p role="status">Playback controls unavailable. Use the video controls.</p>
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
