const indent = (level: number) => "  ".repeat(level);

const _printObject = (x: unknown, maxDepth: number, depth = 1): string =>
  Array.isArray(x)
    ? depth === maxDepth
      ? `[ ...${x.length} items ]`
      : `[\n${x
          .map(
            (value) =>
              `${indent(depth)}${_printObject(value, maxDepth, depth + 1)},`
          )
          .join("\n")}]`
    : x && typeof x === "object"
    ? depth === maxDepth
      ? "{ ... }"
      : `{\n${Object.entries(x)
          .map(
            ([key, value]) =>
              `${indent(depth)}"${key}": ${_printObject(
                value,
                maxDepth,
                depth + 1
              )},`
          )
          .join("\n")}\n${indent(depth - 1)}}`
    : typeof x === "string"
    ? `"${x}"`
    : "" + x;

export const printObject = (x: unknown, maxDepth = Infinity) =>
  _printObject(x, maxDepth);

export const compareBy =
  <T>(...accessors: ((item: T) => any)[]) =>
  (a: T, b: T) => {
    for (const acc of accessors) {
      if (acc(a) < acc(b)) return -1;
      if (acc(a) > acc(b)) return 1;
    }
    return 0;
  };
