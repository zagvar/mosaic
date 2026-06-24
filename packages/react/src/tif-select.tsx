import type { Tif } from "@mosaic/core";
import { useState } from "react";
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from "react-aria-components";
import type { SelectProps } from "react-aria-components";
import { classNameProps } from "./internal/class-name";

export interface TifSelectMessages {
  label: string;
  day: string;
  gtc: string;
  opg: string;
  cls: string;
  ioc: string;
  fok: string;
}

export interface TifSelectClassNames {
  root?: string;
  label?: string;
  trigger?: string;
  value?: string;
  indicator?: string;
  popover?: string;
  listBox?: string;
  item?: string;
}

export interface TifSelectProps {
  allowedTifs: readonly Tif[];
  value?: Tif | null;
  defaultValue?: Tif;
  onChange?: (tif: Tif) => void;
  messages?: Partial<TifSelectMessages>;
  isDisabled?: boolean;
  classNames?: TifSelectClassNames;
}

export const defaultTifSelectMessages: TifSelectMessages = {
  label: "Time in force",
  day: "Day",
  gtc: "Good 'til canceled",
  opg: "At the open",
  cls: "At the close",
  ioc: "Immediate or cancel",
  fok: "Fill or kill",
};

export function TifSelect({
  allowedTifs,
  value,
  defaultValue,
  onChange,
  messages,
  isDisabled,
  classNames,
}: TifSelectProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const text = {
    ...defaultTifSelectMessages,
    ...messages,
  };

  const options = [...new Set(allowedTifs)].map((tif) => ({
    id: tif,
    label: text[tif],
  }));

  const selectionProps: Pick<
    SelectProps<(typeof options)[number]>,
    "value" | "defaultValue"
  > = value === undefined
    ? defaultValue === undefined
      ? {}
      : { defaultValue }
    : { value };

  const disabledProps = isDisabled === undefined ? {} : { isDisabled };
  const portalContainerProps =
    portalContainer === null
      ? {}
      : { UNSTABLE_portalContainer: portalContainer };

  return (
    <Select
      ref={setPortalContainer}
      {...selectionProps}
      {...disabledProps}
      {...classNameProps(classNames?.root)}
      onChange={(nextValue) => {
        if (nextValue !== null) {
          onChange?.(nextValue as Tif);
        }
      }}
    >
      <Label {...classNameProps(classNames?.label)}>{text.label}</Label>

      <Button {...classNameProps(classNames?.trigger)}>
        <SelectValue {...classNameProps(classNames?.value)} />
        <span aria-hidden="true" {...classNameProps(classNames?.indicator)}>
          👇
        </span>
      </Button>

      <Popover
        containerPadding={0}
        {...portalContainerProps}
        {...classNameProps(classNames?.popover)}
      >
        <ListBox {...classNameProps(classNames?.listBox)}>
          {options.map((option) => (
            <ListBoxItem
              id={option.id}
              key={option.id}
              textValue={option.label}
              {...classNameProps(classNames?.item)}
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
}
