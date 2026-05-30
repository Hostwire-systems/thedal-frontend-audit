import React, { useEffect, useRef, useState } from "react";
import { Modal, Progress, Button, Typography, Space } from "antd";
import { CloseCircleOutlined, CheckCircleOutlined, LoadingOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface DuplicateProgressModalProps {
  visible: boolean;
  jobId?: string | null;
  onComplete: () => void;
  onClose: () => void;
}

const DuplicateProgressModal: React.FC<DuplicateProgressModalProps & { completed?: boolean }> = ({
  visible,
  jobId,
  onComplete,
  onClose,
  completed = false,
}) => {
  const [status, setStatus] = useState<
    "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "FAILED"
  >("QUEUED");

  useEffect(() => {
    if (!visible) {
      setStatus("QUEUED");
      return;
    }

    // show an indeterminate/in-progress state while visible
    setStatus(completed ? "COMPLETED" : "IN_PROGRESS");
  }, [visible, completed]);

  useEffect(() => {
    if (completed && visible) {
      // inform parent that job completed (allow small UI pause in parent)
      onComplete();
    }
  }, [completed, visible, onComplete]);

  const handleCancel = () => {
    setStatus("CANCELLED");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
      case "FAILED":
      case "CANCELLED":
        return <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
      default:
        return <LoadingOutlined spin style={{ fontSize: 24, color: '#1890ff' }} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "QUEUED":
        return "Queued";
      case "IN_PROGRESS":
        return "Processing";
      case "COMPLETED":
        return "Completed";
      case "FAILED":
        return "Failed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const showCancel = status === "QUEUED" || status === "IN_PROGRESS";
  const showClose = status === "COMPLETED" || status === "FAILED" || status === "CANCELLED";

  return (
    <Modal
      title="Duplicate Check Progress"
      open={visible}
      onCancel={onClose}
      footer={
        <Space>
          {showCancel && (
            <Button danger onClick={handleCancel}>
              Cancel
            </Button>
          )}
          {showClose && (
            <Button type="primary" onClick={onClose}>
              Close
            </Button>
          )}
        </Space>
      }
      maskClosable={false}
      width={480}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ textAlign: 'center' }}>
          {getStatusIcon()}
          <div style={{ marginTop: 8 }}>
            <Text strong style={{ fontSize: 16 }}>{getStatusText()}</Text>
          </div>
        </div>

        {/* Show an indeterminate progress bar while running; show 100% on completed */}
        <Progress
          percent={status === 'COMPLETED' ? 100 : 0}
          status={status === 'COMPLETED' ? 'success' : (status === 'FAILED' || status === 'CANCELLED' ? 'exception' : 'active')}
          format={() => (status === 'COMPLETED' ? '100%' : '')}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">Job ID</Text>
          <Text strong>{jobId || '—'}</Text>
        </div>
      </Space>
    </Modal>
  );
};

export default DuplicateProgressModal;
