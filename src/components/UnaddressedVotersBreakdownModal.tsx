import React, { useEffect, useState } from "react";
import { Modal, Table, Spin, message, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { getAddressedVotersPartWise } from "../api/voterApi";

interface UnaddressedVotersBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  electionId: number;
  onExport?: () => void;
}

interface PartData {
  partNumber: number;
  addressedCount: number;
  unaddressedCount: number;
  totalCount: number;
}

const UnaddressedVotersBreakdownModal: React.FC<UnaddressedVotersBreakdownModalProps> = ({
  visible,
  onClose,
  electionId,
  onExport
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PartData[]>([]);
  const [totals, setTotals] = useState({
    totalAddressed: 0,
    totalUnaddressed: 0,
    totalVoters: 0,
  });

  useEffect(() => {
    if (visible && electionId) {
      fetchData();
    }
  }, [visible, electionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getAddressedVotersPartWise(electionId);
      
      if (response.data) {
        const { totalAddressed, totalUnaddressed, totalVoters, partWiseBreakdown } = response.data;
        
        setTotals({
          totalAddressed: totalAddressed || 0,
          totalUnaddressed: totalUnaddressed || 0,
          totalVoters: totalVoters || 0,
        });

        // Transform data for table
        const tableData: PartData[] = (partWiseBreakdown || []).map((item: any) => ({
          partNumber: item.partNumber,
          addressedCount: item.addressedCount || 0,
          unaddressedCount: item.unaddressedCount || 0,
          totalCount: item.totalCount || 0,
        }));

        // Sort by part number
        tableData.sort((a, b) => a.partNumber - b.partNumber);
        
        setData(tableData);
      }
    } catch (error: any) {
      console.error("Error fetching unaddressed voters breakdown:", error);
      message.error("Failed to load unaddressed voters breakdown");
    } finally {
      setLoading(false);
    }
  };



  const columns = [
    {
      title: "Part No",
      dataIndex: "partNumber",
      key: "partNumber",
      width: 120,
      fixed: "left" as const,
      sorter: (a: PartData, b: PartData) => a.partNumber - b.partNumber,
    },
    {
      title: "Unaddressed Voters",
      dataIndex: "unaddressedCount",
      key: "unaddressedCount",
      width: 180,
      render: (count: number) => (
        <span style={{ color: "#DC2626", fontWeight: 600 }}>
          {count.toLocaleString("en-IN")}
        </span>
      ),
      sorter: (a: PartData, b: PartData) => a.unaddressedCount - b.unaddressedCount,
    },
    {
      title: "Addressed Voters",
      dataIndex: "addressedCount",
      key: "addressedCount",
      width: 180,
      render: (count: number) => (
        <span style={{ color: "#059669", fontWeight: 600 }}>
          {count.toLocaleString("en-IN")}
        </span>
      ),
      sorter: (a: PartData, b: PartData) => a.addressedCount - b.addressedCount,
    },
    {
      title: "Total Voters",
      dataIndex: "totalCount",
      key: "totalCount",
      width: 150,
      render: (count: number) => (
        <span style={{ fontWeight: 600 }}>
          {count.toLocaleString("en-IN")}
        </span>
      ),
      sorter: (a: PartData, b: PartData) => a.totalCount - b.totalCount,
    },
  ];

  return (
    <Modal
      title="Unaddressed Voters Breakdown by Part"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={onExport}
          style={{ backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" }}
        >
          Export
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ marginBottom: 16, padding: "12px 16px", background: "#F3F4F6", borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-around", fontSize: 16, fontWeight: 600 }}>
          <div>
            Total Unaddressed: <span style={{ color: "#DC2626" }}>{totals.totalUnaddressed.toLocaleString("en-IN")}</span>
          </div>
          <div>
            Total Addressed: <span style={{ color: "#059669" }}>{totals.totalAddressed.toLocaleString("en-IN")}</span>
          </div>
          <div>
            Total Voters: <span style={{ color: "#2563EB" }}>{totals.totalVoters.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
      
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="partNumber"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} parts`,
          }}
          scroll={{ y: 400 }}
          bordered
          size="small"
        />
      </Spin>
    </Modal>
  );
};

export default UnaddressedVotersBreakdownModal;
