import React, {
  ComponentProps,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { Box } from "@mui/system";
import { VegaHelper } from "./vega-helper";
import { useContentRect } from "../lib/use-content-rect";
import { useForkRef } from "@mui/material";

export const LongBarChart = <Datum,>({
  windowSize = 10,
  ...vegaProps
}: ComponentProps<typeof VegaHelper<Datum>> & {
  windowSize?: number;
}) => {
  const { spec, data } = vegaProps;
  const rawSpec = !spec ? [] : Array.isArray(spec) ? spec : [spec];
  const rawData = Array.isArray(data) ? data : data?.value;
  const dataLength = rawData?.length ?? 0;

  const [scrollPos, setScrollPos] = useState(0);

  useEffect(() => {
    setScrollPos((scrollPos) =>
      Math.max(0, Math.min(dataLength - windowSize, scrollPos))
    );
  }, [dataLength]);

  const minimapContainerRef1 = useRef<HTMLDivElement>(null);
  const [minimapContainerRef2, minimapSize] = useContentRect();
  const minimapContainerRef3 = useForkRef(
    minimapContainerRef1,
    minimapContainerRef2
  );

  const jumpScroll = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      const el = minimapContainerRef1.current!;
      const i = Math.floor(
        (dataLength * (e.clientY - el.getBoundingClientRect().top)) /
          el.clientHeight
      );
      setScrollPos(
        Math.max(
          0,
          Math.min(dataLength - windowSize, i - Math.round(windowSize / 2))
        )
      );
    },
    [dataLength]
  );

  return (
    <Box display="flex" width="100%" height="100%">
      <Box position="relative" flexGrow={1} overflow="hidden">
        <VegaHelper
          {...vegaProps}
          spec={[...rawSpec, { encoding: { y: { sort: null } } }]}
          data={{
            loading: !data || (!Array.isArray(data) && data.loading),
            value: rawData?.slice(scrollPos, scrollPos + windowSize),
          }}
        />
      </Box>
      {dataLength > windowSize && (
        <Box
          position="relative"
          width={80}
          ref={minimapContainerRef3}
          onMouseMove={(e) => {
            if (e.buttons & 1) jumpScroll(e.nativeEvent);
          }}
          onMouseDown={(e) => {
            if (e.button === 0) jumpScroll(e.nativeEvent);
          }}
        >
          <VegaHelper
            spec={[
              ...rawSpec,
              {
                padding: 0,
                encoding: {
                  y: {
                    scale: { paddingOuter: 0, paddingInner: 0 },
                    sort: null,
                  },
                },
                config: {
                  axis: { disable: true },
                  legend: { disable: true },
                  text: { opacity: 0 },
                },
              },
            ]}
            data={data}
          />
          {minimapSize && (
            <Box
              position="absolute"
              bgcolor="rgba(0,0,0,0.2)"
              width="100%"
              style={{
                top: (scrollPos * minimapSize.height) / dataLength,
                height: (windowSize * minimapSize.height) / dataLength,
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
};
