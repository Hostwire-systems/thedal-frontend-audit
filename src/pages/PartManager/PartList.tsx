import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Col,
  Row,
  Input,
  Spin,
  message,
  Modal,
  Form,
  InputNumber,
  Button,
  Menu,
  Checkbox,
  Dropdown,
  Upload,
  Card,
  Tag,
  Progress,
  Radio,
  Descriptions,
  List,
} from "antd";
import {
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  SearchOutlined,
  SyncOutlined,
  UploadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useLoading } from "../../context/LoadingContext";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import PartTable from "./PartTable";
import {
  getPartsApi,
  deletePartApi,
  updatePartApi,
  deleteMultiplePartsApi,
  exportPartsApi,
  partExportJob,
} from "../../api/partApi";
import ImgCrop from "antd-img-crop";
import { RcFile } from "antd/es/upload";
import PartExportJobsModal from "./PartExportJobsModal";

interface BoothCommitteeMember {
  name: string;
  designation: string;
  mobileNumber: string;
}

interface Part {
  id: number;
  partNo: string;
  partImageUrl?: string;
  partNameEnglish: string;
  partNameL1: string;
  partType?: string;
  partCaptainName: string;
  captainDesignation: string;
  captainMobileNo: string;
  schoolName: string;
  partLat: number;
  partLong: number;
  schoolLat: number;
  schoolLong: number;
  pincode: string;
  bloName: string;
  bloDesignation: string;
  bloMobileNumber: string;
  bla2Name: string;
  bla2Designation: string;
  bla2MobileNumber: string;
  boothVulnerability: string;
  boothCommitteeMembers?: BoothCommitteeMember[];
}

interface ExportJob {
  jobId: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  progress: number;
  downloadUrl?: string;
  errorMessage?: string;
  exportType: "EXCEL" | "PDF";
  createdAt: string;
}

