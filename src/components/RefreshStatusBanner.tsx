import React from "react";
import { Progress, Spin } from "antd";

type RefreshBannerStatus = "idle" | "refreshing" | "success" | "error";

interface RefreshStatusBannerProps {
  status: RefreshBannerStatus;
  title: string;
  detail?: string;
  progressPercent?: number;
  busy?: boolean;
}

const paletteByStatus: Record<
  RefreshBannerStatus,
  { background: string; border: string; title: string; detail: string }
> = {
  idle: {
    background: "#fafafa",
    border: "#d9d9d9",
    title: "#262626",
    detail: "#595959",
  },
  refreshing: {
    background: "#e6f4ff",
    border: "#91caff",
    title: "#0958d9",
    detail: "#597ef7",
  },
  success: {
    background: "#f6ffed",
    border: "#b7eb8f",
    title: "#389e0d",
    detail: "#52c41a",
  },
  error: {
    background: "#fff1f0",
    border: "#ffa39e",
    title: "#cf1322",
    detail: "#ff4d4f",
  },
};

const RefreshStatusBanner: React.FC<RefreshStatusBannerProps> = ({
  status,
  title,
  detail,
  progressPercent,
  busy = false,
}) => {
  const palette = paletteByStatus[status];
  const normalizedProgress =
    typeof progressPercent === "number"
      ? Math.max(0, Math.min(100, Math.round(progressPercent)))
      : undefined;

  return (
    <div
      style={{
        minWidth: "320px",
        maxWidth: "520px",
        padding: "12px 14px",
        borderRadius: "10px",
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.background,
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
        }}
      >
        <div style={{ marginTop: "2px" }}>
          {busy ? <Spin size="small" /> : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: palette.title,
              fontSize: "13px",
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            {title}
          </div>
          {detail ? (
            <div
              style={{
                marginTop: "2px",
                color: palette.detail,
                fontSize: "12px",
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              {detail}
            </div>
          ) : null}
        </div>
      </div>

      {typeof normalizedProgress === "number" ? (
        <Progress
          percent={normalizedProgress}
          showInfo={false}
          strokeColor={palette.title}
          trailColor="rgba(0, 0, 0, 0.08)"
          size="small"
          style={{ marginTop: "10px", marginBottom: 0 }}
        />
      ) : null}
    </div>
  );
};

export default RefreshStatusBanner;