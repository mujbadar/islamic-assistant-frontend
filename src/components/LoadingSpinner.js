import React from "react";
import "./LoadingSpinner.css";

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <div className="spinner-text">Processing...</div>
    </div>
  );
};

export default LoadingSpinner;
