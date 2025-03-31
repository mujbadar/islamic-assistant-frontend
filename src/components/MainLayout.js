import React, { useState } from "react";
import VerseIdentifier from "./VerseIdentifier";
import IslamicQA from "./IslamicQA";
import "./MainLayout.css";

const MainLayout = () => {
  const [activeTab, setActiveTab] = useState("qa"); // "qa" or "recorder"

  return (
    <div className="main-layout">
      <header className="app-header">
        <h1>Islamic Assistant</h1>
        <nav className="main-nav">
          <button
            className={`nav-button ${activeTab === "qa" ? "active" : ""}`}
            onClick={() => setActiveTab("qa")}
          >
            Ask About Islam
          </button>
          <button
            className={`nav-button ${activeTab === "recorder" ? "active" : ""}`}
            onClick={() => setActiveTab("recorder")}
          >
            Verse Identifier
          </button>
        </nav>
      </header>

      <main className="main-content">
        {activeTab === "qa" ? <IslamicQA /> : <VerseIdentifier />}
      </main>
    </div>
  );
};

export default MainLayout;
