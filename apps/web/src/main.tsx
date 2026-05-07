import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { installBrandMetadata } from "./brand";
import "./styles.css";

installBrandMetadata();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
