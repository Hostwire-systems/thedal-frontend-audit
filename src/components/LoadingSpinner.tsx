import React from "react";
import "./LoadingSpinner.css";

const LoadingSpinner:React.FC = () => {

    const spinnerStyle: React.CSSProperties = {
        position:"fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        display:"flex",
        background: "rgba(0, 0, 0, 0.3)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,

    };

    const spinnerCircleStyle: React.CSSProperties = {
        border: "4px solid #f3f3f3", 
        borderTop: "4px solid #3498db", 
        borderRadius: "50%",
        width: "50px",
        height: "50px",
        animation: "spin 1s linear infinite",
    }

    return (
        <div style={spinnerStyle}>
            <div style={spinnerCircleStyle}></div>
        </div>
    );
};

export default LoadingSpinner;