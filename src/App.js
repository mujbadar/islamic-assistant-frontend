import React from "react";
import { BrowserRouter } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <div className="mosque-animation"></div>
        <MainLayout />
      </div>
    </BrowserRouter>
  );
}

export default App;
