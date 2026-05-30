import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Modal,
  Table,
  Progress,
  message,
  Button,
  Typography,
  Select,
  Input,
  AutoComplete,
  Tag,
} from "antd";
import { addSubCaste } from "../../api/subCasteApi";
import { fetchCaste } from "../../api/casteApi";
import { SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

interface SubCasteType {
  subCasteId: number;
  id: number;
  key: string;
  subCasteName: string;
  casteName?: string;
  religionName?: string;
  orderIndex?: number;
}

interface ReligionType {
  id: number;
  religionName: string;
}

interface CasteType {
  id: number;
  casteName: string;
  religionId: number;
}

interface ImportSubCastesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  selectedElectionId: string;
  cpanelSubCastes: SubCasteType[];
  religions: ReligionType[];
}

const ImportSubCastesModal: React.FC<ImportSubCastesModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  selectedElectionId,
  cpanelSubCastes,
  religions,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedSubCastes, setSelectedSubCastes] = useState<SubCasteType[]>(
    []
  );
  const hasAutoAssigned = useRef(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");
  const [subCasteMappings, setSubCasteMappings] = useState<{
    [key: string]: { religionId: number; casteId: number };
  }>({});
  const [castesByReligion, setCastesByReligion] = useState<{
    [religionId: number]: CasteType[];
  }>({});
  const [filterReligionName, setFilterReligionName] = useState<string | null>(
    null
  );
  const [filterCasteName, setFilterCasteName] = useState<string | null>(null);

  // useEffect(() => {
  //   const autoAssignMappings = async () => {
  //     const newMappings: typeof subCasteMappings = {};

  //     for (const subCaste of cpanelSubCastes) {
  //       const matchedReligion = religions.find(
  //         (r) =>
  //           r.religionName.toLowerCase() ===
  //           (subCaste.religionName || "").toLowerCase()
  //       );

  //       if (matchedReligion) {
  //         let castes = castesByReligion[matchedReligion.id];

  //         // Fetch castes if not already fetched
  //         if (!castes) {
  //           castes = await fetchCastesForReligion(matchedReligion.id);
  //         }

  //         const matchedCaste = castes.find(
  //           (c) =>
  //             c.casteName.toLowerCase() ===
  //             (subCaste.casteName || "").toLowerCase()
  //         );

  //         if (matchedCaste) {
  //           newMappings[subCaste.key] = {
  //             religionId: matchedReligion.id,
  //             casteId: matchedCaste.id,
  //           };
  //         } else {
  //           newMappings[subCaste.key] = {
  //             religionId: matchedReligion.id,
  //             casteId: 0,
  //           };
  //         }
  //       }
  //     }

  //     setSubCasteMappings((prev) => ({ ...prev, ...newMappings }));
  //   };

  //   if (cpanelSubCastes.length && religions.length) {
  //     autoAssignMappings();
  //   }
  // }, [cpanelSubCastes, religions]);

  useEffect(() => {
    console.log("Useeffect 1");
    if (hasAutoAssigned.current || !cpanelSubCastes.length || !religions.length)
      return;

    const autoAssignMappings = async () => {
      const newMappings: typeof subCasteMappings = {};

      for (const subCaste of cpanelSubCastes) {
        const matchedReligion = religions.find(
          (r) =>
            r.religionName.toLowerCase() ===
            (subCaste.religionName || "").toLowerCase()
        );
        console.log("Matched religion", matchedReligion);
        console.log("castes by religion", castesByReligion);
        if (matchedReligion) {
          let castes = castesByReligion[matchedReligion.id];

          // Only fetch if not already present
          if (!castes) {
            castes = await fetchCastesForReligion(matchedReligion.id);
          }

          const matchedCaste = castes.find(
            (c) =>
              c.casteName.toLowerCase() ===
              (subCaste.casteName || "").toLowerCase()
          );

          newMappings[subCaste.key] = {
            religionId: matchedReligion.id,
            casteId: matchedCaste?.id || 0,
          };
        }
      }

      setSubCasteMappings((prev) => ({ ...prev, ...newMappings }));
      hasAutoAssigned.current = true;
    };

    autoAssignMappings();
  }, [cpanelSubCastes, religions]);

  useEffect(() => {
    console.log("Useeffect 2");

    if (
      !isOpen ||
      cpanelSubCastes.length === 0 ||
      religions.length === 0 ||
      Object.values(castesByReligion).flat().length === 0
    )
      return;

    const mappings: { [key: string]: { religionId: number; casteId: number } } =
      {};

    cpanelSubCastes.forEach((subcaste) => {
      const religion = religions.find(
        (r) => r.religionName === subcaste.religionName
      );
      if (religion) {
        const castes = castesByReligion[religion.id] || [];
        const caste = castes.find((c) => c.casteName === subcaste.casteName);

        if (caste) {
          mappings[subcaste.key] = {
            religionId: religion.id,
            casteId: caste.id,
          };
        }
      }
    });

    setSubCasteMappings(mappings);
  }, [isOpen, cpanelSubCastes, religions]);

  const handleClose = () => {
    setSelectedRowKeys([]);
    setSelectedSubCastes([]);
    onClose();
  };

  // Fetch castes for a religion
  const fetchCastesForReligion = async (religionId: number) => {
    try {
      const response = await fetchCaste(
        parseInt(selectedElectionId),
        religionId
      );
      if (response?.data?.data) {
        const fetchedCastes = response.data.data.map((caste: any) => ({
          id: caste.casteId,
          casteName: caste.casteName,
          religionId: religionId,
        }));
        console.log("fetchedCastes", fetchedCastes);

        setCastesByReligion((prev) => ({
          ...prev,
          [religionId]: fetchedCastes,
        }));

        return fetchedCastes;
      }
      return [];
    } catch (error) {
      console.error("Error fetching castes for religion:", error);
      return [];
    }
  };

  // Handle religion selection for a subcaste
  const handleReligionChange = async (
    subCasteKey: string,
    religionId: number
  ) => {
    // Clear any existing caste selection when religion changes
    setSubCasteMappings((prev) => ({
      ...prev,
      [subCasteKey]: { religionId, casteId: 0 },
    }));

    // Fetch castes for this religion if not already fetched
    if (!castesByReligion[religionId]) {
      await fetchCastesForReligion(religionId);
    }
  };

  // Handle caste selection
  const handleCasteChange = (subCasteKey: string, casteId: number) => {
    setSubCasteMappings((prev) => ({
      ...prev,
      [subCasteKey]: {
        ...prev[subCasteKey],
        casteId,
      },
    }));
  };

  const handleImport = async () => {
    if (selectedSubCastes.length === 0) {
      message.warning("Please select at least one sub-caste to import");
      return;
    }

    // Check if all selected sub-castes have both religion and caste assigned
    const validationErrors = selectedSubCastes.filter((subcaste) => {
      const mapping = subCasteMappings[subcaste.key];
      return !mapping || !mapping.religionId || !mapping.casteId;
    });

    if (validationErrors.length > 0) {
      message.error(
        `Please assign both religion and caste to all selected sub-castes (${validationErrors.length} incomplete)`
      );
      return;
    }

    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      const totalCount = selectedSubCastes.length;

      for (let i = 0; i < totalCount; i++) {
        const subcaste = selectedSubCastes[i];
        const mapping = subCasteMappings[subcaste.key];

        setCurrentStatus(`Importing ${subcaste.subCasteName}...`);

        try {
          // Add a small delay between requests to prevent overloading
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          await addSubCaste(
            subcaste.subCasteName,
            mapping.casteId,
            mapping.religionId,
            parseInt(selectedElectionId)
          );

          successCount++;
        } catch (error) {
          console.error(`Failed to import ${subcaste.subCasteName}:`, error);
          message.error(`Failed to import ${subcaste.subCasteName}`);
        }

        // Update progress
        const newProgress = Math.round(((i + 1) / totalCount) * 100);
        setProgress(newProgress);
      }

      if (successCount > 0) {
        message.success(
          `Successfully imported ${successCount} out of ${totalCount} sub-castes`
        );
        onImportComplete();
        handleClose();
      } else {
        //message.error('Failed to import any sub-castes');
      }
    } catch (error) {
      console.error("Error during import process:", error);
      message.error(`Import process failed: ${(error as Error).message}`);
    } finally {
      setImporting(false);
      setSelectedSubCastes([]);
      setCurrentStatus("");
      setSubCasteMappings({});
    }
  };

  const getUniqueOriginalReligions = useMemo(() => {
    const religionsMap = new Map<string, string>();
    cpanelSubCastes.forEach((subCaste) => {
      if (subCaste.religionName) {
        const lowerCaseName = subCaste.religionName.toLowerCase();
        if (!religionsMap.has(lowerCaseName)) {
          religionsMap.set(lowerCaseName, subCaste.religionName);
        }
      }
    });
    return Array.from(religionsMap.values());
  }, [cpanelSubCastes]);

  const getUniqueOriginalCastes = useMemo(() => {
    const castesMap = new Map<string, string>();
    cpanelSubCastes.forEach((subCaste) => {
      if (subCaste.casteName) {
        const lowerCaseName = subCaste.casteName.toLowerCase();
        if (!castesMap.has(lowerCaseName)) {
          castesMap.set(lowerCaseName, subCaste.casteName);
        }
      }
    });
    return Array.from(castesMap.values());
  }, [cpanelSubCastes]);

  const filteredSubCastes = useMemo(() => {
    return [...cpanelSubCastes]
      .sort((a, b) => {
        const aSelected = selectedSubCastes.some((sc) => sc.id === a.id)
          ? 1
          : 0;
        const bSelected = selectedSubCastes.some((sc) => sc.id === b.id)
          ? 1
          : 0;
        return bSelected - aSelected;
      })
      .filter((subCaste) => {
        const matchesSearch = subCaste.subCasteName
          .toLowerCase()
          .includes(searchValue.toLowerCase());

        const matchesReligion = filterReligionName
          ? subCaste.religionName === filterReligionName
          : true;

        const matchesCaste = filterCasteName
          ? subCaste.casteName === filterCasteName
          : true;

        return matchesSearch && matchesReligion && matchesCaste;
      });
  }, [
    searchValue,
    cpanelSubCastes,
    selectedSubCastes,
    filterReligionName,
    filterCasteName,
  ]);

  const autoCompleteOptions = useMemo(() => {
    return filteredSubCastes.map((subCaste) => ({
      label: subCaste.subCasteName,
      value: subCaste.id.toString(),
    }));
  }, [filteredSubCastes]);

  const handleSelect = (value: string) => {
    const selectedSubCaste = cpanelSubCastes.find(
      (subCaste) => subCaste.id.toString() === value
    );
    if (selectedSubCaste) {
      setSelectedSubCastes((prev) => [...new Set([...prev, selectedSubCaste])]);
      setSelectedRowKeys((prev) => [
        ...new Set([...prev, selectedSubCaste.id]),
      ]);
    }
    setSearchValue("");
  };

  const handleSelectRow = (record: SubCasteType, selected: boolean) => {
    setSelectedRowKeys((prev) => {
      const newKeys = new Set(prev);
      if (selected) {
        newKeys.add(record.id);
      } else {
        newKeys.delete(record.id);
      }
      return Array.from(newKeys);
    });

    setSelectedSubCastes((prev) => {
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
    _selectedRows: SubCasteType[],
    changeRows: SubCasteType[]
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

    setSelectedSubCastes((prev) => {
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
      title: "Sub-Caste Name",
      dataIndex: "subCasteName",
      key: "subCasteName",
    },
    {
      title: "Original Religion",
      dataIndex: "religionName",
      key: "religionName",
      render: (religionName: string) => (
        <Tag color="blue">{religionName || "-"}</Tag>
      ),
    },
    {
      title: "Original Caste",
      dataIndex: "casteName",
      key: "casteName",
      render: (casteName: string) => (
        <Tag color="green"> {casteName || "-"}</Tag>
      ),
    },
    {
      title: "Assign Religion",
      key: "assignReligion",
      render: (record: SubCasteType) => (
        <Select
          showSearch
          style={{ width: "100%" }}
          placeholder="Select Religion"
          optionFilterProp="children"
          onChange={(value) =>
            handleReligionChange(record.key, value as number)
          }
          value={subCasteMappings[record.key]?.religionId}
          filterOption={(input, option) =>
            (option?.children?.toString().toLowerCase() || "").includes(
              input.toLowerCase()
            )
          }
        >
          {religions.map((religion) => (
            <Option key={religion.id} value={religion.id}>
              {religion.religionName}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Assign Caste",
      key: "assignCaste",
      render: (record: SubCasteType) => {
        const religionId = subCasteMappings[record.key]?.religionId;
        const castes = religionId ? castesByReligion[religionId] || [] : [];

        return (
          <Select
            showSearch
            style={{ width: "100%" }}
            placeholder={religionId ? "Select Caste" : "Select Religion First"}
            optionFilterProp="children"
            onChange={(value) => handleCasteChange(record.key, value as number)}
            value={subCasteMappings[record.key]?.casteId || undefined}
            disabled={!religionId}
            filterOption={(input, option) =>
              (option?.children?.toString().toLowerCase() || "").includes(
                input.toLowerCase()
              )
            }
          >
            {castes.map((caste) => (
              <Option key={caste.id} value={caste.id}>
                {caste.casteName}
              </Option>
            ))}
          </Select>
        );
      },
    },
  ];

  return (
    <Modal
      title="Import Sub-Castes"
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
                disabled={selectedSubCastes.length === 0}
              >
                Import Selected ({selectedSubCastes.length})
              </Button>,
            ]
      }
      closable={!importing}
      maskClosable={!importing}
      width={1200}
    >
      {importing ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Progress percent={progress} status="active" />
          <Text style={{ display: "block", marginTop: 16 }}>
            {currentStatus}
          </Text>
          <Text style={{ display: "block", marginTop: 8 }}>
            Importing sub-castes... ({progress}% complete)
          </Text>
        </div>
      ) : (
        <div>
          <Text>
            Select sub-castes to import and assign religions and castes:
          </Text>
          <AutoComplete
            options={autoCompleteOptions}
            style={{ width: "100%", marginBottom: 16 }}
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleSelect}
            placeholder="Search for a sub-caste"
            allowClear
          >
            <Input
              suffix={
                <Button style={{ border: "none" }} icon={<SearchOutlined />} />
              }
            />
          </AutoComplete>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <Select
              placeholder="Filter by Religion"
              allowClear
              style={{ width: "25%", marginBottom: 16, marginTop: 4 }}
              onChange={(value) => {
                setFilterReligionName(value);
                setFilterCasteName(null);
              }}
              value={filterReligionName ?? undefined}
              options={getUniqueOriginalReligions.map((religionName) => ({
                label: religionName,
                value: religionName,
              }))}
              filterOption={(input, option) =>
                option?.label.toLowerCase().includes(input.toLowerCase())
              }
            />

            <Select
              placeholder="Filter by Caste"
              allowClear
              style={{ width: "25%", marginBottom: 16, marginTop: 4 }}
              onChange={(value) => setFilterCasteName(value)}
              value={filterCasteName ?? undefined}
              options={getUniqueOriginalCastes.map((casteName) => ({
                label: casteName,
                value: casteName,
              }))}
              filterOption={(input, option) =>
                option?.label.toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredSubCastes}
            rowKey="subCasteId"
            pagination={{ pageSize: 10 }}
            size="middle"
            style={{ marginTop: 16 }}
            scroll={{ x: "max-content" }}
          />
        </div>
      )}
    </Modal>
  );
};

export default ImportSubCastesModal;
