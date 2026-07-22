import { z } from "zod";
import { assetClassSchema, orderSideSchema } from "./order-schemas.js";
import { orderIdentifierSchema } from "./order-identity.js";
import {
  orderListItemSchema,
  orderRecordTifSchema,
  orderRecordTypeSchema,
} from "./order-record.js";
import { orderStatusSchema } from "./order-status.js";
import { isoTimestampSchema } from "./timestamp.js";

const maxFilterValues = 100;
const maxPageSize = 200;

const filterIdentifierSchema = z.string().trim().min(1).max(64);
const quoteCurrencySchema = z.string().trim().min(1).max(16);

const hasUniqueValues = (values: readonly string[]) =>
  new Set(values).size === values.length;

const uniqueValuesMessage = {
  message: "Filter values must be unique.",
};

export const orderListScopeSchema = z.enum(["open", "history"]);

export const orderFiltersSchema = z
  .object({
    accountIds: z
      .array(orderIdentifierSchema)
      .min(1)
      .max(maxFilterValues)
      .refine(hasUniqueValues, uniqueValuesMessage)
      .optional(),

    symbols: z
      .array(filterIdentifierSchema)
      .min(1)
      .max(maxFilterValues)
      .refine(hasUniqueValues, uniqueValuesMessage)
      .optional(),

    assetClasses: z
      .array(assetClassSchema)
      .min(1)
      .max(maxFilterValues)
      .refine(hasUniqueValues, uniqueValuesMessage)
      .optional(),

    venues: z
      .array(filterIdentifierSchema)
      .min(1)
      .max(maxFilterValues)
      .refine(hasUniqueValues, uniqueValuesMessage)
      .optional(),

    quoteCurrencies: z
      .array(quoteCurrencySchema)
      .min(1)
      .max(maxFilterValues)
      .refine(hasUniqueValues, uniqueValuesMessage)
      .optional(),

    sides: z
      .array(orderSideSchema)
      .min(1)
      .max(maxFilterValues)
      .refine(hasUniqueValues, uniqueValuesMessage)
      .optional(),

    types: z
      .array(orderRecordTypeSchema)
      .min(1)
      .max(maxFilterValues)
      .refine(hasUniqueValues, uniqueValuesMessage)
      .optional(),

    tifs: z
      .array(orderRecordTifSchema)
      .min(1)
      .max(maxFilterValues)
      .refine(hasUniqueValues, uniqueValuesMessage)
      .optional(),

    statuses: z
      .array(orderStatusSchema)
      .min(1)
      .max(maxFilterValues)
      .refine(hasUniqueValues, uniqueValuesMessage)
      .optional(),

    /**
     * Inclusive lower bound for order submission time.
     */
    submittedFrom: isoTimestampSchema.optional(),

    /**
     * Exclusive upper bound for order submission time.
     */
    submittedTo: isoTimestampSchema.optional(),
  })
  .superRefine((filters, context) => {
    const parsedFrom = isoTimestampSchema.safeParse(filters.submittedFrom);
    const parsedTo = isoTimestampSchema.safeParse(filters.submittedTo);

    if (
      parsedFrom.success &&
      parsedTo.success &&
      Date.parse(parsedFrom.data) >= Date.parse(parsedTo.data)
    ) {
      context.addIssue({
        code: "custom",
        message: "submittedFrom must be earlier than submittedTo.",
        path: ["submittedTo"],
      });
    }
  });

export const orderSortFieldSchema = z.enum([
  "submittedAt",
  "updatedAt",
  "completedAt",
  "symbol",
  "status",
  "side",
  "type",
  "filledQuantity",
]);

export const orderSortDirectionSchema = z.enum(["asc", "desc"]);

export const orderSortSchema = z.object({
  field: orderSortFieldSchema,
  direction: orderSortDirectionSchema,
});

/**
 * Opaque backend pagination cursor.
 *
 * Mosaic does not inspect, decode, or construct cursor contents.
 */
export const orderCursorSchema = z.string().min(1).max(2_048);

export const ordersPaginationSchema = z.object({
  cursor: orderCursorSchema.optional(),
  limit: z.number().int().min(1).max(maxPageSize).default(50),
});

/**
 * Semantic order-list request emitted by OrdersPanel.
 *
 * The backend remains responsible for applying filters, sorting, account
 * authorization, and pagination.
 */
export const ordersQuerySchema = z.object({
  scope: orderListScopeSchema,

  filters: orderFiltersSchema.default({}),

  sort: orderSortSchema.default({
    field: "updatedAt",
    direction: "desc",
  }),

  pagination: ordersPaginationSchema.default({
    limit: 50,
  }),
});

/**
 * One cursor-paginated order-list response.
 */
export const ordersPageSchema = z
  .object({
    items: z.array(orderListItemSchema).max(maxPageSize),

    nextCursor: orderCursorSchema.optional(),
    previousCursor: orderCursorSchema.optional(),

    /**
     * Optional because exact counts can be expensive or unavailable for
     * real-time broker data.
     */
    totalCount: z
      .number()
      .int()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER)
      .optional(),

    /**
     * Time at which the backend considered this page current.
     */
    asOf: isoTimestampSchema,
  })
  .superRefine((page, context) => {
    const orderKeys = new Set<string>();

    page.items.forEach((order, index) => {
      const key = JSON.stringify([order.accountId ?? null, order.orderId]);

      if (orderKeys.has(key)) {
        context.addIssue({
          code: "custom",
          message: "Order identifiers must be unique within an account page.",
          path: ["items", index, "orderId"],
        });
      }

      orderKeys.add(key);
    });
  });

export type OrderListScope = z.infer<typeof orderListScopeSchema>;
export type OrderFilters = z.infer<typeof orderFiltersSchema>;
export type OrderSortField = z.infer<typeof orderSortFieldSchema>;
export type OrderSortDirection = z.infer<typeof orderSortDirectionSchema>;
export type OrderSort = z.infer<typeof orderSortSchema>;
export type OrderCursor = z.infer<typeof orderCursorSchema>;
export type OrdersPagination = z.infer<typeof ordersPaginationSchema>;
export type OrdersQuery = z.infer<typeof ordersQuerySchema>;
export type OrdersPage = z.infer<typeof ordersPageSchema>;
