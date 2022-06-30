import * as React from "react";
import * as ReactDOM from "react-dom";

export function bind(node: Element, config: any) {
  return {
    create: (
      component:
        | string
        | React.FunctionComponent<{}>
        | React.ComponentClass<{}, any>,
      props: React.Attributes | null | undefined,
      children: React.ReactNode[]
    ) => React.createElement(component, props, ...children),
    render: (
      element: React.DOMElement<React.DOMAttributes<Element>, Element>
    ) => ReactDOM.render(element, node),
    unmount: () => ReactDOM.unmountComponentAtNode(node),
  };
}

import { Distribution } from "./components/distribution";
export { Distribution };
