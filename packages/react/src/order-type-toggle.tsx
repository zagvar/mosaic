import type { OrderType } from "@zagvar/mosaic-core";
import { SegmentedRadioGroup } from "./internal/segmented-radio-group";
import type { SegmentedRadioGroupClassNames } from "./internal/segmented-radio-group";

export interface OrderTypeToggleMessages {
  label: string;
  market: string;
  limit: string;
}

export interface OrderTypeToggleProps {
  value?: OrderType;
  defaultValue?: OrderType;
  onChange?: (type: OrderType) => void;
  messages?: Partial<OrderTypeToggleMessages>;
  isDisabled?: boolean;
  classNames?: SegmentedRadioGroupClassNames;
}

export const defaultOrderTypeToggleMessages: OrderTypeToggleMessages = {
  label: "Order type",
  market: "Market",
  limit: "Limit",
};

export function OrderTypeToggle({
  value,
  defaultValue = "limit",
  onChange,
  messages,
  isDisabled,
  classNames,
}: OrderTypeToggleProps) {
  const text = {
    ...defaultOrderTypeToggleMessages,
    ...messages,
  };

  const controlProps = value === undefined ? { defaultValue } : { value };
  const disabledProps = isDisabled === undefined ? {} : { isDisabled };
  const changeProps = onChange === undefined ? {} : { onChange };
  const classNameProps = classNames === undefined ? {} : { classNames };

  return (
    <SegmentedRadioGroup<OrderType>
      label={text.label}
      {...controlProps}
      {...disabledProps}
      {...changeProps}
      {...classNameProps}
      options={[
        { value: "limit", label: text.limit },
        { value: "market", label: text.market },
      ]}
    />
  );
}
