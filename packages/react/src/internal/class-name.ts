export function classNameProps(className: string | undefined) {
  return className === undefined ? {} : { className };
}
