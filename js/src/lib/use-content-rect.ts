import { useCallback, useEffect, useState } from "react";

export const useContentRect = () => {
  const [contentRect, setContentRect] = useState<DOMRectReadOnly>();
  const [target, setTarget] = useState<HTMLElement | null>(null);

  const ref = useCallback((target: HTMLElement | null) => {
    setTarget(target);
  }, []);

  useEffect(() => {
    if (!target) return;

    const obs = new ResizeObserver((entries) => {
      const [el] = entries;
      setContentRect(el.contentRect);
    });
    obs.observe(target);
    return () => obs.disconnect();
  }, [target]);

  return [ref, contentRect] as const;
};
