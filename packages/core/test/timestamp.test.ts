import { describe, expect, it } from "vitest";
import { isoTimestampSchema } from "../src/order";

describe("isoTimestampSchema", () => {
  it.each([
    "2026-01-01T00:00:00.000Z",
    "2021-02-22T15:51:45.335689322Z",
    "2026-01-01T11:00:00+11:00",
  ])("accepts an ISO timestamp with timezone: %s", (timestamp) => {
    expect(isoTimestampSchema.safeParse(timestamp).success).toBe(true);
  });

  it.each(["2026-01-01T00:00:00", "not-a-date", "", 1_767_225_600_000])(
    "rejects an ambiguous or invalid timestamp: %s",
    (timestamp) => {
      expect(isoTimestampSchema.safeParse(timestamp).success).toBe(false);
    },
  );
});
