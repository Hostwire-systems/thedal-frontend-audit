import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Card,
  Col,
  Row,
  Typography,
  Button,
  Tag,
  Statistic,
  Skeleton,
  Select,
  message,
  Divider,
  Table,
  Input,
  ColorPicker,
  Spin,
  Modal,
  Space,
  Tooltip,
  Popover,
} from "antd";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import { useSelector } from "react-redux";
import {
  saveGraphChartConfig,
  getGraphChartConfig,
  getElectionStatsPartWise,
  getDemographicsPartWise,
  getPartyPollingPartWise,
  recomputeElectionStats,
  recomputeDemographics,
  recomputePartyPolling,
  getJobStatus,
  type AsyncRecomputeResponse,
  type ChartConfig,
  type ElectionStatsAggregate,
  type DemographicsAggregate,
  type PartyPollingAggregate,
} from "../../api/reportingApi";
import { usePersistentRefreshTimer } from "../../hooks/usePersistentRefreshTimer";
import { getPartsApi } from "../../api/partApi";
import { fetchParties } from "../../api/partyApi";
import {
  PlusOutlined,
  DeleteOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  BarChartOutlined,
  LineChartOutlined,
  TableOutlined,
  EditOutlined,
  DragOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  AreaChartOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  PercentageOutlined,
  NumberOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { RootState } from "../../redux/store";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Rnd } from "react-rnd";
import { formatIndianNumber } from "../../utlis";
import ExportModal from "./ExportModal";
import RefreshStatusBanner from "../../components/RefreshStatusBanner";

const { Title, Text } = Typography;
const { Option } = Select;
const GRAPH_AUTO_REFRESH_INTERVAL_MS = 600000;

const COMPLETENESS_METRIC_MAP: Partial<Record<YAxisType, keyof ElectionStatsAggregate>> = { 
  "religion":   "religionCount", 
  "caste":      "casteCount", 
  "subcaste":   "subCasteCount", 
  "language":   "languageCount", 
  "schemes":    "schemesCount", 
  "star-voter": "starVoters", 
  "voterSlip":  "voterSlipCount", 
  "familySlip": "familySlipCount", 
  "whatsapp":   "whatsappCount", 
  "sms":        "smsCount", 
  "party":      "partyAffiliationCount", 
};

interface StaticGraphsDashboardProps {
  isActive?: boolean;
}

// Styles (Reusing from PollDayDashboard pattern)
const fullscreenStyles = `
  .chart-fullscreen-container:fullscreen {
    padding: 20px;
    background: #fff;
    display: flex;
    flex-direction: column;
  }
  
  .chart-fullscreen-container:fullscreen .ant-card {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .chart-fullscreen-container:fullscreen .ant-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .chart-fullscreen-container:fullscreen canvas {
    max-height: calc(100vh - 150px) !important;
  }

  /* Charts grid container */
  .charts-grid-container {
    padding: 20px;
    background: #f9fafb;
  }

  /* Fullscreen grid styles */
  .charts-grid-fullscreen:fullscreen {
    padding: 20px;
    background: #f5f5f5;
    overflow: auto !important;
    height: 100vh !important;
    width: 100vw !important;
    position: relative;
  }

  /* Fullscreen controls - floating toolbar */
  .fullscreen-controls {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    gap: 12px;
    background: white;
    padding: 12px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .fullscreen-controls .ant-btn-circle {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .fullscreen-controls .ant-btn-circle:hover {
    transform: scale(1.05);
    transition: transform 0.2s;
  }

  /* Ensure messages appear in fullscreen */
  .fullscreen-message {
    position: fixed !important;
    z-index: 10000 !important;
  }

  .charts-grid-fullscreen:fullscreen .ant-message {
    z-index: 10000 !important;
  }

  /* Ensure popovers appear above fullscreen content */
  .charts-grid-fullscreen:fullscreen .ant-popover,
  .chart-fullscreen-container:fullscreen .ant-popover {
    z-index: 10000 !important;
  }

  .charts-grid-fullscreen:fullscreen .charts-wrapper {
    position: relative;
    min-height: 200vh;   
  min-width: 100%;
    z-index: 1;
  }

  /* In fullscreen, free-form positioning */
  .charts-grid-fullscreen:fullscreen .chart-card {
    position: absolute !important;
    z-index: 5;
  }

  /* Override Col in fullscreen - make it absolute positioned */
  .charts-grid-fullscreen:fullscreen .ant-col {
    position: static !important;
    width: auto !important;
    max-width: none !important;
    flex: none !important;
    display: block !important;
  }

  /* Add a subtle grid pattern to the fullscreen background */
  .charts-grid-fullscreen:fullscreen::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
    z-index: 0;
    opacity: 0.5;
  }

  .charts-grid-fullscreen:fullscreen .charts-wrapper {
    position: relative;
    z-index: 1;
  }

  /* Resize handles - invisible but functional */
  .charts-grid-fullscreen:fullscreen .react-resizable-handle {
    position: absolute;
    z-index: 10;
  }

  /* Rnd component styling in fullscreen */
  .charts-grid-fullscreen:fullscreen .chart-card .react-draggable {
    display: flex !important;
    flex-direction: column !important;
  }

  .charts-grid-fullscreen:fullscreen .chart-card.react-draggable {
    display: flex !important;
    flex-direction: column !important;
    position: absolute !important;
  }

  .charts-grid-fullscreen:fullscreen .chart-card-wrapper {
    position: static !important;
  }

  .charts-grid-fullscreen:fullscreen .chart-fullscreen-container {
    width: 100% !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .charts-grid-fullscreen:fullscreen .chart-fullscreen-container .ant-card {
    width: 100% !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .charts-grid-fullscreen:fullscreen .chart-fullscreen-container .ant-card-body {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    min-height: 0 !important;
  }

  /* Ensure charts scale properly */
  .charts-grid-fullscreen:fullscreen canvas {
    max-width: 100% !important;
    max-height: 100% !important;
    width: 100% !important;
    height: 100% !important;
    display: block !important;
  }

  /* Chart container must have explicit dimensions */
  .charts-grid-fullscreen:fullscreen .chart-fullscreen-container > div {
    width: 100% !important;
    height: 100% !important;
  }

  /* Make controls more compact in small charts */
  .charts-grid-fullscreen:fullscreen .ant-select {
    font-size: 12px;
  }

  .charts-grid-fullscreen:fullscreen .ant-btn-sm {
    font-size: 12px;
    padding: 0 7px;
  }

  /* Ensure color picker doesn't overflow */
  .charts-grid-fullscreen:fullscreen .ant-color-picker {
    max-width: 100%;
  }

  /* Drag handle styles */
  .drag-handle {
    cursor: grab !important;
    transition: all 0.2s;
  }

  .drag-handle:active {
    cursor: grabbing !important;
  }

  /* In fullscreen mode, make entire card draggable */
  .charts-grid-fullscreen:fullscreen .drag-handle {
    cursor: grab !important;
  }

  .charts-grid-fullscreen:fullscreen .drag-handle:hover .ant-card {
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15) !important;
  }
  
  /* Style improvements when dragging */
  .chart-card .react-draggable-dragging {
    opacity: 0.9 !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
    z-index: 1000 !important;
  }

  /* Animation when charts are being repositioned */
  .charts-grid-fullscreen:fullscreen .chart-card {
    transition: none;
  }

  .chart-card.resetting {
    transition: all 0.5s ease-in-out !important;
  }

  /* Override cursor for interactive elements inside drag handle */
  .drag-handle button,
  .drag-handle .ant-btn,
  .drag-handle button *,
  .drag-handle .ant-btn * {
    cursor: pointer !important;
  }

  .drag-handle input,
  .drag-handle .ant-input,
  .drag-handle input *,
  .drag-handle .ant-input * {
    cursor: text !important;
  }

  .drag-handle select,
  .drag-handle .ant-select,
  .drag-handle .ant-select *,
  .drag-handle select * {
    cursor: pointer !important;
  }

  .drag-handle .ant-color-picker,
  .drag-handle .ant-color-picker * {
    cursor: pointer !important;
  }

  .drag-handle .ant-color-picker-trigger,
  .drag-handle .ant-color-picker-color-block,
  .drag-handle .ant-color-picker-alpha-input,
  .drag-handle .ant-popover,
  .drag-handle .ant-popover * {
    cursor: pointer !important;
  }

  .drag-handle canvas {
    cursor: crosshair !important;
  }

  .drag-handle .ant-table,
  .drag-handle .ant-table *,
  .drag-handle table,
  .drag-handle table * {
    cursor: default !important;
  }

  .drag-handle .ant-table-row:hover,
  .drag-handle .ant-table-row:hover * {
    cursor: pointer !important;
  }

  /* Specific overrides for Ant Design components */
  .drag-handle .ant-select-selector,
  .drag-handle .ant-select-selection-item,
  .drag-handle .ant-select-selection-placeholder {
    cursor: pointer !important;
  }

  .drag-handle .anticon {
    cursor: inherit !important;
  }

  /* Prevent user selection during drag */
  .react-draggable-dragging {
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
  }

  /* Card body should allow normal interactions */
  .drag-handle .ant-card-body > * {
    cursor: default !important;
  }

  /* Chart content area - no grab cursor */
  .drag-handle .chart-content-area,
  .drag-handle .chart-content-area *,
  .drag-handle .chart-visualization,
  .drag-handle .chart-visualization * {
    cursor: default !important;
  }

  /* Visible horizontal scrollbar for chart area */
  .chart-visualization::-webkit-scrollbar {
    height: 8px;
  }
  .chart-visualization::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .chart-visualization::-webkit-scrollbar-thumb {
    background: #bbb;
    border-radius: 4px;
  }
  .chart-visualization::-webkit-scrollbar-thumb:hover {
    background: #888;
  }

  /* Allow specific cursors for interactive chart elements */
  .drag-handle .chart-visualization canvas {
    cursor: crosshair !important;
  }

  .drag-handle .chart-content-area .ant-table-tbody > tr {
    cursor: pointer !important;
  }

  /* Controls area should have appropriate cursors */
  .drag-handle .ant-select-dropdown {
    cursor: default !important;
  }

  /* Chart controls section */
  .drag-handle .chart-controls,
  .drag-handle .chart-controls * {
    cursor: default !important;
  }

  .drag-handle .chart-controls button,
  .drag-handle .chart-controls .ant-btn,
  .drag-handle .chart-controls .ant-color-picker,
  .drag-handle .chart-controls .ant-color-picker * {
    cursor: pointer !important;
    pointer-events: auto !important;
  }

  /* Select wrapper - prevent dragging */
  .drag-handle .select-wrapper,
  .drag-handle .select-wrapper * {
    cursor: default !important;
    pointer-events: auto !important;
  }

  .drag-handle .select-wrapper .ant-select-selector {
    cursor: pointer !important;
  }

  .drag-handle .select-wrapper .ant-select-selection-item {
    cursor: default !important;
  }

  .drag-handle .select-wrapper .ant-select-clear {
    cursor: pointer !important;
  }

  /* Ensure color picker popover is interactive */
  .ant-popover,
  .ant-popover * {
    pointer-events: auto !important;
    cursor: pointer !important;
  }

  /* Color picker specific overrides */
  .ant-color-picker-trigger,
  .ant-color-picker-color-block,
  .ant-color-picker-panel {
    pointer-events: auto !important;
    cursor: pointer !important;
  }

  /* Dragging styles */
  .chart-card-dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  /* Chart card container - 2 per row */
  .chart-card {
    width: 100%;
    min-height: 600px;
  }

  .chart-card .ant-card {
    height: 100%;
  }

  /* In fullscreen mode, allow flexible sizing */
  .charts-grid-fullscreen:fullscreen .chart-card {
    min-height: auto;
  }
`;

