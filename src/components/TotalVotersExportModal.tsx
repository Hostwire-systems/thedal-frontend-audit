import React, { useState } from "react";
import { Modal, Card, Spin, message } from "antd";
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PartData {
  partNumber: number;
  partName: string;
  maleVoters: number;
  femaleVoters: number;
  othersVoters: number;
  totalVoters: number;
}

interface TotalVotersExportModalProps {
  open: boolean;
  onClose: () => void;
  data: PartData[];
  columns: {
    title: string;
    dataIndex: string;
  }[];
  title: string;
}

const TotalVotersExportModal: React.FC<TotalVotersExportModalProps> = ({
  open,
  onClose,
  data,
  columns,
  title,
}) => {
  const [loading, setLoading] = useState(false);

  const handleExcelExport = async () => {
    if (!data || data.length === 0) {
      message.warning("No data available to export.");
      return;
    }

    try {
      setLoading(true);

      // 1. Filter and map data based on columns
      const exportData = data.map((item) => {
        const row: Record<string, any> = {};
        columns.forEach((col) => {
          // Use the title as the key for the Excel file
          row[col.title] = item[col.dataIndex as keyof PartData];
        });
        return row;
      });

      // 2. Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // 3. Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      // 4. Generate buffer
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      // 5. Create Blob
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });

      // 6. Save file
      const dateStr = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
      saveAs(blob, `Total_Voters_Breakdown_${dateStr}.xlsx`);

      message.success("Excel exported successfully!");
      onClose();
    } catch (error) {
      console.error("Excel export failed:", error);
      message.error("Failed to export Excel file.");
    } finally {
      setLoading(false);
    }
  };

  const handlePdfExport = async () => {
    if (!data || data.length === 0) {
      message.warning("No data available to export.");
      return;
    }

    try {
      setLoading(true);

      // 1. Create jsPDF instance (landscape)
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      // 2. Add Title
      const dateStr = new Date().toLocaleDateString("en-IN");
      
      doc.setFontSize(18);
      doc.text(title, doc.internal.pageSize.width / 2, 40, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(`Date: ${dateStr}`, doc.internal.pageSize.width / 2, 60, { align: "center" });

      // 3. Prepare data for autoTable
      const tableHead = [columns.map((c) => c.title)];
      const tableBody = data.map((item) =>
        columns.map((col) => item[col.dataIndex as keyof PartData])
      );

      // 4. Generate Table
      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 80,
        styles: {
          fontSize: 10,
          cellPadding: 6,
          halign: "right", // Right align numbers by default as requested
        },
        columnStyles: {
          0: { halign: "left" }, // Align Part No/Name to left if needed. Assuming first column is Part No/Name
        },
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      // 5. Save file
      doc.save(`Total_Voters_Breakdown_${dateStr.replace(/\//g, "-")}.pdf`);

      message.success("PDF exported successfully!");
      onClose();
    } catch (error) {
      console.error("PDF export failed:", error);
      message.error("Failed to export PDF file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <DownloadOutlined style={{ fontSize: 20, color: "#52c41a" }} />
          <span>Export Data</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      destroyOnClose
    >
      <Spin spinning={loading} tip="Generating file...">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card
            hoverable
            onClick={!loading ? handleExcelExport : undefined}
            style={{
              border: "2px solid #217346",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <FileExcelOutlined style={{ fontSize: 28, color: "#217346" }} />
              <div>
                <div style={{ fontWeight: 600 }}>Export as Excel</div>
                <div style={{ fontSize: 12, color: "#666" }}>XLSX format</div>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={!loading ? handlePdfExport : undefined}
            style={{
              border: "2px solid #ff4d4f",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <FilePdfOutlined style={{ fontSize: 28, color: "#ff4d4f" }} />
              <div>
                <div style={{ fontWeight: 600 }}>Export as PDF</div>
                <div style={{ fontSize: 12, color: "#666" }}>PDF format</div>
              </div>
            </div>
          </Card>
        </div>
      </Spin>
    </Modal>
  );
};

export default TotalVotersExportModal;
