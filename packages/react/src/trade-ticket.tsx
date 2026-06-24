import type { SubmitEvent } from "react";
import { useEffect, useState } from "react";
import type {
  AssetClass,
  AssetRules,
  OrderDraft,
  OrderSide,
  OrderType,
  OrderValidationIssue,
  Tif,
} from "@mosaic/core";
import { useLocale } from "react-aria-components";
import { OrderTypeToggle } from "./order-type-toggle";
import { AvailableBalance } from "./internal/available-balance";
import type { AvailableBalanceClassNames } from "./internal/available-balance";
import type { SegmentedRadioGroupClassNames } from "./internal/segmented-radio-group";
import { TradeDecimalField } from "./internal/trade-decimal-field";
import type { TradeNumberFieldClassNames } from "./internal/trade-number-field";
import { TradeSideToggle } from "./trade-side-toggle";
import { TifSelect } from "./tif-select";
import type { TifSelectClassNames } from "./tif-select";
import { useTradeDraft, type TradeDraftValue } from "./use-trade-draft";
import { AmountPresets } from "./internal/amount-presets";
import type { AmountPresetsClassNames } from "./internal/amount-presets";
import {
  formatMinimum,
  getErrorMessageProps,
  getValidationMessage,
  mergeTradeTicketMessages,
} from "./trade-ticket-messages";
import type {
  TradeTicketMessagesInput,
  TradeTicketValidationMessageBaseContext,
} from "./trade-ticket-messages";

export interface TradeTicketClassNames {
  root?: string;
  availableBalance?: AvailableBalanceClassNames;
  sideToggle?: SegmentedRadioGroupClassNames;
  typeToggle?: SegmentedRadioGroupClassNames;
  tifSelect?: TifSelectClassNames;
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

  value?: TradeDraftValue;
  defaultValue?: Partial<TradeDraftValue>;
  onChange?: (value: TradeDraftValue) => void;

  defaultTif?: Tif;
  defaultLimitPx?: number;
  amountPresets?: number[];

  messages?: TradeTicketMessagesInput;
  classNames?: TradeTicketClassNames;

  onSubmitDraft?: (draft: OrderDraft) => void | Promise<void>;
  onValidationIssues?: (issues: OrderValidationIssue[]) => void;
}

export function TradeTicket({
  symbol,
  assetClass,
  assetRules,
  cashAvailable,
  assetQtyAvailable,
  quoteCurrency = "USD",
  value,
  defaultValue,
  onChange,
  defaultTif,
  defaultLimitPx,
  amountPresets,
  messages,
  classNames,
  onSubmitDraft,
  onValidationIssues,
}: TradeTicketProps) {
  const { locale } = useLocale();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const text = mergeTradeTicketMessages(messages);

  const initialTifProps =
    defaultTif === undefined ? {} : { initialTif: defaultTif };
  const controlledValueProps = value === undefined ? {} : { value };
  const defaultValueProps = defaultValue === undefined ? {} : { defaultValue };
  const changeProps = onChange === undefined ? {} : { onChange };
  const defaultLimitPxProps =
    defaultLimitPx === undefined ? {} : { defaultLimitPx };

  const trade = useTradeDraft({
    symbol,
    assetClass,
    assetRules,
    cashAvailable,
    assetQtyAvailable,
    ...controlledValueProps,
    ...defaultValueProps,
    ...changeProps,
    ...initialTifProps,
    ...defaultLimitPxProps,
  });

  useEffect(() => {
    setHasSubmitted(false);
  }, [assetClass, symbol]);

  function handleSideChange(nextSide: OrderSide) {
    if (nextSide === trade.side) return;

    setHasSubmitted(false);
    trade.setSide(nextSide);
  }

  function handleTypeChange(nextType: OrderType) {
    if (nextType === trade.type) return;

    setHasSubmitted(false);
    trade.setType(nextType);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);

    if (!trade.validation.valid) {
      onValidationIssues?.(trade.validation.issues);
      return;
    }

    await onSubmitDraft?.(trade.draft);
  }

  const validationMessageContext: TradeTicketValidationMessageBaseContext = {
    symbol,
    quoteCurrency,
    locale,
    assetRules,
  };

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
  const qtyErrorProps = getErrorMessageProps(
    qtyIssue,
    text.validation,
    validationMessageContext,
  );
  const limitPxErrorProps = getErrorMessageProps(
    limitPxIssue,
    text.validation,
    validationMessageContext,
  );
  const notionalErrorProps = getErrorMessageProps(
    notionalIssue,
    text.validation,
    validationMessageContext,
  );
  const globalErrorMessage = getValidationMessage(
    firstGlobalIssue,
    text.validation,
    validationMessageContext,
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
  const allowedTifs = [...new Set(assetRules.allowedTifs ?? [])];
  const tifSelectClassNameProps =
    classNames?.tifSelect === undefined
      ? {}
      : { classNames: classNames.tifSelect };

  return (
    <form className={classNames?.root} onSubmit={handleSubmit}>
      <TradeSideToggle
        value={trade.side}
        onChange={handleSideChange}
        {...sideToggleClassNameProps}
      />

      <OrderTypeToggle
        value={trade.type}
        onChange={handleTypeChange}
        {...typeToggleClassNameProps}
      />

      {allowedTifs.length > 1 ? (
        <TifSelect
          allowedTifs={allowedTifs}
          value={trade.tif ?? null}
          onChange={trade.setTif}
          messages={text.tif}
          {...tifSelectClassNameProps}
        />
      ) : null}

      <AvailableBalance
        side={trade.side}
        quoteAvailable={cashAvailable}
        baseAvailable={assetQtyAvailable}
        quoteCurrency={quoteCurrency}
        baseSymbol={symbol}
        locale={locale}
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
          placeholder={formatMinimum(assetRules.minNotional, "0", {
            locale,
            maximumFractionDigits: assetRules.notionalPrecision,
          })}
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
          placeholder={formatMinimum(assetRules.minQty, "0", {
            locale,
            maximumFractionDigits: assetRules.qtyPrecision,
          })}
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

      {globalErrorMessage ? (
        <p className={classNames?.alert} role="alert">
          {globalErrorMessage}
        </p>
      ) : null}

      <button className={classNames?.submitButton} type="submit">
        {text.submit}
      </button>
    </form>
  );
}

function getFieldIssue(
  issues: OrderValidationIssue[],
  field: "qty" | "limitPx" | "notional",
) {
  return issues.find((issue) => issue.path?.includes(field));
}
