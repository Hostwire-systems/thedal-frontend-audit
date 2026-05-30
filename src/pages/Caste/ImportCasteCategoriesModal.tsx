import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Table,
  Progress,
  message,
  Button,
  Typography,
  Select,
} from "antd";
import { addCasteCategory } from "../../api/casteCategoryApi";

const { Text } = Typography;

interface CasteCategoryType {
  id: number;
  casteId: number;
  key: string;
  casteCategoryName: string;
  orderIndex?: number;
}

interface ImportCasteCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  selectedElectionId: string;
  cpanelCastes: CasteCategoryType[];
}

const ImportCasteCategoriesModal: React.FC<ImportCasteCategoriesModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  selectedElectionId,
  cpanelCastes,
}) => {
  const [selectedCasteCategories, setSelectedCasteCategories] = useState<
    CasteCategoryType[]
  >([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");

  const casteCategoriesWithKeys = useMemo(() => {
    return cpanelCastes.map((casteCategory) => ({
      ...casteCategory,
      key: casteCategory.id.toString(),
    }));
  }, [cpanelCastes]);

  const handleClose = () => {
    setSelectedRowKeys([]);
    setSelectedCasteCategories([]);
    onClose();
  };

  const handleImport = async () => {
    if (selectedCasteCategories.length === 0) {
      message.warning("Please select at least one caste category to import");
      return;
    }

    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      const totalCount = selectedCasteCategories.length;

      for (let i = 0; i < totalCount; i++) {
        const casteCategory = selectedCasteCategories[i];
        setCurrentStatus(`Importing ${casteCategory.casteCategoryName}...`);

        try {
          // Add a small delay between requests to prevent overloading
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

            await addCasteCategory(
              casteCategory.casteCategoryName,
              parseInt(selectedElectionId)
            );

          successCount++;
        } catch (error) {
          console.error(
            `Failed to import ${casteCategory.casteCategoryName}:`,
            error
          );
          message.error(
            `Failed to import ${casteCategory.casteCategoryName}: ${
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
          `Successfully imported ${successCount} out of ${totalCount} caste categories`
        );
        onImportComplete();
        handleClose();
      } else {
        message.error(
          "Failed to import any caste categories. Please check console for details."
        );
      }
    } catch (error) {
      console.error("Error during import process:", error);
      message.error(`Import process failed: ${(error as Error).message}`);
    } finally {
      setImporting(false);
      setSelectedCasteCategories([]);
      setCurrentStatus("");
    }
  };

  const columns = [
    {
      title: "Caste Category Name",
      dataIndex: "casteCategoryName",
      key: "casteCategoryName",
    },
  ];

  const filteredCasteCategories = useMemo(() => {
    let filtered = [...casteCategoriesWithKeys];

    return filtered
      .sort((a, b) => {
        const aSelected = selectedCasteCategories.some(
          (casteCategory) => casteCategory.id === a.id
        )
          ? 1
          : 0;
        const bSelected = selectedCasteCategories.some(
          (casteCategory) => casteCategory.id === b.id
        )
          ? 1
          : 0;
        return bSelected - aSelected;
      })
      .filter((casteCategory) =>
        casteCategory.casteCategoryName
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      );
  }, [searchValue, cpanelCastes, selectedCasteCategories]);

  // const autoCompleteOptions = useMemo(() => {
  //   return filteredCasteCategories.map((casteCategory) => ({
  //     label: `${casteCategory.casteCategoryName}`,
  //     value: casteCategory.id.toString(),
  //   }));
  // }, [filteredCasteCategories]);

  // const handleSelect = (value: string) => {
  //   const selectedCasteCategory = cpanelCastes.find(
  //     (casteCategory) => casteCategory.id.toString() === value
  //   );
  //   if (selectedCasteCategory) {
  //     setSelectedCasteCategories((prev) => [
  //       ...new Set([...prev, selectedCasteCategory]),
  //     ]);
  //     setSelectedRowKeys((prev) => [
  //       ...new Set([...prev, selectedCasteCategory.id]),
  //     ]);
  //   }
  //   setSearchValue("");
  // };

  const handleSelectRow = (record: CasteCategoryType, selected: boolean) => {
    setSelectedRowKeys((prev) => {
      const newKeys = new Set(prev);
      if (selected) {
        newKeys.add(record.id);
      } else {
        newKeys.delete(record.id);
      }
      return Array.from(newKeys);
    });

    setSelectedCasteCategories((prev) => {
      if (selected) {
        return [...prev, record];
      } else {
        return prev.filter((p) => p.id !== record.id);
      }
    });
  };

  const handleSelectAll = (
    selected: boolean,
    _selectedRows: CasteCategoryType[],
    changeRows: CasteCategoryType[]
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

    setSelectedCasteCategories((prev) => {
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

  return (
    <Modal
      title="Import Caste Categories"
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
                disabled={selectedCasteCategories.length === 0}
              >
                Import Selected ({selectedCasteCategories.length})
              </Button>,
            ]
      }
      closable={!importing}
      maskClosable={!importing}
      width={900}
    >
      {importing ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Progress percent={progress} status="active" />
          <Text style={{ display: "block", marginTop: 16 }}>
            {currentStatus}
          </Text>
          <Text style={{ display: "block", marginTop: 8 }}>
            Importing caste categories... ({progress}% complete)
          </Text>
        </div>
      ) : (
        <div>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredCasteCategories}
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

export default ImportCasteCategoriesModal;
