import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Table,
  Progress,
  message,
  Button,
  Typography,
  Select,
  AutoComplete,
  Input,
  Tag,
} from "antd";
import { addCaste } from "../../api/casteApi";
import { SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

interface CasteType {
  id: number;
  casteId: number;
  key: string;
  casteName: string;
  religionName?: string;
  religionId?: number;
  orderIndex?: number;
}

interface ReligionType {
  id: number;
  religionName: string;
}

interface ImportCastesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  selectedElectionId: string;
  cpanelCastes: CasteType[];
  religions: ReligionType[];
}

const ImportCastesModal: React.FC<ImportCastesModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  selectedElectionId,
  cpanelCastes,
  religions,
}) => {
  const [selectedCastes, setSelectedCastes] = useState<CasteType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");
  const [casteReligionMap, setCasteReligionMap] = useState<{
    [key: string]: number;
  }>({});
  const [filterReligion, setFilterReligion] = useState<string | null>(null);


  // Map religions by name for easy lookup
  const religionNameToIdMap = useMemo(() => {
    const map: Record<string, number> = {};
    religions.forEach((religion) => {
      map[religion.religionName.toLowerCase()] = religion.id;
    });
    return map;
  }, [religions]);

  // Auto-select original religion when caste is selected
useEffect(() => {
  if (selectedCastes.length === 0) return;

  const initialMap: Record<string, number> = {};

  selectedCastes.forEach((caste) => {
    const casteKey = caste.id.toString();
    const religionName = caste.religionName?.toLowerCase();
    const religionId = religionNameToIdMap[religionName || ""];

    if (religionId) {
      initialMap[casteKey] = religionId;
    }
  });

  setCasteReligionMap(initialMap);
}, [selectedCastes, religionNameToIdMap]);

 const castesWithKeys = useMemo(() => {
   return cpanelCastes.map((caste) => ({
     ...caste,
     key: caste.id.toString(),
   }));
 }, [cpanelCastes]);

  const handleClose = () => {
    setSelectedRowKeys([]);
    setSelectedCastes([]);
    onClose();
  };

  const handleImport = async () => {
    if (selectedCastes.length === 0) {
      message.warning("Please select at least one caste to import");
      return;
    }

    // Check if all selected castes have a religion assigned
    const unassignedCastes = selectedCastes.filter(
      (caste) => !casteReligionMap[caste.key]
    );
    if (unassignedCastes.length > 0) {
      message.error(
        `Please assign religions to all selected castes (${unassignedCastes.length} unassigned)`
      );
      return;
    }

    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      const totalCount = selectedCastes.length;

      for (let i = 0; i < totalCount; i++) {
        const caste = selectedCastes[i];
        const religionId = casteReligionMap[caste.key];
        setCurrentStatus(`Importing ${caste.casteName}...`);

        try {
          // Add a small delay between requests to prevent overloading
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          await addCaste(
            caste.casteName,
            religionId,
            parseInt(selectedElectionId)
          );

          successCount++;
        } catch (error) {
          console.error(`Failed to import ${caste.casteName}:`, error);
          message.error(
            `Failed to import ${caste.casteName}: ${(error as Error).message}`
          );
        }

        // Update progress
        const newProgress = Math.round(((i + 1) / totalCount) * 100);
        setProgress(newProgress);
      }

      if (successCount > 0) {
        message.success(
          `Successfully imported ${successCount} out of ${totalCount} castes`
        );
        onImportComplete();
        handleClose();
      } else {
        message.error(
          "Failed to import any castes. Please check console for details."
        );
      }
    } catch (error) {
      console.error("Error during import process:", error);
      message.error(`Import process failed: ${(error as Error).message}`);
    } finally {
      setImporting(false);
      setSelectedCastes([]);
      setCurrentStatus("");
      setCasteReligionMap({});
    }
  };

  const handleReligionChange = (casteKey: string, religionId: number) => {
    setCasteReligionMap((prevMap) => ({
      ...prevMap,
      [casteKey]: religionId,
    }));
  };

  const columns = [
    {
      title: "Caste Name",
      dataIndex: "casteName",
      key: "casteName",
    },

    {
      title: "Original Religion",
      dataIndex: "religionName",
      key: "religionName",
      render: (religionName: string) => (
        <Tag color="blue">{religionName || "Not specified"}</Tag>
      ),
    },

    {
      title: "Assign Religion",
      key: "assignReligion",
      render: (record: CasteType) => (
        <Select
          showSearch
          style={{ width: "100%" }}
          placeholder="Select Religion"
          optionFilterProp="children"
          onChange={(value) =>
            handleReligionChange(record.id.toString(), value)
          }
          value={casteReligionMap[record.id.toString()] ?? undefined}
          options={religions.map((r) => ({
            label: r.religionName,
            value: r.id,
          }))}
        />
      ),
    },
  ];

  const filteredCastes = useMemo(() => {
    let filtered = [...castesWithKeys];

    if (filterReligion) {
      filtered = filtered.filter(
        (c) => c.religionName?.toLowerCase() === filterReligion.toLowerCase()
      );
    }

    return filtered
      .sort((a, b) => {
        const aSelected = selectedCastes.some((caste) => caste.id === a.id)
          ? 1
          : 0;
        const bSelected = selectedCastes.some((caste) => caste.id === b.id)
          ? 1
          : 0;
        return bSelected - aSelected;
      })
      .filter((caste) =>
        caste.casteName.toLowerCase().includes(searchValue.toLowerCase())
      );
  }, [searchValue, cpanelCastes, selectedCastes, filterReligion]);

  const autoCompleteOptions = useMemo(() => {
    return filteredCastes.map((caste) => ({
      label: `${caste.casteName} (${caste.religionName || "No religion"})`,
      value: caste.id.toString(),
    }));
  }, [filteredCastes]);

  const handleSelect = (value: string) => {
    const selectedCaste = cpanelCastes.find(
      (caste) => caste.id.toString() === value
    );
    if (selectedCaste) {
      setSelectedCastes((prev) => [...new Set([...prev, selectedCaste])]);
      setSelectedRowKeys((prev) => [...new Set([...prev, selectedCaste.id])]);
    }
    setSearchValue("");
  };

  const handleSelectRow = (record: CasteType, selected: boolean) => {
    setSelectedRowKeys((prev) => {
      const newKeys = new Set(prev);
      if (selected) {
        newKeys.add(record.id);
      } else {
        newKeys.delete(record.id);
      }
      return Array.from(newKeys);
    });

    setSelectedCastes((prev) => {
      if (selected) {
        return [...prev, record];
      } else {
        return prev.filter((p) => p.id !== record.id);
      }
    });
  };

  const getUniqueOriginalReligions = useMemo(() => {
    const religionsSet = new Set<string>();
    cpanelCastes.forEach((caste) => {
      if (caste.religionName) {
        religionsSet.add(caste.religionName.toLowerCase());
      }
    });
    return Array.from(religionsSet);
  }, [cpanelCastes]);

  // Handler for "Select All" on current page
  const handleSelectAll = (
    selected: boolean,
    _selectedRows: CasteType[],
    changeRows: CasteType[]
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

    setSelectedCastes((prev) => {
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
      title="Import Castes"
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
                disabled={selectedCastes.length === 0}
              >
                Import Selected ({selectedCastes.length})
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
            Importing castes... ({progress}% complete)
          </Text>
        </div>
      ) : (
        <div>
          <Text>Search and select castes to import and assign religions:</Text>
          <AutoComplete
            options={autoCompleteOptions}
            style={{ width: "100%", marginBottom: 16 }}
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleSelect}
            placeholder="Search for a caste"
            allowClear
          >
            <Input
              suffix={
                <Button style={{ border: "none" }} icon={<SearchOutlined />} />
              }
            />
          </AutoComplete>
          <Select
            allowClear
            placeholder="Filter by Religion"
            style={{ width: "40%", marginBottom: 16, marginTop: 4 }}
            onChange={(value) => setFilterReligion(value)}
            options={getUniqueOriginalReligions.map((religionName) => ({
              label:
                religionName.charAt(0).toUpperCase() + religionName.slice(1),
              value: religionName,
            }))}
          />
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredCastes}
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

export default ImportCastesModal;
