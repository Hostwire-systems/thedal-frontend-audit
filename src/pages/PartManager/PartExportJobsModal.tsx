import React, { useEffect, useState } from "react";
import { Modal, Table, Tag, Button, Tooltip, Space, Pagination, Typography, message } from "antd";
import { ReloadOutlined, DownloadOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { listAllExportJobs } from "../../api/partApi";
import { downloadPartExport } from "../../api/partApi";

interface Props {
  open: boolean;
  onClose: () => void;
  electionId: number | null;
}

const statusTag = (status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED", error?: string | null) => {
  switch (status) {
    case "PENDING":
      return <Tag icon={<ClockCircleOutlined />} color="default">PENDING</Tag>;
    case "IN_PROGRESS":
      return <Tag icon={<ReloadOutlined spin />} color="processing">IN PROGRESS</Tag>;
    case "COMPLETED":
      return <Tag icon={<CheckCircleOutlined />} color="success">COMPLETED</Tag>;
    case "FAILED":
      return <Tooltip title={error}><Tag icon={<CloseCircleOutlined />} color="error">FAILED</Tag></Tooltip>;
    default:
      return <Tag>{status}</Tag>;
  }
};

const { Text } = Typography;

const PartExportJobsModal: React.FC<Props> = ({ open, onClose, electionId }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const load = async (p = page, s = pageSize) => {
    if (!electionId) return;
    
    setLoading(true);
    try {
      const res = await listAllExportJobs(electionId, p - 1, s);
      
      if ((res.status === "success" || res.status === "SUCCESS") && res.data) {
        setJobs(res.data.content || []);
        setTotal(res.data.totalElements || 0);
      }
    } catch (error) {
      console.error("Failed to load export jobs:", error);
      message.error("Failed to load export jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (jobId: number) => {
    if (!electionId) return;
    
    setDownloading(jobId);
    try {
      const downloadUrl = await downloadPartExport(electionId, jobId);
      if (!downloadUrl) {
        message.error("Download URL not found");
        return;
      }
      window.open(downloadUrl, "_blank");
      message.success("Download started successfully");
    } catch (error) {
      console.error('Download failed:', error);
      message.error('Failed to download export file');
    } finally {
      setDownloading(null);
    }
  };

  useEffect(() => {
    if (open) {
      setPage(1);
      load(1, pageSize);
    }
  }, [open, electionId]);

  useEffect(() => {
    if (!open) return;

    const hasRunningJobs = jobs.some(
      (job) => job.status === "PENDING" || job.status === "IN_PROGRESS"
    );

    if (!hasRunningJobs) return;

    const interval = setInterval(() => {
      load(page, pageSize);
    }, 3000);

    return () => clearInterval(interval);
  }, [open, jobs, page, pageSize]);

  const columns = [
    { 
      title: "Job ID", 
      dataIndex: "id", 
      key: "id", 
      width: 100, 
      render: (v: string | number) => {
        const idStr = String(v);
        return idStr.length > 8 ? idStr.substring(0, 8) + "..." : idStr;
      }
    },
    { 
      title: "Format", 
      key: "format", 
      width: 80, 
      render: (r:any) => {
        if (r.format === "EXCEL") {
          return <Tag color="green">Excel</Tag>;
        } else if (r.format === "PDF") {
          return <Tag color="red">PDF</Tag>;
        }
        return <Tag color="blue">{r.format}</Tag>;
      }
    },
    { 
      title: "Created", 
      dataIndex: "timeStarted", 
      key: "timeStarted", 
      render: (v: string) => v ? new Date(v).toLocaleString() : "-", 
      width: 160 
    },
    { 
      title: "Status", 
      key: "status",
      render: (r: any) => statusTag(r.status, r.message), 
      width: 120 
    },
    { 
      title: "Finished", 
      dataIndex: "timeCompleted", 
      key: "timeCompleted", 
      width: 160, 
      render: (v: string | null) => v ? new Date(v).toLocaleString() : "-" 
    },
    { 
      title: "Download", 
      key: "download", 
      width: 120, 
      render: (r: any) => (
        <Button 
          type="link" 
          icon={<DownloadOutlined />} 
          onClick={() => handleDownload(r.id)}
          loading={downloading === r.id}
          disabled={r.status !== "COMPLETED"}
        >
          {downloading === r.id ? "Downloading..." : "Download"}
        </Button>
      ) 
    }
  ];

  return (
    <Modal 
      open={open} 
      onCancel={onClose} 
      width={1000} 
      title="Part Export Jobs" 
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
    >
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={() => load()} loading={loading}>
          Refresh
        </Button>
      </Space>
      <Table 
        size="small" 
        rowKey="id" 
        dataSource={jobs} 
        columns={columns as any} 
        loading={loading} 
        pagination={false} 
        scroll={{ x: 900 }} 
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <Pagination 
          current={page} 
          pageSize={pageSize} 
          total={total} 
          onChange={(p, s) => { 
            setPage(p); 
            setPageSize(s); 
            load(p, s); 
          }} 
          showSizeChanger 
          showTotal={(t) => `${t} jobs`} 
        />
      </div>
    </Modal>
  );
};

export default PartExportJobsModal;