import type { OrderDraft, OrderValidationContext } from "./order-schemas";
import { orderDraftSchema } from "./order-schemas";
import type { OrderValidationIssue } from "./order-validation";
import { validateOrderDraft } from "./order-validation";

/**
 * Canonical order intent produced after draft parsing and validation.
 *
 * Intent creation never rounds, snaps, or otherwise repairs invalid trading
 * values. Invalid drafts return issues so the user can correct them explicitly.
 */
export type OrderIntent = OrderDraft;

export type OrderIntentResult =
  | {
      valid: true;
      order: OrderIntent;
      issues: [];
    }
  | {
      valid: false;
      issues: OrderValidationIssue[];
    };

/**
 * Validates and normalizes a draft into the exact order intent a host may
 * review before sending it to a broker adapter.
 *
 * Normalization removes fields that are irrelevant to the selected order type,
 * such as a stale limit price on a market order. It does not perform broker
 * submission or mutate numeric values.
 */
export function createOrderIntent(
  draft: OrderDraft,
  context: OrderValidationContext,
): OrderIntentResult {
  const validation = validateOrderDraft(draft, context);

  if (!validation.valid) {
    return {
      valid: false,
      issues: validation.issues,
    };
  }

  const parsedDraft = orderDraftSchema.parse(draft);

  return {
    valid: true,
    order: normalizeOrderIntent(parsedDraft),
    issues: [],
  };
}

function normalizeOrderIntent(draft: OrderDraft): OrderIntent {
  return {
    symbol: draft.symbol,
    assetClass: draft.assetClass,
    side: draft.side,
    type: draft.type,
    ...(draft.tif === undefined ? {} : { tif: draft.tif }),
    ...(draft.quantity === undefined ? {} : { quantity: draft.quantity }),
    ...(draft.notional === undefined ? {} : { notional: draft.notional }),
    ...(draft.type === "limit" && draft.limitPrice !== undefined
      ? { limitPrice: draft.limitPrice }
      : {}),
    ...(draft.extendedHours === undefined
      ? {}
      : { extendedHours: draft.extendedHours }),
  };
}
