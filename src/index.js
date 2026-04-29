import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import { message } from "antd";
/* global chrome*/

import App from "./App";
import { MemoryRouter } from "react-router-dom";
import { createStore, applyMiddleware, compose } from "redux";
import { Provider } from "react-redux";
import ReduxThunk from "redux-thunk";
import reducers from "./reducers";
import 'process/browser';
import { Buffer } from 'buffer';
import { initRpcUrls } from './helpers/rpcService';

window.Buffer = Buffer;

initRpcUrls();

// Global toast config: max 1 visible at a time, auto-dismiss after 3s
message.config({ maxCount: 1, duration: 3 });

const noop = () => {};
console.log = noop;
console.debug = noop;
console.info = noop;
console.warn = noop;

const composeEnhancers =
  (typeof window !== "undefined" &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

export const store = createStore(
  reducers,
  composeEnhancers(applyMiddleware(ReduxThunk))
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <MemoryRouter>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </MemoryRouter>
  </Provider>
);
