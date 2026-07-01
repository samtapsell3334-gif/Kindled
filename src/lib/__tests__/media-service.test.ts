import { describe, it, expect } from "vitest";
import { formatClock, mediaConstraints, pickMimeType, MAX_MEMORY_SEC } from "@/lib/media-service";

/**
 * Media-service helper tests — the pure, environment-guarded bits of the Memory
 * capture pipeline (clock formatting, capture constraints, codec negotiation).
 */
describe("formatClock", () => {
  it("formats seconds as m:ss and floors negatives to 0:00", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(-4)).toBe("0:00");
  });
});

describe("mediaConstraints", () => {
  it("requests camera + mic for video, mic only for voice", () => {
    const video = mediaConstraints("video");
    expect(video.video).toBeTruthy();
    expect(video.audio).toBe(true);

    const voice = mediaConstraints("voice");
    expect(voice.audio).toBe(true);
    expect(voice.video).toBeUndefined();
  });
});

describe("pickMimeType", () => {
  it("returns \"\" when MediaRecorder is unavailable (e.g. server / node)", () => {
    // No MediaRecorder in the node test env — the guard must return empty, not throw.
    expect(pickMimeType("video")).toBe("");
    expect(pickMimeType("voice")).toBe("");
  });
});

describe("MAX_MEMORY_SEC", () => {
  it("keeps Memories short", () => {
    expect(MAX_MEMORY_SEC).toBe(30);
  });
});
