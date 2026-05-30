import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Button, Card, message, Select, Spin, Tabs } from "antd";
import {
  BarChartOutlined,
  LineOutlined,
  PieChartOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { fetchBooths } from "../../api/boothApi";
import { getVotersApi } from "../../api/voterApi";
import { useLoading } from "../../context/LoadingContext";
import { useFeedbacksData } from "../../hooks/useFeedbacksData";
import { useReligionData } from "../../hooks/useReligionData";
import { useCasteData } from "../../hooks/useCasteData";
import { useSubCasteData } from "../../hooks/useSubCasteData";
import { useAvailabilityData } from "../../hooks/useAvailabilityData";
import { useHistoryData } from "../../hooks/useHistoryData";
import { useLanguageData } from "../../hooks/useLanguageData";
import { useSchemeData } from "../../hooks/useSchemeData";
import { usePartyData } from "../../hooks/usePartyData";
import AdditionalElectionGraphs from "./AdditionalElectionGraphs";
import {
  getElectionReportsData,
  saveElectionReportsData,
} from "../../api/electionApi";
import { getPartsApi } from "../../api/partApi";
import { formatIndianNumber } from "../../utlis";
// import AdditionalElectionGraphs from "./AdditionalElectionGraphs";

interface Segment {
  id: string;
  name: string;
  value: number;
  color: string;
}

interface SampleData {
  demographics: Segment[];
  issues: Segment[];
  religion: Segment[];
  caste: Segment[];
  subcaste: Segment[];
  language: Segment[];
  party: Segment[];
  scheme: Segment[];
  history: Segment[];
  availability: Segment[];
}

interface GenderStats {
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  totalCount: number;
}

const segmentNameGetters: Record<keyof SampleData, (item: any) => string> = {
  demographics: (item) => item.name, // For male/female/other
  issues: (item) => item.issueName,
  religion: (item) => item.religionName,
  caste: (item) => item.casteName,
  subcaste: (item) => item.subCasteName,
  language: (item) => item.languageName,
  party: (item) => item.partyName,
  scheme: (item) => item.schemeName,
  history: (item) => item.voterHistoryName,
  availability: (item) => item.categoryName,
};

//  Sample data for categories
const transformCategory = (
  items?: any[],
  tabKey: keyof SampleData,
  selectedBooth?: string
): Segment[] => {
  const getName = segmentNameGetters[tabKey];
  return (
    items?.map((item) => ({
      id: item.key || item.id,
      name: getName(item), // Use the correct property getter
      value: item.voterCount ?? (selectedBooth ? 500 : 1000),
      color: getRandomColor(),
    })) || []
  );
};

const getSampleData = (
  genderStats: GenderStats,
  selectedBooth?: string,
  dynamicData?: {
    availability?: any[];
    caste?: any[];
    history?: any[];
    issues?: any[];
    language?: any[];
    party?: any[];
    religion?: any[];
    scheme?: any[];
    subcaste?: any[];
  }
) => {
  console.log("Get sample data called");
  console.log("Dynamic-Data", dynamicData);
  return {
    demographics: [
      {
        id: "male",
        name: "Male Voters",
        value: genderStats.maleCount,
        color: "#6A80FF",
      },
      {
        id: "female",
        name: "Female Voters",
        value: genderStats.femaleCount,
        color: "#85F88D",
      },
      {
        id: "other",
        name: "Other Voters",
        value: genderStats.otherCount,
        color: "#191919",
      },
    ],
    issues: transformCategory(dynamicData?.issues, "issues", selectedBooth),
    religion: transformCategory(
      dynamicData?.religion,
      "religion",
      selectedBooth
    ),
    caste: transformCategory(dynamicData?.caste, "caste", selectedBooth),
    subcaste: transformCategory(
      dynamicData?.subcaste,
      "subcaste",
      selectedBooth
    ),
    language: transformCategory(
      dynamicData?.language,
      "language",
      selectedBooth
    ),
    party: transformCategory(dynamicData?.party, "party", selectedBooth),
    scheme: transformCategory(dynamicData?.scheme, "scheme", selectedBooth),
    history: transformCategory(dynamicData?.history, "history", selectedBooth),
    availability: transformCategory(
      dynamicData?.availability,
      "availability",
      selectedBooth
    ),
  };
};
const getRandomColor = () => {
  const colors = [
    "#6A80FF",
    "#85F88D",
    "#191919",
    "#6A80FF",
    "#85F88D",
    "#191919",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const SegmentItem = ({
  segment,
}: {
  segment: { id: string; name: string; color: string; value: number };
}) => {
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
  segments: any[];
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
            <YAxis tickFormatter={(value) => formatIndianNumber(value)} />
            <Tooltip formatter={(value: any) => formatIndianNumber(value)} />
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
              label={(entry) => formatIndianNumber(entry.value)}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => formatIndianNumber(value)} />
            <Legend />
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
              tickFormatter={(value) => formatIndianNumber(value)}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#fff", borderColor: "#8884d8" }}
              labelStyle={{ fontWeight: "bold" }}
              formatter={(value: any) => formatIndianNumber(value)}
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
              <td className="px-6 py-4 whitespace-nowrap">{formatIndianNumber(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ElectionDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("demographics");
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);
  const [visualizationType, setVisualizationType] = useState<
    "bar" | "pie" | "table" | "line"
  >("bar");
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [selectedSegmentsByTab, setSelectedSegmentsByTab] = useState<
    Record<string, Segment[]>
  >({});
  const [savedReports, setSavedReports] = useState<any[]>([]);

  const [boothNumbers, setBoothNumbers] = useState<string[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<string | undefined>(
    undefined
  );
  const [isSaving, setIsSaving] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportApplied, setReportApplied] = useState(false);
  const { isLoading: loading, setLoading } = useLoading();
  const [genderStats, setGenderStats] = useState<GenderStats>({
    maleCount: 0,
    femaleCount: 0,
    otherCount: 0,
    totalCount: 0,
  });
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const [currentReport, setCurrentReport] = useState({
    electionId: selectedElectionId,
    boothNumber: undefined,
    activeTab: "demographics",
    tabs: {
      demographics: [],
      issues: [],
      religion: [],
      caste: [],
      subcaste: [],
      languages: [],
      party: [],
      scheme: [],
      history: [],
      availability: [],
    },
  });

  const { feedbacks, fetchFeedbackData } = useFeedbacksData(selectedElectionId);
  const { religions, fetchReligionData } = useReligionData(selectedElectionId);
  const { castes, fetchCasteData } = useCasteData(parseInt(selectedElectionId));
  const { subCastes, fetchSubCasteData } = useSubCasteData(
    parseInt(selectedElectionId)
  );
  const { parties, fetchPartyData } = usePartyData(
    parseInt(selectedElectionId)
  );
  const { schemes, fetchSchemeData } = useSchemeData(
    parseInt(selectedElectionId)
  );
  const { availabilities, fetchAvailabilityData } = useAvailabilityData(
    parseInt(selectedElectionId)
  );
  const { histories, fetchHistoryData } = useHistoryData(selectedElectionId);
  const { languages, fetchLanguageData } = useLanguageData(
    parseInt(selectedElectionId)
  );

  const [sampleData, setSampleData] = useState<SampleData>(
    getSampleData(
      {
        maleCount: 0,
        femaleCount: 0,
        otherCount: 0,
        totalCount: 0,
      },
      undefined
    )
  );
  const getSegmentsForCurrentTab = (): Segment[] => {
    return selectedSegmentsByTab[activeTab] || [];
  };

  const tabKeyMap: Record<string, keyof SampleData> = {
    demographics: "demographics",
    issues: "issues",
    religion: "religion",
    caste: "caste",
    subcaste: "subcaste",
    languages: "language",
    party: "party",
    scheme: "scheme",
    history: "history",
    availability: "availability",
  };

  const segmentNameGetters: Record<keyof SampleData, (item: any) => string> = {
    demographics: (item) => item.name, // For male/female/other
    issues: (item) => item.issueName,
    religion: (item) => item.religionName,
    caste: (item) => item.casteName,
    subcaste: (item) => item.subCasteName,
    language: (item) => item.languageName,
    party: (item) => item.partyName,
    scheme: (item) => item.schemeName,
    history: (item) => item.voterHistoryName,
    availability: (item) => item.categoryName,
  };

  const matchSavedSegments = (
    savedNames: string[],
    availableSegments: Segment[],
    tabKey: keyof SampleData
  ) => {
    const getName = segmentNameGetters[tabKey];
    return availableSegments.filter((segment) =>
      savedNames.includes(getName(segment))
    );
  };

  const setSegmentsForCurrentTab = (segments: Segment[]) => {
    setSelectedSegmentsByTab((prev) => ({
      ...prev,
      [activeTab]: segments,
    }));
    setSelectedSegments(segments);
  };

  // Modified applySavedReport function
  const applySavedReport = (report: any) => {
    const newSelectedSegments: Record<string, Segment[]> = {};

    // Initialize all possible tabs
    Object.keys(tabKeyMap).forEach((tabKey) => {
      newSelectedSegments[tabKey] = [];
    });

    // Process each tab in the saved report
    Object.entries(report.tabs).forEach(([tabKey, segmentNames]) => {
      const sampleDataKey = tabKeyMap[tabKey];
      if (sampleDataKey && sampleData[sampleDataKey]) {
        newSelectedSegments[tabKey] = matchSavedSegments(
          segmentNames as string[],
          sampleData[sampleDataKey],
          sampleDataKey
        );
      }
    });

    setSelectedSegmentsByTab(newSelectedSegments);
    setActiveTab(report.activeTab || "demographics");
  };

  const saveCurrentReport = async () => {
    try {
      setIsSaving(true);

      const payload = {
        electionId: parseInt(selectedElectionId),
        boothNumber: selectedBooth ? parseInt(selectedBooth) : undefined,
        activeTab,
        tabs: Object.fromEntries(
          Object.keys(selectedSegmentsByTab).map((tabKey) => [
            tabKey,
            selectedSegmentsByTab[tabKey].map((segment) => segment.name),
          ])
        ),
      };
      console.log("Payload before saving reports data", payload);
      await saveElectionReportsData(selectedElectionId, payload);
      message.success("Report saved successfully!");

      // Refresh the saved reports
      const response = await getElectionReportsData(
        selectedElectionId,
        selectedBooth ? selectedBooth : undefined
      );
      setCurrentReport(response.data || []);
      setSavedReports(response.data || []);
    } catch (error) {
      console.error("Error saving report:", error);
      message.error("Failed to save report");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!selectedElectionId) return;

      let partNumbersFromResponse: number[] = [];
      try {
        setLoading(true);
        let booths = await getPartsApi(parseInt(selectedElectionId));
        console.log("Parts response:", booths.data);

        const validParts = (Array.isArray(booths.data) ? booths.data : []).map(
          (part: any) => ({
            ...part,
            partNo: Number(part?.partNo?.trim() ?? 0),
          })
        );

        partNumbersFromResponse = validParts
          .map((part: any) => part.partNo)
          .filter((pn: any) => !isNaN(pn) && pn !== null && pn !== undefined)
          .sort((a: number, b: number) => a - b);
        setBoothNumbers(partNumbersFromResponse);

        await Promise.all([
          fetchFeedbackData(),
          fetchReligionData(),
          fetchCasteData(),
          fetchSubCasteData(),
          fetchPartyData(),
          fetchSchemeData(),
          fetchAvailabilityData(),
          fetchHistoryData(),
          fetchLanguageData(),
        ]);

        const response = await getVotersApi({
          electionId: selectedElectionId,
          boothNumber: selectedBooth,
        });

        let statsSource = response.data.genderStats;

        if (!statsSource && response.data.boothGenderStats?.length > 0) {
          statsSource = response.data.boothGenderStats.reduce(
            (acc: any, booth: any) => ({
              maleCount: acc.maleCount + (booth.maleCount || 0),
              femaleCount: acc.femaleCount + (booth.femaleCount || 0),
              otherCount: acc.otherCount + (booth.otherCount || 0),
              totalCount: acc.totalCount + (booth.totalCount || 0),
            }),
            { maleCount: 0, femaleCount: 0, otherCount: 0, totalCount: 0 }
          );
        }

        statsSource = statsSource || {
          maleCount: 0,
          femaleCount: 0,
          otherCount: 0,
          totalCount: 0,
        };
        console.log("Gender stats", statsSource);
        setGenderStats(statsSource);

        const dynamicData = {
          issues: feedbacks,
          religion: religions,
          caste: castes,
          subcaste: subCastes,
          language: languages,
          party: parties,
          scheme: schemes,
          history: histories,
          availability: availabilities,
        };

        const sample = getSampleData(statsSource, selectedBooth, dynamicData);
        console.log("Sample data", sample);
        setSampleData(sample);

        setInitialDataLoaded(true);
      } catch (err) {
        console.error("Error loading all data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [selectedElectionId]);

  // Step 2: Apply Saved Report After Initial Data
  useEffect(() => {
    const restoreSavedReports = async () => {
      if (!selectedElectionId || !initialDataLoaded || reportApplied) return;
      setReportLoading(true);

      try {
        const response = await getElectionReportsData(
          selectedElectionId,
          selectedBooth
        );
        console.log("Response from getElection reports data", response);

        if (!response.data || !response.data.length) return;

        const latestReport = response.data[0];
        if (latestReport?.boothNumber) {
          const booth = latestReport.boothNumber;
          console.log("Going to assign a booth", booth);
          setSelectedBooth(booth);
        }

        const newSelectedSegments: Record<string, Segment[]> = {};

        for (const [tabKey, names] of Object.entries(latestReport.tabs)) {
          const actualKey = tabKeyMap[tabKey];
          const currentSegments = sampleData[actualKey] || [];

          const matched = currentSegments.filter((segment) =>
            names.includes(segment.name)
          );

          newSelectedSegments[tabKey] = matched;
        }

        setSelectedSegmentsByTab(newSelectedSegments);
        setSelectedSegments(newSelectedSegments[activeTab] || []);

        setActiveTab((prev) =>
          prev ? prev : latestReport.activeTab || "demographics"
        );
      } catch (err) {
        console.error("Error restoring reports", err);
      } finally {
        setReportLoading(false);
      }
    };

    restoreSavedReports();
  }, [initialDataLoaded, selectedElectionId, selectedBooth, sampleData]);

  // Tab-specific data fetching
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSelectedSegments(selectedSegmentsByTab[newTab] || []);
  };

  const fetchTabData = async () => {
    console.log("Fetching tab data");
    try {
      setLoading(true);
      switch (activeTab) {
        case "religion":
          await fetchReligionData();
          break;
        case "caste":
          await fetchCasteData();
          break;
        case "subcaste":
          await fetchSubCasteData();
          break;
        case "languages":
          await fetchLanguageData();
          break;
        case "history":
          await fetchHistoryData();
          break;
        case "party":
          await fetchPartyData();
          break;
        case "issues":
          await fetchFeedbackData();
          break;
        case "availability":
          await fetchAvailabilityData();
          break;
        case "scheme":
          await fetchSchemeData();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} data:`, error);
    } finally {
      setLoading(false);
    }
  };

  const updateSampleDataAndSegments = (stats: GenderStats, booth?: string) => {
    if (
      !feedbacks ||
      !religions ||
      !castes ||
      !subCastes ||
      !languages ||
      !parties ||
      !schemes ||
      !histories ||
      !availabilities
    ) {
      return;
    }

    const dynamicData = {
      issues: feedbacks,
      religion: religions,
      caste: castes,
      subcaste: subCastes,
      language: languages,
      party: parties,
      scheme: schemes,
      history: histories,
      availability: availabilities,
    };

    // Generate new sample data
    const newSampleData = getSampleData(stats, booth, dynamicData);
    setSampleData(newSampleData);

    // Update selected segments with new values while preserving selection
    setSelectedSegmentsByTab((prev) => {
      const updated: Record<string, Segment[]> = {};

      Object.keys(prev).forEach((tabKey) => {
        const sampleDataKey = tabKeyMap[tabKey];
        updated[tabKey] = prev[tabKey]
          .map((selectedSegment) => {
            // Find matching segment in new data
            const updatedSegment = newSampleData[sampleDataKey]?.find(
              (s) => s.id === selectedSegment.id
            );
            // If segment still exists, return updated version, otherwise keep old
            return updatedSegment || selectedSegment;
          })
          // Filter out segments that no longer exist in the data
          .filter((segment) =>
            newSampleData[sampleDataKey]?.some((s) => s.id === segment.id)
          );
      });

      return updated;
    });
  };

  const handleBoothChange = async (boothNumber: string | undefined) => {
    try {
      setLoading(true);
      setSelectedBooth(boothNumber);

      const params = {
        electionId: selectedElectionId,
        boothNumber: boothNumber,
      };

      const response = await getVotersApi(params);
      let statsSource = response.data.genderStats;

      if (!statsSource && response.data.boothGenderStats?.length > 0) {
        statsSource = response.data.boothGenderStats.reduce(
          (acc: any, booth: any) => ({
            maleCount: acc.maleCount + (booth.maleCount || 0),
            femaleCount: acc.femaleCount + (booth.femaleCount || 0),
            otherCount: acc.otherCount + (booth.otherCount || 0),
            totalCount: acc.totalCount + (booth.totalCount || 0),
          }),
          { maleCount: 0, femaleCount: 0, otherCount: 0, totalCount: 0 }
        );
      }

      statsSource = statsSource || {
        maleCount: 0,
        femaleCount: 0,
        otherCount: 0,
        totalCount: 0,
      };
      console.log("Gender stats after booth change", genderStats);
      setGenderStats(statsSource);
      updateSampleDataAndSegments(statsSource, boothNumber);
    } catch (error) {
      console.error("Error fetching voter data:", error);
      setGenderStats({
        maleCount: 0,
        femaleCount: 0,
        otherCount: 0,
        totalCount: 0,
      });
      updateSampleDataAndSegments(
        {
          maleCount: 0,
          femaleCount: 0,
          otherCount: 0,
          totalCount: 0,
        },
        selectedBooth
      );
    } finally {
      setLoading(false);
    }
  };

  const updateSampleData = (stats: GenderStats, booth?: string) => {
    if (
      !feedbacks ||
      !religions ||
      !castes ||
      !subCastes ||
      !languages ||
      !parties ||
      !schemes ||
      !histories ||
      !availabilities
    ) {
      return;
    }
    const dynamicData = {
      issues: feedbacks,
      religion: religions,
      caste: castes,
      subcaste: subCastes,
      language: languages,
      party: parties,
      scheme: schemes,
      history: histories,
      availability: availabilities,
    };
    console.log("Calling getSampleData with", stats, booth, dynamicData);
    console.log("Sample data", getSampleData(stats, booth, dynamicData));
    setSampleData(getSampleData(stats, booth, dynamicData));
  };

  useEffect(() => {
    updateSampleDataAndSegments(genderStats, selectedBooth);
  }, [
    genderStats,
    selectedBooth,
    feedbacks,
    religions,
    castes,
    subCastes,
    parties,
    languages,
    schemes,
    histories,
    availabilities,
  ]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id === "comparison-area") {
      const segment = active.data.current?.segment;
      if (
        segment &&
        !getSegmentsForCurrentTab().find((s) => s.id === segment.id)
      ) {
        setSegmentsForCurrentTab([...getSegmentsForCurrentTab(), segment]);
      }
    }
  };

  const removeSegment = (id: string) => {
    setSegmentsForCurrentTab(
      getSegmentsForCurrentTab().filter((s) => s.id !== id)
    );
  };

  const getCurrentSegments = (): Segment[] => {
    const tabKey = tabKeyMap[activeTab] || "demographics";
    console.log("Tab key", tabKey);
    return sampleData[tabKey] || [];
  };

  const availableSegments = getCurrentSegments().filter(
    (s) => !getSegmentsForCurrentTab().some((sel) => sel.id === s.id)
  );

  useEffect(() => {
    setSelectedSegments(selectedSegmentsByTab[activeTab] || []);
  }, [activeTab, selectedSegmentsByTab]);

  // useEffect(() => {
  //   setSelectedSegments([]);
  // }, [activeTab]);

  // Update segments when booth or data changes
  // useEffect(() => {
  //   if (selectedSegments.length > 0) {
  //     const updatedSegments = selectedSegments
  //       .map((segment) => {
  //         const currentTabData =
  //           sampleData[activeTab as keyof typeof sampleData];
  //         const updatedSegment = currentTabData.find(
  //           (s: any) => s.id === segment.id
  //         );
  //         return updatedSegment || segment;
  //       })
  //       .filter((segment) => {
  //         // Remove segments that don't exist in current tab
  //         const currentTabData =
  //           sampleData[activeTab as keyof typeof sampleData];
  //         return currentTabData.some((s: any) => s.id === segment.id);
  //       });

  //     if (
  //       JSON.stringify(updatedSegments) !== JSON.stringify(selectedSegments)
  //     ) {
  //       setSelectedSegments(updatedSegments);
  //     }
  //   }
  // }, [sampleData, activeTab]);

  return (
    <div>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              Election Dashboard
            </h1>

            <div className="mb-4">
              <Select
                value={selectedBooth}
                onChange={handleBoothChange}
                style={{ width: 200 }}
                loading={loading}
                showSearch
                filterOption={(input, option) =>
                  option?.children
                    ?.toString()
                    .toLowerCase()
                    .includes(input.toLowerCase()) ?? false
                }
                disabled={activeTab !== "demographics"}
                placeholder="Select Booth"
                allowClear
              >
                {boothNumbers.map((booth) => (
                  <Select.Option key={booth} value={booth}>
                    Booth {booth}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              className="mb-6"
            >
              <Tabs.TabPane tab="Demographics" key="demographics" />
              <Tabs.TabPane tab="Issues" key="issues" />
              <Tabs.TabPane tab="Party" key="party" />
              <Tabs.TabPane tab="Religion" key="religion" />
              <Tabs.TabPane tab="Caste" key="caste" />
              <Tabs.TabPane tab="Subcaste" key="subcaste" />
              <Tabs.TabPane tab="Scheme" key="scheme" />
              <Tabs.TabPane tab="Languages" key="languages" />
              <Tabs.TabPane tab="Voting History" key="history" />
              <Tabs.TabPane tab="Voter Category" key="availability" />
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
                      <Button
                        type="primary"
                        onClick={saveCurrentReport}
                        loading={isSaving}
                        disabled={isSaving}
                      >
                        Save Report
                      </Button>
                    </div>
                  </div>
                  <div className="border-2 rounded-lg p-4 min-h-[400px]">
                    {reportLoading ? (
                      <div className="flex justify-center items-center h-[300px]">
                        <Spin className="custom-spin-dark" size="large" />
                      </div>
                    ) : (
                      <>
                        {getSegmentsForCurrentTab().length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {getSegmentsForCurrentTab().map((segment) => (
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
                          segments={getSegmentsForCurrentTab()}
                          type={visualizationType}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DndContext>
      <AdditionalElectionGraphs
        selectedElectionId={selectedElectionId}
        selectedBooth={selectedBooth}
        // selectedGender={selectedGender}
      />
    </div>
  );
};

export default ElectionDashboard;
