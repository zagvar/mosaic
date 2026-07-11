import { z } from "zod";

/**
 * An ISO 8601 timestamp with an explicit timezone.
 *
 * Public market-data contracts use strings so they remain unambiguous across
 * JSON, WebSockets, servers, browsers, and storage. Consumers may convert the
 * value to epoch time at their application boundary when required.
 */
export const isoTimestampSchema = z.iso.datetime({
  offset: true,
});

export type IsoTimestamp = z.infer<typeof isoTimestampSchema>;
