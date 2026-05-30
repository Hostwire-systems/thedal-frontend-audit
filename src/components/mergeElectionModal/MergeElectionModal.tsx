import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  Checkbox,
  Button,
  Row,
  Col,
  Progress,
  Alert,
  Spin,
  message,
  Divider,
  Tooltip,
  notification,
  Collapse,
} from "antd";
import {
  CheckSquareOutlined,
  BorderOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  dryRunMergeElection,
  checkStatusMergeElection,
  finalMergeElection,
  listActiveMergeJobs,
  cancelMergeJob,
} from "../../api/electionMergeApi";

interface MergeElectionModalProps {
  visible: boolean;
  onCancel: () => void;
  sourceElectionId: string;
  sourceElectionName: string;
  elections: any[];
}

interface ApiResponse<T> {
  status: string;
  code: number;
  message: string;
  data: T;
}

interface DryRunResult {
  dryRun: boolean;
  sourceElectionId: number;
  targetElectionId: number;
  selectedFields: string[];
  votersMatched: number;
  votersAffected: number;
  missingEpicInTargetCount: number;
  missingEpicSample: string[];
  fieldStats: Record<string, { willUpdate: number }>;
  fieldAvailability: Record<
    string,
    {
      status: string;
      missingNames?: string[];
      reason?: string;
    }
  >;
  warnings: string[];
  canProceed: boolean;
  estimatedRuntimeSeconds: number;
  generatedAt: string;
}

