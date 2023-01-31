import React, { useState } from "react";
import { Pane } from "../../components/panes/pane";
import { useWidgetModel } from "../widget";
import { LoadingOverlay } from "../../components/loading-overlay";
import { ObjectExplorer } from "../../components/object-explorer";

export const StateView = () => {
  const [error, setError] = useState<any>();
  const { actions, state } = useWidgetModel<Model>();

  return (
    <LoadingOverlay error={error}>
      <Pane initialHeight={300}>
        <ObjectExplorer value={state} />
      </Pane>
    </LoadingOverlay>
  );
};

type Model = {
  state: {
  };
};
