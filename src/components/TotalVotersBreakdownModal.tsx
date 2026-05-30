import React, { useEffect, useState } from "react";
import { Modal, Table, Spin, message, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { getElectionStats, getElectionStatsPartWise } from "../api/reportingApi";
import { getPartsApi } from "../api/partApi";
import TotalVotersExportModal from "./TotalVotersExportModal";

interface TotalVotersBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  electionId: number;
}

interface PartData {
  partNumber: number;
  partLabel: string;
  partName: string;
  maleVoters: number;
  femaleVoters: number;
  othersVoters: number;
  totalVoters: number;
}

const UNMAPPED_PART_NUMBER = 999999;
const UNMAPPED_PART_LABEL = "Unmapped / Invalid Part";

const TotalVotersBreakdownModal: React.FC<TotalVotersBreakdownModalProps> = ({
  visible,
  onClose,
  electionId,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PartData[]>([]);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  useEffect(() => {
    if (visible && electionId) {
      fetchData();
    }
  }, [visible, electionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all parts for the election
      const partsResponse = await getPartsApi(electionId);
      const parts = partsResponse.data || [];
      
      if (parts.length === 0) {
        // message.warning("No parts found for this election"); // Optional: suppress warning or keep it
        setLoading(false);
        return;
      }

      // Extract part numbers (assuming API expects strings or numbers, check type)
      // The original code passed `partNumbers` which was `number[]`. 
      // `getElectionStatsPartWise` might expect something else but assuming it works as is.
      // Based on original code:
      const partNumbers = parts.map((part: any) => parseInt(part.partNo));
      const overallStats = await getElectionStats(electionId);
      
      // Fetch part-wise stats
      // Note: original code called `getElectionStatsPartWise` with `electionId` and `partNumbers`.
      // I am keeping it as is.
      const statsArray = await getElectionStatsPartWise(electionId, partNumbers);
      
      // Create a map of partNo to partName
      const partNameMap = new Map<number, string>();
      parts.forEach((part: any) => {
        partNameMap.set(parseInt(part.partNo), part.partNameEnglish || `Part ${part.partNo}`);
      });

      // Transform data for table
      // statsArray is likely `ElectionStatsAggregate[]` or similar.
      // Original code mapped it.
      const tableData: PartData[] = statsArray.map((stat: any) => {
        const partNumber = parseInt(stat.partNo || "0");
        const partName = partNameMap.get(partNumber) || `Part ${partNumber}`;
        
        return {
          partNumber,
          partLabel: String(partNumber),
          partName,
          maleVoters: stat.male || 0,
          femaleVoters: stat.female || 0,
          othersVoters: stat.transgender || 0,
          totalVoters: stat.totalVoters || 0,
        };
      });

      const partTotals = tableData.reduce(
        (acc, row) => {
          acc.male += row.maleVoters;
          acc.female += row.femaleVoters;
          acc.others += row.othersVoters;
          acc.total += row.totalVoters;
          return acc;
        },
        { male: 0, female: 0, others: 0, total: 0 }
      );

      const unmappedMale = Math.max(0, (overallStats.male || 0) - partTotals.male);
      const unmappedFemale = Math.max(0, (overallStats.female || 0) - partTotals.female);
      const unmappedOthers = Math.max(0, (overallStats.transgender || 0) - partTotals.others);
      const unmappedTotal = Math.max(0, (overallStats.totalVoters || 0) - partTotals.total);

      if (unmappedMale > 0 || unmappedFemale > 0 || unmappedOthers > 0 || unmappedTotal > 0) {
        tableData.push({
          partNumber: UNMAPPED_PART_NUMBER,
          partLabel: UNMAPPED_PART_LABEL,
          partName: UNMAPPED_PART_LABEL,
          maleVoters: unmappedMale,
          femaleVoters: unmappedFemale,
          othersVoters: unmappedOthers,
          totalVoters: unmappedTotal,
        });
      }

      // Sort by part number
      tableData.sort((a, b) => a.partNumber - b.partNumber);
      
      setData(tableData);
    } catch (error: any) {
      console.error("Error fetching total voters breakdown:", error);
      message.error("Failed to load total voters breakdown");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Part No",
      dataIndex: "partLabel",
      key: "partNumber",
      width: 100,
      fixed: "left" as const,
    },
    {
      title: "Male Voter",
      dataIndex: "maleVoters",
      key: "maleVoters",
      width: 150,
      render: (count: number) => count.toLocaleString("en-IN"),
    },
    {
      title: "Female Voter",
      dataIndex: "femaleVoters",
      key: "femaleVoters",
      width: 150,
      render: (count: number) => count.toLocaleString("en-IN"),
    },
    {
      title: "Others Voter",
      dataIndex: "othersVoters",
      key: "othersVoters",
      width: 150,
      render: (count: number) => count.toLocaleString("en-IN"),
    },
    {
      title: "Total Voters",
      dataIndex: "totalVoters",
      key: "totalVoters",
      width: 150,
      render: (count: number) => count.toLocaleString("en-IN"),
    },
  ];

  return (
    <>
      <Modal
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginRight: 24 }}>
            <span>Total Voters Breakdown by Part</span>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => setExportModalVisible(true)}
              disabled={data.length === 0}
              size="small"
            >
              Export
            </Button>
          </div>
        }
        open={visible}
        onCancel={onClose}
        width={900}
        footer={null}
        destroyOnClose
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="partNumber"
            pagination={false}
            scroll={{ y: 500 }}
            bordered
            size="small"
          />
        </Spin>
      </Modal>

      <TotalVotersExportModal
        open={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        data={data}
        columns={columns as any}
        title="Total Voters Breakdown by Part"
      />
    </>
  );
};

export default TotalVotersBreakdownModal;
