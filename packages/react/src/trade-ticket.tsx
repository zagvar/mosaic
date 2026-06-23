import type { FormEvent } from "react";
import { useState } from "react";
import type {
  AssetClass,
  AssetRules,
  OrderDraft,
  OrderValidationIssue,
  Tif,
} from "@mosaic/core";
import { OrderTypeToggle } from "./order-type-toggle";
import { AvailableBalance } from "./internal/available-balance";
import type { AvailableBalanceClassNames } from "./internal/available-balance";
import type { SegmentedRadioGroupClassNames } from "./internal/segmented-radio-group";
import { TradeDecimalField } from "./internal/trade-decimal-field";
import type { TradeNumberFieldClassNames } from "./internal/trade-number-field";
import { TradeSideToggle } from "./trade-side-toggle";
import { useTradeDraft } from "./use-trade-draft";
import { AmountPresets } from "./internal/amount-presets";
import type { AmountPresetsClassNames } from "./internal/amount-presets";

export interface TradeTicketMessages {
  submit: string;
  qty: string;
  limitPx: string;
  notional: string;
  available: string;
  validation: Partial<Record<OrderValidationIssue["code"], string>>;
}

export interface TradeTicketClassNames {
  root?: string;
  availableBalance?: AvailableBalanceClassNames;
  sideToggle?: SegmentedRadioGroupClassNames;
  typeToggle?: SegmentedRadioGroupClassNames;
  numberField?: TradeNumberFieldClassNames;
  amountPresets?: AmountPresetsClassNames;
  alert?: string;
  submitButton?: string;
}

export interface TradeTicketProps {
  symbol: string;
  assetClass: AssetClass;
  assetRules: AssetRules;
  cashAvailable: number;
  assetQtyAvailable: number;
  quoteCurrency?: string;
  defaultTif?: Tif;
  amountPresets?: number[];
  messages?: Partial<TradeTicketMessages>;
  classNames?: TradeTicketClassNames;
  onSubmitDraft?: (draft: OrderDraft) => void | Promise<void>;
  onValidationIssues?: (issues: OrderValidationIssue[]) => void;
}

export const defaultTradeTicketMessages: TradeTicketMessages = {
  submit: "Preview order",
  qty: "Quantity",
  limitPx: "Limit price",
  notional: "Total",
  available: "Available",
  validation: {
    qty_or_notional_required: "Enter a quantity or total.",
    qty_and_notional_conflict: "Use either quantity or total, not both.",
    limit_px_required: "Enter a limit price.",
    unsupported_order_type: "This order type is not supported.",
    unsupported_tif: "This time in force is not supported.",
    notional_not_supported:
      "Value-based orders are not supported for this asset.",
    notional_not_supported_for_order_type:
      "Total is not supported for this order type.",
    qty_below_min: "Quantity is below the minimum.",
    qty_above_max: "Quantity is above the maximum.",
    notional_below_min: "Total is below the minimum.",
    notional_above_max: "Total is above the maximum.",
    qty_precision_exceeded: "Quantity has too many decimal places.",
    limit_px_precision_exceeded: "Limit price has too many decimal places.",
    notional_precision_exceeded: "Total has too many decimal places.",
    qty_lot_size_mismatch: "Quantity must align with the lot size.",
    limit_px_tick_size_mismatch: "Limit price must align with the tick size.",
    notional_quote_increment_mismatch:
      "Total must align with the quote increment.",
    insufficient_cash: "Buying power is not enough for this order.",
    insufficient_asset_qty: "Available quantity is not enough for this order.",
  },
};

