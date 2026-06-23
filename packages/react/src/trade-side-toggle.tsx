import type { OrderSide } from "@mosaic/core";
import { SegmentedRadioGroup } from "./internal/segmented-radio-group";
import type { SegmentedRadioGroupClassNames } from "./internal/segmented-radio-group";

export interface TradeSideToggleMessages {
  label: string;
  buy: string;
  sell: string;
}

export interface TradeSideToggleProps {
  value?: OrderSide;
  defaultValue?: OrderSide;
  onChange?: (side: OrderSide) => void;
  messages?: Partial<TradeSideToggleMessages>;
  isDisabled?: boolean;
  classNames?: SegmentedRadioGroupClassNames;
}

export const defaultTradeSideToggleMessages: TradeSideToggleMessages = {
  label: "Side",
  buy: "Buy",
  sell: "Sell",
};

export function TradeSideToggle({
  value,
  defaultValue = "buy",
  onChange,
  messages,
  isDisabled,
  classNames,
}: TradeSideToggleProps) {
  const text = {
    ...defaultTradeSideToggleMessages,
    ...messages,
  };

  const controlProps = value === undefined ? { defaultValue } : { value };
  const disabledProps = isDisabled === undefined ? {} : { isDisabled };
  const changeProps = onChange === undefined ? {} : { onChange };
  const classNameProps = classNames === undefined ? {} : { classNames };

  return (
    <SegmentedRadioGroup<OrderSide>
      label={text.label}
      {...controlProps}
      {...disabledProps}
      {...changeProps}
      {...classNameProps}
      options={[
        { value: "buy", label: text.buy },
        { value: "sell", label: text.sell },
      ]}
    />
  );
}
