import { useEffect, useState, useCallback } from "react";
import logoImg from "./assets/logo.png";
import "./App.css";

export default function App() {
  const [data, setData] = useState({});
  const [history, setHistory] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [totalScans, setTotalScans] = useState(0);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function generateFakeData() {
    const types = ["Biodegradable", "Non-Biodegradable"];
    const type = types[Math.floor(Math.random() * types.length)];
    const confidence = (Math.random() * 40 + 60).toFixed(1);
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newData = { type, confidence, time };
    setData(newData);
    setHistory((prev) => [newData, ...prev.slice(0, 5)]);
    setTotalScans((prev) => prev + 1);
  }

  useEffect(() => {
    generateFakeData();
    const i = setInterval(generateFakeData, 3000);
    return () => clearInterval(i);
  }, []);

  const bioCount = history.filter((h) => h.type === "Biodegradable").length;
  const nonBioCount = history.filter(
    (h) => h.type === "Non-Biodegradable"
  ).length;
  const bioPercent =
    history.length > 0 ? ((bioCount / history.length) * 100).toFixed(0) : 0;
  const nonBioPercent =
    history.length > 0 ? ((nonBioCount / history.length) * 100).toFixed(0) : 0;

  const isBio = data.type === "Biodegradable";

  return (
    <div className="app">
      {/* ── Header ── */}
      <header>
        <div className="header-left">
          <div className="logo-wrap">
            <img src={logoImg} alt="Smart Waste Logo" />
          </div>
          <div className="brand">
            <h1>Smart Waste</h1>
            <span>Dashboard</span>
          </div>
        </div>

        <div className="header-right">
          <div className="live">
            <span className="dot"></span>
            Live
          </div>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span className="theme-icon">
              {theme === "dark" ? "☀️" : "🌙"}
            </span>
          </button>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <div className="stats-bar">
        <div className="stat-card blue">
          <div className="stat-label">Total Scans</div>
          <div className="stat-value blue">{totalScans}</div>
          <div className="stat-icon">📊</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Biodegradable</div>
          <div className="stat-value green">{bioPercent}%</div>
          <div className="stat-icon">🌿</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Non-Biodegradable</div>
          <div className="stat-value red">{nonBioPercent}%</div>
          <div className="stat-icon">🧴</div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="dashboard">
        {/* Detection Card */}
        <div className={`main-card ${isBio ? "green" : "red"}`}>
          <div className="card-header-row">
            <div className="card-title-group">
              <h3>Latest Detection</h3>
              <h2>Waste Classification</h2>
            </div>
            <div
              className={`type-badge ${isBio ? "bio" : "non-bio"}`}
              key={data.time}
            >
              {isBio ? "🌿" : "🥤"} {data.type}
            </div>
          </div>

          <div className="detection-icon">{isBio ? "♻️" : "🗑️"}</div>

          {/* Confidence Meter */}
          <div className="confidence-section">
            <div className="confidence-label-row">
              <span>Confidence</span>
              <span className="confidence-value">{data.confidence}%</span>
            </div>
            <div className="confidence-bar-track">
              <div
                className={`confidence-bar-fill ${isBio ? "green" : "red"}`}
                style={{ width: `${data.confidence}%` }}
              ></div>
            </div>
          </div>

          <div className="timestamp">🕐 {data.time}</div>
        </div>

        {/* Log Card */}
        <div className="log-card">
          <div className="log-card-header">
            <h3>Recent Activity</h3>
            <span className="log-count">{history.length} entries</span>
          </div>

          {history.length === 0 ? (
            <div className="log-empty">Waiting for data…</div>
          ) : (
            <div className="log-list" key={history.map((h) => h.time).join()}>
              {history.map((item, i) => {
                const itemIsBio = item.type === "Biodegradable";
                return (
                  <div className="log-row" key={i}>
                    <div className="log-left">
                      <div
                        className={`log-type-dot ${itemIsBio ? "bio" : "non-bio"
                          }`}
                      ></div>
                      <span className="log-type-name">
                        {itemIsBio ? "Biodegradable" : "Non-Bio"}
                      </span>
                    </div>
                    <div className="log-right">
                      <span className="log-confidence">
                        {item.confidence}%
                      </span>
                      <span className="log-time">{item.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        Smart Waste Dashboard • Real-time Classification System
      </footer>
    </div>
  );
}
