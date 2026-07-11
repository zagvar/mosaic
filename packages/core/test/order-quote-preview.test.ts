import { describe, expect, it } from "vitest";
import { orderQuotePreviewSchema } from "../src/order";

const validPreview = {
  previewId: "preview-123",
  estimatedFillPrice: 101,
  estimatedNotional: 202,
  slippageBps: 25,
  createdAt: isoTimestamp(1000),
  expiresAt: isoTimestamp(5000),
};

function isoTimestamp(milliseconds: number): string {
  return new Date(milliseconds).toISOString();
}

describe("orderQuotePreviewSchema", () => {
  it("parses a valid backend preview", () => {
    expect(
      orderQuotePreviewSchema.parse({
        ...validPreview,
        previewId: " preview-123 ",
        fees: [
          {
            type: "commission",
            amount: 0.25,
            currency: " USD ",
          },
        ],
      }),
    ).toEqual({
      ...validPreview,
      fees: [
        {
          type: "commission",
          amount: 0.25,
          currency: "USD",
        },
      ],
    });
  });

  it("allows a preview to expire immediately", () => {
    expect(
      orderQuotePreviewSchema.safeParse({
        previewId: "preview-123",
        createdAt: isoTimestamp(1000),
        expiresAt: isoTimestamp(1000),
      }).success,
    ).toBe(true);
  });

  it.each([
    {
      name: "empty preview identifier",
      preview: {
        ...validPreview,
        previewId: " ",
      },
    },
    {
      name: "non-positive fill price",
      preview: {
        ...validPreview,
        estimatedFillPrice: 0,
      },
    },
    {
      name: "negative estimated notional",
      preview: {
        ...validPreview,
        estimatedNotional: -1,
      },
    },
    {
      name: "negative slippage",
      preview: {
        ...validPreview,
        slippageBps: -1,
      },
    },
    {
      name: "invalid creation timestamp",
      preview: {
        ...validPreview,
        createdAt: "not-a-date",
      },
    },
    {
      name: "expiration before creation",
      preview: {
        ...validPreview,
        createdAt: isoTimestamp(1000),
        expiresAt: isoTimestamp(999),
      },
    },
  ])("rejects $name", ({ preview }) => {
    expect(orderQuotePreviewSchema.safeParse(preview).success).toBe(false);
  });
});
