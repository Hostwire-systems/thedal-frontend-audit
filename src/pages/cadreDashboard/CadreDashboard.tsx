import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useLoading } from "../../context/LoadingContext";
import axios from "axios";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Tabs,
  Button,
  message,
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
  PieChart,
  Pie,
  LineChart,
  Line,
} from "recharts";
import {
  BarChartOutlined,
  LineOutlined,
  PieChartOutlined,
  SaveOutlined,
  TableOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import "./CadreDashboard.css";
import { BASE_URL } from "../../config";
import {
  getCadreDashboardReportApi,
  getCadreLowPerformersApi,
  getCadreTopPerformersApi,
  saveCadreDashboardReportApi,
} from "../../api/cadreApi";

const { Title } = Typography;

type Stat = {
  label: string;
  value: number;
};

type Stat2 = {
  //coloured cards
  label: string;
  value: number;
  bgColor: string;
};

type GraphStat = {
  id: number;
  name: string;
  votersCreated: number;
};

type Segment = {
  id: string;
  name: string;
  value: number;
  color: string;
};

const SegmentItem = ({ segment }: { segment: Segment }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: segment.id,
      data: { segment },
    });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: segment.color,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="px-3 py-2 rounded-md mb-2 shadow-sm"
    >
      {segment.name}
    </div>
  );
};

