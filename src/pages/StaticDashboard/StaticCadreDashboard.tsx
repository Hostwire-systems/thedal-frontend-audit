import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useLoading } from "../../context/LoadingContext";
import axios from "axios";
import {
  Row,
  Col,
  Card,
  Typography,
  Skeleton,
  Button,
  Modal,
  Table,
  message,
  Spin
} from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import "../cadreDashboard/CadreDashboard.css";
import Item from "antd/es/list/Item";
import { BASE_URL } from "../../config";
import { useCadreDashboard } from "../../hooks/useReportingSlices";
import { usePersistentRefreshTimer } from "../../hooks/usePersistentRefreshTimer";
import { recomputeCadreDashboard } from "../../api/reportingApi";
import { ReloadOutlined } from "@ant-design/icons";
import { parseCadrePerformance } from "../../hooks/useReportingSlices";
import {
  getCadreTopPerformersApi,
  getCadreLowPerformersApi,
} from "../../api/cadreApi";
import RefreshStatusBanner from "../../components/RefreshStatusBanner";

const { Title } = Typography;
const CADRE_AUTO_REFRESH_INTERVAL_MS = 600000;

interface StaticCadreDashboardProps {
  isActive?: boolean;
}

type Stat = {
  label: string;
  value: number;
};

type Stat2 = {
  //coloured cards
  key: MetricKey;
  label: string;
  value: number;
  bgColor: string;
};

type MetricKey =
  | "totalMobileUpdated"
  | "totalDobUpdated"
  | "totalPartyUpdated"
  | "totalCasteUpdated"
  | "totalReligionUpdated"
  | "totalLanguageUpdated";

type CadreMetricDetailRow = {
  key: string;
  cadreName: string;
  cadreNumber: number;
  totalMobileUpdated: number;
  totalDobUpdated: number;
  totalPartyUpdated: number;
  totalCasteUpdated: number;
  totalReligionUpdated: number;
  totalLanguageUpdated: number;
};

type GraphStat = {
  id: number;
  name: string;
  votersCreated: number;
};

