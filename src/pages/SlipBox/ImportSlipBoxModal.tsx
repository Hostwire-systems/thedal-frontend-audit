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
import { SearchOutlined } from "@ant-design/icons";
import { addSlipBoxApi } from "../../api/slipBoxApi";

const { Text } = Typography;

interface SlipBoxType {
  id: number;
  key: string;
  mobileNumber: string;
  slipBoxName: string;
  slipBoxId: string;
}

interface ImportSlipBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  cpanelSlipBoxes: SlipBoxType[];
}

const ImportSlipBoxModal: React.FC<ImportSlipBoxModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  cpanelSlipBoxes,
}) => {
  const [selectedSlipBoxes, setSelectedSlipBoxes] = useState<SlipBoxType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");

  const handleImport = async () => {
    if (selectedSlipBoxes.length === 0) {
      message.warning("Please select at least one slip box to import");
      return;
    }

    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      const totalCount = selectedSlipBoxes.length;

      for (let i = 0; i < totalCount; i++) {
        const slipBox = selectedSlipBoxes[i];
        setCurrentStatus(`Importing ${slipBox.slipBoxName}...`);

        try {
          const payload = {
            mobileNumber: slipBox.mobileNumber,
            slipBoxName: slipBox.slipBoxName,
            slipBoxId: slipBox.slipBoxId,
          };
          await addSlipBoxApi(payload);
          successCount++;
        } catch (error) {
          console.error(`Failed to import ${slipBox.slipBoxName}:`, error);
        }

        // Update progress
        const newProgress = Math.round(((i + 1) / totalCount) * 100);
        setProgress(newProgress);
      }

      message.success(
        `Successfully imported ${successCount} out of ${totalCount} slip boxes`
      );
      setSelectedSlipBoxes([]);
      onImportComplete();
      onClose();
    } catch (error) {
      console.error("Error during import:", error);
      message.error("Failed to complete slip box import");
    } finally {
      setImporting(false);
      setCurrentStatus("");
    }
  };

  const filteredSlipBoxes = useMemo(() => {
    return [...cpanelSlipBoxes]
      .sort((a, b) => {
        const aSelected = selectedSlipBoxes.some((box) => box.id === a.id)
          ? 1
          : 0;
        const bSelected = selectedSlipBoxes.some((box) => box.id === b.id)
          ? 1
          : 0;
        return bSelected - aSelected;
      })
      .filter(
        (slipBox) =>
          slipBox.slipBoxName
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          slipBox.slipBoxId.toLowerCase().includes(searchValue.toLowerCase()) ||
          slipBox.mobileNumber.includes(searchValue)
      );
  }, [searchValue, cpanelSlipBoxes, selectedSlipBoxes]);

  const autoCompleteOptions = useMemo(() => {
    return filteredSlipBoxes.map((box) => ({
      label: `${box.slipBoxName} (${box.slipBoxId}) - ${box.mobileNumber}`,
      value: box.id.toString(),
    }));
  }, [filteredSlipBoxes]);

  const handleSelect = (value: string) => {
    const selectedSlipBox = cpanelSlipBoxes.find(
      (box) => box.id.toString() === value
    );
    if (selectedSlipBox) {
      setSelectedSlipBoxes((prev) => [...new Set([...prev, selectedSlipBox])]);
      setSelectedRowKeys((prev) => [...new Set([...prev, selectedSlipBox.id])]);
    }
    setSearchValue("");
  };

  const handleSelectRow = (record: SlipBoxType, selected: boolean) => {
    setSelectedRowKeys((prev) => {
      const newKeys = new Set(prev);
      if (selected) {
        newKeys.add(record.id);
      } else {
        newKeys.delete(record.id);
      }
      return Array.from(newKeys);
    });

    setSelectedSlipBoxes((prev) => {
      if (selected) {
        return [...prev, record];
      } else {
        return prev.filter((p) => p.id !== record.id);
      }
    });
  };

  const handleSelectAll = (
    selected: boolean,
    _selectedRows: SlipBoxType[],
    changeRows: SlipBoxType[]
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

    setSelectedSlipBoxes((prev) => {
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
      title: "Mobile Number",
      dataIndex: "mobileNumber",
      key: "mobileNumber",
    },
    {
      title: "Slip Box Name",
      dataIndex: "slipBoxName",
      key: "slipBoxName",
    },
    {
      title: "Slip Box ID",
      dataIndex: "slipBoxId",
      key: "slipBoxId",
    },
  ];

  return (
    <Modal
      title="Import Slip Boxes"
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
                disabled={selectedSlipBoxes.length === 0}
              >
                Import Selected ({selectedSlipBoxes.length})
              </Button>,
            ]
      }
      closable={!importing}
      maskClosable={!importing}
      width={800}
    >
      {importing ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Progress percent={progress} status="active" />
          <Text style={{ display: "block", marginTop: 16 }}>
            {currentStatus}
          </Text>
          <Text style={{ display: "block", marginTop: 8 }}>
            Importing slip boxes... ({progress}% complete)
          </Text>
        </div>
      ) : (
        <div>
          <Text>Search and select slip boxes to import:</Text>
          <AutoComplete
            options={autoCompleteOptions}
            style={{ width: "100%", marginBottom: 16 }}
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleSelect}
            placeholder="Search by name, ID or mobile number"
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
            dataSource={filteredSlipBoxes}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
            style={{ marginTop: 16 }}
            scroll={{ y: 400 }}
          />
        </div>
      )}
    </Modal>
  );
};

export default ImportSlipBoxModal;
