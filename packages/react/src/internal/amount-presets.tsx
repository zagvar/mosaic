import { classNameProps } from "./class-name";

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
          {value}%
        </button>
      ))}
    </div>
  );
}
