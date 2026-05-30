import { Modal, Table, message } from "antd";
import { useEffect, useState } from "react";
import { getPartsApi } from "../api/partApi";
import { getElectionStats, getElectionStatsPartWise } from "../api/reportingApi";

type Props = {
  visible: boolean;
  onClose: () => void;
  type:
    | "sms"
    | "whatsapp"
    | "family-slip"
    | "benefit-slip"
    | "voice-call"
    | null;
  electionId: number;
  accountId: number;
};

interface RowData {
  partNo: number;
  partLabel: string;
  partName: string;
  totalVoters: number;
  count: number;
  percentage: string;
}

const UNMAPPED_PART_NUMBER = 999999;
const UNMAPPED_PART_LABEL = "Unmapped / Invalid Part";

const fieldMap: Record<NonNullable<Props["type"]>, string> = {
  sms: "smsCount",
  whatsapp: "whatsappCount",
  "family-slip": "familySlipCount",
  "benefit-slip": "benefitSlipCount",
  "voice-call": "voiceCallCount",
};

const titleMap: Record<NonNullable<Props["type"]>, string> = {
  sms: "SMS Breakdown",
  whatsapp: "Whatsapp Breakdown",
  "family-slip": "Family Slip Breakdown",
  "benefit-slip": "Benefit Slip Breakdown",
  "voice-call": "Voice Call Breakdown",
};

const CommunicationBreakdownModal = ({
  visible,
  onClose,
  type,
  electionId,
  accountId,
}: Props) => {
  const [data, setData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!type || !electionId) return;

    setLoading(true);

    try {
      const partsResponse = await getPartsApi(electionId);
      const parts = partsResponse.data || [];

      if (parts.length === 0) {
        message.warning("No parts found");
        setData([]);
        return;
      }

      const partNumbers = parts
        .map((part: any) => parseInt(part.partNo))
        .filter((partNo: number) => !Number.isNaN(partNo));

      if (partNumbers.length === 0) {
        setData([]);
        return;
      }

      const partNameMap = new Map(
        parts.map((part: any) => [
          parseInt(part.partNo),
          part.partNameEnglish || `Part ${part.partNo}`,
        ])
      );

      const stats = await getElectionStatsPartWise(electionId, partNumbers);
      const overallStats = await getElectionStats(electionId);
      const field = fieldMap[type];

      const rows = (stats || [])
        .map((stat: any) => {
          const partNo = parseInt(stat.partNo || "0");
          const totalVoters = stat.totalVoters || 0;
          const count = stat[field] || 0;
          const percentage =
            totalVoters > 0 ? ((count / totalVoters) * 100).toFixed(2) : "0.00";

          return {
            partNo,
            partLabel: String(partNo),
            partName: partNameMap.get(partNo) || `Part ${partNo}`,
            totalVoters,
            count,
            percentage,
          };
        })
        .filter((row) => Number.isFinite(row.partNo));

      const rowTotals = rows.reduce(
        (acc, row) => {
          acc.totalVoters += row.totalVoters;
          acc.count += row.count;
          return acc;
        },
        { totalVoters: 0, count: 0 }
      );

      const overallCount = overallStats[field] || 0;
      const unmappedTotalVoters = Math.max(0, (overallStats.totalVoters || 0) - rowTotals.totalVoters);
      const unmappedCount = Math.max(0, overallCount - rowTotals.count);

      if (unmappedTotalVoters > 0 || unmappedCount > 0) {
        rows.push({
          partNo: UNMAPPED_PART_NUMBER,
          partLabel: UNMAPPED_PART_LABEL,
          partName: UNMAPPED_PART_LABEL,
          totalVoters: unmappedTotalVoters,
          count: unmappedCount,
          percentage:
            unmappedTotalVoters > 0 ? ((unmappedCount / unmappedTotalVoters) * 100).toFixed(2) : "0.00",
        });
      }

      rows.sort((left, right) => left.partNo - right.partNo);
      setData(rows);
    } catch (err) {
      console.error(err);
      message.error("Failed to load breakdown");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) fetchData();
  }, [visible, type, electionId]);

  const columns = [
    {
      title: "Part No",
      dataIndex: "partLabel",
      sorter: (a: RowData, b: RowData) => a.partNo - b.partNo,
      defaultSortOrder: "ascend" as const,
    },
    {
      title: "Part Name",
      dataIndex: "partName",
    },
    {
      title: "Count",
      dataIndex: "count",
      render: (value: number) => value.toLocaleString("en-IN"),
    },
    {
      title: "Total Voters",
      dataIndex: "totalVoters",
      render: (value: number) => value.toLocaleString("en-IN"),
    },
    {
      title: "Percentage",
      dataIndex: "percentage",
      render: (value: string) => `${value}%`,
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      title={type ? titleMap[type] : "Breakdown"}
    >
      <Table
        rowKey="partNo"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Modal>
  );
};

export default CommunicationBreakdownModal;