const StaticCadreDashboard: React.FC<StaticCadreDashboardProps> = ({
  isActive = false,
}) => {
  const [electionName, setElectionName] = useState<string>("Cadre Dashboard");
  const { isLoading, setLoading } = useLoading();
  const [topTenCadreData, setTopTenCadreData] = useState<any[]>([]);
  const [leastTenCadreData, setLeastTenCadreData] = useState<any[]>([]);
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId,
  );

  const [lastSuccessfulRefreshAt, setLastSuccessfulRefreshAt] = useState<number | null>(() => {
    const stored = localStorage.getItem("dashboard_last_recompute_cadre");
    return stored ? parseInt(stored, 10) : null;
  });
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'refreshing' | 'success' | 'error'>('idle');
  const [performanceState, setPerformanceState] = useState<{
    loading: boolean;
    error: boolean;
    loaded: boolean;
  }>({ loading: false, error: false, loaded: false });

  const formatRefreshTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  // Fetch the election name if needed
  useEffect(() => {
    const fetchElection = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/elections/${selectedElectionId}`,
          {
            headers: {
              "Content-Type": "application/json",
              accept: "*/*",
              Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            },
          },
        );
        if (response.data?.data?.electionName) {
          setElectionName(response.data.data.electionName);
        }
      } catch (error) {
        console.log("Error: ", error);
      }
    };

    fetchElection();
  }, [selectedElectionId]);

  const loadCadrePerformance = useCallback(async () => {
    if (!selectedElectionId) {
      setTopTenCadreData([]);
      setLeastTenCadreData([]);
      setPerformanceState({ loading: false, error: false, loaded: false });
      return;
    }

    setPerformanceState((currentState) => ({
      loading: true,
      error: false,
      loaded: currentState.loaded,
    }));

    try {
      const [topResponse, lowResponse] = await Promise.all([
        getCadreTopPerformersApi(Number(selectedElectionId)),
        getCadreLowPerformersApi(Number(selectedElectionId)),
      ]);

      const topData = Array.isArray(topResponse?.data)
        ? topResponse.data
        : [];

      const lowData = Array.isArray(lowResponse?.data)
        ? lowResponse.data
        : [];

      setTopTenCadreData(
        topData.map((item: any) => ({
          name: item.userName,
          value: item.totalVoterCreated,
        })),
      );

      setLeastTenCadreData(
        lowData.map((item: any) => ({
          name: item.userName,
          value: item.totalVoterCreated,
        })),
      );

      setPerformanceState({ loading: false, error: false, loaded: true });
    } catch (error) {
      console.error("Failed to fetch cadre performance", error);
      setPerformanceState({ loading: false, error: true, loaded: false });
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (!selectedElectionId) return;

    void loadCadrePerformance();
  }, [selectedElectionId, loadCadrePerformance]);

  //Cadre Details via reporting slice
  const cadreSlice = useCadreDashboard(Number(selectedElectionId) || 0, undefined);
  const [metricModalVisible, setMetricModalVisible] = useState(false);
  const [metricModalLoading, setMetricModalLoading] = useState(false);
  const [selectedMetricKey, setSelectedMetricKey] =
    useState<MetricKey>("totalMobileUpdated");
  const [metricRows, setMetricRows] = useState<CadreMetricDetailRow[]>([]);
  const [recomputing, setRecomputing] = useState(false);

  // Update refresh status based on the combined tab state so the banner only
  // marks success when both the aggregate slice and performer datasets finish.
  useEffect(() => {
    if (!selectedElectionId) {
      setRefreshStatus('idle');
      setLastSuccessfulRefreshAt(null);
      return;
    }

    if (recomputing || cadreSlice.loading || performanceState.loading) {
      setRefreshStatus('refreshing');
    } else if (cadreSlice.error || performanceState.error) {
      setRefreshStatus('error');
    } else if (cadreSlice.data && performanceState.loaded) {
      setRefreshStatus('success');
    }
  }, [
    selectedElectionId,
    recomputing,
    cadreSlice.loading,
    cadreSlice.error,
    cadreSlice.data,
    performanceState.loading,
    performanceState.error,
    performanceState.loaded,
  ]);

  const metricColumnTitleMap: Record<MetricKey, string> = {
    totalMobileUpdated: "No. of Mobile Number Updated",
    totalDobUpdated: "No. of DoB Updated",
    totalPartyUpdated: "No. of Party Updated",
    totalCasteUpdated: "No. of Caste Updated",
    totalReligionUpdated: "No. of Religion Updated",
    totalLanguageUpdated: "No. of Language Updated",
  };
  const runCadreRefresh = useCallback(async () => {
    if (!selectedElectionId || recomputing) return;

    try {
      setRecomputing(true);
      await recomputeCadreDashboard(Number(selectedElectionId));
      await Promise.all([cadreSlice.reload(), loadCadrePerformance()]);
    } finally {
      setRecomputing(false);
    }
  }, [selectedElectionId, recomputing, cadreSlice, loadCadrePerformance]);

  const handleRecompute = async () => {
    await runCadreRefresh();
  };

  usePersistentRefreshTimer({
    enabled: !!isActive && !!selectedElectionId && !recomputing,
    intervalMs: CADRE_AUTO_REFRESH_INTERVAL_MS,
    storageKey: "dashboard_last_recompute_cadre",
    activationKey: selectedElectionId,
    onTick: runCadreRefresh,
    onTimestampUpdate: setLastSuccessfulRefreshAt,
  });

  const refreshBannerTitle =
    refreshStatus === 'refreshing'
      ? 'Cadre dashboard recompute in progress'
      : refreshStatus === 'success'
      ? 'Cadre dashboard is up to date'
      : refreshStatus === 'error'
      ? 'Cadre dashboard refresh needs attention'
      : 'Cadre dashboard auto-refresh is ready';

  const refreshBannerDetail =
    refreshStatus === 'refreshing'
      ? `Refreshing cadre aggregates and performer lists. Last successful refresh: ${formatRefreshTime(lastSuccessfulRefreshAt)}.`
      : refreshStatus === 'success'
      ? `Last refreshed at ${formatRefreshTime(lastSuccessfulRefreshAt)}. Auto-refresh runs every 10 minutes.`
      : refreshStatus === 'error'
      ? `The latest cadre refresh did not complete successfully. Last successful refresh: ${formatRefreshTime(lastSuccessfulRefreshAt)}.`
      : 'Auto-refresh will recompute and reload this dashboard every 10 minutes while you stay on this tab.';

  const cadreData1: Stat[] = [
    { label: "No. of Cadres", value: cadreSlice.data?.totalCadres || 0 },
    { label: "Cadres Logged", value: cadreSlice.data?.cadresLogged || 0 },
    {
      label: "Cadres not Logged",
      value: cadreSlice.data?.cadresNotLogged || 0,
    },
    { label: "Booths Assigned", value: cadreSlice.data?.boothsAssigned || 0 },
  ];

  const cadreData2: Stat2[] = [
    {
      key: "totalMobileUpdated",
      label: "Total Mobile Nos. Updated",
      value: cadreSlice.data?.totalMobileUpdated || 0,
      bgColor: "#E4E9BE",
    },
    {
      key: "totalDobUpdated",
      label: "Total DoBs Updated",
      value: cadreSlice.data?.totalDobUpdated || 0,
      bgColor: "#E3F5FF",
    },
    {
      key: "totalPartyUpdated",
      label: "Total Parties Updated",
      value: cadreSlice.data?.totalPartyUpdated || 0,
      bgColor: "#F8EDED",
    },
    {
      key: "totalCasteUpdated",
      label: "Total Castes Updated",
      value: cadreSlice.data?.totalCasteUpdated || 0,
      bgColor: "#FFE5CA",
    },
    {
      key: "totalReligionUpdated",
      label: "Total Religions Updated",
      value: cadreSlice.data?.totalReligionUpdated || 0,
      bgColor: "#F8F0E5",
    },
    {
      key: "totalLanguageUpdated",
      label: "Total Languages Updated",
      value: cadreSlice.data?.totalLanguageUpdated || 0,
      bgColor: "#D2FBC5",
    },
  ];

  const openMetricModal = async (metricKey: MetricKey) => {
    if (!selectedElectionId) return;
    setSelectedMetricKey(metricKey);
    setMetricModalVisible(true);
    setMetricModalLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/reporting/api/aggregates/cadre/${selectedElectionId}/details`,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
        },
      );

      const rows = Array.isArray(response.data) ? response.data : [];
      const mappedRows: CadreMetricDetailRow[] = rows.map(
        (row: any, index: number) => ({
          key: String(row.cadreNumber ?? row.userId ?? index),
          cadreName:
            row.cadreName || `Cadre ${row.cadreNumber ?? row.userId ?? "-"}`,
          cadreNumber: Number(row.cadreNumber ?? row.userId ?? 0),
          totalMobileUpdated: Number(row.totalMobileUpdated ?? 0),
          totalDobUpdated: Number(row.totalDobUpdated ?? 0),
          totalPartyUpdated: Number(row.totalPartyUpdated ?? 0),
          totalCasteUpdated: Number(row.totalCasteUpdated ?? 0),
          totalReligionUpdated: Number(row.totalReligionUpdated ?? 0),
          totalLanguageUpdated: Number(row.totalLanguageUpdated ?? 0),
        }),
      );

      setMetricRows(mappedRows);
    } catch (error) {
      console.error("Failed to fetch cadre metric details", error);
      message.error("Failed to load cadre metric details");
      setMetricRows([]);
    } finally {
      setMetricModalLoading(false);
    }
  };

  // legacy effect removed (replaced by reporting slice)

  // legacy performance fetch removed (provided by reporting slice)

  const barColors = [
    "#95A4FC",
    "#BAEDBD",
    "#1C1C1C",
    "#B1E3FF",
    "#A8C5DA",
    "#A1E3CB",
  ];

  // Top row stats
  const topRowStats = [
    { value: 400, label: "No of Cadre" },
    { value: 350, label: "Cadre Logged" },
    { value: 50, label: "Cadre not Logged" },
    { value: 100, label: "Booths assigned" },
  ];

  const textColor = "#2D3748";
  const numberStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 700,
    color: textColor,
    marginBottom: "4px",
    textAlign: "center",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    color: textColor,
    opacity: 0.8,
    textAlign: "center",
  };
  const dividerStyle: React.CSSProperties = {
    borderRight: "1px solid #E2E8F0",
    padding: "0 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };
  const mobileStyle: React.CSSProperties = {
    borderRight: "none",
    padding: "10px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  };

  // Second row stats data
  const secondRowStats = [
    { value: 435, label: "Total Mobile number updated", bgColor: "#E3F5FF" },
    { value: 50, label: "Total Religion updated", bgColor: "#F8EDED" },
    { value: 35, label: "Total Caste updated", bgColor: "#FFE5CA" },
    { value: 35, label: "Total Date of Birth updated", bgColor: "#F8F0E5" },
    { value: 40, label: "Total Party updated", bgColor: "#E4E9BE" },
    { value: 10, label: "Total Language updated", bgColor: "#D2FBC5" },
  ];

  const secondRowCardStyle = {
    flex: 1,
    height: "140px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
  } as React.CSSProperties;

  const scrollBarStyling = `
  @media (max-width: 768px) {
    .fade-in::-webkit-scrollbar {
      height: 8px; 
    }
    .fade-in::-webkit-scrollbar-thumb {
      background: #C4C4C4; 
      border-radius: 4px;
    }
    .fade-in::-webkit-scrollbar-track {
      background: #F0F0F0;
    }
    .fade-in {
      padding-bottom: 8px; 
    }
  }
`;

  const secondRowValueStyle: React.CSSProperties = {
    fontWeight: "600",
    color: "#000",
    fontSize: "24px",
    marginBottom: "4px",
  };

  const secondRowLabelStyle: React.CSSProperties = {
    fontWeight: 500,
    color: "#000",
    fontSize: "14px",
    opacity: 0.8,
    textAlign: "center",
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const metricModalColumns = [
    {
      title: "Cadre Name",
      dataIndex: "cadreName",
      key: "cadreName",
    },
    {
      title: "Cadre Number",
      dataIndex: "cadreNumber",
      key: "cadreNumber",
      width: 160,
    },
    {
      title: metricColumnTitleMap[selectedMetricKey],
      key: "metricValue",
      width: 260,
      render: (_: any, record: CadreMetricDetailRow) =>
        record[selectedMetricKey]?.toLocaleString("en-IN") || "0",
      sorter: (a: CadreMetricDetailRow, b: CadreMetricDetailRow) =>
        (a[selectedMetricKey] || 0) - (b[selectedMetricKey] || 0),
      defaultSortOrder: "descend" as const,
    },
  ];

  return (
    <div
      className="main-container"
      style={{ background: "#FAFAFA", padding: "20px" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title
          level={5}
          style={{
            fontWeight: "700",
            marginBottom: "4px",
            fontFamily: "sans-serif",
          }}
        >
          Election Name : {electionName}
        </Title>
        <RefreshStatusBanner
          status={refreshStatus}
          title={refreshBannerTitle}
          detail={refreshBannerDetail}
          busy={refreshStatus === 'refreshing' || recomputing}
        />
        <Button
          icon={<ReloadOutlined spin={recomputing} />}
          loading={recomputing}
          size="small"
          onClick={handleRecompute}
        >
          Refresh
        </Button>
      </div>

      {/* Top row stats */}
      <Card
        style={{
          borderRadius: "8px",
          boxShadow: "0px 4px 8px rgba(0,0,0,0.05)",
          background: "#FFFFFF",
          padding: "20px",
          marginBottom: "30px",
          border: "none",
        }}
        className="fade-in"
      >
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          {cadreSlice.loading ? (
            <Skeleton active paragraph={false} title={{ width: 120 }} />
          ) : (
            cadreData1.map((stat, index) => (
              <Col
                key={stat.label}
                xs={12}
                sm={12}
                md={6}
                style={{
                  ...(window.innerWidth < 768
                    ? mobileStyle
                    : index < cadreData1.length - 1
                      ? dividerStyle
                      : {
                          padding: "0 10px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }),
                }}
              >
                <div style={numberStyle}>{stat.value}</div>
                <div style={labelStyle}>{stat.label}</div>
              </Col>
            ))
          )}
        </Row>
      </Card>

      {/* Second row stats styled as the expected UI */}
      <style>{scrollBarStyling}</style>
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "30px",
          overflowX: "auto",
          overflowY: "hidden",
        }}
        className="fade-in"
      >
        {cadreSlice.loading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          cadreData2.map((stat) => (
            <Card
              key={stat.label}
              className="hover-card"
              style={{
                ...secondRowCardStyle,
                backgroundColor: stat.bgColor,
                cursor: "pointer",
              }}
              onClick={() => openMetricModal(stat.key)}
            >
              <div style={{ textAlign: "center" }}>
                <div style={secondRowLabelStyle}>{stat.label}</div>
                <div style={{ ...secondRowValueStyle, marginTop: "10px" }}>
                  {stat.value}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/*
      <Card
        title={<span style={{ fontWeight: "700", fontFamily: "sans-serif" }}>Top 10 Cadre NEW</span>}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
          boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
          padding: "20px",
          marginBottom: "30px",
          border: "none",
        }}
        className="fade-in hover-card"
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={cadrePerformanceHighData || []} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" tickFormatter={(value, index) => (cadrePerformanceHighData || [])[index].id + " - " + value} /> 
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="votersCreated" barSize={30} radius={[8, 8, 0, 0]}>
              {(cadrePerformanceHighData || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    */}

      {/* Top 10 Cadre Chart */}
      <style>
        {`
          @media (max-width: 768px){
            .card-mobile {
              padding: 15px !important;
              margin-bottom: 20px !important;
            }
          }
          `}
      </style>
      <Card
        title={
          <span style={{ fontWeight: "700", fontFamily: "sans-serif" }}>
            Top 10 Cadre
          </span>
        }
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
          boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
          padding: "20px",
          marginBottom: "30px",
          border: "none",
        }}
        className="fade-in hover-card card-mobile"
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={topTenCadreData}
            margin={{ top: 20, right: 20, left: 20, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />

            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxis}
              label={{
                value: "Total Voters Created",
                angle: -90,
                position: "insideLeft",
              }}
            />{" "}
            <Tooltip />
            <Legend />
            <Bar dataKey="value" barSize={30} radius={[8, 8, 0, 0]}>
              {topTenCadreData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={barColors[index % barColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Least 10 Cadre Chart */}
      <Card
        title={
          <span style={{ fontWeight: "700", fontFamily: "sans-serif" }}>
            Least 10 Cadre
          </span>
        }
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
          boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
          padding: "20px",
          border: "none",
        }}
        className="fade-in hover-card card-mobile"
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={leastTenCadreData}
            margin={{ top: 20, right: 20, left: 20, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />

            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxis}
              label={{
                value: "Total Voters Created",
                angle: -90,
                position: "insideLeft",
              }}
            />{" "}
            <Tooltip />
            <Legend />
            <Bar dataKey="value" barSize={30} radius={[8, 8, 0, 0]}>
              {leastTenCadreData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={barColors[index % barColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Modal
        title={metricColumnTitleMap[selectedMetricKey]}
        open={metricModalVisible}
        onCancel={() => setMetricModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Table
          loading={metricModalLoading}
          columns={metricModalColumns}
          dataSource={metricRows}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="small"
          bordered
        />
      </Modal>
    </div>
  );
};

export default StaticCadreDashboard;
