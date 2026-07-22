import { useEffect, useState } from "react";
import {
  FieldError,
  Input,
  Label,
  Text,
  TextField,
} from "react-aria-components";
import type { InputProps } from "react-aria-components";
import { normalizeDecimalInput, type DecimalString } from "@zagvar/mosaic-core";
import { classNameProps } from "./class-name.js";
import type { TradeNumberFieldClassNames } from "./trade-number-field.js";

export interface TradeDecimalFieldProps {
  label: string;
  value?: DecimalString;
  onChange?: (value: DecimalString | undefined) => void;
  precision: number;
  name?: string;
  suffix?: string;
  description?: string;
  errorMessage?: string;
  placeholder?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  classNames?: TradeNumberFieldClassNames;
}

export function TradeDecimalField({
  label,
  value,
  onChange,
  precision,
  name,
  suffix,
  description,
  errorMessage,
  placeholder,
  isDisabled,
  isRequired,
  classNames,
}: TradeDecimalFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(
    value === undefined ? "" : String(value),
  );

  useEffect(() => {
    if (isEditing) return;

    setInputValue(value === undefined ? "" : String(value));
  }, [isEditing, value]);

  function handleChange(nextValue: string) {
    if (!isAllowedDecimalInput(nextValue, precision)) return;

    setInputValue(nextValue);

    if (nextValue === "") {
      onChange?.(undefined);
      return;
    }

    if (nextValue.endsWith(".")) return;

    onChange?.(normalizeDecimalInput(nextValue));
  }

  const nameProps = name === undefined ? {} : { name };
  const disabledProps = isDisabled === undefined ? {} : { isDisabled };
  const requiredProps = isRequired === undefined ? {} : { isRequired };
  const invalidProps = errorMessage === undefined ? {} : { isInvalid: true };
  const placeholderProps: Pick<InputProps, "placeholder"> =
    placeholder === undefined ? {} : { placeholder };

  return (
    <TextField
      value={inputValue}
      onChange={handleChange}
      {...nameProps}
      {...disabledProps}
      {...requiredProps}
      {...invalidProps}
      {...classNameProps(classNames?.root)}
    >
      <Label {...classNameProps(classNames?.label)}>{label}</Label>
      <div {...classNameProps(classNames?.control)}>
        <Input
          inputMode="decimal"
          onBlur={() => {
            setIsEditing(false);

            if (inputValue === "" || inputValue.endsWith(".")) {
              setInputValue(value ?? "");
              return;
            }

            setInputValue(normalizeDecimalInput(inputValue));
          }}
          onFocus={() => {
            setIsEditing(true);
          }}
          {...placeholderProps}
          {...classNameProps(classNames?.input)}
        />
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
    </TextField>
  );
}

function isAllowedDecimalInput(value: string, precision: number) {
  if (!Number.isSafeInteger(precision) || precision < 0) {
    throw new RangeError("precision must be a non-negative safe integer.");
  }

  if (value === "") return true;
  if (!/^(?:0|[1-9]\d*)(?:\.\d*)?$/.test(value)) return false;

  const [, decimals = ""] = value.split(".");

  return decimals.length <= precision;
}
