import { describe, expect, it } from "vitest";
import { downloadStamp } from "./utils";

describe("downloadStamp", () => {
  it("formats the download moment as year-month-day_hour-minute", () => {
    expect(downloadStamp(new Date(2026, 9, 21, 20, 6))).toBe("2026-10-21_20-06");
  });

  it("pads single-digit month, day, hour and minute", () => {
    expect(downloadStamp(new Date(2026, 0, 5, 9, 3))).toBe("2026-01-05_09-03");
  });

  it("avoids characters forbidden in file names", () => {
    const stamp = downloadStamp(new Date(2026, 11, 31, 23, 59));
    expect(stamp).toBe("2026-12-31_23-59");
    expect(stamp).not.toMatch(/[:/\\?*<>|"]/);
  });
});
