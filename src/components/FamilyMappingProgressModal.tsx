import React, { useEffect } from "react";
import {
  Modal,
  Progress,
  Descriptions,
  Typography,
  Spin,
  Alert,
  Button,
} from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  FamilyMappingJobData,
  FamilyMappingStatus,
} from "../types/familyMapping";

const { Text, Title } = Typography;

interface FamilyMappingProgressModalProps {
  visible: boolean;
  onClose: () => void;
  jobData: FamilyMappingJobData | null;
  loading: boolean;
  error: string | null;
  onForceCancel?: () => Promise<void>;
  forceCancelLoading?: boolean;
}

const FamilyMappingProgressModal: React.FC<FamilyMappingProgressModalProps> = ({
  visible,
  onClose,
  jobData,
  loading,
  error,
  onForceCancel,
  forceCancelLoading,
}) => {
  // Debug logging
  useEffect(() => {
    if (visible) {
      console.log("=== Progress Modal Debug ===");
      console.log("visible:", visible);
      console.log("loading:", loading);
      console.log("error:", error);
      console.log("jobData:", jobData);
      console.log("Render condition check:");
      console.log("loading && !jobData:", loading && !jobData);
      console.log("error && !jobData:", error && !jobData);
      console.log("jobData exists:", !!jobData);
      console.log("=============================");
    }
  }, [visible, loading, error, jobData]);
  const getStatusColor = (status: FamilyMappingStatus) => {
    switch (status) {
      case "IN_PROGRESS":
        return "#1890ff";
      case "COMPLETED":
        return "#52c41a";
      case "FAILED":
        return "#ff4d4f";
      default:
        return "#d9d9d9";
    }
  };

  const getStatusIcon = (status: FamilyMappingStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "20px" }} />
        );
      case "FAILED":
        return (
          <ExclamationCircleOutlined
            style={{ color: "#ff4d4f", fontSize: "20px" }}
          />
        );
      default:
        return null;
    }
  };

  const formatDuration = (duration: string | null) => {
    if (!duration) return "N/A";
    return duration;
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "N/A";
    return new Date(dateTime).toLocaleString();
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Title level={4} style={{ margin: 0 }}>
            Family Mapping Progress
          </Title>
          {jobData?.status && getStatusIcon(jobData.status)}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        jobData?.status === "IN_PROGRESS" && onForceCancel ? (
          <Button
            key="force-cancel"
            danger
            loading={forceCancelLoading}
            onClick={onForceCancel}
          >
            Force Cancel Job
          </Button>
        ) : null,
        <Button
          key="close"
          type="primary"
          onClick={onClose}
          style={{ backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" }}
        >
          {jobData?.status === "IN_PROGRESS"
            ? "Continue in Background"
            : "Close"}
        </Button>,
      ]}
      width={600}
      centered
      closable={true}
      maskClosable={false}
    >
      {loading && !jobData ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <div style={{ marginTop: "16px" }}>
            <Text>Starting family mapping job...</Text>
          </div>
        </div>
      ) : error && !jobData ? (
        <div>
          <Alert
            message="Error Starting Job"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: "16px" }}
          />
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <Button
              type="primary"
              onClick={onClose}
              style={{ backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" }}
            >
              Close
            </Button>
          </div>
        </div>
      ) : jobData ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          {jobData.status === "IN_PROGRESS" && <Spin size="large" />}
          <div style={{ marginTop: "24px" }}>
            <Title level={4} style={{ margin: 0, marginBottom: "8px" }}>
              {jobData.status === "COMPLETED"
                ? "Family Mapping Completed!"
                : jobData.status === "FAILED"
                ? "Family Mapping Failed"
                : "Family Mapping in Progress"}
            </Title>
            <Text type="secondary">
              {jobData.status === "COMPLETED"
                ? "Family mapping has been completed successfully."
                : jobData.status === "FAILED"
                ? "There was an error during family mapping."
                : "Please wait while we process your family mapping..."}
            </Text>
          </div>

          {/* Success Message */}
          {jobData.status === "COMPLETED" && (
            <Alert
              message="Success!"
              description="Family mapping completed successfully. Family data has been refreshed."
              type="success"
              showIcon
              style={{ marginTop: "24px" }}
            />
          )}

          {/* Error Message */}
          {jobData.status === "FAILED" && (
            <Alert
              message="Error"
              description="Family mapping failed. Please try again."
              type="error"
              showIcon
              style={{ marginTop: "24px" }}
            />
          )}

          {/* In Progress Message */}
          {jobData.status === "IN_PROGRESS" && (
            <div style={{ marginTop: "24px" }}>
              <Progress
                percent={Math.round(jobData.progressPercentage || 0)}
                status="active"
                strokeColor="#1D4ED8"
              />
              <Descriptions
                column={1}
                size="small"
                bordered
                style={{ marginTop: "16px", textAlign: "left" }}
              >
                <Descriptions.Item label="Processed Voters">
                  {jobData.processedVoters ?? 0} / {jobData.totalVoters ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label="Processed Parts">
                  {jobData.processedParts ?? 0} / {jobData.totalParts ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label="Current Part">
                  {jobData.currentPartNo ?? "N/A"}
                </Descriptions.Item>
              </Descriptions>
              <Text type="secondary">
                This process may take several minutes. You can close this window
                and continue working - we'll notify you when it's complete.
              </Text>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Text type="secondary">No job data available</Text>
        </div>
      )}
    </Modal>
  );
};

export default FamilyMappingProgressModal;
