import React, { useMemo, useState } from "react";
import {
  Modal,
  Table,
  Progress,
  message,
  Button,
  Typography,
  AutoComplete,
  Input,
} from "antd";
import { addFeedbackApi } from "../../api/feedbackApi";
import { SearchOutlined } from "@ant-design/icons";
import { FeedbackType } from "../../types/feedback";
interface ImportFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  selectedElectionId: string;
  cpanelFeedbacks: FeedbackType[];
}

const { Text } = Typography;

const ImportFeedbackModal: React.FC<ImportFeedbackModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  selectedElectionId,
  cpanelFeedbacks,
}) => {
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<FeedbackType[]>(
    []
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");

  const handleImport = async () => {
    if (selectedFeedbacks.length === 0) {
      message.warning("Please select at least one feedback to import");
      return;
    }

    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      const totalCount = selectedFeedbacks.length;

      for (let i = 0; i < totalCount; i++) {
        const feedback = selectedFeedbacks[i];
        setCurrentStatus(`Importing ${feedback.issueName}...`);

        try {
          const payload = { issueName: feedback.issueName };
          await addFeedbackApi(payload, parseInt(selectedElectionId));
          successCount++;
        } catch (error) {
          console.error(`Failed to import ${feedback.issueName}:`, error);
        }

        setProgress(Math.round(((i + 1) / totalCount) * 100));
      }

      message.success(
        `Successfully imported ${successCount} out of ${totalCount} feedbacks`
      );
      onImportComplete();
      onClose();
    } catch (error) {
      console.error("Error during import:", error);
      message.error("Failed to complete feedback import");
    } finally {
      setImporting(false);
      setSelectedFeedbacks([]);
      setCurrentStatus("");
    }
  };

  const filteredFeedbacks = useMemo(() => {
    return [...cpanelFeedbacks]
      .sort((a, b) => {
        const aSelected = selectedFeedbacks.some((f) => f.id === a.id) ? 1 : 0;
        const bSelected = selectedFeedbacks.some((f) => f.id === b.id) ? 1 : 0;
        return bSelected - aSelected;
      })
      .filter((feedback) =>
        feedback.issueName.toLowerCase().includes(searchValue.toLowerCase())
      );
  }, [searchValue, cpanelFeedbacks, selectedFeedbacks]);

  const autoCompleteOptions = useMemo(() => {
    return filteredFeedbacks.map((fb) => ({
      label: fb.issueName,
      value: fb.id.toString(),
    }));
  }, [filteredFeedbacks]);

  const handleSelect = (value: string) => {
    const selectedFeedback = cpanelFeedbacks.find(
      (fb) => fb.id.toString() === value
    );
    if (selectedFeedback) {
      setSelectedFeedbacks((prev) => [...new Set([...prev, selectedFeedback])]);
      setSelectedRowKeys((prev) => [
        ...new Set([...prev, selectedFeedback.id]),
      ]);
    }
    setSearchValue("");
  };

  const handleSelectRow = (record: FeedbackType, selected: boolean) => {
    setSelectedRowKeys((prev) => {
      const newKeys = new Set(prev);
      if (selected) newKeys.add(record.id);
      else newKeys.delete(record.id);
      return Array.from(newKeys);
    });

    setSelectedFeedbacks((prev) =>
      selected ? [...prev, record] : prev.filter((f) => f.id !== record.id)
    );
  };

  const handleSelectAll = (
    selected: boolean,
    _selectedRows: FeedbackType[],
    changeRows: FeedbackType[]
  ) => {
    const changedKeys = changeRows.map((row) => row.id);

    setSelectedRowKeys((prev) => {
      const newKeys = new Set(prev);
      if (selected) changedKeys.forEach((key) => newKeys.add(key));
      else changedKeys.forEach((key) => newKeys.delete(key));
      return Array.from(newKeys);
    });

    setSelectedFeedbacks((prev) => {
      if (selected) return [...prev, ...changeRows];
      else return prev.filter((f) => !changedKeys.includes(f.id));
    });
  };

  const rowSelection = {
    selectedRowKeys,
    onSelect: handleSelectRow,
    onSelectAll: handleSelectAll,
    preserveSelectedRowKeys: true,
  };

  const columns = [
    {
      title: "Issue Name",
      dataIndex: "issueName",
      key: "issueName",
    },
  ];

  return (
    <Modal
      title="Import Feedback"
      open={isOpen}
      onCancel={importing ? undefined : onClose}
      footer={
        importing
          ? null
          : [
              <Button key="cancel" onClick={onClose}>
                Cancel
              </Button>,
              <Button
                key="import"
                type="primary"
                style={{ backgroundColor: "#1D4ED8",color:"#fff" }}
                onClick={handleImport}
                disabled={selectedFeedbacks.length === 0}
              >
                Import Selected ({selectedFeedbacks.length})
              </Button>,
            ]
      }
      closable={!importing}
      maskClosable={!importing}
      width={600}
    >
      {importing ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Progress percent={progress} status="active" />
          <Text style={{ display: "block", marginTop: 16 }}>
            {currentStatus}
          </Text>
          <Text style={{ display: "block", marginTop: 8 }}>
            Importing feedbacks... ({progress}% complete)
          </Text>
        </div>
      ) : (
        <div>
          <Text>Search and select feedbacks to import:</Text>
          <AutoComplete
            options={autoCompleteOptions}
            style={{ width: "100%", marginBottom: 16 }}
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleSelect}
            placeholder="Search for a feedback"
            allowClear
          >
            <Input
              suffix={
                <Button style={{ border: "none" }} icon={<SearchOutlined />} />
              }
            />
          </AutoComplete>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredFeedbacks}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
            style={{ marginTop: 16 }}
          />
        </div>
      )}
    </Modal>
  );
};

export default ImportFeedbackModal;
