import React, { useState } from "react";
import { Modal, Select, Radio, Button, message } from "antd";
import CustomRadioGroup from "./common/CustomRadioGroup";

interface GenerateFamilySlipModalProps {
  open: boolean;
  onClose: () => void;
  availableParts: any[];
  onGenerate: (partNo: number, language: "english" | "regional") => Promise<void>;
  loading?: boolean;
}

const GenerateFamilySlipModal: React.FC<GenerateFamilySlipModalProps> = ({
  open,
  onClose,
  availableParts,
  onGenerate,
  loading = false,
}) => {
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  const [language, setLanguage] = useState<"english" | "regional">("english");

  const handleGenerate = async () => {
    if (selectedPart === null) {
      message.warning("Please select a part number");
      return;
    }
    await onGenerate(selectedPart, language);
  };

  const handleClose = () => {
    setSelectedPart(null);
    setLanguage("english");
    onClose();
  };

  React.useEffect(() => {
    console.log("Available parts:", availableParts);
  }, [availableParts]);

  return (
    <Modal
      title="Generate Family Slip"
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          key="generate"
          type="primary"
          onClick={handleGenerate}
          loading={loading}
          style={{ backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" }}
        >
          Generate
        </Button>,
      ]}
      width={400}
    >
      <div style={{ padding: "10px 0" }}>
        <div style={{ marginBottom: "8px", fontWeight: 600 }}>Select Part</div>
        <Select
          placeholder="Choose part number"
          value={selectedPart ?? undefined}
          onChange={(value) => setSelectedPart(Number(value))}
          style={{ width: "100%" }}
          showSearch
          optionFilterProp="children"
        >
          {availableParts.map((part) => (
            <Select.Option key={part.partNo} value={part.partNo}>
              {part.partNo}
            </Select.Option>
          ))}
        </Select>

        <div style={{ marginTop: "20px", marginBottom: "8px", fontWeight: 600 }}>Select Language</div>
        <CustomRadioGroup

          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <Radio value="english">English</Radio>
          <Radio value="regional">Regional</Radio>
        </CustomRadioGroup>
      </div>
    </Modal>
  );
};

export default GenerateFamilySlipModal;