interface JobStatus {
  id: string;
  status: string;
  totalVoters: number | null;
  processedVoters: number;
  resultStatsJson: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

const { Panel } = Collapse;

const MergeElectionModal: React.FC<MergeElectionModalProps> = ({
  visible,
  onCancel,
  sourceElectionId,
  sourceElectionName,
  elections,
}) => {
  const [form] = Form.useForm();
  const [step, setStep] = useState<
    "selection" | "dry-run" | "confirmation" | "progress" | "results"
  >("selection");
  const [targetElectionId, setTargetElectionId] = useState<number | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [allFieldsSelected, setAllFieldsSelected] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [dryRunPollingInterval, setDryRunPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [activeJobs, setActiveJobs] = useState<JobStatus[]>([]);
  const [loadingActiveJobs, setLoadingActiveJobs] = useState(false);

  // Supported fields with labels - organized by category matching voter add form
  const mergeFields = [
    // Election Commission Data
    // { value: "EPIC_NUMBER", label: "EPIC Number", category: "Election Commission Data" },
    // { value: "BOOTH_NUMBER", label: "Booth Number", category: "Election Commission Data" },
    // { value: "PART_NUMBER", label: "Part Number", category: "Election Commission Data" },
    // { value: "SECTION_NUMBER", label: "Section Number", category: "Election Commission Data" },
    // { value: "SERIAL_NUMBER", label: "Serial Number", category: "Election Commission Data" },
    // { value: "PAGE_NUMBER", label: "Page Number", category: "Election Commission Data" },
    // { value: "HOUSE_NO_EN", label: "House No (English)", category: "Election Commission Data" },
    // { value: "HOUSE_NO_L1", label: "House No (L1)", category: "Election Commission Data" },
    // { value: "HOUSE_NO_L2", label: "House No (L2)", category: "Election Commission Data" },
    // { value: "VOTER_FNAME_EN", label: "Voter First Name (English)", category: "Election Commission Data" },
    // { value: "VOTER_LNAME_EN", label: "Voter Last Name (English)", category: "Election Commission Data" },
    // { value: "VOTER_FNAME_L1", label: "Voter First Name (L1)", category: "Election Commission Data" },
    // { value: "VOTER_LNAME_L1", label: "Voter Last Name (L1)", category: "Election Commission Data" },
    // { value: "VOTER_FNAME_L2", label: "Voter First Name (L2)", category: "Election Commission Data" },
    // { value: "VOTER_LNAME_L2", label: "Voter Last Name (L2)", category: "Election Commission Data" },
    // { value: "RLN_TYPE", label: "Relation Type", category: "Election Commission Data" },
    // { value: "RLN_FNAME_EN", label: "Relation First Name (English)", category: "Election Commission Data" },
    // { value: "RLN_LNAME_EN", label: "Relation Last Name (English)", category: "Election Commission Data" },
    // { value: "RLN_FNAME_L1", label: "Relation First Name (L1)", category: "Election Commission Data" },
    // { value: "RLN_LNAME_L1", label: "Relation Last Name (L1)", category: "Election Commission Data" },
    // { value: "RLN_FNAME_L2", label: "Relation First Name (L2)", category: "Election Commission Data" },
    // { value: "RLN_LNAME_L2", label: "Relation Last Name (L2)", category: "Election Commission Data" },
    // { value: "SECTION_NAME_EN", label: "Section Name (English)", category: "Election Commission Data" },
    // { value: "SECTION_NAME_L1", label: "Section Name (L1)", category: "Election Commission Data" },
    // { value: "SECTION_NAME_L2", label: "Section Name (L2)", category: "Election Commission Data" },
    // { value: "PART_NAME_EN", label: "Part Name (English)", category: "Election Commission Data" },
    // { value: "PART_NAME_L1", label: "Part Name (L1)", category: "Election Commission Data" },
    // { value: "PART_NAME_L2", label: "Part Name (L2)", category: "Election Commission Data" },
    { value: "PHOTO_URL", label: "Photo URL", category: "Election Commission Data" },
    { value: "VIDEO_URL", label: "Video URL", category: "Election Commission Data" },
    
    // Voter Personal Information
    { value: "MOBILE_NUMBER", label: "Mobile Number", category: "Voter Personal Information" },
    { value: "WHATSAPP_NUMBER", label: "WhatsApp Number", category: "Voter Personal Information" },
    { value: "EMAIL_ID", label: "Email ID", category: "Voter Personal Information" },
    { value: "AADHAAR_NUMBER", label: "Aadhaar Number", category: "Voter Personal Information" },
    { value: "PAN_NUMBER", label: "PAN Number", category: "Voter Personal Information" },
    { value: "MEMBERSHIP_NUMBER", label: "Membership Number", category: "Voter Personal Information" },
    { value: "DATE_OF_BIRTH", label: "Date of Birth", category: "Voter Personal Information" },
    { value: "AGE", label: "Age", category: "Voter Personal Information" },
    { value: "GENDER", label: "Gender", category: "Voter Personal Information" },
    { value: "STAR_NUMBER", label: "Star Number", category: "Voter Personal Information" },
    { value: "VOTER_LATITUDE", label: "Voter Latitude", category: "Voter Personal Information" },
    { value: "VOTER_LONGITUDE", label: "Voter Longitude", category: "Voter Personal Information" },
    { value: "PART_LATITUDE", label: "Part Latitude", category: "Voter Personal Information" },
    { value: "PART_LONGITUDE", label: "Part Longitude", category: "Voter Personal Information" },
    { value: "FULL_ADDRESS", label: "Full Address", category: "Voter Personal Information" },
    { value: "PINCODE", label: "Pincode", category: "Voter Personal Information" },
    { value: "RELIGION", label: "Religion", category: "Voter Personal Information" },
    { value: "CASTE_CATEGORY", label: "Caste Category", category: "Voter Personal Information" },
    { value: "CASTE", label: "Caste", category: "Voter Personal Information" },
    { value: "SUB_CASTE", label: "Sub Caste", category: "Voter Personal Information" },
    { value: "PARTY", label: "Party", category: "Voter Personal Information" },
    { value: "PARTY_AFFILIATION", label: "Party Affiliation", category: "Voter Personal Information" },
    { value: "VOTER_CATEGORY", label: "Voter Category/Availability", category: "Voter Personal Information" },
    { value: "LANGUAGE", label: "Languages", category: "Voter Personal Information" },
    { value: "BENEFIT_SCHEMES", label: "Benefit Schemes", category: "Voter Personal Information" },
    { value: "FEEDBACK", label: "Feedback", category: "Voter Personal Information" },
    { value: "VOTER_HISTORY", label: "Voter History", category: "Voter Personal Information" },
    { value: "FAMILY_MAPPING", label: "Family Mapping", category: "Voter Personal Information" },
    { value: "FRIENDS_MAPPING", label: "Friends Mapping", category: "Voter Personal Information" },
    { value: "REMARKS", label: "Remarks", category: "Voter Personal Information" },

    // Cadres
    { value: "CADRE_LIST", label: "CADRE LIST", category: "Cadres" },
    { value: "PART_LIST", label: "PART LIST", category: "Parts" },
  ];

  // Unsupported fields (disabled)
  const unsupportedFields: { value: string; label: string; reason: string }[] = [];

  // Filter out source election from target options
  const targetElectionOptions = elections
    .filter((election) => String(election.id) !== String(sourceElectionId))
    .map((election) => ({
      value: election.id,
      label: election.electionName,
    }));

  // Handle select all/none
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFieldValues = mergeFields.map((field) => field.value);
      setSelectedFields(allFieldValues);
      setAllFieldsSelected(true);
    } else {
      setSelectedFields([]);
      setAllFieldsSelected(false);
    }
  };

