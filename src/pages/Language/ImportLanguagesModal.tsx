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
import { addLanguageApi } from "../../api/languageApi";
import { SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface LanguageType {
  id: number;
  key: string;
  languageName: string;
}

interface ImportLanguagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  selectedElectionId: string;
  cpanelLanguages: LanguageType[];
}

const ImportLanguagesModal: React.FC<ImportLanguagesModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  selectedElectionId,
  cpanelLanguages,
}) => {
  const [selectedLanguages, setSelectedLanguages] = useState<LanguageType[]>(
    []
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");

  const handleImport = async () => {
    if (selectedLanguages.length === 0) {
      message.warning("Please select at least one language to import");
      return;
    }

    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      const totalCount = selectedLanguages.length;

      for (let i = 0; i < totalCount; i++) {
        const language = selectedLanguages[i];
        setCurrentStatus(`Importing ${language.languageName}...`);

        try {
          const payload = { languageName: language.languageName };
          await addLanguageApi(payload, parseInt(selectedElectionId));
          successCount++;
        } catch (error) {
          console.error(`Failed to import ${language.languageName}:`, error);
        }

        // Update progress
        const newProgress = Math.round(((i + 1) / totalCount) * 100);
        setProgress(newProgress);
      }

      message.success(
        `Successfully imported ${successCount} out of ${totalCount} languages`
      );
      onImportComplete();
      onClose();
    } catch (error) {
      console.error("Error during import:", error);
      message.error("Failed to complete language import");
    } finally {
      setImporting(false);
      setSelectedLanguages([]);
      setCurrentStatus("");
    }
  };

  const filteredLanguages = useMemo(() => {
     return [...cpanelLanguages]
       .sort((a, b) => {
         const aSelected = selectedLanguages.some((lang) => lang.id === a.id)
           ? 1
           : 0;
         const bSelected = selectedLanguages.some((lang) => lang.id === b.id)
           ? 1
           : 0;
         return bSelected - aSelected; 
       })
       .filter((language) =>
         language.languageName.toLowerCase().includes(searchValue.toLowerCase())
       );
  }, [searchValue, cpanelLanguages,selectedLanguages]);

  const autoCompleteOptions = useMemo(() => {
    return filteredLanguages.map((lan) => ({
      label: lan.languageName,
      value: lan.id.toString(),
    }));
  }, [filteredLanguages]);

  const handleSelect = (value: string) => {
    const selectedLanguage = cpanelLanguages.find(
      (lan) => lan.id.toString() === value
    );
    if (selectedLanguage) {
      setSelectedLanguages((prev) => [...new Set([...prev, selectedLanguage])]);
      setSelectedRowKeys((prev) => [
        ...new Set([...prev, selectedLanguage.id]),
      ]);
    }
    setSearchValue("");
  };

  const handleSelectRow = (record: LanguageType, selected: boolean) => {
    setSelectedRowKeys((prev) => {
      const newKeys = new Set(prev);
      if (selected) {
        newKeys.add(record.id);
      } else {
        newKeys.delete(record.id);
      }
      return Array.from(newKeys);
    });

    setSelectedLanguages((prev) => {
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
    _selectedRows: LanguageType[],
    changeRows: LanguageTypeType[]
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

    setSelectedLanguages((prev) => {
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
      title: "Language Name",
      dataIndex: "languageName",
      key: "languageName",
    },
  ];

  return (
    <Modal
      title="Import Languages"
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
                disabled={selectedLanguages.length === 0}
              >
                Import Selected ({selectedLanguages.length})
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
            Importing languages... ({progress}% complete)
          </Text>
        </div>
      ) : (
        <div>
          <Text>Search and select languages to import:</Text>
          <AutoComplete
            options={autoCompleteOptions}
            style={{ width: "100%", marginBottom: 16 }}
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleSelect}
            placeholder="Search for a language"
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
            dataSource={filteredLanguages}
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

export default ImportLanguagesModal;
