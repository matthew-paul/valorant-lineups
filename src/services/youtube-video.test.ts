import { normalizeYouTubeVideo } from "./youtube-video";

describe("normalizeYouTubeVideo", () => {
  test.each([
    ["https://youtu.be/abcdefghijk", "abcdefghijk"],
    [" https://youtu.be/abcdefghijk?t=30 ", "abcdefghijk?start=30"],
    ["https://youtu.be/a-b_c123456#fragment", "a-b_c123456"],
    ["abcdefghijk", "abcdefghijk"],
    [" abcdefghijk ", "abcdefghijk"],
    ["http://youtu.be/abcdefghijk", "abcdefghijk"],
    ["https://www.youtube.com/watch?v=abcdefghijk&t=30", "abcdefghijk?start=30"],
    ["https://m.youtube.com/watch?v=abcdefghijk", "abcdefghijk"],
    ["https://youtube.com/shorts/abcdefghijk", "abcdefghijk"],
    ["https://www.youtube.com/embed/abcdefghijk", "abcdefghijk"],
    ["https://www.youtube.com/live/abcdefghijk", "abcdefghijk"],
    ["https://youtu.be/04K6YaRNtE8?t=70", "04K6YaRNtE8?start=70"],
    ["https://youtu.be/04K6YaRNtE8/?si=share&t=70s", "04K6YaRNtE8?start=70"],
    ["https://www.youtube.com/watch?t=1m10s&v=04K6YaRNtE8", "04K6YaRNtE8?start=70"],
    ["https://m.youtube.com/watch?v=04K6YaRNtE8&t=1h2m3s", "04K6YaRNtE8?start=3723"],
    ["https://youtube.com/shorts/04K6YaRNtE8?t=2m", "04K6YaRNtE8?start=120"],
    ["https://www.youtube.com/live/04K6YaRNtE8?t=1h", "04K6YaRNtE8?start=3600"],
    ["https://www.youtube.com/embed/04K6YaRNtE8?start=70&rel=1", "04K6YaRNtE8?start=70"],
    ["https://youtu.be/04K6YaRNtE8#t=1m10s", "04K6YaRNtE8?start=70"],
    ["https://youtu.be/04K6YaRNtE8?t=30&start=70#t=90", "04K6YaRNtE8?start=70"],
    ["https://youtu.be/04K6YaRNtE8?t=70#t=90", "04K6YaRNtE8?start=70"],
    ["04K6YaRNtE8?start=70", "04K6YaRNtE8?start=70"],
    ["04K6YaRNtE8?t=70", "04K6YaRNtE8?start=70"],
    ["https://youtu.be/04K6YaRNtE8?si=share&list=ignored#fragment", "04K6YaRNtE8"],
    ["https://youtu.be/04K6YaRNtE8?t=0", "04K6YaRNtE8"],
  ])("normalizes %s and retains its start time on subsequent saves", (input, expected) => {
    expect(normalizeYouTubeVideo(input)).toBe(expected);
    expect(normalizeYouTubeVideo(expected)).toBe(expected);
  });

  test.each([
    "", "too-short", "abcdefghijkl",
    "https://youtu.be/",
    "https://youtu.be/abcdefghijk/extra",
    "https://www.youtube.com/watch?v=too-short",
    "https://www.youtube.com/watch?list=abcdefghijk",
    "https://youtube.com.example.test/watch?v=abcdefghijk",
    "https://example.test/abcdefghijk",
    "https://youtu.be/abc!efghijk",
    "https://youtu.be/abc%20defghi",
    "ftp://youtu.be/abcdefghijk",
    "https://www.youtube-nocookie.com/embed/abcdefghijk",
    "youtu.be/abcdefghijk?t=70",
  ])("rejects an unsupported video input: %s", (input) => {
    expect(normalizeYouTubeVideo(input)).toBeNull();
  });

  test.each([
    "", "-70", "1.5", "garbage", "1m10oops", "1m-10s", "Infinity",
    "9007199254740992", "9007199254740991h",
  ])("ignores a malformed timestamp without losing the video: %s", (time) => {
    expect(normalizeYouTubeVideo(`https://youtu.be/04K6YaRNtE8?t=${time}`))
      .toBe("04K6YaRNtE8");
  });
});
