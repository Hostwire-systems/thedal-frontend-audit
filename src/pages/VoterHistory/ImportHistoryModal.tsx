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
import { addHistory } from "../../api/historyApi"; // Update with your actual API import
import { getActiveBackendUrl } from "../../config";
import { RcFile } from "antd/es/upload";
import { SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface VoterHistoryType {
  id: number;
  voterHistoryId: number;
  key: string;
  voterHistoryName: string;
  voterHistoryImage: string;
  orderIndex?: number;
}

interface ImportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  selectedElectionId: string;
  cpanelHistories: VoterHistoryType[];
}

const ImportHistoryModal: React.FC<ImportHistoryModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  selectedElectionId,
  cpanelHistories,
}) => {
  const [selectedHistories, setSelectedHistories] = useState<
    VoterHistoryType[]
  >([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const S3_BASE = "https://thedalnew.s3.ap-south-1.amazonaws.com";

  // Helper function to safely create an RcFile from a blob
  const createRcFile = (blob: Blob, filename: string): RcFile => {
    const file = new File([blob], filename, {
      type: blob.type || "image/jpeg",
    });

    const rcFile = file as RcFile;
    rcFile.uid = `-${Date.now()}`;

    return rcFile;
  };

  // Converts an S3 URL to backend proxy URL
  const toProxyUrl = (url: string): string => {
    if (url.startsWith(S3_BASE)) {
      return `${getActiveBackendUrl()}/api/s3-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // Helper function to convert URL to File object via Vite dev proxy
  const urlToFile = async (url: string, filename: string): Promise<File> => {
    const fetchUrl = toProxyUrl(url);
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    return createRcFile(blob, filename);
  };

  const handleImport = async () => {
    if (selectedHistories.length === 0) {
      message.warning("Please select at least one history to import");
      return;
    }

    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      const totalCount = selectedHistories.length;

      for (let i = 0; i < totalCount; i++) {
        const history = selectedHistories[i];
        setCurrentStatus(`Importing ${history.voterHistoryName}...`);

        try {
          // Add a small delay between requests to prevent overloading
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }

          // 1. Convert the history image URL to a RcFile object using proxy
          const imageFile = await urlToFile(
            history.voterHistoryImage,
            `history-${history.voterHistoryId || history.id}-${Date.now()}.jpg`
          );

          // 2. Create FormData and use the existing addHistory API
          const formData = new FormData();
          formData.append("voterHistoryName", history.voterHistoryName);
          formData.append("voterHistoryImage", imageFile);

         const response= await addHistory(formData, parseInt(selectedElectionId));
          successCount++;
        } catch (error) {
          console.error(`Failed to import ${history.voterHistoryName}:`, error);
          message.error(
            `Failed to import ${history.voterHistoryName}: ${
              (error as Error).message
            }`
          );
        }

        // Update progress
        const newProgress = Math.round(((i + 1) / totalCount) * 100);
        setProgress(newProgress);
      }
      console.log("success count", successCount);
      if (successCount > 0) {
        message.success(
          `Successfully imported ${successCount} out of ${totalCount} histories`
        );
        onImportComplete();
        onClose();
      } else {
        // message.error(
        //   "Failed to import any histories. Please check console for details."
        // );
      }
    } catch (error) {
      console.error("Error during import process:", error);
      // message.error(`Import process failed: ${(error as Error).message}`);
    } finally {
      setImporting(false);
      setSelectedHistories([]);
      setCurrentStatus("");
    }
  };

  const filteredHistories = useMemo(() => {
    return [...cpanelHistories]
      .sort((a, b) => {
        const aSelected = selectedHistories.some((hist) => hist.id === a.id)
          ? 1
          : 0;
        const bSelected = selectedHistories.some((hist) => hist.id === b.id)
          ? 1
          : 0;
        return bSelected - aSelected;
      })
      ?.filter((hist) =>
        hist.voterHistoryName.toLowerCase().includes(searchValue.toLowerCase())
      );
  }, [searchValue, cpanelHistories, selectedHistories]);

  const autoCompleteOptions = useMemo(() => {
    return filteredHistories.map((history) => ({
      label: history.voterHistoryName,
      value: history.id.toString(),
    }));
  }, [filteredHistories]);

  const handleSelect = (value: string) => {
    const selectedHistory = cpanelHistories.find(
      (history) => history.id.toString() === value
    );
    if (selectedHistory) {
      setSelectedHistories((prev) => [...new Set([...prev, selectedHistory])]);
      setSelectedRowKeys((prev) => [...new Set([...prev, selectedHistory.id])]);
    }
    setSearchValue("");
  };

  const handleSelectRow = (record: VoterHistoryType, selected: boolean) => {
    setSelectedRowKeys((prev) => {
      const newKeys = new Set(prev);
      if (selected) {
        newKeys.add(record.id);
      } else {
        newKeys.delete(record.id);
      }
      return Array.from(newKeys);
    });

    setSelectedHistories((prev) => {
      if (selected) {
        return [...prev, record];
      } else {
        return prev.filter((p) => p.id !== record.id);
      }
    });
  };

  const handleSelectAll = (
    selected: boolean,
    _selectedRows: VoterHistoryType[],
    changeRows: VoterHistoryType[]
  ) => {
    const changedKeys = changeRows.map((row) => row.id);

    setSelectedRowKeys((prev) => {
      const newKeys = new Set(prev);
      if (selected) {
        changedKeys.forEach((key) => newKeys.add(key));
      } else {
        changedKeys.forEach((key) => newKeys.delete(key));
      }
      return Array.from(newKeys);
    });

    setSelectedHistories((prev) => {
      if (selected) {
        return [...prev, ...changeRows];
      } else {
        return prev.filter((p) => !changedKeys.includes(p.id));
      }
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
      title: "History Name",
      dataIndex: "voterHistoryName",
      key: "voterHistoryName",
    },
    {
      title: "History Image",
      dataIndex: "voterHistoryImage",
      key: "image",
      render: (image: string) => (
        <img
          src={image}
          alt="History"
          style={{ width: 50, height: 50, objectFit: "contain" }}
        />
      ),
    },
  ];

  return (
    <Modal
      title="Import Voter Histories"
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
                style={{ backgroundColor: "#1D4ED8", color: "#fff" }}
                onClick={handleImport}
                disabled={selectedHistories.length === 0}
              >
                Import Selected ({selectedHistories.length})
              </Button>,
            ]
      }
      closable={!importing}
      maskClosable={!importing}
      width={700}
    >
      {importing ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Progress percent={progress} status="active" />
          <Text style={{ display: "block", marginTop: 16 }}>
            {currentStatus}
          </Text>
          <Text style={{ display: "block", marginTop: 8 }}>
            Importing histories... ({progress}% complete)
          </Text>
        </div>
      ) : (
        <div>
          <Text>Search and select histories to import:</Text>
          <AutoComplete
            options={autoCompleteOptions}
            style={{ width: "100%", marginBottom: 16 }}
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleSelect}
            placeholder="Search for a history"
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
            dataSource={filteredHistories}
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

export default ImportHistoryModal;