  // Handle individual field selection
  const handleFieldSelection = (field: string, checked: boolean) => {
    if (checked) {
      setSelectedFields((prev) => [...prev, field]);
    } else {
      setSelectedFields((prev) => prev.filter((f) => f !== field));
      setAllFieldsSelected(false);
    }
  };

  // Perform dry run
  const performDryRun = async () => {
    const values = form.getFieldsValue();
    if (!values.targetElectionId || selectedFields.length === 0) {
      message.error(
        "Please select a target election and at least one field to merge"
      );
      return;
    }

    setStep("dry-run");
    setLoading(true);
    setDryRunResult(null);
    setTargetElectionId(values.targetElectionId);

    try {
      const response = await dryRunMergeElection(
        values.targetElectionId,
        sourceElectionId,
        selectedFields
      );
      console.log("Result from dry run merge Election", response);

      // Extract jobId from response
      const jobIdValue = response.jobId || response.data?.jobId;
      if (!jobIdValue) {
        throw new Error("Dry-run jobId missing in response");
      }
      setJobId(jobIdValue);
      startPollingDryRun(jobIdValue, values.targetElectionId);
      notification.success({
        message: "Dry-run started",
        description: "Preparing dry-run summary...",
      });
    } catch (error: any) {
      message.error("Failed to perform dry run: " + error.message);
      setStep("selection");
      setLoading(false);
    }
  };

