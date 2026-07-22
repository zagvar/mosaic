import {
  Label,
  RadioButton,
  RadioField,
  RadioGroup,
} from "react-aria-components";
import type { RadioGroupProps } from "react-aria-components";
import { classNameProps } from "./class-name.js";

export interface SegmentedRadioOption<TValue extends string> {
  value: TValue;
  label: string;
  isDisabled?: boolean;
}

export interface SegmentedRadioGroupClassNames {
  root?: string;
  label?: string;
  options?: string;
  field?: string;
  button?: string;
}

export interface SegmentedRadioGroupProps<TValue extends string> {
  label: string;
  value?: TValue;
  defaultValue?: TValue;
  options: Array<SegmentedRadioOption<TValue>>;
  onChange?: (value: TValue) => void;
  isDisabled?: boolean;
  classNames?: SegmentedRadioGroupClassNames;
}

export function SegmentedRadioGroup<TValue extends string>({
  label,
  value,
  defaultValue,
  options,
  onChange,
  isDisabled,
  classNames,
}: SegmentedRadioGroupProps<TValue>) {
  const selectionProps: Pick<RadioGroupProps, "defaultValue" | "value"> =
    value === undefined
      ? defaultValue === undefined
        ? {}
        : { defaultValue }
      : { value };

  const disabledProps: Pick<RadioGroupProps, "isDisabled"> =
    isDisabled === undefined ? {} : { isDisabled };

  return (
    <RadioGroup
      {...selectionProps}
      {...disabledProps}
      {...classNameProps(classNames?.root)}
      onChange={(nextValue) => onChange?.(nextValue as TValue)}
      orientation="horizontal"
    >
      <Label {...classNameProps(classNames?.label)}>{label}</Label>

      <div {...classNameProps(classNames?.options)}>
        {options.map((option) => {
          const optionDisabledProps =
            option.isDisabled === undefined
              ? {}
              : { isDisabled: option.isDisabled };

          return (
            <RadioField
              key={option.value}
              data-value={option.value}
              {...classNameProps(classNames?.field)}
              value={option.value}
              {...optionDisabledProps}
            >
              <RadioButton {...classNameProps(classNames?.button)}>
                {option.label}
              </RadioButton>
            </RadioField>
          );
        })}
      </div>
    </RadioGroup>
  );
}
