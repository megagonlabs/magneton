export const compareBy =
  <T>(...accessors: ((item: T) => any)[]) =>
  (a: T, b: T) => {
    for (const acc of accessors) {
      if (acc(a) < acc(b)) return -1;
      if (acc(a) > acc(b)) return 1;
    }
    return 0;
  };
