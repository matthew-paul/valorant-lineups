import React from "react";
import ReactDOM from "react-dom/client";
import "./css/main.min.css";
import App from "./App";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error('Unable to start the application: no element with id "root".');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