const VisualizationPanel = ({
  segments,
  type,
}: {
  segments: Segment[];
  type: "bar" | "pie" | "table" | "line";
}) => {
  const { setNodeRef } = useDroppable({ id: "comparison-area" });

  const chartData = segments.map((s) => ({
    name: s.name,
    value: s.value,
    color: s.color,
  }));

  if (!segments.length) {
    return (
      <div
        ref={setNodeRef}
        className="flex items-center justify-center h-full text-gray-400 border-2 border-dashed border-gray-300 rounded-lg min-h-[400px]"
      >
        <div className="text-center p-8">
          <div className="text-lg mb-2">No segments selected</div>
          <div className="text-sm">Drag segments here to compare</div>
        </div>
      </div>
    );
  }

  if (type === "bar") {
    return (
      <div ref={setNodeRef}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "pie") {
    return (
      <div ref={setNodeRef}>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "line" && chartData?.length) {
    return (
      <div ref={setNodeRef} className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={{ stroke: "#ccc" }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={{ stroke: "#ccc" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#fff", borderColor: "#8884d8" }}
              labelStyle={{ fontWeight: "bold" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 1, fill: "#8884d8" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Segment
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Count
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {chartData.map((row, i) => (
            <tr key={i}>
              <td className="px-6 py-4 whitespace-nowrap flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: row.color }}
                />
                {row.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CadreDashboard: React.FC = () => {
  const [electionName, setElectionName] =
    useState<string>("CHENNAI_MAYOR_2025");
  const { isLoading, setLoading } = useLoading();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const [topPerformers, setTopPerformers] = useState<GraphStat[]>([]);
  const [lowPerformers, setLowPerformers] = useState<GraphStat[]>([]);
  const [savedReports, setSavedReports] = useState<{
    activeTab?: string;
    tabs?: {
      [key: string]: string[];
    };
  }>({});

  // Drag and drop state
  const [activeTab, setActiveTab] = useState<string>("topPerformers");
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);
  const [cadreStats, setCadreStats] = useState({
    noOfCadre: 0,
    cadreLogged: 0,
    cadreNotLogged: 0,
    activeCadreCount: 0,
    inactiveCadreCount: 0,
    maleCadreCount: 0,
    femaleCadreCount: 0,
    otherCadreCount: 0,
  });
  const [updateStats, setUpdateStats] = useState<Stat2[]>([
    {
      label: "Whatsapp Numbers Updated",
      value: 0,
      bgColor: "#E4E9BE",
    },
    {
      label: "Roles Updated",
      value: 0,
      bgColor: "#E3F5FF",
    },
    {
      label: "Booths Updated",
      value: 0,
      bgColor: "#F8EDED",
    },
    {
      label: "Addresses Updated",
      value: 0,
      bgColor: "#FFE5CA",
    },
  ]);
  const [visualizationType, setVisualizationType] = useState<
    "bar" | "pie" | "table" | "line"
  >("bar");

  const getRandomColor = () => {
    const colors = [
      "#C7D2FE",
      "#F3CFE3",
      "#C9F0E1",
      "#FDE68A",
      "#FFD6A5",
      "#A5D8FF",
      "#D5A6FF",
      "#FFD1DC",
      "#B9FBC0",
      "#D1FAE5",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Sample data for drag and drop
  const sampleData = {
    topPerformers,
    lowPerformers,
    activity: [
      {
        id: "active-cadres",
        name: "Active Cadres",
        value: cadreStats.activeCadreCount,
        color: "#F3CFE3", // Blue for active
      },
      {
        id: "inactive-cadres",
        name: "Inactive Cadres",
        value: cadreStats.inactiveCadreCount,
        color: "#C9F0E1", // Gray for inactive
      },
    ],
    demographics: [
      {
        id: "male-cadres",
        name: "Male Cadres",
        value: cadreStats.maleCadreCount,
        color: "#C7D2FE",
      },
      {
        id: "female-cadres",
        name: "Female Cadres",
        value: cadreStats.femaleCadreCount,
        color: "#F3CFE3",
      },
      {
        id: "other-cadres",
        name: "Other Cadres",
        value: cadreStats.otherCadreCount,
        color: "#C9F0E1",
      },
    ],
    updates: [
      {
        id: "whatsapp-updates",
        name: "Whatsapp Updates",
        value:
          updateStats.find((s) => s.label.includes("Whatsapp"))?.value || 0,
        color: "#C7D2FE",
      },
      {
        id: "booth-updates",
        name: "Booth Updates",
        value: updateStats.find((s) => s.label.includes("Booth"))?.value || 0,
        color: "#F3CFE3",
      },
      {
        id: "address-updates",
        name: "Address Updates",
        value: updateStats.find((s) => s.label.includes("Address"))?.value || 0,
        color: "#C9F0E1",
      },
      {
        id: "role-updates",
        name: "Role Updates",
        value: updateStats.find((s) => s.label.includes("Role"))?.value || 0,
        color: "#FDE68A",
      },
    ],
  };

  const loadSavedReports = async () => {
    try {
      const response = await getCadreDashboardReportApi(
        parseInt(selectedElectionId)
      );
      console.log("Response saved dashboard reports", response);
      let fetched_data = response?.data[0];

      if (fetched_data) {
        // Initialize with empty tabs if not present
        const tabs = fetched_data.tabs || {
          topPerformers: [],
          lowPerformers: [],
          activity: [],
          demographics: [],
          updates: [],
        };

        setSavedReports({
          activeTab: fetched_data.activeTab || "topPerformers",
          tabs: tabs,
        });

        // Set the active tab if available
        if (fetched_data.activeTab) {
          setActiveTab(fetched_data.activeTab);
        }
        // Set the visualization type if available
        if (fetched_data.visualizationType) {
          setVisualizationType(fetched_data.visualizationType);
        }
        return fetched_data;
      }
    } catch (error) {
      console.error("Error loading saved reports:", error);
    }
  };

  const saveCurrentReport = async () => {
    try {
      const currentTabs = {
        ...(savedReports.tabs || {}), // Preserve existing tab data
        [activeTab]:
          activeTab === "topPerformers" || activeTab === "lowPerformers"
            ? selectedSegments
                .filter((s) =>
                  s.id.startsWith(
                    activeTab === "topPerformers" ? "top-" : "low-"
                  )
                )
                .map((s) => s.name)
            : selectedSegments.map((s) => s.id),
      };

      const reportData = {
        electionId: selectedElectionId,
        activeTab,
        visualizationType,
        tabs: currentTabs,
      };
      console.log("Reports data payload", reportData);
      const response = await saveCadreDashboardReportApi(
        parseInt(selectedElectionId),
        reportData
      );
      setSavedReports({
        activeTab,
        tabs: currentTabs,
      });
      console.log("Response after saving reports", response);
      message.success("Report saved successfully!");
    } catch (error) {
      console.error("Error saving report:", error);
      message.error("Failed to save report");
    }
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
          }
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

  useEffect(() => {
    if (selectedElectionId) {
      console.log("First useeffect");
      loadSavedReports();
    }
  }, [selectedElectionId]);


  const fetchCadreDetails = async () => {
    try {
      // setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/cadre/overview/${selectedElectionId}`,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
        }
      );
      if (response) {
        console.log("Cadres Details:", response.data);

        setCadreStats({
          noOfCadre: response.data.noOfCadre || 0,
          cadreLogged: response.data.cadreLogged || 0,
          cadreNotLogged: response.data.cadreNotLogged || 0,
          activeCadreCount: response.data.activeCadreCount || 0,
          inactiveCadreCount: response.data.inactiveCadreCount || 0,
          maleCadreCount: response.data.maleCadreCount || 0,
          femaleCadreCount: response.data.femaleCadreCount || 0,
          otherCadreCount: response.data.otherCadreCount || 0,
        });

        const stats2 = [
          {
            label: "Total Whatsapp Nos. Updated",
            value: response.data.totalWhatsappNumberUpdated || 0,
            bgColor: "#E4E9BE",
          },
          {
            label: "Total Booths Updated",
            value: response.data.totalBoothsUpdated || 0,
            bgColor: "#E3F5FF",
          },
          {
            label: "Total Address Updated",
            value: response.data.totalAddressUpdated || 0,
            bgColor: "#F8EDED",
          },
          {
            label: "Total Roles Updated",
            value: response.data.totalRolesUpdated || 0,
            bgColor: "#FFE5CA",
          },
        
        ];
        console.log("2nd row", stats2);
        setUpdateStats(stats2);
      }
    } catch (error) {
      console.log("Error fetching cadres: ", error);
    } finally {
      // setLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const [topPerformersData, lowPerformersData] = await Promise.all([
        getCadreTopPerformersApi(parseInt(selectedElectionId)),
        getCadreLowPerformersApi(parseInt(selectedElectionId)),
      ]);

      const transformedTop = topPerformersData?.data?.map((item: any) => ({
        id: `top-${item.userId}`,
        name: item.userName,
        value: item.totalVoterCreated,
        color: getRandomColor(),
      }));

      const transformedLow = lowPerformersData?.data?.map((item: any) => ({
        id: `low-${item.userId}`,
        name: item.userName,
        value: item.totalVoterCreated,
        color: getRandomColor(),
      }));

      setTopPerformers(transformedTop || []);
      setLowPerformers(transformedLow || []);
    } catch (error) {
      console.error("Error fetching performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applySavedSegments = (tabs: any, tabKey: string) => {
    const savedSegmentsForTab = tabs[tabKey] || [];
    const allSegments = getCurrentSegments();

    const newSelectedSegments = allSegments.filter((segment) => {
      if (tabKey === "topPerformers" || tabKey === "lowPerformers") {
        return savedSegmentsForTab.includes(segment.name);
      }
      return savedSegmentsForTab.includes(segment.id);
    });

    setSelectedSegments(newSelectedSegments);
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      if (selectedElectionId) {
        setLoading(true);
        // 1. Load saved reports
        const savedData = await loadSavedReports();
        const activeTabFromSaved = savedData?.activeTab || "topPerformers";
        const savedTabs = savedData?.tabs || {};

        // 2. Set active tab
        setActiveTab(activeTabFromSaved);

        // 3. Fetch all data
        await Promise.all([fetchPerformanceData(), fetchCadreDetails()]);

        // 4. Apply segments for the active tab
        const savedSegmentsForActiveTab = savedTabs[activeTabFromSaved] || [];
        const allSegmentsForActiveTab =
          getCurrentSegmentsForTab(activeTabFromSaved);

        const initialSelectedSegments = allSegmentsForActiveTab.filter(
          (segment) => {
            if (
              activeTabFromSaved === "topPerformers" ||
              activeTabFromSaved === "lowPerformers"
            ) {
              return savedSegmentsForActiveTab.includes(segment.name);
            }
            return savedSegmentsForActiveTab.includes(segment.id);
          }
        );

        setSelectedSegments(initialSelectedSegments);

        // 5. Update savedReports with all tabs data
        setSavedReports({
          activeTab: activeTabFromSaved,
          tabs: savedTabs,
        });
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [selectedElectionId]);

  useEffect(() => {
    if (isDataLoaded && savedReports.tabs) {
      applySavedSegments(
        savedReports.tabs,
        savedReports.activeTab || activeTab
      );
    }
  }, [isDataLoaded, savedReports]);

  // useEffect(() => {
  //   console.log("Second useeffect");

  //   if (selectedElectionId) {
  //     fetchPerformanceData();
  //   }
  // }, [selectedElectionId]);

  // useEffect(() => {
  //   console.log("Third useeffect");

  //   fetchCadreDetails();
  // }, [selectedElectionId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id === "comparison-area") {
      const segment = active.data.current?.segment;
      if (segment && !selectedSegments.find((s) => s.id === segment.id)) {
        setSelectedSegments((prev) => [...prev, segment]);
      }
    }
  };

  const removeSegment = (id: string) => {
    setSelectedSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);

    // Save current selections before switching tabs
    const currentTabs = {
      ...(savedReports.tabs || {}),
      [activeTab]: getCurrentTabSegmentsForSaving(),
    };

    setSavedReports((prev) => ({
      ...prev,
      tabs: currentTabs,
    }));

    // Apply saved segments for the new tab
    setActiveTab(key);

    // Load segments for the new tab from saved reports
    loadSegmentsForTab(key, currentTabs);
  };

  // Helper function to get current tab's segments in save format
  const getCurrentTabSegmentsForSaving = () => {
    if (activeTab === "topPerformers" || activeTab === "lowPerformers") {
      return selectedSegments
        .filter((s) =>
          s.id.startsWith(activeTab === "topPerformers" ? "top-" : "low-")
        )
        .map((s) => s.name);
    }
    return selectedSegments.map((s) => s.id);
  };

  // Helper function to load segments for a specific tab
  const loadSegmentsForTab = (tabKey: string, tabsData: any) => {
    const savedSegments = tabsData[tabKey] || [];
    const allSegments = getCurrentSegmentsForTab(tabKey);

    const segmentsToSelect = allSegments.filter((segment) => {
      if (tabKey === "topPerformers" || tabKey === "lowPerformers") {
        // For performers, match by name since IDs are dynamic
        return savedSegments.includes(segment.name);
      }
      // For other tabs, match by ID
      return savedSegments.includes(segment.id);
    });

    setSelectedSegments(segmentsToSelect);
  };

  const getCurrentSegmentsForTab = (tabKey: string) => {
    switch (tabKey) {
      case "topPerformers":
        return sampleData.topPerformers;
      case "lowPerformers":
        return sampleData.lowPerformers;
      case "activity":
        return sampleData.activity;
      case "demographics":
        return sampleData.demographics;
      case "updates":
        return sampleData.updates;
      default:
        return [];
    }
  };

  const getCurrentSegments = () => {
    let segments: Segment[] = [];
    console.log("Sample data", sampleData);
    console.log("Active tab", activeTab);

    switch (activeTab) {
      case "topPerformers":
        return sampleData.topPerformers;
      case "lowPerformers":
        return sampleData.lowPerformers;
      case "activity":
        return sampleData.activity;
      case "demographics":
        return sampleData.demographics;
      case "updates":
        return sampleData.updates;
      default:
        return [];
    }

    // Filter out any segments that might have been saved but don't exist in current data
    const savedSegmentIds = savedReports.tabs?.[activeTab] || [];
    return segments.filter((segment) => {
      if (activeTab === "topPerformers" || activeTab === "lowPerformers") {
        return true; // Always show all for performers since names can change
      }
      return savedSegmentIds.includes(segment.id);
    });
  };

  const availableSegments = getCurrentSegments().filter(
    (s) => !selectedSegments.some((sel) => sel.id === s.id)
  );

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

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        className="main-container"
        style={{ background: "#FAFAFA", padding: "20px" }}
      >
        <Title
          level={5}
          style={{
            fontWeight: "700",
            marginBottom: "20px",
            fontFamily: "sans-serif",
          }}
        >
          Election Name : {electionName}
        </Title>

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
            <Col xs={12} sm={12} md={6} style={dividerStyle}>
              <div style={numberStyle}>{cadreStats.noOfCadre}</div>
              <div style={labelStyle}>No. of Cadres</div>
            </Col>
            <Col xs={12} sm={12} md={6} style={dividerStyle}>
              <div style={numberStyle}>{cadreStats.cadreLogged}</div>
              <div style={labelStyle}>Cadres Logged</div>
            </Col>
            <Col xs={12} sm={12} md={6} style={dividerStyle}>
              <div style={numberStyle}>{cadreStats.cadreNotLogged}</div>
              <div style={labelStyle}>Cadres not Logged</div>
            </Col>
            <Col xs={12} sm={12} md={6} style={{ padding: "0 10px" }}>
              <div style={numberStyle}>{cadreStats.activeCadreCount}</div>
              <div style={labelStyle}>Active Cadres</div>
            </Col>
          </Row>
        </Card>

        {/* Second row stats */}
        {/* <style>{scrollBarStyling}</style>
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
            {updateStats.map((stat, index) => (
              <Col
                key={stat.label}
                xs={12}
                sm={12}
                md={6}
                style={{
                  ...(window.innerWidth < 768
                    ? mobileStyle
                    : index < updateStats.length - 1
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
            ))}
          </Row>
        </Card> */}

        {/* Drag and Drop Visualization Section */}
        <Tabs activeKey={activeTab} onChange={handleTabChange} className="mb-6">
          <Tabs.TabPane tab="Top Performers" key="topPerformers" />
          <Tabs.TabPane tab="Low Performers" key="lowPerformers" />{" "}
          <Tabs.TabPane tab="Activity" key="activity" />
          <Tabs.TabPane tab="Cadre Gender" key="demographics" />
          <Tabs.TabPane tab="Updates" key="updates" />
        </Tabs>

        <div className="flex gap-6">
          <div className="bg-white p-4 w-1/3">
            <h3 className="font-semibold">Available Segments</h3>
            {availableSegments.map((segment) => (
              <SegmentItem key={segment.id} segment={segment} />
            ))}
          </div>

          <div className="flex-1">
            <div className="bg-white p-4">
              <div className="flex justify-between items-center mb-4">
                <h3>Segment Comparison</h3>
                <div>
                  {(["bar", "pie", "table", "line"] as const).map((type) => (
                    <Button
                      key={type}
                      onClick={() => setVisualizationType(type)}
                      className={`px-4 py-2 ${
                        visualizationType === type
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {type === "bar" ? (
                        <BarChartOutlined />
                      ) : type === "pie" ? (
                        <PieChartOutlined />
                      ) : type === "table" ? (
                        <TableOutlined />
                      ) : (
                        <LineOutlined />
                      )}
                    </Button>
                  ))}
                  <Button
                    type="primary"
                    onClick={saveCurrentReport}
                    className="ml-4"
                    icon={<SaveOutlined />}
                  >
                    Save
                  </Button>
                </div>
              </div>
              <div className="border-2 rounded-lg p-4 min-h-[400px]">
                {selectedSegments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedSegments.map((segment) => (
                      <div
                        key={segment.id}
                        className="flex items-center px-3 py-1 rounded-full text-sm"
                        style={{ backgroundColor: segment.color }}
                      >
                        {segment.name}
                        <button
                          onClick={() => removeSegment(segment.id)}
                          className="ml-2 text-gray-600 hover:text-gray-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <VisualizationPanel
                  segments={selectedSegments}
                  type={visualizationType}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default CadreDashboard;
