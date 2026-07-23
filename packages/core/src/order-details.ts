import { z } from "zod";
import {
  orderLifecycleEventSchema,
  orderStatusReasonSchema,
} from "./order-event.js";
import { orderFeeSchema } from "./order-fees.js";
import { orderFillSchema } from "./order-fill.js";
import { orderListItemSchema } from "./order-record.js";

const maxOrderDetailItems = 10_000;

/**
 * Complete data required by the OrderDetails component.
 *
 * The lightweight order remains nested so the same validated record can be
 * shared between OrdersPanel and OrderDetails without duplicating fields.
 */
export const orderDetailsRecordSchema = z
  .object({
    order: orderListItemSchema,

    fills: z.array(orderFillSchema).max(maxOrderDetailItems),
    fees: z.array(orderFeeSchema).max(maxOrderDetailItems),
    events: z.array(orderLifecycleEventSchema).max(maxOrderDetailItems),

    /**
     * Current user-displayable explanation when the backend exposes one.
     *
     * Individual historical explanations remain attached to lifecycle events.
     */
    statusReason: orderStatusReasonSchema.optional(),
  })
  .superRefine((details, context) => {
    const { orderId } = details.order;

    const fillIds = new Set<string>();

    details.fills.forEach((fill, index) => {
      if (fill.orderId !== orderId) {
        context.addIssue({
          code: "custom",
          message: "Fill must belong to the detailed order.",
          path: ["fills", index, "orderId"],
        });
      }

      if (fillIds.has(fill.fillId)) {
        context.addIssue({
          code: "custom",
          message: "Fill identifiers must be unique.",
          path: ["fills", index, "fillId"],
        });
      }

      fillIds.add(fill.fillId);
    });

    const feeIds = new Set<string>();

    details.fees.forEach((fee, index) => {
      if (fee.orderId !== orderId) {
        context.addIssue({
          code: "custom",
          message: "Fee must belong to the detailed order.",
          path: ["fees", index, "orderId"],
        });
      }

      if (feeIds.has(fee.feeId)) {
        context.addIssue({
          code: "custom",
          message: "Fee identifiers must be unique.",
          path: ["fees", index, "feeId"],
        });
      }

      feeIds.add(fee.feeId);

      if (fee.fillId !== undefined && !fillIds.has(fee.fillId)) {
        context.addIssue({
          code: "custom",
          message: "Fee fillId must reference a fill in this order.",
          path: ["fees", index, "fillId"],
        });
      }
    });

    const eventIds = new Set<string>();

    details.events.forEach((event, index) => {
      if (event.orderId !== orderId) {
        context.addIssue({
          code: "custom",
          message: "Lifecycle event must belong to the detailed order.",
          path: ["events", index, "orderId"],
        });
      }

      if (eventIds.has(event.eventId)) {
        context.addIssue({
          code: "custom",
          message: "Lifecycle event identifiers must be unique.",
          path: ["events", index, "eventId"],
        });
      }

      eventIds.add(event.eventId);
    });
  });

export type OrderDetailsRecord = z.infer<typeof orderDetailsRecordSchema>;
