import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Table, Spin, message, Button } from "antd";
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import {
  ElectionStatsAggregate,
  getElectionStats,
  getElectionStatsPartWise,
} from "../api/reportingApi";
import { getPartsApi } from "../api/partApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface VoterSlipBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  electionId: number;
  metricType: "unique" | "total";
}

interface PartData {
  partNumber: number;
  partLabel: string;
  totalPartVoters: number;
  uniqueVoterSlipCount: number;
  totalVoterSlipCount: number;
}

const UNMAPPED_PART_NUMBER = 999999;
const UNMAPPED_PART_LABEL = "Unmapped / Invalid Part";

const VoterSlipBreakdownModal: React.FC<VoterSlipBreakdownModalProps> = ({
  visible,
  onClose,
  electionId,
  metricType,
}) => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<PartData[]>([]);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    if (visible && electionId) {
      const currentRequest = latestRequestRef.current + 1;
      latestRequestRef.current = currentRequest;
      fetchData(currentRequest);
    }
  }, [visible, electionId]);

  const fetchData = async (requestId: number) => {
    setLoading(true);
    try {
      const partsResponse = await getPartsApi(electionId);

      if (requestId !== latestRequestRef.current) {
        return;
      }

      const parts = partsResponse.data || [];

      if (parts.length === 0) {
        message.warning("No parts found for this election");
        setData([]);
        return;
      }

      const partNumbers: number[] = parts
        .map((part: any) => parseInt(part.partNo))
        .filter((partNo: number) => !Number.isNaN(partNo));

      if (partNumbers.length === 0) {
        setData([]);
        return;
      }

      const overallStats = await getElectionStats(electionId);

      if (requestId !== latestRequestRef.current) {
        return;
      }

      const REQUEST_PART_BATCH_SIZE = 200;
      const partBatches: number[][] = [];

      for (let start = 0; start < partNumbers.length; start += REQUEST_PART_BATCH_SIZE) {
        partBatches.push(partNumbers.slice(start, start + REQUEST_PART_BATCH_SIZE));
      }

      const statsPages = await Promise.all(
        partBatches.map((batchPartNumbers) => getElectionStatsPartWise(electionId, batchPartNumbers))
      );

      if (requestId !== latestRequestRef.current) {
        return;
      }

      const statsArray = statsPages.flat();

      const tableData: PartData[] = (statsArray || []).map((stat: ElectionStatsAggregate) => {
        const partNumber = parseInt(stat.partNo || "0");
        return {
          partNumber,
          partLabel: String(partNumber),
          totalPartVoters: stat.totalVoters || 0,
          uniqueVoterSlipCount: stat.uniqueVoterSlipCount || 0,
          totalVoterSlipCount: stat.voterSlipCount || 0,
        };
      });

      const partTotals = tableData.reduce(
        (acc, row) => {
          acc.totalVoters += row.totalPartVoters;
          acc.unique += row.uniqueVoterSlipCount;
          acc.total += row.totalVoterSlipCount;
          return acc;
        },
        { totalVoters: 0, unique: 0, total: 0 }
      );

      const unmappedTotalVoters = Math.max(
        0,
        (overallStats.totalVoters || 0) - partTotals.totalVoters
      );
      const unmappedUnique = Math.max(
        0,
        (overallStats.uniqueVoterSlipCount || 0) - partTotals.unique
      );
      const unmappedTotal = Math.max(
        0,
        (overallStats.voterSlipCount || 0) - partTotals.total
      );

      if (unmappedTotalVoters > 0 || unmappedUnique > 0 || unmappedTotal > 0) {
        tableData.push({
          partNumber: UNMAPPED_PART_NUMBER,
          partLabel: UNMAPPED_PART_LABEL,
          totalPartVoters: unmappedTotalVoters,
          uniqueVoterSlipCount: unmappedUnique,
          totalVoterSlipCount: unmappedTotal,
        });
      }

      tableData.sort((a, b) => a.partNumber - b.partNumber);
      setData(tableData);
    } catch (error: any) {
      console.error("Error fetching voter slip breakdown:", error);
      message.error("Failed to load voter slip breakdown");
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);
      }
    }
  };

  const totals = useMemo(() => {
    return data.reduce(
      (acc, row) => {
        acc.partVoters += row.totalPartVoters;
        acc.unique += row.uniqueVoterSlipCount;
        acc.total += row.totalVoterSlipCount;
        return acc;
      },
      { partVoters: 0, unique: 0, total: 0 }
    );
  }, [data]);

  const getExportRows = () => {
    return data.map((row) => ({
      "Part No": row.partLabel,
      "Total Part Voters": row.totalPartVoters,
      "Unique Voter Slip Count": formatCountWithPercent(
        row.uniqueVoterSlipCount,
        row.totalPartVoters
      ),
      "Total Voter Slip Count": formatCountWithPercent(
        row.totalVoterSlipCount,
        row.totalPartVoters
      ),
    }));
  };

  const handleExcelExport = async () => {
    if (!data.length) {
      message.warning("No data available to export.");
      return;
    }

    try {
      setExporting(true);
      const exportData = getExportRows();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Voter Slip Breakdown");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });
      const dateStr = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
      const metricLabel = metricType === "unique" ? "unique" : "total";
      saveAs(blob, `Voter_Slip_Breakdown_${metricLabel}_${dateStr}.xlsx`);
      message.success("Excel exported successfully.");
    } catch (error) {
      console.error("Excel export failed:", error);
      message.error("Failed to export Excel file.");
    } finally {
      setExporting(false);
    }
  };

  const handlePdfExport = async () => {
    if (!data.length) {
      message.warning("No data available to export.");
      return;
    }

    try {
      setExporting(true);
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const dateStr = new Date().toLocaleDateString("en-IN");
      doc.setFontSize(16);
      doc.text(
        metricType === "unique"
          ? "Unique Voter Slip Count by Part"
          : "Total Voter Slip Count by Part",
        doc.internal.pageSize.width / 2,
        36,
        { align: "center" }
      );
      doc.setFontSize(11);
      doc.text(`Date: ${dateStr}`, doc.internal.pageSize.width / 2, 54, {
        align: "center",
      });

      autoTable(doc, {
        head: [["Part No", "Total Part Voters", "Unique Voter Slip Count", "Total Voter Slip Count"]],
        body: data.map((row) => [
          row.partLabel,
          row.totalPartVoters.toLocaleString("en-IN"),
          formatCountWithPercent(row.uniqueVoterSlipCount, row.totalPartVoters),
          formatCountWithPercent(row.totalVoterSlipCount, row.totalPartVoters),
        ]),
        startY: 70,
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      const metricLabel = metricType === "unique" ? "unique" : "total";
      doc.save(`Voter_Slip_Breakdown_${metricLabel}_${dateStr.replace(/\//g, "-")}.pdf`);
      message.success("PDF exported successfully.");
    } catch (error) {
      console.error("PDF export failed:", error);
      message.error("Failed to export PDF file.");
    } finally {
      setExporting(false);
    }
  };

  const formatCountWithPercent = (count: number, totalPartVoters: number) => {
    const percentage = totalPartVoters > 0 ? (count / totalPartVoters) * 100 : 0;
    const formattedPercentage = Number.isFinite(percentage)
      ? percentage.toFixed(2).replace(/\.00$/, "")
      : "0";
    return `${count.toLocaleString("en-IN")} (${formattedPercentage}%)`;
  };

  const columns = [
    {
      title: "Part No",
      dataIndex: "partLabel",
      key: "partNumber",
      width: 110,
      fixed: "left" as const,
    },
    {
      title: "Total Part Voters",
      dataIndex: "totalPartVoters",
      key: "totalPartVoters",
      width: 180,
      render: (count: number) => <span>{count.toLocaleString("en-IN")}</span>,
      sorter: (a: PartData, b: PartData) => a.totalPartVoters - b.totalPartVoters,
    },
    {
      title: "Unique Voter Slip Count",
      dataIndex: "uniqueVoterSlipCount",
      key: "uniqueVoterSlipCount",
      width: 220,
      render: (count: number, record: PartData) => (
        <span style={{ color: metricType === "unique" ? "#2563EB" : undefined, fontWeight: metricType === "unique" ? 700 : 500 }}>
          {formatCountWithPercent(count, record.totalPartVoters)}
        </span>
      ),
      sorter: (a: PartData, b: PartData) => a.uniqueVoterSlipCount - b.uniqueVoterSlipCount,
    },
    {
      title: "Total Voter Slip Count",
      dataIndex: "totalVoterSlipCount",
      key: "totalVoterSlipCount",
      width: 220,
      render: (count: number, record: PartData) => (
        <span style={{ color: metricType === "total" ? "#2563EB" : undefined, fontWeight: metricType === "total" ? 700 : 500 }}>
          {formatCountWithPercent(count, record.totalPartVoters)}
        </span>
      ),
      sorter: (a: PartData, b: PartData) => a.totalVoterSlipCount - b.totalVoterSlipCount,
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span>
            {metricType === "unique" ? "Unique Voter Slip Count by Part" : "Total Voter Slip Count by Part"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              icon={<FileExcelOutlined />}
              disabled={loading || exporting || !data.length}
              onClick={handleExcelExport}
            >
              Excel
            </Button>
            <Button
              icon={<FilePdfOutlined />}
              disabled={loading || exporting || !data.length}
              onClick={handlePdfExport}
            >
              PDF
            </Button>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnClose
    >
      <div style={{ marginBottom: 16, padding: "12px 16px", background: "#F3F4F6", borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-around", fontSize: 16, fontWeight: 600 }}>
          <div>
            Total Part Voters: <span style={{ color: "#7C3AED" }}>{totals.partVoters.toLocaleString("en-IN")}</span>
          </div>
          <div>
            Unique Voter Slip Count: <span style={{ color: "#2563EB" }}>{totals.unique.toLocaleString("en-IN")}</span>
          </div>
          <div>
            Total Voter Slip Count: <span style={{ color: "#059669" }}>{totals.total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="partNumber"
          pagination={false}
          scroll={{ y: 420 }}
          bordered
          size="small"
        />
      </Spin>
    </Modal>
  );
};

export default VoterSlipBreakdownModal;
