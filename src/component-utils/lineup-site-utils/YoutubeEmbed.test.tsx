import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { loadYouTubePlayerApi, type YouTubePlayerApi } from "../../services/youtube-player";
import YoutubeEmbed from "./YoutubeEmbed";

jest.mock("../../services/youtube-player", () => ({
  loadYouTubePlayerApi: jest.fn(),
}));

const mockLoadApi = loadYouTubePlayerApi as jest.MockedFunction<typeof loadYouTubePlayerApi>;
const players: {
  seekTo: jest.Mock;
  playVideo: jest.Mock;
  pauseVideo: jest.Mock;
  getCurrentTime: jest.Mock;
  getPlayerState: jest.Mock;
  getPlaybackRate: jest.Mock;
  setPlaybackRate: jest.Mock;
  getVolume: jest.Mock;
  setVolume: jest.Mock;
  isMuted: jest.Mock;
  mute: jest.Mock;
  unMute: jest.Mock;
  destroy: jest.Mock;
  ready: () => void;
  error: () => void;
  stateChange: (event: { data: number }) => void;
}[] = [];
const createPlayer = (iframe: HTMLIFrameElement, options: ConstructorParameters<YouTubePlayerApi["Player"]>[1]) => {
  const player = {
    seekTo: jest.fn(),
    playVideo: jest.fn(),
    pauseVideo: jest.fn(),
    getCurrentTime: jest.fn(() => 0),
    getPlayerState: jest.fn(() => -1),
    getPlaybackRate: jest.fn(() => 1),
    setPlaybackRate: jest.fn(),
    getVolume: jest.fn(() => 100),
    setVolume: jest.fn(),
    isMuted: jest.fn(() => false),
    mute: jest.fn(),
    unMute: jest.fn(),
    destroy: jest.fn(() => iframe.remove()),
    ready: options.events.onReady,
    error: options.events.onError,
    stateChange: (event: { data: number }) => {
      player.getPlayerState.mockReturnValue(event.data);
      options.events.onStateChange(event);
    },
  };
  players.push(player);
  return player;
};
const mockPlayer = jest.fn(createPlayer);
const api: YouTubePlayerApi = { Player: mockPlayer };

const readyPlayer = async (index = 0): Promise<void> => {
  await waitFor(() => expect(players).toHaveLength(index + 1));
  act(() => players[index].ready());
};