type YAxisType = 
  | "party" 
  | "religion" 
  | "caste" 
  | "subcaste" 
  | "age" 
  | "language" 
  | "schemes" 
  | "familyCount" 
  | "voterCount" 
  | "star-voter" 
  | "voterSlip" 
  | "familySlip" 
  | "whatsapp" 
  | "sms";

interface ChartDataPoint {
  partNo: number;
  label: string;
  count: number;
}

interface CompletenessDataPoint { 
  partNo: number; 
  withCount: number; 
  withoutCount: number; 
} 

interface ChartRuntimeCacheEntry {
  data: ChartDataPoint[];
  filterOptions: { label: string; value: string }[];
  categoryOptionsLoaded: boolean;
  lastDataFetchKey: string;
  lastFilterFetchKey: string;
  completenessData?: CompletenessDataPoint[]; 
  lastCompletenessFetchKey?: string; 
}

const graphChartRuntimeCache = new Map<string, ChartRuntimeCacheEntry>();

type SecondaryFilterType =
  | "party"
  | "religion"
  | "caste"
  | "subcaste"
  | "age"
  | "language"
  | "schemes";

const SECOND_LEVEL_FILTER_TYPES: SecondaryFilterType[] = [
  "party",
  "religion",
  "caste",
  "subcaste",
  "age",
  "language",
  "schemes",
];

const AGE_GROUP_OPTIONS = ["18-30", "30-40", "40-50", "50-60", "60-70", "70+"];

const getCategoryFilterLabel = (type?: SecondaryFilterType | null) => {
  switch (type) {
    case "party":
      return "Select Parties";
    case "religion":
      return "Select Religions";
    case "caste":
      return "Select Castes";
    case "subcaste":
      return "Select Sub-Castes";
    case "age":
      return "Select Age Groups";
    case "language":
      return "Select Languages";
    case "schemes":
      return "Select Schemes";
    default:
      return "Select Filter Values";
  }
};

const Y_AXIS_OPTIONS: { label: string; value: YAxisType }[] = [
  { label: "Party", value: "party" },
  { label: "Religion", value: "religion" },
  { label: "Caste", value: "caste" },
  { label: "Sub-Caste", value: "subcaste" },
  { label: "Age", value: "age" },
  { label: "Language", value: "language" },
  { label: "Schemes", value: "schemes" },
  { label: "Family Count", value: "familyCount" },
  { label: "Voter Count", value: "voterCount" },
  { label: "Star Voters", value: "star-voter" },
  { label: "Voter Slip", value: "voterSlip" },
  { label: "Family Slip", value: "familySlip" },
  { label: "Whatsapp", value: "whatsapp" },
  { label: "SMS", value: "sms" },
];

const BINARY_STACK_METRICS: YAxisType[] = [
  "star-voter",
  "voterSlip",
  "familySlip",
  "whatsapp",
  "sms",
];

const getMetricLabel = (type?: YAxisType | SecondaryFilterType | null) =>
  Y_AXIS_OPTIONS.find((option) => option.value === type)?.label || "Chart";

const getBinaryMetricLabels = (type?: YAxisType) => {
  const metricLabel = getMetricLabel(type);
  return {
    withLabel: `With ${metricLabel}`,
    withoutLabel: `Without ${metricLabel}`,
  };
};

const getDefaultChartTitle = (type?: YAxisType) => `Part No Vs ${getMetricLabel(type)}`;

const formatXAxisLabel = (partNo: number, label?: string, includeCategory?: boolean) => {
  if (includeCategory && label) {
    return [`Part ${partNo}`, label];
  }
  return `Part ${partNo}`;
};

const getLegacyDefaultChartTitle = (type?: YAxisType) => `${getMetricLabel(type)} by Part`;

const normalizeGraphChartConfig = (chart: ChartConfig): ChartConfig => ({
  ...chart,
  customTitle:
    !chart.customTitle || chart.customTitle === getLegacyDefaultChartTitle(chart.yAxisType as YAxisType)
      ? getDefaultChartTitle(chart.yAxisType as YAxisType)
      : chart.customTitle,
  selectedParts: Array.isArray(chart.selectedParts) ? chart.selectedParts : [],
  selectedCategoryLabels: Array.isArray(chart.selectedCategoryLabels)
    ? chart.selectedCategoryLabels
    : Array.isArray(chart.secondaryFilterValues)
      ? chart.secondaryFilterValues
      : [],
  secondaryFilterType: chart.secondaryFilterType ?? null,
  secondaryFilterValues: Array.isArray(chart.secondaryFilterValues)
    ? chart.secondaryFilterValues
    : [],
});

const VIEW_TYPES = [
  { label: "Bar Chart", value: "bar", icon: <BarChartOutlined /> },
  { label: "Line Chart", value: "line", icon: <LineChartOutlined /> },
  { label: "Stacked Chart", value: "stacked", icon: <AreaChartOutlined /> },
  { label: "Table View", value: "table", icon: <TableOutlined /> },
];

const DEFAULT_CHART_COLOR = "#1D4ED8";
const FULLSCREEN_DRAG_GRID = [20, 20] as const;
const MAX_GRAPH_CHARTS = 100;

// --- Components ---

