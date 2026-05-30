import React, { useEffect, useMemo, useState } from "react";
import { Modal, Row, Col, Select, Table, Empty, Button, Spin } from "antd";
import { getSchemesPartWiseCount } from "../api/benefitSchemeApi";

interface PartRow {
  partNo: number;
  availedCount: number;
  unavailedCount: number;
}

interface Scheme {
  schemeId: string;
  schemeName: string;
  parts: PartRow[];
}

interface SchemePartSummaryData {
  electionId: string;
  schemes: Scheme[];
}

export interface SchemePartSummaryModalProps {
  open: boolean;
  onClose: () => void;
  data: SchemePartSummaryData;
}

const SchemePartSummaryModal: React.FC<SchemePartSummaryModalProps> = ({
  open,
  onClose,
  data,
}) => {
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | undefined>();
  const [selectedParts, setSelectedParts] = useState<number[]>([]);
  // Removed Top 10 Lowest toggle per requirement
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchedData, setFetchedData] = useState<SchemePartSummaryData | null>(null);

  useEffect(() => {
    if (open) {
      const hasSchemes = Array.isArray(data?.schemes) && data.schemes.length > 0;
      const first = hasSchemes ? data.schemes[0]?.schemeId : undefined;
      setSelectedSchemeId(first);
      setSelectedParts([]);
      // nothing to reset for removed toggle
    }
  }, [open, data]);

  useEffect(() => {
    const eid = data?.electionId;
    const shouldFetch = open && eid && (!data?.schemes || data.schemes.length === 0);
    if (!shouldFetch) return;
    let active = true;
    const run = async () => {
      try {
        setLoading(true);
        const resp = await getSchemesPartWiseCount(Number(eid));
        console.log("scheme resp", resp);
        const schemes = Array.isArray(resp?.schemes) ? resp.schemes : [];
        if (!active) return;
        setFetchedData({ electionId: String(eid), schemes });
        if (schemes.length > 0) {
          setSelectedSchemeId(schemes[0].schemeId);
        }
      } catch (e) {
        console.error("Failed to fetch schemes summary:", e);
        setFetchedData({ electionId: String(eid), schemes: [] });
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [open, data?.electionId]);

  const effectiveData = fetchedData && fetchedData.schemes.length > 0 ? fetchedData : data;

  const selectedScheme = useMemo(() => {
    return effectiveData?.schemes?.find((s) => s.schemeId === selectedSchemeId);
  }, [effectiveData, selectedSchemeId]);

  const computedRows = useMemo(() => {
    const parts = selectedScheme?.parts ?? [];
    const rows = parts.map((p) => {
      const total = (p.availedCount || 0) + (p.unavailedCount || 0);
      const percentage =
        total > 0 ? Number(((p.availedCount / total) * 100).toFixed(2)) : 0;
      return { ...p, percentage };
    });
    return rows;
  }, [selectedScheme]);

  const filteredRows = useMemo(() => {
    let rows = computedRows;
    if (selectedParts.length > 0) {
      rows = rows.filter((r) => selectedParts.includes(r.partNo));
    }
    return rows;
  }, [computedRows, selectedParts]);

  const totals = useMemo(() => {
    const totalAvailed = filteredRows.reduce((acc, r) => acc + (r.availedCount || 0), 0);
    const totalUnavailed = filteredRows.reduce((acc, r) => acc + (r.unavailedCount || 0), 0);
    const denom = totalAvailed + totalUnavailed;
    const overallPct = denom > 0 ? Number(((totalAvailed / denom) * 100).toFixed(2)) : 0;
    return { totalAvailed, totalUnavailed, overallPct };
  }, [filteredRows]);

  const columns = [
    {
      title: "Part No",
      dataIndex: "partNo",
      sorter: (a: any, b: any) => a.partNo - b.partNo,
      width: 120,
    },
    {
      title: "Availed",
      dataIndex: "availedCount",
      sorter: (a: any, b: any) => a.availedCount - b.availedCount,
      width: 140,
    },
    {
      title: "Unavailed",
      dataIndex: "unavailedCount",
      sorter: (a: any, b: any) => a.unavailedCount - b.unavailedCount,
      width: 160,
    },
    {
      title: "Availed %",
      dataIndex: "percentage",
      sorter: (a: any, b: any) => a.percentage - b.percentage,
      render: (value: number) => `${value}%`,
      width: 140,
    },
  ];

  const handleExportCsv = () => {
    const header = ["schemeId", "schemeName", "partNo", "availedCount", "unavailedCount", "percentage"];
    const lines = [header.join(",")];

    (effectiveData?.schemes || []).forEach((scheme) => {
      (scheme.parts || []).forEach((p) => {
        const total = (p.availedCount || 0) + (p.unavailedCount || 0);
        const pct = total > 0 ? Number(((p.availedCount / total) * 100).toFixed(2)) : 0;
        // Escape scheme name to handle commas
        const escapedName = `"${(scheme.schemeName || "").replace(/"/g, '""')}"`;
        lines.push([scheme.schemeId, escapedName, p.partNo, p.availedCount, p.unavailedCount, pct].join(","));
      });
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    const dateStr = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
    a.href = URL.createObjectURL(blob);
    a.download = `all_schemes_part_summary_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={960}
      title="Scheme Part Summary"
      bodyStyle={{ maxHeight: "70vh", overflow: "auto" }}
      destroyOnClose
    >
      <Row gutter={[12, 12]}>
        <Col span={24}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Select
              placeholder="Select Scheme"
              value={selectedSchemeId}
              onChange={(val) => setSelectedSchemeId(val)}
              options={(effectiveData?.schemes || []).map((s) => ({
                label: s.schemeName,
                value: s.schemeId,
              }))}
              style={{ minWidth: 260 }}
            />
            <Select
              mode="multiple"
              allowClear
              placeholder="Select Parts"
              value={selectedParts}
              onChange={(vals) => setSelectedParts(vals)}
              options={(selectedScheme?.parts || []).map((p) => ({
                label: `Part ${p.partNo}`,
                value: p.partNo,
              }))}
              optionFilterProp="label"
              virtual
              style={{ minWidth: 280, flex: 1 }}
              maxTagCount="responsive"
              showSearch
            />
            <Button 
              onClick={handleExportCsv}
              disabled={loading || (effectiveData?.schemes || []).length === 0}
            >
              Export All Schemes (CSV)
            </Button>
          </div>
        </Col>

        <Col span={24}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Spin />
            </div>
          ) : !selectedScheme ? (
            <Empty description="No scheme selected" />
          ) : (selectedScheme.parts || []).length === 0 ? (
            <Empty description="No parts found for selected scheme" />
          ) : (
            <Table
              size="small"
              rowKey="partNo"
              columns={columns as any}
              dataSource={filteredRows}
              pagination={{ pageSize: 20 }}
              scroll={{ y: 400 }}
              rowClassName={(record: any) => {
                if (record.percentage < 20) return "row-low-percentage";
                if (record.percentage > 70) return "row-high-percentage";
                return "";
              }}
            />
          )}
        </Col>

        <Col span={24}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: "#F3F4F6",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            <div>
              Total Availed:{" "}
              <span style={{ color: "#059669" }}>
                {totals.totalAvailed.toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              Total Unavailed:{" "}
              <span style={{ color: "#DC2626" }}>
                {totals.totalUnavailed.toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              Overall %:{" "}
              <span style={{ color: "#2563EB" }}>{totals.overallPct}%</span>
            </div>
          </div>
        </Col>
      </Row>
      <style>
        {`
        .row-low-percentage td { background-color: #fff1f0 !important; }
        .row-high-percentage td { background-color: #f6ffed !important; }
        `}
      </style>
    </Modal>
  );
};

export default SchemePartSummaryModal;
