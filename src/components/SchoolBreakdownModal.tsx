import React, { useEffect, useMemo, useState } from "react";
import { Modal, Table, Spin } from "antd";
import { getPartsApi } from "../api/partApi";

type Props = {
  visible: boolean;
  onClose: () => void;
  electionId?: number;
};

type SchoolRow = {
  key: number;
  serialNo: number;
  schoolName: string;
  totalBooth: number;
  boothNumbers: number[];
};

const normalizeSchoolName = (schoolName?: string | null) => {
  if (!schoolName) return null;
  const normalized = schoolName
    .replace(/\u00A0/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
  return normalized.length > 0 ? normalized : null;
};

const SchoolBreakdownModal: React.FC<Props> = ({ visible, onClose, electionId }) => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SchoolRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!visible || !electionId) return;
      setLoading(true);
      try {
        const response = await getPartsApi(electionId);
        const partsData = response?.data || [];

        const schoolMap = new Map<string, { displayName: string; parts: Set<number> }>();

        partsData.forEach((p: any) => {
          const partNo = parseInt(p.partNo);
          if (!Number.isFinite(partNo)) return;
          const norm = normalizeSchoolName(p.schoolName);
          if (!norm) return;

          if (!schoolMap.has(norm)) {
            schoolMap.set(norm, {
              displayName: (p.schoolName || "").trim() || norm,
              parts: new Set<number>(),
            });
          }
          schoolMap.get(norm)!.parts.add(partNo);
        });

        const data: SchoolRow[] = Array.from(schoolMap.values())
          .map((v, idx) => ({
            key: idx,
            serialNo: idx + 1,
            schoolName: v.displayName,
            totalBooth: v.parts.size,
            boothNumbers: Array.from(v.parts).sort((a, b) => a - b),
          }))
          .sort((a, b) => a.schoolName.localeCompare(b.schoolName))
          .map((v, i) => ({ ...v, serialNo: i + 1 }));

        setRows(data);
      } catch (e) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [visible, electionId]);

  const dataSource = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        boothNumbersText: r.boothNumbers.join(", "),
      })),
    [rows]
  );

  return (
    <Modal
      title="Total School Details"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin tip="Loading school data..." />
        </div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
          No school data available
        </div>
      ) : (
        <Table
          dataSource={dataSource}
          columns={[
            { title: "S.No", dataIndex: "serialNo", key: "serialNo", width: 60, align: "center" },
            { title: "School Name", dataIndex: "schoolName", key: "schoolName", width: 250 },
            { title: "Total Booth", dataIndex: "totalBooth", key: "totalBooth", width: 100, align: "center" },
            { title: "Booth Numbers", dataIndex: "boothNumbersText", key: "boothNumbersText" },
          ]}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} schools` }}
          size="small"
          scroll={{ x: 600 }}
          rowKey={(r) => `${r.schoolName}-${r.serialNo}`}
        />
      )}
    </Modal>
  );
};

export default SchoolBreakdownModal;
