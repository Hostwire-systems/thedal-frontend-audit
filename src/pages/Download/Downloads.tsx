import { DownloadOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Table, message, Select } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useLoading } from "../../context/LoadingContext";
import { getExportApi, deleteExportApi, deleteSurveyExportApi } from "../../api/exportApi";
import {
  deleteVoterIdCardExportJob,
  downloadVoterIdCardExportJob,
} from "../../api/voterIdCardExportApi";
import { BASE_URL } from "../../config";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";



interface ExportType {
  jobId: number;
  electionId: number;
  type: string;
  referenceId?: string;
  formId?: number;
  formName?: string;
  status: string;
  timeStarted: string;
  timeCompleted: string;
  downloadUrl: string;
  message: string;
}
dayjs.extend(utc);
dayjs.extend(timezone);


const Downloads = () => {
  const [exports, setExports] = useState<ExportType[]>([]);
  const [currentPage, setCurrentPage] = useState(1); // AntD starts from 1
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0); // assume API returns this
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [activeDownloadJobId, setActiveDownloadJobId] = useState<number | null>(null);

  const { isLoading, setLoading } = useLoading();
  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  useEffect(() => {
    if (selectedElectionId) {
      fetchExports();
    }
  }, [selectedElectionId, typeFilter, statusFilter]);

  const fetchExports = async (
    page: number = currentPage,
    size: number = pageSize
  ) => {
    setLoading(true);
    try {
      const response = await getExportApi(
        parseInt(selectedElectionId),
        page - 1,
        size,
        typeFilter,
        statusFilter
      );
      console.log("Exports", response);
      setExports(response.data.exportJobs||[]);

      setTotalCount(response.data.totalCount || 0);
    } catch (error) {
      message.error("Failed to fetch export data");
    } finally {
      setLoading(false);
    }
  };

  const resolveDownloadUrl = (url?: string) => {
    if (!url) {
      return "";
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const handleDownload = async (record: ExportType) => {
    const fallbackUrl = resolveDownloadUrl(record.downloadUrl);
    const isIdCardDownload = record.type === "ID_CARD";

    setActiveDownloadJobId(record.jobId);

    try {
      if (isIdCardDownload && record.referenceId) {
        await downloadVoterIdCardExportJob(record.referenceId);
        message.success("Download started successfully");
        return;
      }

      if (!fallbackUrl) {
        message.error("Download link is not available for this export");
        return;
      }

      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = fallbackUrl;
      
      // Extract filename from URL or use a default name
      const urlParts = fallbackUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || 'export-file.xlsx';
      
      link.download = filename;
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('Download started successfully');
    } catch (error) {
      console.error('Download failed:', error);
      if (!isIdCardDownload) {
        message.error('Failed to download file');
      }
      if (!isIdCardDownload && fallbackUrl) {
        window.open(fallbackUrl, "_blank");
      }
    } finally {
      setActiveDownloadJobId(null);
    }
  };

  const handleDelete = async (record: ExportType) => {
    setIsButtonLoading(true);
    try {
      if (record.type === "SURVEY") {
        await deleteSurveyExportApi(parseInt(selectedElectionId), [record.jobId]);
      } else if (record.type === "ID_CARD" && record.referenceId) {
        await deleteVoterIdCardExportJob(record.referenceId);
      } else {
        await deleteExportApi(parseInt(selectedElectionId), record.jobId);
      }
      message.success("Export data deleted successfully");
      await fetchExports();
    } catch (error) {
      message.error("Failed to delete export data");
    } finally {
      setIsButtonLoading(false);
    }
  };
  

  const columns = [
    {
      title: "Job ID",
      dataIndex: "jobId",
      key: "jobId",
      sorter: (a: ExportType, b: ExportType) => a.jobId - b.jobId,
    },
    {
      title: "Category",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          "VOTER": "Voter",
          "CADRE": "Cadre",
          "POLL_DAY": "Poll Day",
          "ID_CARD": "Voter ID Card",
          "SIR_REPORT": "SIR Report",
          "VOLUNTEER": "Cadre",
          "SURVEY": "Survey",
        };
        return <span>{typeMap[type] || type}</span>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <span className={`status-${status.toLowerCase()}`}>{status}</span>
      ),
    },
    {
      title: "Time Started",
      dataIndex: "timeStarted",
      key: "timeStarted",
      // render: (date: string) => dayjs(date).format("DD-MMM-YYYY HH:mm:ss"),
      render: (date: string) => dayjs.utc(date).tz("Asia/Kolkata").format("DD-MMM-YYYY hh:mm:ss A"),
    },
    {
      title: "Time Completed",
      dataIndex: "timeCompleted",
      key: "timeCompleted",
      render: (date: string, record: ExportType) =>
        record.status === "IN_PROGRESS"
          ? "In progress"
          // : dayjs(date).format("DD-MMM-YYYY HH:mm:ss"),
          : dayjs.utc(date).tz("Asia/Kolkata").format("DD-MMM-YYYY hh:mm:ss A"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ExportType) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            type="primary"
            shape="circle"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            loading={activeDownloadJobId === record.jobId}
            disabled={record.status !== "COMPLETED"}
          ></Button>
          <Popconfirm
            title="Are you sure you want to delete this jobId?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{
              loading: isButtonLoading,
              disabled: isButtonLoading,
              style: {
                backgroundColor: "#1D4ED8",
                borderColor: "#1D4ED8",
                color: "white",
              },
            }}
          >
            <Button danger shape="circle" icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Downloads</h2>
      </div>

      <div style={{ marginTop: "20px", marginBottom: "20px", display: "flex", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontWeight: 500 }}>Category:</label>
          <Select
            placeholder="All Categories"
            allowClear
            style={{ width: 200 }}
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            }}
            options={[
              { label: "Voter", value: "VOTER" },
              { label: "Cadre", value: "CADRE" },
              { label: "Poll Day", value: "POLL_DAY" },
              { label: "Voter ID Card", value: "ID_CARD" },
              { label: "SIR Report", value: "SIR_REPORT" },
            ]}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontWeight: 500 }}>Status:</label>
          <Select
            placeholder="All Statuses"
            allowClear
            style={{ width: 200 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
            options={[
              { label: "Completed", value: "COMPLETED" },
              { label: "Running", value: "RUNNING" },
              { label: "Failed", value: "FAILED" },
            ]}
          />
        </div>
      </div>

      <Table
        className="my-4 default-list-table"
        dataSource={exports}
        columns={columns}
        rowKey="jobId"
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          position: ["bottomCenter"],
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
            fetchExports(page, size);
          },
        }}
      />
    </div>
  );
};

export default Downloads;
