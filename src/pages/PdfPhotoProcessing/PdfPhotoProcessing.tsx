import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Card,
  Upload,
  Button,
  Form,
  Select,
  message,
  Progress,
  Typography,
  Row,
  Col,
  Alert,
  Modal,
  List,
  Badge,
  Space,
  Tag,
  InputNumber,
} from "antd";
import {
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  LoadingOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  extractPhotosFromPdf,
  getJobStatus,
  checkPhotoProcessingHealth,
  PhotoExtractionResponse,
  JobStatusResponse,
} from "../../api/photoProcessingApi";
import { getPartsApi } from "../../api/partApi";
import PhotoProcessingService, { ProcessingJob } from "../../services/PhotoProcessingService";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";

const { Title, Text } = Typography;
const { Option } = Select;

interface PartData {
  id: number;
  partNo: string;
  partNameEn: string;
  partNameL1: string;
}

const PdfPhotoProcessing: React.FC = () => {
  const [form] = Form.useForm();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [parts, setParts] = useState<PartData[]>([]);
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [serviceHealthy, setServiceHealthy] = useState<boolean>(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentJobDetails, setCurrentJobDetails] = useState<JobStatusResponse | null>(null);
  const [activeJobs, setActiveJobs] = useState<ProcessingJob[]>([]);
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);
  const [startPage, setStartPage] = useState<number | undefined>(undefined);
  const [endPage, setEndPage] = useState<number | undefined>(undefined);
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  // Get election data from localStorage instead of Redux
  const selectedElectionId = parseInt(localStorage.getItem("selectedElectionId") || "0");

  const userId = localStorage.getItem("userId");
  const accountId = userId ? parseInt(userId) : 0;
  const processingService = PhotoProcessingService.getInstance();

  useEffect(() => {
    checkServiceHealth();
    if (selectedElectionId) {
      fetchParts();
    }
    loadActiveJobs();
    
    // Subscribe to all job updates
    const unsubscribe = processingService.subscribe("*", handleJobUpdate);
    
    return () => {
      unsubscribe();
    };
  }, [selectedElectionId]);

  const checkServiceHealth = async () => {
    try {
      const health = await checkPhotoProcessingHealth();
      setServiceHealthy(health.status === "UP" && health.ocrServiceHealthy);
    } catch (error) {
      setServiceHealthy(false);
      console.error("Health check failed:", error);
    }
  };

  const fetchParts = async () => {
    try {
      const response = await getPartsApi(selectedElectionId);
      const partData = Array.isArray(response.data) ? response.data : [];
      setParts(partData);
    } catch (error) {
      message.error("Failed to fetch parts");
      console.error("Error fetching parts:", error);
    }
  };

  const loadActiveJobs = () => {
    const jobs = processingService.getAllJobs();
    setActiveJobs(jobs);
    
    // Set current job if there's an active one for current election
    const activeJob = jobs.find(job => 
      job.isActive && job.electionId === selectedElectionId
    );
    setCurrentJob(activeJob || null);
  };

  const handleJobUpdate = useCallback((job: ProcessingJob) => {
    setActiveJobs(processingService.getAllJobs());
    
    if (job.electionId === selectedElectionId) {
      setCurrentJob(job.isActive ? job : null);
    }
  }, [selectedElectionId]);

  const uploadProps = {
    name: "file",  // Changed from "pdfFile" to "file" to match backend expectation
    multiple: false,
    accept: ".pdf",
    beforeUpload: (file: File) => {
      if (file.type !== "application/pdf") {
        message.error("Please upload only PDF files");
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        message.error("File size must be less than 50MB");
        return false;
      }
      setUploadedFile(file);
      message.success(`${file.name} selected successfully`);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setUploadedFile(null);
    },
  };

  const handleFileUpload = async () => {
    if (isFrozen) {
      message.warning("Election is frozen. Photo processing is disabled.");
      return;
    }
    if (!uploadedFile || !selectedPart || !selectedElectionId) {
      message.error("Please select a PDF file and part number");
      return;
    }

    // Check if there's already an active job for this election
    if (currentJob && currentJob.isActive) {
      message.warning("A photo processing job is already running for this election");
      return;
    }

    try {
      setProcessing(true);

      const result = await extractPhotosFromPdf(
        uploadedFile,
        selectedPart,
        selectedElectionId,
        accountId,
        startPage,
        endPage
      );

      if (result.success) {
        // Start background monitoring
        processingService.startJob(
          result.jobId,
          selectedPart,
          selectedElectionId,
          uploadedFile.name
        );
        
        message.success("Photo processing started successfully!");
        
        // Reset form
        setUploadedFile(null);
        setSelectedPart("");
        setStartPage(undefined);
        setEndPage(undefined);
        form.resetFields();
        
        // Load updated jobs
        loadActiveJobs();
      } else {
        message.error(result.error || "Failed to start photo processing");
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to start photo extraction");
      console.error("Upload error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = async (jobId: string) => {
    try {
      const details = await getJobStatus(jobId);
      setCurrentJobDetails(details);
      setShowDetailsModal(true);
    } catch (error) {
      message.error("Failed to fetch job details");
      console.error("Error fetching job details:", error);
    }
  };

  const handleRemoveJob = (jobId: string) => {
    Modal.confirm({
      title: 'Remove Job',
      content: 'Are you sure you want to remove this job from the list?',
      onOk: () => {
        processingService.removeJob(jobId);
        loadActiveJobs();
        message.success('Job removed successfully');
      },
    });
  };

  const handleClearCompleted = () => {
    Modal.confirm({
      title: 'Clear Completed Jobs',
      content: 'Are you sure you want to clear all completed jobs?',
      onOk: () => {
        processingService.clearCompletedJobs();
        loadActiveJobs();
        message.success('Completed jobs cleared');
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "success";
      case "FAILED": return "error";
      case "PROCESSING": return "processing";
      case "STARTED": return "default";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED": return <CheckCircleOutlined />;
      case "FAILED": return <ExclamationCircleOutlined />;
      case "PROCESSING": return <LoadingOutlined spin />;
      case "STARTED": return <ClockCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const canStartNewJob = !isFrozen && (!currentJob || !currentJob.isActive);
  const hasActiveJobs = processingService.hasActiveJobs();

  const containerStyle: React.CSSProperties = {
    padding: "24px"
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const disabledCardStyle: React.CSSProperties = {
    opacity: canStartNewJob ? 1 : 0.6,
    pointerEvents: canStartNewJob ? 'auto' : 'none'
  };

  const centerTextStyle: React.CSSProperties = {
    textAlign: "center"
  };

  const flexStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  };

  const progressStyle: React.CSSProperties = {
    marginTop: 8
  };

  const smallProgressStyle: React.CSSProperties = {
    marginTop: 4
  };

  const errorColorStyle: React.CSSProperties = {
    color: '#ff4d4f'
  };

  const marginStyle: React.CSSProperties = {
    margin: 0
  };

  const smallTextStyle: React.CSSProperties = {
    color: "#666",
    fontSize: "12px"
  };

  return (
    <div style={containerStyle}>
      {isFrozen && (
        <Alert
          message="Election is frozen. Photo processing actions are disabled."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Card>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <div style={headerStyle}>
              <Title level={2}>PDF Photo Processing</Title>
              <Space>
                <Badge count={activeJobs.filter(job => job.isActive).length} showZero={false}>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={loadActiveJobs}
                  >
                    Refresh
                  </Button>
                </Badge>
                {activeJobs.some(job => !job.isActive) && (
                  <Button 
                    icon={<DeleteOutlined />}
                    onClick={handleClearCompleted}
                  >
                    Clear Completed
                  </Button>
                )}
              </Space>
            </div>
            
            {!serviceHealthy && (
              <Alert
                message="Service Warning"
                description="Photo processing service may not be available. Please try again later."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {hasActiveJobs && (
              <Alert
                message="Background Processing Active"
                description="Photo processing jobs are running in the background. You will be notified when they complete."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
          </Col>
        </Row>

        {/* Current Job Status */}
        {currentJob && (
          <Card 
            title={`Current Job - Part ${currentJob.partNo}`} 
            size="small" 
            style={{ marginBottom: 24 }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col flex="auto">
                <div style={flexStyle}>
                  {getStatusIcon(currentJob.status)}
                  <Tag color={getStatusColor(currentJob.status)}>
                    {currentJob.status}
                  </Tag>
                  <Text strong>
                    {currentJob.fileName}
                  </Text>
                </div>
                {currentJob.isActive && (
                  <Progress 
                    percent={Math.round(currentJob.progress)} 
                    size="small" 
                    status={currentJob.status === "FAILED" ? "exception" : "active"}
                    style={progressStyle}
                  />
                )}
              </Col>
              <Col>
                <Space>
                  <Button 
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetails(currentJob.jobId)}
                  >
                    Details
                  </Button>
                  {!currentJob.isActive && (
                    <Button 
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveJob(currentJob.jobId)}
                    >
                      Remove
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        {/* Upload Form */}
        <Card 
          title="Start New Processing Job" 
          style={disabledCardStyle}
        >
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Form form={form} layout="vertical">
                <Form.Item
                  label="Select Part"
                  name="partNo"
                  rules={[{ required: true, message: "Please select a part" }]}
                >
                  <Select
                    placeholder="Select part number"
                    value={selectedPart}
                    onChange={setSelectedPart}
                    showSearch
                    filterOption={(input, option: any) =>
                      option?.children?.toLowerCase().includes(input.toLowerCase())
                    }
                    disabled={!canStartNewJob}
                  >
                    {parts.map((part) => (
                      <Option key={part.partNo} value={part.partNo}>
                        {part.partNo} - {part.partNameEn}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Page Range (Optional)" style={{ marginBottom: 16 }}>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item
                        name="startPage"
                        label="Start Page"
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          placeholder="Start page"
                          min={1}
                          value={startPage}
                          onChange={(value) => setStartPage(value || undefined)}
                          disabled={!canStartNewJob}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="endPage"
                        label="End Page"
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          placeholder="End page"
                          min={startPage || 1}
                          value={endPage}
                          onChange={(value) => setEndPage(value || undefined)}
                          disabled={!canStartNewJob}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Leave empty to process all pages. Page numbers are 1-based.
                  </div>
                </Form.Item>

                <Form.Item label="Upload PDF File">
                  <Upload.Dragger {...uploadProps} disabled={!canStartNewJob}>
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag PDF file to this area to upload
                    </p>
                    <p className="ant-upload-hint">
                      Upload a PDF file containing voter photos. Maximum file size: 50MB
                    </p>
                  </Upload.Dragger>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    onClick={handleFileUpload}
                    disabled={!uploadedFile || !selectedPart || !serviceHealthy || !canStartNewJob}
                    loading={processing}
                    size="large"
                  >
                    Start Processing
                  </Button>
                </Form.Item>
              </Form>
            </Col>
            <Col span={12}>
              <Card title="Instructions" size="small">
                <ul>
                  <li>Select the appropriate part number from the dropdown</li>
                  <li>Optionally specify page range to process only specific pages</li>
                  <li>Upload a PDF file containing voter identity cards with photos</li>
                  <li>The system will automatically extract photos and map them to voters</li>
                  <li>Processing runs in the background - you can navigate away and return later</li>
                  <li>You'll receive notifications when processing completes</li>
                </ul>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* All Jobs List */}
        {activeJobs.length > 0 && (
          <Card title="All Processing Jobs" style={{ marginTop: 24 }}>
            <List
              dataSource={activeJobs}
              renderItem={(job) => (
                <List.Item
                  actions={[
                    <Button 
                      key="details"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetails(job.jobId)}
                    >
                      Details
                    </Button>,
                    !job.isActive && (
                      <Button 
                        key="remove"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveJob(job.jobId)}
                      >
                        Remove
                      </Button>
                    )
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={getStatusIcon(job.status)}
                    title={
                      <Space>
                        <Text strong>{job.fileName}</Text>
                        <Tag color={getStatusColor(job.status)}>
                          {job.status}
                        </Tag>
                        <Text type="secondary">
                          Part {job.partNo} | Election {job.electionId}
                        </Text>
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary">
                          Started: {new Date(job.startTime).toLocaleString()}
                        </Text>
                        {job.isActive && (
                          <Progress 
                            percent={Math.round(job.progress)} 
                            size="small" 
                            style={smallProgressStyle}
                            status={job.status === "FAILED" ? "exception" : "active"}
                          />
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </Card>

      {/* Job Details Modal */}
      <Modal
        title="Processing Job Details"
        open={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>,
        ]}
      >
        {currentJobDetails && currentJobDetails.success && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small" style={centerTextStyle}>
                  <Title level={4} style={{ color: "#1890ff", ...marginStyle }}>
                    {currentJobDetails.status.totalPhotos}
                  </Title>
                  <Text style={smallTextStyle}>Total Photos</Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={centerTextStyle}>
                  <Title level={4} style={{ color: "#52c41a", ...marginStyle }}>
                    {currentJobDetails.status.successfulUpdates}
                  </Title>
                  <Text style={smallTextStyle}>Successful</Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={centerTextStyle}>
                  <Title level={4} style={{ color: "#ff4d4f", ...marginStyle }}>
                    {currentJobDetails.status.failedUpdates}
                  </Title>
                  <Text style={smallTextStyle}>Failed</Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={centerTextStyle}>
                  <Title level={4} style={{ color: "#722ed1", ...marginStyle }}>
                    {currentJobDetails.status.progressPercentage.toFixed(1)}%
                  </Title>
                  <Text style={smallTextStyle}>Progress</Text>
                </Card>
              </Col>
            </Row>

            <Title level={4}>Job Information</Title>
            <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
              <Col span={8}><Text strong>Job ID:</Text></Col>
              <Col span={16}><Text code>{currentJobDetails.status.jobId}</Text></Col>
              
              <Col span={8}><Text strong>Status:</Text></Col>
              <Col span={16}>
                <Tag color={getStatusColor(currentJobDetails.status.status)}>
                  {currentJobDetails.status.status}
                </Tag>
              </Col>
              
              <Col span={8}><Text strong>Message:</Text></Col>
              <Col span={16}><Text>{currentJobDetails.status.message}</Text></Col>
              
              <Col span={8}><Text strong>Start Time:</Text></Col>
              <Col span={16}><Text>{new Date(currentJobDetails.status.startTime).toLocaleString()}</Text></Col>
              
              {currentJobDetails.status.endTime && (
                <>
                  <Col span={8}><Text strong>End Time:</Text></Col>
                  <Col span={16}><Text>{new Date(currentJobDetails.status.endTime).toLocaleString()}</Text></Col>
                </>
              )}
            </Row>

            {currentJobDetails.status.errors && currentJobDetails.status.errors.length > 0 && (
              <>
                <Title level={4} style={errorColorStyle}>Errors</Title>
                <List
                  size="small"
                  dataSource={currentJobDetails.status.errors}
                  renderItem={(error) => (
                    <List.Item>
                      <Text type="danger">{error}</Text>
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PdfPhotoProcessing;
