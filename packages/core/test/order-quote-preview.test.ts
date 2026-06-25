import { describe, expect, it } from "vitest";
import { orderQuotePreviewSchema } from "../src/order";

const validPreview = {
  previewId: "preview-123",
  estimatedFillPx: 101,
  estimatedNotional: 202,
  slippageBps: 25,
  observedAt: 1000,
  expiresAt: 5000,
};

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
        observedAt: 1000,
        expiresAt: 1000,
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
        estimatedFillPx: 0,
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
      name: "fractional observed timestamp",
      preview: {
        ...validPreview,
        observedAt: 1000.5,
      },
    },
    {
      name: "expiration before observation",
      preview: {
        ...validPreview,
        observedAt: 1000,
        expiresAt: 999,
      },
    },
  ])("rejects $name", ({ preview }) => {
    expect(orderQuotePreviewSchema.safeParse(preview).success).toBe(false);
  });
});
