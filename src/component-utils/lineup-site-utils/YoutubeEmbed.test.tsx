import { render, screen } from "@testing-library/react";
import YoutubeEmbed from "./YoutubeEmbed";

describe("YoutubeEmbed", () => {
  test("does not render an invalid video value", () => {
    render(<YoutubeEmbed embedId="https://example.com/not-a-video" />);
    expect(screen.queryByTitle("Embedded youtube")).not.toBeInTheDocument();
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
    expect(src.searchParams.has("list")).toBe(false);
  });

  test("keeps bare IDs working and updates the timestamp for the same video", () => {
    const { rerender } = render(<YoutubeEmbed embedId="04K6YaRNtE8" />);
    expect(screen.getByTitle("Embedded youtube")).toHaveAttribute(
      "src", "https://www.youtube.com/embed/04K6YaRNtE8?rel=0"
    );
    rerender(<YoutubeEmbed embedId="04K6YaRNtE8?start=70" />);
    expect(screen.getByTitle("Embedded youtube")).toHaveAttribute(
      "src", "https://www.youtube.com/embed/04K6YaRNtE8?start=70&rel=0"
    );
    rerender(<YoutubeEmbed embedId="04K6YaRNtE8?start=90" />);
    expect(screen.getByTitle("Embedded youtube")).toHaveAttribute(
      "src", "https://www.youtube.com/embed/04K6YaRNtE8?start=90&rel=0"
    );
    rerender(<YoutubeEmbed embedId="04K6YaRNtE8" />);
    expect(screen.getByTitle("Embedded youtube")).toHaveAttribute(
      "src", "https://www.youtube.com/embed/04K6YaRNtE8?rel=0"
    );
  });
});
