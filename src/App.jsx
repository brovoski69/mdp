import { useEffect, useState } from "react";
import logoImg from "../src/assets/logo.png";
import "./App.css";

export default function App() {
  const [data, setData] = useState({});
  const [history, setHistory] = useState([]);

  function generateFakeData() {
    const types = ["Biodegradable", "Non-Biodegradable"];
    const type = types[Math.floor(Math.random() * types.length)];
    const confidence = (Math.random() * 100).toFixed(2);
    const time = new Date().toLocaleTimeString();

    const newData = { type, confidence, time };
    setData(newData);
    setHistory((prev) => [newData, ...prev.slice(0, 5)]);
  }

  useEffect(() => {
    generateFakeData();
    const i = setInterval(generateFakeData, 3000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="app">
      <header>
        <div className="header-left">
          <img src={logoImg} alt="logo" />
          <h1>SMART WASTE</h1>
        </div>
        <div className="live">
          <span className="dot"></span> Live
        </div>
      </header>

      <div className="dashboard">
        <div
          className={`main-card ${
            data.type === "Biodegradable" ? "green" : "red"
          }`}
        >
          <div className="icon">
            {data.type === "Biodegradable" ? "🌿" : "🥤"}
          </div>

          <h2>{data.type}</h2>
          <p>{data.confidence}% Confidence</p>
          <span>{data.time}</span>
        </div>

        <div className="log-card">
          <h3>Recent Logs</h3>

          {history.map((item, i) => (
            <div className="log-row" key={i}>
              <span>{item.type}</span>
              <span>{item.confidence}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
