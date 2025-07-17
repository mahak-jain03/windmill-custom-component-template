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
  input: {          // <--- this matches Windmill's expectation
    environment: string;
    // ... other fields if you want
  };
  render?: boolean;
};

export function customComponent(props: WindmillProps) {
  ReactDOM.createRoot(document.getElementById(props.id)!).render(
    <React.StrictMode>
      <Component
        outputs={props.outputs}
        passSetters={props.passSetters}
        setOutput={props.setOutput}
        renderInit={props.renderInit}
        input={props.input} // <--- This is the one and only input prop!
      />
    </React.StrictMode>
  );
}

if (window.windmill === undefined) {
  window.windmill = {};
}

 window.windmill[__COMPONENT_NAME__] = customComponent;