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
import { addParty } from "../../api/partyApi";
import { RcFile } from "antd/es/upload";
import { SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface PartyType {
  id: number;
  key: string;
  allianceName: string;
  partyName: string;
  partyShortName: string;
  partyColor: string;
  partyImage: string;
  orderIndex?: number;
}

interface ImportPartiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  selectedElectionId: string;
  cpanelParties: PartyType[];
}

const ImportPartiesModal: React.FC<ImportPartiesModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  selectedElectionId,
  cpanelParties,
}) => {
  const [selectedParties, setSelectedParties] = useState<PartyType[]>([]);
  const [importing, setImporting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // Track selected rows explicitly
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

  const handleClose = () => {
    setSelectedParties([]);
    setSelectedRowKeys([]);
    onClose();
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
    if (selectedParties.length === 0) {
      message.warning("Please select at least one party to import");
      return;
    }

    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      const totalCount = selectedParties.length;

      for (let i = 0; i < totalCount; i++) {
        const party = selectedParties[i];
        setCurrentStatus(`Importing ${party.partyName}...`);

        try {
          // Add a small delay between requests to prevent overloading
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }

          // 1. Convert the party image URL to a RcFile object using proxy
          const imageFile = await urlToFile(
            party.partyImage,
            `party-${party.id}-${Date.now()}.jpg`
          );
          console.log("About to add imported party");
          // 2. Use the existing addParty API to add the party with the downloaded image
          await addParty(
            parseInt(selectedElectionId),
            party.allianceName,
            party.partyName,
            party.partyShortName,
            party.partyColor,
            imageFile
          );

          successCount++;
        } catch (error) {
          console.error(`Failed to import ${party.partyName}:`, error);
          // message.error(`Failed to import ${party.partyName}: ${(error as Error).message}`);
        }

        // Update progress
        const newProgress = Math.round(((i + 1) / totalCount) * 100);
        setProgress(newProgress);
      }

      if (successCount > 0) {
        message.success(
          `Successfully imported ${successCount} out of ${totalCount} parties`
        );
        onImportComplete();
        handleClose();
      } else {
        // message.error('Failed to import any parties. Please check console for details.');
      }
    } catch (error) {
      console.error("Error during import process:", error);
      // message.error(`Import process failed: ${(error as Error).message}`);
    } finally {
      setImporting(false);
      setCurrentStatus("");
    }
  };

  // Filtered party list based on search input
  const filteredParties = useMemo(() => {
    return [...cpanelParties]
      .sort((a, b) => {
        const aSelected = selectedParties.some((party) => party.id === a.id)
          ? 1
          : 0;
        const bSelected = selectedParties.some((party) => party.id === b.id)
          ? 1
          : 0;
        return bSelected - aSelected;
      })
      ?.filter(
        (party) =>
          party.partyName.toLowerCase().includes(searchValue.toLowerCase()) ||
          party.partyShortName.toLowerCase().includes(searchValue.toLowerCase())
      );
  }, [searchValue, cpanelParties, selectedParties]);

  // Options for AutoComplete
  const autoCompleteOptions = useMemo(() => {
    return filteredParties.map((party) => ({
      label: party.partyName,
      value: party.id.toString(), // Use string for value
    }));
  }, [filteredParties]);

  const handleSelect = (value: string) => {
    console.log("value", value);
    const selectedParty = cpanelParties.find(
      (party) => party.id.toString() === value
    );
    if (selectedParty) {
      setSelectedParties((prev) => {
        if (!prev.some((p) => p.id === selectedParty.id)) {
          return [...prev, selectedParty];
        }
        return prev;
      });

      setSelectedRowKeys((prev) => {
        if (!prev.includes(selectedParty.id)) {
          return [...prev, selectedParty.id];
        }
        return prev;
      });
    }
    setSearchValue("");
  };

  const handleSelectRow = (record: PartyType, selected: boolean) => {
    setSelectedRowKeys((prev) => {
      const newKeys = new Set(prev);
      if (selected) {
        newKeys.add(record.id);
      } else {
        newKeys.delete(record.id);
      }
      return Array.from(newKeys);
    });

    setSelectedParties((prev) => {
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
    _selectedRows: PartyType[],
    changeRows: PartyType[]
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

    setSelectedParties((prev) => {
      if (selected) {
        return [...prev, ...changeRows];
      } else {
        return prev.filter((p) => !changedKeys.includes(p.id));
      }
    });
  };

  const columns = [
    {
      title: "Party Name",
      dataIndex: "partyName",
      key: "partyName",
    },
    {
      title: "Party Short Name",
      dataIndex: "partyShortName",
      key: "partyShortName",
    },
    {
      title: "Party Image",
      dataIndex: "partyImage",
      key: "image",
      render: (image: string) => (
        <img
          src={image}
          alt="Party"
          style={{ width: 50, height: 50, objectFit: "contain" }}
        />
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onSelect: handleSelectRow,
    onSelectAll: handleSelectAll,
    preserveSelectedRowKeys: true,
  };

  return (
    <Modal
      title="Import Parties"
      open={isOpen}
      onCancel={importing ? undefined : handleClose}
      footer={
        importing
          ? null
          : [
              <Button key="cancel" onClick={handleClose}>
                Cancel
              </Button>,
              <Button
                key="import"
                type="primary"
                style={{ backgroundColor: "#1D4ED8", color: "#fff" }}
                onClick={handleImport}
                disabled={selectedParties.length === 0}
              >
                Import Selected ({selectedParties.length})
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
            Importing parties... ({progress}% complete)
          </Text>
        </div>
      ) : (
        <div>
          <Text>Search and select parties to import:</Text>
          <AutoComplete
            options={autoCompleteOptions}
            style={{ width: "100%", marginBottom: 16 }}
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleSelect}
            placeholder="Search for a party"
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
            dataSource={filteredParties}
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

export default ImportPartiesModal;
