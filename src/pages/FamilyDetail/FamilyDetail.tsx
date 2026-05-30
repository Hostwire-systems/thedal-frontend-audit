import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { getFamilyPartStats } from "../../api/familyApi";
import { PartFamilyStats } from "../../types/family";
import {
  getCachedFamilyStats,
  isCacheValid,
  setCachedFamilyStats,
} from "../../services/familyStatsCache";

const { Title, Text } = Typography;

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN").format(value || 0);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const getRateColor = (value: number) => {
  if (value >= 75) return "#15803d";
  if (value >= 50) return "#2563eb";
  if (value >= 30) return "#d97706";
  return "#dc2626";
};

const getRateLabel = (value: number) => {
  if (value >= 75) return "Strong";
  if (value >= 50) return "Healthy";
  if (value >= 30) return "Moderate";
  return "Needs attention";
};

const FamilyDetail: React.FC = () => {
  const navigate = useNavigate();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const [loading, setLoading] = useState(false);
  const [partStats, setPartStats] = useState<PartFamilyStats[]>([]);

  const loadFamilyStats = useCallback(
    async (options?: { showLoading?: boolean; forceRefresh?: boolean }) => {
      if (!selectedElectionId) return [];

      const electionId = Number(selectedElectionId);
      const cacheKey = selectedElectionId.toString();
      const showLoading = options?.showLoading ?? true;

      if (!options?.forceRefresh && isCacheValid(cacheKey)) {
        const cachedStats = getCachedFamilyStats(cacheKey);
        if (cachedStats && cachedStats.length > 0) {
          setPartStats(cachedStats);
          return cachedStats;
        }
      }

      if (showLoading) setLoading(true);
      try {
        const stats = await getFamilyPartStats(electionId);
        setPartStats(stats);
        setCachedFamilyStats(cacheKey, stats);
        return stats;
      } catch (error) {
        console.error("Error fetching family stats:", error);
        message.error("Failed to fetch family statistics");
        return [];
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [selectedElectionId]
  );

  useEffect(() => {
    if (!selectedElectionId) {
      setPartStats([]);
      return;
    }

    const cacheKey = selectedElectionId.toString();
    const cachedStats = isCacheValid(cacheKey)
      ? getCachedFamilyStats(cacheKey)
      : null;

    if (cachedStats && cachedStats.length > 0) {
      setPartStats(cachedStats);
      return;
    }

    setPartStats([]);
    void loadFamilyStats({ showLoading: true, forceRefresh: true });
  }, [selectedElectionId, loadFamilyStats]);

  const handleRefresh = () => {
    void loadFamilyStats({ showLoading: true, forceRefresh: true });
  };

  const totals = partStats.reduce(
    (acc, stat) => ({
      totalVoters: acc.totalVoters + stat.totalVoters,
      totalFamilies: acc.totalFamilies + stat.totalFamilies,
      familyVoters: acc.familyVoters + stat.familyVoters,
      unmappedFamilyVoters:
        acc.unmappedFamilyVoters + stat.unmappedFamilyVoters,
    }),
    {
      totalVoters: 0,
      totalFamilies: 0,
      familyVoters: 0,
      unmappedFamilyVoters: 0,
    }
  );

  const totalPercentFamilyVoters =
    totals.totalVoters > 0
      ? (totals.familyVoters / totals.totalVoters) * 100
      : 0;
  const totalPercentUnmapped =
    totals.totalVoters > 0
      ? (totals.unmappedFamilyVoters / totals.totalVoters) * 100
      : 0;

  const totalParts = partStats.length;
  const averageFamilySize =
    totals.totalFamilies > 0 ? totals.familyVoters / totals.totalFamilies : 0;

  const hasData = partStats.length > 0;
  const exportDisabled = loading || !hasData;

  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const exportData = [
        {
          "Part No": "Total",
          "Total Voter": formatNumber(totals.totalVoters),
          "Total Family": formatNumber(totals.totalFamilies),
          "Family Voters": formatNumber(totals.familyVoters),
          "% of Family Voters": formatPercent(totalPercentFamilyVoters),
          "Unmapped Family Voter": formatNumber(totals.unmappedFamilyVoters),
          "Unmapped Family Voter %": formatPercent(totalPercentUnmapped),
        },
        ...partStats.map((stat) => ({
          "Part No": stat.partNo,
          "Total Voter": formatNumber(stat.totalVoters),
          "Total Family": formatNumber(stat.totalFamilies),
          "Family Voters": formatNumber(stat.familyVoters),
          "% of Family Voters": formatPercent(stat.percentFamilyVoters),
          "Unmapped Family Voter": formatNumber(stat.unmappedFamilyVoters),
          "Unmapped Family Voter %": formatPercent(stat.percentUnmapped),
        })),
      ];

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Family Statistics");
      XLSX.writeFile(
        wb,
        `Family_Statistics_by_Part_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      message.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      message.error("Failed to export Excel file");
    }
  };

  const exportToPDF = async () => {
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("Family Statistics by Part", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

      const tableData = [
        [
          "Total",
          formatNumber(totals.totalVoters),
          formatNumber(totals.totalFamilies),
          formatNumber(totals.familyVoters),
          formatPercent(totalPercentFamilyVoters),
          formatNumber(totals.unmappedFamilyVoters),
          formatPercent(totalPercentUnmapped),
        ],
        ...partStats.map((stat) => [
          stat.partNo.toString(),
          formatNumber(stat.totalVoters),
          formatNumber(stat.totalFamilies),
          formatNumber(stat.familyVoters),
          formatPercent(stat.percentFamilyVoters),
          formatNumber(stat.unmappedFamilyVoters),
          formatPercent(stat.percentUnmapped),
        ]),
      ];

      autoTable(doc, {
        head: [
          [
            "Part No",
            "Total Voter",
            "Total Family",
            "Family Voters",
            "% Family Voters",
            "Unmapped Voters",
            "Unmapped %",
          ],
        ],
        body: tableData,
        startY: 28,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 64, 175] },
        didParseCell: (data: any) => {
          if (data.row.index === 0 && data.section === "body") {
            data.cell.styles.fillColor = [241, 245, 249];
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      doc.save(
        `Family_Statistics_by_Part_${new Date().toISOString().split("T")[0]}.pdf`
      );
      message.success("PDF file downloaded successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      message.error("Failed to export PDF file");
    }
  };

  const columns = [
    {
      title: "Part",
      dataIndex: "partNo",
      key: "partNo",
      width: 120,
      sorter: (a: PartFamilyStats, b: PartFamilyStats) => a.partNo - b.partNo,
      render: (value: number) => (
        <Tag
          style={{
            border: "none",
            borderRadius: 999,
            background: "#dbeafe",
            color: "#1d4ed8",
            fontWeight: 600,
            paddingInline: 12,
            paddingBlock: 6,
          }}
        >
          Part {value}
        </Tag>
      ),
    },
    {
      title: "Total Voters",
      dataIndex: "totalVoters",
      key: "totalVoters",
      width: 140,
      sorter: (a: PartFamilyStats, b: PartFamilyStats) =>
        a.totalVoters - b.totalVoters,
      render: (value: number) => (
        <span className="font-semibold text-slate-800">
          {formatNumber(value)}
        </span>
      ),
    },
    {
      title: "Family Groups",
      dataIndex: "totalFamilies",
      key: "totalFamilies",
      width: 140,
      sorter: (a: PartFamilyStats, b: PartFamilyStats) =>
        a.totalFamilies - b.totalFamilies,
      render: (value: number) => formatNumber(value),
    },
    {
      title: "Mapped Voters",
      dataIndex: "familyVoters",
      key: "familyVoters",
      width: 150,
      sorter: (a: PartFamilyStats, b: PartFamilyStats) =>
        a.familyVoters - b.familyVoters,
      render: (value: number) => (
        <span className="font-medium text-emerald-700">
          {formatNumber(value)}
        </span>
      ),
    },
    {
      title: "Coverage",
      dataIndex: "percentFamilyVoters",
      key: "percentFamilyVoters",
      width: 220,
      sorter: (a: PartFamilyStats, b: PartFamilyStats) =>
        a.percentFamilyVoters - b.percentFamilyVoters,
      render: (value: number) => {
        const safeValue = Number(value.toFixed(1));
        return (
          <div className="min-w-[180px]">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">
                {getRateLabel(safeValue)}
              </span>
              <span className="font-semibold text-slate-800">
                {formatPercent(safeValue)}
              </span>
            </div>
            <Progress
              percent={safeValue}
              showInfo={false}
              strokeColor={getRateColor(safeValue)}
              trailColor="#e2e8f0"
              size="small"
            />
          </div>
        );
      },
    },
    {
      title: "Unmapped Voters",
      dataIndex: "unmappedFamilyVoters",
      key: "unmappedFamilyVoters",
      width: 160,
      sorter: (a: PartFamilyStats, b: PartFamilyStats) =>
        a.unmappedFamilyVoters - b.unmappedFamilyVoters,
      render: (value: number) => (
        <span className="font-medium text-rose-600">
          {formatNumber(value)}
        </span>
      ),
    },
    {
      title: "Unmapped Rate",
      dataIndex: "percentUnmapped",
      key: "percentUnmapped",
      width: 220,
      sorter: (a: PartFamilyStats, b: PartFamilyStats) =>
        a.percentUnmapped - b.percentUnmapped,
      render: (value: number) => {
        const safeValue = Number(value.toFixed(1));
        return (
          <div className="min-w-[180px]">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">
                {safeValue >= 40 ? "High gap" : "Contained"}
              </span>
              <span className="font-semibold text-slate-800">
                {formatPercent(safeValue)}
              </span>
            </div>
            <Progress
              percent={safeValue}
              showInfo={false}
              strokeColor={safeValue >= 40 ? "#dc2626" : "#f59e0b"}
              trailColor="#fee2e2"
              size="small"
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-full w-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-6 py-6">
        <Card bordered={false} className="shadow-sm">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate("/static-dashboard")}
                >
                  Back to Dashboard
                </Button>
                <Tag color="blue">
                  {selectedElectionId
                    ? `Election #${selectedElectionId}`
                    : "No election selected"}
                </Tag>
                <Tag color={hasData ? "geekblue" : "default"}>
                  {totalParts} tracked part{totalParts === 1 ? "" : "s"}
                </Tag>
              </div>

              <Title level={4} className="!mb-1 !mt-0">
                Detailed Mapping Table
              </Title>
              <Text className="!text-slate-500">
                Compare coverage part by part and focus follow-up work where the
                unmapped gap is widest.
              </Text>
            </div>

            <Space size={[8, 8]} wrap>
              <Button
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
                disabled={exportDisabled}
              >
                Export Excel
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={exportToPDF}
                disabled={exportDisabled}
              >
                Export PDF
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined spin={loading} />}
                onClick={handleRefresh}
                loading={loading}
              >
                Refresh Data
              </Button>
              <Tag color="blue">{formatNumber(totalParts)} parts</Tag>
              <Tag color={totalPercentFamilyVoters >= 50 ? "green" : "orange"}>
                Coverage {formatPercent(totalPercentFamilyVoters)}
              </Tag>
              <Tag color={totalPercentUnmapped >= 40 ? "red" : "gold"}>
                Unmapped {formatPercent(totalPercentUnmapped)}
              </Tag>
              <Tag color="cyan">
                Avg family size {averageFamilySize.toFixed(1)}
              </Tag>
            </Space>
          </div>

          {!selectedElectionId && !loading ? (
            <div className="py-14">
              <Empty description="Select an election to view family mapping by part." />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={partStats}
              rowKey="partNo"
              loading={loading}
              size="middle"
              sticky
              rowClassName={(record: PartFamilyStats) => {
                if (record.percentUnmapped >= 40) {
                  return "bg-rose-50";
                }
                if (record.percentFamilyVoters >= 70) {
                  return "bg-emerald-50";
                }
                return "";
              }}
              pagination={{
                defaultPageSize: 10,
                pageSizeOptions: ["10", "20", "50", "100"],
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${formatNumber(total)} parts`,
              }}
              scroll={{ x: 1250 }}
              locale={{
                emptyText: (
                  <div className="py-10">
                    <Empty description="No part-level family statistics available yet." />
                  </div>
                ),
              }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <span className="font-semibold text-slate-900">Overall</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <span className="font-semibold text-slate-900">
                        {formatNumber(totals.totalVoters)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <span className="font-semibold text-slate-900">
                        {formatNumber(totals.totalFamilies)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <span className="font-semibold text-emerald-700">
                        {formatNumber(totals.familyVoters)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <div className="min-w-[180px]">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-500">Overall</span>
                          <span className="font-semibold text-slate-800">
                            {formatPercent(totalPercentFamilyVoters)}
                          </span>
                        </div>
                        <Progress
                          percent={Number(totalPercentFamilyVoters.toFixed(1))}
                          showInfo={false}
                          strokeColor={getRateColor(totalPercentFamilyVoters)}
                          trailColor="#e2e8f0"
                          size="small"
                        />
                      </div>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5}>
                      <span className="font-semibold text-rose-600">
                        {formatNumber(totals.unmappedFamilyVoters)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6}>
                      <div className="min-w-[180px]">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-500">Overall</span>
                          <span className="font-semibold text-slate-800">
                            {formatPercent(totalPercentUnmapped)}
                          </span>
                        </div>
                        <Progress
                          percent={Number(totalPercentUnmapped.toFixed(1))}
                          showInfo={false}
                          strokeColor={
                            totalPercentUnmapped >= 40 ? "#dc2626" : "#f59e0b"
                          }
                          trailColor="#fee2e2"
                          size="small"
                        />
                      </div>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default FamilyDetail;