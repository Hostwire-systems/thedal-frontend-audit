import React, { useState, useEffect, useMemo } from "react";
import { getActiveBackendUrl } from "../../config";
import {
  Modal,
  Table,
  Progress,
  message,
  Button,
  Typography,
  Image,
  AutoComplete,
  Input,
} from "antd";
import { addBenefitSchemeApi } from "../../api/benefitSchemeApi";
import { SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface BenefitSchemeType {
  id: number;
  key: string;
  schemeName: string;
  schemeValue:number| string;
  imageUrl: string;
  schemeBy: string;
  orderIndex?: number;
}

interface ImportBenefitSchemesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  selectedElectionId: string;
  cpanelBenefitSchemes: BenefitSchemeType[];
}

const ImportBenefitSchemesModal: React.FC<ImportBenefitSchemesModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  selectedElectionId,
  cpanelBenefitSchemes,
}) => {
  const [selectedSchemes, setSelectedSchemes] = useState<BenefitSchemeType[]>(
    []
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");

  const S3_BASE = "https://thedalnew.s3.ap-south-1.amazonaws.com";

  // Helper function: converts URL to File object via backend S3 proxy
  const urlToFile = async (url: string, filename: string): Promise<File> => {
    const fetchUrl = url.startsWith(S3_BASE)
      ? `${getActiveBackendUrl()}/api/s3-proxy?url=${encodeURIComponent(url)}`
      : url;
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  };

  // Helper function: ensures that schemeBy is always in the expected uppercase enum format
  const formatSchemeByForBackend = (value: string): string => {
    if (value.toLowerCase() === "local body") {
      return "LOCAL_BODY";
    }
    if (value.toLowerCase() === "party") {
      return "PARTY";
    }
    if (value.toLowerCase() === "self") {
      return "SELF";
    }
    if (
      value.toLowerCase() === "union govt." ||
      value.toLowerCase() === "union govt"
    ) {
      return "UNION_GOVT";
    }
    if (
      value.toLowerCase() === "state govt." ||
      value.toLowerCase() === "state govt"
    ) {
      return "STATE_GOVT";
    }
    // Fallback: convert whatever is provided to uppercase
    return value.toUpperCase();
  };

  const handleImport = async () => {
    if (selectedSchemes.length === 0) {
      message.warning("Please select at least one scheme to import");
      return;
    }

    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      const totalCount = selectedSchemes.length;

      for (let i = 0; i < totalCount; i++) {
        const scheme = selectedSchemes[i];
        setCurrentStatus(`Importing ${scheme.schemeName}...`);

        try {
          // Add a small delay between requests to prevent overloading
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }

          // 1. Convert the scheme image URL to a File object
          const imageFile = await urlToFile(
            scheme.imageUrl,
            `scheme-${scheme.id}-${Date.now()}.jpg`
          );

          // 2. Create payload and use the existing add API
          const payload = {
            schemeName: scheme.schemeName,
            schemeValue:scheme.schemeValue,
            schemeBy: formatSchemeByForBackend(scheme.schemeBy),
          };

          await addBenefitSchemeApi(
            payload,
            imageFile,
            parseInt(selectedElectionId)
          );

          successCount++;
        } catch (error) {
          console.error(`Failed to import ${scheme.schemeName}:`, error);
          message.error(
            // `Failed to import ${scheme.schemeName}: ${(error as Error).message}`
            `Failed to import ${scheme.schemeName}`
          );
        }

        // Update progress
        const newProgress = Math.round(((i + 1) / totalCount) * 100);
        setProgress(newProgress);
      }

      if (successCount > 0) {
        message.success(
          `Successfully imported ${successCount} out of ${totalCount} schemes`
        );
        onImportComplete();
        onClose();
      } else {
        message.error(
          "Failed to import any schemes. Please check console for details."
        );
      }
    } catch (error) {
      console.error("Error during import process:", error);
      message.error(`Import process failed: ${(error as Error).message}`);
    } finally {
      setImporting(false);
      setSelectedSchemes([]);
      setCurrentStatus("");
    }
  };
  const filteredSchemes = useMemo(() => {
    return [...cpanelBenefitSchemes]
      .sort((a, b) => {
        const aSelected = selectedSchemes.some((scheme) => scheme.id === a.id)
          ? 1
          : 0;
        const bSelected = selectedSchemes.some((scheme) => scheme.id === b.id)
          ? 1
          : 0;
        return bSelected - aSelected;
      })
      ?.filter((scheme) =>
        scheme.schemeName.toLowerCase().includes(searchValue.toLowerCase())
      );
  }, [searchValue, cpanelBenefitSchemes, selectedSchemes]);

  // Options for AutoComplete
  const autoCompleteOptions = useMemo(() => {
    return filteredSchemes.map((scheme) => ({
      label: scheme.schemeName,
      value: scheme.id.toString(),
    }));
  }, [filteredSchemes]);

  // Handle selection from AutoComplete
  const handleSelect = (value) => {
    const selectedScheme = cpanelBenefitSchemes.find(
      (scheme) => scheme.id.toString() === value
    );
    if (selectedScheme) {
      setSelectedSchemes((prev) => [...new Set([...prev, selectedScheme])]);
      setSelectedRowKeys((prev) => [...new Set([...prev, selectedScheme.id])]);
    }
    setSearchValue("");
  };

  // Handle row selection in Table

  const columns = [
    {
      title: "Scheme Name",
      dataIndex: "schemeName",
      key: "schemeName",
    },
    {
      title: "Scheme By",
      dataIndex: "schemeBy",
      key: "schemeBy",
    },
    {
      title: "Scheme Value",
      dataIndex: "schemeValue",
      key: "schemeValue",
      render: (value:number) => `₹ ${Number(value).toLocaleString("en-IN")}`,
      width: 120,

    },
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (text: string) => (
        <Image
          src={text}
          alt="Scheme"
          width={50}
          height={50}
          style={{ objectFit: "cover", borderRadius: "4px" }}
          fallback="/placeholder-image.png"
        />
      ),
    },
  ];

  const handleSelectRow = (record: BenefitSchemeType, selected: boolean) => {
    setSelectedRowKeys((prev) => {
      const newKeys = new Set(prev);
      if (selected) {
        newKeys.add(record.id);
      } else {
        newKeys.delete(record.id);
      }
      return Array.from(newKeys);
    });

    setSelectedSchemes((prev) => {
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
    _selectedRows: BenefitSchemeType[],
    changeRows: BenefitSchemeType[]
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

    setSelectedSchemes((prev) => {
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
      title="Import Benefit Schemes"
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
                disabled={selectedSchemes.length === 0}
              >
                Import Selected ({selectedSchemes.length})
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
            Importing schemes... ({progress}% complete)
          </Text>
        </div>
      ) : (
        <div>
          <Text>Search and select schemes to import:</Text>
          <AutoComplete
            options={autoCompleteOptions}
            style={{ width: "100%", marginBottom: 16 }}
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleSelect}
            placeholder="Search for a scheme"
            allowClear
          >
            <Input
              suffix={
                <Button style={{ border: "none" }} icon={<SearchOutlined />} />
              }
            />
          </AutoComplete>
          <Table
            rowSelection={rowSelection
            }
            columns={columns}
            dataSource={filteredSchemes}
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

export default ImportBenefitSchemesModal;
