import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Table,
  Card,
  Dropdown,
  Menu,
  Button,
  Input,
  DatePicker,
  Select,
  Tag,
  message,
  Row,
  Col,
  Modal,
  Descriptions,
} from "antd";
import {
  SearchOutlined,
  MoreOutlined,
  DeleteOutlined,
  EditOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { listCampaigns, getCampaign, deleteCampaign, sendCampaign, type CampaignResponse } from "../../api/campaignApi";
import CampaignSettingsPanel from "./CampaignSettingsPanel";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface Communication {
  key: string;
  title: string;
  channel: string;
  recipients: string;
  date: string;
  status: string;
  campaign: string;
  createdAtISO?: string;
}

const CommunicationManager: React.FC = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [filteredCommunications, setFilteredCommunications] = useState<
    Communication[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("All Status");
  const [selectedChannel, setSelectedChannel] =
    useState<string>("All Channels");
  const [dateRange, setDateRange] = useState<string>("Last 30 days");
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const selectedElectionId = useSelector((state: any) => state.election?.selectedElectionId);
  const accountId = Number(localStorage.getItem("accountId")) || Number(localStorage.getItem("userId")) || undefined;

   const navigate = useNavigate();

   const handleCreateMessage = () => {
     navigate("/create-message");
   };

  // Load campaigns from backend
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const channel = selectedChannel !== "All Channels" ? selectedChannel.toLowerCase() : undefined;
        const status = selectedStatus !== "All Status" ? selectedStatus.toUpperCase() : undefined;
        const data = await listCampaigns({ channel, status, q: searchQuery || undefined });
        const mapped: Communication[] = (data || []).map((c) => ({
          key: c.id,
          title: c.title,
          channel: c.channel?.toLowerCase() === "whatsapp" ? "WhatsApp" : c.channel,
          recipients: c.recipientsCount != null ? String(c.recipientsCount) : "-",
          date: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
          status: c.status ? (c.status === "SENT" ? "Sent" : c.status === "SCHEDULED" ? "Scheduled" : c.status === "FAILED" ? "Failed" : c.status) : "",
          campaign: c.senderId || "",
          createdAtISO: c.createdAt || "",
        }));
        setCommunications(mapped);
      } catch (e: any) {
        // keep silent; optionally message.error
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedChannel, searchQuery]);

  // Filter communications based on selections
  useEffect(() => {
    let result = [...communications];

    // Filter by status
    if (selectedStatus !== "All Status") {
      result = result.filter((item) => item.status === selectedStatus);
    }

    // Filter by channel
    if (selectedChannel !== "All Channels") {
      result = result.filter((item) => item.channel === selectedChannel);
    }

    // Filter by date range
    if (dateRange === "Last 7 days") {
      const sevenDaysAgo = dayjs().subtract(7, "day");
      result = result.filter((item) => dayjs(item.createdAtISO).isAfter(sevenDaysAgo));
    } else if (dateRange === "Last 30 days") {
      const thirtyDaysAgo = dayjs().subtract(30, "day");
      result = result.filter((item) => dayjs(item.createdAtISO).isAfter(thirtyDaysAgo));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.campaign.toLowerCase().includes(query)
      );
    }

    setFilteredCommunications(result);
  }, [selectedStatus, selectedChannel, dateRange, searchQuery, communications]);

  const handleDelete = async (key: string) => {
    Modal.confirm({
      title: "Delete this campaign?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteCampaign(key);
          setCommunications((prev) => prev.filter((item) => item.key !== key));
          message.success("Deleted");
        } catch (e: any) {
          message.error(e?.message || "Failed to delete");
        }
      },
    });
  };

  const handleView = async (key: string) => {
    try {
      const c: CampaignResponse = await getCampaign(key);
      Modal.info({
        title: "Campaign Details",
        width: 720,
        content: (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Title">{c.title}</Descriptions.Item>
            <Descriptions.Item label="Channel">{c.channel}</Descriptions.Item>
            <Descriptions.Item label="Status">{c.status}</Descriptions.Item>
            <Descriptions.Item label="Created At">{c.createdAt || "-"}</Descriptions.Item>
            <Descriptions.Item label="Scheduled At">{c.scheduledAt || "-"}</Descriptions.Item>
            <Descriptions.Item label="Recipients">{c.recipientsCount ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Sender">{c.senderId}</Descriptions.Item>
            <Descriptions.Item label="Language">{c.language}</Descriptions.Item>
            <Descriptions.Item label="Tags">{(c.tags || []).join(", ")}</Descriptions.Item>
            <Descriptions.Item label="Content">
              <div dangerouslySetInnerHTML={{ __html: c.contentHtml }} />
            </Descriptions.Item>
          </Descriptions>
        ),
        okText: "Close",
      });
    } catch (e: any) {
      message.error(e?.message || "Failed to load campaign");
    }
  };

  const handleSend = async (key: string) => {
    Modal.confirm({
      title: "Send this campaign now?",
      content: "This will start delivery to the estimated recipients.",
      okText: "Send",
      okButtonProps: { type: "primary" },
      onOk: async () => {
        try {
          await sendCampaign(key);
          message.success("Campaign sent");
          // refresh list
          const data = await listCampaigns({ channel: selectedChannel !== "All Channels" ? selectedChannel.toLowerCase() : undefined, status: selectedStatus !== "All Status" ? selectedStatus.toUpperCase() : undefined, q: searchQuery || undefined });
          const mapped: Communication[] = (data || []).map((c) => ({
            key: c.id,
            title: c.title,
            channel: c.channel?.toLowerCase() === "whatsapp" ? "WhatsApp" : c.channel,
            recipients: c.recipientsCount != null ? String(c.recipientsCount) : "-",
            date: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
            status: c.status ? (c.status === "SENT" ? "Sent" : c.status === "SCHEDULED" ? "Scheduled" : c.status === "FAILED" ? "Failed" : c.status) : "",
            campaign: c.senderId || "",
            createdAtISO: c.createdAt || "",
          }));
          setCommunications(mapped);
        } catch (e: any) {
          message.error(e?.message || "Failed to send campaign");
        }
      },
    });
  };

  const columns: ColumnsType<Communication> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          {record.campaign && (
            <div className="text-gray-500">{record.campaign}</div>
          )}
        </div>
      ),
    },
    {
      title: "Channel",
      dataIndex: "channel",
      key: "channel",
      render: (channel) => {
        let color = "";
        switch (channel) {
          case "SMS":
            color = "blue";
            break;
          case "WhatsApp":
            color = "green";
            break;
          case "Voice":
            color = "orange";
            break;
          case "RCS":
            color = "purple";
            break;
          default:
            color = "gray";
        }
        return <Tag color={color}>{channel}</Tag>;
      },
    },
    {
      title: "Recipient's",
      dataIndex: "recipients",
      key: "recipients",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) =>
        dayjs(a.date, "DD-MMM-YYYY").unix() -
        dayjs(b.date, "DD-MMM-YYYY").unix(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "";
        switch (status) {
          case "Sent":
            color = "green";
            break;
          case "Scheduled":
            color = "blue";
            break;
          case "Failed":
            color = "red";
            break;
          default:
            color = "gray";
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="view" onClick={() => handleView(record.key)}>
                View
              </Menu.Item>
              {record.channel?.toLowerCase() !== "sms" && (
                <Menu.Item key="send" onClick={() => handleSend(record.key)}>
                  Send
                </Menu.Item>
              )}
               <Menu.Item
                 key="delete"
                 icon={<DeleteOutlined />}
                 danger
                 onClick={() => handleDelete(record.key)}
               >
                 Delete
               </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
        >
          <MoreOutlined style={{ cursor: "pointer", fontSize: "16px" }} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-[31px] leading-8">
          Communication Manager
        </h2>
        <div className="flex items-center gap-2">
          <Button
            type="default"
            icon={<SettingOutlined />}
            onClick={() => setSettingsOpen(true)}
            className="h-[46px]"
          >
            Settings
          </Button>
          <Button
            type="primary"
            onClick={handleCreateMessage}
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                hover:!bg-[#1D4ED8] hover:text-[#fff]
                hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
          >
            Create Message
          </Button>
        </div>
      </div>

      <Modal
        title="Campaign Settings"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        footer={null}
        destroyOnClose
      >
        <CampaignSettingsPanel showHeader={false} />
      </Modal>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left Side Filters */}
          <Row
            gutter={[16, 16]}
            className="w-full items-center"
            justify="space-between"
          >
            <Col>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                className="min-w-[150px] mr-3 custom-select"
              >
                <Option value="All Status">All Status</Option>
                <Option value="Sent">Sent</Option>
                <Option value="Scheduled">Scheduled</Option>
                <Option value="Failed">Failed</Option>
              </Select>

              <Select
                value={selectedChannel}
                onChange={setSelectedChannel}
                className="min-w-[150px] mr-3 custom-select"
              >
                <Option value="All Channels">All Channels</Option>
                <Option value="WhatsApp">WhatsApp</Option>
                <Option value="SMS" disabled>
                  SMS (disabled)
                </Option>
                <Option value="Voice" disabled>
                  Voice (disabled)
                </Option>
                <Option value="RCS" disabled>
                  RCS (disabled)
                </Option>
              </Select>

              <Select
                value={dateRange}
                onChange={setDateRange}
                className="min-w-[150px] custom-select"
              >
                <Option value="Last 7 days">Last 7 days</Option>
                <Option value="Last 30 days">Last 30 days</Option>
                <Option value="Custom">Custom Range</Option>
              </Select>

              {dateRange === "Custom" && (
                <RangePicker className="min-w-[250px]" />
              )}
            </Col>
            <Col>
              <Input
                placeholder="Search messages..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-[250px]"
              />
            </Col>{" "}
            {/* Right Side Search */}
          </Row>
        </div>
      </Card>

      <Table
        className="my-4 default-list-table"
        columns={columns}
        dataSource={filteredCommunications}
        loading={loading}
        pagination={{
          position: ["bottomCenter"],
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} messages`,
        }}
        scroll={{ x: "max-content" }}
      />

    
    </div>
  );
};

export default CommunicationManager;
