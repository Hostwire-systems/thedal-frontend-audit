import React from "react";
import { Modal, Tag, Typography } from "antd";
import { FilePdfFilled, FileExcelFilled } from "@ant-design/icons";

const { Text } = Typography;

export interface ExportProgressModalProps {
  open: boolean;
  format: "pdf" | "excel" | null;
  title: string;
  status: "preparing" | "processing" | "downloading" | "completed" | "failed";
  percent: number;
  onClose: () => void;
}

const STATUS_MESSAGES: Record<string, string> = {
  preparing: "Preparing your export...",
  processing: "Generating file, please wait...",
  downloading: "Almost done, starting download...",
  completed: "Your file has been downloaded successfully!",
  failed: "Export failed. Please try again.",
};

const STEP_INDEX: Record<string, number> = {
  preparing: 0,
  processing: 1,
  downloading: 2,
};

const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  open,
  format,
  title,
  status,
  percent,
  onClose,
}) => {
  const isPdf = format === "pdf";
  const themeColor = isPdf ? "#ef4444" : "#16a34a";
  const isActive = status !== "completed" && status !== "failed";

  const getDotStyle = (index: number) => {
    const currentStep = STEP_INDEX[status] ?? -1;
    const isCompleted = status === "completed";
    const isFailed = status === "failed";

    if (isCompleted || index < currentStep) {
      return { background: "#16a34a", borderColor: "#16a34a", boxShadow: "none" };
    }
    if (isFailed && index <= 1) {
      return { background: "#fca5a5", borderColor: "#dc2626", boxShadow: "none" };
    }
    if (index === currentStep) {
      return { background: themeColor, borderColor: themeColor, boxShadow: `0 0 0 3px ${themeColor}33` };
    }
    return { background: "var(--color-background-secondary)", borderColor: "var(--color-border-tertiary)", boxShadow: "none" };
  };

  const lineWidth =
    status === "completed" ? "100%"
    : status === "downloading" ? "100%"
    : status === "processing" ? "50%"
    : "0%";

  return (
    <Modal
      open={open}
      centered
      closable={false}
      footer={null}
      width={420}
      onCancel={onClose}
      styles={{ content: { borderRadius: 20, padding: 0, overflow: "hidden" } }}
    >
      {/* Header with always-visible close */}
      <div style={{ padding: "14px 20px 0", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          title={isActive ? "Close (export continues in background)" : "Close"}
          style={{
            background: "var(--color-background-secondary)",
            border: "none",
            borderRadius: "50%",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-secondary)",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          &#x2715;
        </button>
      </div>

      <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>

        {/* Icon */}
        <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          {status === "completed" ? (
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="22" fill="#dcfce7"/>
              <polyline points="14,24 21,31 34,17" fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : status === "failed" ? (
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="22" fill="#fee2e2"/>
              <line x1="16" y1="16" x2="32" y2="32" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round"/>
              <line x1="32" y1="16" x2="16" y2="32" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: "spin 1s linear infinite" }}>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="4"/>
              <path d="M24 4 A20 20 0 0 1 44 24" fill="none" stroke={themeColor} strokeWidth="4" strokeLinecap="round"/>
            </svg>
          )}
        </div>

        {/* Format badge */}
        {format && (
          <Tag style={{
            borderRadius: 99, padding: "3px 12px", border: "none", fontWeight: 500,
            fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10,
            background: isPdf ? "#fee2e2" : "#dcfce7",
            color: isPdf ? "#991b1b" : "#14532d",
          }}>
            {isPdf ? <FilePdfFilled style={{ marginRight: 4 }} /> : <FileExcelFilled style={{ marginRight: 4 }} />}
            {format.toUpperCase()} Export
          </Tag>
        )}

        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 14 }}>{Math.round(percent)}%</div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: 8, borderRadius: 99, background: "var(--color-background-secondary)", overflow: "hidden", marginBottom: 8 }}>
          <div style={{
            height: "100%", borderRadius: 99, transition: "width 0.4s ease",
            background: status === "failed" ? "#dc2626" : status === "completed" ? "#16a34a" : themeColor,
            width: `${percent}%`,
          }}/>
        </div>

        <Text style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4, display: "block" }}>
          {STATUS_MESSAGES[status]}
        </Text>

        {isActive && (
          <Text style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 18, display: "block" }}>
            You can close this — export continues in the background
          </Text>
        )}

        {/* Step indicators */}
        <div style={{ display: "flex", alignItems: "center", width: "100%", padding: "0 8px", marginTop: isActive ? 0 : 14, marginBottom: 22, position: "relative" }}>
          <div style={{ position: "absolute", top: 5, left: 8, right: 8, height: 2, background: "var(--color-background-secondary)", zIndex: 0 }}/>
          <div style={{ position: "absolute", top: 5, left: 8, height: 2, zIndex: 1, transition: "width 0.5s ease", width: lineWidth, background: status === "failed" ? "#dc2626" : "#16a34a" }}/>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", position: "relative", zIndex: 2 }}>
            {["Prepare", "Generate", "Download"].map((label, i) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid", transition: "all 0.3s", ...getDotStyle(i) }}/>
                <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={!isActive ? onClose : undefined}
          disabled={isActive}
          style={{
            width: "100%", padding: 11, borderRadius: 10, border: "none",
            fontSize: 14, fontWeight: 500, color: "#fff", transition: "all 0.3s",
            background: status === "completed" ? "#16a34a" : status === "failed" ? "#dc2626" : themeColor,
            opacity: isActive ? 0.45 : 1,
            cursor: isActive ? "not-allowed" : "pointer",
          }}
        >
          {status === "failed" ? "Close & try again" : "Close"}
        </button>
      </div>
    </Modal>
  );
};

export default ExportProgressModal;