const StaticGraphsDashboard: React.FC<StaticGraphsDashboardProps> = ({
  isActive = false,
}) => {
  const selectedElectionId = useSelector((state: RootState) => state.election.selectedElectionId);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [availableParts, setAvailableParts] = useState<number[]>([]);
  const [partyNameById, setPartyNameById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isGridFullscreen, setIsGridFullscreen] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedChartForSort, setSelectedChartForSort] = useState<string | null>(null);
  const [selectedChartForExport, setSelectedChartForExport] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const [saveStatus, setSaveStatus] = useState<Record<string, "saved" | "saving" | "unsaved">>({});
  const [resettingLayout, setResettingLayout] = useState(false);
  const [newChartMetric, setNewChartMetric] = useState<YAxisType>("voterCount");
  const [autoRefreshTick, setAutoRefreshTick] = useState(0);

  const [lastSuccessfulRefreshAt, setLastSuccessfulRefreshAt] = useState<number | null>(() => {
    const stored = localStorage.getItem("dashboard_last_recompute_graphs");
    return stored ? parseInt(stored, 10) : null;
  });
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'refreshing' | 'success' | 'error'>('idle');
  const pendingRefreshChartsRef = useRef<Set<string>>(new Set());
  const failedRefreshChartsRef = useRef<Set<string>>(new Set());
  const refreshPhaseRef = useRef<'idle' | 'recompute' | 'reload'>('idle');

  const formatRefreshTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const handleRefreshUpdate = useCallback((chartId: string, status: 'refreshing' | 'success' | 'error') => {
    if (status === 'refreshing') {
      refreshPhaseRef.current = 'reload';
      pendingRefreshChartsRef.current.add(chartId);
      failedRefreshChartsRef.current.delete(chartId);
      setRefreshStatus('refreshing');
      return;
    }

    pendingRefreshChartsRef.current.delete(chartId);

    if (status === 'error') {
      failedRefreshChartsRef.current.add(chartId);
    } else {
      failedRefreshChartsRef.current.delete(chartId);
    }

    if (pendingRefreshChartsRef.current.size === 0) {
      if (failedRefreshChartsRef.current.size > 0) {
        failedRefreshChartsRef.current.clear();
        refreshPhaseRef.current = 'idle';
        setRefreshStatus('error');
        return;
      }

      refreshPhaseRef.current = 'idle';
      setRefreshStatus('success');
    }
  }, []);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const chartRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const saveInFlightRef = useRef(false);
  const queuedChartsRef = useRef<ChartConfig[] | null>(null);

  // Initialize
  useEffect(() => {
    if (selectedElectionId) {
      loadConfig();
      fetchParts();
      void loadParties();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    pendingRefreshChartsRef.current.clear();
    failedRefreshChartsRef.current.clear();
    refreshPhaseRef.current = 'idle';
    setLastSuccessfulRefreshAt(null);
    setRefreshStatus('idle');
    setAutoRefreshTick(0);
  }, [selectedElectionId]);

  const waitForElectionRecomputeJob = useCallback(async (jobId: string) => {
    while (true) {
      const response = await getJobStatus(jobId);

      if (response.status !== "success" || !response.data) {
        throw new Error(response.message || "Failed to fetch job status");
      }

      if (response.data.status === "COMPLETED") {
        return;
      }

      if (["FAILED", "CANCELLED"].includes(response.data.status)) {
        throw new Error(response.data.errorMessage || `Job ${response.data.status.toLowerCase()}`);
      }

      await new Promise((resolve) => window.setTimeout(resolve, 3000));
    }
  }, []);

  useEffect(() => {
    const activeChartIds = new Set(charts.map((chart) => chart.id));
    pendingRefreshChartsRef.current.forEach((chartId) => {
      if (!activeChartIds.has(chartId)) {
        pendingRefreshChartsRef.current.delete(chartId);
      }
    });
    failedRefreshChartsRef.current.forEach((chartId) => {
      if (!activeChartIds.has(chartId)) {
        failedRefreshChartsRef.current.delete(chartId);
      }
    });

    if (charts.length === 0) {
      refreshPhaseRef.current = 'idle';
      setRefreshStatus('idle');
    } else if (
      pendingRefreshChartsRef.current.size === 0 &&
      refreshStatus === 'refreshing' &&
      refreshPhaseRef.current === 'reload'
    ) {
      if (failedRefreshChartsRef.current.size > 0) {
        failedRefreshChartsRef.current.clear();
        refreshPhaseRef.current = 'idle';
        setRefreshStatus('error');
      } else {
        refreshPhaseRef.current = 'idle';
        setRefreshStatus('success');
      }
    }
  }, [charts, refreshStatus]);

  const runGraphsRefresh = useCallback(async () => {
    if (!selectedElectionId || charts.length === 0) {
      return;
    }

    refreshPhaseRef.current = 'recompute';
    pendingRefreshChartsRef.current.clear();
    failedRefreshChartsRef.current.clear();
    setRefreshStatus('refreshing');

    try {
      const statsRefresh = recomputeElectionStats(Number(selectedElectionId));
      const supportingRefresh = Promise.all([
        recomputeDemographics(Number(selectedElectionId)),
        recomputePartyPolling(Number(selectedElectionId)),
      ]);

      const statsResult = await statsRefresh;
      if ('jobId' in statsResult) {
        await waitForElectionRecomputeJob((statsResult as AsyncRecomputeResponse).jobId);
      }

      await supportingRefresh;
      setAutoRefreshTick((currentTick) => currentTick + 1);
    } catch (error) {
      console.error('Graphs auto-refresh failed:', error);
      refreshPhaseRef.current = 'idle';
      setRefreshStatus('error');
    }
  }, [selectedElectionId, charts.length, waitForElectionRecomputeJob]);

  const handleManualRefresh = useCallback(() => {
    void runGraphsRefresh();
  }, [runGraphsRefresh]);

  usePersistentRefreshTimer({
    enabled: !!isActive && !!selectedElectionId && charts.length > 0 && refreshStatus !== 'refreshing',
    intervalMs: GRAPH_AUTO_REFRESH_INTERVAL_MS,
    storageKey: "dashboard_last_recompute_graphs",
    activationKey: `${selectedElectionId}-${charts.length}`,
    onTick: runGraphsRefresh,
    onTimestampUpdate: setLastSuccessfulRefreshAt,
  });

  const pendingChartCount = pendingRefreshChartsRef.current.size;
  const completedChartCount = charts.length > 0
    ? Math.max(0, charts.length - pendingChartCount)
    : 0;
  const chartRefreshProgress =
    refreshStatus === 'refreshing' && charts.length > 0 && pendingChartCount > 0
      ? (completedChartCount / charts.length) * 100
      : undefined;

  const refreshBannerTitle =
    refreshStatus === 'refreshing'
      ? 'Graphs dashboard recompute in progress'
      : refreshStatus === 'success'
      ? 'Graphs dashboard is up to date'
      : refreshStatus === 'error'
      ? 'Graphs dashboard refresh needs attention'
      : 'Graphs dashboard auto-refresh is ready';

  const refreshBannerDetail =
    refreshStatus === 'refreshing'
      ? pendingChartCount > 0
        ? `Refreshing ${completedChartCount} of ${charts.length} charts after aggregate recompute. Last successful refresh: ${formatRefreshTime(lastSuccessfulRefreshAt)}.`
        : `Recomputing shared dashboard aggregates before chart reload. Last successful refresh: ${formatRefreshTime(lastSuccessfulRefreshAt)}.`
      : refreshStatus === 'success'
      ? `Last refreshed at ${formatRefreshTime(lastSuccessfulRefreshAt)}. Auto-refresh runs every 10 minutes.`
      : refreshStatus === 'error'
      ? `The latest graphs refresh did not complete successfully. Last successful refresh: ${formatRefreshTime(lastSuccessfulRefreshAt)}.`
      : 'Auto-refresh will recompute and reload graph data every 10 minutes while you stay on this tab.';

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsGridFullscreen(document.fullscreenElement === gridRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const fetchParts = async () => {
    try {
      const response = await getPartsApi(Number(selectedElectionId));
      console.log("parts",response.data);
      const parts = (response?.data || [])
        .map((p: any) => Number(p.partNo))
        .filter((n: number) => !isNaN(n))
        .sort((a: number, b: number) => a - b);
      setAvailableParts(parts);
    } catch (error) {
      console.error("Error fetching parts:", error);
    }
  };

  const loadParties = async () => {
    try {
      const response = await fetchParties(Number(selectedElectionId));
      // fetchParties returns the ThedalResponse object; .data is the List<PartyResponseDTO>
      // PartyResponseDTO has: id (Long), partyName, partyShortName
      // partyCountsJson keys are string representations of party IDs e.g. "1", "2"
      const partyList: any[] = response?.data || [];
      const map: Record<string, string> = {};
      partyList.forEach((party: any) => {
        const id = party.id;
        const name = party.partyName || party.partyShortName;
        if (id != null && name) {
          // Store both exact string and numeric-string form
          map[String(id)] = name;
        }
      });
      setPartyNameById(map);
    } catch (error) {
      console.error("Error fetching parties:", error);
      setPartyNameById({});
    }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await getGraphChartConfig(Number(selectedElectionId));
      if (config && config.charts && config.charts.length > 0) {
        setCharts(config.charts.map((chart) => normalizeGraphChartConfig(chart)));
      } else {
        // Default 1 empty chart
        setCharts([{
          id: `chart-${Date.now()}`,
          selectedParts: [],
          yAxisType: "voterCount",
          viewType: "bar",
          chartColor: DEFAULT_CHART_COLOR,
          customTitle: getDefaultChartTitle("voterCount"),
          order: 0,
          selectedCategoryLabels: [],
          secondaryFilterType: null,
          secondaryFilterValues: []
        }]);
      }
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = useCallback(
    async function flushSaveQueue(newCharts?: ChartConfig[]) {
      if (newCharts) {
        queuedChartsRef.current = newCharts.map((chart) => normalizeGraphChartConfig(chart));
      }

      if (saveInFlightRef.current || !queuedChartsRef.current || !selectedElectionId) {
        return;
      }

      const chartsToSave = queuedChartsRef.current;
      queuedChartsRef.current = null;
      saveInFlightRef.current = true;

      const chartIds = chartsToSave.map((chart) => chart.id);
      setSaveStatus((prev) => {
        const next = { ...prev };
        chartIds.forEach((id) => {
          next[id] = "saving";
        });
        return next;
      });

      try {
        await saveGraphChartConfig(Number(selectedElectionId), chartsToSave);
        setSaveStatus((prev) => {
          const next = { ...prev };
          chartIds.forEach((id) => {
            next[id] = "saved";
          });
          return next;
        });
      } catch (error) {
        console.error("Error saving config:", error);
        setSaveStatus((prev) => {
          const next = { ...prev };
          chartIds.forEach((id) => {
            next[id] = "unsaved";
          });
          return next;
        });
      } finally {
        saveInFlightRef.current = false;
        if (queuedChartsRef.current) {
          void saveConfig();
        }
      }
    },
    [selectedElectionId]
  );

  const handleAddChart = () => {
    if (charts.length >= MAX_GRAPH_CHARTS) {
      message.warning(`Maximum ${MAX_GRAPH_CHARTS} charts allowed`);
      return;
    }
    setIsAddModalVisible(true);
  };

  const confirmAddChart = () => {
    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      selectedParts: [],
      yAxisType: newChartMetric,
      viewType: "bar",
      chartColor: DEFAULT_CHART_COLOR,
      customTitle: getDefaultChartTitle(newChartMetric),
      order: charts.length,
      showPercentage: false,
      sortOrder: undefined,
      selectedCategoryLabels: [],
      secondaryFilterType: null,
      secondaryFilterValues: []
    };
    const updatedCharts = [...charts, newChart];
    setCharts(updatedCharts);
    saveConfig(updatedCharts);
    setIsAddModalVisible(false);
  };

  const handleRemoveChart = (id: string) => {
    const updatedCharts = charts.filter(c => c.id !== id);
    setCharts(updatedCharts);
    saveConfig(updatedCharts);
  };

  const handleUpdateChart = (id: string, updates: Partial<ChartConfig>) => {
    const updatedCharts = charts.map(c => c.id === id ? { ...c, ...updates } : c);
    setCharts(updatedCharts);
    saveConfig(updatedCharts);
  };

  const toggleGridFullScreen = async () => {
    try {
      if (document.fullscreenElement === gridRef.current) {
        await document.exitFullscreen();
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      await gridRef.current?.requestFullscreen();
    } catch (error) {
      console.error("Error toggling grid fullscreen:", error);
      message.error("Unable to change fullscreen mode");
    }
  };

  const resetLayout = () => {
    setResettingLayout(true);
    const updatedCharts = charts.map((c, i) => ({
      ...c,
      x: (i % 2) * 500,
      y: Math.floor(i / 2) * 550,
      width: 480,
      height: 500,
    }));
    setCharts(updatedCharts);
    saveConfig(updatedCharts);
    setTimeout(() => setResettingLayout(false), 500);
  };

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = charts.findIndex(c => c.id === active.id);
      const newIndex = charts.findIndex(c => c.id === over.id);
      const updatedCharts = arrayMove(charts, oldIndex, newIndex).map((c, idx) => ({ ...c, order: idx }));
      setCharts(updatedCharts);
      saveConfig(updatedCharts);
    }
  };

  const handleExport = (format: "excel" | "pdf") => {
    message.info(`${format.toUpperCase()} export logic for Graphs Dashboard is under development.`);
    setExportModalVisible(false);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Spin size="large" tip="Loading Graphs Dashboard..." />
      </div>
    );
  }

  return (
    <div 
      className={`charts-grid-container ${isGridFullscreen ? "charts-grid-fullscreen" : ""}`} 
      ref={gridRef}
    >
      <style>{fullscreenStyles}</style>
      
      {!isGridFullscreen && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={4} style={{ margin: 0 }}>Graphs Dashboard</Title>
            <Text type="secondary">Visualize election data part-wise with dynamic metrics</Text>
            <div style={{ marginTop: '8px' }}>
              <RefreshStatusBanner
                status={refreshStatus}
                title={refreshBannerTitle}
                detail={refreshBannerDetail}
                progressPercent={chartRefreshProgress}
                busy={refreshStatus === 'refreshing'}
              />
            </div>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleManualRefresh}
              loading={refreshStatus === 'refreshing'}
              disabled={!selectedElectionId || charts.length === 0}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddChart}
              disabled={charts.length >= MAX_GRAPH_CHARTS}
            >
              Add Chart
            </Button>
            <Button 
              icon={<ReloadOutlined spin={refreshStatus === 'refreshing'} />} 
              onClick={runGraphsRefresh}
              disabled={refreshStatus === 'refreshing' || charts.length === 0}
            >
              Refresh Data
            </Button>
            <Button 
              icon={<FullscreenOutlined />} 
              onClick={toggleGridFullScreen}
            >
              Fullscreen Grid
            </Button>
          </Space>
        </div>
      )}

      {isGridFullscreen && (
        <div className="fullscreen-controls">
          <Tooltip title="Refresh Charts">
            <Button
              shape="circle"
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleManualRefresh}
              loading={refreshStatus === 'refreshing'}
              disabled={!selectedElectionId || charts.length === 0}
            />
          </Tooltip>
          <Tooltip title="Reset Layout">
            <Button
              shape="circle"
              size="large"
              icon={<ReloadOutlined />}
              onClick={resetLayout}
            />
          </Tooltip>
          <Tooltip title="Exit Fullscreen">
            <Button
              shape="circle"
              size="large"
              type="primary"
              icon={<FullscreenExitOutlined />}
              onClick={toggleGridFullScreen}
            />
          </Tooltip>
        </div>
      )}

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <div
          className="charts-wrapper"
          style={
            isGridFullscreen
              ? { position: 'relative', minHeight: '200vh' }
              : { display: 'flex', flexWrap: 'wrap', gap: '24px' }
          }
        >
          <SortableContext items={charts.map(c => c.id)} strategy={rectSortingStrategy}>
            {charts.map((chart, index) => (
              <div
                key={chart.id}
                className="chart-card-wrapper"
                style={
                  isGridFullscreen
                    ? { width: 'auto' }
                    : { width: 'calc(50% - 12px)', minWidth: 0 }
                }
              >
                <SortableChartCard 
                  chart={chart}
                  index={index}
                  availableParts={availableParts}
                  isGridFullscreen={isGridFullscreen}
                  onUpdate={(updates) => handleUpdateChart(chart.id, updates)}
                  onRemove={() => handleRemoveChart(chart.id)}
                  onSort={() => {
                    setSelectedChartForSort(chart.id);
                    setSortModalVisible(true);
                  }}
                  onExport={() => {
                    setSelectedChartForExport(chart.id);
                    setExportModalVisible(true);
                  }}
                  onRefresh={handleRefreshUpdate}
                  autoRefreshTick={autoRefreshTick}
                  editingTitleId={editingTitleId}
                  setEditingTitleId={setEditingTitleId}
                  editingTitleValue={editingTitleValue}
                  setEditingTitleValue={setEditingTitleValue}
                  saveStatus={saveStatus[chart.id] || "saved"}
                  chartCount={charts.length}
                  resettingLayout={resettingLayout}
                  partyNameById={partyNameById}
                />
              </div>
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* Add Chart Modal */}
      <Modal
        title="Add New Chart"
        open={isAddModalVisible}
        onOk={confirmAddChart}
        onCancel={() => setIsAddModalVisible(false)}
        okText="Create Chart"
      >
        <div className="py-4">
          <Text strong className="block mb-2">Select Y-Axis Metric</Text>
          <Select
            style={{ width: "100%" }}
            value={newChartMetric}
            onChange={setNewChartMetric}
            placeholder="Choose metric..."
          >
            {Y_AXIS_OPTIONS.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        </div>
      </Modal>

      {/* Sort Modal */}
      <Modal
        title="Sort Chart"
        open={sortModalVisible}
        onCancel={() => setSortModalVisible(false)}
        footer={null}
        width={300}
      >
        <Space direction="vertical" className="w-full">
          <Button
            size="large"
            block
            type={
              charts.find((c) => c.id === selectedChartForSort)?.sortOrder === "asc"
                ? "primary"
                : "default"
            }
            icon={<SortAscendingOutlined />}
            onClick={() => {
              if (selectedChartForSort) handleUpdateChart(selectedChartForSort, { sortOrder: "asc" });
              setSortModalVisible(false);
            }}
          >
            Show Ascending Values
          </Button>
          <Button
            size="large"
            block
            type={
              charts.find((c) => c.id === selectedChartForSort)?.sortOrder === "desc"
                ? "primary"
                : "default"
            }
            icon={<SortAscendingOutlined style={{ transform: "rotate(180deg)" }} />}
            onClick={() => {
              if (selectedChartForSort) handleUpdateChart(selectedChartForSort, { sortOrder: "desc" });
              setSortModalVisible(false);
            }}
          >
            Show Descending Values
          </Button>
          <Button
            size="large"
            block
            danger={!!charts.find((c) => c.id === selectedChartForSort)?.sortOrder}
            type={
              !charts.find((c) => c.id === selectedChartForSort)?.sortOrder
                ? "primary"
                : "default"
            }
            icon={<CloseCircleOutlined />}
            onClick={() => {
              if (selectedChartForSort) handleUpdateChart(selectedChartForSort, { sortOrder: undefined });
              setSortModalVisible(false);
            }}
          >
            Clear Sort (Default)
          </Button>
        </Space>
      </Modal>

      {/* Export Modal */}
      <Modal
        title="Export Chart Data"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
        width={480}
      >
        <div className="flex flex-col gap-4">
          <Card
            hoverable
            className="cursor-pointer transition-all hover:scale-[1.02]"
            style={{ border: "2px solid #217346", borderRadius: "12px" }}
            onClick={() => handleExport("excel")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: "#ecfdf5" }}
                >
                  <FileExcelOutlined style={{ fontSize: 24, color: "#217346" }} />
                </div>
                <div>
                  <h4 className="m-0 font-bold text-lg" style={{ color: "#217346" }}>Export as Excel</h4>
                  <Text type="secondary">Download data in XLSX format • Best for analysis</Text>
                </div>
              </div>
              <ArrowRightOutlined style={{ fontSize: 20, color: "#217346" }} />
            </div>
          </Card>

          <Card
            hoverable
            className="cursor-pointer transition-all hover:scale-[1.02]"
            style={{ border: "2px solid #ff4d4f", borderRadius: "12px" }}
            onClick={() => handleExport("pdf")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: "#fef2f2" }}
                >
                  <FilePdfOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />
                </div>
                <div>
                  <h4 className="m-0 font-bold text-lg" style={{ color: "#ff4d4f" }}>Export as PDF</h4>
                  <Text type="secondary">Download data in PDF format • Best for printing</Text>
                </div>
              </div>
              <ArrowRightOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
            </div>
          </Card>
        </div>
      </Modal>
    </div>
  );
};

