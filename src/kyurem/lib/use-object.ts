import { useRef } from "react";
import deepEqual from "deep-equal";

/**
 * `useObject` will return a memoized version of the object that only changes if
 * the object fails a deep-equality check
 */
export const useObject = <T>(obj: T) => {
  const objRef = useRef(obj);

  if (deepEqual(objRef.current, obj)) {
    return objRef.current;
  } else {
    return (objRef.current = obj);
  }
};
