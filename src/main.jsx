// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { TripsProvider } from "./context/TripsContext";
import { GamesProvider } from "./context/GamesContext";
//import { migrateLogoEmbeds } from "./utils/migrateLogoEmbeds";
import "./styles/global.css";

//migrateLogoEmbeds();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TripsProvider>
      <GamesProvider>
        <App />
      </GamesProvider>
    </TripsProvider>
  </React.StrictMode>
);