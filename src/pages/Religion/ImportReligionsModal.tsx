import React, { useMemo, useState } from "react";
import { getActiveBackendUrl } from "../../config";
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
import { addReligion } from "../../api/religionApi";
import { RcFile } from "antd/es/upload";
import { SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface ReligionType {
  id: number;
  religionId: number;
  key: string;
  religionName: string;
  religionColor: string;
  religionImage: string;
  orderIndex?: number;
}

interface ImportReligionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  selectedElectionId: string;
  cpanelReligions: ReligionType[];
}

const ImportReligionsModal: React.FC<ImportReligionsModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  selectedElectionId,
  cpanelReligions,
}) => {
  const [selectedReligions, setSelectedReligions] = useState<ReligionType[]>(
    []
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const S3_BASE = "https://thedalnew.s3.ap-south-1.amazonaws.com";

  // Helper function to safely create an RcFile from a blob
  const createRcFile = (blob: Blob, filename: string): RcFile => {
    // Create a regular File object first
    const file = new File([blob], filename, {
      type: blob.type || "image/jpeg",
    });

    // Create a new object that conforms to RcFile by adding only the uid property
    // Avoid trying to set deprecated or read-only properties
    const rcFile = file as RcFile;
    rcFile.uid = `-${Date.now()}`;

    return rcFile;
  };

  // Helper function to convert URL to File object via backend S3 proxy
  const urlToFile = async (url: string, filename: string): Promise<File> => {
    const fetchUrl = url.startsWith(S3_BASE)
      ? `${getActiveBackendUrl()}/api/s3-proxy?url=${encodeURIComponent(url)}`
      : url;
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    return createRcFile(blob, filename);
  };

  const handleImport = async () => {
    if (selectedReligions.length === 0) {
      message.warning("Please select at least one religion to import");
      return;
    }

    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      const totalCount = selectedReligions.length;

      for (let i = 0; i < totalCount; i++) {
        const religion = selectedReligions[i];
        setCurrentStatus(`Importing ${religion.religionName}...`);

        try {
          // Add a small delay between requests to prevent overloading
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }

          // 1. Convert the religion image URL to a RcFile object using proxy
          const imageFile = await urlToFile(
            religion.religionImage,
            `religion-${religion.religionId || religion.id}-${Date.now()}.jpg`
          );

          // 2. Create FormData and use the existing addReligion API
          const formData = new FormData();
          formData.append("religionName", religion.religionName);
          formData.append("religionColor", religion.religionColor);
          formData.append("religionImage", imageFile);

          await addReligion(formData, parseInt(selectedElectionId));

          successCount++;
        } catch (error) {
          console.error(`Failed to import ${religion.religionName}:`, error);
          message.error(
            `Failed to import ${religion.religionName}: ${
              (error as Error).message
            }`
          );
        }

        // Update progress
        const newProgress = Math.round(((i + 1) / totalCount) * 100);
        setProgress(newProgress);
      }

      if (successCount > 0) {
        message.success(
          `Successfully imported ${successCount} out of ${totalCount} religions`
        );
        onImportComplete();
        onClose();
      } else {
        message.error(
          "Failed to import any religions. Please check console for details."
        );
      }
    } catch (error) {
      console.error("Error during import process:", error);
      message.error(`Import process failed: ${(error as Error).message}`);
    } finally {
      setImporting(false);
      setSelectedReligions([]);
      setCurrentStatus("");
    }
  };

   const filteredReligions = useMemo(() => {
      return [...cpanelReligions]
        .sort((a, b) => {
          const aSelected = selectedReligions.some((rel) => rel.id === a.id)
            ? 1
            : 0;
          const bSelected = selectedReligions.some(
            (rel) => rel.id === b.id
          )
            ? 1
            : 0;
          return bSelected - aSelected;
        })
        ?.filter((rel) =>
          rel.religionName.toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [searchValue, cpanelReligions, selectedReligions]);

  const autoCompleteOptions = useMemo(() => {
    return filteredReligions.map((religion) => ({
      label: religion.religionName,
      value: religion.id.toString(),
    }));
  }, [filteredReligions]);

  const handleSelect = (value: string) => {
    const selectedReligion = cpanelReligions.find(
      (religion) => religion.id.toString() === value
    );
    if (selectedReligion) {
      setSelectedReligions((prev) => [...new Set([...prev, selectedReligion])]);
      setSelectedRowKeys((prev) => [
        ...new Set([...prev, selectedReligion.id]),
      ]);
    }
    setSearchValue("");
  };

   const handleSelectRow = (record: ReligionType, selected: boolean) => {
     setSelectedRowKeys((prev) => {
       const newKeys = new Set(prev);
       if (selected) {
         newKeys.add(record.id);
       } else {
         newKeys.delete(record.id);
       }
       return Array.from(newKeys);
     });

     setSelectedReligions((prev) => {
       if (selected) {
         return [...prev, record];
       } else {
         return prev.filter((p) => p.id !== record.id);
       }
     });
   };

   // Handler for "Select All" on current page
   const handleSelectAll = (
     selected: boolean,
     _selectedRows: ReligionType[],
     changeRows: ReligionType[]
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

     setSelectedReligions((prev) => {
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
      title: "Religion Name",
      dataIndex: "religionName",
      key: "religionName",
    },
    {
      title: "Religion Image",
      dataIndex: "religionImage",
      key: "image",
      render: (image: string) => (
        <img
          src={image}
          alt="Religion"
          style={{ width: 50, height: 50, objectFit: "contain" }}
        />
      ),
    },
  ];

  return (
    <Modal
      title="Import Religions"
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
                disabled={selectedReligions.length === 0}
              >
                Import Selected ({selectedReligions.length})
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
            Importing religions... ({progress}% complete)
          </Text>
        </div>
      ) : (
        <div>
          <Text>Search and select religions to import:</Text>
          <AutoComplete
            options={autoCompleteOptions}
            style={{ width: "100%", marginBottom: 16 }}
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleSelect}
            placeholder="Search for a religion"
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
            dataSource={filteredReligions}
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

export default ImportReligionsModal;
