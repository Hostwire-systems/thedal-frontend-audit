import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Button,
  message,
  Tag,
  Progress,
  Tooltip,
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Popconfirm,
  Input,
} from "antd";
import {
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import {
  listMergeJobs,
  getMergeJobDetail,
  forceFailMergeJob,
} from "../../api/electionMergeApi";
import { computeUpdatesPercent, parseResultStats, sumFieldUpdateCounts } from "../../utlis/mergeJobMetrics";

const { Text, Title } = Typography;
const { TextArea } = Input;

interface MergeJobSummary {
  id: string;
  targetElectionId: number;
  status: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  processedVoters: number | null;
  totalVoters: number | null;
  errorMessage: string | null;
}

interface MergeJobDetail extends MergeJobSummary {
  fields: string[];
  resultStatsJson: string | null;
}

interface MergeStatusModalProps {
  visible: boolean;
  onCancel: () => void;
  targetElectionId: string;
  targetElectionName: string;
}

const MergeStatusModal: React.FC<MergeStatusModalProps> = ({
  visible,
  onCancel,
  targetElectionId,
  targetElectionName,
}) => {
  const [jobs, setJobs] = useState<MergeJobSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<MergeJobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [forceFailReason, setForceFailReason] = useState("");

  // Supported fields with labels for display
  const fieldLabels: Record<string, string> = {
    VOTER_HISTORY: "Voter History",
    MOBILE_NUMBER: "Mobile Number",
    WHATSAPP_NUMBER: "WhatsApp Number",
    LOCATION: "Location",
    DATE_OF_BIRTH: "Date of Birth",
    EMAIL_ID: "Email ID",
    RELIGION: "Religion",
    CASTE_CATEGORY: "Caste Category",
    CASTE: "Caste",
    SUB_CASTE: "Sub Caste",
    PARTY: "Party",
    VOTER_CATEGORY: "Voter Category",
    LANGUAGE: "Language",
    FEEDBACK: "Feedback",
    AADHAAR_NUMBER: "Aadhaar Number",
    PAN_NUMBER: "PAN Number",
    MEMBERSHIP_NUMBER: "Membership Number",
    REMARKS: "Remarks",
    FAMILY_MAPPING: "Family Mapping",
    FRIENDS_MAPPING: "Friends Mapping",
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "orange";
      case "RUNNING":
        return "blue";
      case "COMPLETED":
        return "green";
      case "FAILED":
        return "red";
      case "CANCELED":
        return "gray";
      default:
        return "default";
    }
  };

  const fetchJobs = async (pageNum: number = page) => {
    setLoading(true);
    try {
      const response = await listMergeJobs(targetElectionId, pageNum, pageSize);
      const data = response.data || response;
      setJobs(data.items || []);
      setTotal(data.page?.totalElements || 0);
    } catch (error: any) {
      message.error("Failed to fetch merge jobs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetail = async (jobId: string) => {
    setDetailLoading(true);
    try {
      const response = await getMergeJobDetail(targetElectionId, jobId);
      const data = response.data || response;
      setSelectedJob(data);
      setDetailModalVisible(true);
    } catch (error: any) {
      message.error("Failed to fetch job details: " + error.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleForceFailJob = async (jobId: string) => {
    try {
      await forceFailMergeJob(targetElectionId, jobId, forceFailReason);
      message.success("Job force-failed successfully");
      setForceFailReason("");
      fetchJobs(); // Refresh the list
      if (selectedJob && selectedJob.id === jobId) {
        setDetailModalVisible(false);
        setSelectedJob(null);
      }
    } catch (error: any) {
      message.error("Failed to force fail job: " + error.message);
    }
  };

  // Start polling for running jobs
  const startPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    
    const hasRunningJobs = jobs.some(
      (job) => job.status === "RUNNING" || job.status === "PENDING"
    );
    
    if (hasRunningJobs && visible) {
      const interval = setInterval(() => {
        fetchJobs();
      }, 30000); // Poll every 30 seconds
      setPollingInterval(interval);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchJobs();
    }
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [visible]);

  useEffect(() => {
    // Clear existing interval
    if (pollingInterval) clearInterval(pollingInterval);
    
    // Start polling only if there are running jobs and modal is visible
    if (visible && jobs.length > 0) {
      startPolling();
    }
    
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [jobs, visible]);

  const columns = [
    {
      title: "Job ID",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <Text code className="text-xs">
          {id.substring(0, 8)}...
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Progress",
      key: "progress",
      render: (_: any, record: MergeJobSummary) => {
        if (record.totalVoters && record.processedVoters !== null) {
          const percent = Math.round((record.processedVoters / record.totalVoters) * 100);
          return (
            <div style={{ width: 220 }}>
              <div>
                <Text className="text-xs">Processing</Text>
                <Progress percent={percent} size="small" />
                <Text className="text-xs">
                  {record.processedVoters?.toLocaleString()} / {record.totalVoters?.toLocaleString()}
                </Text>
              </div>
            </div>
          );
        }
        return "-";
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => moment(date).format("MMM DD, HH:mm"),
    },
    {
      title: "Duration",
      key: "duration",
      render: (_: any, record: MergeJobSummary) => {
        if (!record.startedAt) return "-";
        const endTime = record.finishedAt || new Date().toISOString();
        const duration = moment(endTime).diff(moment(record.startedAt));
        return moment.duration(duration).humanize();
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: MergeJobSummary) => (
        <div className="flex gap-1">
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => fetchJobDetail(record.id)}
              loading={detailLoading && selectedJob?.id === record.id}
            />
          </Tooltip>
          {(record.status === "RUNNING" || record.status === "PENDING") && (
            <Popconfirm
              title="Force Fail Job"
              description={
                <div>
                  <p>Are you sure you want to force fail this job?</p>
                  <TextArea
                    placeholder="Reason (optional)"
                    value={forceFailReason}
                    onChange={(e) => setForceFailReason(e.target.value)}
                    rows={2}
                  />
                </div>
              }
              onConfirm={() => handleForceFailJob(record.id)}
              okText="Force Fail"
              okType="danger"
              cancelText="Cancel"
              icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
            >
              <Tooltip title="Force Fail">
                <Button
                  size="small"
                  icon={<StopOutlined />}
                  danger
                  type="text"
                />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  const handleClose = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    setDetailModalVisible(false);
    setSelectedJob(null);
    setForceFailReason("");
    onCancel();
  };

  return (
    <>
      <Modal
        title={`Merge Jobs - ${targetElectionName}`}
        open={visible}
        onCancel={handleClose}
        footer={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => fetchJobs()}>
            Refresh
          </Button>,
          <Button key="close" onClick={handleClose}>
            Close
          </Button>,
        ]}
        width={1000}
        centered
      >
        <Table
          columns={columns}
          dataSource={jobs}
          loading={loading}
          rowKey="id"
          pagination={{
            current: page + 1,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (newPage, newPageSize) => {
              setPage(newPage - 1);
              setPageSize(newPageSize || 20);
              fetchJobs(newPage - 1);
            },
          }}
          size="small"
        />
      </Modal>

      {/* Job Detail Modal */}
      <Modal
        title="Job Details"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedJob(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalVisible(false);
              setSelectedJob(null);
            }}
          >
            Close
          </Button>,
        ]}
        width={800}
        centered
      >
        {selectedJob && (
          <div>
            <Row gutter={[16, 16]} className="mb-4">
              <Col span={12}>
                <Card size="small" title="Job Info">
                  <p>
                    <strong>ID:</strong> <Text code>{selectedJob.id}</Text>
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <Tag color={getStatusColor(selectedJob.status)}>
                      {selectedJob.status}
                    </Tag>
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {moment(selectedJob.createdAt).format("MMM DD, YYYY HH:mm")}
                  </p>
                  {selectedJob.startedAt && (
                    <p>
                      <strong>Started:</strong>{" "}
                      {moment(selectedJob.startedAt).format("MMM DD, YYYY HH:mm")}
                    </p>
                  )}
                  {selectedJob.finishedAt && (
                    <p>
                      <strong>Finished:</strong>{" "}
                      {moment(selectedJob.finishedAt).format("MMM DD, YYYY HH:mm")}
                    </p>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Progress">
                  {selectedJob.totalVoters && selectedJob.processedVoters !== null ? (
                    <>
                      <Progress
                        percent={Math.round(
                          (selectedJob.processedVoters / selectedJob.totalVoters) * 100
                        )}
                      />
                      <p className="mt-2">
                        <strong>Processed:</strong>{" "}
                        {selectedJob.processedVoters?.toLocaleString()} /{" "}
                        {selectedJob.totalVoters?.toLocaleString()} voters
                      </p>
                      {selectedJob.resultStatsJson && (
                        (() => {
                          const stats = parseResultStats(selectedJob.resultStatsJson);
                          const updatesPercent = computeUpdatesPercent(stats);
                          const totalFieldUpdates = sumFieldUpdateCounts(stats);
                          return (
                            <div className="mt-3">
                              <Progress percent={updatesPercent} />
                              <p className="mt-2">
                                <strong>Updates applied:</strong> {stats?.updatedVoters ?? 0} / {stats?.matchedVoters ?? 0}
                                {totalFieldUpdates > 0 && (
                                  <>
                                    , field updates: <strong>{totalFieldUpdates.toLocaleString()}</strong>
                                  </>
                                )}
                              </p>
                            </div>
                          );
                        })()
                      )}
                    </>
                  ) : (
                    <p>No progress data available</p>
                  )}
                  {selectedJob.errorMessage && (
                    <div className="mt-2">
                      <strong>Error:</strong>
                      <Text type="danger" className="ml-2">
                        {selectedJob.errorMessage}
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            <Card size="small" title="Merge Fields" className="mb-4">
              <div className="flex flex-wrap gap-1">
                {selectedJob.fields?.map((field) => (
                  <Tag key={field} color="blue">
                    {fieldLabels[field] || field}
                  </Tag>
                ))}
              </div>
            </Card>

            {selectedJob.resultStatsJson && (
              (() => {
                const stats = parseResultStats(selectedJob.resultStatsJson);
                const updatesPercent = computeUpdatesPercent(stats);
                return (
                  <Card size="small" title="Results">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                      <div>
                        Matched voters: <strong>{stats?.matchedVoters ?? 0}</strong>
                      </div>
                      <div>
                        Updated voters: <strong>{stats?.updatedVoters ?? 0}</strong> ({updatesPercent}%)
                      </div>
                      <div>
                        EPICs not found: <strong>{stats?.missingEpicInTargetCount ?? 0}</strong>
                      </div>
                      {typeof stats?.unmodifiedMatchedVoters === 'number' && (
                        <div>
                          Unmodified matched: <strong>{stats?.unmodifiedMatchedVoters}</strong>
                        </div>
                      )}
                    </div>
                    {stats?.fieldUpdateCounts && (
                      <div className="mt-2">
                        <strong>Field update counts</strong>
                        <ul className="list-disc pl-5">
                          {Object.entries(stats.fieldUpdateCounts).map(([k,v]) => (
                            <li key={k}>{k}: <strong>{v}</strong></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                );
              })()
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default MergeStatusModal;