  // Poll dry-run job status
  const startPollingDryRun = (jobId: string, targetId: number) => {
    if (dryRunPollingInterval) clearInterval(dryRunPollingInterval);

    const poll = async () => {
      try {
        const status = await checkStatusMergeElection(String(targetId), jobId);
        const statusData = status.data || status;
        setJobStatus(statusData);

        // Parse dry-run result from resultStatsJson
        if (statusData.resultStatsJson) {
          try {
            const parsed = typeof statusData.resultStatsJson === "string" 
              ? JSON.parse(statusData.resultStatsJson) 
              : statusData.resultStatsJson;
            const dryRunData = parsed ||parsed.dryRun || parsed.data ;
            console.log("Dry-run data:", dryRunData);
            setDryRunResult(dryRunData);
          } catch (e) {
            console.error("Failed to parse dry-run result", e);
          }
        }

        if (
          statusData.status === "COMPLETED" ||
          statusData.status === "FAILED" ||
          statusData.status === "CANCELED"
        ) {
          if (dryRunPollingInterval) clearInterval(dryRunPollingInterval);
          setDryRunPollingInterval(null);
          setLoading(false);
          
          if (statusData.status === "COMPLETED" && !statusData.resultStatsJson) {
            message.error("Dry-run completed but results are missing. Please try again.");
            setStep("selection");
          } else if (statusData.status !== "COMPLETED") {
            message.error(
              statusData.errorMessage || "Dry-run failed, please try again"
            );
            setStep("selection");
          }
        }
      } catch (err) {
        console.error("Error polling dry-run status", err);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    setDryRunPollingInterval(interval);
  };

  // Start the actual merge
  const startMerge = async () => {
    // const values = form.getFieldsValue();
    setLoading(true);

    try {
      // This would call finalMergeElection API
      const result = await finalMergeElection(
        String(targetElectionId),
        sourceElectionId,
        selectedFields
      );

      // Extract the data from the API response if it's wrapped
      const jobData = result.data || result;
      setJobId(jobData.jobId);
      setStep("progress");

      // Start polling for job status
      startPollingJobStatus(jobData.jobId);
    } catch (error: any) {
      message.error("Failed to start merge: " + error.message);
      setLoading(false);
    }
  };

  // Poll job status
  const startPollingJobStatus = (jobId: string) => {
    // const values = form.getFieldsValue();
    const poll = async () => {
      try {
        const status = await checkStatusMergeElection(
          String(targetElectionId),
          jobId
        );
        // Extract the data from the API response if it's wrapped
        const statusData = status.data || status;
        setJobStatus(statusData);

        if (
          statusData.status === "COMPLETED" ||
          statusData.status === "FAILED" ||
          statusData.status === "CANCELED"
        ) {
          if (pollingInterval) clearInterval(pollingInterval);
          setStep("results");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error polling job status:", error);
      }
      finally{
        setTargetElectionId(null);
      }
    };

    // Poll immediately and then every 5 seconds
    poll();
    const interval = setInterval(poll, 5000);
    setPollingInterval(interval);
  };

  // Close modal and reset state
  const handleClose = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    if (dryRunPollingInterval) clearInterval(dryRunPollingInterval);
    setStep("selection");
    setSelectedFields([]);
    setAllFieldsSelected(false);
    setDryRunResult(null);
    setJobId(null);
    setJobStatus(null);
    setTargetElectionId(null);
    setActiveJobs([]);
    form.resetFields();
    onCancel();
  };

  // Load active jobs when modal opens or targetElection changes
  const loadActiveJobs = async (electionId: number) => {
    try {
      setLoadingActiveJobs(true);
      const response = await listActiveMergeJobs(String(electionId));
      const jobs = response.data || [];
      setActiveJobs(jobs);
    } catch (error: any) {
      console.error("Failed to load active jobs:", error);
    } finally {
      setLoadingActiveJobs(false);
    }
  };

  // Cancel a stuck job
  const handleCancelJob = async (jobId: string, electionId: number) => {
    try {
      await cancelMergeJob(String(electionId), jobId);
      message.success("Job cancelled successfully");
      // Reload active jobs
      loadActiveJobs(electionId);
    } catch (error: any) {
      message.error("Failed to cancel job: " + error.message);
    }
  };

  // Load active jobs when targetElection is selected
  useEffect(() => {
    if (targetElectionId) {
      loadActiveJobs(targetElectionId);
    }
  }, [targetElectionId]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      if (dryRunPollingInterval) clearInterval(dryRunPollingInterval);
    };
  }, [pollingInterval, dryRunPollingInterval]);

  // Calculate progress percentage
  const progressPercent =
    jobStatus && jobStatus.totalVoters
      ? Math.round((jobStatus.processedVoters / jobStatus.totalVoters) * 100)
      : 0;

  // Parse result stats if available
  const resultStats = jobStatus?.resultStatsJson
    ? JSON.parse(jobStatus.resultStatsJson)
    : null;