export default function PartList(): JSX.Element {
  const [partList, setPartList] = useState<Part[]>([]);
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  const [isPartViewModalVisible, setIsPartViewModalVisible] =
    useState<boolean>(false);
  const [isExportPartModalVisible, setIsExportPartModalVisible] =
    useState<boolean>(false);
  const [isDownloadsModalOpen, setIsDownloadsModalOpen] =
    useState<boolean>(false);

  //Error
  const [partLatError, setPartLatError] = useState("");
  const [partLngError, setPartLngError] = useState("");
  const [schoolLatError, setSchoolLatError] = useState("");
  const [schoolLngError, setSchoolLngError] = useState("");

  //Lat and Long
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [schoolLatitude, setSchoolLatitude] = useState("");
  const [schoolLongitude, setSchoolLongitude] = useState("");

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedParts, setSelectedParts] = useState<Part[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [exportStartingType, setExportStartingType] = useState<
    "EXCEL" | "PDF" | null
  >(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fileList, setFileList] = useState<any[]>([]);
  const [partImage, setPartImage] = useState<RcFile | null>(null);
  const [filteredPartList, setFilteredPartList] = useState<Part[]>([]);
  const { isLoading, setLoading } = useLoading();
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [viewingPart, setViewingPart] = useState<Part | null>(null);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Booth Committee Members state for edit modal
  const [committeeMembers, setCommitteeMembers] = useState<
    BoothCommitteeMember[]
  >([]);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);
  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );

  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  // Helper to allow only numeric characters (digits only) for Part Number.
  const handlePartNoKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const allowedKeys = [
      "Backspace",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "Delete",
    ];
    if (!/[0-9]/.test(event.key) && allowedKeys.indexOf(event.key) === -1) {
      event.preventDefault();
    }
  };

  // Helper to allow only numbers, decimal point, and minus sign for lat/long.
  const handleLatLongKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const allowedKeys = [
      "Backspace",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "Delete",
    ];
    // Allow digits, period, and minus sign.
    if (!/[0-9.\-]/.test(event.key) && allowedKeys.indexOf(event.key) === -1) {
      event.preventDefault();
    }
  };

  useEffect(() => {
    resetState();
    if (selectedElectionId) {
      fetchParts();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, partList]);

  useEffect(() => {
    if (editingPart) {
      form.setFieldsValue(editingPart);

      // Populate existing image into Upload
      if (editingPart.partImageUrl) {
        setFileList([
          {
            uid: "-1",
            name: "part-image.png",
            status: "done",
            url: editingPart.partImageUrl,
          },
        ]);

        // Also set partImage to existing URL
        setPartImage(null);
      } else {
        setFileList([]);
      }
    } else {
      form.resetFields();
      setFileList([]);
    }
  }, [editingPart]);

  useEffect(() => {
    if (selectedElectionId) {
      const savedJob = localStorage.getItem(
        `part_export_${selectedElectionId}`
      );
      if (savedJob) {
        const job: ExportJob = JSON.parse(savedJob);
        setExportJob(job);

        if (job.status === "PENDING" || job.status === "IN_PROGRESS") {
          startPolling(parseInt(selectedElectionId), job.jobId, job.exportType);
        }
      }
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [selectedElectionId]);

  const resetState = () => {
    setPartList([]);
    setFilteredPartList([]);
    setSearchQuery("");
  };

  const fetchParts = async (): Promise<void> => {
    if (!selectedElectionId) return;
    try {
      setLoading(true);
      const response = await getPartsApi(parseInt(selectedElectionId));
      console.log("Parts response:", response.data);
      const validParts = Array.isArray(response.data) ? response.data : [];
      setPartList(validParts);
      setFilteredPartList(validParts);
    } catch (error) {
      console.error("Error fetching parts:", error);
      setPartList([]);
      setFilteredPartList([]);
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all part data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all part
            data.
          </p>
          <Checkbox
            onChange={(e) => {
              const isChecked = e.target.checked;
              // Update the modal's OK button directly
              modal.update({
                okButtonProps: {
                  disabled: !isChecked,
                  className: !isChecked ? "opacity-50 cursor-not-allowed" : "",
                },
              });
              // Store the checkbox state in a custom property for onOk access
              modal._isDeleteConfirmed = isChecked;
            }}
            style={{ marginTop: 16 }}
          >
            I understand that by confirming, all part data will be permanently
            deleted
          </Checkbox>
        </div>
      ),
      okText: "Yes, Delete",
      okType: "danger",
      okButtonProps: {
        disabled: true,
        className: "opacity-50 cursor-not-allowed",
      },
      cancelText: "Cancel",
      async onOk() {
        if (modal._isDeleteConfirmed) {
          await handleDeleteMultipleParts();
        }
      },
    });
  };

  const startPolling = (
    electionId: number,
    jobId: string,
    exportType: "EXCEL" | "PDF"
  ) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const jobStatus = await partExportJob(electionId, jobId);

        const updatedJob: ExportJob = {
          ...jobStatus,
          exportType,
        };

        setExportJob(updatedJob);
        localStorage.setItem(
          `part_export_${selectedElectionId}`,
          JSON.stringify(updatedJob)
        );

        if (jobStatus.status === "COMPLETED" || jobStatus.status === "FAILED") {
          clearInterval(interval);
          setPollingInterval(null);

          if (jobStatus.status === "COMPLETED") {
            message.success("Export completed successfully!");
          } else {
            message.error(`Export failed: ${jobStatus.errorMessage}`);
          }
        }
      } catch (error) {
        console.error("Error polling export job:", error);
        clearInterval(interval);
        setPollingInterval(null);
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  const handleExport = async (exportType: "EXCEL" | "PDF") => {
    if (exportStartingType) {
      return;
    }

    try {
      if (!selectedElectionId) {
        message.error("Please select an election first");
        return;
      }

      setExportStartingType(exportType);

      setExportModalVisible(true);
      message.info("Starting export process...");

      const response = await exportPartsApi(
        parseInt(selectedElectionId),
        exportType
      );
      const job: ExportJob = {
        ...response,
        progress:
          response.progress ??
          (response.status === "PENDING"
            ? 20
            : response.status === "IN_PROGRESS"
            ? 60
            : 0),
        exportType,
      };

      setExportJob(job);
      localStorage.setItem(
        `part_export_${selectedElectionId}`,
        JSON.stringify(job)
      );

      if (!job.jobId) {
        throw new Error("Export job id is missing in response");
      }

      startPolling(parseInt(selectedElectionId), job.jobId, exportType);
    } catch (error) {
      console.error("Failed to start export:", error);
      message.error("Failed to start export process");
    } finally {
      setExportStartingType(null);
    }
  };

  const handleDownload = () => {
    if (exportJob?.downloadUrl) {
      window.open(exportJob.downloadUrl, "_blank");
    }
  };

  const handleCancelExport = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setExportStartingType(null);
    setExportJob(null);
    if (selectedElectionId) {
      localStorage.removeItem(`part_export_${selectedElectionId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "blue";
      case "IN_PROGRESS":
        return "orange";
      case "COMPLETED":
        return "green";
      case "FAILED":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "IN_PROGRESS":
        return "In Progress";
      case "COMPLETED":
        return "Completed";
      case "FAILED":
        return "Failed";
      default:
        return status;
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Part[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedParts(selectedRows);
    },
  };

  const handleDeleteMultipleParts = async (partManagerIds?: number[]) => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    if (!selectedElectionId) return;

    try {
      setDeleteLoading(true);

      // Use the unified API function
      await deleteMultiplePartsApi(
        parseInt(selectedElectionId),
        partManagerIds
      );

      const successMessage = partManagerIds?.length
        ? `${partManagerIds.length} parts deleted successfully`
        : "All parts deleted successfully";

      message.success(successMessage);
      setSelectedRowKeys([]);
      setSelectedParts([]);
      await fetchParts();
    } catch (error) {
      const errorMessage = partManagerIds?.length
        ? "Failed to delete selected parts"
        : "Failed to delete all parts";
      console.error(errorMessage, error);
      // message.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  // const validateImageBeforeCrop = (file: RcFile) => {
  //   const isValidType =
  //     file.type === "image/jpeg" ||
  //     file.type === "image/png" ||
  //     file.type === "image/jpg";

  //   const isSizeValid = file.size / 1024 / 1024 < 1;

  //   if (!isValidType) {
  //     message.error("Only JPG, JPEG, or PNG files are allowed!");
  //     return false;
  //   }

  //   if (!isSizeValid) {
  //     message.error("File size must be less than 1MB!");
  //     return false;
  //   }

  //   return true;
  // };

  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const handleFileChange = ({ fileList: newFileList }: any) => {
    const filteredList = newFileList.filter((file: any) => {
      const isValidType =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg";
      const isSizeValid = file.size / 1024 / 1024 < 1;

      if (!isValidType) {
        return false;
      }
      if (!isSizeValid) {
        return false;
      }
      return true;
    });
    setFileList(filteredList);
    if (filteredList.length > 0) {
      setPartImage(filteredList[0].originFileObj || filteredList[0]);
    }
    if (newFileList.length === 0) {
      setPartImage(null);
    }
  };

  const handlePreview = async (file: any) => {
    if (!file.preview) {
      file.preview = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e?.target.result);
        reader.readAsDataURL(file.originFileObj);
      });
    }
    Modal.info({
      title: "Preview",
      content: (
        <img alt="file preview" style={{ width: "100%" }} src={file.preview} />
      ),
      onOk() {},
    });
  };

  const actionsMenu = (
    <Menu>
      <Menu.Item
        key="delete-selected"
        icon={<DeleteOutlined />}
        onClick={() =>
          handleDeleteMultipleParts(selectedParts.map((part) => part.id))
        }
        disabled={
          isFrozen ||
          selectedParts.length === 0 ||
          deleteLoading ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("partList"))
        }
      >
        {deleteLoading
          ? "Deleting..."
          : `Delete Selected (${selectedParts.length})`}
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen ||
          partList.length === 0 ||
          deleteLoading ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("partList"))
        }
        danger
      >
        Delete All Parts
      </Menu.Item>
      <Menu.Item
        key="export"
        icon={<ExportOutlined />}
        onClick={() => setExportModalVisible(true)}
        disabled={
          partList.length === 0 ||
          deleteLoading ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("partList"))
        }
      >
        Export All Parts
      </Menu.Item>
    </Menu>
  );

  const applyFilters = (): void => {
    let filteredList = [...partList];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredList = filteredList.filter((part) =>
        [
          part.partNo?.toLowerCase(),
          part.partNameEnglish?.toLowerCase(),
          part.partNameL1?.toLowerCase(),
          part.schoolName?.toLowerCase(),
          part.pincode?.toString(),
          part.partCaptainName?.toLowerCase(),
          part.bloName?.toLowerCase(),
          part.bla2Name?.toLowerCase(),
        ].some((field) => field?.includes(query))
      );
    }
    setFilteredPartList(filteredList);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleDeletePart = async (partId: number): Promise<void> => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    try {
      await deletePartApi(parseInt(selectedElectionId), partId);
      message.success("Part deleted successfully");
      await fetchParts();
    } catch (error) {
      console.error("Failed to delete part:", error);
      message.error("Failed to delete part");
    }
  };

  // Open the edit modal by setting the current part.
  const handleEditPart = (part: Part): void => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    setEditingPart(part);
    // Initialize committee members from the part data
    setCommitteeMembers(part.boothCommitteeMembers || []);
  };

  const handleViewPart = (part: Part): void => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }
    setViewingPart(part);
    setIsPartViewModalVisible(true);
  };

  const handleExportPart = (part: Part): void => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }
    // setViewingPart(part);
    setIsExportPartModalVisible(true);
  };

  // Booth Committee Members handlers
  const handleAddCommitteeMember = () => {
    if (committeeMembers.length >= 15) {
      message.warning("Maximum 15 committee members allowed");
      return;
    }
    setCommitteeMembers([
      ...committeeMembers,
      { name: "", designation: "", mobileNumber: "" },
    ]);
  };

  const handleRemoveCommitteeMember = (index: number) => {
    const updatedMembers = committeeMembers.filter((_, i) => i !== index);
    setCommitteeMembers(updatedMembers);
  };

  const handleCommitteeMemberChange = (
    index: number,
    field: keyof BoothCommitteeMember,
    value: string
  ) => {
    const updatedMembers = [...committeeMembers];
    updatedMembers[index][field] = value;
    setCommitteeMembers(updatedMembers);
  };

  const validateCommitteeMembers = () => {
    for (let i = 0; i < committeeMembers.length; i++) {
      const member = committeeMembers[i];

      if (!member.name || member.name.trim() === "") {
        message.error(`Committee member ${i + 1}: Name is required`);
        return false;
      }

      if (member.name.length > 100) {
        message.error(
          `Committee member ${i + 1}: Name must be less than 100 characters`
        );
        return false;
      }

      if (!/^[a-zA-Z0-9\s]+$/.test(member.name)) {
        message.error(
          `Committee member ${
            i + 1
          }: Name must contain only letters, numbers, and spaces`
        );
        return false;
      }

      if (!member.designation || member.designation.trim() === "") {
        message.error(`Committee member ${i + 1}: Designation is required`);
        return false;
      }

      if (member.designation.length > 50) {
        message.error(
          `Committee member ${
            i + 1
          }: Designation must be less than 50 characters`
        );
        return false;
      }

      if (member.mobileNumber && member.mobileNumber.trim() !== "") {
        if (!/^[0-9]{10}$/.test(member.mobileNumber)) {
          message.error(
            `Committee member ${i + 1}: Mobile number must be exactly 10 digits`
          );
          return false;
        }
      }
    }
    return true;
  };

  const validateDecimalPlaces = (
    value: any,
    min: any,
    max: any,
    setError: any
  ) => {
    if (!value) {
      setError("");
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError("Please enter a valid number");
      return false;
    }

    if (numValue < min || numValue > max) {
      setError(`Value must be between ${min} and ${max}`);
      return false;
    }

    // Check decimal places (max 5)
    if (value.includes(".")) {
      const [, decimalPart] = value.split(".");
      console.log("Decimal part length", decimalPart);
      if (decimalPart?.length > 5) {
        setError("Maximum 5 decimal places allowed");
        return false;
      }
    }

    // If everything is fine, clear the error
    setError("");
    return true;
  };

  const handleCoordinateChange = (value, type: string, isSchool = false) => {
    const isLatitude = type === "latitude";
    const min = isLatitude ? -90 : -180;
    const max = isLatitude ? 90 : 180;

    const setError = isSchool
      ? isLatitude
        ? setSchoolLatError
        : setSchoolLngError
      : isLatitude
      ? setPartLatError
      : setPartLngError;

    if (validateDecimalPlaces(value, min, max, setError)) {
      if (isSchool) {
        if (isLatitude) setSchoolLatitude(value);
        else setSchoolLongitude(value);
      } else {
        if (isLatitude) setLatitude(value);
        else setLongitude(value);
      }
    } else {
      if (isSchool) {
        if (isLatitude) setSchoolLatitude("");
        else setSchoolLongitude("");
      } else {
        if (isLatitude) setLatitude("");
        else setLongitude("");
      }
    }
  };

  // Called when the user clicks the "Update" button.
  const handleUpdatePart = async () => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    try {
      // Validate committee members if any exist
      if (committeeMembers.length > 0) {
        if (!validateCommitteeMembers()) {
          return;
        }
      }

      const values = await form.validateFields();
      if (!selectedElectionId || !editingPart) return;
      setUpdateLoading(true);
      console.log("values", values);
      console.log("partImage", partImage);

      // Prepare committee members data - filter out empty entries
      const validCommitteeMembers = committeeMembers
        .filter(
          (member) =>
            member.name.trim() !== "" && member.designation.trim() !== ""
        )
        .map((member) => ({
          name: member.name.trim(),
          designation: member.designation.trim(),
          mobileNumber: member.mobileNumber.trim() || undefined,
        }));

      // Add committee members to values
      const partData = {
        ...values,
        boothCommitteeMembers:
          validCommitteeMembers.length > 0 ? validCommitteeMembers : undefined,
      };

      await updatePartApi(
        parseInt(selectedElectionId),
        editingPart.id,
        partData,
        partImage
      );
      message.success("Part updated successfully");
      setEditingPart(null);
      setPartImage(null);
      setFileList([]);
      setCommitteeMembers([]);
      fetchParts();
    } catch (error) {
      console.error("Error updating part:", error);
      message.error("Failed to update part");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-10">
      {!selectedElectionId ? (
        <div className="text-center p-4">
          Please select an election to view parts
        </div>
      )
      //  : isLoading ? (
      //   <div className="text-center p-4">
      //     <Spin className="custom-spin-dark" size="large" />
      //   </div>
      // )
       : (
        <>
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={24}>
              <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
                Part List
              </h3>
            </Col>
          </Row>
          <Row gutter={[16, 16]} className="w-full items-end mt-10">
            <Col span={12}>
              <label className="block text-[15px] font-medium text-[#1F2937] mb-2">
                Search by part number, name (English or Tamil), or pincode
              </label>
              <Input
                placeholder="Search parts..."
                className="input-element"
                suffix={<SearchOutlined />}
                value={searchQuery}
                onChange={handleSearch}
              />
            </Col>
            <Button
              icon={<FolderOpenOutlined />}
              onClick={() => setIsDownloadsModalOpen(true)}
              style={{
                height: "45px",
                width: "45px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="View Downloads"
            />
            {
              <span
                style={{
                  display: "inline-block",
                  // background: exportStatus === "FAILED" ? "#ffe2e2" : "#e6f4ff",
                  // color: exportStatus === "FAILED" ? "#d4380d" : "#0958d9",
                  padding: "4px 12px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  marginLeft: 8,
                }}
              >
                {/* {exportStatus} */}
              </span>
            }
            <Dropdown overlay={actionsMenu} trigger={["click"]}>
              <Button
                type="primary"
                className="h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold hover:!bg-[#1D4ED8] hover:text-[#fff] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
              >
                Actions <DownOutlined />
              </Button>
            </Dropdown>
          </Row>
          <Row className="mt-10">
            <Col span={24}>
              <PartTable
                filteredPartList={filteredPartList}
                onDeletePart={handleDeletePart}
                onEditPart={handleEditPart}
                onViewPart={handleViewPart}
                onExportPart={handleExportPart}
                loading={isLoading}
                rowSelection={isFrozen ? undefined : rowSelection}
                isFrozen={isFrozen}
              />
            </Col>
          </Row>

          {/* Edit Part Modal */}
          <Modal
            title="Edit Part"
            open={!!editingPart}
            onCancel={() => {
              setEditingPart(null);
              setCommitteeMembers([]);
              form.resetFields();
            }}
            footer={[
              <Button
                key="cancel"
                onClick={() => {
                  setEditingPart(null);
                  setCommitteeMembers([]);
                  form.resetFields();
                }}
                disabled={updateLoading}
              >
                Cancel
              </Button>,
              <Button
                key="update"
                type="primary"
                onClick={handleUpdatePart}
                disabled={updateLoading || isFrozen}
              >
                {updateLoading ? (
                  <Spin className="custom-spin-dark" size="small" />
                ) : (
                  "Update"
                )}
              </Button>,
            ]}
          >
            <Form form={form} layout="vertical" disabled={isFrozen}>
              <Form.Item name="partImage" label="Add Part Image">
                <ImgCrop
                  rotate
                  aspect={1 / 1}
                  quality={0.8}
                  modalWidth={500}
                  showReset
                  // beforeCrop={validateImageBeforeCrop}
                  okText="Confirm"
                  cancelText="Cancel"
                  modalTitle={
                    <div className="flex justify-between items-center">
                      <span>Crop Part Image</span>
                      <span
                        style={{
                          color: "#999",
                          fontSize: "12px",
                          marginRight: "2rem",
                        }}
                      >
                        Size: 500x500 pixels
                      </span>
                    </div>
                  }
                  modalProps={{
                    okButtonProps: {
                      style: {
                        backgroundColor: "#1677ff",
                        borderColor: "#1677ff",
                        color: "#fff",
                      },
                    },
                  }}
                >
                  <Upload
                    multiple={false}
                    name="partImage"
                    listType="picture-card"
                    fileList={fileList}
                    onPreview={handlePreview}
                    onRemove={() => setFileList([])}
                    beforeUpload={(file) => {
                      const isValidType =
                        file.type === "image/jpeg" ||
                        file.type === "image/png" ||
                        file.type === "image/jpg";

                      if (!isValidType) {
                        message.error(
                          "Only JPG, JPEG, or PNG files are allowed!"
                        );
                        return Upload.LIST_IGNORE;
                      }

                      const isSizeValid = file.size / 1024 / 1024 < 1;
                      if (!isSizeValid) {
                        message.error("File size must be less than 1MB!");
                        return Upload.LIST_IGNORE;
                      }

                      return true;
                    }}
                    onChange={handleFileChange}
                    customRequest={dummyRequest}
                    accept="image/*"
                  >
                    {fileList.length < 1 && (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Upload Photo</div>
                      </div>
                    )}
                  </Upload>
                </ImgCrop>
              </Form.Item>
              {fileList?.length === 0 ? (
                <p className="text-xs font-medium text-gray-400 mb-2 -mt-3">
                  Image size should not exceed 1 MB
                </p>
              ) : (
                <p></p>
              )}

              <Form.Item
                name="partNo"
                label="Part Number"
                rules={[
                  { required: true, message: "Please enter the part number" },
                  {
                    max: 20,
                    message: "Part number must be under 20 characters",
                  },
                  {
                    pattern: /^[0-9]+$/,
                    message: "Part number must be numeric",
                  },
                ]}
              >
                <Input
                  placeholder="Enter part number"
                  // onKeyDown={handlePartNoKeyDown}
                />
              </Form.Item>
              <Form.Item
                name="partNameEnglish"
                label="Part Name English"
                rules={[
                  {
                    required: true,
                    message: "Please enter the part name in English",
                  },
                  {
                    max: 500,
                    message: "Part name must be under 500 characters",
                  },
                ]}
              >
                <Input placeholder="Enter part name in English" />
              </Form.Item>
              <Form.Item
                name="partNameL1"
                label="Part Name L1"
                rules={[
                  // {
                  //   required: true,
                  //   message: "Please enter the part name in L1",
                  // },
                  {
                    max: 500,
                    message: "Part name must be under 500 characters",
                  },
                ]}
              >
                <Input placeholder="Enter part name in L1" />
              </Form.Item>
              <Form.Item name="partType" label="Part Type">
                <Radio.Group>
                  <Radio value="URBAN">Urban</Radio>
                  <Radio value="RURAL">Rural</Radio>
                </Radio.Group>
              </Form.Item>
              <Col span={12}>
                <Form.Item
                  label={
                    <span className="text-[15px] font-medium text-[#1F2937]">
                      Part Location (Lat, Long)
                    </span>
                  }
                  style={{ marginBottom: 0 }}
                >
                  <Row gutter={8}>
                    <Col span={12}>
                      {/* part lat */}
                      <Form.Item
                        name="partLat"
                        rules={[
                          // { required: true, message: "Please enter the latitude" },

                          {
                            pattern: /^-?([0-8]?[0-9]|90)(\.[0-9]{1,6})?$/,
                            message:
                              "Please enter a valid latitude (-90 to 90)",
                          },
                        ]}
                        validateStatus={partLatError ? "error" : ""}
                        help={partLatError}
                      >
                        <Input
                          type="number"
                          style={{ width: "100%" }}
                          placeholder="Enter latitude"
                          // onKeyDown={handleLatLongKeyDown}
                          onChange={(e) => {
                            const value = e?.target?.value;
                            console.log("Booth Latitude changed:", value); // Debug log
                            // validateDecimalPlaces(
                            //   e?.target?.value,
                            //   -90,
                            //   90,
                            //   setPartLatError
                            // );
                            if (value) {
                              handleCoordinateChange(
                                e.target.value,
                                "latitude"
                              );
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>
                    {/* part long */}
                    <Col span={12}>
                      <Form.Item
                        name="partLong"
                        rules={[
                          // { required: true, message: "Please enter the longitude" },
                          {
                            pattern:
                              /^-?((1?[0-7]?|[0-9]?)[0-9]|180)(\.[0-9]{1,6})?$/,
                            message:
                              "Please enter a valid longitude (-180 to 180)",
                          },
                        ]}
                        validateStatus={partLngError ? "error" : ""}
                        help={partLngError}
                      >
                        <Input
                          style={{ width: "100%" }}
                          placeholder="Enter longitude"
                          // onKeyDown={handleLatLongKeyDown}
                          onChange={(e) => {
                            const value = e?.target?.value;
                            console.log("Booth Longitude changed:", value); // Debug log
                            //   validateDecimalPlaces(
                            //     e?.target?.value,
                            //     -90,
                            //     90,
                            //     setPartLngError
                            //   );
                            if (value) {
                              handleCoordinateChange(
                                e?.target?.value,
                                "longitude"
                              );
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form.Item>
              </Col>
              {/* school name */}
              <Form.Item
                name="schoolName"
                label="School Name"
                rules={[
                  // { required: true, message: "Please enter the school name" },
                  {
                    max: 500,
                    message: "School name must be under 500 characters",
                  },
                ]}
              >
                <Input placeholder="Enter school name" />
              </Form.Item>
              <Col span={12}>
                <Form.Item
                  label={
                    <span className="text-[15px] font-medium text-[#1F2937]">
                      School Location (Lat, Long)
                    </span>
                  }
                  style={{ marginBottom: 0 }}
                >
                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item
                        name="schoolLat"
                        rules={[
                          // { required: true, message: "Enter latitude" },
                          {
                            pattern: /^-?([0-8]?[0-9]|90)(\.[0-9]{1,6})?$/,
                            message:
                              "Please enter a valid latitude (-90 to 90)",
                          },
                        ]}
                        validateStatus={schoolLatError ? "error" : ""}
                        help={schoolLatError}
                      >
                        <Input
                          placeholder="Latitude"
                          type="number"
                          step="0.000001"
                          value={schoolLatitude}
                          onChange={(e) => {
                            const value = e.target.value;
                            console.log("Booth Latitude changed:", value); // Debug log
                            // validateDecimalPlaces(
                            //   e.target.value,
                            //   -90,
                            //   90,
                            //   setPartLatError
                            // );
                            handleCoordinateChange(
                              e.target.value,
                              "latitude",
                              true
                            );
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="schoolLong"
                        rules={[
                          // { required: true, message: "Enter longitude" },
                          {
                            pattern:
                              /^-?((1?[0-7]?|[0-9]?)[0-9]|180)(\.[0-9]{1,6})?$/,
                            message:
                              "Please enter a valid longitude (-180 to 180)",
                          },
                        ]}
                        validateStatus={schoolLngError ? "error" : ""}
                        help={schoolLngError}
                      >
                        <Input
                          placeholder="Longitude"
                          type="number"
                          step="0.000001"
                          value={schoolLongitude}
                          onChange={(e) => {
                            const value = e.target.value;
                            console.log("Booth Longitude changed:", value); // Debug log
                            // validateDecimalPlaces(
                            //   e.target.value,
                            //   -90,
                            //   90,
                            //   setPartLngError
                            // );
                            handleCoordinateChange(
                              e.target.value,
                              "longitude",
                              true
                            );
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form.Item>
              </Col>

              <Form.Item
                name="pincode"
                label="Pincode"
                rules={[
                  // { required: true, message: "Please enter the pincode" },
                  {
                    pattern: /^[0-9]{5,6}$/,
                    message: "Please enter a valid pincode (5-6 digits)",
                  },
                ]}
              >
                <Input placeholder="Enter pincode" />
              </Form.Item>
              <Form.Item
                label={
                  <span className="text-[15px] font-medium text-[#1F2937]">
                    Part Captain Name
                  </span>
                }
                name="partCaptainName"
                rules={[
                  {
                    required: false,
                    message: "Please enter part captain name ",
                  },
                ]}
              >
                <Input placeholder="Enter part captain name" />
              </Form.Item>
              <Form.Item
                label={
                  <span className="text-[15px] font-medium text-[#1F2937]">
                    Captain Designation
                  </span>
                }
                name="captainDesignation"
              >
                <Input placeholder="Enter captain's designation" />
              </Form.Item>
              <Form.Item
                label={
                  <span className="text-[15px] font-medium text-[#1F2937]">
                    Captain Mobile Number
                  </span>
                }
                name="captainMobileNo"
                rules={[
                  {
                    pattern: /^[0-9]{10}$/,
                    message: "Mobile number must be 10 digits",
                  },
                ]}
              >
                <Input placeholder="Enter captain's mobile number" />
              </Form.Item>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        BLO Name
                      </span>
                    }
                    name="bloName"
                  >
                    <Input placeholder="Enter BLO name " />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        BLO Designation
                      </span>
                    }
                    name="bloDesignation"
                  >
                    <Input placeholder="Enter BLO desgination " />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        BLO Mobile Number
                      </span>
                    }
                    name="bloMobileNumber"
                    rules={[
                      {
                        pattern: /^[0-9]{10}$/,
                        message: "Mobile number must be 10 digits",
                      },
                    ]}
                  >
                    <Input placeholder="Enter BLO's mobile number" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label={
                  <span className="text-[15px] font-medium text-[#1F2937]">
                    BLA-2 Name
                  </span>
                }
                name="bla2Name"
              >
                <Input placeholder="Enter BLA-2 name " />
              </Form.Item>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        BLA-2 Designation
                      </span>
                    }
                    name="bla2Designation"
                  >
                    <Input placeholder="Enter BLA-2 desgination" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        BLA-2 Mobile Number
                      </span>
                    }
                    name="bla2MobileNumber"
                    rules={[
                      {
                        pattern: /^[0-9]{10}$/,
                        message: "Mobile number must be 10 digits",
                      },
                    ]}
                  >
                    <Input placeholder="Enter BLA-2's mobile number" />
                  </Form.Item>
                </Col>
              </Row>

              {/* Booth Level Committee Details Section */}
              <div className="border border-gray-300 rounded-lg p-6 bg-gray-50 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[16px] font-semibold text-[#1F2937]">
                    Booth Level Committee Details
                  </h3>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddCommitteeMember}
                    disabled={committeeMembers.length >= 15}
                    className="h-[40px]"
                  >
                    Add Member{" "}
                    {committeeMembers.length > 0 &&
                      `(${committeeMembers.length}/15)`}
                  </Button>
                </div>

                {committeeMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No committee members added yet</p>
                    <p className="text-sm mt-2">
                      Click "Add Member" to add up to 15 committee members
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {committeeMembers.map((member, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-gray-600">
                            Member {index + 1}
                          </span>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveCommitteeMember(index)}
                            size="small"
                          >
                            Remove
                          </Button>
                        </div>
                        <Row gutter={[16, 16]}>
                          <Col span={8}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                              placeholder="Enter name"
                              value={member.name}
                              onChange={(e) =>
                                handleCommitteeMemberChange(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="h-[40px]"
                              maxLength={100}
                            />
                          </Col>
                          <Col span={8}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Designation{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              placeholder="Enter designation"
                              value={member.designation}
                              onChange={(e) =>
                                handleCommitteeMemberChange(
                                  index,
                                  "designation",
                                  e.target.value
                                )
                              }
                              className="h-[40px]"
                              maxLength={50}
                            />
                          </Col>
                          <Col span={8}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mobile Number
                            </label>
                            <Input
                              placeholder="Enter mobile number"
                              value={member.mobileNumber}
                              onChange={(e) =>
                                handleCommitteeMemberChange(
                                  index,
                                  "mobileNumber",
                                  e.target.value
                                )
                              }
                              className="h-[40px]"
                              maxLength={10}
                            />
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Form>
          </Modal>
        </>
      )}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <DownloadOutlined style={{ fontSize: "20px", color: "#52c41a" }} />
            <span>Export Parts</span>
          </div>
        }
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
        width={480}
        closable={true}
      >
        {exportJob &&
        (exportJob.status === "PENDING" ||
          exportJob.status === "IN_PROGRESS") ? (
          <div style={{ padding: "16px", textAlign: "center" }}>
            <Spin size="large" style={{ marginBottom: "16px" }} />
            <h4>Export in Progress</h4>
            <Tag
              color={getStatusColor(exportJob.status)}
              style={{ marginBottom: "16px" }}
            >
              {getStatusText(exportJob.status)}
            </Tag>
            <Progress percent={exportJob.progress} status="active" />
            <div style={{ marginTop: "16px", fontSize: "12px", color: "#666" }}>
              Running... please wait until export completes.
            </div>
          </div>
        ) : exportJob && exportJob.status === "COMPLETED" ? (
          <div style={{ padding: "16px", textAlign: "center" }}>
            <DownloadOutlined
              style={{
                fontSize: "32px",
                color: "#52c41a",
                marginBottom: "16px",
              }}
            />
            <h4>Export Ready!</h4>
            <Tag color="green" style={{ marginBottom: "16px" }}>
              Completed
            </Tag>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              style={{ marginBottom: "16px" }}
            >
              Download {exportJob.exportType}
            </Button>
            <br />
            <Button
              type="link"
              onClick={handleCancelExport}
              style={{ fontSize: "12px" }}
            >
              Clear Status
            </Button>
          </div>
        ) : exportJob && exportJob.status === "FAILED" ? (
          <div style={{ padding: "16px", textAlign: "center" }}>
            <CloseOutlined
              style={{
                fontSize: "32px",
                color: "#ff4d4f",
                marginBottom: "16px",
              }}
            />
            <h4>Export Failed</h4>
            <Tag color="red" style={{ marginBottom: "16px" }}>
              Failed
            </Tag>
            <div
              style={{
                color: "#ff4d4f",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              {exportJob.errorMessage || "Unknown error occurred"}
            </div>
            <Button type="primary" danger onClick={handleCancelExport}>
              Try Again
            </Button>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Excel Option */}
            <Card
              hoverable
              onClick={() => !exportStartingType && handleExport("EXCEL")}
              style={{
                cursor: exportStartingType ? "not-allowed" : "pointer",
                border: "2px solid #217346",
                borderRadius: "8px",
                opacity: exportStartingType ? 0.7 : 1,
              }}
              bodyStyle={{ padding: "20px" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#f0f9ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileExcelOutlined
                    style={{ fontSize: "24px", color: "#217346" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#217346",
                    }}
                  >
                    Export as Excel
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Download data in XLSX format • Best for analysis
                  </div>
                  {exportStartingType === "EXCEL" && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#217346",
                        marginTop: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <SyncOutlined spin /> Starting export...
                    </div>
                  )}
                </div>
                <div style={{ fontSize: "20px", color: "#217346" }}>→</div>
              </div>
            </Card>

            {/* PDF Option */}
            <Card
              hoverable
              onClick={() => !exportStartingType && handleExport("PDF")}
              style={{
                cursor: exportStartingType ? "not-allowed" : "pointer",
                border: "2px solid #ff4d4f",
                borderRadius: "8px",
                opacity: exportStartingType ? 0.7 : 1,
              }}
              bodyStyle={{ padding: "20px" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#fff1f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FilePdfOutlined
                    style={{ fontSize: "24px", color: "#ff4d4f" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#ff4d4f",
                    }}
                  >
                    Export as PDF
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Download data in PDF format • Best for printing
                  </div>
                  {exportStartingType === "PDF" && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#ff4d4f",
                        marginTop: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <SyncOutlined spin /> Starting export...
                    </div>
                  )}
                </div>
                <div style={{ fontSize: "20px", color: "#ff4d4f" }}>→</div>
              </div>
            </Card>
          </div>
        )}
      </Modal>
      <PartExportJobsModal
        open={isDownloadsModalOpen}
        onClose={() => setIsDownloadsModalOpen(false)}
        electionId={selectedElectionId ? parseInt(selectedElectionId) : null}
      />

      <Modal
        title="Part Details"
        open={isPartViewModalVisible}
        onCancel={() => setIsPartViewModalVisible(false)}
        footer={null}
        centered
        width={700}
      >
        {viewingPart && (
          <Descriptions bordered column={1} size="middle">
            {/* Image */}
            <Descriptions.Item label="Part Image">
              {viewingPart.partImageUrl ? (
                <img
                  src={viewingPart.partImageUrl}
                  alt="Part"
                  style={{ width: 100, maxHeight: 100, objectFit: "cover" }}
                />
              ) : (
                "No Image"
              )}
            </Descriptions.Item>
            {/* Basic Info */}
            <Descriptions.Item label="Part ID">
              {viewingPart.id}
            </Descriptions.Item>

            <Descriptions.Item label="Part Number">
              {viewingPart.partNo || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Part Name (English)">
              {viewingPart.partNameEnglish || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Part Name (L1)">
              {viewingPart.partNameL1 || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Part Type">
              {viewingPart.partType || "N/A"}
            </Descriptions.Item>

            {/* School & Location */}
            <Descriptions.Item label="School Name">
              {viewingPart.schoolName || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Pincode">
              {viewingPart.pincode || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Part Latitude">
              {viewingPart.partLat ?? "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Part Longitude">
              {viewingPart.partLong ?? "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="School Latitude">
              {viewingPart.schoolLat ?? "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="School Longitude">
              {viewingPart.schoolLong ?? "N/A"}
            </Descriptions.Item>

            {/* Captain */}
            <Descriptions.Item label="Part Captain Name">
              {viewingPart.partCaptainName || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Captain Designation">
              {viewingPart.captainDesignation || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Captain Mobile">
              {viewingPart.captainMobileNo || "N/A"}
            </Descriptions.Item>

            {/* BLO */}
            <Descriptions.Item label="BLO Name">
              {viewingPart.bloName || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="BLO Designation">
              {viewingPart.bloDesignation || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="BLO Mobile">
              {viewingPart.bloMobileNumber || "N/A"}
            </Descriptions.Item>

            {/* BLA 2 */}
            <Descriptions.Item label="BLA 2 Name">
              {viewingPart.bla2Name || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="BLA 2 Designation">
              {viewingPart.bla2Designation || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="BLA 2 Mobile">
              {viewingPart.bla2MobileNumber || "N/A"}
            </Descriptions.Item>

            {/* Booth Vulnerability */}
            <Descriptions.Item label="Booth Vulnerability">
              {viewingPart.boothVulnerability ?? "Not Assigned"}
            </Descriptions.Item>

            {/* Booth Committee */}
            <Descriptions.Item label="Booth Committee Members">
              {viewingPart.boothCommitteeMembers?.length ? (
                <List
                  size="small"
                  dataSource={viewingPart.boothCommitteeMembers}
                  renderItem={(member) => (
                    <List.Item>
                      <div>
                        <strong>{member.name}</strong>
                        <div>{member.designation}</div>
                        <div>📞 {member.mobileNumber}</div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                "No Members"
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <DownloadOutlined style={{ fontSize: "20px", color: "#52c41a" }} />
            <span>Export Part</span>
          </div>
        }
        open={isExportPartModalVisible}
        onCancel={() => setIsExportPartModalVisible(false)}
        footer={null}
        width={480}
        closable={true}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* PDF Option */}
          <Card
            hoverable
            // onClick={() => handleExport("PDF")}
            style={{
              cursor: "pointer",
              border: "2px solid #ff4d4f",
              borderRadius: "8px",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#fff1f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FilePdfOutlined
                  style={{ fontSize: "24px", color: "#ff4d4f" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#ff4d4f",
                  }}
                >
                  Export as PDF
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Download data in PDF format • Best for printing
                </div>
              </div>
              <div style={{ fontSize: "20px", color: "#ff4d4f" }}>→</div>
            </div>
          </Card>
        </div>
      </Modal>
    </div>
  );
}
