import React, { useEffect, useMemo, useState } from "react";
import { Modal, Table, Spin, message, Button } from "antd";
import { FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import {
  type ElectionStatsAggregate,
  getElectionStatsPartWise,
} from "../api/reportingApi";
import { getPartsApi } from "../api/partApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface StarVotersBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  electionId: number;
}

interface PartData {
  partNumber: number;
  partLabel: string;
  maleStarVoters: number;
  femaleStarVoters: number;
  otherStarVoters: number;
  totalStarVoters: number;
}

const StarVotersBreakdownModal: React.FC<StarVotersBreakdownModalProps> = ({
  visible,
  onClose,
  electionId,
}) => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<PartData[]>([]);

  useEffect(() => {
    if (visible && electionId) {
      fetchData();
    }
  }, [visible, electionId]);

  const mapStatsToTableData = (statsArray: ElectionStatsAggregate[]): PartData[] =>
    statsArray
      .filter((stat: ElectionStatsAggregate) => !!stat.partNo)
      .map((stat: ElectionStatsAggregate) => {
        const partNumber = parseInt(stat.partNo || "0");

        return {
          partNumber,
          partLabel: String(partNumber),
          maleStarVoters: stat.maleStarVoters || 0,
          femaleStarVoters: stat.femaleStarVoters || 0,
          otherStarVoters: stat.transgenderStarVoters || 0,
          totalStarVoters:
            stat.totalStarVoters ||
            stat.starVoters ||
            (stat.maleStarVoters || 0) +
              (stat.femaleStarVoters || 0) +
              (stat.transgenderStarVoters || 0),
        };
      })
      .sort((a, b) => a.partNumber - b.partNumber);

  const fetchData = async () => {
    setLoading(true);
    try {
      const lightweightStats = await getElectionStatsPartWise(electionId);
      let tableData = mapStatsToTableData(lightweightStats);

      // Backward-compatible fallback for older backend behavior that returns only
      // election-wide stats unless explicit part numbers are passed.
      if (!tableData.length) {
        const partsResponse = await getPartsApi(electionId);
        const partNumbers = (partsResponse.data || [])
          .map((part: { partNo?: string }) => parseInt(part.partNo || "", 10))
          .filter((partNo: number) => Number.isFinite(partNo));

        if (partNumbers.length) {
          const explicitPartStats = await getElectionStatsPartWise(electionId, partNumbers);
          tableData = mapStatsToTableData(explicitPartStats);
        }
      }

      setData(tableData);
    } catch (error: any) {
      console.error("Error fetching star voters breakdown:", error);
      message.error("Failed to load star voters breakdown");
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(
    () =>
      data.reduce(
        (acc, row) => {
          acc.male += row.maleStarVoters;
          acc.female += row.femaleStarVoters;
          acc.other += row.otherStarVoters;
          acc.total += row.totalStarVoters;
          return acc;
        },
        { male: 0, female: 0, other: 0, total: 0 }
      ),
    [data]
  );

  const getExportRows = () =>
    data.map((row) => ({
      "Part No": row.partLabel,
      "Male Star": row.maleStarVoters,
      "Female Star": row.femaleStarVoters,
      "Other Star": row.otherStarVoters,
      "Total Star": row.totalStarVoters,
    }));

  const handleExcelExport = async () => {
    if (!data.length) {
      message.warning("No data available to export.");
      return;
    }

    try {
      setExporting(true);
      const worksheet = XLSX.utils.json_to_sheet(getExportRows());
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Star Voters Breakdown");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });
      const dateStr = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
      saveAs(blob, `Star_Voters_Breakdown_${dateStr}.xlsx`);
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
      doc.text("Star Voters Breakdown by Part", doc.internal.pageSize.width / 2, 36, {
        align: "center",
      });
      doc.setFontSize(11);
      doc.text(`Date: ${dateStr}`, doc.internal.pageSize.width / 2, 54, {
        align: "center",
      });

      autoTable(doc, {
        head: [["Part No", "Male Star", "Female Star", "Other Star", "Total Star"]],
        body: data.map((row) => [
          row.partLabel,
          row.maleStarVoters.toLocaleString("en-IN"),
          row.femaleStarVoters.toLocaleString("en-IN"),
          row.otherStarVoters.toLocaleString("en-IN"),
          row.totalStarVoters.toLocaleString("en-IN"),
        ]),
        startY: 70,
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      doc.save(`Star_Voters_Breakdown_${dateStr.replace(/\//g, "-")}.pdf`);
      message.success("PDF exported successfully.");
    } catch (error) {
      console.error("PDF export failed:", error);
      message.error("Failed to export PDF file.");
    } finally {
      setExporting(false);
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
      title: "Male Star",
      dataIndex: "maleStarVoters",
      key: "maleStarVoters",
      width: 150,
      render: (count: number) => count.toLocaleString("en-IN"),
    },
    {
      title: "Female Star",
      dataIndex: "femaleStarVoters",
      key: "femaleStarVoters",
      width: 150,
      render: (count: number) => count.toLocaleString("en-IN"),
    },
    {
      title: "Other Star",
      dataIndex: "otherStarVoters",
      key: "otherStarVoters",
      width: 150,
      render: (count: number) => count.toLocaleString("en-IN"),
    },
    {
      title: "Total Star",
      dataIndex: "totalStarVoters",
      key: "totalStarVoters",
      width: 150,
      render: (count: number) => count.toLocaleString("en-IN"),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span>Star Voters Breakdown by Part</span>
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
        <div style={{ display: "flex", justifyContent: "space-around", fontSize: 16, fontWeight: 600, gap: 12, flexWrap: "wrap" }}>
          <div>
            Male Star: <span style={{ color: "#2563EB" }}>{totals.male.toLocaleString("en-IN")}</span>
          </div>
          <div>
            Female Star: <span style={{ color: "#DB2777" }}>{totals.female.toLocaleString("en-IN")}</span>
          </div>
          <div>
            Other Star: <span style={{ color: "#7C3AED" }}>{totals.other.toLocaleString("en-IN")}</span>
          </div>
          <div>
            Total Star: <span style={{ color: "#059669" }}>{totals.total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <Spin spinning={loading || exporting} tip={exporting ? "Generating file..." : undefined}>
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

export default StarVotersBreakdownModal;
