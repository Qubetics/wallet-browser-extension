import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
/* global chrome*/

import App from "./App";
import { MemoryRouter } from "react-router-dom";
import { createStore, applyMiddleware, compose } from "redux";
import { Provider } from "react-redux";
import ReduxThunk from "redux-thunk";
import reducers from "./reducers";
import 'process/browser';
import { Buffer } from 'buffer';

window.Buffer = Buffer; 

const noop = () => {};
// console.log = noop;
// console.debug = noop;
// console.info = noop;
// console.warn = noop;

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
