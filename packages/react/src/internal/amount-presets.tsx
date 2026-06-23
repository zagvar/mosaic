import { classNameProps } from "./class-name";

export interface AmountPresetsClassNames {
  root?: string;
  button?: string;
}

export interface AmountPresetsProps {
  values?: number[];
  onSelect: (percent: number) => void;
  classNames?: AmountPresetsClassNames;
}

const defaultValues = [25, 50, 75, 100];

export function AmountPresets({
  values = defaultValues,
  onSelect,
  classNames,
}: AmountPresetsProps) {
  return (
    <div {...classNameProps(classNames?.root)}>
      {values.map((value) => (
        <button
          key={value}
          {...classNameProps(classNames?.button)}
          type="button"
          onClick={() => onSelect(value)}
        >
          {value}%
        </button>
      ))}
    </div>
  );
}
