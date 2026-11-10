import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LoginModal from "./components/LoginModal";
import MarksDistributionView from "./components/MarksDistributionView";
import DateSheetsView from "./components/DateSheetsView";
import GradingTrackerView from "./components/GradingTrackerView";
import CoScholasticView from "./components/CoScholasticView";
import ReportCardsView from "./components/ReportCardsView";
import { getCurrentUser, logoutUser } from "./services/api";

import "./styles/app.css";

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [isLoginOpen, setIsLoginOpen] = useState(!user);
  const [activeTab, setActiveTab] = useState("distributions");

  useEffect(() => {
    const handleAuthChange = () => {
      const u = getCurrentUser();
      setUser(u);
      setIsLoginOpen(!u);
    };

    window.addEventListener("am-auth-changed", handleAuthChange);
    return () => window.removeEventListener("am-auth-changed", handleAuthChange);
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setIsLoginOpen(true);
  };

  return (
    <div className="academic-portal-app">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {user ? (
          <>
            {activeTab === "distributions" && <MarksDistributionView />}
            {activeTab === "datesheets" && <DateSheetsView />}
            {activeTab === "tracker" && <GradingTrackerView />}
            {activeTab === "coscholastic" && <CoScholasticView />}
            {activeTab === "reportcards" && <ReportCardsView />}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-secondary)" }}>
            Please sign in to access the Academic Manager portal.
          </div>
        )}
      </main>

      <LoginModal
        isOpen={isLoginOpen}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

