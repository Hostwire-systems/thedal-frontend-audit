import React, { useEffect, useState } from "react";
import { Modal, Table, Tag, Button, Tooltip, Space, Pagination } from "antd";
import { ReloadOutlined, DownloadOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { listAllExportJobs, UnifiedExportJob } from "../../api/familyExportApi";

const UNMAPPED_EXPORT_FAMILY_ID = "00000000-0000-0000-0000-000000000000";

interface Props {
  open: boolean;
  onClose: () => void;
  familyId: string | null;
  electionId: number | null;
  accountId: number | null;
}

const statusTag = (status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED", error?: string | null) => {
  switch (status) {
    case "PENDING":
      return <Tag icon={<ClockCircleOutlined />} color="default">PENDING</Tag>;
    case "RUNNING":
      return <Tag icon={<ReloadOutlined spin />} color="processing">RUNNING</Tag>;
    case "COMPLETED":
      return <Tag icon={<CheckCircleOutlined />} color="success">COMPLETED</Tag>;
    case "FAILED":
      return <Tooltip title={error}><Tag icon={<CloseCircleOutlined />} color="error">FAILED</Tag></Tooltip>;
    default:
      return <Tag>{status}</Tag>;
  }
};

const FamilyExportJobsModal: React.FC<Props> = ({ open, onClose, familyId, electionId, accountId }) => {
  const [jobs, setJobs] = useState<UnifiedExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const load = async (p = page, s = pageSize) => {
    if (!electionId || !accountId) return;
    
    setLoading(true);
    try {
      const res = await listAllExportJobs(electionId, accountId, p - 1, s);
      
      if (res.status === "success" && res.data) {
        setJobs(res.data.content || []);
        setTotal(res.data.totalElements || 0);
      }
    } catch (error) {
      console.error("Failed to load export jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setPage(1);
      load(1, pageSize);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, electionId, accountId]);

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
      render: (r: UnifiedExportJob) => {
        if (r.exportType === "EXCEL") {
          return <Tag color="green">Excel</Tag>;
        }
        return <Tag color="blue">PDF</Tag>;
      }
    },
    { 
      title: "Scope", 
      key: "scope", 
      width: 120, 
      render: (r: UnifiedExportJob) => {
        if (r.familyId === UNMAPPED_EXPORT_FAMILY_ID && r.partNo) {
          return `Unmapped Part ${r.partNo}`;
        }
        if (r.partNo) {
          return `Part ${r.partNo}`;
        }
        return "Single Family";
      }
    },
    { 
      title: "Options", 
      key: "options", 
      width: 100, 
      render: (r: UnifiedExportJob) => {
        const parts: string[] = [];
        if (r.exportType === "PDF" && r.columns) {
          parts.push(`${r.columns} cols`);
        }
        if (r.orderBy) {
          parts.push(r.orderBy === "family" ? "Fam" : "Serial");
        }
        return parts.join(", ") || "-";
      }
    },
    { title: "Created", dataIndex: "createdAt", key: "createdAt", render: (v: string) => v ? new Date(v).toLocaleString() : "-", width: 160 },
    { title: "Status", key: "status", render: (r: UnifiedExportJob) => statusTag(r.status, r.errorMessage), width: 120 },
    { title: "Rows", dataIndex: "rowCount", key: "rowCount", width: 60, render: (v: number | null) => v ?? "-" },
    { title: "Finished", dataIndex: "finishedAt", key: "finishedAt", width: 160, render: (v: string | null) => v ? new Date(v).toLocaleString() : "-" },
    { title: "Download", key: "download", width: 100, render: (r: UnifiedExportJob) => (
      <Button type="link" icon={<DownloadOutlined />} href={r.s3Url || undefined} target="_blank" disabled={r.status !== "COMPLETED" || !r.s3Url}>Download</Button>
    ) }
  ];

  return (
    <Modal open={open} onCancel={onClose} onOk={onClose} width={1000} title="Family Export Jobs" footer={null}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={() => load()} loading={loading}>Refresh</Button>
      </Space>
      <Table size="small" rowKey="id" dataSource={jobs} columns={columns as any} loading={loading} pagination={false} scroll={{ x: 900 }} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <Pagination current={page} pageSize={pageSize} total={total} onChange={(p,s) => { setPage(p); setPageSize(s); load(p,s); }} showSizeChanger showTotal={(t) => `${t} jobs`} />
      </div>
    </Modal>
  );
};

export default FamilyExportJobsModal;
