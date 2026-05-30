import React from "react";
import { Modal, Select, Button, message } from "antd";

const { Option } = Select;

interface SchemeExportModalProps {
  open: boolean;
  onClose: () => void;
  schemes: any[];
  loading: boolean;
  onExport: (schemeNames: string[]) => void;
}

const SchemeExportModal: React.FC<SchemeExportModalProps> = ({
  open,
  onClose,
  schemes,
  loading,
  onExport,
}) => {
  const [selectedSchemes, setSelectedSchemes] = React.useState<string[]>([]);

  const handleExport = () => {
    if (selectedSchemes.length === 0) {
      message.warning("Please select at least one scheme");
      return;
    }
    onExport(selectedSchemes);
    onClose();
    setSelectedSchemes([]);
  };

  return (
    <Modal
      title="Scheme Export"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          onClick={handleExport}
          disabled={loading || schemes.length === 0}
        >
          Export
        </Button>,
      ]}
    >
      <div className="py-4">
        <label className="block text-[15px] font-medium text-[#1F2937] mb-2">
          Select Schemes
        </label>
        <Select
          mode="multiple"
          placeholder="Select one or more schemes"
          className="w-full"
          loading={loading}
          value={selectedSchemes}
          onChange={setSelectedSchemes}
          allowClear
        >
          {schemes.map((scheme: any) => (
            <Option key={scheme.schemeId} value={scheme.schemeName}>
              {scheme.schemeName}
            </Option>
          ))}
        </Select>
      </div>
    </Modal>
  );
};

export default SchemeExportModal;
