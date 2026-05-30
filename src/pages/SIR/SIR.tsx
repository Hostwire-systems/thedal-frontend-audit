import React, { useState, useEffect } from "react";
import {
  Button,
  Upload,
  Card,
  Row,
  Col,
  message,
  Modal,
  Table,
  Tag,
  Space,
  Spin,
  Divider,
  Typography,
  Statistic,
  Popconfirm,
  Tabs,
  Progress,
} from "antd";
import {
  FileExcelOutlined,
  EyeOutlined,
  LoadingOutlined,
  DownloadOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import type { UploadFile } from "antd/es/upload/interface";
import {
  compareFilesApi,
  getJobStatusApi,
  getSummaryApi,
  getDetailedRecordsApi,
  listAllComparisonsApi,
  deleteComparisonApi,
  initiateExportApi,
  getExportStatusApi,
} from "../../api/sirApi";

const { Title, Text } = Typography;

// ==================== TYPE DEFINITIONS ====================

interface ComparisonJob {
  jobId: string;
  baseFileName: string;
  newFileName: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  additions: number | null;
  deletions: number | null;
  shifts: number | null;
  createdAt: string;
  completedAt: string | null;
}

interface JobStatus {
  jobId: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  message: string;
}

interface SummaryData {
  totalBaseRecords: number;
  totalNewRecords: number;
  additions: number;
  deletions: number;
  shifts: number;
}

interface SummaryResponse {
  jobId: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  summary: SummaryData | null;
  processedAt: string | null;
  errorMessage: string | null;
}

interface VoterRecord {
  epicNumber: string;
  partNo: number;
  voterNameEn: string;
  serialNo: number;
  sectionNo: number;
  houseNoEn: string;
  age: number;
  gender: string;
}

interface ShiftRecord {
  epicNumber: string;
  oldPartNo: number;
  newPartNo: number;
  voterNameEn: string;
  serialNo: number;
  sectionNo: number;
  houseNoEn: string;
  age: number;
  gender: string;
}

interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// ==================== MAIN COMPONENT ====================

const SIR: React.FC = () => {
  // Upload state
  const [baseFile, setBaseFile] = useState<UploadFile | null>(null);
  const [newFile, setNewFile] = useState<UploadFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Added for upload progress


  // Processing state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [processingStep, setProcessingStep] = useState<string>("Uploading files..."); // Added for step tracking


  // History & List state
  const [comparisonList, setComparisonList] = useState<ComparisonJob[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listPagination, setListPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Report Modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("additions");

  // Detailed records state
  const [additionsData, setAdditionsData] = useState<VoterRecord[]>([]);
  const [deletionsData, setDeletionsData] = useState<VoterRecord[]>([]);
  const [shiftsData, setShiftsData] = useState<ShiftRecord[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsPagination, setDetailsPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // Export state
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [exportJobId, setExportJobId] = useState<number | null>(null);
  const [exportPolling, setExportPolling] = useState(false);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const userRole = localStorage.getItem("role");
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  // ==================== LIFECYCLE & POLLING ====================

  // Fetch comparison list on mount and election change
  useEffect(() => {
    if (selectedElectionId) {
      fetchComparisonList(0, listPagination.pageSize);
    }
  }, [selectedElectionId]);

  // Poll job status when processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentJobId && jobStatus?.status === "PROCESSING") {
      interval = setInterval(() => {
        checkJobStatus(currentJobId);
      }, 2000); // Poll every 2 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentJobId, jobStatus?.status]);

  // Poll export status when processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (exportJobId && exportPolling) {
      interval = setInterval(() => {
        checkExportStatus(exportJobId);
      }, 3000); // Poll every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [exportJobId, exportPolling]);

  // ==================== API CALLS ====================

  // Fetch list of all comparisons
  const fetchComparisonList = async (page: number, size: number) => {
    setListLoading(true);
    try {
      const response: PaginatedResponse<ComparisonJob> =
        await listAllComparisonsApi(
          selectedElectionId ? parseInt(selectedElectionId) : undefined,
          page,
          size
        );

      setComparisonList(response.content);
      setListPagination({
        current: page + 1, // Convert 0-indexed to 1-indexed
        pageSize: size,
        total: response.totalElements,
      });
    } catch (error: any) {
      console.error("Error fetching comparison list:", error);
      message.error("Failed to fetch comparison history");
    } finally {
      setListLoading(false);
    }
  };

  // Check job status
  const checkJobStatus = async (jobId: string) => {
    try {
      const response: JobStatus = await getJobStatusApi(jobId);
      setJobStatus(response);

      // Update processing step based on progress
      if (response.progress < 30) {
        setProcessingStep("Parsing files...");
      } else if (response.progress < 60) {
        setProcessingStep("Comparing records...");
      } else if (response.progress < 90) {
        setProcessingStep("Identifying changes...");
      } else {
        setProcessingStep("Finalizing results...");
      }

      if (response.status === "COMPLETED") {
        message.success("SIR comparison completed successfully!");
        setCurrentJobId(null);
        setJobStatus(null);
          setProcessingStep("Uploading files...");
        setUploadProgress(0);
        // Refresh the list
        fetchComparisonList(
          listPagination.current - 1,
          listPagination.pageSize
        );
      } else if (response.status === "FAILED") {
        message.error("SIR comparison failed. Please try again.");
        setCurrentJobId(null);
        setJobStatus(null);
         setProcessingStep("Uploading files...");
        setUploadProgress(0);
      }
    } catch (error: any) {
      console.error("Error checking job status:", error);
    }
  };

  // Upload and start comparison
  const handleUploadAndCompare = async () => {
    if (!baseFile || !newFile) {
      message.warning("Please upload both base file and new file");
      return;
    }

    // Validate that we have the actual file objects
    const baseFileObj = baseFile.originFileObj;
    const newFileObj = newFile.originFileObj;

    if (!baseFileObj || !newFileObj) {
      message.error("Failed to read file objects. Please try uploading again.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setProcessingStep("Uploading files...");
    
    // Simulate upload progress (0-50%)
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 50) {
          clearInterval(uploadInterval);
          return 50;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response = await compareFilesApi(
        baseFileObj as File,
        newFileObj as File,
        selectedElectionId ? parseInt(selectedElectionId) : undefined
      );
      setUploadProgress(50);
      setProcessingStep("Processing comparison...");

      setCurrentJobId(response.jobId);
      setJobStatus({
        jobId: response.jobId,
        status: response.status,
        progress: 50,
        message: response.message || "Processing started",
      });

      message.success("SIR comparison initiated. Processing started...");

      // Clear files
      setBaseFile(null);
      setNewFile(null);

      // Refresh list
      fetchComparisonList(listPagination.current - 1, listPagination.pageSize);
    } catch (error: any) {
      console.error("Error uploading files:", error);
            setUploadProgress(0);
      setProcessingStep("Uploading files...");

      message.error(
        error.response?.data?.message || "Failed to upload files. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  // View report - fetch summary
  const handleViewReport = async (jobId: string) => {
    setSelectedJobId(jobId);
    setReportModalVisible(true);
    setSummaryData(null);
    setActiveTab("additions");

    try {
      const response: SummaryResponse = await getSummaryApi(jobId);

      if (response.status === "COMPLETED" && response.summary) {
        setSummaryData(response.summary);
        // Fetch first tab data (additions)
        fetchDetailedRecords(jobId, "ADDITIONS", 0, 50);
      } else if (response.status === "FAILED") {
        message.error(response.errorMessage || "Comparison failed");
      } else {
        message.info("Comparison is still processing");
      }
    } catch (error: any) {
      console.error("Error fetching summary:", error);
      message.error("Failed to fetch report summary");
    }
  };

  // Fetch detailed records based on type
  const fetchDetailedRecords = async (
    jobId: string,
    type: "ADDITIONS" | "DELETIONS" | "SHIFTS",
    page: number,
    size: number
  ) => {
    setDetailsLoading(true);
    try {
      if (type === "ADDITIONS") {
        const response: PaginatedResponse<VoterRecord> =
          await getDetailedRecordsApi(jobId, type, page, size);
        setAdditionsData(response.content);
        setDetailsPagination({
          current: page + 1,
          pageSize: size,
          total: response.totalElements,
        });
      } else if (type === "DELETIONS") {
        const response: PaginatedResponse<VoterRecord> =
          await getDetailedRecordsApi(jobId, type, page, size);
        setDeletionsData(response.content);
        setDetailsPagination({
          current: page + 1,
          pageSize: size,
          total: response.totalElements,
        });
      } else if (type === "SHIFTS") {
        const response: PaginatedResponse<ShiftRecord> =
          await getDetailedRecordsApi(jobId, type, page, size);
        setShiftsData(response.content);
        setDetailsPagination({
          current: page + 1,
          pageSize: size,
          total: response.totalElements,
        });
      }
    } catch (error: any) {
      console.error(`Error fetching ${type} records:`, error);
      message.error(`Failed to fetch ${type.toLowerCase()} records`);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Delete comparison
  const handleDeleteComparison = async (jobId: string) => {
    try {
      await deleteComparisonApi(jobId);
      message.success("Comparison deleted successfully");
      fetchComparisonList(listPagination.current - 1, listPagination.pageSize);
    } catch (error: any) {
      console.error("Error deleting comparison:", error);
      message.error(
        error.response?.data?.message || "Failed to delete comparison"
      );
    }
  };

  // Handle export
  const handleExport = async (format: "EXCEL" | "PDF") => {
    if (!selectedJobId || !activeTab) return;

    const type = activeTab.toUpperCase() as "ADDITIONS" | "DELETIONS" | "SHIFTS";
    const exportKey = `${type}_${format}`;

    try {
      setExportingType(exportKey);
      
      const response = await initiateExportApi(selectedJobId, type, format);
      
      if (response.exportJobId) {
        setExportJobId(response.exportJobId);
        setExportPolling(true);
        message.success(`${format} export initiated. Preparing file...`);
      }
    } catch (error: any) {
      console.error("Error initiating export:", error);
      message.error(error.response?.data?.message || "Failed to initiate export");
      setExportingType(null);
    }
  };

  // Check export status
  const checkExportStatus = async (jobId: number) => {
    try {
      const response = await getExportStatusApi(jobId);
      
      if (response.status === "COMPLETED") {
        setExportPolling(false);
        setExportingType(null);
        setExportJobId(null);
        message.success("Export completed!");
        
        // Download the file
        if (response.downloadUrl) {
          window.open(response.downloadUrl, "_blank");
        }
      } else if (response.status === "FAILED") {
        setExportPolling(false);
        setExportingType(null);
        setExportJobId(null);
        message.error("Export failed: " + (response.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error checking export status:", error);
      setExportPolling(false);
      setExportingType(null);
      setExportJobId(null);
    }
  };

  // ==================== EVENT HANDLERS ====================

  const handleBaseFileUpload = (file: any) => {
    // Store the file with originFileObj set
    const uploadFile: UploadFile = {
      uid: file.uid || String(Date.now()),
      name: file.name,
      status: 'done',
      originFileObj: file,
    };
    setBaseFile(uploadFile);
    return false; // Prevent auto upload
  };

  const handleNewFileUpload = (file: any) => {
    // Store the file with originFileObj set
    const uploadFile: UploadFile = {
      uid: file.uid || String(Date.now() + 1),
      name: file.name,
      status: 'done',
      originFileObj: file,
    };
    setNewFile(uploadFile);
    return false; // Prevent auto upload
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (!selectedJobId) return;

    // Fetch data for the selected tab
    if (key === "additions" && additionsData.length === 0) {
      fetchDetailedRecords(selectedJobId, "ADDITIONS", 0, 50);
    } else if (key === "deletions" && deletionsData.length === 0) {
      fetchDetailedRecords(selectedJobId, "DELETIONS", 0, 50);
    } else if (key === "shifts" && shiftsData.length === 0) {
      fetchDetailedRecords(selectedJobId, "SHIFTS", 0, 50);
    }
  };

  const handleDetailsPaginationChange = (page: number, pageSize?: number) => {
    if (!selectedJobId) return;

    const type =
      activeTab === "additions"
        ? "ADDITIONS"
        : activeTab === "deletions"
        ? "DELETIONS"
        : "SHIFTS";

    fetchDetailedRecords(
      selectedJobId,
      type,
      page - 1,
      pageSize || detailsPagination.pageSize
    );
  };

  const handleListPaginationChange = (page: number, pageSize?: number) => {
    fetchComparisonList(
      page - 1,
      pageSize || listPagination.pageSize
    );
  };

  // Calculate current progress percentage
  const getCurrentProgress = () => {
    if (uploading && currentJobId === null) {
      // During upload phase
      return uploadProgress;
    } else if (jobStatus && currentJobId) {
      // During processing phase
      return jobStatus.progress;
    }
    return 0;
  };


   const getProgressColor = () => {
    const progress = getCurrentProgress();
    if (progress < 30) return "#ff4d4f"; // Red for early stages
    if (progress < 70) return "#faad14"; // Yellow for middle stages
    if (progress < 90) return "#1890ff"; // Blue for late stages
    return "#52c41a"; // Green for completion
  };

  // ==================== TABLE COLUMNS ====================

  const historyColumns = [
    {
      title: "Upload Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => (
        <Text strong>{new Date(text).toLocaleString()}</Text>
      ),
    },
    {
      title: "Base File",
      dataIndex: "baseFileName",
      key: "baseFileName",
      render: (text: string) => (
        <Space>
          <FileExcelOutlined style={{ color: "#52c41a" }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: "New File",
      dataIndex: "newFileName",
      key: "newFileName",
      render: (text: string) => (
        <Space>
          <FileExcelOutlined style={{ color: "#1890ff" }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const config = {
          COMPLETED: { icon: <CheckCircleOutlined />, color: "success" },
          PROCESSING: { icon: <ClockCircleOutlined />, color: "processing" },
          FAILED: { icon: <CloseCircleOutlined />, color: "error" },
        }[status];
        return (
          <Tag icon={config?.icon} color={config?.color}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Additions",
      dataIndex: "additions",
      key: "additions",
      render: (value: number | null) =>
        value !== null ? <Text strong style={{ color: "#52c41a" }}>{value}</Text> : "-",
    },
    {
      title: "Deletions",
      dataIndex: "deletions",
      key: "deletions",
      render: (value: number | null) =>
        value !== null ? <Text strong style={{ color: "#ff4d4f" }}>{value}</Text> : "-",
    },
    {
      title: "Shifts",
      dataIndex: "shifts",
      key: "shifts",
      render: (value: number | null) =>
        value !== null ? <Text strong style={{ color: "#1890ff" }}>{value}</Text> : "-",
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: ComparisonJob) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewReport(record.jobId)}
            disabled={record.status !== "COMPLETED"}
            size="small"
          >
            View
          </Button>
          {isSuperAdminOrAdmin && (
            <Popconfirm
              title="Delete this comparison?"
              description="This action cannot be undone."
              onConfirm={() => handleDeleteComparison(record.jobId)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={record.status === "PROCESSING"}
              >
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const voterRecordColumns = [
    { title: "EPIC Number", dataIndex: "epicNumber", key: "epicNumber" },
    { title: "Name", dataIndex: "voterNameEn", key: "voterNameEn" },
    { title: "Part No", dataIndex: "partNo", key: "partNo" },
    { title: "Serial No", dataIndex: "serialNo", key: "serialNo" },
    { title: "Section No", dataIndex: "sectionNo", key: "sectionNo" },
    { title: "House No", dataIndex: "houseNoEn", key: "houseNoEn" },
    { title: "Age", dataIndex: "age", key: "age" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
  ];

  const shiftedColumns = [
    { title: "EPIC Number", dataIndex: "epicNumber", key: "epicNumber" },
    { title: "Name", dataIndex: "voterNameEn", key: "voterNameEn" },
    { title: "Old Part No", dataIndex: "oldPartNo", key: "oldPartNo" },
    { title: "New Part No", dataIndex: "newPartNo", key: "newPartNo" },
    { title: "Serial No", dataIndex: "serialNo", key: "serialNo" },
    { title: "Section No", dataIndex: "sectionNo", key: "sectionNo" },
    { title: "House No", dataIndex: "houseNoEn", key: "houseNoEn" },
    { title: "Age", dataIndex: "age", key: "age" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
  ];

  // ==================== RENDER ====================

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          SIR Report Management
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Upload and compare voter data to identify additions, deletions, and shifts
        </Text>
      </div>

      {/* Processing Banner */}
      {(uploading || (currentJobId && jobStatus?.status === "PROCESSING")) && (
        <Card
          style={{
            marginBottom: 24,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.15)",
          }}
        >
          <Row align="middle" gutter={[24, 16]}>
            <Col flex="40px">
              <Spin
                indicator={
                  <LoadingOutlined style={{ fontSize: 28, color: "#fff" }} />
                }
              />
            </Col>
            <Col flex="auto">
              <div>
                <Text
                  strong
                  style={{ fontSize: 18, color: "#fff", display: "block", marginBottom: 4 }}
                >
                  {currentJobId ? "Processing SIR Comparison" : "Uploading Files"}
                </Text>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
                  {processingStep}
                </Text>
                <div style={{ marginTop: 12 }}>
                  <Progress
                    percent={getCurrentProgress()}
                    strokeColor={getProgressColor()}
                    strokeWidth={6}
                    trailColor="rgba(255,255,255,0.2)"
                    showInfo={true}
                    format={(percent) => `${percent}%`}
                    style={{ marginBottom: 4 }}
                  />
                  {jobStatus?.message && (
                    <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                      {jobStatus.message}
                    </Text>
                  )}
                </div>
              </div>
            </Col>
            <Col>
              <Tag color="gold" style={{ fontSize: 14, padding: "4px 8px" }}>
                {getCurrentProgress()}%
              </Tag>
            </Col>
          </Row>
        </Card>
      )}

      {/* Upload Section */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "#f0f5ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileExcelOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                </div>
                <Text strong style={{ fontSize: 16 }}>
                  Base File
                </Text>
              </Space>
            }
            style={{
              height: "100%",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 12, fontSize: 14 }}
            >
              Upload the previous voter list data (Excel format: .xlsx, .xls)
            </Text>
            <Button
              type="link"
              icon={<DownloadOutlined />}
              href="/templates/SIR.xlsx"
              download="SIR_Sample.xlsx"
              style={{ marginBottom: 12, paddingLeft: 0 }}
            >
              Download Sample File
            </Button>
            <Upload
              accept=".xlsx,.xls"
              beforeUpload={handleBaseFileUpload}
              fileList={baseFile ? [baseFile] : []}
              onRemove={() => setBaseFile(null)}
              maxCount={1}
            >
              <Button
                icon={<CloudUploadOutlined />}
                block
                size="large"
                style={{ height: 48, borderRadius: 8, borderStyle: "dashed" }}
              >
                Select Base File
              </Button>
            </Upload>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "#f6ffed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileExcelOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                </div>
                <Text strong style={{ fontSize: 16 }}>
                  New File
                </Text>
              </Space>
            }
            style={{
              height: "100%",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 12, fontSize: 14 }}
            >
              Upload the new voter list data (Excel format: .xlsx, .xls)
            </Text>
            <Button
              type="link"
              icon={<DownloadOutlined />}
              href="/templates/SIR.xlsx"
              download="SIR_Sample.xlsx"
              style={{ marginBottom: 12, paddingLeft: 0 }}
            >
              Download Sample File
            </Button>
            <Upload
              accept=".xlsx,.xls"
              beforeUpload={handleNewFileUpload}
              fileList={newFile ? [newFile] : []}
              onRemove={() => setNewFile(null)}
              maxCount={1}
            >
              <Button
                icon={<CloudUploadOutlined />}
                block
                size="large"
                style={{ height: 48, borderRadius: 8, borderStyle: "dashed" }}
              >
                Select New File
              </Button>
            </Upload>
          </Card>
        </Col>
      </Row>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Button
          type="primary"
          size="large"
          onClick={handleUploadAndCompare}
          loading={uploading}
          disabled={!baseFile || !newFile || !!currentJobId}
          icon={<CloudUploadOutlined />}
          style={{
            minWidth: 240,
            height: 48,
            fontSize: 16,
            borderRadius: 8,
            boxShadow:
              !baseFile || !newFile || !!currentJobId
                ? "none"
                : "0 4px 12px rgba(29, 78, 216, 0.3)",
          }}
        >
          Start Comparison
        </Button>
      </div>

      {/* Comparison History */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined style={{ fontSize: 20 }} />
            <Text strong style={{ fontSize: 18 }}>
              Comparison History
            </Text>
          </Space>
        }
        style={{
          marginTop: 32,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Table
          columns={historyColumns}
          dataSource={comparisonList}
          rowKey="jobId"
          loading={listLoading}
          pagination={{
            current: listPagination.current,
            pageSize: listPagination.pageSize,
            total: listPagination.total,
            position: ["bottomCenter"],
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
            onChange: handleListPaginationChange,
          }}
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* Report Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined style={{ fontSize: 20 }} />
            <Text strong style={{ fontSize: 18 }}>
              SIR Analysis Report
            </Text>
          </Space>
        }
        open={reportModalVisible}
        onCancel={() => {
          setReportModalVisible(false);
          setSelectedJobId(null);
          setSummaryData(null);
          setAdditionsData([]);
          setDeletionsData([]);
          setShiftsData([]);
        }}
        footer={null}
        width={1400}
      >
        {!summaryData ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Loading report data...</Text>
            </div>
          </div>
        ) : (
          <div>
            {/* Summary Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
              <Col xs={24} sm={6}>
                <Card
                  bordered={false}
                  style={{
                    background: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
                    borderRadius: 12,
                  }}
                >
                  <Statistic
                    title={<Text strong>Base Records</Text>}
                    value={summaryData.totalBaseRecords}
                    valueStyle={{ color: "#1890ff", fontSize: 28 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card
                  bordered={false}
                  style={{
                    background: "linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)",
                    borderRadius: 12,
                  }}
                >
                  <Statistic
                    title={<Text strong>New Records</Text>}
                    value={summaryData.totalNewRecords}
                    valueStyle={{ color: "#597ef7", fontSize: 28 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={4}>
                <Card
                  bordered={false}
                  style={{
                    background: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
                    borderRadius: 12,
                  }}
                >
                  <Statistic
                    title={<Text strong>Additions</Text>}
                    value={summaryData.additions}
                    valueStyle={{ color: "#52c41a", fontSize: 28 }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={4}>
                <Card
                  bordered={false}
                  style={{
                    background: "linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)",
                    borderRadius: 12,
                  }}
                >
                  <Statistic
                    title={<Text strong>Deletions</Text>}
                    value={summaryData.deletions}
                    valueStyle={{ color: "#ff4d4f", fontSize: 28 }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={4}>
                <Card
                  bordered={false}
                  style={{
                    background: "linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)",
                    borderRadius: 12,
                  }}
                >
                  <Statistic
                    title={<Text strong>Shifts</Text>}
                    value={summaryData.shifts}
                    valueStyle={{ color: "#fa8c16", fontSize: 28 }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Divider />

            {/* Detailed Records Tabs */}
            <Tabs activeKey={activeTab} onChange={handleTabChange}>
              <Tabs.TabPane
                tab={
                  <Space>
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    <span>Additions ({summaryData.additions})</span>
                  </Space>
                }
                key="additions"
              >
                <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleExport("EXCEL")}
                    loading={exportingType === "ADDITIONS_EXCEL"}
                    disabled={!!exportingType}
                  >
                    Export to Excel
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => handleExport("PDF")}
                    loading={exportingType === "ADDITIONS_PDF"}
                    disabled={!!exportingType}
                  >
                    Export to PDF
                  </Button>
                </div>
                <Table
                  columns={voterRecordColumns}
                  dataSource={additionsData}
                  rowKey="epicNumber"
                  loading={detailsLoading}
                  pagination={{
                    current: detailsPagination.current,
                    pageSize: detailsPagination.pageSize,
                    total: detailsPagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} records`,
                    onChange: handleDetailsPaginationChange,
                  }}
                  bordered
                />
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={
                  <Space>
                    <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                    <span>Deletions ({summaryData.deletions})</span>
                  </Space>
                }
                key="deletions"
              >
                <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleExport("EXCEL")}
                    loading={exportingType === "DELETIONS_EXCEL"}
                    disabled={!!exportingType}
                  >
                    Export to Excel
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => handleExport("PDF")}
                    loading={exportingType === "DELETIONS_PDF"}
                    disabled={!!exportingType}
                  >
                    Export to PDF
                  </Button>
                </div>
                <Table
                  columns={voterRecordColumns}
                  dataSource={deletionsData}
                  rowKey="epicNumber"
                  loading={detailsLoading}
                  pagination={{
                    current: detailsPagination.current,
                    pageSize: detailsPagination.pageSize,
                    total: detailsPagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} records`,
                    onChange: handleDetailsPaginationChange,
                  }}
                  bordered
                />
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={
                  <Space>
                    <ClockCircleOutlined style={{ color: "#fa8c16" }} />
                    <span>Shifts ({summaryData.shifts})</span>
                  </Space>
                }
                key="shifts"
              >
                <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleExport("EXCEL")}
                    loading={exportingType === "SHIFTS_EXCEL"}
                    disabled={!!exportingType}
                  >
                    Export to Excel
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => handleExport("PDF")}
                    loading={exportingType === "SHIFTS_PDF"}
                    disabled={!!exportingType}
                  >
                    Export to PDF
                  </Button>
                </div>
                <Table
                  columns={shiftedColumns}
                  dataSource={shiftsData}
                  rowKey="epicNumber"
                  loading={detailsLoading}
                  pagination={{
                    current: detailsPagination.current,
                    pageSize: detailsPagination.pageSize,
                    total: detailsPagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} records`,
                    onChange: handleDetailsPaginationChange,
                  }}
                  bordered
                />
              </Tabs.TabPane>
            </Tabs>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SIR;
