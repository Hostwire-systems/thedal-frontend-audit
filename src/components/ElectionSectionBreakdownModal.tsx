import React, { useEffect, useMemo, useRef, useState } from "react";
import { Checkbox, Modal, Table, Button, message } from "antd";
import { FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ElectionSectionBreakdownRow,
  getElectionSectionBreakdown,
} from "../api/reportingApi";

interface ElectionSectionBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  electionId: number;
  partNumbers?: number[];
}

const ElectionSectionBreakdownModal: React.FC<
  ElectionSectionBreakdownModalProps
> = ({ visible, onClose, electionId, partNumbers }) => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showGenderBreakdown, setShowGenderBreakdown] = useState(false);
  const [data, setData] = useState<ElectionSectionBreakdownRow[]>([]);
  const latestRequestRef = useRef(0);
  const partNumbersKey = partNumbers ? JSON.stringify(partNumbers) : "";

  useEffect(() => {
    if (!visible || !electionId) {
      return;
    }

    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    void fetchData(requestId);
  }, [visible, electionId, partNumbersKey]);

  const fetchData = async (requestId: number) => {
    setLoading(true);
    try {
      const rows = await getElectionSectionBreakdown(electionId, partNumbers);
      if (requestId !== latestRequestRef.current) {
        return;
      }

      setData(rows || []);
    } catch (error) {
      console.error("Failed to load election section breakdown:", error);
      message.error("Failed to load section breakdown");
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);
      }
    }
  };

  const totals = useMemo(() => {
    return data.reduce(
      (acc, row) => {
        acc.maleVotes += row.maleVotes || 0;
        acc.femaleVotes += row.femaleVotes || 0;
        acc.otherVotes += row.otherVotes || 0;
        acc.totalVotes += row.totalVotes || 0;
        return acc;
      },
      { maleVotes: 0, femaleVotes: 0, otherVotes: 0, totalVotes: 0 }
    );
  }, [data]);

  const columns = useMemo(() => {
    const baseColumns: any[] = [
      {
        title: "Part No",
        dataIndex: "partNo",
        key: "partNo",
        width: 110,
        sorter: (a: ElectionSectionBreakdownRow, b: ElectionSectionBreakdownRow) =>
          a.partNo - b.partNo,
      },
      {
        title: "Section No",
        dataIndex: "sectionNo",
        key: "sectionNo",
        width: 130,
        sorter: (a: ElectionSectionBreakdownRow, b: ElectionSectionBreakdownRow) =>
          a.sectionNo - b.sectionNo,
      },
      {
        title: "Section Name English",
        dataIndex: "sectionNameEnglish",
        key: "sectionNameEnglish",
        width: 240,
        render: (value: string | null | undefined) => value || "-",
      },
      {
        title: "Section Name L1",
        dataIndex: "sectionNameL1",
        key: "sectionNameL1",
        width: 240,
        render: (value: string | null | undefined) => value || "-",
      },
    ];

    if (showGenderBreakdown) {
      baseColumns.push(
        {
          title: "Male",
          dataIndex: "maleVotes",
          key: "maleVotes",
          width: 120,
          align: "right",
          sorter: (a: ElectionSectionBreakdownRow, b: ElectionSectionBreakdownRow) =>
            a.maleVotes - b.maleVotes,
          render: (value: number) => value.toLocaleString("en-IN"),
        },
        {
          title: "Female",
          dataIndex: "femaleVotes",
          key: "femaleVotes",
          width: 120,
          align: "right",
          sorter: (a: ElectionSectionBreakdownRow, b: ElectionSectionBreakdownRow) =>
            a.femaleVotes - b.femaleVotes,
          render: (value: number) => value.toLocaleString("en-IN"),
        },
        {
          title: "Others",
          dataIndex: "otherVotes",
          key: "otherVotes",
          width: 120,
          align: "right",
          sorter: (a: ElectionSectionBreakdownRow, b: ElectionSectionBreakdownRow) =>
            a.otherVotes - b.otherVotes,
          render: (value: number) => value.toLocaleString("en-IN"),
        }
      );
    }

    baseColumns.push({
      title: "Total Votes",
      dataIndex: "totalVotes",
      key: "totalVotes",
      width: 140,
      align: "right",
      sorter: (a: ElectionSectionBreakdownRow, b: ElectionSectionBreakdownRow) =>
        a.totalVotes - b.totalVotes,
      render: (value: number) => value.toLocaleString("en-IN"),
    });

    return baseColumns;
  }, [showGenderBreakdown]);

  const exportRows = useMemo(() => {
    return data.map((row) => {
      const baseRow: Record<string, string | number> = {
        "Part No": row.partNo,
        "Section No": row.sectionNo,
        "Section Name English": row.sectionNameEnglish || "",
        "Section Name L1": row.sectionNameL1 || "",
      };

      if (showGenderBreakdown) {
        baseRow.Male = row.maleVotes;
        baseRow.Female = row.femaleVotes;
        baseRow.Others = row.otherVotes;
      }

      baseRow["Total Votes"] = row.totalVotes;
      return baseRow;
    });
  }, [data, showGenderBreakdown]);

  const handleExcelExport = async () => {
    if (!data.length) {
      message.warning("No data available to export.");
      return;
    }

    try {
      setExporting(true);
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Section Breakdown");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });
      const dateStr = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
      saveAs(blob, `Election_Section_Breakdown_${dateStr}.xlsx`);
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
      const head = [Object.keys(exportRows[0])];
      const body = exportRows.map((row) =>
        Object.values(row).map((value) =>
          typeof value === "number" ? value.toLocaleString("en-IN") : value
        )
      );

      doc.setFontSize(16);
      doc.text(
        "Election Section Breakdown",
        doc.internal.pageSize.width / 2,
        36,
        { align: "center" }
      );
      doc.setFontSize(11);
      doc.text(`Date: ${dateStr}`, doc.internal.pageSize.width / 2, 54, {
        align: "center",
      });

      autoTable(doc, {
        head,
        body,
        startY: 70,
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      doc.save(`Election_Section_Breakdown_${dateStr.replace(/\//g, "-")}.pdf`);
      message.success("PDF exported successfully.");
    } catch (error) {
      console.error("PDF export failed:", error);
      message.error("Failed to export PDF file.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title="Total Section Breakdown"
      footer={null}
      width={showGenderBreakdown ? 1380 : 1120}
      destroyOnClose
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Checkbox
          checked={showGenderBreakdown}
          onChange={(event) => setShowGenderBreakdown(event.target.checked)}
        >
          Gender
        </Checkbox>

        <div style={{ display: "flex", gap: 8 }}>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => void handleExcelExport()}
            loading={exporting}
          >
            Export Excel
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => void handlePdfExport()}
            loading={exporting}
          >
            Export PDF
          </Button>
        </div>
      </div>

      <Table<ElectionSectionBreakdownRow>
        rowKey={(record) => `${record.partNo}-${record.sectionNo}`}
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 25, showSizeChanger: true }}
        scroll={{ x: showGenderBreakdown ? 1220 : 980, y: 520 }}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={showGenderBreakdown ? 4 : 4}>
              <strong>Total</strong>
            </Table.Summary.Cell>
            {showGenderBreakdown && (
              <>
                <Table.Summary.Cell index={1} align="right">
                  <strong>{totals.maleVotes.toLocaleString("en-IN")}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <strong>{totals.femaleVotes.toLocaleString("en-IN")}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <strong>{totals.otherVotes.toLocaleString("en-IN")}</strong>
                </Table.Summary.Cell>
              </>
            )}
            <Table.Summary.Cell index={4} align="right">
              <strong>{totals.totalVotes.toLocaleString("en-IN")}</strong>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Modal>
  );
};

export default ElectionSectionBreakdownModal;