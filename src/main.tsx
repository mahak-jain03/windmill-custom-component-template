import ReactDOM from "react-dom/client";
import { Setter } from "./global";
import { customComponent } from "./lib";
import React from "react";
import { Control } from "./studio/Control";

let setter: Setter<any> | undefined = undefined;

customComponent({
  id: "root",
  outputs: {
    set: (key: string, value: any) => {
      console.log(`Output ${key}:`, value);
    }
  },
  passSetters: (lsetter) => {
    setter = lsetter;
  },
  setOutput: (out) => {
    console.log("Received output:", out);
  },
  renderInit: true
});


const waitForSetter = setInterval(() => {
  if (setter != undefined) {
    clearInterval(waitForSetter);
    ReactDOM.createRoot(document.getElementById("controls")!).render(
      <React.StrictMode>
        <Control setter={setter!} />
      </React.StrictMode>
    );
  }
}, 100);
