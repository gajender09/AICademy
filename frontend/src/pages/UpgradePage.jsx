// src/pages/Upgrade/UpgradePage.jsx

import "../styles/UpgradePage.css";
import { useState } from "react";
const UpgradePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleUpgrade = () => {
    console.log("Upgrade to Pro");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setError("Upgrade failed");
    }, 1000);
  };

  return (
    <div className="upgrade-page">
      <div className="upgrade-card">
        <span className="upgrade-badge">
          AICademy Pro
        </span>

        <h1>Upgrade to Pro</h1>

        <p>
          You've reached the free plan limit.
          Upgrade to unlock unlimited AI-powered learning.
        </p>

        <div className="upgrade-features">
          <div>✓ Unlimited Courses</div>
          <div>✓ Unlimited AI Generation</div>
          <div>✓ Premium AI Lab</div>
          <div>✓ Priority Features</div>
        </div>

        <button className="upgrade-btn" onClick={handleUpgrade} disabled={loading}>
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
};

export default UpgradePage;