import React, { useCallback, useEffect, useMemo, useState } from "react";
import { styled } from "@mui/material/styles";
import { Pane } from "../components/panes/pane";
import { useWidgetModel } from "../core/widget";
import { useObject } from "../lib/use-object";
import { LoadingOverlay } from "../components/loading-overlay";
import { compareBy } from "../lib/utils";
import deepEqual from "deep-equal";

export const PlaceHolder = () => {
  const [error, setError] = useState<any>();
  const { actions, state, t_state } = useWidgetModel<Model>();
  const debounce = useMemo(() => {
    let timeout: NodeJS.Timeout | null = null;
    return (cb: () => any) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(cb, 200);
    };
  }, []);

  return (
    <LoadingOverlay loading={t_state.is_loading} error={error}>
      <Pane initialHeight={400}>
      <div>PlaceHolder Widget</div>
      </Pane>
    </LoadingOverlay>
  );
};

/////////////
/// TYPES ///
/////////////

type Model = {
  actions: {
  };

  state: {
  };

  t_state: {
    is_loading?: boolean;
  };
};
