import React, { useEffect, useState } from "react";
import { Modal, Table, Spin, message } from "antd";
import { getPartsApi } from "../api/partApi";
import {
  getElectionStats,
  getElectionStatsPartWise,
} from "../api/reportingApi";

interface AggregateBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  electionId: number;
  type: "religion" | "caste" | "subcaste" | "language" | "party" | "star-voter" | "caste-category" | "voters-with-photo" | "voters-without-photo" | "whatsapp-number";
}

interface PartAggregateData {
  partNumber: number;
  partLabel: string;
  partName: string;
  totalVoters: number;
  count: number;
  percentage: string;
}

const UNMAPPED_PART_NUMBER = 999999;
const UNMAPPED_PART_LABEL = "Unmapped / Invalid Part";

const metricFieldMap: Record<string, string> = {
  religion: "religionCount",
  caste: "casteCount",
  subcaste: "subCasteCount",
  language: "languageCount",
  party: "partyAffiliationCount",
  "star-voter": "totalStarVoters",
  "caste-category": "casteCategoryCount",
  "voters-with-photo": "votersWithPhoto",
  "voters-without-photo": "votersWithoutPhoto",
  "whatsapp-number": "whatsappNumberCount",
};

const AggregateBreakdownModal: React.FC<AggregateBreakdownModalProps> = ({
  visible,
  onClose,
  electionId,
  type,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PartAggregateData[]>([]);

  useEffect(() => {
    if (visible && electionId) {
      fetchData();
    }
  }, [visible, electionId, type]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const partsResponse = await getPartsApi(electionId);
      const parts = partsResponse.data || [];

      if (parts.length === 0) {
        message.warning("No parts found");
        return;
      }

      const partNumbers = parts.map((p: any) => parseInt(p.partNo));

      const statsRows = await getElectionStatsPartWise(electionId, partNumbers);
      const overallStats = await getElectionStats(electionId);

      const partNameMap = new Map(
        parts.map((p: any) => [
          parseInt(p.partNo),
          p.partNameEnglish || `Part ${p.partNo}`,
        ])
      );

      const field = metricFieldMap[type];

      const tableData: PartAggregateData[] = statsRows.map((stat: any) => {
        const partNumber = parseInt(stat.partNo);
        const totalVoters = stat.totalVoters || 0;
        const count = Number(stat[field]) || 0;

        const percentage =
          totalVoters > 0
            ? ((count / totalVoters) * 100).toFixed(2)
            : "0.00";

        return {
          partNumber,
          partLabel: String(partNumber),
          partName: partNameMap.get(partNumber) || `Part ${partNumber}`,
          totalVoters,
          count,
          percentage,
        };
      }).filter((row) => Number.isFinite(row.partNumber));

      const rowTotals = tableData.reduce(
        (acc, row) => {
          acc.totalVoters += row.totalVoters;
          acc.count += row.count;
          return acc;
        },
        { totalVoters: 0, count: 0 }
      );

      const overallCount = Number((overallStats as any)[field]) || 0;
      const unmappedTotalVoters = Math.max(0, (overallStats.totalVoters || 0) - rowTotals.totalVoters);
      const unmappedCount = Math.max(0, overallCount - rowTotals.count);

      if (unmappedTotalVoters > 0 || unmappedCount > 0) {
        tableData.push({
          partNumber: UNMAPPED_PART_NUMBER,
          partLabel: UNMAPPED_PART_LABEL,
          partName: UNMAPPED_PART_LABEL,
          totalVoters: unmappedTotalVoters,
          count: unmappedCount,
          percentage:
            unmappedTotalVoters > 0 ? ((unmappedCount / unmappedTotalVoters) * 100).toFixed(2) : "0.00",
        });
      }

      tableData.sort((a, b) => a.partNumber - b.partNumber);

      setData(tableData);
    } catch (err) {
      console.error(err);
      message.error("Failed to load breakdown");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "religion": return "Religion";
      case "caste": return "Caste";
      case "subcaste": return "Sub Caste";
      case "language": return "Language";
      case "party": return "Party Affiliation";
      case "star-voter": return "Star Voters";
      case "caste-category": return "Caste Category";
      case "voters-with-photo": return "Voters With Photo";
      case "voters-without-photo": return "Voters Without Photo";
      case "whatsapp-number": return "Whatsapp Number";
      default: return type.toUpperCase();
    }
  };

  const columns = [
    {
      title: "Part",
      dataIndex: "partLabel",
      key: "partNumber",
      width: 100,
      fixed: "left" as const,
    },
    {
      title: "Count",
      dataIndex: "count",
      key: "count",
      width: 120,
      render: (v: number) => v.toLocaleString("en-IN"),
    },
    {
      title: "Total Voters",
      dataIndex: "totalVoters",
      key: "totalVoters",
      width: 150,
      render: (v: number) => v.toLocaleString("en-IN"),
    },
    {
      title: "Percentage",
      dataIndex: "percentage",
      key: "percentage",
      width: 120,
      render: (v: string) => `${v}%`,
    },
  ];

  return (
    <Modal
      title={`${getTitle()} Breakdown by Part`}
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
          bordered
          size="small"
          scroll={{ y: 500 }}
        />
      </Spin>
    </Modal>
  );
};

export default AggregateBreakdownModal;