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
  destroy: jest.Mock;
  ready: () => void;
  error: () => void;
}[] = [];
const createPlayer = (iframe: HTMLIFrameElement, options: ConstructorParameters<YouTubePlayerApi["Player"]>[1]) => {
  const player = {
    seekTo: jest.fn(),
    playVideo: jest.fn(),
    destroy: jest.fn(() => iframe.remove()),
    ready: options.events.onReady,
    error: options.events.onError,
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
    expect(src.searchParams.get("origin")).toBe(window.location.origin);
    expect(src.searchParams.has("list")).toBe(false);
    expect(src.searchParams.has("autoplay")).toBe(false);
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
    expect(await screen.findByRole("status")).toHaveTextContent("Replay unavailable");
    expect(screen.getByTitle("Embedded youtube")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Replay from 1:10" })).toBeDisabled();
  });

  test("disables replay if the player reports an error", async () => {
    render(<YoutubeEmbed embedId="04K6YaRNtE8" />);
    await readyPlayer();
    act(() => players[0].error());
    expect(screen.getByRole("button", { name: "Replay from 0:00" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Use the video controls");
  });

  test("ignores readiness from a replaced player and destroys players on unmount", async () => {
    const { rerender, unmount } = render(<YoutubeEmbed embedId="04K6YaRNtE8?start=70" />);
    await waitFor(() => expect(players).toHaveLength(1));
    rerender(<YoutubeEmbed embedId="04K6YaRNtE8?start=90" />);
    act(() => players[0].ready());
    expect(screen.getByRole("button", { name: "Replay from 1:30" })).toBeDisabled();
    await readyPlayer(1);
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
