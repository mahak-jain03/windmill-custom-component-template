import React from "react";
import ReactDOM from "react-dom/client";
import Component from "./component/Component.tsx";
// import Component from "./component/MinimalComponent.tsx";

// import { type WindmillProps } from "./global";


type WindmillProps = {
  id: string;
  outputs: any;
  passSetters: (setter: any) => void;
  setOutput: (output: any) => void;
  renderInit: boolean;
  render?: boolean; // Add this line if needed
};

export function customComponent(props: WindmillProps) {
  ReactDOM.createRoot(document.getElementById(props.id)!).render(
    <React.StrictMode>
      <Component
        outputs={props.outputs}
        passSetters={props.passSetters}
        setOutput={props.setOutput}
        renderInit={props.renderInit}
      />
    </React.StrictMode>
  );
}

if (window.windmill === undefined) {
  window.windmill = {};
}

 window.windmill[__COMPONENT_NAME__] = customComponent;