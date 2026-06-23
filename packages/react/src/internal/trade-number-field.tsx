import {
  FieldError,
  Input,
  Label,
  NumberField,
  Text,
} from "react-aria-components";
import type { InputProps, NumberFieldProps } from "react-aria-components";
import { classNameProps } from "./class-name";

export interface TradeNumberFieldClassNames {
  root?: string;
  label?: string;
  control?: string;
  input?: string;
  suffix?: string;
  description?: string;
  error?: string;
}

export interface TradeNumberFieldProps {
  label: string;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  name?: string;
  minValue?: number;
  maxValue?: number;
  step?: number;
  suffix?: string;
  description?: string;
  errorMessage?: string;
  formatOptions?: Intl.NumberFormatOptions;
  commitBehavior?: NumberFieldProps["commitBehavior"];
  isDisabled?: boolean;
  isRequired?: boolean;
  placeholder?: string;
  classNames?: TradeNumberFieldClassNames;
}

export function TradeNumberField({
  label,
  value,
  defaultValue,
  onChange,
  name,
  minValue,
  maxValue,
  step,
  suffix,
  description,
  errorMessage,
  formatOptions,
  commitBehavior,
  isDisabled,
  isRequired,
  placeholder,
  classNames,
}: TradeNumberFieldProps) {
  const valueProps: Pick<NumberFieldProps, "value" | "defaultValue"> =
    value === undefined
      ? defaultValue === undefined
        ? {}
        : { defaultValue }
      : { value };

  const nameProps: Pick<NumberFieldProps, "name"> =
    name === undefined ? {} : { name };

  const minProps: Pick<NumberFieldProps, "minValue"> =
    minValue === undefined ? {} : { minValue };

  const maxProps: Pick<NumberFieldProps, "maxValue"> =
    maxValue === undefined ? {} : { maxValue };

  const stepProps: Pick<NumberFieldProps, "step"> =
    step === undefined ? {} : { step };

  const formatOptionsProps: Pick<NumberFieldProps, "formatOptions"> =
    formatOptions === undefined ? {} : { formatOptions };

  const commitBehaviorProps: Pick<NumberFieldProps, "commitBehavior"> =
    commitBehavior === undefined ? {} : { commitBehavior };

  const changeProps: Pick<NumberFieldProps, "onChange"> =
    onChange === undefined ? {} : { onChange };

  const disabledProps: Pick<NumberFieldProps, "isDisabled"> =
    isDisabled === undefined ? {} : { isDisabled };

  const requiredProps: Pick<NumberFieldProps, "isRequired"> =
    isRequired === undefined ? {} : { isRequired };

  const invalidProps: Pick<NumberFieldProps, "isInvalid"> =
    errorMessage === undefined ? {} : { isInvalid: true };

  const placeholderProps: Pick<InputProps, "placeholder"> =
    placeholder === undefined ? {} : { placeholder };

  return (
    <NumberField
      {...valueProps}
      {...nameProps}
      {...minProps}
      {...maxProps}
      {...stepProps}
      {...formatOptionsProps}
      {...commitBehaviorProps}
      {...changeProps}
      {...disabledProps}
      {...requiredProps}
      {...invalidProps}
      {...classNameProps(classNames?.root)}
    >
      <Label {...classNameProps(classNames?.label)}>{label}</Label>

      <div {...classNameProps(classNames?.control)}>
        <Input {...classNameProps(classNames?.input)} {...placeholderProps} />
        {suffix ? (
          <span {...classNameProps(classNames?.suffix)} aria-hidden="true">
            {suffix}
          </span>
        ) : null}
      </div>

      {description ? (
        <Text {...classNameProps(classNames?.description)} slot="description">
          {description}
        </Text>
      ) : null}
      {errorMessage ? (
        <FieldError {...classNameProps(classNames?.error)}>
          {errorMessage}
        </FieldError>
      ) : null}
    </NumberField>
  );
}
