import React, { useState, useEffect } from "react";
import {
  Card,
  Col,
  Row,
  Typography,
  Select,
  message,
  Tabs,
  Button,
} from "antd";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import moment from "moment";
import { useSelector } from "react-redux";
import { useLoading } from "../../context/LoadingContext";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  BarChartOutlined,
  LineOutlined,
  PieChartOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { getVoteCountApi, getVotersApi } from "../../api/voterApi";
import { fetchBooths } from "../../api/boothApi";
import { getPartsApi } from "../../api/partApi";
import {
  getPollingDataInEachBooth,
  getPollingDataAgeWise,
  pollingDataTimeWise,
} from "../../api/pollingApi";

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const barColors = [
  "#95A4FC",
  "#BAEDBD",
  "#1C1C1C",
  "#B1E3FF",
  "#A8C5DA",
  "#A1E3CB",
];

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
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "8px",
    color: "#fff",
  };

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      {segment.name}
    </div>
  );
};

const VisualizationPanel = ({
  segments,
  type,
  activeTab,
}: {
  segments: Segment[];
  type: "bar" | "pie" | "table" | "line";
  activeTab: string;
}) => {
  const { setNodeRef } = useDroppable({ id: "comparison-area" });

  if (!segments.length) {
    return (
      <div
        ref={setNodeRef}
        className="flex items-center justify-center h-full text-gray-400 border-2 border-dashed border-gray-300 rounded-lg"
        style={{ height: "400px" }}
      >
        <div className="text-center p-8">
          <div className="text-lg mb-2">No segments selected</div>
          <div className="text-sm">Drag segments here to compare</div>
        </div>
      </div>
    );
  }

  const chartData = segments.map((s) => ({
    name: s.name,
    value: s.value,
  }));

  if (type === "bar") {
    return (
      <div ref={setNodeRef} style={{ height: "400px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={segments[index % segments.length].color}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "pie") {
    return (
      <div ref={setNodeRef} style={{ height: "400px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={segments[index % segments.length].color}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "line") {
    return (
      <div ref={setNodeRef} style={{ height: "400px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f620"
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
                  style={{
                    backgroundColor: segments[i % segments.length].color,
                  }}
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

export default function PollDayDashboard() {
  const [selectedBooth, setSelectedBooth] = useState<string>("");
  const [boothNumbers, setBoothNumbers] = useState<string[]>([]);
  const [voters, setVoters] = useState<any[]>([]);
  const [loadingBooths, setLoadingBooths] = useState<boolean>(false);
  const { isLoading, setLoading } = useLoading();
  const [activeTab, setActiveTab] = useState<string>("performance");
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);
  const [visualizationType, setVisualizationType] = useState<
    "bar" | "pie" | "table" | "line"
  >("bar");
  const [voteStats, setVoteStats] = useState({
    votedCount: 0,
    notVotedCount: 0,
    totalVoters: 0,
  });
  const [boothPerformanceData, setBoothPerformanceData] = useState<any[]>([]);
  const [demographicsData, setDemographicsData] = useState<any>({});
  const [timingAnalysisData, setTimingAnalysisData] = useState<any>({});

  const selectedElectionId = useSelector(
    (state: any) => state.election.selectedElectionId
  );

  // Predefined age groups for Demographics
  const ageGroups = [
    { label: "Age 18-25", min: 18, max: 25 },
    { label: "Age 26-35", min: 26, max: 35 },
    { label: "Age 36-45", min: 36, max: 45 },
    { label: "Age 46-60", min: 46, max: 60 },
    { label: "Age 60+", min: 61, max: 200 },
  ];

  // Expanded time intervals for Timing Analysis (24 hours)
  const timeIntervals = [
    { label: "12:00 AM - 4:00 AM", start: 0, end: 4 },
    { label: "4:00 AM - 8:00 AM", start: 4, end: 8 },
    { label: "8:00 AM - 12:00 PM", start: 8, end: 12 },
    { label: "12:00 PM - 4:00 PM", start: 12, end: 16 },
    { label: "4:00 PM - 8:00 PM", start: 16, end: 20 },
    { label: "8:00 PM - 12:00 AM", start: 20, end: 24 },
  ];

  // Mock data for testing
  const mockVoters = [
    // Booth 1
    {
      boothNumber: 1,
      hasVoted: true,
      date_of_birth: "2003-06-15", // Age 22 (18-25)
      votedTimestamp: "2025-05-15T01:30:00Z", // 1:30 AM UTC (12:00 AM - 4:00 AM)
    },
    {
      boothNumber: 1,
      hasVoted: true,
      date_of_birth: "1995-05-10", // Age 30 (26-35)
      votedTimestamp: "2025-05-15T06:30:00Z", // 6:30 AM UTC (4:00 AM - 8:00 AM)
    },
    {
      boothNumber: 1,
      hasVoted: true,
      date_of_birth: "1985-03-15", // Age 40 (36-45)
      votedTimestamp: "2025-05-15T10:15:00Z", // 10:15 AM UTC (8:00 AM - 12:00 PM)
    },
    {
      boothNumber: 1,
      hasVoted: true,
      date_of_birth: "1975-08-20", // Age 49 (46-60)
      votedTimestamp: "2025-05-15T14:45:00Z", // 2:45 PM UTC (12:00 PM - 4:00 PM)
    },
    {
      boothNumber: 1,
      hasVoted: true,
      date_of_birth: "1960-02-10", // Age 65 (60+)
      votedTimestamp: "2025-05-15T18:20:00Z", // 6:20 PM UTC (4:00 PM - 8:00 PM)
    },
    // Booth 2
    {
      boothNumber: 2,
      hasVoted: true,
      date_of_birth: "2001-01-01", // Age 24 (18-25)
      votedTimestamp: "2025-05-15T22:10:00Z", // 10:10 PM UTC (8:00 PM - 12:00 AM)
    },
    {
      boothNumber: 2,
      hasVoted: true,
      date_of_birth: "1990-07-15", // Age 34 (26-35)
      votedTimestamp: "2025-05-15T03:00:00Z", // 3:00 AM UTC (12:00 AM - 4:00 AM)
    },
    {
      boothNumber: 2,
      hasVoted: true,
      date_of_birth: "1980-04-10", // Age 45 (36-45)
      votedTimestamp: "2025-05-15T07:00:00Z", // 7:00 AM UTC (4:00 AM - 8:00 AM)
    },
    {
      boothNumber: 2,
      hasVoted: true,
      date_of_birth: "1970-11-05", // Age 54 (46-60)
      votedTimestamp: "2025-05-15T11:30:00Z", // 11:30 AM UTC (8:00 AM - 12:00 PM)
    },
    {
      boothNumber: 2,
      hasVoted: true,
      date_of_birth: "1955-09-25", // Age 69 (60+)
      votedTimestamp: "2025-05-15T13:15:00Z", // 1:15 PM UTC (12:00 PM - 4:00 PM)
    },
    // Non-voter for completeness
    {
      boothNumber: 2,
      hasVoted: false,
      date_of_birth: "1992-12-12", // Age 32 (26-35)
      votedTimestamp: null,
    },
  ];

  const shuffledColors = [...barColors].sort(() => 0.5 - Math.random());

  const fetchVoteCount = async (electionId: string, boothNumber: string) => {
    try {
      const response = await getVoteCountApi(electionId, boothNumber);
      console.log("response", response);
      if (response.data && response.data.data) {
        return {
          votedCount: response.data.data.votedCount || 0,
          notVotedCount: response.data.data.notVotedCount || 0,
          totalVoters: response.data.data.totalVoters || 0,
        };
      }
      throw new Error("Invalid response structure");
    } catch (error) {
      console.error("Error fetching vote count:", error);
      message.error("Failed to fetch voting data");
      return {
        votedCount: 0,
        notVotedCount: 0,
        totalVoters: 0,
      };
    }
  };

  const fetchBoothPerformanceData = async () => {
    try {
      setLoading(true);
      const data = await getPollingDataInEachBooth(selectedElectionId);
      setBoothPerformanceData(data);
    } catch (error) {
      console.error("Error fetching booth performance data:", error);
      message.error("Failed to fetch booth performance data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDemographicsData = async () => {
    try {
      setLoading(true);
      const data = await getPollingDataAgeWise(selectedElectionId);
      setDemographicsData(data);
    } catch (error) {
      console.error("Error fetching demographics data:", error);
      message.error("Failed to fetch demographics data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimingAnalysisData = async () => {
    try {
      setLoading(true);
      const data = await pollingDataTimeWise(selectedElectionId, selectedBooth);
      setTimingAnalysisData(data);
    } catch (error) {
      console.error("Error fetching timing analysis data:", error);
      message.error("Failed to fetch timing analysis data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchBoothPerformanceData();
      fetchDemographicsData();
      fetchTimingAnalysisData();
      fetchVotersData();
    }
  }, [selectedElectionId]);

  const fetchVotersData = async () => {
    try {
      setLoading(true);
      const params: any = {
        electionId: selectedElectionId,
        page: 0,
        size: 100,
      };
      const response = await getVotersApi(params);
      const voterData = response.data.content || [];
      console.log("Fetched voters:", voterData); // Debug: Log voter data
      if (voterData.length === 0) {
        console.warn("No voter data received, using mock data");
        setVoters(mockVoters); // Use mock data if API returns empty
      } else {
        setVoters(voterData);
      }
    } catch (error) {
      console.error("Error fetching voter data:", error);
      message.error("Failed to fetch voter data, using mock data");
      setVoters(mockVoters); // Fallback to mock data on error
    } finally {
      setLoading(false);
    }
  };

  // Calculate age from DOB with robust handling
  const getAge = (dob: any) => {
    if (!dob || typeof dob !== "string") {
      console.warn("Invalid DOB:", dob); // Debug
      return -1; // Invalid age to exclude from age groups
    }
    const parsedDate = moment(dob, ["YYYY-MM-DD", "MM/DD/YYYY"], true);
    if (!parsedDate.isValid()) {
      console.warn("Invalid DOB format:", dob); // Debug
      return -1;
    }
    return moment().diff(parsedDate, "years");
  };

  // Group voters by booth with normalization
  const groupByBooth = (votersArr: any[]) => {
    const booths: { [boothNumber: string]: any[] } = {};
    votersArr.forEach((voter) => {
      const boothNum = voter.boothNumber
        ? String(voter.boothNumber).replace("Booth ", "")
        : "Unknown";
      const booth = `Booth ${boothNum}`;
      if (!booths[booth]) {
        booths[booth] = [];
      }
      booths[booth].push(voter);
    });
    console.log("Grouped booths:", booths); // Debug
    return booths;
  };

  // Segments for Demographics (Age Groups)
  const getDemographicsSegments = () => {
    if (demographicsData.pollingAgeWiseRecords?.length > 0) {
      const ageData = demographicsData.pollingAgeWiseRecords[0]; // Assuming first record is what we need
      return [
        {
          id: "age-18-30",
          name: "Age 18-30",
          value: ageData.ageGroup18To30,
          color: barColors[0],
        },
        {
          id: "age-30-40",
          name: "Age 30-40",
          value: ageData.ageGroup30To40,
          color: barColors[1],
        },
        {
          id: "age-40-50",
          name: "Age 40-50",
          value: ageData.ageGroup40To50,
          color: barColors[2],
        },
        {
          id: "age-50-60",
          name: "Age 50-60",
          value: ageData.ageGroup50To60,
          color: barColors[3],
        },
        {
          id: "age-60-70",
          name: "Age 60-70",
          value: ageData.ageGroup60To70,
          color: barColors[4],
        },
      ];
    }

    const boothNumber = parseInt(selectedBooth.replace("Booth ", ""), 10) || 1;
    const boothVoters = voters.filter((v) => {
      const voterBooth = v.boothNumber ? String(v.boothNumber) : "Unknown";
      return (
        voterBooth === String(boothNumber) &&
        v.hasVoted &&
        v.date_of_birth !== null &&
        v.date_of_birth !== undefined
      );
    });
    console.log(`Demographics voters for Booth ${boothNumber}:`, boothVoters); // Debug

    const segments = ageGroups.map((group, index) => {
      const count = boothVoters.filter((voter) => {
        const age = getAge(voter.date_of_birth);
        return age >= group.min && age <= group.max;
      }).length;
      return {
        id: `age-${index}`,
        name: group.label,
        value: count,
        color: barColors[index % barColors.length],
      };
    });
    console.log("Demographics segments:", segments); // Debug
    return segments;
  };

  // Segments for Timing Analysis (Time Intervals)
  const getTimingSegments = () => {
    if (timingAnalysisData && timingAnalysisData.boothNumber) {
      return [
        {
          id: "time-07-08",
          name: "07:00-08:00",
          value: timingAnalysisData.time07To08,
          color: barColors[0],
        },
        {
          id: "time-08-09",
          name: "08:00-09:00",
          value: timingAnalysisData.time08To09,
          color: barColors[1],
        },
        {
          id: "time-09-10",
          name: "09:00-10:00",
          value: timingAnalysisData.time09To10,
          color: barColors[2],
        },
        {
          id: "time-10-11",
          name: "10:00-11:00",
          value: timingAnalysisData.time10To11,
          color: barColors[3],
        },
        {
          id: "time-11-12",
          name: "11:00-12:00",
          value: timingAnalysisData.time11To12,
          color: barColors[4],
        },
        {
          id: "time-12-13",
          name: "12:00-13:00",
          value: timingAnalysisData.time12To13,
          color: barColors[5],
        },
        {
          id: "time-13-14",
          name: "13:00-14:00",
          value: timingAnalysisData.time13To14,
          color: barColors[0],
        },
        {
          id: "time-14-15",
          name: "14:00-15:00",
          value: timingAnalysisData.time14To15,
          color: barColors[1],
        },
        {
          id: "time-15-16",
          name: "15:00-16:00",
          value: timingAnalysisData.time15To16,
          color: barColors[2],
        },
        {
          id: "time-16-17",
          name: "16:00-17:00",
          value: timingAnalysisData.time16To17,
          color: barColors[3],
        },
      ];
    }
    // earlier logic
    const boothNumber = parseInt(selectedBooth.replace("Booth ", ""), 10) || 1;
    const boothVoters = voters.filter((v) => {
      const voterBooth = v.boothNumber ? String(v.boothNumber) : "Unknown";
      return (
        voterBooth === String(boothNumber) &&
        v.hasVoted &&
        v.votedTimestamp !== null &&
        v.votedTimestamp !== undefined
      );
    });
    console.log(`Timing voters for Booth ${boothNumber}:`, boothVoters); // Debug

    const segments = timeIntervals.map((interval, index) => {
      const count = boothVoters.filter((voter) => {
        if (!voter.votedTimestamp) return false;
        const parsedTime = moment(
          voter.votedTimestamp,
          [moment.ISO_8601, "YYYY-MM-DD HH:mm:ss"],
          true
        );
        if (!parsedTime.isValid()) {
          console.warn("Invalid timestamp:", voter.votedTimestamp); // Debug
          return false;
        }
        const hour = parsedTime.hour();
        return hour >= interval.start && hour < interval.end;
      }).length;
      return {
        id: `time-${index}`,
        name: interval.label,
        value: count,
        color: barColors[index % barColors.length],
      };
    });
    console.log("Timing segments:", segments); // Debug
    return segments;
  };

  // Segments for Booth Performance (All Booths)
  const getBoothPerformanceSegments = () => {
    if (boothPerformanceData.length > 0) {
      return boothPerformanceData.map((booth, index) => ({
        id: `booth-${booth.boothNumber}`,
        name: `Booth ${booth.boothNumber}`,
        value: booth.totalVote,
        color: barColors[index % barColors.length],
      }));
    }

    const booths = groupByBooth(voters);
    const boothLabels = Object.keys(booths).length
      ? Object.keys(booths)
      : ["No Booths"];
    console.log("Booth labels:", boothLabels); // Debug

    return boothLabels.map((booth, index) => ({
      id: `booth-${index}`,
      name: booth,
      value: booths[booth]
        ? booths[booth].filter((v: any) => v.hasVoted === true).length
        : 0,
      color: barColors[index % barColors.length],
    }));
  };

  // Get segments based on active tab
  const getCurrentSegments = () => {
    let segments: Segment[] = [];
    switch (activeTab) {
      case "vote":
        segments = [
          {
            id: "voted",
            name: "Voted",
            value: voteStats.votedCount,
            color: shuffledColors[0],
          },
          {
            id: "not-voted",
            name: "Not Voted",
            value: voteStats.notVotedCount,
            color: shuffledColors[1],
          },
        ];
        break;
      case "demographics":
        segments = getDemographicsSegments();
        break;
      case "timing":
        segments = getTimingSegments();
        break;
      case "performance":
      default:
        segments = getBoothPerformanceSegments();
        break;
    }
    console.log(`Segments for ${activeTab}:`, segments); // Debug
    return segments;
  };

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

  const availableSegments = getCurrentSegments().filter(
    (s) => !selectedSegments.some((sel) => s.id === sel.id)
  );

  const handleBoothChange = (value: string) => {
    setSelectedBooth(value);
    setSelectedSegments([]); // Reset segments when booth changes
  };

  // Update segments when tab changes
  useEffect(() => {
    setSelectedSegments([]);
  }, [activeTab]);

  useEffect(() => {
    if (selectedElectionId) {
      const fetchBoothsData = async () => {
        setLoadingBooths(true);
        try {
          let partNumbersFromResponse = [];

          try {
            const response = await getPartsApi(parseInt(selectedElectionId));
            console.log("Parts response:", response.data);

            const validParts = (
              Array.isArray(response.data) ? response.data : []
            ).map((part: any) => ({
              ...part,
              partNo: Number(part?.partNo?.trim() ?? 0),
            }));

            partNumbersFromResponse = validParts
              .map((part: any) => part.partNo)
              .filter(
                (pn: any) => !isNaN(pn) && pn !== null && pn !== undefined
              )
              .sort((a: number, b: number) => a - b);

            console.log(
              "Mapped & Sorted Part Numbers:",
              partNumbersFromResponse
            );
          } catch (error) {
            console.error("Error fetching parts:", error);
            partNumbersFromResponse = [];
          }

          setBoothNumbers(partNumbersFromResponse);
          if (partNumbersFromResponse.length > 0) {
            setSelectedBooth(`Booth ${partNumbersFromResponse[0]}`);
          }
        } catch (error) {
          console.error("Error fetching booths:", error);
        } finally {
          setLoadingBooths(false);
        }
      };
      fetchBoothsData();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (selectedElectionId && selectedBooth) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const boothNumber = selectedBooth.replace("Booth ", "");
          const response = await fetchVoteCount(
            selectedElectionId,
            boothNumber
          );
          console.log("response", response);
          setVoteStats({
            votedCount: response.votedCount,
            notVotedCount: response.notVotedCount,
            totalVoters: response.totalVoters,
          });
        } catch (error) {
          console.error("Error fetching vote stats:", error);
          message.error("Failed to fetch voting data");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedElectionId, selectedBooth]);

  // Update booth selector options
  const boothOptions = Object.keys(groupByBooth(voters)).length
    ? Object.keys(groupByBooth(voters))
    : ["Booth 1"];

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <Row gutter={16}>
        <Col span={24}>
          <Card className="shadow-lg p-4 rounded-lg">
            <div className="mb-4">
              <Select
                value={selectedBooth}
                onChange={handleBoothChange}
                style={{ width: 200 }}
                showSearch
                filterOption={(input, option) =>
                  option?.children
                    ?.toString()
                    .toLowerCase()
                    .includes(input.toLowerCase()) ?? false
                }
                loading={loadingBooths}
                disabled={boothNumbers.length === 0}
              >
                {boothNumbers.map((boothNumber) => (
                  <Option key={boothNumber} value={`Booth ${boothNumber}`}>
                    Booth {boothNumber}
                  </Option>
                ))}
              </Select>
            </div>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className="mb-6"
            >
              <TabPane tab="Voting" key="vote" />
              <TabPane tab="Booth Performance" key="performance" />
              <TabPane tab="Demographics" key="demographics" />
              <TabPane tab="Timing Analysis" key="timing" />
            </Tabs>

            <div className="flex gap-6">
              <div className="bg-white p-4 w-1/3">
                <h3 className="font-semibold mb-4">Available Segments</h3>
                {availableSegments.length === 0 ? (
                  <div className="text-gray-500">
                    No segments available for {activeTab}. Check voter data.
                  </div>
                ) : (
                  availableSegments.map((segment) => (
                    <SegmentItem key={segment.id} segment={segment} />
                  ))
                )}
              </div>

              <div className="flex-1">
                <div className="bg-white p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3>Segment Comparison</h3>
                    <div className="flex gap-2">
                      {(["bar", "pie", "table", "line"] as const).map(
                        (type) => (
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
                        )
                      )}
                    </div>
                  </div>
                  <div className="border-2 rounded-lg p-4 min-h-[400px]">
                    {selectedSegments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedSegments.map((segment) => (
                          <div
                            key={segment.id}
                            className="flex items-center px-3 py-1 rounded-full text-sm text-white"
                            style={{ backgroundColor: segment.color }}
                          >
                            {segment.name} ({segment.value})
                            <button
                              onClick={() => removeSegment(segment.id)}
                              className="ml-2 text-white hover:text-gray-200"
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
                      activeTab={activeTab}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </DndContext>
  );
}
