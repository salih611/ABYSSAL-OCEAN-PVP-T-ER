import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AdminPanel from "./AdminPanel";
import "./index.css";

// Basit routing
const path = window.location.pathname;
const Component = path === "/admin" ? AdminPanel : App;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>
);