// --- Helper Components ---

interface SortableChartCardProps {
  chart: ChartConfig;
  index: number;
  availableParts: number[];
  isGridFullscreen: boolean;
  onUpdate: (updates: Partial<ChartConfig>) => void;
  onRemove: () => void;
  onSort: () => void;
  onExport: () => void;
  onRefresh: (chartId: string, status: 'refreshing' | 'success' | 'error') => void;
  autoRefreshTick: number;
  editingTitleId: string | null;
  setEditingTitleId: (id: string | null) => void;
  editingTitleValue: string;
  setEditingTitleValue: (val: string) => void;
  saveStatus: "saved" | "saving" | "unsaved";
  chartCount: number;
  resettingLayout: boolean;
  partyNameById: Record<string, string>;
}

const SortableChartCard: React.FC<SortableChartCardProps> = ({
  chart,
  index,
  availableParts,
  isGridFullscreen,
  onUpdate,
  onRemove,
  onSort,
  onExport,
  onRefresh,
  autoRefreshTick,
  editingTitleId,
  setEditingTitleId,
  editingTitleValue,
  setEditingTitleValue,
  saveStatus,
  chartCount,
  resettingLayout,
  partyNameById,
}) => {
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [isCardFullscreen, setIsCardFullscreen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chart.id, disabled: isGridFullscreen });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsCardFullscreen(document.fullscreenElement === fullscreenRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleCardFullscreen = async () => {
    try {
      if (document.fullscreenElement === fullscreenRef.current) {
        await document.exitFullscreen();
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      await fullscreenRef.current?.requestFullscreen();
    } catch (error) {
      console.error("Error toggling chart fullscreen:", error);
      message.error("Unable to change chart fullscreen mode");
    }
  };

  const cardContent = (
    <div ref={fullscreenRef} className="chart-fullscreen-container h-full">
      <ChartCard 
        chart={chart}
        availableParts={availableParts}
        onUpdate={onUpdate}
        onRemove={onRemove}
        isGridFullscreen={isGridFullscreen}
        isFullscreen={isCardFullscreen}
        onFullscreen={handleCardFullscreen}
        onSort={onSort}
        onExport={onExport}
        onRefresh={onRefresh}
        autoRefreshTick={autoRefreshTick}
        editingTitleId={editingTitleId}
        setEditingTitleId={setEditingTitleId}
        editingTitleValue={editingTitleValue}
        setEditingTitleValue={setEditingTitleValue}
        saveStatus={saveStatus}
        chartCount={chartCount}
        dragHandleProps={{ ...attributes, ...listeners }}
        partyNameById={partyNameById}
      />
    </div>
  );

  if (isGridFullscreen) {
    // Default position if not saved
    const defaultX = (index % 2) * 600;
    const defaultY = Math.floor(index / 2) * 570;

     return (
    <div 
      ref={setNodeRef} 
      style={{ position: 'static' }}
      className={`chart-card ${resettingLayout ? "resetting" : ""}`}
    >
      <Rnd
        size={{ width: chart.width || 580, height: chart.height || 540 }}
        position={{ x: chart.x ?? defaultX, y: chart.y ?? defaultY }}
        bounds=".charts-wrapper"
        dragGrid={FULLSCREEN_DRAG_GRID}
        resizeGrid={FULLSCREEN_DRAG_GRID}
        onDragStop={(e, d) => onUpdate({ x: d.x, y: d.y })}
        onResizeStop={(e, direction, ref, delta, position) => {
          onUpdate({
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
            x: position.x,
            y: position.y,
          });
        }}
        minWidth={400}
        minHeight={400}
        dragHandleClassName="drag-handle"
        cancel="button, input, select, .ant-select, .ant-input, .ant-color-picker, .ant-popover, .ant-btn, canvas, .ant-table, .chart-content-area, .chart-visualization, .chart-controls, .select-wrapper"
        style={{ position: 'absolute' }}
        enableUserSelectHack={false}
      >
        <div className="drag-handle h-full">
          {cardContent}
        </div>
      </Rnd>
    </div>
  );
}

  return (
    <div ref={setNodeRef} style={style} className="chart-card">
      {cardContent}
    </div>
  );
};

interface ChartCardProps {
  chart: ChartConfig;
  availableParts: number[];
  onUpdate: (updates: Partial<ChartConfig>) => void;
  onRemove: () => void;
  dragHandleProps?: any;
  isGridFullscreen: boolean;
  isFullscreen: boolean;
  onFullscreen: () => void;
  onSort: () => void;
  onExport: () => void;
  onRefresh: (chartId: string, status: 'refreshing' | 'success' | 'error') => void;
  autoRefreshTick: number;
  editingTitleId: string | null;
  setEditingTitleId: (id: string | null) => void;
  editingTitleValue: string;
  setEditingTitleValue: (val: string) => void;
  saveStatus: "saved" | "saving" | "unsaved";
  chartCount: number;
  partyNameById: Record<string, string>;
}

const ChartCard: React.FC<ChartCardProps> = ({
  chart,
  availableParts,
  onUpdate,
  onRemove,
  dragHandleProps,
  isGridFullscreen,
  isFullscreen,
  onFullscreen,
  onSort,
  onExport,
  onRefresh,
  autoRefreshTick,
  editingTitleId,
  setEditingTitleId,
  editingTitleValue,
  setEditingTitleValue,
  saveStatus,
  chartCount,
  partyNameById,
}) => {
  const cachedRuntimeState = graphChartRuntimeCache.get(chart.id);
  const [data, setData] = useState<ChartDataPoint[]>(cachedRuntimeState?.data ?? []);
  const [filterOptions, setFilterOptions] = useState<
    { label: string; value: string }[]
  >(cachedRuntimeState?.filterOptions ?? []);
  const [categoryOptionsLoaded, setCategoryOptionsLoaded] = useState(cachedRuntimeState?.categoryOptionsLoaded ?? false);
  const [loading, setLoading] = useState(false);

  const [completenessData, setCompletenessData] = useState<CompletenessDataPoint[]>( 
    cachedRuntimeState?.completenessData ?? [] 
  ); 
  const [completenessLoading, setCompletenessLoading] = useState(false); 

  const selectedElectionId = useSelector((state: RootState) => state.election.selectedElectionId);
  const lastDataFetchKeyRef = useRef<string>(cachedRuntimeState?.lastDataFetchKey ?? "");
  const lastFilterFetchKeyRef = useRef<string>(cachedRuntimeState?.lastFilterFetchKey ?? "");
  const lastCompletenessFetchKeyRef = useRef<string>( 
    cachedRuntimeState?.lastCompletenessFetchKey ?? "" 
  ); 

  const supportsSecondLevelFilter = SECOND_LEVEL_FILTER_TYPES.includes(
    chart.yAxisType as SecondaryFilterType
  );
  const showsCategoryFilter =
    supportsSecondLevelFilter && !BINARY_STACK_METRICS.includes(chart.yAxisType);

  useEffect(() => {
    graphChartRuntimeCache.set(chart.id, {
      data,
      filterOptions,
      categoryOptionsLoaded,
      lastDataFetchKey: lastDataFetchKeyRef.current,
      lastFilterFetchKey: lastFilterFetchKeyRef.current,
      completenessData, 
      lastCompletenessFetchKey: lastCompletenessFetchKeyRef.current, 
    });
  }, [chart.id, data, filterOptions, categoryOptionsLoaded, completenessData]);

  const isEditing = editingTitleId === chart.id;

  const displayTitle = useMemo(() => {
    const defaultTitle = getDefaultChartTitle(chart.yAxisType!);
    const oldDefault = `${getMetricLabel(chart.yAxisType)} by Part`;
    if (!chart.customTitle || chart.customTitle === oldDefault) {
      return defaultTitle;
    }
    return chart.customTitle;
  }, [chart.customTitle, chart.yAxisType]);

  const handleTitleSave = () => {
    if (editingTitleValue.trim()) {
      onUpdate({ customTitle: editingTitleValue.trim() });
    }
    setEditingTitleId(null);
  };

  const handleTitleCancel = () => {
    setEditingTitleId(null);
  };

  const fetchData = useCallback(async (isAutoRefresh = false) => {
    if (!selectedElectionId) {
      lastDataFetchKeyRef.current = "";
      setData([]);
      return;
    }
    const partNos = chart.selectedParts.length > 0 ? chart.selectedParts : availableParts;
    if (partNos.length === 0) {
      lastDataFetchKeyRef.current = "";
      setData([]);
      return;
    }

    const requestKey = JSON.stringify({
      electionId: selectedElectionId,
      yAxisType: chart.yAxisType,
      partNos,
      ...(chart.yAxisType === "party" && { partyMapSize: Object.keys(partyNameById).length }),
    });

    if (!isAutoRefresh && lastDataFetchKeyRef.current === requestKey) {
      return;
    }

    lastDataFetchKeyRef.current = requestKey;
    setLoading(true);
    onRefresh(chart.id, 'refreshing');
    try {
      let rawData: any[] = [];
      const eid = Number(selectedElectionId);

      switch (chart.yAxisType) {
        case "voterCount":
        case "familyCount": {
          const stats = await getElectionStatsPartWise(eid, partNos);
          rawData = stats.map(s => ({
            partNo: Number(s.partNo),
            label: Y_AXIS_OPTIONS.find(o => o.value === chart.yAxisType)?.label || "",
            count: getMetricValue(s, chart.yAxisType!)
          }));
          break;
        }
        case "star-voter":
        case "voterSlip":
        case "familySlip":
        case "whatsapp":
        case "sms": {
          const stats = await getElectionStatsPartWise(eid, partNos);
          rawData = buildBinaryMetricData(stats, chart.yAxisType);
          break;
        }
        case "age": {
          const stats = await getElectionStatsPartWise(eid, partNos);
          rawData = stats.flatMap(s => [
            { partNo: Number(s.partNo), label: "18-30", count: s.age18To30 || 0 },
            { partNo: Number(s.partNo), label: "30-40", count: s.age30To40 || 0 },
            { partNo: Number(s.partNo), label: "40-50", count: s.age40To50 || 0 },
            { partNo: Number(s.partNo), label: "50-60", count: s.age50To60 || 0 },
            { partNo: Number(s.partNo), label: "60-70", count: s.age60To70 || 0 },
            { partNo: Number(s.partNo), label: "70+", count: s.ageGreaterThan70 || 0 },
          ]);
          break;
        }
        case "religion":
        case "caste":
        case "subcaste":
        case "language":
        case "schemes": {
          const demos = await getDemographicsPartWise(eid, partNos);
          rawData = demos.flatMap(d => parseDemoData(d, chart.yAxisType!));
          break;
        }
        case "party": {
          const parties = await getPartyPollingPartWise(eid, partNos);
          rawData = parties.flatMap(p => parsePartyData(p)).map(dp => ({
            ...dp,
            label: partyNameById[dp.label] || partyNameById[String(Number(dp.label))] || dp.label,
          }));
          break;
        }
      }
      setData(rawData);
      onRefresh(chart.id, 'success');
    } catch (error) {
      lastDataFetchKeyRef.current = "";
      console.error("Error fetching chart data:", error);
      onRefresh(chart.id, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedElectionId, chart.id, chart.selectedParts, chart.yAxisType, availableParts, partyNameById, onRefresh]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoRefreshTick === 0) {
      return;
    }

    void fetchData(true);
  }, [autoRefreshTick, fetchData]);

  const fetchCompletenessData = useCallback(async (isAutoRefresh = false) => { 
    if (!selectedElectionId || !chart.yAxisType) return; 
  
    const statField = COMPLETENESS_METRIC_MAP[chart.yAxisType]; 
    if (!statField) return; 
  
    const partNos = chart.selectedParts.length > 0 ? chart.selectedParts : availableParts; 
    if (partNos.length === 0) { setCompletenessData([]); return; } 
  
    const requestKey = JSON.stringify({ 
      electionId: selectedElectionId, 
      yAxisType: chart.yAxisType, 
      partNos, 
      mode: "completeness", 
    }); 
  
    if (!isAutoRefresh && lastCompletenessFetchKeyRef.current === requestKey) return; 
    lastCompletenessFetchKeyRef.current = requestKey; 
  
    setCompletenessLoading(true); 
    onRefresh(chart.id, 'refreshing'); 
    try { 
      const stats = await getElectionStatsPartWise(Number(selectedElectionId), partNos); 
      const points: CompletenessDataPoint[] =  stats 
        .map(s => { 
          const withCount = Number(s[statField] ?? 0); 
          const baseCount = chart.yAxisType === "familySlip" ? (s.totalFamily || 0) : (s.totalVoters || 0); 
          return { 
            partNo: Number(s.partNo), 
            withCount, 
            withoutCount: Math.max(0, baseCount - withCount), 
          }; 
        }) 
        .filter(p => (p.withCount + p.withoutCount) > 0) // skip truly empty parts
        .sort((a, b) => a.partNo - b.partNo); 
      setCompletenessData(points); 
      onRefresh(chart.id, 'success'); 
    } catch (error) { 
      lastCompletenessFetchKeyRef.current = ""; 
      console.error("Error fetching completeness data:", error); 
      onRefresh(chart.id, 'error'); 
    } finally { 
      setCompletenessLoading(false); 
    } 
  }, [selectedElectionId, chart.id, chart.yAxisType, chart.selectedParts, availableParts, onRefresh]); 

  useEffect(() => { 
    if (chart.showCompleteness) void fetchCompletenessData(); 
  }, [chart.showCompleteness, fetchCompletenessData]); 
  
  useEffect(() => { 
    if (autoRefreshTick === 0) return; 
    if (chart.showCompleteness) void fetchCompletenessData(true); 
  }, [autoRefreshTick, chart.showCompleteness, fetchCompletenessData]); 

  const loadCategoryOptions = useCallback(async () => {
    if (!selectedElectionId || !showsCategoryFilter) {
      lastFilterFetchKeyRef.current = "";
      setCategoryOptionsLoaded(false);
      setFilterOptions([]);
      return;
    }

    const metricType = chart.yAxisType as SecondaryFilterType;

    setCategoryOptionsLoaded(false);

    if (metricType === "age") {
      lastFilterFetchKeyRef.current = JSON.stringify({
        electionId: selectedElectionId,
        metricType,
        source: "age-static",
      });
      setFilterOptions(AGE_GROUP_OPTIONS.map((value) => ({ label: value, value })));
      setCategoryOptionsLoaded(true);
      return;
    }
    const partNos = chart.selectedParts.length > 0 ? chart.selectedParts : availableParts;
    if (partNos.length === 0) {
      lastFilterFetchKeyRef.current = "";
      setCategoryOptionsLoaded(true);
      setFilterOptions([]);
      return;
    }

    const requestKey = JSON.stringify({
      electionId: selectedElectionId,
      metricType,
      partNos,
      ...(metricType === "party" && { partyMapSize: Object.keys(partyNameById).length }),
    });

    if (lastFilterFetchKeyRef.current === requestKey) {
      setCategoryOptionsLoaded(true);
      return;
    }

    lastFilterFetchKeyRef.current = requestKey;

    try {
      const eid = Number(selectedElectionId);

      if (metricType === "party") {
        const parties = await getPartyPollingPartWise(eid, partNos);
        const nextOptions = Array.from(
          new Set(
            parties.flatMap((partyAggregate) =>
              parsePartyData(partyAggregate).map((entry) => {
                const rawId = String(entry.label);
                return partyNameById[rawId] || partyNameById[String(Number(rawId))] || rawId;
              })
            )
          )
        )
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
          .map((name) => ({ label: name, value: name }));
        setFilterOptions(nextOptions);
        setCategoryOptionsLoaded(true);
        return;
      }

      const demos = await getDemographicsPartWise(eid, partNos);
      const nextOptions = Array.from(
        new Set(
          demos.flatMap((demoAggregate) =>
            parseDemoData(demoAggregate, metricType as YAxisType)
              .map((entry) => entry.label)
              .filter((label) => label !== "total")
          )
        )
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ label: value, value }));
      setFilterOptions(nextOptions);
      setCategoryOptionsLoaded(true);
    } catch (error) {
      lastFilterFetchKeyRef.current = "";
      console.error("Error loading secondary filter options:", error);
      setFilterOptions([]);
      setCategoryOptionsLoaded(true);
    }
  }, [availableParts, chart.selectedParts, chart.yAxisType, partyNameById, selectedElectionId, showsCategoryFilter]);

  useEffect(() => {
    loadCategoryOptions();
  }, [loadCategoryOptions]);

  const filteredData = useMemo(() => {
    const selectedLabels = chart.selectedCategoryLabels || [];
    if (!selectedLabels.length) {
      return data;
    }

    const selectedSet = new Set(selectedLabels);
    return data.filter((entry) => selectedSet.has(entry.label));
  }, [data, chart.selectedCategoryLabels]);

  const resolvedFilterOptions = useMemo(() => {
    const optionMap = new Map<string, { label: string; value: string }>();

    filterOptions.forEach((option) => {
      optionMap.set(option.value, option);
    });

    (chart.selectedCategoryLabels || []).forEach((value) => {
      if (!optionMap.has(value)) {
        optionMap.set(value, { label: value, value });
      }
    });

    return Array.from(optionMap.values()).sort((firstOption, secondOption) =>
      firstOption.label.localeCompare(secondOption.label)
    );
  }, [chart.selectedCategoryLabels, filterOptions]);

  useEffect(() => {
    if (!showsCategoryFilter) {
      if ((chart.selectedCategoryLabels || []).length > 0) {
        onUpdate({ selectedCategoryLabels: [] });
      }
      return;
    }
  }, [chart.selectedCategoryLabels, onUpdate, showsCategoryFilter]);

  const getMetricValue = (s: ElectionStatsAggregate, type: YAxisType): number => {
    switch (type) {
      case "voterCount": return s.totalVoters || 0;
      case "familyCount": return s.totalFamily || 0;
      case "star-voter": return s.starVoters || 0;
      case "voterSlip": return s.voterSlipCount || 0;
      case "familySlip": return s.familySlipCount || 0;
      case "whatsapp": return s.whatsappCount || 0;
      case "sms": return s.smsCount || 0;
      default: return 0;
    }
  };

  const getBinaryMetricTotal = (stat: ElectionStatsAggregate, type: YAxisType): number => {
    switch (type) {
      case "star-voter":
      case "voterSlip":
      case "familySlip":
      case "whatsapp":
      case "sms":
        return getMetricValue(stat, type);
      default:
        return 0;
    }
  };

  const getBinaryMetricBase = (stat: ElectionStatsAggregate, type: YAxisType): number => {
    switch (type) {
      case "familySlip":
        return stat.totalFamily || 0;
      default:
        return stat.totalVoters || 0;
    }
  };

  const buildBinaryMetricData = (stats: ElectionStatsAggregate[], type: YAxisType): ChartDataPoint[] => {
    const { withLabel, withoutLabel } = getBinaryMetricLabels(type);

    return stats.flatMap((stat) => {
      const filledCount = getBinaryMetricTotal(stat, type);
      const baseCount = getBinaryMetricBase(stat, type);
      const withoutCount = Math.max(baseCount - filledCount, 0);
      const partNo = Number(stat.partNo || 0);

      return [
        { partNo, label: withLabel, count: filledCount },
        { partNo, label: withoutLabel, count: withoutCount },
      ];
    });
  };

  const parseDemoData = (d: DemographicsAggregate, type: YAxisType): ChartDataPoint[] => {
    const jsonStr = 
      type === "religion" ? d.religionJson :
      type === "caste" ? d.casteJson :
      type === "subcaste" ? d.subCasteJson :
      type === "language" ? d.languageJson :
      type === "schemes" ? d.schemesJson :
      type === "voterSlip" ? d.voterSlipJson :
      type === "familySlip" ? d.familySlipJson :
      type === "sms" ? d.smsJson :
      type === "whatsapp" ? d.whatsappJson : "";
    
    if (!jsonStr) return [];
    try {
      const obj = JSON.parse(jsonStr);
      return Object.entries(obj).map(([label, count]) => ({
        partNo: Number(d.partNo || 0),
        label,
        count: Number(count)
      }));
    } catch { return []; }
  };

  const parsePartyData = (p: PartyPollingAggregate): ChartDataPoint[] => {
    if (!p.partyCountsJson) return [];
    try {
      const obj = JSON.parse(p.partyCountsJson);
      return Object.entries(obj).map(([label, count]) => ({
        partNo: Number(p.partNo || 0),
        label,
        count: Number(count)
      }));
    } catch { return []; }
  };

  // ChartJS Data Transformation
  const chartData = useMemo(() => {
    // Apply sorting
    let sortedData = [...filteredData];
    if (chart.sortOrder) {
      sortedData.sort((a, b) => 
        chart.sortOrder === "asc" ? a.count - b.count : b.count - a.count
      );
    }

    // Group by part number
    const partNumbers = Array.from(new Set(sortedData.map(d => d.partNo))).sort((a, b) => a - b);
    const labels = Array.from(new Set(sortedData.map(d => d.label)));
    const totalCount = sortedData.reduce((acc, curr) => acc + curr.count, 0);

    const groupedPartNumbers =
      labels.length > 1 && chart.sortOrder
        ? [...partNumbers].sort((firstPart, secondPart) => {
            const firstTotal = sortedData
              .filter((entry) => entry.partNo === firstPart)
              .reduce((sum, entry) => sum + entry.count, 0);
            const secondTotal = sortedData
              .filter((entry) => entry.partNo === secondPart)
              .reduce((sum, entry) => sum + entry.count, 0);

            return chart.sortOrder === "asc"
              ? firstTotal - secondTotal
              : secondTotal - firstTotal;
          })
        : partNumbers;

    const buildSeriesValue = (count: number) => {
      if (chart.showPercentage && totalCount > 0) {
        return Number(((count / totalCount) * 100).toFixed(1));
      }
      return count;
    };

    if (chart.viewType === "stacked") {
      return {
        labels: partNumbers.map(p => `Part ${p}`),
        datasets: labels.map((label, idx) => ({
          label,
          data: partNumbers.map(p => sortedData.find(d => d.partNo === p && d.label === label)?.count || 0),
          backgroundColor: `hsla(${(idx * 360) / labels.length}, 70%, 50%, 0.7)`,
        }))
      };
    }

    if (labels.length > 1) {
      return {
        labels: groupedPartNumbers.map((partNo) => `Part ${partNo}`),
        datasets: labels.map((label, idx) => {
          const color = `hsla(${(idx * 360) / labels.length}, 70%, 50%, 0.75)`;
          return {
            label,
            data: groupedPartNumbers.map((partNo) => {
              const count =
                sortedData.find((entry) => entry.partNo === partNo && entry.label === label)?.count || 0;
              return buildSeriesValue(count);
            }),
            backgroundColor: color,
            borderColor: color.replace("0.75", "1"),
            borderWidth: 1,
            tension: 0.25,
            fill: false,
          };
        }),
      };
    }

    return {
      labels: sortedData.map((d) =>
        formatXAxisLabel(d.partNo, d.label, labels.length > 1)
      ),
      datasets: [{
        label: chart.customTitle || "Data",
        data: sortedData.map(d => {
          return buildSeriesValue(d.count);
        }),
        backgroundColor: chart.chartColor || DEFAULT_CHART_COLOR,
        borderColor: chart.chartColor || DEFAULT_CHART_COLOR,
        borderWidth: 1,
      }]
    };
  }, [filteredData, chart.viewType, chart.chartColor, chart.customTitle, chart.sortOrder, chart.showPercentage]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: chart.viewType === "stacked" || data.some(d => d.label !== chart.yAxisType) },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw;
            return `${context.dataset.label}: ${chart.showPercentage ? `${val}%` : formatIndianNumber(val)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: chart.viewType === "stacked",
        ticks: { 
          callback: (value: any) => chart.showPercentage ? `${value}%` : formatIndianNumber(value) 
        }
      },
      x: { 
        stacked: chart.viewType === "stacked",
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          padding: 10,
          font: {
            size: 11
          }
        }
      }
    },
    layout: {
      padding: {
        bottom: 28,
        left: 8,
        right: 8
      }
    }
  };

  const completenessChartData = useMemo(() => ({ 
    labels: completenessData.map(d => `Part ${d.partNo}`), 
    datasets: [ 
      { 
        label: `With ${getMetricLabel(chart.yAxisType)}`, 
        data: completenessData.map(d => d.withCount), 
        backgroundColor: "#52c41a", 
      }, 
      { 
        label: `Without ${getMetricLabel(chart.yAxisType)}`, 
        data: completenessData.map(d => d.withoutCount), 
        backgroundColor: "#ff4d4f", 
      }, 
    ], 
  }), [completenessData, chart.yAxisType]); 
  
  const completenessChartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { display: true }, 
      tooltip: { 
        callbacks: { 
          label: (ctx: any) => 
            `${ctx.dataset.label}: ${formatIndianNumber(ctx.raw as number)}`, 
        }, 
      }, 
    }, 
    scales: { 
      x: { stacked: false, ticks: { autoSkip: false, maxRotation: 0, minRotation: 0, padding: 10, font: { size: 11 } } }, 
      y: { stacked: false, beginAtZero: true, ticks: { callback: (v: any) => formatIndianNumber(v) } }, 
    }, 
    layout: { padding: { bottom: 28, left: 8, right: 8 } }, 
  }; 

  const activeChartData = chart.showCompleteness ? completenessChartData : chartData;
  const chartLabelCount = Array.isArray(activeChartData?.labels) ? activeChartData.labels.length : 0;
  const datasetCount = Array.isArray(activeChartData?.datasets) ? activeChartData.datasets.length : 1;
  // Each group of bars needs ~60px per dataset; each single bar needs ~60px minimum
  const MIN_BAR_GROUP_WIDTH = datasetCount > 1 ? datasetCount * 55 : 60;
  const minChartContentWidth = chartLabelCount * MIN_BAR_GROUP_WIDTH;
  const shouldEnableHorizontalScroll = chart.viewType !== "table" && minChartContentWidth > 400; // Lowered threshold to ensure scroll appears earlier
  const minScrollableChartWidth = shouldEnableHorizontalScroll
    ? Math.max(minChartContentWidth, 600)
    : undefined;

  const statsSummary = useMemo(() => {
    if (chart.showCompleteness) {
      if (completenessData.length === 0) return null;
      const totalWith = completenessData.reduce((acc, curr) => acc + curr.withCount, 0);
      const totalWithout = completenessData.reduce((acc, curr) => acc + curr.withoutCount, 0);
      const totalVoters = totalWith + totalWithout;
      const percent = totalVoters > 0 ? ((totalWith / totalVoters) * 100).toFixed(1) : "0.0";
      
      return (
        <span>
          Total Voters: <span style={{ color: "#2563EB", fontWeight: 700 }}>{formatIndianNumber(totalVoters)}</span> | 
          With Data: <span style={{ color: "#52c41a", fontWeight: 700 }}>{formatIndianNumber(totalWith)} ({percent}%)</span> | 
          Missing: <span style={{ color: "#ff4d4f", fontWeight: 700 }}>{formatIndianNumber(totalWithout)}</span>
        </span>
      );
    }

    if (filteredData.length === 0) return null;
    const total = filteredData.reduce((acc, curr) => acc + curr.count, 0);
    const uniqueLabels = Array.from(new Set(filteredData.map(d => d.label)));
    
    if (uniqueLabels.length === 1) {
      return (
        <span>
          Total: <span style={{ color: "#2563EB", fontWeight: 700 }}>{formatIndianNumber(total)}</span> | 
          Count: <span style={{ color: "#52c41a", fontWeight: 700 }}>{filteredData.length} Parts</span>
        </span>
      );
    } else {
      const topCategory = [...filteredData].sort((a, b) => b.count - a.count)[0];
      return (
        <span>
          Total Entries: <span style={{ color: "#2563EB", fontWeight: 700 }}>{formatIndianNumber(total)}</span> | 
          Top: <span style={{ color: "#52c41a", fontWeight: 700 }}>{topCategory.label} ({formatIndianNumber(topCategory.count)})</span>
        </span>
      );
    }
  }, [filteredData]);

  const isExpanded = isGridFullscreen || isFullscreen;

  return (
    <Card
      className="shadow-lg rounded-lg"
      style={{ 
        height: isExpanded ? "100%" : "600px", 
        width: "100%", 
        display: "flex", 
        flexDirection: "column" 
      }}
      bodyStyle={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        padding: "16px", 
        overflow: "hidden" 
      }}
    >
      {/* 1. Chart Card Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <div 
            className={`flex-shrink-0 text-gray-400 ${!isGridFullscreen ? "drag-handle" : ""}`}
            {...(!isGridFullscreen ? dragHandleProps : {})}
          >
            <DragOutlined style={{ fontSize: 16, color: "#666" }} />
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 group">
              {isEditing ? (
                <Input
                  size="small"
                  autoFocus
                  maxLength={50}
                  value={editingTitleValue}
                  onChange={(e) => setEditingTitleValue(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleSave();
                    if (e.key === "Escape") handleTitleCancel();
                  }}
                  className="max-w-[200px]"
                />
              ) : (
                <>
                  <h3 className="font-semibold text-gray-800 text-lg truncate m-0">
                    {displayTitle}
                    {chart.showCompleteness && ( 
                      <Tag color="blue" style={{ marginLeft: 6, fontSize: 11 }}>With / Without View</Tag> 
                    )} 
                  </h3>
                  <EditOutlined 
                    className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      setEditingTitleId(chart.id);
                      setEditingTitleValue(displayTitle);
                    }}
                  />
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1 mt-0.5">
              {saveStatus === "saving" ? (
                <>
                  <Spin size="small" />
                  <Text className="text-blue-500 text-xs">Auto-saving...</Text>
                </>
              ) : (
                <>
                  <CheckCircleOutlined className="text-green-500 text-xs" />
                  <Text className="text-green-500 text-xs">Auto-saved</Text>
                </>
              )}
            </div>
          </div>
        </div>

        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={onFullscreen}
          />
          {chartCount > 1 && (
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={onRemove}
            />
          )}
        </Space>
      </div>

      {/* 2. Parts Selector */}
      <div 
        className="select-wrapper"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Select
          mode="multiple"
          placeholder="Select Parts (All by default)"
          style={{ width: "100%", marginBottom: 16 }}
          showSearch
          allowClear
          maxTagCount="responsive"
          value={chart.selectedParts}
          options={availableParts.map(p => ({ label: `Part ${p}`, value: p }))}
          onChange={(val) => onUpdate({ selectedParts: val })}
          getPopupContainer={(trigger) => trigger.parentElement?.parentElement || document.body}
          dropdownRender={(menu) => (
            <>
              <div className="flex justify-between p-2">
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => onUpdate({ selectedParts: availableParts })}
                >
                  Select All
                </Button>
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => onUpdate({ selectedParts: [] })}
                >
                  Clear All
                </Button>
              </div>
              <Divider style={{ margin: "8px 0" }} />
              {menu}
            </>
          )}
          filterOption={(input, option) =>
            (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      {/* 2b. Metric Value Filter */}
      {showsCategoryFilter && !chart.showCompleteness && (
        <div
          className="select-wrapper mb-4"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Select
            mode="multiple"
            placeholder={getCategoryFilterLabel(chart.yAxisType as SecondaryFilterType)}
            style={{ width: "100%" }}
            showSearch
            allowClear
            maxTagCount="responsive"
            value={chart.selectedCategoryLabels || []}
            options={resolvedFilterOptions}
            notFoundContent="No values available"
            onChange={(val) => onUpdate({ selectedCategoryLabels: val })}
            getPopupContainer={(trigger) => trigger.parentElement?.parentElement || document.body}
            dropdownRender={(menu) => (
              <>
                <div className="flex justify-between p-2">
                  <Button
                    type="link"
                    size="small"
                    onClick={() =>
                      onUpdate({
                        selectedCategoryLabels: resolvedFilterOptions.map((option) => option.value),
                      })
                    }
                  >
                    Select All
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => onUpdate({ selectedCategoryLabels: [] })}
                  >
                    Clear All
                  </Button>
                </div>
                <Divider style={{ margin: "8px 0" }} />
                {menu}
              </>
            )}
            filterOption={(input, option) =>
              (option?.label ?? "")
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </div>
      )}

      {/* 3. Stats Summary Bar */}
      <Row className="mb-3">
        <Col span={24}>
          <div 
            style={{ 
              backgroundColor: "#F3F4F6", 
              padding: "8px 16px", 
              borderRadius: "8px", 
              border: "1px solid #d9d9d9" 
            }}
          >
            {loading ? <Skeleton.Button active size="small" block /> : statsSummary || "No data available"}
          </div>
        </Col>
      </Row>

      {/* 4. Chart Controls Row */}
      <div className="chart-controls flex items-center justify-between gap-2 mb-4">
        {!chart.showCompleteness && (
          <div 
            className="flex items-center"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ColorPicker
              value={chart.chartColor || DEFAULT_CHART_COLOR}
              onChange={(val) => onUpdate({ chartColor: val.toHexString() })}
              showText
              presets={[
                { label: 'Recommended', colors: ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1", "#13c2c2", "#eb2f96", "#fa8c16"] }
              ]}
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
            />
          </div>
        )}

        <div className="flex items-center gap-1">
          <Tooltip title="Export">
            <Button 
              type="text" 
              size="middle" 
              icon={<DownloadOutlined />} 
              onClick={onExport}
            />
          </Tooltip>
          <Tooltip title="Sort">
            <Button 
              type="text" 
              size="middle" 
              icon={<SortAscendingOutlined />} 
              onClick={onSort}
            />
          </Tooltip>
          <Tooltip title={chart.showPercentage ? "Show Count" : "Show Percentage"}>
            <Button 
              type={chart.showPercentage ? "primary" : "default"}
              size="middle" 
              icon={chart.showPercentage ? <PercentageOutlined /> : <NumberOutlined />}
              onClick={() => onUpdate({ showPercentage: !chart.showPercentage })}
            />
          </Tooltip>
          {COMPLETENESS_METRIC_MAP[chart.yAxisType!] && ( 
            <Tooltip title={chart.showCompleteness ? "Exit With / Without View" : "Show With / Without View"}> 
              <Button 
                type={chart.showCompleteness ? "primary" : "default"} 
                size="middle" 
                icon={<DatabaseOutlined />} 
                onClick={() => onUpdate({ showCompleteness: !chart.showCompleteness })} 
              /> 
            </Tooltip> 
          )} 
        </div>

        {!chart.showCompleteness && (
          <div>
            <Popover
              trigger="click"
              placement="bottomRight"
              overlayStyle={{ zIndex: 10000 }}
              getPopupContainer={() => document.fullscreenElement || document.body}
              content={
                <div className="flex flex-col gap-1 w-[180px]">
                  {VIEW_TYPES.map(vt => (
                    <Button
                      key={vt.value}
                      block
                      type={chart.viewType === vt.value ? "primary" : "default"}
                      icon={vt.icon}
                      onClick={() => onUpdate({ viewType: vt.value as any })}
                      className="flex items-center gap-2"
                    >
                      {vt.label}
                    </Button>
                  ))}
                </div>
              }
            >
              <Tooltip title="Change View">
                <Button type="primary" icon={<AreaChartOutlined />} size="middle" />
              </Tooltip>
            </Popover>
          </div>
        )}
      </div>

      {/* 5. Chart Content Area */}
      <div 
        style={{ 
          flex: 1, 
          minHeight: isGridFullscreen ? 0 : 360, 
          maxHeight: isGridFullscreen ? "none" : 420, 
          height: isGridFullscreen ? "100%" : 420, 
          overflow: "hidden", 
          display: "flex", 
          flexDirection: "column", 
        }}
        className="chart-content-area"
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (chart.showCompleteness ? completenessData : filteredData).length === 0 ? (
          <div className="flex items-center justify-center flex-1 text-gray-400">
            {chart.showCompleteness ? "No completeness data available" : "No polling data available for the selected filters"}
          </div>
        ) : (
          <div
            className="chart-visualization flex-1 min-h-0 relative w-full h-full"
            style={{
              paddingBottom: shouldEnableHorizontalScroll ? 0 : 8,
              overflowX: shouldEnableHorizontalScroll ? "scroll" : "hidden",
              overflowY: "hidden",
            }}
          >
            {shouldEnableHorizontalScroll && (
              <div className="mb-2 text-xs text-gray-500 text-right pr-1">
                Scroll horizontally to view all parts
              </div>
            )}
            {chart.viewType === "table" ? (
              <Table
                dataSource={chart.showCompleteness ? [] : filteredData} // Table not yet optimized for completeness view
                columns={[
                  { title: "Part No", dataIndex: "partNo", key: "partNo", sorter: (a, b) => a.partNo - b.partNo },
                  { title: "Metric", dataIndex: "label", key: "label" },
                  { title: "Count", dataIndex: "count", key: "count", sorter: (a, b) => a.count - b.count, render: (v) => formatIndianNumber(v) },
                ]}
                pagination={false}
                size="small"
                scroll={{ y: isGridFullscreen ? "100%" : 300 }}
              />
            ) : chart.viewType === "line" ? (
              <div
                style={{
                  width: shouldEnableHorizontalScroll ? minScrollableChartWidth : "100%",
                  minWidth: shouldEnableHorizontalScroll ? minScrollableChartWidth : "100%",
                  height: "100%",
                }}
              >
                <Line data={chart.showCompleteness ? completenessChartData : chartData} options={chart.showCompleteness ? completenessChartOptions : chartOptions} />
              </div>
            ) : (
              <div
                style={{
                  width: shouldEnableHorizontalScroll ? minScrollableChartWidth : "100%",
                  minWidth: shouldEnableHorizontalScroll ? minScrollableChartWidth : "100%",
                  height: "100%",
                }}
              >
                <Bar data={chart.showCompleteness ? completenessChartData : chartData} options={chart.showCompleteness ? completenessChartOptions : chartOptions} />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StaticGraphsDashboard;
