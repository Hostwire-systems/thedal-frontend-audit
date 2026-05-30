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
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getVotersApi } from "../../api/voterApi";
import { fetchBooths } from "../../api/boothApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useLoading } from "../../context/LoadingContext";

// Types
export type Segment = {
  id: string;
  name: string;
  color: string;
  value: number;
};

type VisualizationType = "bar" | "pie" | "table";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const generateSampleSegments = (genderStats: any, totalBooths: number) => {
  return [
    {
      id: "male",
      name: "Male Voters",
      color: "#C7D2FE", // Soft Indigo
      value: genderStats.maleCount || 0,
    },
    {
      id: "female",
      name: "Female Voters",
      color: "#F3CFE3", // Muted Rose
      value: genderStats.femaleCount || 0,
    },
    {
      id: "other",
      name: "Other Voters",
      color: "#C9F0E1", // Pale Mint
      value: genderStats.otherCount || 0,
    },
    {
      id: "booths",
      name: "Total Booths",
      color: "#FDE68A", // Soft Yellow
      value: totalBooths,
    },
    {
      id: "families",
      name: "Total Families",
      color: "#E5E7EB", // Light Gray
      value: 127,
    },
    {
      id: "mobiles",
      name: "Unique Mobile Numbers",
      color: "#D1D5DB", // Neutral Gray
      value: 98,
    },
    {
      id: "pincodes",
      name: "Total Pincodes",
      color: "#F5E7D2", // Faded Sand
      value: 14,
    },
  ];
};

// Draggable segment
const SegmentItem = ({ segment }: { segment: Segment }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: segment.id.toString(),
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

// Visualization panel
const VisualizationPanel = ({
  segments,
  type,
}: {
  segments: Segment[];
  type: VisualizationType;
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
            <Legend />
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
            <Legend />
          </PieChart>
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

// Main component
const CustomReports = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);
  const [visualizationType, setVisualizationType] =
    useState<VisualizationType>("bar");
  const { isLoading, setLoading } = useLoading();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [voterRes, boothRes] = await Promise.all([
        getVotersApi({ electionId: selectedElectionId }),
        fetchBooths(parseInt(selectedElectionId)),
      ]);

      const genderStats = voterRes.data.genderStats;
      const totalBooths = boothRes.data.totalElements;

      const available = generateSampleSegments(genderStats, totalBooths);
      setSegments(available);
    } catch (error: unknown) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchData();
    }
  }, [selectedElectionId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id === "comparison-area") {
      const segment = active.data.current?.segment as Segment;
      if (segment && !selectedSegments.find((s) => s.id === segment.id)) {
        setSelectedSegments((prev) => [...prev, segment]);
      }
    }
  };

  const removeSegment = (id: string) => {
    setSelectedSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const availableSegments = segments.filter(
    (s) => !selectedSegments.some((sel) => sel.id === s.id)
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Custom Dashboard
          </h1>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="bg-white rounded-lg shadow-sm p-4 w-full lg:w-1/3">
              <h2 className="font-semibold text-gray-700 mb-3">
                Available Segments
              </h2>
              {availableSegments.map((segment) => (
                <SegmentItem key={segment.id} segment={segment} />
              ))}
            </div>

            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-gray-700">
                    Segment Comparison
                  </h2>
                  <div className="flex gap-2">
                    {(["bar", "pie", "table"] as VisualizationType[]).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => setVisualizationType(type)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            visualizationType === type
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100"
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
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
      </div>
    </DndContext>
  );
};

export default CustomReports;
