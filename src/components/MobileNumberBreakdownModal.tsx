import React, { useEffect, useState } from "react";
import { Modal, Table, Spin, message } from "antd";
import { getElectionStats, getElectionStatsPartWise, ElectionStatsAggregate } from "../api/reportingApi";
import { getPartsApi } from "../api/partApi";

interface MobileNumberBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  electionId: number;
}

interface PartData {
  partNumber: number;
  partLabel: string;
  partName: string;
  maleMobileCount: number;
  maleVoterCount: number;
  malePercentage: string;
  femaleMobileCount: number;
  femaleVoterCount: number;
  femalePercentage: string;
  othersMobileCount: number;
  othersVoterCount: number;
  othersPercentage: string;
  totalMobileCount: number;
  totalVoterCount: number;
  totalPercentage: string;
}

const UNMAPPED_PART_NUMBER = 999999;
const UNMAPPED_PART_LABEL = "Unmapped / Invalid Part";

const MobileNumberBreakdownModal: React.FC<MobileNumberBreakdownModalProps> = ({
  visible,
  onClose,
  electionId,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PartData[]>([]);

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
        message.warning("No parts found for this election");
        setLoading(false);
        return;
      }

      // Extract part numbers
      const partNumbers = parts.map((part: any) => parseInt(part.partNo));
      const overallStats = await getElectionStats(electionId);
      
      // Fetch part-wise stats
      const statsArray = await getElectionStatsPartWise(electionId, partNumbers);
      
      // Create a map of partNo to partName
      const partNameMap = new Map(
        parts.map((part: any) => [parseInt(part.partNo), part.partNameEnglish || `Part ${part.partNo}`])
      );

      // Transform data for table
      const tableData: PartData[] = statsArray.map((stat) => {
        const partNumber = parseInt(stat.partNo || "0");
        const partName: string = (partNameMap.get(partNumber) || `Part ${partNumber}`) as string;
        
        const maleMobileCount = stat.maleMobileCount || 0;
        const maleVoterCount = stat.male || 0;
        const malePercentage = maleVoterCount > 0 
          ? ((maleMobileCount / maleVoterCount) * 100).toFixed(2) 
          : "0.00";

        const femaleMobileCount = stat.femaleMobileCount || 0;
        const femaleVoterCount = stat.female || 0;
        const femalePercentage = femaleVoterCount > 0 
          ? ((femaleMobileCount / femaleVoterCount) * 100).toFixed(2) 
          : "0.00";

        const othersMobileCount = stat.transgenderMobileCount || 0;
        const othersVoterCount = stat.transgender || 0;
        const othersPercentage = othersVoterCount > 0 
          ? ((othersMobileCount / othersVoterCount) * 100).toFixed(2) 
          : "0.00";

        const totalMobileCount = stat.totalMobileCount || 0;
        const totalVoterCount = stat.totalVoters || 0;
        const totalPercentage = totalVoterCount > 0 
          ? ((totalMobileCount / totalVoterCount) * 100).toFixed(2) 
          : "0.00";

        return {
          partNumber,
          partLabel: String(partNumber),
          partName,
          maleMobileCount,
          maleVoterCount,
          malePercentage,
          femaleMobileCount,
          femaleVoterCount,
          femalePercentage,
          othersMobileCount,
          othersVoterCount,
          othersPercentage,
          totalMobileCount,
          totalVoterCount,
          totalPercentage,
        };
      });

      const partTotals = tableData.reduce(
        (acc, row) => {
          acc.maleCount += row.maleMobileCount;
          acc.maleVoters += row.maleVoterCount;
          acc.femaleCount += row.femaleMobileCount;
          acc.femaleVoters += row.femaleVoterCount;
          acc.othersCount += row.othersMobileCount;
          acc.othersVoters += row.othersVoterCount;
          acc.totalCount += row.totalMobileCount;
          acc.totalVoters += row.totalVoterCount;
          return acc;
        },
        {
          maleCount: 0,
          maleVoters: 0,
          femaleCount: 0,
          femaleVoters: 0,
          othersCount: 0,
          othersVoters: 0,
          totalCount: 0,
          totalVoters: 0,
        }
      );

      const unmappedMaleCount = Math.max(0, (overallStats.maleMobileCount || 0) - partTotals.maleCount);
      const unmappedMaleVoters = Math.max(0, (overallStats.male || 0) - partTotals.maleVoters);
      const unmappedFemaleCount = Math.max(0, (overallStats.femaleMobileCount || 0) - partTotals.femaleCount);
      const unmappedFemaleVoters = Math.max(0, (overallStats.female || 0) - partTotals.femaleVoters);
      const unmappedOthersCount = Math.max(0, (overallStats.transgenderMobileCount || 0) - partTotals.othersCount);
      const unmappedOthersVoters = Math.max(0, (overallStats.transgender || 0) - partTotals.othersVoters);
      const unmappedTotalCount = Math.max(0, (overallStats.totalMobileCount || 0) - partTotals.totalCount);
      const unmappedTotalVoters = Math.max(0, (overallStats.totalVoters || 0) - partTotals.totalVoters);

      if (
        unmappedMaleCount > 0 || unmappedMaleVoters > 0 ||
        unmappedFemaleCount > 0 || unmappedFemaleVoters > 0 ||
        unmappedOthersCount > 0 || unmappedOthersVoters > 0 ||
        unmappedTotalCount > 0 || unmappedTotalVoters > 0
      ) {
        tableData.push({
          partNumber: UNMAPPED_PART_NUMBER,
          partLabel: UNMAPPED_PART_LABEL,
          partName: UNMAPPED_PART_LABEL,
          maleMobileCount: unmappedMaleCount,
          maleVoterCount: unmappedMaleVoters,
          malePercentage: unmappedMaleVoters > 0 ? ((unmappedMaleCount / unmappedMaleVoters) * 100).toFixed(2) : "0.00",
          femaleMobileCount: unmappedFemaleCount,
          femaleVoterCount: unmappedFemaleVoters,
          femalePercentage: unmappedFemaleVoters > 0 ? ((unmappedFemaleCount / unmappedFemaleVoters) * 100).toFixed(2) : "0.00",
          othersMobileCount: unmappedOthersCount,
          othersVoterCount: unmappedOthersVoters,
          othersPercentage: unmappedOthersVoters > 0 ? ((unmappedOthersCount / unmappedOthersVoters) * 100).toFixed(2) : "0.00",
          totalMobileCount: unmappedTotalCount,
          totalVoterCount: unmappedTotalVoters,
          totalPercentage: unmappedTotalVoters > 0 ? ((unmappedTotalCount / unmappedTotalVoters) * 100).toFixed(2) : "0.00",
        });
      }

      // Sort by part number
      tableData.sort((a, b) => a.partNumber - b.partNumber);
      
      setData(tableData);
    } catch (error: any) {
      console.error("Error fetching mobile number breakdown:", error);
      message.error("Failed to load mobile number breakdown");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Part",
      dataIndex: "partLabel",
      key: "partNumber",
      width: 80,
      fixed: "left" as const,
    },
    {
      title: "Male",
      key: "male",
      children: [
        {
          title: "Count",
          dataIndex: "maleMobileCount",
          key: "maleMobileCount",
          width: 80,
          render: (count: number) => count.toLocaleString("en-IN"),
        },
        {
          title: "Total",
          dataIndex: "maleVoterCount",
          key: "maleVoterCount",
          width: 80,
          render: (count: number) => count.toLocaleString("en-IN"),
        },
        {
          title: "%",
          dataIndex: "malePercentage",
          key: "malePercentage",
          width: 80,
          render: (pct: string) => `${pct}%`,
        },
      ],
    },
    {
      title: "Female",
      key: "female",
      children: [
        {
          title: "Count",
          dataIndex: "femaleMobileCount",
          key: "femaleMobileCount",
          width: 80,
          render: (count: number) => count.toLocaleString("en-IN"),
        },
        {
          title: "Total",
          dataIndex: "femaleVoterCount",
          key: "femaleVoterCount",
          width: 80,
          render: (count: number) => count.toLocaleString("en-IN"),
        },
        {
          title: "%",
          dataIndex: "femalePercentage",
          key: "femalePercentage",
          width: 80,
          render: (pct: string) => `${pct}%`,
        },
      ],
    },
    {
      title: "Others",
      key: "others",
      children: [
        {
          title: "Count",
          dataIndex: "othersMobileCount",
          key: "othersMobileCount",
          width: 80,
          render: (count: number) => count.toLocaleString("en-IN"),
        },
        {
          title: "Total",
          dataIndex: "othersVoterCount",
          key: "othersVoterCount",
          width: 80,
          render: (count: number) => count.toLocaleString("en-IN"),
        },
        {
          title: "%",
          dataIndex: "othersPercentage",
          key: "othersPercentage",
          width: 80,
          render: (pct: string) => `${pct}%`,
        },
      ],
    },
    {
      title: "Total",
      key: "total",
      children: [
        {
          title: "Count",
          dataIndex: "totalMobileCount",
          key: "totalMobileCount",
          width: 80,
          render: (count: number) => count.toLocaleString("en-IN"),
        },
        {
          title: "Total",
          dataIndex: "totalVoterCount",
          key: "totalVoterCount",
          width: 80,
          render: (count: number) => count.toLocaleString("en-IN"),
        },
        {
          title: "%",
          dataIndex: "totalPercentage",
          key: "totalPercentage",
          width: 80,
          render: (pct: string) => `${pct}%`,
        },
      ],
    },
  ];

  return (
    <Modal
      title="Mobile Number Breakdown by Part"
      open={visible}
      onCancel={onClose}
      width={1400}
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
  );
};

export default MobileNumberBreakdownModal;