export function TradeTicket({
  symbol,
  assetClass,
  assetRules,
  cashAvailable,
  assetQtyAvailable,
  quoteCurrency = "USD",
  defaultTif,
  amountPresets,
  messages,
  classNames,
  onSubmitDraft,
  onValidationIssues,
}: TradeTicketProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const text: TradeTicketMessages = {
    ...defaultTradeTicketMessages,
    ...messages,
    validation: {
      ...defaultTradeTicketMessages.validation,
      ...messages?.validation,
    },
  };

  const initialTifProps =
    defaultTif === undefined ? {} : { initialTif: defaultTif };

  const trade = useTradeDraft({
    symbol,
    assetClass,
    assetRules,
    cashAvailable,
    assetQtyAvailable,
    ...initialTifProps,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);

    if (!trade.validation.valid) {
      onValidationIssues?.(trade.validation.issues);
      return;
    }

    await onSubmitDraft?.(trade.draft);
  }

  const visibleIssues = hasSubmitted ? trade.validation.issues : [];
  const firstGlobalIssue = visibleIssues.find(
    (issue) =>
      !issue.path?.includes("qty") &&
      !issue.path?.includes("limitPx") &&
      !issue.path?.includes("notional"),
  );
  const qtyIssue = getFieldIssue(visibleIssues, "qty");
  const limitPxIssue = getFieldIssue(visibleIssues, "limitPx");
  const notionalIssue = getFieldIssue(visibleIssues, "notional");
  const qtyErrorProps = getErrorMessageProps(qtyIssue, text.validation);
  const limitPxErrorProps = getErrorMessageProps(limitPxIssue, text.validation);
  const notionalErrorProps = getErrorMessageProps(
    notionalIssue,
    text.validation,
  );

  const limitPxProps =
    trade.limitPx === undefined ? {} : { value: trade.limitPx };
  const notionalProps =
    trade.notional === undefined ? {} : { value: trade.notional };
  const qtyProps = trade.qty === undefined ? {} : { value: trade.qty };
  const amountPresetValuesProps =
    amountPresets === undefined ? {} : { values: amountPresets };
  const sideToggleClassNameProps =
    classNames?.sideToggle === undefined
      ? {}
      : { classNames: classNames.sideToggle };
  const typeToggleClassNameProps =
    classNames?.typeToggle === undefined
      ? {}
      : { classNames: classNames.typeToggle };
  const numberFieldClassNameProps =
    classNames?.numberField === undefined
      ? {}
      : { classNames: classNames.numberField };
  const availableBalanceClassNameProps =
    classNames?.availableBalance === undefined
      ? {}
      : { classNames: classNames.availableBalance };
  const amountPresetsClassNameProps =
    classNames?.amountPresets === undefined
      ? {}
      : { classNames: classNames.amountPresets };

  return (
    <form className={classNames?.root} onSubmit={handleSubmit}>
      <TradeSideToggle
        value={trade.side}
        onChange={trade.setSide}
        {...sideToggleClassNameProps}
      />

      <OrderTypeToggle
        value={trade.type}
        onChange={trade.setType}
        {...typeToggleClassNameProps}
      />

      <AvailableBalance
        side={trade.side}
        quoteAvailable={cashAvailable}
        baseAvailable={assetQtyAvailable}
        quoteCurrency={quoteCurrency}
        baseSymbol={symbol}
        messages={{ label: text.available }}
        {...availableBalanceClassNameProps}
      />

      {trade.type === "limit" ? (
        <TradeDecimalField
          label={text.limitPx}
          {...limitPxProps}
          onChange={trade.setLimitPx}
          precision={assetRules.pricePrecision}
          placeholder="0"
          suffix={quoteCurrency}
          {...numberFieldClassNameProps}
          {...limitPxErrorProps}
        />
      ) : null}

      {trade.type === "market" && trade.side === "buy" ? (
        <TradeDecimalField
          label={text.notional}
          {...notionalProps}
          onChange={trade.setNotional}
          precision={assetRules.notionalPrecision}
          placeholder={formatMinimum(assetRules.minNotional, "0")}
          suffix={quoteCurrency}
          {...numberFieldClassNameProps}
          {...notionalErrorProps}
        />
      ) : (
        <TradeDecimalField
          label={text.qty}
          {...qtyProps}
          onChange={trade.setQty}
          precision={assetRules.qtyPrecision}
          placeholder={formatMinimum(assetRules.minQty, "0")}
          suffix={symbol}
          {...numberFieldClassNameProps}
          {...qtyErrorProps}
        />
      )}

      <AmountPresets
        {...amountPresetValuesProps}
        onSelect={trade.applyPercent}
        {...amountPresetsClassNameProps}
      />

      {firstGlobalIssue ? (
        <p className={classNames?.alert} role="alert">
          {firstGlobalIssue.code}
        </p>
      ) : null}

      <button className={classNames?.submitButton} type="submit">
        {text.submit}
      </button>
    </form>
  );
}

function formatMinimum(value: number | undefined, fallback: string) {
  return value === undefined ? fallback : `Min ${value}`;
}

function getFieldIssue(
  issues: OrderValidationIssue[],
  field: "qty" | "limitPx" | "notional",
) {
  return issues.find((issue) => issue.path?.includes(field));
}

function getErrorMessageProps(
  issue: OrderValidationIssue | undefined,
  messages: TradeTicketMessages["validation"],
) {
  if (issue === undefined) return {};

  const message = messages[issue.code];

  return message === undefined ? {} : { errorMessage: message };
}
