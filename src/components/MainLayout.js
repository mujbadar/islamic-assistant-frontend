import React from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import VerseIdentifier from "./VerseIdentifier";
import IslamicQA from "./IslamicQA";
import RakatCounter from "./RakatCounter";
import "./MainLayout.css";

const MainLayout = () => {
  return (
    <div className="main-layout">
      <header className="app-header">
        <h1>Islamic Assistant</h1>
        <nav className="main-nav">
          <NavLink
            to="/qa"
            className={({ isActive }) =>
              `nav-button ${isActive ? "active" : ""}`
            }
          >
            Ask About Islam
          </NavLink>
          <NavLink
            to="/verse"
            className={({ isActive }) =>
              `nav-button ${isActive ? "active" : ""}`
            }
          >
            Verse Identifier
          </NavLink>
          <NavLink
            to="/rakat"
            className={({ isActive }) =>
              `nav-button ${isActive ? "active" : ""}`
            }
          >
            Rakat Counter
          </NavLink>
        </nav>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/qa" element={<IslamicQA />} />
          <Route path="/verse" element={<VerseIdentifier />} />
          <Route path="/rakat" element={<RakatCounter />} />
          <Route path="/" element={<Navigate to="/qa" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default MainLayout;
