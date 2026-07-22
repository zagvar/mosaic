import {
  addDecimals,
  compareDecimals,
  nonNegativeDecimalStringSchema,
  positiveDecimalStringSchema,
} from "@zagvar/decimal";
import { z } from "zod";
import { marketIdentitySchema } from "./market-identity.js";
import { orderIdentifierSchema } from "./order-identity.js";
import { orderSideSchema } from "./order-schemas.js";
import { orderStatusSchema } from "./order-status.js";
import { isoTimestampSchema } from "./timestamp.js";

/**
 * Order types that may appear in account order records.
 *
 * This is intentionally broader than the order-entry types currently supported
 * by TradeTicket. An OrdersPanel may display orders created by another client,
 * broker interface, API, or trading strategy.
 */
export const orderRecordTypeSchema = z.enum([
  "market",
  "limit",
  "stop",
  "stop_limit",
  "trailing_stop",
  "trailing_stop_limit",
  "other",
]);

/**
 * Time-in-force values that may appear in account order records.
 *
 * `gtd` and `other` are included for provider-neutral history display even
 * though the current TradeTicket does not create those instructions.
 */
export const orderRecordTifSchema = z.enum([
  "day",
  "gtc",
  "gtd",
  "opg",
  "cls",
  "ioc",
  "fok",
  "other",
]);

/**
 * Backend-authoritative actions currently available for an order.
 *
 * The UI must combine these capabilities with local mutation state. For
 * example, a cancel button is disabled while a cancellation request is
 * already pending.
 */
export const orderActionCapabilitiesSchema = z.object({
  cancel: z.boolean(),
  replace: z.boolean(),
});

/**
 * Monotonically increasing backend version used for deterministic
 * reconciliation when the backend can provide one.
 */
export const orderVersionSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);

const orderListItemBaseSchema = marketIdentitySchema.extend({
  orderId: orderIdentifierSchema,
  clientOrderId: orderIdentifierSchema.optional(),
  accountId: orderIdentifierSchema.optional(),

  /**
   * Replacement-chain relationships, when supplied by the backend.
   */
  replacesOrderId: orderIdentifierSchema.optional(),
  replacedByOrderId: orderIdentifierSchema.optional(),

  side: orderSideSchema,
  type: orderRecordTypeSchema,
  tif: orderRecordTifSchema.optional(),
  extendedHours: z.boolean().optional(),
  status: orderStatusSchema,
  version: orderVersionSchema.optional(),

  /**
   * Currency in which prices and requested notionals are expressed.
   */
  quoteCurrency: z.string().trim().min(1).max(16),

  /**
   * Exactly one requested amount must be present:
   *
   * - quantity: requested asset units, shares, or contracts
   * - notional: requested quote-currency value
   */
  quantity: positiveDecimalStringSchema.optional(),
  notional: positiveDecimalStringSchema.optional(),

  /**
   * Executed amount is always present, including "0" before the first fill.
   */
  filledQuantity: nonNegativeDecimalStringSchema,
  remainingQuantity: nonNegativeDecimalStringSchema.optional(),
  filledNotional: nonNegativeDecimalStringSchema.optional(),

  limitPrice: positiveDecimalStringSchema.optional(),
  stopPrice: positiveDecimalStringSchema.optional(),
  averageFillPrice: positiveDecimalStringSchema.optional(),

  submittedAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  completedAt: isoTimestampSchema.optional(),
  expiresAt: isoTimestampSchema.optional(),

  capabilities: orderActionCapabilitiesSchema,
});

/**
 * Lightweight provider-neutral order representation for order lists.
 *
 * Detailed fills, fees, lifecycle events, and status reasons belong in the
 * separate order-details contract so list responses stay compact.
 */
export const orderListItemSchema = orderListItemBaseSchema.superRefine(
  (order, context) => {
    const hasQuantity = order.quantity !== undefined;
    const hasNotional = order.notional !== undefined;

    const parsedQuantity = positiveDecimalStringSchema.safeParse(
      order.quantity,
    );
    const parsedFilledQuantity = nonNegativeDecimalStringSchema.safeParse(
      order.filledQuantity,
    );
    const parsedRemainingQuantity = nonNegativeDecimalStringSchema.safeParse(
      order.remainingQuantity,
    );

    if (hasQuantity === hasNotional) {
      context.addIssue({
        code: "custom",
        message: "Exactly one of quantity or notional must be provided.",
        path: ["quantity"],
      });
    }

    if (
      parsedQuantity.success &&
      parsedFilledQuantity.success &&
      compareDecimals(parsedFilledQuantity.data, parsedQuantity.data) > 0
    ) {
      context.addIssue({
        code: "custom",
        message: "filledQuantity must not exceed quantity.",
        path: ["filledQuantity"],
      });
    }

    if (
      parsedQuantity.success &&
      parsedFilledQuantity.success &&
      parsedRemainingQuantity.success &&
      compareDecimals(
        addDecimals(parsedFilledQuantity.data, parsedRemainingQuantity.data),
        parsedQuantity.data,
      ) > 0
    ) {
      context.addIssue({
        code: "custom",
        message:
          "filledQuantity and remainingQuantity must not exceed quantity.",
        path: ["remainingQuantity"],
      });
    }

    if (order.replacesOrderId === order.orderId) {
      context.addIssue({
        code: "custom",
        message: "An order cannot replace itself.",
        path: ["replacesOrderId"],
      });
    }

    if (order.replacedByOrderId === order.orderId) {
      context.addIssue({
        code: "custom",
        message: "An order cannot be replaced by itself.",
        path: ["replacedByOrderId"],
      });
    }

    if (
      order.replacesOrderId !== undefined &&
      order.replacesOrderId === order.replacedByOrderId
    ) {
      context.addIssue({
        code: "custom",
        message:
          "replacesOrderId and replacedByOrderId must identify different orders.",
        path: ["replacedByOrderId"],
      });
    }

    if (order.tif === "gtd" && order.expiresAt === undefined) {
      context.addIssue({
        code: "custom",
        message: "expiresAt is required for a good-til-date order.",
        path: ["expiresAt"],
      });
    }

    if (
      (order.type === "limit" || order.type === "stop_limit") &&
      order.limitPrice === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "A limit price is required for this order type.",
        path: ["limitPrice"],
      });
    }

    if (
      (order.type === "stop" || order.type === "stop_limit") &&
      order.stopPrice === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "A stop price is required for this order type.",
        path: ["stopPrice"],
      });
    }
  },
);

export type OrderRecordType = z.infer<typeof orderRecordTypeSchema>;
export type OrderRecordTif = z.infer<typeof orderRecordTifSchema>;
export type OrderActionCapabilities = z.infer<
  typeof orderActionCapabilitiesSchema
>;
export type OrderListItem = z.infer<typeof orderListItemSchema>;
export type OrderVersion = z.infer<typeof orderVersionSchema>;
