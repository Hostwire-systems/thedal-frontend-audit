import React, { useState, useEffect } from "react";
import { Modal, Button, Select, Spin, message } from "antd";
import { getPartsApi } from "../../api/partApi"; // Assuming this API exists and returns part numbers
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const { Option } = Select;

interface PartSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectParts: (parts: number[]) => void;
  electionId: string | null;
}

const PartSelectionModal: React.FC<PartSelectionModalProps> = ({
  visible,
  onClose,
  onSelectParts,
  electionId,
}) => {
  const [selectedParts, setSelectedParts] = useState<number[]>([]);
  const [availableParts, setAvailableParts] = useState<any[]>([]);
  const [loadingParts, setLoadingParts] = useState<boolean>(false);

  useEffect(() => {
    const fetchParts = async () => {
      if (!electionId) {
        message.warning("Please select an election first.");
        return;
      }
      setLoadingParts(true);
      try {
        const response = await getPartsApi(parseInt(electionId));
        // Axios returns the body in .data. The API might return an array directly or { status: "success", data: [...] }
        const responseData = response.data;
        const partsArray = Array.isArray(responseData) 
          ? responseData 
          : (responseData && typeof responseData === "object" && Array.isArray(responseData.data) ? responseData.data : []);

        if (partsArray.length > 0 || Array.isArray(partsArray)) {
          const mappedParts = partsArray
            .map((part: any) => ({
              partNo: Number(part.partNo || part.partNumber),
              partNameEnglish: part.partNameEnglish || part.partName || "",
            }))
            .filter((part: any) => !isNaN(part.partNo) && part.partNo > 0)
            .sort((a: any, b: any) => a.partNo - b.partNo);

          // Deduplicate by partNo
          const uniqueParts = Array.from(
            new Map(mappedParts.map((item: any) => [item.partNo, item])).values()
          );

          setAvailableParts(uniqueParts);
        } else {
          message.error("Failed to fetch part numbers.");
          setAvailableParts([]);
        }
      } catch (error) {
        console.error("Error fetching parts:", error);
        message.error("Error fetching part numbers.");
        setAvailableParts([]);
      } finally {
        setLoadingParts(false);
      }
    };

    if (visible) {
      fetchParts();
    } else {
      // Reset selected parts when modal closes
      setSelectedParts([]);
    }
  }, [visible, electionId]);

  const handleOk = () => {
    if (selectedParts.length === 0) {
      message.warning("Please select at least one part number.");
      return;
    }
    onSelectParts(selectedParts);
    onClose();
  };

  return (
    <Modal
      title="Select Part Numbers"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleOk}
          loading={loadingParts}
          disabled={loadingParts || selectedParts.length === 0}
        >
          Select
        </Button>,
      ]}
    >
      <Spin spinning={loadingParts}>
        <Select
          mode="multiple"
          allowClear
          style={{ width: "100%" }}
          placeholder="Select part numbers"
          value={selectedParts}
          onChange={setSelectedParts}
          optionFilterProp="label"
          showSearch
          disabled={loadingParts}
        >
          {availableParts.map((part: any) => {
            const label = part.partNameEnglish ? `${part.partNo} - ${part.partNameEnglish}` : `Part ${part.partNo}`;
            return (
              <Option key={part.partNo} value={part.partNo} label={label}>
                {label}
              </Option>
            );
          })}
        </Select>
      </Spin>
    </Modal>
  );
};

export default PartSelectionModal;