  return (
    <Modal
      title={`Merge Data from ${sourceElectionName}`}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={900}
      centered
    >
      {step === "selection" && (
        <Form
          form={form}
          onValuesChange={(changedValues, allValues) => {
            console.log("changed values", changedValues);
          }}
          layout="vertical"
        >
          <Form.Item
            name="targetElectionId"
            label="Select Target Election"
            rules={[
              { required: true, message: "Please select a target election" },
            ]}
          >
            <Select
              placeholder="Choose election to merge data into"
              options={targetElectionOptions}
              onChange={(value) => {
                setTargetElectionId(value);
                loadActiveJobs(value);
              }}
            />
          </Form.Item>

          {/* Display active jobs warning */}
          {loadingActiveJobs && (
            <Alert
              message="Checking for active merge jobs..."
              type="info"
              icon={<Spin size="small" />}
              showIcon
              className="mb-4"
            />
          )}
          {!loadingActiveJobs && activeJobs.length > 0 && (
            <Alert
              message="Active Merge Jobs Detected"
              description={
                <div>
                  <p className="mb-2">The following merge jobs are currently active for this election:</p>
                  {activeJobs.map((job) => (
                    <div key={job.id} className="flex justify-between items-center py-2 px-3 bg-yellow-50 rounded mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <WarningOutlined className="text-orange-500" />
                          <span className="font-medium">Job ID: {job.id.substring(0, 8)}...</span>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            job.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Started: {new Date(job.startedAt || job.createdAt).toLocaleString()}
                        </div>
                        {job.totalVoters && (
                          <div className="text-xs text-gray-600">
                            Progress: {job.processedVoters} / {job.totalVoters} voters
                          </div>
                        )}
                      </div>
                      <Button
                        type="link"
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleCancelJob(job.id, targetElectionId!)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-2">
                    You can cancel these jobs if they appear stuck, or wait for them to complete.
                  </p>
                </div>
              }
              type="warning"
              showIcon
              className="mb-4"
            />
          )}

          <Divider />

          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Select Fields to Merge ({selectedFields.length} selected)</h4>
              <Button
                type="link"
                icon={
                  allFieldsSelected ? (
                    <CheckSquareOutlined />
                  ) : (
                    <BorderOutlined />
                  )
                }
                onClick={() => handleSelectAll(!allFieldsSelected)}
              >
                {allFieldsSelected ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Collapse defaultActiveKey={['Election Commission Data', 'Voter Personal Information', 'Cadres',"Parts"]} ghost>
                {/* Group fields by category */}
                {Array.from(new Set(mergeFields.map(f => f.category))).map(category => (
                  <Panel header={`${category} (${mergeFields.filter(f => f.category === category).length} fields)`} key={category}>
                    <Row gutter={[8, 8]}>
                      {mergeFields
                        .filter(field => field.category === category)
                        .map((field) => (
                          <Col span={12} key={field.value}>
                            <Checkbox
                              checked={selectedFields.includes(field.value)}
                              onChange={(e) =>
                                handleFieldSelection(field.value, e.target.checked)
                              }
                            >
                              {field.label}
                            </Checkbox>
                          </Col>
                        ))}
                    </Row>
                  </Panel>
                ))}
                
                {unsupportedFields.length > 0 && (
                  <Panel header={`Unsupported Fields (${unsupportedFields.length})`} key="unsupported">
                    <Row gutter={[8, 8]}>
                      {unsupportedFields.map((field) => (
                        <Col span={12} key={field.value}>
                          <Tooltip title={field.reason}>
                            <Checkbox disabled>
                              {field.label}{" "}
                              <InfoCircleOutlined className="text-gray-400 ml-1" />
                            </Checkbox>
                          </Tooltip>
                        </Col>
                      ))}
                    </Row>
                  </Panel>
                )}
              </Collapse>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleClose} className="mr-2">
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={performDryRun}
              loading={loading}
              disabled={selectedFields.length === 0}
            >
              Dry Run
            </Button>
          </div>
        </Form>
      )}

      {step === "dry-run" && (
        <div>
          {!dryRunResult ? (
            <div className="text-center py-8">
              <Spin size="large" />
              <p className="mt-3 text-gray-600">
                {jobStatus?.status === "PENDING" && "Queueing dry-run analysis..."}
                {(jobStatus?.status === "IN_PROGRESS" || jobStatus?.status === "RUNNING") && "Running dry-run analysis..."}
                {!jobStatus?.status && "Preparing dry-run summary..."}
              </p>
              {jobId && (
                <p className="mt-1 text-xs text-gray-500">Job ID: {jobId}</p>
              )}
              {jobStatus?.status && (
                <p className="mt-1 text-xs text-gray-500">
                  Status: {jobStatus.status}
                </p>
              )}
              {/* Show progress during dry-run */}
              {jobStatus?.totalVoters && jobStatus.totalVoters > 0 && (
                <div className="mt-4 max-w-md mx-auto">
                  <Progress
                    percent={Math.round((jobStatus.processedVoters / jobStatus.totalVoters) * 100)}
                    status="active"
                  />
                  <p className="text-center mt-2 text-sm text-gray-600">
                    Processed {jobStatus.processedVoters.toLocaleString()} of{" "}
                    {jobStatus.totalVoters.toLocaleString()} voters
                  </p>
                </div>
              )}
              <div className="mt-4 flex justify-center">
                <Button onClick={handleClose}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <Alert
                message="Dry Run Results"
                description="This is a simulation of what will happen when you merge the data."
                type="info"
                showIcon
                className="mb-4"
              />

          {/* Basic Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3 text-lg">📊 Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-blue-600">
                  {(dryRunResult.votersMatched || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  Voters Matched by EPIC
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-green-600">
                  {(dryRunResult.votersAffected || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Voters Affected</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-red-600">
                  {(
                    dryRunResult.missingEpicInTargetCount || 0
                  ).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  EPICs Not Found in Target
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              Generated at:{" "}
              {dryRunResult.generatedAt
                ? new Date(dryRunResult.generatedAt).toLocaleString()
                : "N/A"}
            </div>
          </div>

          {/* Field Update Statistics */}
          {dryRunResult.fieldStats &&
            Object.keys(dryRunResult.fieldStats).length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-lg">
                  📝 Field Update Counts
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(dryRunResult.fieldStats).map(
                    ([field, stats]) => {
                      const fieldLabel =
                        mergeFields.find((f) => f.value === field)?.label ||
                        field;
                      return (
                        <div
                          key={field}
                          className="flex justify-between items-center p-2 bg-white rounded border"
                        >
                          <span className="font-medium">{fieldLabel}</span>
                          <span className="text-blue-600 font-bold">
                            {(stats.willUpdate || 0).toLocaleString()} updates
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

          {/* Field Availability Issues */}
          {dryRunResult.fieldAvailability &&
            Object.keys(dryRunResult.fieldAvailability).length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-lg">
                  ⚠️ Field Availability Issues
                </h4>
                {Object.entries(dryRunResult.fieldAvailability).map(
                  ([field, availability]) => {
                    const fieldLabel =
                      mergeFields.find((f) => f.value === field)?.label ||
                      field;
                    return (
                      <div
                        key={field}
                        className="mb-3 p-3 bg-white rounded border"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{fieldLabel}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              availability.status === "PARTIAL"
                                ? "bg-yellow-100 text-yellow-800"
                                : availability.status === "MISSING"
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {availability.status}
                          </span>
                        </div>
                        {availability.missingNames &&
                          availability.missingNames.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-600 mb-1">
                                Missing values:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {availability.missingNames
                                  .slice(0, 5)
                                  .map((name, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-gray-100 rounded text-xs"
                                    >
                                      {name || "null"}
                                    </span>
                                  ))}
                                {availability.missingNames.length > 5 && (
                                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                    +{availability.missingNames.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  }
                )}
              </div>
            )}

          {/* Missing EPIC Samples */}
          {dryRunResult.missingEpicSample &&
            dryRunResult.missingEpicSample.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-lg">
                  🚫 Sample Missing EPICs
                </h4>
                <div className="flex flex-wrap gap-2">
                  {dryRunResult.missingEpicSample.map((epic, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded font-mono text-sm"
                    >
                      {epic}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Warnings */}
          {dryRunResult.warnings && dryRunResult.warnings.length > 0 && (
            <Alert
              message="Warnings"
              description={
                <ul className="list-disc pl-4">
                  {dryRunResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              }
              type="warning"
              showIcon
              className="mb-4"
            />
          )}

          {/* Proceed Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Can Proceed:</span>
              <span
                className={`px-3 py-1 rounded font-bold ${
                  dryRunResult.canProceed
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {dryRunResult.canProceed ? "YES" : "NO"}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Estimated Runtime:{" "}
              {(dryRunResult.estimatedRuntimeSeconds || 0).toLocaleString()}{" "}
              seconds
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setStep("selection")} className="mr-2">
              Back
            </Button>
            <Button
              type="primary"
              onClick={() => setStep("confirmation")}
              disabled={!dryRunResult.canProceed}
            >
              Continue to Merge
            </Button>
          </div>
            </>
          )}
        </div>
      )}

      {step === "confirmation" && (
        <div>
          <Alert
            message="Confirm Merge Operation"
            description="Are you sure you want to proceed with merging the data? This action cannot be undone."
            type="warning"
            showIcon
            className="mb-4"
          />

          <div className="mb-4">
            <p>
              You are about to merge <strong>{selectedFields.length}</strong>{" "}
              fields from <strong>{sourceElectionName}</strong> to the selected
              target election.
            </p>
            <p>
              This will affect approximately{" "}
              <strong>{dryRunResult?.votersAffected || 0}</strong> voters.
            </p>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setStep("dry-run")} className="mr-2">
              Back
            </Button>
            <Button
              type="primary"
              danger
              onClick={startMerge}
              loading={loading}
            >
              Confirm Merge
            </Button>
          </div>
        </div>
      )}

      {step === "progress" && (
        <div>
          <h4 className="font-medium mb-4">Merging Data</h4>

          <div className="mb-4">
            <Progress percent={progressPercent} status="active" />
            <p className="text-center mt-2">
              Processed {jobStatus?.processedVoters || 0} of{" "}
              {jobStatus?.totalVoters || "unknown"} voters
            </p>
          </div>

          <div className="text-center">
            <Spin size="large" />
            <p className="mt-2">Please wait while data is being merged...</p>
          </div>
        </div>
      )}

      {step === "results" && jobStatus && (
        <div>
          {jobStatus.status === "COMPLETED" && resultStats ? (
            <>
              <Alert
                message="Merge Completed Successfully"
                description="The data has been successfully merged."
                type="success"
                showIcon
                className="mb-4"
              />

              <div className="mb-4">
                <h4 className="font-medium mb-2">Results Summary</h4>
                <p>
                  Total voters processed:{" "}
                  <strong>{resultStats.totalSourceVoters}</strong>
                </p>
                <p>
                  Voters matched by EPIC:{" "}
                  <strong>{resultStats.matchedVoters}</strong>
                </p>
                <p>
                  Voters updated: <strong>{resultStats.updatedVoters}</strong>
                </p>
                <p>
                  EPICs not found in target:{" "}
                  <strong>{resultStats.missingEpicInTargetCount}</strong>
                </p>

                {resultStats.fieldUpdateCounts &&
                  Object.keys(resultStats.fieldUpdateCounts).length > 0 && (
                    <>
                      <h5 className="font-medium mt-3 mb-1">Fields Updated</h5>
                      {Object.entries(
                        resultStats.fieldUpdateCounts as [string, number][]
                      ).map(([field, count]) => {
                        const fieldLabel =
                          mergeFields.find((f) => f.value === field)?.label ||
                          field;
                        return (
                          <p key={field}>
                            {fieldLabel}: <strong>{count}</strong> updates
                          </p>
                        );
                      })}
                    </>
                  )}
              </div>
            </>
          ) : (
            <Alert
              message="Merge Failed"
              description={
                jobStatus.errorMessage ||
                "An unknown error occurred during the merge process."
              }
              type="error"
              showIcon
            />
          )}

          <div className="flex justify-end mt-6">
            <Button type="primary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MergeElectionModal;
