import React, { useEffect, useMemo, useState } from "react";
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
import { addAvailabilityApi } from "../../api/availabilityApi";
import { SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface AvailabilityType {
  availabilityId: number;
  id: number;
  key: string;
  categoryName: string;
  description: string;
  availabilityImage: string;
  orderIndex?: number;
}

interface ImportAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  selectedElectionId: string;
  cpanelAvailabilities: AvailabilityType[];
}

const ImportAvailabilityModal: React.FC<ImportAvailabilityModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  selectedElectionId,
  cpanelAvailabilities,
}) => {
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<
    AvailabilityType[]
  >([]);
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

  const handleImport = async () => {
    if (selectedAvailabilities.length === 0) {
      message.warning("Please select at least one voter category to import");
      return;
    }

    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      const totalCount = selectedAvailabilities.length;

      const errors: { description: string; categoryName:string; message: string }[] = [];


      for (let i = 0; i < totalCount; i++) {
        const availability = selectedAvailabilities[i];
        setCurrentStatus(`Importing ${availability.categoryName}...`);

        try {
          // Add a small delay between requests to prevent overloading
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }

          // 1. Convert the availability image URL to a File object
          const imageFile = await urlToFile(
            availability.availabilityImage,
            `availability-${availability.availabilityId}-${Date.now()}.jpg`
          );

          // 2. Create DTO and use the existing add API
          const DTO = {
            categoryName: availability.categoryName,
            description: availability.description,
          };
          const response = await addAvailabilityApi(
            DTO,
            imageFile,
            parseInt(selectedElectionId)
          );

          // Check if the response has an error status
          if (response?.status === "error") {
            errors.push({
              categoryName: availability.categoryName,
              description: availability.description,
              message: response.message || "Unknown error",
            });
            console.error(
              `Failed to import ${availability.categoryName}: ${response.message}`
            );
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to import ${availability.description}:`, error);
          errors.push({
            categoryName: availability.categoryName,
            description: availability.description,
            message: (error as Error).message,
          });
        }

        // Update progress
        const newProgress = Math.round(((i + 1) / totalCount) * 100);
        setProgress(newProgress);
      }

      if (successCount > 0) {
        if (errors.length > 0) {
          // Show partial success message with error details
          message.warning(
            `Imported ${successCount} out of ${totalCount} voter categories. ${errors.length} failed.`
          );

          // Show detailed error messages for the first few errors
          const maxErrorsToShow = 3;
          errors.slice(0, maxErrorsToShow).forEach((error) => {
            message.error(`${error.message}`);
          });

          if (errors.length > maxErrorsToShow) {
            message.error(
              `...and ${errors.length - maxErrorsToShow} more errors.`
            );
          }
        } else {
          message.success(
            `Successfully imported ${successCount} out of ${totalCount} voter categories`
          );
        }
        onImportComplete();
        onClose();
      } else {
        //message.error('Failed to import any voter categories. Please check console for details.');
        // Show detailed error messages for the first few errors
        const maxErrorsToShow = 3;
        errors.slice(0, maxErrorsToShow).forEach((error) => {
          message.error(`${error.message}`);
        });

        if (errors.length > maxErrorsToShow) {
          message.error(
            `...and ${
              errors.length - maxErrorsToShow
            } more errors. Check console for details.`
          );
        }
      }
    } catch (error) {
      console.error("Error during import process:", error);
      message.error(`Import process failed: ${(error as Error).message}`);
    } finally {
      setImporting(false);
      setSelectedAvailabilities([]);
      setCurrentStatus("");
    }
  };

  const filteredAvailabilities = useMemo(() => {
    return [...cpanelAvailabilities]
      .sort((a, b) => {
        const aSelected = selectedAvailabilities.some((avl) => avl.id === a.id)
          ? 1
          : 0;
        const bSelected = selectedAvailabilities.some((avl) => avl.id === b.id)
          ? 1
          : 0;
        return bSelected - aSelected;
      })
      ?.filter((avl) =>
        avl.description?.toLowerCase().includes(searchValue.toLowerCase())
      );
  }, [searchValue, cpanelAvailabilities, selectedAvailabilities]);

  // Options for AutoComplete
  const autoCompleteOptions = useMemo(() => {
    return cpanelAvailabilities?.map((avl) => ({
      label: avl.categoryName,
      value: avl.key.toString(),
    }));
  }, [filteredAvailabilities]);

  // Handle selection from AutoComplete
  const handleSelect = (value: any) => {
    const selectedAvailability = cpanelAvailabilities?.find(
      (avl) => avl.key.toString() === value
    );
    if (selectedAvailability) {
      setSelectedAvailabilities((prev) => [
        ...new Set([...prev, selectedAvailability]),
      ]);
      setSelectedRowKeys((prev) => [
        ...new Set([...prev, selectedAvailability.availabilityId]),
      ]);
    }
    setSearchValue("");
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "availabilityImage",
      key: "availabilityImage",
      render: (text: string) => (
        <Image
          src={text}
          alt="Voter Category"
          width={50}
          height={50}
          style={{ objectFit: "cover", borderRadius: "4px" }}
          fallback="/placeholder-image.png"
        />
      ),
    },
    {
      title: "Category Name",
      dataIndex: "categoryName",
      key: "categoryName",
    },
    {
      title: "Category Description",
      dataIndex: "description",
      key: "description",
    },
  ];

  const handleRowSelection = (
    selectedKeys: React.Key[],
    selectedRows: AvailabilityType[]
  ) => {
    console.log("Selected Keys:", selectedKeys);
    console.log("Selected Rows:", selectedRows);
    setSelectedRowKeys(selectedKeys);
    setSelectedAvailabilities(selectedRows);
  };

  useEffect(() => {
    console.log("CPANEL AVAILABILITIES", cpanelAvailabilities);
    console.log("FILTERED CPANEL AVAILABILITIES", filteredAvailabilities);
  }, []);

  return (
    <Modal
      title="Import Voter Categories"
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
                disabled={selectedAvailabilities.length === 0}
              >
                Import Selected ({selectedAvailabilities.length})
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
            Importing voter categories... ({progress}% complete)
          </Text>
        </div>
      ) : (
        <div>
          <Text>Search and select voter categories to import:</Text>
          <AutoComplete
            options={autoCompleteOptions}
            style={{ width: "100%", marginBottom: 16 }}
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleSelect}
            placeholder="Search for a category"
            allowClear
          >
            <Input
              suffix={
                <Button style={{ border: "none" }} icon={<SearchOutlined />} />
              }
            />
          </AutoComplete>
          <Table
            rowSelection={{
              selectedRowKeys,
              onChange: handleRowSelection,
            }}
            columns={columns}
            dataSource={filteredAvailabilities}
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

export default ImportAvailabilityModal;
