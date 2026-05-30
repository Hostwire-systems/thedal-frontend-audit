import React from "react";
import { Modal, Button, Space } from "antd";

interface VoterTickListExportOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFormat: (format: "pdf" | "word") => void;
}

const VoterTickListExportOptionsModal: React.FC<
  VoterTickListExportOptionsModalProps
> = ({ visible, onClose, onSelectFormat }) => {
  return (
    <Modal
      title="Export Voter Tick List"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <p>Please select the desired export format:</p>
      <Space>
        <Button type="primary" onClick={() => onSelectFormat("pdf")}>
          Export as PDF
        </Button>
        <Button type="default" onClick={() => onSelectFormat("word")}>
          Export as Word Document
        </Button>
      </Space>
    </Modal>
  );
};

export default VoterTickListExportOptionsModal;