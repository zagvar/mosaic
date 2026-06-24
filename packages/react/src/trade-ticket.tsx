import type { SubmitEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type {
  AssetClass,
  AssetRules,
  OrderDraft,
  OrderSide,
  OrderType,
  OrderValidationIssue,
  Tif,
} from "@mosaic/core";
import { useLocale, VisuallyHidden } from "react-aria-components";
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
  submissionError?: string;
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

  isDisabled?: boolean;
  isSubmitting?: boolean;
  submissionError?: string | null;

  messages?: TradeTicketMessagesInput;
  classNames?: TradeTicketClassNames;

  onSubmitDraft?: (draft: OrderDraft) => void | Promise<void>;
  onSubmitError?: (error: unknown) => void;
  onValidationIssues?: (issues: OrderValidationIssue[]) => void;

  resetOnSubmitSuccess?: boolean;
  onSubmitSuccess?: (draft: OrderDraft) => void;
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
  isDisabled = false,
  isSubmitting = false,
  submissionError: controlledSubmissionError,
  messages,
  classNames,
  onSubmitDraft,
  onSubmitError,
  onValidationIssues,
  onSubmitSuccess,
  resetOnSubmitSuccess = false,
}: TradeTicketProps) {
  const { locale } = useLocale();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);
  const [hasInternalSubmissionError, setHasInternalSubmissionError] =
    useState(false);
  const submissionInFlightRef = useRef(false);

  const pending = isSubmitting || internalIsSubmitting;
  const controlsDisabled = isDisabled || pending;

  const text = mergeTradeTicketMessages(messages);

  const isSubmissionErrorControlled = controlledSubmissionError !== undefined;
  const visibleSubmissionError = isSubmissionErrorControlled
    ? controlledSubmissionError
    : hasInternalSubmissionError
      ? text.submissionError
      : null;

  const initialTifProps =
    defaultTif === undefined ? {} : { initialTif: defaultTif };
  const controlledValueProps = value === undefined ? {} : { value };
  const defaultValueProps = defaultValue === undefined ? {} : { defaultValue };
  const defaultLimitPxProps =
    defaultLimitPx === undefined ? {} : { defaultLimitPx };

  function clearSubmissionError() {
    if (!isSubmissionErrorControlled) {
      setHasInternalSubmissionError(false);
    }
  }

  function handleDraftChange(nextValue: TradeDraftValue) {
    clearSubmissionError();
    onChange?.(nextValue);
  }

  const trade = useTradeDraft({
    symbol,
    assetClass,
    assetRules,
    cashAvailable,
    assetQtyAvailable,
    onChange: handleDraftChange,
    ...controlledValueProps,
    ...defaultValueProps,
    ...initialTifProps,
    ...defaultLimitPxProps,
  });

  const submissionScopeKey = getSubmissionScopeKey(trade.draft);
  const submissionScopeKeyRef = useRef(submissionScopeKey);
  submissionScopeKeyRef.current = submissionScopeKey;

  useEffect(() => {
    setHasSubmitted(false);
    clearSubmissionError();
  }, [assetClass, symbol]);

  useEffect(() => {
    clearSubmissionError();
  }, [
    trade.side,
    trade.type,
    trade.tif,
    trade.qty,
    trade.limitPx,
    trade.notional,
  ]);

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

    if (controlsDisabled || submissionInFlightRef.current) {
      return;
    }

    clearSubmissionError();
    setHasSubmitted(true);

    if (!trade.validation.valid) {
      onValidationIssues?.(trade.validation.issues);
      return;
    }

    if (onSubmitDraft === undefined) {
      return;
    }

    submissionInFlightRef.current = true;
    setInternalIsSubmitting(true);

    const submittedDraft = trade.draft;
    const submittedScopeKey = getSubmissionScopeKey(submittedDraft);

    try {
      await onSubmitDraft(submittedDraft);
      const submissionIsCurrent =
        submissionScopeKeyRef.current === submittedScopeKey;

      onSubmitSuccess?.(submittedDraft);

      if (resetOnSubmitSuccess && submissionIsCurrent) {
        trade.reset();
        setHasSubmitted(false);
      }
    } catch (error) {
      if (
        !isSubmissionErrorControlled &&
        submissionScopeKeyRef.current === submittedScopeKey
      ) {
        setHasInternalSubmissionError(true);
      }

      onSubmitError?.(error);
    } finally {
      submissionInFlightRef.current = false;
      setInternalIsSubmitting(false);
    }
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
    <form
      className={classNames?.root}
      aria-busy={pending}
      onSubmit={handleSubmit}
    >
      <TradeSideToggle
        value={trade.side}
        isDisabled={controlsDisabled}
        onChange={handleSideChange}
        {...sideToggleClassNameProps}
      />

      <OrderTypeToggle
        value={trade.type}
        isDisabled={controlsDisabled}
        onChange={handleTypeChange}
        {...typeToggleClassNameProps}
      />

      {allowedTifs.length > 1 ? (
        <TifSelect
          allowedTifs={allowedTifs}
          value={trade.tif ?? null}
          isDisabled={controlsDisabled}
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
          isDisabled={controlsDisabled}
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
          isDisabled={controlsDisabled}
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
          isDisabled={controlsDisabled}
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
        isDisabled={controlsDisabled}
        onSelect={trade.applyPercent}
        {...amountPresetsClassNameProps}
      />

      {globalErrorMessage ? (
        <p className={classNames?.alert} role="alert">
          {globalErrorMessage}
        </p>
      ) : null}

      <VisuallyHidden>
        <span role="status" aria-live="polite" aria-atomic="true">
          {pending ? text.submitting : ""}
        </span>
      </VisuallyHidden>

      {visibleSubmissionError ? (
        <p
          className={classNames?.submissionError ?? classNames?.alert}
          role="alert"
        >
          {visibleSubmissionError}
        </p>
      ) : null}

      <button
        className={classNames?.submitButton}
        type="submit"
        disabled={controlsDisabled}
      >
        {pending ? text.submitting : text.submit}
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

function getSubmissionScopeKey(draft: OrderDraft) {
  return JSON.stringify([
    draft.assetClass,
    draft.symbol,
    draft.side,
    draft.type,
    draft.tif,
    draft.qty,
    draft.limitPx,
    draft.notional,
  ]);
}