describe("YoutubeEmbed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    players.length = 0;
    mockPlayer.mockImplementation(createPlayer);
    mockLoadApi.mockResolvedValue(api);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("does not render an invalid video value", () => {
    render(<YoutubeEmbed embedId="https://example.com/not-a-video" />);
    expect(screen.queryByTitle("Embedded youtube")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(mockLoadApi).not.toHaveBeenCalled();
  });

  test.each([
    "04K6YaRNtE8?start=70",
    "https://youtu.be/04K6YaRNtE8?t=70",
    "https://www.youtube.com/watch?v=04K6YaRNtE8&t=1m10s&list=ignored",
  ])("starts a timestamped video at 70 seconds: %s", (video) => {
    render(<YoutubeEmbed embedId={video} />);
    const src = new URL(screen.getByTitle("Embedded youtube").getAttribute("src") ?? "");
    expect(src.origin).toBe("https://www.youtube.com");
    expect(src.pathname).toBe("/embed/04K6YaRNtE8");
    expect(src.searchParams.get("start")).toBe("70");
    expect(src.searchParams.get("rel")).toBe("0");
    expect(src.searchParams.get("enablejsapi")).toBe("1");
    expect(src.searchParams.get("controls")).toBe("0");
    expect(src.searchParams.get("playsinline")).toBe("1");
    expect(src.searchParams.get("origin")).toBe(window.location.origin);
    expect(src.searchParams.has("list")).toBe(false);
    expect(src.searchParams.has("autoplay")).toBe(false);
  });

  test("plays and pauses from the external button without automatically starting on readiness", async () => {
    render(<YoutubeEmbed embedId="04K6YaRNtE8?start=70" />);
    const play = screen.getByRole("button", { name: "Play video" });
    expect(play).toBeDisabled();
    fireEvent.click(play);
    await readyPlayer();
    expect(players[0].playVideo).not.toHaveBeenCalled();
    expect(players[0].pauseVideo).not.toHaveBeenCalled();
    expect(play).toBeEnabled();

    fireEvent.click(play);
    expect(players[0].playVideo).toHaveBeenCalledTimes(1);
    expect(players[0].seekTo).not.toHaveBeenCalled();
    act(() => players[0].stateChange({ data: 1 }));
    const pause = screen.getByRole("button", { name: "Pause video" });
    expect(pause).toHaveTextContent("Pause");
    fireEvent.click(pause);
    expect(players[0].pauseVideo).toHaveBeenCalledTimes(1);
    act(() => players[0].stateChange({ data: 2 }));
    expect(screen.getByRole("button", { name: "Play video" })).toHaveTextContent("Play");
  });

  test.each([
    { state: -1, label: "Play video" },
    { state: 0, label: "Play video" },
    { state: 1, label: "Pause video" },
    { state: 2, label: "Play video" },
    { state: 3, label: "Pause video" },
    { state: 5, label: "Play video" },
  ])("reflects YouTube playback state $state as $label", async ({ state, label }) => {
    render(<YoutubeEmbed embedId="04K6YaRNtE8" />);
    await readyPlayer();
    act(() => players[0].stateChange({ data: state }));
    expect(screen.getByRole("button", { name: label })).toBeEnabled();
  });

  test.each([1, 3, 2])("preserves the current time and playback state %s when showing native controls", async (state) => {
    render(<YoutubeEmbed embedId="04K6YaRNtE8?start=70" />);
    await readyPlayer();
    players[0].getCurrentTime.mockReturnValue(93.5);
    players[0].getPlayerState.mockReturnValue(state);
    act(() => players[0].stateChange({ data: state }));

    fireEvent.click(screen.getByRole("button", { name: "Show YouTube controls" }));
    const src = new URL(screen.getByTitle("Embedded youtube").getAttribute("src") ?? "");
    expect(src.searchParams.get("controls")).toBe("1");
    expect(screen.getByRole("button", { name: "Hide YouTube controls" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Replay from 1:10" })).toBeDisabled();
    await readyPlayer(1);
    expect(players[0].destroy).toHaveBeenCalledTimes(1);
    expect(players[1].seekTo).toHaveBeenCalledWith(93.5, true);
    expect(players[1].playVideo).toHaveBeenCalledTimes(state === 1 || state === 3 ? 1 : 0);
    fireEvent.click(screen.getByRole("button", { name: "Replay from 1:10" }));
    expect(players[1].seekTo).toHaveBeenLastCalledWith(70, true);
  });

  test("preserves the paused position when hiding native controls again", async () => {
    render(<YoutubeEmbed embedId="04K6YaRNtE8?start=70" />);
    await readyPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Show YouTube controls" }));
    await readyPlayer(1);
    players[1].getCurrentTime.mockReturnValue(115.25);
    players[1].getPlayerState.mockReturnValue(2);

    fireEvent.click(screen.getByRole("button", { name: "Hide YouTube controls" }));
    const src = new URL(screen.getByTitle("Embedded youtube").getAttribute("src") ?? "");
    expect(src.searchParams.get("controls")).toBe("0");
    await readyPlayer(2);
    expect(players[2].seekTo).toHaveBeenCalledWith(115.25, true);
    expect(players[2].playVideo).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play video" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Replay from 1:10" })).toBeEnabled();
  });

  test.each([-1, 5])("keeps the saved timestamp when switching controls before playback in state %s", async (state) => {
    render(<YoutubeEmbed embedId="04K6YaRNtE8?start=70" />);
    await readyPlayer();
    players[0].getCurrentTime.mockReturnValue(0);
    players[0].getPlayerState.mockReturnValue(state);

    fireEvent.click(screen.getByRole("button", { name: "Show YouTube controls" }));
    const src = new URL(screen.getByTitle("Embedded youtube").getAttribute("src") ?? "");
    expect(src.searchParams.get("start")).toBe("70");
    await readyPlayer(1);
    expect(players[1].seekTo).toHaveBeenCalledWith(70, true);
    expect(players[1].playVideo).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Replay from 1:10" })).toBeEnabled();
  });

  test("allows native controls while waiting for the API", async () => {
    let resolveApi: (value: YouTubePlayerApi) => void = () => undefined;
    mockLoadApi.mockReturnValue(new Promise((resolve) => { resolveApi = resolve; }));
    render(<YoutubeEmbed embedId="04K6YaRNtE8?start=70" />);
    const showControls = screen.getByRole("button", { name: "Show YouTube controls" });
    expect(showControls).toBeEnabled();
    fireEvent.click(showControls);
    const src = new URL(screen.getByTitle("Embedded youtube").getAttribute("src") ?? "");
    expect(src.searchParams.get("controls")).toBe("1");
    expect(src.searchParams.get("start")).toBe("70");
    await act(async () => resolveApi(api));
    await readyPlayer();
    expect(screen.getAllByTitle("Embedded youtube")).toHaveLength(1);
    expect(players[0].playVideo).not.toHaveBeenCalled();
  });

  test.each([true, false])("keeps slow motion, volume, and muted=%s when hiding native controls", async (muted) => {
    render(<YoutubeEmbed embedId="04K6YaRNtE8?start=70" />);
    await readyPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Show YouTube controls" }));
    await readyPlayer(1);
    players[1].getCurrentTime.mockReturnValue(91);
    players[1].getPlayerState.mockReturnValue(1);
    players[1].getPlaybackRate.mockReturnValue(0.25);
    players[1].getVolume.mockReturnValue(25);
    players[1].isMuted.mockReturnValue(muted);

    fireEvent.click(screen.getByRole("button", { name: "Hide YouTube controls" }));
    await readyPlayer(2);
    expect(players[2].seekTo).toHaveBeenCalledWith(91, true);
    expect(players[2].setPlaybackRate).toHaveBeenCalledWith(0.25);
    expect(players[2].setVolume).toHaveBeenCalledWith(25);
    expect(players[2].mute).toHaveBeenCalledTimes(muted ? 1 : 0);
    expect(players[2].unMute).toHaveBeenCalledTimes(muted ? 0 : 1);
    expect(players[2].playVideo).toHaveBeenCalledTimes(1);
  });

  test("repeatedly seeks to the saved timestamp and resumes playback without reloading", async () => {
    render(<YoutubeEmbed embedId="https://youtu.be/04K6YaRNtE8?t=1m10s" />);
    const iframe = screen.getByTitle("Embedded youtube");
    const replay = screen.getByRole("button", { name: "Replay from 1:10" });
    expect(replay).toBeDisabled();
    fireEvent.click(replay);
    await readyPlayer();
    expect(players[0].seekTo).not.toHaveBeenCalled();
    expect(players[0].playVideo).not.toHaveBeenCalled();
    expect(replay).toBeEnabled();

    fireEvent.click(replay);
    fireEvent.click(replay);

    expect(players[0].seekTo).toHaveBeenNthCalledWith(1, 70, true);
    expect(players[0].seekTo).toHaveBeenNthCalledWith(2, 70, true);
    expect(players[0].playVideo).toHaveBeenCalledTimes(2);
    expect(players[0].seekTo.mock.invocationCallOrder[0])
      .toBeLessThan(players[0].playVideo.mock.invocationCallOrder[0]);
    expect(screen.getByTitle("Embedded youtube")).toBe(iframe);
    expect(players[0].destroy).not.toHaveBeenCalled();
  });

  test("keeps bare IDs working and updates replay for different timestamps and videos", async () => {
    const { rerender } = render(<YoutubeEmbed embedId="04K6YaRNtE8" />);
    const cases = [
      { video: "04K6YaRNtE8", time: "0:00", seconds: 0 },
      { video: "04K6YaRNtE8?start=70", time: "1:10", seconds: 70 },
      { video: "04K6YaRNtE8?start=90", time: "1:30", seconds: 90 },
      { video: "abcdefghijk?start=3723", time: "1:02:03", seconds: 3723 },
      { video: "04K6YaRNtE8", time: "0:00", seconds: 0 },
    ];
    for (let index = 0; index < cases.length; index += 1) {
      const { video, time, seconds } = cases[index];
      rerender(<YoutubeEmbed embedId={video} />);
      const replay = screen.getByRole("button", { name: `Replay from ${time}` });
      expect(replay).toBeDisabled();
      await readyPlayer(index);
      fireEvent.click(replay);
      expect(players[index].seekTo).toHaveBeenCalledWith(seconds, true);
      expect(players[index].playVideo).toHaveBeenCalledTimes(1);
      const src = new URL(screen.getByTitle("Embedded youtube").getAttribute("src") ?? "");
      expect(Number(src.searchParams.get("start") ?? 0)).toBe(seconds);
    }
    players.slice(0, -1).forEach((player) => expect(player.destroy).toHaveBeenCalledTimes(1));
  });

  test("keeps the iframe available when the API fails to load", async () => {
    mockLoadApi.mockRejectedValue(new Error("Network unavailable"));
    render(<YoutubeEmbed embedId="04K6YaRNtE8?start=70" />);
    expect(await screen.findByRole("status")).toHaveTextContent("Playback controls unavailable. Use the video controls.");
    expect(screen.getByTitle("Embedded youtube")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Replay from 1:10" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Play video" })).toBeDisabled();
    const src = new URL(screen.getByTitle("Embedded youtube").getAttribute("src") ?? "");
    expect(src.searchParams.get("controls")).toBe("1");
    expect(src.searchParams.get("start")).toBe("70");
    expect(screen.queryByRole("button", { name: /YouTube controls/ })).not.toBeInTheDocument();
  });

  test("disables replay if the player reports an error", async () => {
    render(<YoutubeEmbed embedId="04K6YaRNtE8" />);
    await readyPlayer();
    act(() => players[0].error());
    expect(screen.getByRole("button", { name: "Replay from 0:00" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Play video" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Use the video controls");
    const src = new URL(screen.getByTitle("Embedded youtube").getAttribute("src") ?? "");
    expect(src.searchParams.get("controls")).toBe("1");
    expect(screen.queryByRole("button", { name: /YouTube controls/ })).not.toBeInTheDocument();
    expect(players[0].destroy).toHaveBeenCalledTimes(1);
    act(() => {
      players[0].ready();
      players[0].stateChange({ data: 1 });
    });
    expect(screen.getByRole("button", { name: "Play video" })).toBeDisabled();
  });

  test("restores native controls if the constructed player never becomes ready", async () => {
    jest.useFakeTimers();
    render(<YoutubeEmbed embedId="04K6YaRNtE8?start=70" />);
    await act(async () => Promise.resolve());
    expect(players).toHaveLength(1);
    act(() => jest.advanceTimersByTime(30000));

    expect(screen.getByRole("status")).toHaveTextContent("Playback controls unavailable. Use the video controls.");
    const src = new URL(screen.getByTitle("Embedded youtube").getAttribute("src") ?? "");
    expect(src.searchParams.get("controls")).toBe("1");
    expect(screen.getByRole("button", { name: "Play video" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Replay from 1:10" })).toBeDisabled();
    expect(players[0].destroy).toHaveBeenCalledTimes(1);
    act(() => players[0].ready());
    expect(screen.getByRole("button", { name: "Play video" })).toBeDisabled();
    expect(jest.getTimerCount()).toBe(0);
  });

  test("clears the readiness timeout when ready and on unmount", async () => {
    jest.useFakeTimers();
    const { rerender, unmount } = render(<YoutubeEmbed embedId="04K6YaRNtE8" />);
    await act(async () => Promise.resolve());
    act(() => players[0].ready());
    expect(jest.getTimerCount()).toBe(0);
    act(() => jest.advanceTimersByTime(30000));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play video" })).toBeEnabled();

    rerender(<YoutubeEmbed embedId="abcdefghijk" />);
    await act(async () => Promise.resolve());
    unmount();
    expect(jest.getTimerCount()).toBe(0);
    expect(players[1].destroy).toHaveBeenCalledTimes(1);
  });

  test("ignores readiness from a replaced player and destroys players on unmount", async () => {
    const { rerender, unmount } = render(<YoutubeEmbed embedId="04K6YaRNtE8?start=70" />);
    await waitFor(() => expect(players).toHaveLength(1));
    rerender(<YoutubeEmbed embedId="04K6YaRNtE8?start=90" />);
    act(() => players[0].ready());
    expect(screen.getByRole("button", { name: "Replay from 1:30" })).toBeDisabled();
    await readyPlayer(1);
    act(() => {
      players[0].stateChange({ data: 1 });
      players[0].error();
    });
    expect(screen.getByRole("button", { name: "Play video" })).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    unmount();
    expect(players[0].destroy).toHaveBeenCalledTimes(1);
    expect(players[1].destroy).toHaveBeenCalledTimes(1);
  });

  test("does not construct a player when the API resolves after unmount", async () => {
    let resolveApi: (value: YouTubePlayerApi) => void = () => undefined;
    mockLoadApi.mockReturnValue(new Promise((resolve) => { resolveApi = resolve; }));
    const { unmount } = render(<YoutubeEmbed embedId="04K6YaRNtE8" />);
    unmount();
    await act(async () => resolveApi(api));
    expect(api.Player).not.toHaveBeenCalled();
  });

  test("supports StrictMode setup and cleanup without duplicate iframes or players", async () => {
    const { unmount } = render(
      <StrictMode><YoutubeEmbed embedId="04K6YaRNtE8?start=70" /></StrictMode>
    );
    await readyPlayer();
    expect(screen.getAllByTitle("Embedded youtube")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Replay from 1:10" }));
    expect(players[0].seekTo).toHaveBeenCalledWith(70, true);
    unmount();
    expect(players[0].destroy).toHaveBeenCalledTimes(1);
  });
});
