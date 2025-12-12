import React from "react";
import "../styles/Alert.css";

const Alert = ({ type, message, onClose }) => {
  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      <button onClick={onClose} className="alert-close">
        ✕
      </button>
    </div>
  );
};

export default Alert;
