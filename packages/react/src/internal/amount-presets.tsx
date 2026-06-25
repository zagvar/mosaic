import { classNameProps } from "./class-name";
import { useLocale } from "react-aria-components";

export interface AmountPresetsClassNames {
  root?: string;
  button?: string;
}

export interface AmountPresetsProps {
  values?: number[];
  onSelect: (percent: number) => void;
  isDisabled?: boolean;
  classNames?: AmountPresetsClassNames;
}

const defaultValues = [25, 50, 75, 100];

export function AmountPresets({
  values = defaultValues,
  onSelect,
  isDisabled = false,
  classNames,
}: AmountPresetsProps) {
  const { locale } = useLocale();

  return (
    <div {...classNameProps(classNames?.root)}>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          disabled={isDisabled}
          onClick={() => onSelect(value)}
          {...classNameProps(classNames?.button)}
        >
          {formatPercent(value, locale)}
        </button>
      ))}
    </div>
  );
}

function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    style: "percent",
  }).format(value / 100);
}
