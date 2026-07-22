import type { OrderListItem } from "@zagvar/mosaic-core";

export interface OrderNumberFormat {
  quantityFractionDigits: number;
  priceFractionDigits: number;
  notionalFractionDigits: number;
}

export type GetOrderNumberFormat = (
  order: OrderListItem,
) => Partial<OrderNumberFormat>;

export const defaultOrderNumberFormat: OrderNumberFormat = {
  quantityFractionDigits: 8,
  priceFractionDigits: 8,
  notionalFractionDigits: 2,
};

export function resolveOrderNumberFormat(
  order: OrderListItem,
  numberFormat: Partial<OrderNumberFormat> | undefined,
  getNumberFormat: GetOrderNumberFormat | undefined,
): OrderNumberFormat {
  return {
    ...defaultOrderNumberFormat,
    ...numberFormat,
    ...getNumberFormat?.(order),
  };
}
