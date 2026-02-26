// ─────────────────────────────────────────────
// src/index.js — Application Entry Point
// This is the first file React runs.
// It mounts the <App /> component into the HTML <div id="root">
// ─────────────────────────────────────────────
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/globals.css";
import App from "./App";
import { initAnalytics } from "./utils/analytics";

initAnalytics();

// Get the root HTML element and tell React to render inside it
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  // StrictMode helps catch bugs during development
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
