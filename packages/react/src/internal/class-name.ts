export function classNameProps(className: string | undefined) {
  return className === undefined ? {} : { className };
}

export function joinClassNames(
  ...values: Array<string | undefined>
): string | undefined {
  const className = values.filter(Boolean).join(" ");

  return className === "" ? undefined : className;
}
