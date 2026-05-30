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
  Statistic,
  Progress,
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
  Switch,
  Tooltip,
  Popover,
} from "antd";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import { useSelector } from "react-redux";
import {
  usePollDayPartWisePolling,
  usePollDayFamilyWisePolling,
  usePollDaySectionWisePolling,
} from "../../hooks/useReportingSlices";
import {
  recomputePollDayPartWisePolling,
  recomputePollDayFamilyWisePolling,
  savePollDayChartConfig,
  getPollDayChartConfig,
  getElectionStatsPartWise,
  type ChartConfig as APIChartConfig,
  type PartWisePollingData,
  type FamilyWisePollingData,
} from "../../api/reportingApi";
import {
  getPollDayVotedSchemePartWiseCount,
  type PollDaySchemePartData,
} from "../../api/benefitSchemeApi";
import { getPartsApi } from "../../api/partApi";
import {
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
  PlusOutlined,
  DeleteOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  BarChartOutlined,
  LineChartOutlined,
  TableOutlined,
  EditOutlined,
  DragOutlined,
  SoundOutlined,
  WhatsAppOutlined,
  MessageOutlined,
  PhoneOutlined,
  NumberOutlined,
  PercentageOutlined,
  SortAscendingOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  TeamOutlined,
  AreaChartOutlined,
  DownloadOutlined,
  MinusCircleOutlined,
  StarOutlined,
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
import { useNavigate } from "react-router-dom";
import FilterDropdown from "./FilterDropdown";
import {
  createPollDayExport,
  pollPollDayExportJob,
  type ExportJobStatusResponse,
} from "../../api/pollDayExportApi";
import { formatIndianNumber } from "../../utlis";
import {
  requestResetVotersOtpApi,
  verifyResetVotersOtpApi,
} from "../../api/voterApi";
import ResetVotersModal from "../../components/Modals/ResetVotersModal";
import { useSchemeData } from "../../hooks/useSchemeData";

const { Title, Text } = Typography;

// Add fullscreen styles
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

  /* Ensure chart visualization area has proper height for X-axis labels */
  .chart-visualization {
    min-height: 300px !important;
    height: 300px !important;
    overflow: visible !important;
  }
  
  .chart-visualization canvas {
    min-height: 250px !important;
  }

  /* Fullscreen grid styles */
  .charts-grid-fullscreen:fullscreen {
    padding: 20px;
    background: #f5f5f5;
    overflow: auto;
    height: 100vh;
    position: relative;
  }

  /* Fullscreen controls - floating toolbar */
  .fullscreen-controls {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
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
    min-height: calc(100vh - 40px);
    min-width: 100%;
  }

  /* In fullscreen, free-form positioning */
  .charts-grid-fullscreen:fullscreen .chart-card {
    position: absolute;
  }

  /* Override Col in fullscreen - make it absolute positioned */
  .charts-grid-fullscreen:fullscreen .ant-col {
    position: static !important;
    width: auto !important;
    max-width: none !important;
    flex: none !important;
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
    flex-direction: column;
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

interface ChartConfig {
  id: string;
  selectedParts: number[];
  viewType?: "bar" | "line" | "table" | "stacked";
  customTitle?: string;
  chartColor?: string;
  order?: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  sortOrder?: "asc" | "desc";
  sortType?: "asc" | "desc";
  chartType?: "voterCount" | "familyCount" | "schemeVoterCount" | "sectionVoterCount" | "starVoterCount" | null;
  filters?: any; // PollDayFilters from reportingApi
  showPercentage?: boolean;
  selectedSchemeId?: number;
  selectedSchemeName?: string;
}

const getFullyVotedFamilies = (family: FamilyWisePollingData) =>
  family.fullyVotedFamilies ?? family.votedFamilies ?? 0;

// Sortable Chart Item Component
interface SortableChartItemProps {
  chart: ChartConfig;
  index: number;
  allParts: PartWisePollingData[];
  allFamilies: FamilyWisePollingData[];
  familySummaryData?: {
    totalFamilies: number;
    totalVotedFamilies: number;
    partiallyVotedFamilies?: number;
    totalNotVotedFamilies: number;
  };
  pollingDate?: string;
  saveStatus: { [key: string]: "saved" | "saving" | "unsaved" };
  editingTitleId: string | null;
  editingTitleValue: string;
  onUpdateChartParts: (chartId: string, parts: number[]) => void;
  onUpdateChartViewType: (
    chartId: string,
    viewType: "bar" | "line" | "table" | "stacked",
  ) => void;
  onUpdateChartColor: (chartId: string, color: string) => void;
  onUpdateChartSize: (chartId: string, width: number, height: number) => void;
  onUpdateChartPosition: (chartId: string, x: number, y: number) => void;
  onUpdateChartFilters: (chartId: string, filters: any) => void;
  onUpdateChartScheme: (
    chartId: string,
    schemeId?: number,
    schemeName?: string,
  ) => void;
  onRemoveChart: (chartId: string) => void;
  onToggleFullscreen: (chartId: string) => void;
  onOpenCampaign: (chart: ChartConfig) => void;
  onTitleDoubleClick: (chartId: string, currentTitle: string) => void;
  onTitleSave: (chartId: string) => void;
  onTitleCancel: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent, chartId: string) => void;
  setEditingTitleValue: (value: string) => void;
  fullscreenChartId: string | null;
  chartsLength: number;
  partNumbers: number[];
  loadingParts: boolean;
  renderDropdownWithSelectAll: (chartId: string) => React.ReactNode;
  schemes: any[];
  schemesLoading: boolean;
  refreshVersion: number;
  partWisePollingLoading: boolean;
  getChartDataForParts: (
    selectedParts: number[],
    chartColor: string,
    sortOrder?: "asc" | "desc",
  ) => any;
  getLineChartDataForParts: (
    selectedParts: number[],
    chartColor: string,
    sortOrder?: "asc" | "desc",
  ) => any;
  getTableDataForParts: (
    selectedParts: number[],
    sortOrder?: "asc" | "desc",
  ) => any;
  getStackedChartDataForParts: (
    selectedParts: number[],
    chartColor: string,
    sortOrder?: "asc" | "desc",
  ) => any;
  getFamilyChartData: (
    selectedParts: number[],
    chartColor: string,
    sortOrder?: "asc" | "desc",
  ) => any;
  getFamilyLineChartData: (
    selectedParts: number[],
    chartColor: string,
    sortOrder?: "asc" | "desc",
  ) => any;
  getFamilyTableData: (
    selectedParts: number[],
    sortOrder?: "asc" | "desc",
  ) => any;
  getFamilyStackedChartData: (
    selectedParts: number[],
    chartColor: string,
    sortOrder?: "asc" | "desc",
  ) => any;
  getSectionChartData: (sectionData: any[], chartColor?: string) => any;
  getSectionTableData: (sectionData: any[]) => any[];
  partWiseChartOptions: any;
  partWiseLineChartOptions: any;
  stackedChartOptions: any;
  starVoterBarOptions: any;
  sectionChartOptions: any;
  chartRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  isGridFullscreen: boolean;
  selectedElectionId: string;
  onOpenSortModal: (chartId: string) => void;
  onOpenExportModal: (chartId: string) => void;
  onToggleChartPercentage?: (chartId: string) => void;
  autoSaveChartConfig: () => Promise<void>;
}

const SortableChartItem: React.FC<SortableChartItemProps> = ({
  chart,
  index,
  allParts,
  allFamilies,
  familySummaryData,
  pollingDate,
  saveStatus,
  editingTitleId,
  editingTitleValue,
  onUpdateChartParts,
  onUpdateChartViewType,
  onUpdateChartColor,
  onUpdateChartSize,
  onUpdateChartPosition,
  onUpdateChartFilters,
  onUpdateChartScheme,
  onRemoveChart,
  onToggleFullscreen,
  onOpenCampaign,
  onTitleDoubleClick,
  onTitleSave,
  onTitleCancel,
  onTitleKeyDown,
  setEditingTitleValue,
  fullscreenChartId,
  chartsLength,
  partNumbers,
  loadingParts,
  renderDropdownWithSelectAll,
  schemes,
  schemesLoading,
  refreshVersion,
  partWisePollingLoading,
  getStackedChartDataForParts,
  getChartDataForParts,
  getLineChartDataForParts,
  getTableDataForParts,
  getFamilyChartData,
  getFamilyLineChartData,
  getFamilyTableData,
  getFamilyStackedChartData,
  getSectionChartData,
  getSectionTableData,
  partWiseChartOptions,
  partWiseLineChartOptions,
  stackedChartOptions,
  starVoterBarOptions,
  sectionChartOptions,
  chartRefs,
  isGridFullscreen,
  onOpenExportModal,
  onOpenSortModal,
  onToggleChartPercentage,
  autoSaveChartConfig,
}) => {
  const selectedElectionId = useSelector(
    (state: any) => state.election.selectedElectionId,
  );
  const [schemePartData, setSchemePartData] = useState<PollDaySchemePartData[]>(
    [],
  );
  const [schemePartLoading, setSchemePartLoading] = useState(false);

  const [starVoterPartData, setStarVoterPartData] = useState<
    Array<{
      partNo: number;
      totalVoters: number;
      starVoters: number;
      nonStarVoters: number;
    }>
  >([]);
  const [starVoterLoading, setStarVoterLoading] = useState(false);

  // Check if this chart has filters applied
  const chartHasFilters = React.useMemo(() => {
    if (!chart.filters) return false;
    const filterValues = Object.entries(chart.filters).filter(
      ([key, value]) => {
        // Ignore includeUnknownAge as it's always true by default
        if (key === "includeUnknownAge") return false;
        // Check if value is meaningful
        return (
          value !== undefined &&
          value !== null &&
          (!Array.isArray(value) || value.length > 0)
        );
      },
    );
    return filterValues.length > 0;
  }, [chart.filters]);

  const isFamilyChart = chart.chartType === "familyCount";
  const isSchemeChart = chart.chartType === "schemeVoterCount";
  const isSectionChart = chart.chartType === "sectionVoterCount";
  const isStarVoterChart = chart.chartType === "starVoterCount";
  const supportsPercentage =
    !isSchemeChart && !isSectionChart && !isStarVoterChart;
  const supportsChartFilters =
    !isSchemeChart && !isSectionChart && !isStarVoterChart;
  const supportsCampaign = !isSchemeChart && !isSectionChart;
  const supportsExport = !isSchemeChart && !isSectionChart;
  const supportsStackedView = !isSchemeChart && !isSectionChart;
  const shouldLoadFilteredParts =
    chartHasFilters &&
    !isFamilyChart &&
    !isSchemeChart &&
    !isSectionChart &&
    !isStarVoterChart;
  const shouldLoadFilteredFamilies = chartHasFilters && isFamilyChart;

  // For section chart, we only care about the first selected part
  const selectedSectionPart = chart.selectedParts[0] || 1;
  const sectionWisePolling = usePollDaySectionWisePolling(
    isSectionChart ? Number(selectedElectionId) : undefined,
    selectedSectionPart,
  );

  // Only fetch per-chart data when filters are applied
  // Pass undefined electionId to prevent API calls when no filters
  const chartPartWisePolling = usePollDayPartWisePolling(
    shouldLoadFilteredParts ? Number(selectedElectionId) || 0 : undefined,
    shouldLoadFilteredParts ? pollingDate : undefined,
    shouldLoadFilteredParts ? chart.filters : undefined,
    0,
  );

  const chartFamilyWisePolling = usePollDayFamilyWisePolling(
    shouldLoadFilteredFamilies ? Number(selectedElectionId) || 0 : undefined,
    shouldLoadFilteredFamilies ? pollingDate : undefined,
    shouldLoadFilteredFamilies ? chart.filters : undefined,
    0,
  );

  const getStarVoterChartData = (sortOrder?: "asc" | "desc") => {
    const partsToRender =
      chart.selectedParts.length > 0
        ? starVoterPartData.filter((d) => chart.selectedParts.includes(d.partNo))
        : starVoterPartData;

    let sortedParts = [...partsToRender];
    if (sortOrder) {
      sortedParts.sort((a, b) =>
        sortOrder === "asc"
          ? a.totalVoters - b.totalVoters
          : b.totalVoters - a.totalVoters,
      );
    }

    return {
      labels: sortedParts.map((d) => `${d.partNo}`),
      datasets: [
        {
          label: "Total Voters",
          data: sortedParts.map((d) => d.totalVoters),
          backgroundColor: "#1890ff",
          borderColor: "#1890ff",
          borderWidth: 1,
        },
        {
          label: "Star Voters",
          data: sortedParts.map((d) => d.starVoters),
          backgroundColor: "#722ed1",
          borderColor: "#722ed1",
          borderWidth: 1,
        },
        {
          label: "Non-Star Voters",
          data: sortedParts.map((d) => d.nonStarVoters),
          backgroundColor: "#ff4d4f",
          borderColor: "#ff4d4f",
          borderWidth: 1,
        },
      ],
    };
  };

  const getStarVoterTableData = (sortOrder?: "asc" | "desc") => {
    const partsToRender =
      chart.selectedParts.length > 0
        ? starVoterPartData.filter((d) => chart.selectedParts.includes(d.partNo))
        : starVoterPartData;

    let sortedParts = [...partsToRender];
    if (sortOrder) {
      sortedParts.sort((a, b) =>
        sortOrder === "asc"
          ? a.totalVoters - b.totalVoters
          : b.totalVoters - a.totalVoters,
      );
    }

    return sortedParts.map((d) => ({
      key: d.partNo,
      partNumber: d.partNo,
      totalVoters: d.totalVoters,
      starVoters: d.starVoters,
      nonStarVoters: d.nonStarVoters,
      starVoterPercent:
        d.totalVoters > 0
          ? ((d.starVoters / d.totalVoters) * 100).toFixed(2)
          : "0.00",
    }));
  };

  const starVoterTableColumns = [
    {
      title: "Part Number",
      dataIndex: "partNumber",
      key: "partNumber",
      sorter: (a: any, b: any) => a.partNumber - b.partNumber,
      width: 120,
    },
    {
      title: "Total Voters",
      dataIndex: "totalVoters",
      key: "totalVoters",
      sorter: (a: any, b: any) => a.totalVoters - b.totalVoters,
      render: (value: number) => (
        <span style={{ color: "#1890ff", fontWeight: "bold" }}>
          {formatIndianNumber(value ?? 0)}
        </span>
      ),
      width: 130,
    },
    {
      title: "Star Voters",
      dataIndex: "starVoters",
      key: "starVoters",
      sorter: (a: any, b: any) => a.starVoters - b.starVoters,
      render: (value: number) => (
        <span style={{ color: "#722ed1", fontWeight: "bold" }}>
          {formatIndianNumber(value ?? 0)}
        </span>
      ),
      width: 130,
    },
    {
      title: "Non-Star Voters",
      dataIndex: "nonStarVoters",
      key: "nonStarVoters",
      sorter: (a: any, b: any) => a.nonStarVoters - b.nonStarVoters,
      render: (value: number) => (
        <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>
          {formatIndianNumber(value ?? 0)}
        </span>
      ),
      width: 140,
    },
    {
      title: "Star Voter %",
      dataIndex: "starVoterPercent",
      key: "starVoterPercent",
      sorter: (a: any, b: any) =>
        parseFloat(a.starVoterPercent) - parseFloat(b.starVoterPercent),
      render: (value: string) => (
        <span style={{ color: "#722ed1", fontWeight: "bold" }}>{value}%</span>
      ),
      width: 120,
    },
  ];

  useEffect(() => {
    let isMounted = true;

    if (!isStarVoterChart || !selectedElectionId) {
      setStarVoterPartData([]);
      return () => {
        isMounted = false;
      };
    }

    const loadStarVoterData = async () => {
      setStarVoterLoading(true);
      try {
        const partNos =
          chart.selectedParts.length > 0 ? chart.selectedParts : partNumbers; // fallback to all available parts

        const stats = await getElectionStatsPartWise(
          Number(selectedElectionId),
          partNos.length > 0 ? partNos : undefined,
        );

        if (!isMounted) return;

        const mapped = stats
          .map((s) => ({
            partNo: Number(s.partNo || 0),
            totalVoters: s.totalVoters || 0,
            starVoters: s.starVoters || 0,
            nonStarVoters: Math.max(
              0,
              (s.totalVoters || 0) - (s.starVoters || 0),
            ),
          }))
          .filter((d) => d.partNo > 0)
          .sort((a, b) => a.partNo - b.partNo);

        setStarVoterPartData(mapped);
      } catch (error) {
        console.error("Error loading star voter chart data:", error);
        setStarVoterPartData([]);
      } finally {
        if (isMounted) setStarVoterLoading(false);
      }
    };

    void loadStarVoterData();

    return () => {
      isMounted = false;
    };
  }, [
    isStarVoterChart,
    selectedElectionId,
    chart.selectedParts,
    chart.chartType,
    partNumbers,
    refreshVersion,
  ]);

  useEffect(() => {
    let isMounted = true;

    if (!isSchemeChart || !selectedElectionId || !chart.selectedSchemeId) {
      setSchemePartData([]);
      setSchemePartLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const loadSchemePartData = async () => {
      try {
        setSchemePartLoading(true);
        const response = await getPollDayVotedSchemePartWiseCount(
          Number(selectedElectionId),
          chart.selectedSchemeId as number,
        );
        if (!isMounted) return;

        setSchemePartData(response?.parts || []);

        if (
          response?.schemeName &&
          response.schemeName !== chart.selectedSchemeName
        ) {
          onUpdateChartScheme(
            chart.id,
            chart.selectedSchemeId,
            response.schemeName,
          );
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading poll day scheme chart:", error);
        setSchemePartData([]);
      } finally {
        if (isMounted) {
          setSchemePartLoading(false);
        }
      }
    };

    void loadSchemePartData();

    return () => {
      isMounted = false;
    };
  }, [
    chart.id,
    chart.selectedSchemeId,
    chart.selectedSchemeName,
    isSchemeChart,
    onUpdateChartScheme,
    refreshVersion,
    selectedElectionId,
  ]);

  useEffect(() => {
    if (!chartHasFilters || refreshVersion === 0) return;

    if (isFamilyChart) {
      void chartFamilyWisePolling.softReload().catch((error) => {
        console.error("Error reloading filtered family chart:", error);
      });
      return;
    }

    void chartPartWisePolling.softReload().catch((error) => {
      console.error("Error reloading filtered voter chart:", error);
    });
  }, [
    chartHasFilters,
    refreshVersion,
    isFamilyChart,
    chartFamilyWisePolling.softReload,
    chartPartWisePolling.softReload,
  ]);

  // Use chart-specific data if filters are applied, otherwise use global data
  const partsData = chartHasFilters
    ? chartPartWisePolling.data?.parts || []
    : allParts;
  const familiesData = chartHasFilters
    ? chartFamilyWisePolling.data?.parts || []
    : allFamilies;
  const dataLoading = isSchemeChart
    ? schemePartLoading
    : isSectionChart
      ? sectionWisePolling.loading
      : isStarVoterChart
        ? starVoterLoading
        : chartHasFilters
          ? isFamilyChart
            ? chartFamilyWisePolling.loading
            : chartPartWisePolling.loading
          : partWisePollingLoading;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chart.id });

  const [chartTypePopoverVisible, setChartTypePopoverVisible] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Filter data based on chart type
  const filteredParts =
    chart.selectedParts.length > 0
      ? partsData.filter((part) =>
          chart.selectedParts.includes(part.partNumber),
        )
      : partsData;

  const filteredFamilies =
    chart.selectedParts.length > 0
      ? familiesData.filter((part) =>
          chart.selectedParts.includes(part.partNumber),
        )
      : familiesData;

  const selectedSchemeOption = schemes.find(
    (scheme) => Number(scheme.id) === Number(chart.selectedSchemeId),
  );
  const selectedSchemeName =
    chart.selectedSchemeName || selectedSchemeOption?.schemeName || "";
  const schemeChartParts = React.useMemo(() => {
    const baseParts =
      chart.selectedParts.length > 0
        ? chart.selectedParts
        : partNumbers.length > 0
          ? partNumbers
          : schemePartData.map((part) => part.partNo);

    const uniqueParts = Array.from(new Set(baseParts)).sort((a, b) => a - b);
    const votedCountMap = new Map(
      schemePartData.map((part) => [part.partNo, part.votedCount || 0]),
    );

    return uniqueParts.map((partNumber) => ({
      partNumber,
      votedCount: votedCountMap.get(partNumber) || 0,
    }));
  }, [chart.selectedParts, partNumbers, schemePartData]);

  const sectionData = React.useMemo(() => {
    if (!isSectionChart || !sectionWisePolling.data?.data) return [];

    // The API returns an array of parts, each with a 'sections' array
    // We filter for the selected part and flatten the sections
    const selectedPart = chart.selectedParts[0] || 1;
    const partData = sectionWisePolling.data.data.find(
      (p) => p.partNo === selectedPart,
    );

    return partData?.sections || [];
  }, [isSectionChart, sectionWisePolling.data, chart.selectedParts]);

  const hasRenderableChartData = isSchemeChart
    ? schemeChartParts.length > 0
    : isSectionChart
      ? sectionData.length > 0
      : isStarVoterChart
        ? starVoterPartData.length > 0
        : isFamilyChart
          ? filteredFamilies.length > 0
          : filteredParts.length > 0;

  const currentSaveStatus = saveStatus[chart.id] || "saved";
  const isFullscreen = fullscreenChartId === chart.id;

  // Table columns for Voter chart
  const voterTableColumns = [
    {
      title: "Part Number",
      dataIndex: "partNumber",
      key: "partNumber",
      sorter: (a: any, b: any) => a.partNumber - b.partNumber,
      width: 120,
    },
    {
      title: "Total Voters",
      dataIndex: "totalVoters",
      key: "totalVoters",
      sorter: (a: any, b: any) => a.totalVoters - b.totalVoters,
      render: (value: number) => formatIndianNumber(value ?? 0),
      width: 130,
    },
    {
      title: "Polled (2025)",
      dataIndex: "polled2025",
      key: "polled2025",
      sorter: (a: any, b: any) => a.polled2025 - b.polled2025,
      render: (value: number) => (
        <span style={{ color: "#52c41a", fontWeight: "bold" }}>
          {formatIndianNumber(value ?? 0)}
        </span>
      ),
      width: 130,
    },
    {
      title: "Not Voted",
      dataIndex: "didNotVote",
      key: "didNotVote",
      sorter: (a: any, b: any) => a.didNotVote - b.didNotVote,
      render: (value: number) => (
        <span style={{ color: "#ff4d4f" }}>
          {formatIndianNumber(value ?? 0)}
        </span>
      ),
      width: 130,
    },
    {
      title: "Turnout %",
      dataIndex: "turnoutPercentage",
      key: "turnoutPercentage",
      sorter: (a: any, b: any) =>
        parseFloat(a.turnoutPercentage) - parseFloat(b.turnoutPercentage),
      render: (value: string) => (
        <span style={{ color: "#722ed1", fontWeight: "bold" }}>{value}%</span>
      ),
      width: 120,
    },
  ];

  // Table columns for Family chart
  const familyTableColumns = [
    {
      title: "Part Number",
      dataIndex: "partNumber",
      key: "partNumber",
      sorter: (a: any, b: any) => a.partNumber - b.partNumber,
      width: 120,
    },
    {
      title: "Total Families",
      dataIndex: "totalFamilies",
      key: "totalFamilies",
      sorter: (a: any, b: any) => a.totalFamilies - b.totalFamilies,
      render: (value: number) => formatIndianNumber(value ?? 0),
      width: 130,
    },
    {
      title: "Fully Voted Families",
      dataIndex: "votedFamilies",
      key: "votedFamilies",
      sorter: (a: any, b: any) => a.votedFamilies - b.votedFamilies,
      render: (value: number) => (
        <span style={{ color: "#52c41a", fontWeight: "bold" }}>
          {formatIndianNumber(value ?? 0)}
        </span>
      ),
      width: 130,
    },
    {
      title: "Partially Voted",
      dataIndex: "partiallyVotedFamilies",
      key: "partiallyVotedFamilies",
      sorter: (a: any, b: any) =>
        a.partiallyVotedFamilies - b.partiallyVotedFamilies,
      render: (value: number) => (
        <span style={{ color: "#faad14", fontWeight: "bold" }}>
          {formatIndianNumber(value ?? 0)}
        </span>
      ),
      width: 140,
    },
    {
      title: "Not Voted",
      dataIndex: "notVotedFamilies",
      key: "notVotedFamilies",
      sorter: (a: any, b: any) => a.notVotedFamilies - b.notVotedFamilies,
      render: (value: number) => (
        <span style={{ color: "#ff4d4f" }}>
          {formatIndianNumber(value ?? 0)}
        </span>
      ),
      width: 130,
    },
    {
      title: "Voting %",
      dataIndex: "votingPercentage",
      key: "votingPercentage",
      sorter: (a: any, b: any) => a.votingPercentage - b.votingPercentage,
      render: (value: number) => (
        <span style={{ color: "#722ed1", fontWeight: "bold" }}>
          {value.toFixed(2)}%
        </span>
      ),
      width: 120,
    },
  ];

  const schemeTableColumns = [
    {
      title: "Part Number",
      dataIndex: "partNumber",
      key: "partNumber",
      sorter: (a: any, b: any) => a.partNumber - b.partNumber,
      width: 120,
    },
    {
      title: "Benefited & Voted",
      dataIndex: "votedCount",
      key: "votedCount",
      sorter: (a: any, b: any) => a.votedCount - b.votedCount,
      render: (value: number) => (
        <span style={{ color: "#52c41a", fontWeight: "bold" }}>
          {formatIndianNumber(value ?? 0)}
        </span>
      ),
      width: 160,
    },
  ];

  // Table columns for Section chart
  const sectionTableColumns = [
    {
      title: "Section No",
      dataIndex: "sectionNo",
      key: "sectionNo",
      sorter: (a: any, b: any) => a.sectionNo - b.sectionNo,
      width: 120,
    },
    {
      title: "Section Name",
      dataIndex: "sectionNameEn",
      key: "sectionNameEn",
      ellipsis: true,
      width: 300,
    },
    {
      title: "Voter Count",
      dataIndex: "voterCount",
      key: "voterCount",
      sorter: (a: any, b: any) => a.voterCount - b.voterCount,
      render: (value: number) => (
        <span style={{ color: "#1D4ED8", fontWeight: "bold" }}>
          {formatIndianNumber(value ?? 0)}
        </span>
      ),
      width: 130,
    },
  ];

  // Choose columns based on chart type
  const tableColumns = isSchemeChart
    ? schemeTableColumns
    : isSectionChart
      ? sectionTableColumns
      : isFamilyChart
        ? familyTableColumns
        : isStarVoterChart
          ? starVoterTableColumns
          : voterTableColumns;

  // Calculate partially voted families for stats bar
  const getPartiallyVotedFamilies = () => {
    if (!isFamilyChart) return 0;

    // If filters are applied, try to get from API
    if (
      chartHasFilters &&
      chartFamilyWisePolling.data?.summary?.partiallyVotedFamilies !== undefined
    ) {
      return chartFamilyWisePolling.data.summary.partiallyVotedFamilies;
    }

    // Use global summary data when no filters
    if (
      !chartHasFilters &&
      familySummaryData?.partiallyVotedFamilies !== undefined
    ) {
      return familySummaryData.partiallyVotedFamilies;
    }

    // Fallback: calculate from data
    const totalFamilies = filteredFamilies.reduce(
      (sum, part) => sum + part.totalFamilies,
      0,
    );
    const votedFamilies = filteredFamilies.reduce(
      (sum, part) => sum + getFullyVotedFamilies(part),
      0,
    );
    const notVotedFamilies = filteredFamilies.reduce(
      (sum, part) => sum + part.notVotedFamilies,
      0,
    );
    return Math.max(0, totalFamilies - (votedFamilies + notVotedFamilies));
  };

  const partiallyVotedFamilies = getPartiallyVotedFamilies();

  const getLocalSchemeChartData = (
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    let sortedParts = [...schemeChartParts];

    if (sortOrder) {
      sortedParts.sort((a, b) =>
        sortOrder === "asc"
          ? a.votedCount - b.votedCount
          : b.votedCount - a.votedCount,
      );
    }

    return {
      labels: sortedParts.map((part) => `${part.partNumber}`),
      datasets: [
        {
          label: selectedSchemeName
            ? `${selectedSchemeName} Benefited & Voted`
            : "Benefited & Voted",
          data: sortedParts.map((part) => part.votedCount || 0),
          backgroundColor: chartColor
            ? `${chartColor}CC`
            : "rgba(24, 144, 255, 0.8)",
          borderColor: chartColor || "rgba(24, 144, 255, 1)",
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        },
      ],
    };
  };

  const getLocalSchemeLineChartData = (
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    let sortedParts = [...schemeChartParts];

    if (sortOrder) {
      sortedParts.sort((a, b) =>
        sortOrder === "asc"
          ? a.votedCount - b.votedCount
          : b.votedCount - a.votedCount,
      );
    }

    return {
      labels: sortedParts.map((part) => `${part.partNumber}`),
      datasets: [
        {
          label: selectedSchemeName
            ? `${selectedSchemeName} Benefited & Voted`
            : "Benefited & Voted",
          data: sortedParts.map((part) => part.votedCount || 0),
          borderColor: chartColor || "rgba(24, 144, 255, 1)",
          backgroundColor: chartColor
            ? `${chartColor}33`
            : "rgba(24, 144, 255, 0.2)",
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  const getLocalSchemeTableData = (sortOrder?: "asc" | "desc") => {
    let sortedParts = [...schemeChartParts];

    if (sortOrder) {
      sortedParts.sort((a, b) =>
        sortOrder === "asc"
          ? a.votedCount - b.votedCount
          : b.votedCount - a.votedCount,
      );
    }

    return sortedParts.map((part) => ({
      key: part.partNumber,
      partNumber: part.partNumber,
      votedCount: part.votedCount || 0,
    }));
  };

  const schemeChartOptions = {
    ...partWiseChartOptions,
    layout: {
      padding: {
        bottom: 50,
      },
    },
    scales: {
      ...partWiseChartOptions.scales,
      x: {
        ...partWiseChartOptions.scales.x,
        ticks: {
          ...partWiseChartOptions.scales.x.ticks,
         
          autoSkip: false,
          font: { size: 10 },
        },
      },
    },
  };

  // Chart data generation functions using per-chart data (partsData/familiesData)
  const getLocalChartDataForParts = (
    selectedParts: number[],
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    const filteredParts =
      selectedParts.length > 0
        ? partsData.filter((part) => selectedParts.includes(part.partNumber))
        : partsData;

    let sortedParts = [...filteredParts];
    if (sortOrder) {
      sortedParts.sort((a, b) => {
        const aValue = chart.showPercentage
          ? a.totalVoters > 0
            ? (a.polled2025 / a.totalVoters) * 100
            : 0
          : a.polled2025 || 0;
        const bValue = chart.showPercentage
          ? b.totalVoters > 0
            ? (b.polled2025 / b.totalVoters) * 100
            : 0
          : b.polled2025 || 0;

        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      });
    } else {
      sortedParts.sort((a, b) => a.partNumber - b.partNumber);
    }

    const labels: string[] = [];
    const polledData: number[] = [];
    const barColor = chartColor ? `${chartColor}CC` : "rgba(24, 144, 255, 0.8)";
    const borderColor = chartColor || "rgba(24, 144, 255, 1)";

    sortedParts.forEach((part) => {
      labels.push(`${part.partNumber}`);
      if (chart.showPercentage) {
        const percentage =
          part.totalVoters > 0 ? (part.polled2025 / part.totalVoters) * 100 : 0;
        polledData.push(parseFloat(percentage.toFixed(2)));
      } else {
        polledData.push(part.polled2025 || 0);
      }
    });

    return {
      labels,
      datasets: [
        {
          label: chart.showPercentage ? "Turnout %" : "Polled Votes",
          data: polledData,
          backgroundColor: barColor,
          borderColor: borderColor,
          borderWidth: 1,
        },
      ],
    };
  };

  const getLocalFamilyChartData = (
    selectedParts: number[],
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    const filteredFamilies =
      selectedParts.length > 0
        ? familiesData.filter((part) => selectedParts.includes(part.partNumber))
        : familiesData;

    let sortedFamilies = [...filteredFamilies];
    if (sortOrder) {
      sortedFamilies.sort((a, b) => {
        const aValue = chart.showPercentage
          ? a.votingPercentage
          : getFullyVotedFamilies(a);
        const bValue = chart.showPercentage
          ? b.votingPercentage
          : getFullyVotedFamilies(b);

        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      });
    } else {
      sortedFamilies.sort((a, b) => a.partNumber - b.partNumber);
    }

    const labels: string[] = [];
    const votedData: number[] = [];
    const barColor = chartColor ? `${chartColor}CC` : "rgba(24, 144, 255, 0.8)";
    const borderColor = chartColor || "rgba(24, 144, 255, 1)";

    sortedFamilies.forEach((part) => {
      labels.push(`${part.partNumber}`);
      if (chart.showPercentage) {
        votedData.push(parseFloat(part.votingPercentage.toFixed(2)));
      } else {
        votedData.push(getFullyVotedFamilies(part));
      }
    });

    return {
      labels,
      datasets: [
        {
          label: chart.showPercentage ? "Voting %" : "Fully Voted Families",
          data: votedData,
          backgroundColor: barColor,
          borderColor: borderColor,
          borderWidth: 1,
        },
      ],
    };
  };

  const getLocalLineChartDataForParts = (
    selectedParts: number[],
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    const filteredParts =
      selectedParts.length > 0
        ? partsData.filter((part) => selectedParts.includes(part.partNumber))
        : partsData;

    let sortedParts = [...filteredParts];
    if (sortOrder) {
      sortedParts.sort((a, b) => {
        const aValue = chart.showPercentage
          ? a.totalVoters > 0
            ? (a.polled2025 / a.totalVoters) * 100
            : 0
          : a.polled2025 || 0;
        const bValue = chart.showPercentage
          ? b.totalVoters > 0
            ? (b.polled2025 / b.totalVoters) * 100
            : 0
          : b.polled2025 || 0;

        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      });
    } else {
      // Default sorting by part number when sortOrder is undefined
      sortedParts.sort((a, b) => a.partNumber - b.partNumber);
    }

    const labels: string[] = [];
    const polledData: number[] = [];

    sortedParts.forEach((part) => {
      labels.push(`${part.partNumber}`);
      if (chart.showPercentage) {
        const percentage =
          part.totalVoters > 0 ? (part.polled2025 / part.totalVoters) * 100 : 0;
        polledData.push(parseFloat(percentage.toFixed(2)));
      } else {
        polledData.push(part.polled2025 || 0);
      }
    });

    return {
      labels,
      datasets: [
        {
          label: chart.showPercentage ? "Turnout %" : "Polled Votes",
          data: polledData,
          fill: false,
          borderColor: chartColor || "rgb(75, 192, 192)",
          backgroundColor: chartColor || "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
        },
      ],
    };
  };

  const getLocalFamilyLineChartData = (
    selectedParts: number[],
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    const filteredFamilies =
      selectedParts.length > 0
        ? familiesData.filter((part) => selectedParts.includes(part.partNumber))
        : familiesData;

    let sortedFamilies = [...filteredFamilies];
    if (sortOrder) {
      sortedFamilies.sort((a, b) => {
        const aValue = chart.showPercentage
          ? a.votingPercentage
          : getFullyVotedFamilies(a);
        const bValue = chart.showPercentage
          ? b.votingPercentage
          : getFullyVotedFamilies(b);

        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      });
    } else {
      sortedFamilies.sort((a, b) => a.partNumber - b.partNumber);
    }

    const labels: string[] = [];
    const votedData: number[] = [];

    sortedFamilies.forEach((part) => {
      labels.push(`${part.partNumber}`);
      if (chart.showPercentage) {
        votedData.push(parseFloat(part.votingPercentage.toFixed(2)));
      } else {
        votedData.push(getFullyVotedFamilies(part));
      }
    });

    return {
      labels,
      datasets: [
        {
          label: chart.showPercentage ? "Voting %" : "Fully Voted Families",
          data: votedData,
          fill: false,
          borderColor: chartColor || "rgb(75, 192, 192)",
          backgroundColor: chartColor || "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
        },
      ],
    };
  };

  const getLocalStackedChartDataForParts = (
    selectedParts: number[],
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    const filteredParts =
      selectedParts.length > 0
        ? partsData.filter((part) => selectedParts.includes(part.partNumber))
        : partsData;

    let sortedParts = [...filteredParts];
    if (sortOrder) {
      sortedParts.sort((a, b) => {
        const aTotal = (a.polled2025 || 0) + (a.didNotVote || 0);
        const bTotal = (b.polled2025 || 0) + (b.didNotVote || 0);

        return sortOrder === "asc" ? aTotal - bTotal : bTotal - aTotal;
      });
    } else {
      // Default sorting by part number when sortOrder is undefined
      sortedParts.sort((a, b) => a.partNumber - b.partNumber);
    }

    const labels: string[] = [];
    const polledData: number[] = [];
    const notPolledData: number[] = [];

    sortedParts.forEach((part) => {
      labels.push(`${part.partNumber}`);
      polledData.push(part.polled2025 || 0);
      notPolledData.push(part.didNotVote || 0);
    });

    return {
      labels,
      datasets: [
        {
          label: "Polled",
          data: polledData,
          backgroundColor: "#52c41a",
          borderColor: "#52c41a",
          borderWidth: 1,
        },
        {
          label: "Not Polled",
          data: notPolledData,
          backgroundColor: "#ff4d4f",
          borderColor: "#ff4d4f",
          borderWidth: 1,
        },
      ],
    };
  };

  const getLocalFamilyStackedChartData = (
    selectedParts: number[],
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    const filteredFamilies =
      selectedParts.length > 0
        ? familiesData.filter((part) => selectedParts.includes(part.partNumber))
        : familiesData;

    let sortedFamilies = [...filteredFamilies];
    if (sortOrder) {
      sortedFamilies.sort((a, b) => {
        const aTotal = a.totalFamilies || 0;
        const bTotal = b.totalFamilies || 0;

        return sortOrder === "asc" ? aTotal - bTotal : bTotal - aTotal;
      });
    } else {
      sortedFamilies.sort((a, b) => a.partNumber - b.partNumber);
    }

    const labels: string[] = [];
    const votedData: number[] = [];
    const partiallyVotedData: number[] = [];
    const notVotedData: number[] = [];

    sortedFamilies.forEach((part) => {
      labels.push(`${part.partNumber}`);
      votedData.push(getFullyVotedFamilies(part));
      partiallyVotedData.push(part.partiallyVotedFamilies || 0);
      notVotedData.push(part.notVotedFamilies || 0);
    });

    return {
      labels,
      datasets: [
        {
          label: "Fully Voted Families",
          data: votedData,
          backgroundColor: "#52c41a",
          borderColor: "#52c41a",
          borderWidth: 1,
        },
        {
          label: "Partially Voted Families",
          data: partiallyVotedData,
          backgroundColor: "#faad14",
          borderColor: "#faad14",
          borderWidth: 1,
        },
        {
          label: "Not Voted Families",
          data: notVotedData,
          backgroundColor: "#ff4d4f",
          borderColor: "#ff4d4f",
          borderWidth: 1,
        },
      ],
    };
  };

  const getLocalTableDataForParts = (
    selectedParts: number[],
    sortOrder?: "asc" | "desc",
  ) => {
    const filteredParts =
      selectedParts.length > 0
        ? partsData.filter((part) => selectedParts.includes(part.partNumber))
        : partsData;

    let sortedParts = [...filteredParts];
    if (sortOrder) {
      sortedParts.sort((a, b) => {
        const aValue = chart.showPercentage
          ? a.totalVoters > 0
            ? (a.polled2025 / a.totalVoters) * 100
            : 0
          : a.polled2025 || 0;
        const bValue = chart.showPercentage
          ? b.totalVoters > 0
            ? (b.polled2025 / b.totalVoters) * 100
            : 0
          : b.polled2025 || 0;

        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      });
    } else {
      // Default sorting by part number when sortOrder is undefined
      sortedParts.sort((a, b) => a.partNumber - b.partNumber);
    }

    return sortedParts.map((part) => ({
      key: part.partNumber,
      partNumber: part.partNumber,
      totalVoters: part.totalVoters,
      polled2025: part.polled2025,
      didNotVote: part.didNotVote,
      turnoutPercentage:
        part.totalVoters > 0
          ? ((part.polled2025 / part.totalVoters) * 100).toFixed(2)
          : "0.00",
    }));
  };

  const getLocalFamilyTableData = (
    selectedParts: number[],
    sortOrder?: "asc" | "desc",
  ) => {
    const filteredFamilies =
      selectedParts.length > 0
        ? familiesData.filter((part) => selectedParts.includes(part.partNumber))
        : familiesData;

    let sortedFamilies = [...filteredFamilies];
    if (sortOrder) {
      sortedFamilies.sort((a, b) => {
        const aValue = chart.showPercentage
          ? a.votingPercentage
          : getFullyVotedFamilies(a);
        const bValue = chart.showPercentage
          ? b.votingPercentage
          : getFullyVotedFamilies(b);

        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      });
    } else {
      sortedFamilies.sort((a, b) => a.partNumber - b.partNumber);
    }
    return sortedFamilies.map((part) => ({
      key: part.partNumber,
      partNumber: part.partNumber,
      totalFamilies: part.totalFamilies,
      votedFamilies: getFullyVotedFamilies(part),
      partiallyVotedFamilies: part.partiallyVotedFamilies,
      notVotedFamilies: part.notVotedFamilies,
      votingPercentage: part.votingPercentage,
    }));
  };

  const chartCardContent = (
    <div
      ref={(el) => {
        if (el) chartRefs.current.set(chart.id, el);
        else chartRefs.current.delete(chart.id);
      }}
      className={`chart-fullscreen-container ${
        isGridFullscreen ? "drag-handle" : ""
      }`}
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Card
        className="shadow-lg rounded-lg"
        style={{
          height: isGridFullscreen ? "100%" : "600px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        bodyStyle={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "16px",
          overflow: "hidden",
        }}
      >
        <div
          className="flex justify-between items-center mb-4"
          style={{
            padding: "0",
            margin: "0",
            borderRadius: "4px",
            transition: "background 0.2s",
          }}
        >
          <div
            {...(!isGridFullscreen ? attributes : {})}
            {...(!isGridFullscreen ? listeners : {})}
            className="flex items-center gap-2 flex-1"
            style={{ minWidth: 0 }}
            title={isGridFullscreen ? "Drag to move" : "Drag to reorder"}
          >
            {/* Drag Handle Icon */}
            <div style={{ flexShrink: 0 }}>
              <DragOutlined style={{ fontSize: "16px", color: "#666" }} />
            </div>

            {/* Editable Chart Title */}
            <div className="flex-1" style={{ minWidth: 0 }}>
              {editingTitleId === chart.id ? (
                <Input
                  value={editingTitleValue}
                  onChange={(e) => setEditingTitleValue(e.target.value)}
                  onBlur={() => onTitleSave(chart.id)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    onTitleKeyDown(e, chart.id);
                  }}
                  autoFocus
                  maxLength={50}
                  className="font-semibold text-gray-800 text-lg"
                  style={{ width: "100%", maxWidth: "300px" }}
                  placeholder="Enter chart title"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div
                  className="flex items-center gap-2 px-2 py-1 rounded group"
                  style={{ minWidth: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3
                    className="font-semibold text-gray-800 text-lg m-0"
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chart.customTitle || "Untitled Chart"}
                  </h3>
                  <EditOutlined
                    className="text-gray-400 group-hover:text-blue-500 transition-colors text-sm cursor-pointer"
                    style={{ flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTitleDoubleClick(
                        chart.id,
                        chart.customTitle || "Untitled Chart",
                      );
                    }}
                    title="Click to edit chart name"
                  />
                </div>
              )}

              <div
                className="flex items-center gap-2"
                style={{ flexWrap: "wrap" }}
              >
                {currentSaveStatus === "saving" && (
                  <>
                    <Spin size="small" />
                    <span className="text-xs text-blue-500">
                      Auto-saving...
                    </span>
                  </>
                )}
                {currentSaveStatus === "unsaved" && (
                  <span className="text-xs text-orange-500">
                    <Spin size="small" style={{ marginRight: 4 }} />
                    Pending...
                  </span>
                )}
                {currentSaveStatus === "saved" && (
                  <span className="text-xs text-green-500">
                    <CheckCircleOutlined style={{ marginRight: 4 }} />
                    Auto-saved
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {chart.sortOrder && (
                <span className="flex items-center gap-1">
                  <SortAscendingOutlined />
                  {chart.sortOrder === "asc" ? "Ascending" : "Descending"}
                </span>
              )}
              {chart.sortOrder &&
                supportsPercentage &&
                chart.showPercentage !== undefined && <span>•</span>}
              {supportsPercentage && chart.showPercentage !== undefined && (
                <span className="flex items-center gap-1">
                  {chart.showPercentage ? (
                    <PercentageOutlined />
                  ) : (
                    <NumberOutlined />
                  )}
                  {chart.showPercentage ? "Percentage" : "Count"}
                </span>
              )}
              {!chart.sortOrder && (
                <span className="flex items-center gap-1 text-gray-400">
                  <DatabaseOutlined />
                  Default Order
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2" style={{ flexShrink: 0 }}>
            <Button
              type="text"
              icon={
                isFullscreen ? (
                  <FullscreenExitOutlined />
                ) : (
                  <FullscreenOutlined />
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggleFullscreen(chart.id);
              }}
              size="small"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            />
            {chartsLength > 1 && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveChart(chart.id);
                }}
                size="small"
                title="Remove Chart"
              />
            )}
          </div>
        </div>

        <div
          className="select-wrapper"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Select
            mode={isSectionChart ? undefined : "multiple"}
            placeholder={
              isSectionChart ? "Select Part" : "Select Parts (All by default)"
            }
            value={isSectionChart ? selectedSectionPart : chart.selectedParts}
            onChange={(value) =>
              onUpdateChartParts(
                chart.id,
                isSectionChart ? [value as number] : (value as number[]),
              )
            }
            style={{ width: "100%", marginBottom: 16 }}
            loading={loadingParts}
            showSearch
            allowClear={!isSectionChart}
            getPopupContainer={(trigger) =>
              trigger.parentElement?.parentElement || document.body
            }
            maxTagCount="responsive"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={partNumbers.map((pn) => ({
              value: pn,
              label: `Part ${pn}`,
            }))}
            dropdownRender={(menu) => (
              <>
                {!isSectionChart && renderDropdownWithSelectAll(chart.id)}
                {menu}
              </>
            )}
          />

          {isSchemeChart && (
            <Select
              placeholder="Select Scheme"
              value={chart.selectedSchemeId}
              onChange={(value) => {
                const scheme = schemes.find(
                  (item) => Number(item.id) === Number(value),
                );
                onUpdateChartScheme(
                  chart.id,
                  value,
                  scheme?.schemeName || scheme?.name,
                );
              }}
              style={{ width: "100%", marginBottom: 16 }}
              loading={schemesLoading}
              showSearch
              allowClear
              optionFilterProp="label"
              getPopupContainer={(trigger) =>
                trigger.parentElement?.parentElement || document.body
              }
              options={schemes.map((scheme) => ({
                value: Number(scheme.id),
                label: scheme.schemeName,
              }))}
            />
          )}

          {/* Chart-specific Voting Stats */}
          <Row className="mb-3">
            <Col span={24}>
              <div className="w-full flex justify-between items-center bg-[#F3F4F6] px-4 py-2 rounded-lg border border-gray-300 shadow-sm">
                {isSchemeChart ? (
                  <span className="text-[14px] font-semibold text-[#1F2937]">
                    Scheme:{" "}
                    <span className="text-[#2563EB]">
                      {selectedSchemeName || "Not selected"}
                    </span>{" "}
                    | Benefited & Voted:{" "}
                    <span className="text-[#52c41a]">
                      {formatIndianNumber(
                        schemeChartParts.reduce(
                          (acc, part) => acc + (part.votedCount || 0),
                          0,
                        ),
                      )}
                    </span>
                  </span>
                ) : isSectionChart ? (
                  <span className="text-[14px] font-semibold text-[#1F2937]">
                    Part:{" "}
                    <span className="text-[#2563EB]">
                      {selectedSectionPart}
                    </span>{" "}
                    | Total Sections:{" "}
                    <span className="text-[#52c41a]">{sectionData.length}</span>{" "}
                    | Total Voters:{" "}
                    <span className="text-[#722ed1]">
                      {formatIndianNumber(
                        sectionData.reduce(
                          (acc, sec) => acc + (sec.voterCount || 0),
                          0,
                        ),
                      )}
                    </span>
                  </span>
                ) : isFamilyChart ? (
                  <span className="text-[14px] font-semibold text-[#1F2937]">
                    Total Families:{" "}
                    <span className="text-[#2563EB]">
                      {formatIndianNumber(
                        filteredFamilies.reduce(
                          (acc, fam) => acc + (fam.totalFamilies || 0),
                          0,
                        ),
                      )}
                    </span>{" "}
                    | Fully Voted Families:{" "}
                    <span className="text-[#52c41a]">
                      {formatIndianNumber(
                        filteredFamilies.reduce(
                          (acc, fam) => acc + getFullyVotedFamilies(fam),
                          0,
                        ),
                      )}
                    </span>{" "}
                    | Not Voted:{" "}
                    <span className="text-[#ff4d4f]">
                      {formatIndianNumber(
                        filteredFamilies.reduce(
                          (acc, fam) => acc + (fam.notVotedFamilies || 0),
                          0,
                        ),
                      )}
                    </span>{" "}
                    | Partially Voted:{" "}
                    <span className="text-[#faad14]">
                      {formatIndianNumber(partiallyVotedFamilies)}
                    </span>
                  </span>
                ) : isStarVoterChart ? (
                  <span className="text-[14px] font-semibold text-[#1F2937]">
                    Total Voters:{" "}
                    <span className="text-[#1890ff]">
                      {formatIndianNumber(
                        starVoterPartData.reduce(
                          (acc, d) => acc + d.totalVoters,
                          0,
                        ),
                      )}
                    </span>{" "}
                    | Star Voters:{" "}
                    <span className="text-[#722ed1]">
                      {formatIndianNumber(
                        starVoterPartData.reduce(
                          (acc, d) => acc + d.starVoters,
                          0,
                        ),
                      )}
                    </span>{" "}
                    | Non-Star Voters:{" "}
                    <span className="text-[#ff4d4f]">
                      {formatIndianNumber(
                        starVoterPartData.reduce(
                          (acc, d) => acc + d.nonStarVoters,
                          0,
                        ),
                      )}
                    </span>{" "}
                    | Star %:{" "}
                    <span className="text-[#722ed1]">
                      {(() => {
                        const total = starVoterPartData.reduce(
                          (acc, d) => acc + d.totalVoters,
                          0,
                        );
                        const star = starVoterPartData.reduce(
                          (acc, d) => acc + d.starVoters,
                          0,
                        );
                        return total > 0
                          ? ((star / total) * 100).toFixed(2)
                          : "0.00";
                      })()}
                      %
                    </span>
                  </span>
                ) : (
                  <span className="text-[14px] font-semibold text-[#1F2937]">
                    Total Voters:{" "}
                    <span className="text-[#2563EB]">
                      {formatIndianNumber(
                        filteredParts.reduce(
                          (acc, part) => acc + (part.totalVoters || 0),
                          0,
                        ),
                      )}
                    </span>{" "}
                    | Voted:{" "}
                    <span className="text-[#52c41a]">
                      {formatIndianNumber(
                        filteredParts.reduce(
                          (acc, part) => acc + (part.polled2025 || 0),
                          0,
                        ),
                      )}
                    </span>{" "}
                    | Not Voted:{" "}
                    <span className="text-[#ff4d4f]">
                      {formatIndianNumber(
                        filteredParts.reduce(
                          (acc, part) => acc + (part.totalVoters || 0),
                          0,
                        ) -
                          filteredParts.reduce(
                            (acc, part) => acc + (part.polled2025 || 0),
                            0,
                          ),
                      )}
                    </span>{" "}
                    | Turnout:{" "}
                    <span className="text-[#722ed1]">
                      {filteredParts.reduce(
                        (acc, part) => acc + (part.totalVoters || 0),
                        0,
                      ) > 0
                        ? (
                            (filteredParts.reduce(
                              (acc, part) => acc + (part.polled2025 || 0),
                              0,
                            ) /
                              filteredParts.reduce(
                                (acc, part) => acc + (part.totalVoters || 0),
                                0,
                              )) *
                            100
                          ).toFixed(2)
                        : "0.00"}
                      %
                    </span>
                  </span>
                )}
              </div>
            </Col>
          </Row>
        </div>

        {/* Chart Controls: Arranged in a single row */}
        <div className="flex gap-2 mb-4 items-center justify-between chart-controls">
          {/* Left side: Color Picker */}
          <div
            className="flex items-center"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ColorPicker
              value={chart.chartColor || "#1890ff"}
              onChange={(color) => {
                const hexColor = color.toHexString();
                onUpdateChartColor(chart.id, hexColor);
              }}
              showText
              getPopupContainer={(trigger) =>
                trigger.parentElement || document.body
              }
              presets={[
                {
                  label: "Recommended",
                  colors: [
                    "#1890ff",
                    "#52c41a",
                    "#faad14",
                    "#f5222d",
                    "#722ed1",
                    "#13c2c2",
                    "#eb2f96",
                    "#fa8c16",
                  ],
                },
              ]}
            />
          </div>

          {/* Center: Action Icons */}
          <div className="flex items-center gap-1">
            {supportsChartFilters && (
              <FilterDropdown
                chartId={chart.id}
                selectedElectionId={selectedElectionId}
                currentFilters={chart.filters}
                onApply={(filters) => onUpdateChartFilters(chart.id, filters)}
              />
            )}
            {supportsCampaign && (
              <Tooltip
                title="Campaign"
                getPopupContainer={(trigger) => {
                  const fullscreenElement = document.querySelector(
                    ".chart-fullscreen-container:fullscreen, .charts-grid-fullscreen:fullscreen",
                  );
                  return (fullscreenElement ||
                    trigger.parentElement ||
                    document.body) as HTMLElement;
                }}
              >
                <Button
                  type="text"
                  icon={<SoundOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCampaign(chart);
                  }}
                  size="middle"
                />
              </Tooltip>
            )}
            <Tooltip
              title="Sort"
              getPopupContainer={(trigger) => {
                const fullscreenElement = document.querySelector(
                  ".chart-fullscreen-container:fullscreen, .charts-grid-fullscreen:fullscreen",
                );
                return (fullscreenElement ||
                  trigger.parentElement ||
                  document.body) as HTMLElement;
              }}
            >
              <Button
                type="text"
                icon={<SortAscendingOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSortModal(chart.id);
                }}
                size="middle"
              />
            </Tooltip>

            {supportsExport && (
              <Tooltip
                title="Export"
                getPopupContainer={(trigger) => {
                  const fullscreenElement = document.querySelector(
                    ".chart-fullscreen-container:fullscreen, .charts-grid-fullscreen:fullscreen",
                  );
                  return (fullscreenElement ||
                    trigger.parentElement ||
                    document.body) as HTMLElement;
                }}
              >
                <Button
                  type="text"
                  icon={<DownloadOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenExportModal(chart.id);
                  }}
                  size="middle"
                />
              </Tooltip>
            )}
            {supportsPercentage && (
              <Tooltip
                title={`Show ${chart.showPercentage ? "Count" : "Percentage"}`}
                getPopupContainer={(trigger) => {
                  const fullscreenElement = document.querySelector(
                    ".chart-fullscreen-container:fullscreen, .charts-grid-fullscreen:fullscreen",
                  );
                  return (fullscreenElement ||
                    trigger.parentElement ||
                    document.body) as HTMLElement;
                }}
              >
                <Button
                  type={chart.showPercentage ? "primary" : "default"}
                  icon={
                    chart.showPercentage ? (
                      <PercentageOutlined />
                    ) : (
                      <NumberOutlined />
                    )
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleChartPercentage?.(chart.id);
                  }}
                  size="middle"
                />
              </Tooltip>
            )}
          </div>

          {/* Right side: Chart Type Selector with Popover */}
          <Popover
            content={
              <div className="flex flex-col gap-2" style={{ width: 180 }}>
                <Button
                  type={
                    chart.viewType === "bar" || !chart.viewType
                      ? "primary"
                      : "default"
                  }
                  icon={<BarChartOutlined />}
                  onClick={() => {
                    onUpdateChartViewType(chart.id, "bar");
                    setChartTypePopoverVisible(false);
                  }}
                  block
                >
                  Bar Chart
                </Button>
                <Button
                  type={chart.viewType === "line" ? "primary" : "default"}
                  icon={<LineChartOutlined />}
                  onClick={() => {
                    onUpdateChartViewType(chart.id, "line");
                    setChartTypePopoverVisible(false);
                  }}
                  block
                >
                  Line Chart
                </Button>
                {supportsStackedView && (
                  <Button
                    type={chart.viewType === "stacked" ? "primary" : "default"}
                    icon={<AppstoreOutlined />}
                    onClick={() => {
                      onUpdateChartViewType(chart.id, "stacked");
                      setChartTypePopoverVisible(false);
                    }}
                    block
                  >
                    Stacked Chart
                  </Button>
                )}
                <Button
                  type={chart.viewType === "table" ? "primary" : "default"}
                  icon={<TableOutlined />}
                  onClick={() => {
                    onUpdateChartViewType(chart.id, "table");
                    setChartTypePopoverVisible(false);
                  }}
                  block
                >
                  Table View
                </Button>
              </div>
            }
            title="Chart View"
            trigger="click"
            open={chartTypePopoverVisible}
            onOpenChange={setChartTypePopoverVisible}
            placement="bottomRight"
            getPopupContainer={(trigger) => {
              // Render popover inside fullscreen container if in fullscreen
              const fullscreenElement = document.querySelector(
                ".chart-fullscreen-container:fullscreen, .charts-grid-fullscreen:fullscreen",
              );
              return (fullscreenElement ||
                trigger.parentElement ||
                document.body) as HTMLElement;
            }}
            overlayStyle={{ zIndex: 10000 }}
          >
            <Tooltip
              title="Change View"
              getPopupContainer={(trigger) => {
                const fullscreenElement = document.querySelector(
                  ".chart-fullscreen-container:fullscreen, .charts-grid-fullscreen:fullscreen",
                );
                return (fullscreenElement ||
                  trigger.parentElement ||
                  document.body) as HTMLElement;
              }}
            >
              <Button
                type="primary"
                icon={<AreaChartOutlined />}
                size="middle"
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popover>
        </div>

        <div
          className="chart-content-area"
          style={{
            flex: 1,
            minHeight: isGridFullscreen ? 0 : 400,
            maxHeight: isGridFullscreen ? "none" : 400,
            height: isGridFullscreen ? "100%" : 400,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {dataLoading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : isSchemeChart && !chart.selectedSchemeId ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a scheme to view the chart</p>
            </div>
          ) : hasRenderableChartData ? (
            <>
              {currentSaveStatus === "saving" && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 10,
                  }}
                >
                  <Spin size="large" tip="Auto-saving..." />
                </div>
              )}

              <div
                className="chart-visualization"
                style={{
                  flex: 1,
                  minHeight: 0,
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  overflow: isSchemeChart ? "visible" : "auto",
                }}
              >
                {(chart.viewType === "bar" || !chart.viewType) && (
                  <div style={{ width: "100%", height: "100%" }}>
                    <Bar
                      key={`${chart.id}-${chart.width}-${chart.height}`}
                      data={
                        isStarVoterChart
                          ? getStarVoterChartData(chart.sortOrder)
                          : isSchemeChart
                            ? getLocalSchemeChartData(
                                chart.chartColor || "#1890ff",
                                chart.sortOrder,
                              )
                            : isSectionChart
                              ? getSectionChartData(
                                  sectionData,
                                  chart.chartColor || "#1D4ED8",
                                )
                              : isFamilyChart
                                ? getLocalFamilyChartData(
                                    chart.selectedParts,
                                    chart.chartColor || "#1890ff",
                                    chart.sortOrder,
                                  )
                                : getLocalChartDataForParts(
                                    chart.selectedParts,
                                    chart.chartColor || "#1890ff",
                                    chart.sortOrder,
                                  )
                      }
                      options={{
                        ...(isStarVoterChart
                          ? starVoterBarOptions
                          : isSectionChart
                            ? sectionChartOptions
                            : isSchemeChart
                              ? schemeChartOptions
                              : partWiseChartOptions),
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                          ...(isStarVoterChart
                            ? starVoterBarOptions.plugins
                            : isSectionChart
                              ? sectionChartOptions.plugins
                              : isSchemeChart
                                ? schemeChartOptions.plugins
                                : partWiseChartOptions.plugins),
                          tooltip: {
                            ...(isStarVoterChart
                              ? starVoterBarOptions.plugins.tooltip
                              : isSectionChart
                                ? sectionChartOptions.plugins.tooltip
                                : isSchemeChart
                                  ? schemeChartOptions.plugins.tooltip
                                  : partWiseChartOptions.plugins.tooltip),
                            callbacks: {
                              label: (context: any) => {
                                if (isStarVoterChart) {
                                  return `${
                                    context.dataset.label
                                  }: ${formatIndianNumber(context.parsed.y)}`;
                                }
                                if (isSectionChart) {
                                  const index = context.dataIndex;
                                  const section = sectionData[index];
                                  return `Voters: ${section.voterCount}`;
                                }
                                return `Voters: ${context.parsed.y}`;
                              },
                              afterLabel: (context: any) => {
                                if (isSectionChart) {
                                  const index = context.dataIndex;
                                  const section = sectionData[index];
                                  return `Name: ${section.sectionNameEn}`;
                                }
                                return "";
                              },
                            },
                          },
                        },
                        scales: {
                          ...(isStarVoterChart
                            ? starVoterBarOptions.scales
                            : isSectionChart
                              ? sectionChartOptions.scales
                              : isSchemeChart
                                ? schemeChartOptions.scales
                                : partWiseChartOptions.scales),
                          y: {
                            ...(isStarVoterChart
                              ? starVoterBarOptions.scales.y
                              : isSectionChart
                                ? sectionChartOptions.scales.y
                                : isSchemeChart
                                  ? schemeChartOptions.scales.y
                                  : partWiseChartOptions.scales.y),
                            title: {
                              ...(isStarVoterChart
                                ? starVoterBarOptions.scales.y.title
                                : isSectionChart
                                  ? sectionChartOptions.scales.y.title
                                  : isSchemeChart
                                    ? schemeChartOptions.scales.y.title
                                    : partWiseChartOptions.scales.y.title),
                              text: isStarVoterChart
                                ? "Voter Count"
                                : isSchemeChart
                                  ? "Benefited Voters"
                                  : isSectionChart
                                    ? "Voter Count"
                                    : isFamilyChart
                                      ? chart.showPercentage
                                        ? "Percentage (%)"
                                        : "Family Count"
                                      : chart.showPercentage
                                        ? "Percentage (%)"
                                        : "Voter Count",
                            },
                          },
                        },
                      }}
                      plugins={[
                        {
                          id: "datalabels",
                          afterDraw: (chartInstance) => {
                            const ctx = chartInstance.ctx;
                            chartInstance.data.datasets.forEach(
                              (dataset, i) => {
                                const meta = chartInstance.getDatasetMeta(i);
                                meta.data.forEach((bar, idx) => {
                                  const data = dataset.data[idx];
                                  if (data) {
                                    ctx.fillStyle = "#1f2937";
                                    ctx.font = "bold 11px Arial";
                                    ctx.textAlign = "center";
                                    ctx.fillText(
                                      data as number,
                                      bar.x,
                                      bar.y - 10,
                                    );
                                  }
                                });
                              },
                            );
                          },
                        },
                      ]}
                    />
                  </div>
                )}
                {chart.viewType === "line" && (
                  <div style={{ width: "100%", height: "100%" }}>
                    <Line
                      key={`${chart.id}-${chart.width}-${chart.height}`}
                      data={
                        isStarVoterChart
                          ? getStarVoterChartData(chart.sortOrder)
                          : isSchemeChart
                            ? getLocalSchemeLineChartData(
                                chart.chartColor || "#1890ff",
                                chart.sortOrder,
                              )
                            : isFamilyChart
                              ? getLocalFamilyLineChartData(
                                  chart.selectedParts,
                                  chart.chartColor || "#1890ff",
                                  chart.sortOrder,
                                )
                              : getLocalLineChartDataForParts(
                                  chart.selectedParts,
                                  chart.chartColor || "#1890ff",
                                  chart.sortOrder,
                                )
                      }
                      options={{
                        ...(isStarVoterChart
                          ? starVoterBarOptions
                          : partWiseLineChartOptions),
                        maintainAspectRatio: false,
                        responsive: true,
                        scales: {
                          ...(isStarVoterChart
                            ? starVoterBarOptions.scales
                            : partWiseLineChartOptions.scales),
                          y: {
                            ...(isStarVoterChart
                              ? starVoterBarOptions.scales.y
                              : partWiseLineChartOptions.scales.y),
                            title: {
                              ...(isStarVoterChart
                                ? starVoterBarOptions.scales.y.title
                                : partWiseLineChartOptions.scales.y.title),
                              text: isStarVoterChart
                                ? "Voter Count"
                                : isSchemeChart
                                  ? "Benefited Voters"
                                  : isFamilyChart
                                    ? chart.showPercentage
                                      ? "Percentage (%)"
                                      : "Family Count"
                                    : chart.showPercentage
                                      ? "Percentage (%)"
                                      : "Voter Count",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                )}
                {chart.viewType === "table" && (
                  <div style={{ height: "100%", overflowY: "auto" }}>
                    <Table
                      dataSource={
                        isStarVoterChart
                          ? getStarVoterTableData(chart.sortOrder)
                          : isSchemeChart
                            ? getLocalSchemeTableData(chart.sortOrder)
                            : isSectionChart
                              ? getSectionTableData(sectionData)
                              : isFamilyChart
                                ? getLocalFamilyTableData(
                                    chart.selectedParts,
                                    chart.sortOrder,
                                  )
                                : getLocalTableDataForParts(
                                    chart.selectedParts,
                                    chart.sortOrder,
                                  )
                      }
                      pagination={{ pageSize: 10 }}
                      size="small"
                      columns={tableColumns}
                    />
                  </div>
                )}
                {chart.viewType === "stacked" && (
                  <div style={{ width: "100%", height: "100%" }}>
                    <Bar
                      key={`${chart.id}-stacked-${chart.width}-${chart.height}`}
                      data={
                        isStarVoterChart
                          ? getStarVoterChartData(chart.sortOrder)
                          : isFamilyChart
                            ? getLocalFamilyStackedChartData(
                                chart.selectedParts,
                                chart.chartColor || "#1890ff",
                                chart.sortOrder,
                              )
                            : getLocalStackedChartDataForParts(
                                chart.selectedParts,
                                chart.chartColor || "#1890ff",
                                chart.sortOrder,
                              )
                      }
                      options={{
                        ...(isStarVoterChart
                          ? starVoterBarOptions
                          : stackedChartOptions),
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                          ...(isStarVoterChart
                            ? starVoterBarOptions.plugins
                            : stackedChartOptions.plugins),
                          tooltip: {
                            ...(isStarVoterChart
                              ? starVoterBarOptions.plugins.tooltip
                              : stackedChartOptions.plugins.tooltip),
                            callbacks: {
                              label: (context: any) => {
                                if (isStarVoterChart) {
                                  return `${
                                    context.dataset.label
                                  }: ${formatIndianNumber(context.parsed.y)}`;
                                }
                                const label = context.dataset.label || "";
                                const value = context.parsed.y || 0;
                                return `${label}: ${value} ${
                                  isFamilyChart ? "families" : "voters"
                                }`;
                              },
                            },
                          },
                        },
                        scales: {
                          ...(isStarVoterChart
                            ? starVoterBarOptions.scales
                            : stackedChartOptions.scales),
                          y: {
                            ...(isStarVoterChart
                              ? starVoterBarOptions.scales.y
                              : stackedChartOptions.scales.y),
                            title: {
                              ...(isStarVoterChart
                                ? starVoterBarOptions.scales.y.title
                                : stackedChartOptions.scales.y.title),
                              text: isStarVoterChart
                                ? "Voter Count"
                                : isFamilyChart
                                  ? chart.showPercentage
                                    ? "Percentage (%)"
                                    : "Family Count"
                                  : chart.showPercentage
                                    ? "Percentage (%)"
                                    : "Voter Count",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">
                {chart.selectedParts.length > 0
                  ? "No data for selected parts"
                  : "No polling data available"}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  if (isGridFullscreen) {
    return (
      <div ref={setNodeRef} style={style} className="chart-card">
        <Rnd
          key={`${chart.id}-${chart.width}-${chart.height}`}
          position={{
            x: chart.x || 0,
            y: chart.y || 0,
          }}
          size={{
            width: chart.width || 600,
            height: chart.height || 450,
          }}
          minWidth={400}
          minHeight={350}
          maxWidth={1800}
          maxHeight={1200}
          onDragStop={(e, d) => {
            onUpdateChartPosition(chart.id, d.x, d.y);
            // Immediately save after drag
            setTimeout(() => {
              autoSaveChartConfig();
            }, 100);
            setTimeout(() => {
              const element = document.querySelector(
                `[data-chart-id="${chart.id}"]`,
              );
              if (element) {
                console.log(`Chart ${chart.id} moved to:`, d.x, d.y);
              }
            }, 100);
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            const newWidth = parseInt(ref.style.width);
            const newHeight = parseInt(ref.style.height);
            onUpdateChartSize(chart.id, newWidth, newHeight);
            onUpdateChartPosition(chart.id, position.x, position.y);
            // Immediately save after resize
            setTimeout(() => {
              autoSaveChartConfig();
            }, 100);
            setTimeout(() => {
              console.log(`Chart ${chart.id} resized to:`, newWidth, newHeight);
            }, 100);
          }}
          enableResizing={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true,
          }}
          disableDragging={false}
          enableUserSelectHack={false}
          dragHandleClassName="drag-handle"
          cancel="button, input, select, .ant-select, .ant-input, .ant-color-picker, .ant-color-picker-trigger, .ant-popover, .ant-btn, canvas, .ant-table, .chart-content-area, .chart-visualization, .chart-controls, .select-wrapper, .recharts-wrapper"
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {chartCardContent}
        </Rnd>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="chart-card">
      {chartCardContent}
    </div>
  );
};

export default function StaticPollDayDashboard() {
  const navigate = useNavigate();

  const navigateToPollDayManager = useCallback(
    (status?: "voted" | "notVoted") => {
      const target = status
        ? `/voter-turnout?status=${status}`
        : "/voter-turnout";

      navigate(target, {
        state: status ? { status } : undefined,
      });
    },
    [navigate],
  );
  const [electionName, setElectionName] = useState("");
  const [pollingDate] = useState<string | undefined>(undefined);
  const [partNumbers, setPartNumbers] = useState<number[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [showPercentage, setShowPercentage] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{
    [key: string]: "saved" | "saving" | "unsaved";
  }>({});

  // Modal state variables
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [addChartModalVisible, setAddChartModalVisible] = useState(false);
  const [selectedChartForSort, setSelectedChartForSort] = useState<
    string | null
  >(null);
  const [selectedChartForExport, setSelectedChartForExport] = useState<
    string | null
  >(null);
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);
  const [selectedChartForCampaign, setSelectedChartForCampaign] =
    useState<ChartConfig | null>(null);

  // Export job state - will be loaded from localStorage in useEffect
  const [activeExportJob, setActiveExportJob] =
    useState<ExportJobStatusResponse | null>(null);
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf">("excel");
  const [exportLoading, setExportLoading] = useState(false);

  const [headerStats, setHeaderStats] = useState({
    totalVotes: 0,
    voted: 0,
    notVoted: 0,
    turnoutPercentage: 0,
  });

  // Helper function to calculate grid position for a chart
  const calculateGridPosition = (index: number, totalCharts: number = 1) => {
    const CHART_WIDTH = 600;
    const CHART_HEIGHT = 450;
    const PADDING = 20;
    const GAP = 20;
    const COLUMNS = 2;

    const row = Math.floor(index / COLUMNS);
    const col = index % COLUMNS;

    return {
      x: PADDING + col * (CHART_WIDTH + GAP),
      y: PADDING + row * (CHART_HEIGHT + GAP),
      width: CHART_WIDTH,
      height: CHART_HEIGHT,
    };
  };

  // Multiple chart configurations (up to 20 charts)
  const [charts, setCharts] = useState<ChartConfig[]>([
    {
      id: "1",
      selectedParts: [],
      viewType: "bar",
      chartColor: "#1890ff",
      order: 0,
      customTitle: "Chart 1",
      chartType: "voterCount",
      ...calculateGridPosition(0),
    },
  ]);

  // Chart counter to generate unique chart numbers
  const chartCounterRef = useRef(1);
  const configLoadedRef = useRef(false);
  const initialLoadCompleteRef = useRef(false);
  const refreshInFlightRef = useRef(false);
  const rateLimitedUntilRef = useRef(0);

  const [savingConfig, setSavingConfig] = useState(false);
  const [fullscreenChartId, setFullscreenChartId] = useState<string | null>(
    null,
  );
  const [isGridFullscreen, setIsGridFullscreen] = useState(false);
  const [resettingLayout, setResettingLayout] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>("");
  const [recomputing, setRecomputing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // Default 1 min
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [refreshStatus, setRefreshStatus] = useState<
    "idle" | "refreshing" | "success" | "rate-limited" | "error"
  >("idle");
  const [lastRefreshStartedAt, setLastRefreshStartedAt] = useState<
    number | null
  >(null);
  const [lastSuccessfulRefreshAt, setLastSuccessfulRefreshAt] = useState<
    number | null
  >(null);
  const [lastRefreshError, setLastRefreshError] = useState<string | null>(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number>(0);

  // Reset Voters Modal state
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);

  // Refs for chart containers (for native fullscreen API)
  const chartRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const chartsGridRef = useRef<HTMLDivElement>(null);
  const allElections = useSelector(
    (state: RootState) => state.election.allElections,
  );
  const selectedElectionId = useSelector(
    (state: any) => state.election.selectedElectionId,
  );
  const {
    schemes,
    loading: schemesLoading,
    fetchSchemeData,
  } = useSchemeData(Number(selectedElectionId) || 0);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      activators: [
        {
          eventName: "onKeyDown" as const,
          handler: (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (
              target.tagName === "INPUT" ||
              target.tagName === "TEXTAREA" ||
              target.isContentEditable
            ) {
              return false;
            }
            return event.code === "Space" || event.code === "Enter";
          },
        },
      ],
    }),
  );

  // Remove merged filters - fetch all data without filters
  // Filters are saved per chart but not applied to data fetching
  // This allows charts to show unfiltered data while preserving filter preferences

  // Fetch ALL parts data without filters (fetch everything)
  const partWisePolling = usePollDayPartWisePolling(
    Number(selectedElectionId) || 0,
    pollingDate,
    undefined, // No filters - fetch all data
    0,
  );

  // Fetch family polling data without filters
  const familyWisePolling = usePollDayFamilyWisePolling(
    Number(selectedElectionId) || 0,
    pollingDate,
    undefined, // No filters - fetch all data
    0,
  );

  // Fetch part numbers for the dropdown
  const fetchParts = useCallback(async () => {
    if (!selectedElectionId) return;

    try {
      setLoadingParts(true);
      const response = await getPartsApi(parseInt(selectedElectionId));
      const validParts = (
        Array.isArray(response.data) ? response.data : []
      ).map((part: any) => ({
        ...part,
        partNo: Number(part?.partNo?.trim() ?? 0),
      }));

      const partNumbersFromResponse = validParts
        .map((part: any) => part.partNo)
        .filter((pn: any) => !isNaN(pn) && pn !== null && pn !== undefined)
        .sort((a: number, b: number) => a - b);

      setPartNumbers(partNumbersFromResponse);
    } catch (error) {
      console.error("Error fetching parts:", error);
      setPartNumbers([]);
    } finally {
      setLoadingParts(false);
    }
  }, [selectedElectionId]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // Load active export job from localStorage on mount
  useEffect(() => {
    if (selectedElectionId) {
      const saved = localStorage.getItem(
        `pollday_export_${selectedElectionId}`,
      );
      if (saved) {
        try {
          const job = JSON.parse(saved);
          setActiveExportJob(job);
        } catch (error) {
          console.error("Failed to parse saved export job:", error);
          localStorage.removeItem(`pollday_export_${selectedElectionId}`);
        }
      }
    }
  }, [selectedElectionId]);

  // Resume polling for active export job on mount
  useEffect(() => {
    const resumeExportPolling = async () => {
      if (
        activeExportJob &&
        (activeExportJob.status === "PENDING" ||
          activeExportJob.status === "RUNNING")
      ) {
        try {
          const completedJob = await pollPollDayExportJob(
            activeExportJob.jobId,
            (status) => {
              setActiveExportJob(status);
              localStorage.setItem(
                `pollday_export_${selectedElectionId}`,
                JSON.stringify(status),
              );
            },
          );

          if (completedJob.s3Url) {
            message.success(
              `Export completed! ${completedJob.rowCount} records exported.`,
            );
            window.open(completedJob.s3Url, "_blank");
            setActiveExportJob(null);
            localStorage.removeItem(`pollday_export_${selectedElectionId}`);
          }
        } catch (error: any) {
          message.error(error.message || "Export failed");
          setActiveExportJob(null);
          localStorage.removeItem(`pollday_export_${selectedElectionId}`);
        }
      }
    };

    resumeExportPolling();
  }, [selectedElectionId]);

  const formatRefreshTime = useCallback((timestamp: number | null) => {
    if (!timestamp) return "Never";

    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  const refreshStatusMeta = useMemo(() => {
    const intervalLabel =
      refreshInterval === 30000
        ? "30 sec"
        : refreshInterval === 60000
          ? "1 min"
          : refreshInterval === 120000
            ? "2 min"
            : `${Math.round(refreshInterval / 1000)} sec`;

    if (refreshStatus === "refreshing") {
      return {
        color: "#1677ff",
        backgroundColor: "#e6f4ff",
        borderColor: "#91caff",
        text: `Auto-refresh running now. Last success: ${formatRefreshTime(lastSuccessfulRefreshAt)}`,
        detail: `Interval ${intervalLabel}`,
      };
    }

    if (refreshStatus === "rate-limited") {
      return {
        color: "#d48806",
        backgroundColor: "#fffbe6",
        borderColor: "#ffe58f",
        text: `Auto-refresh paused by rate limit until ${formatRefreshTime(rateLimitedUntil)}`,
        detail: `Last success: ${formatRefreshTime(lastSuccessfulRefreshAt)}`,
      };
    }

    if (refreshStatus === "error") {
      return {
        color: "#cf1322",
        backgroundColor: "#fff1f0",
        borderColor: "#ffa39e",
        text: lastRefreshError || "Auto-refresh failed on the last attempt.",
        detail: `Last success: ${formatRefreshTime(lastSuccessfulRefreshAt)}`,
      };
    }

    if (refreshStatus === "success") {
      return {
        color: "#389e0d",
        backgroundColor: "#f6ffed",
        borderColor: "#b7eb8f",
        text: `Auto-refresh active. Last success: ${formatRefreshTime(lastSuccessfulRefreshAt)}`,
        detail: `Interval ${intervalLabel}`,
      };
    }

    return {
      color: "#595959",
      backgroundColor: "#fafafa",
      borderColor: "#d9d9d9",
      text: `Auto-refresh configured every ${intervalLabel}. Waiting for first successful refresh.`,
      detail: `Last attempt: ${formatRefreshTime(lastRefreshStartedAt)}`,
    };
  }, [
    formatRefreshTime,
    lastRefreshError,
    lastRefreshStartedAt,
    lastSuccessfulRefreshAt,
    rateLimitedUntil,
    refreshInterval,
    refreshStatus,
  ]);

  const refreshDashboardData = useCallback(
    async (showLoading: boolean) => {
      if (!selectedElectionId) return;

      const now = Date.now();
      if (refreshInFlightRef.current) {
        return;
      }

      if (rateLimitedUntilRef.current > now) {
        setRefreshStatus("rate-limited");
        setRateLimitedUntil(rateLimitedUntilRef.current);
        if (showLoading) {
          const waitSeconds = Math.ceil(
            (rateLimitedUntilRef.current - now) / 1000,
          );
          message.warning(
            `Rate limited. Please wait ${waitSeconds} seconds before refreshing again.`,
          );
        }
        return;
      }

      try {
        refreshInFlightRef.current = true;
        setLastRefreshStartedAt(now);
        setLastRefreshError(null);
        setRefreshStatus("refreshing");
        if (showLoading) {
          setRecomputing(true);
        }
        console.log("Calling partwise and familywise recompute function");

        const results = await Promise.allSettled([
          partWisePolling.recompute(),
          familyWisePolling.recompute(),
        ]);

        const rejectedResults = results.filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        );

        if (rejectedResults.length > 0) {
          const rateLimited = rejectedResults.some(
            ({ reason }) => reason?.response?.status === 429,
          );

          if (rateLimited) {
            const backoffMs = Math.max(refreshInterval, 30000);
            const nextAllowedAt = Date.now() + backoffMs;
            rateLimitedUntilRef.current = nextAllowedAt;
            setRateLimitedUntil(nextAllowedAt);
            setRefreshStatus("rate-limited");
            setLastRefreshError(
              "Poll day auto-refresh paused due to rate limiting.",
            );

            if (!showLoading) {
              const waitSeconds = Math.ceil(backoffMs / 1000);
              message.warning(
                `Poll day auto-refresh paused for ${waitSeconds} seconds due to rate limiting.`,
              );
            }
            return;
          }

          throw rejectedResults[0].reason;
        }

        rateLimitedUntilRef.current = 0;
        setRateLimitedUntil(0);
        setLastSuccessfulRefreshAt(Date.now());
        setRefreshStatus("success");
        setRefreshVersion((prev) => prev + 1);
      } catch (error: any) {
        setRefreshStatus("error");
        setLastRefreshError(
          error?.response?.data?.message ||
            error?.message ||
            "Poll day auto-refresh failed.",
        );
        console.error("Error refreshing data:", error);
      } finally {
        refreshInFlightRef.current = false;
        if (showLoading) {
          setRecomputing(false);
        }
      }
    },
    [
      selectedElectionId,
      refreshInterval,
      partWisePolling.recompute,
      familyWisePolling.recompute,
    ],
  );

  useEffect(() => {
    if (!selectedElectionId || refreshInterval <= 0) return;

    const timerId = window.setInterval(() => {
      void refreshDashboardData(false);
    }, refreshInterval);

    return () => {
      window.clearInterval(timerId);
    };
  }, [selectedElectionId, refreshInterval, refreshDashboardData]);

  const handleRefresh = async () => {
    await refreshDashboardData(true);
  };

  const handleResetVotersClick = () => {
    setIsResetModalVisible(true);
  };

  const handleRefreshTimeChange = (value: number) => {
    console.log("refresh time interval", value);
    setRefreshInterval(value);
    // Trigger an auto-save to persist the new refresh interval
    autoSaveChartConfig(value);

    const label =
      value === 30000
        ? "30 seconds"
        : value === 60000
          ? "1 minute"
          : "2 minutes";
    message.success(`Auto-refresh interval set to ${label}`);
  };

  // NEW HANDLER FUNCTIONS
  const toggleChartPercentage = (chartId: string) => {
    setCharts(
      charts.map((chart) =>
        chart.id === chartId
          ? { ...chart, showPercentage: !chart.showPercentage }
          : chart,
      ),
    );
    setSaveStatus((prev) => ({ ...prev, [chartId]: "unsaved" }));
    setTimeout(() => {
      autoSaveChartConfig();
    }, 500);

    message.info(
      `Switched to ${
        !charts.find((c) => c.id === chartId)?.showPercentage
          ? "percentage"
          : "count"
      } view`,
    );
  };

  const handleSortChart = (chartId: string, sortOrder: "asc" | "desc") => {
    setCharts(
      charts.map((chart) =>
        chart.id === chartId ? { ...chart, sortOrder } : chart,
      ),
    );
    setSaveStatus((prev) => ({ ...prev, [chartId]: "unsaved" }));
    setSortModalVisible(false);
    setTimeout(() => {
      autoSaveChartConfig();
    }, 500);
    message.success(
      `Chart sorted in ${
        sortOrder === "asc" ? "ascending" : "descending"
      } order`,
    );
  };

  const handleClearSort = (chartId: string) => {
    setCharts(
      charts.map((chart) =>
        chart.id === chartId ? { ...chart, sortOrder: undefined } : chart,
      ),
    );
    setSaveStatus((prev) => ({ ...prev, [chartId]: "unsaved" }));
    setSortModalVisible(false);

    // Auto-save after clearing sort
    setTimeout(() => {
      autoSaveChartConfig();
    }, 500);

    message.success("Sort cleared - showing default part number order");
  };

  const handleExportChart = async (
    chartId: string,
    format: "excel" | "pdf",
  ) => {
    const chart = charts.find((c) => c.id === chartId);
    if (!chart || chart.selectedParts.length === 0) {
      message.warning("Please select at least one part to export");
      return;
    }

    // Check if there's already an active export job
    if (
      activeExportJob &&
      (activeExportJob.status === "PENDING" ||
        activeExportJob.status === "RUNNING")
    ) {
      message.warning(
        "An export is already in progress. Please wait for it to complete.",
      );
      return;
    }

    try {
      setExportLoading(true);
      setExportFormat(format);

      // Create export job
      const response = await createPollDayExport({
        electionId: parseInt(selectedElectionId),
        format,
        chartType: chart.chartType || "voterCount",
        selectedParts: chart.selectedParts,
        pollingDate: pollingDate,
        filters: {
          ...chart.filters,
          hasMobileNo: chart.filters?.hasMobileNo,
          hasWhatsappNo: chart.filters?.hasWhatsappNo,
          star: chart.filters?.star,
        },
      });

      if (response.success && response.data) {
        setActiveExportJob(response.data);
        localStorage.setItem(
          `pollday_export_${selectedElectionId}`,
          JSON.stringify(response.data),
        );
        message.success("Export job started. Please wait...");
        setExportModalVisible(false);

        // Start polling for job status
        try {
          const completedJob = await pollPollDayExportJob(
            response.data.jobId,
            (status) => {
              setActiveExportJob(status);
              localStorage.setItem(
                `pollday_export_${selectedElectionId}`,
                JSON.stringify(status),
              );
              if (status.status === "RUNNING") {
                message.info("Export is being processed...");
              }
            },
          );

          if (completedJob.s3Url) {
            message.success(
              `Export completed! ${completedJob.rowCount} records exported.`,
            );
            // Auto-download the file
            window.open(completedJob.s3Url, "_blank");
            setActiveExportJob(null);
            localStorage.removeItem(`pollday_export_${selectedElectionId}`);
          }
        } catch (pollError: any) {
          message.error(pollError.message || "Export failed");
          setActiveExportJob(null);
          localStorage.removeItem(`pollday_export_${selectedElectionId}`);
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to start export");
      setActiveExportJob(null);
    } finally {
      setExportLoading(false);
    }
  };

  const handleOpenSortModal = (chartId: string) => {
    setSelectedChartForSort(chartId);
    setSortModalVisible(true);
  };

  const handleOpenExportModal = (chartId: string) => {
    setSelectedChartForExport(chartId);
    setExportModalVisible(true);
  };

  // Chart Management Functions
  const addChart = (
    chartType:
      | "voterCount"
      | "familyCount"
      | "schemeVoterCount"
      | "sectionVoterCount"
      | "starVoterCount" = "voterCount",
  ) => {
    if (charts.length >= 100) {
      message.warning("Maximum 100 charts allowed");
      return;
    }

    chartCounterRef.current += 1;
    const chartNumber = chartCounterRef.current;

    const gridPosition = calculateGridPosition(charts.length);
    const newChart: ChartConfig = {
      id: Date.now().toString(),
      selectedParts: chartType === "sectionVoterCount" ? [1] : [],
      viewType: chartType === "starVoterCount" ? "stacked" : "bar",
      chartColor:
        chartType === "sectionVoterCount"
          ? "#1D4ED8"
          : chartType === "starVoterCount"
            ? "#722ed1"
            : "#1890ff",
      order: charts.length,
      customTitle:
        chartType === "sectionVoterCount"
          ? "Section Number Vs Voter Count"
          : chartType === "starVoterCount"
            ? "Part No Vs Star Voter Count"
            : `Chart ${chartNumber}`,
      chartType: chartType,
      showPercentage: false,
      selectedSchemeId:
        chartType === "schemeVoterCount" && schemes.length > 0
          ? Number(schemes[0].id)
          : undefined,
      selectedSchemeName:
        chartType === "schemeVoterCount" && schemes.length > 0
          ? schemes[0].schemeName
          : undefined,
      ...gridPosition,
    };
    setCharts([...charts, newChart]);
    setAddChartModalVisible(false);

    const chartTypeName =
      chartType === "familyCount"
        ? "Family Count"
        : chartType === "schemeVoterCount"
          ? "Scheme"
          : chartType === "sectionVoterCount"
            ? "Section Voter Count"
            : chartType === "starVoterCount"
              ? "Star Voter Count"
              : "Voter Count";
    message.success(`${chartTypeName} chart added successfully`);
  };

  const removeChart = (chartId: string) => {
    if (charts.length === 1) {
      message.warning("At least one chart is required");
      return;
    }

    const chartToRemove = charts.find((chart) => chart.id === chartId);
    const chartTitle = chartToRemove?.customTitle || "Chart";

    setCharts(charts.filter((chart) => chart.id !== chartId));
    message.success(`${chartTitle} deleted successfully`);
  };

  const updateChartParts = (chartId: string, selectedParts: number[]) => {
    setCharts(
      charts.map((chart) =>
        chart.id === chartId ? { ...chart, selectedParts } : chart,
      ),
    );
    setSaveStatus((prev) => ({ ...prev, [chartId]: "unsaved" }));
  };

  const updateChartViewType = (
    chartId: string,
    viewType: "bar" | "line" | "table" | "stacked",
  ) => {
    setCharts(
      charts.map((chart) =>
        chart.id === chartId ? { ...chart, viewType } : chart,
      ),
    );
    setSaveStatus((prev) => ({ ...prev, [chartId]: "unsaved" }));
  };

  const updateChartColor = (chartId: string, chartColor: string) => {
    setCharts(
      charts.map((chart) =>
        chart.id === chartId ? { ...chart, chartColor } : chart,
      ),
    );
    setSaveStatus((prev) => ({ ...prev, [chartId]: "unsaved" }));
  };

  const updateChartTitle = (chartId: string, customTitle: string) => {
    setCharts(
      charts.map((chart) =>
        chart.id === chartId ? { ...chart, customTitle } : chart,
      ),
    );
    setSaveStatus((prev) => ({ ...prev, [chartId]: "unsaved" }));
  };

  const updateChartFilters = (chartId: string, filters: any) => {
    setCharts(
      charts.map((chart) =>
        chart.id === chartId ? { ...chart, filters } : chart,
      ),
    );
    setSaveStatus((prev) => ({ ...prev, [chartId]: "unsaved" }));
  };

  const updateChartScheme = useCallback(
    (
      chartId: string,
      selectedSchemeId?: number,
      selectedSchemeName?: string,
    ) => {
      setCharts((prevCharts) =>
        prevCharts.map((chart) =>
          chart.id === chartId
            ? {
                ...chart,
                selectedSchemeId,
                selectedSchemeName,
              }
            : chart,
        ),
      );
      setSaveStatus((prev) => ({ ...prev, [chartId]: "unsaved" }));
    },
    [],
  );

  const updateChartSize = useCallback(
    (chartId: string, width: number, height: number) => {
      setCharts((prevCharts) =>
        prevCharts.map((chart) =>
          chart.id === chartId ? { ...chart, width, height } : chart,
        ),
      );
      setSaveStatus((prev) => ({ ...prev, [chartId]: "unsaved" }));
    },
    [],
  );

  const updateChartPosition = useCallback(
    (chartId: string, x: number, y: number) => {
      setCharts((prevCharts) =>
        prevCharts.map((chart) =>
          chart.id === chartId ? { ...chart, x, y } : chart,
        ),
      );
      setSaveStatus((prev) => ({ ...prev, [chartId]: "unsaved" }));
    },
    [],
  );

  // Reset all charts to grid layout
  const resetLayoutToGrid = async () => {
    setResettingLayout(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const arrangedCharts = charts.map((chart, index) => {
        const gridPosition = calculateGridPosition(index);
        return {
          ...chart,
          ...gridPosition,
        };
      });
      setCharts(arrangedCharts);
      const newSaveStatus: { [key: string]: "unsaved" } = {};
      arrangedCharts.forEach((chart) => {
        newSaveStatus[chart.id] = "unsaved";
      });
      setSaveStatus(newSaveStatus);
      message.success({
        content: "Layout reset to grid view successfully!",
        duration: 3,
        className: "fullscreen-message",
        style: {
          marginTop: "20vh",
        },
      });
    } catch (error) {
      message.error({
        content: "Failed to reset layout",
        duration: 3,
        className: "fullscreen-message",
        style: {
          marginTop: "20vh",
        },
      });
    } finally {
      setResettingLayout(false);
    }
  };

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCharts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reorderedCharts = arrayMove(items, oldIndex, newIndex);
        const updatedCharts = reorderedCharts.map((chart, index) => ({
          ...chart,
          order: index,
        }));
        const newSaveStatus: { [key: string]: "unsaved" } = {};
        updatedCharts.forEach((chart) => {
          newSaveStatus[chart.id] = "unsaved";
        });
        setSaveStatus(newSaveStatus);
        return updatedCharts;
      });
      message.success("Charts reordered. Don't forget to save!");
    }
  };

  // Auto-save functionality
  const autoSaveChartConfig = useCallback(
    async (newRefreshInterval?: number) => {
      if (
        !autoSaveEnabled ||
        !selectedElectionId ||
        !initialLoadCompleteRef.current
      )
        return;
      try {
        console.log("Auto-saving chart configuration called...");
        setSavingConfig(true);
        const chartConfigs: APIChartConfig[] = charts.map((chart) => ({
          id: chart.id,
          selectedParts: chart.selectedParts,
          viewType: chart.viewType || "bar",
          customTitle: chart.customTitle,
          chartColor: chart.chartColor || "#1890ff",
          chartType: chart.chartType,
          order: chart.order ?? 0,
          width: chart.width ?? 600,
          height: chart.height ?? 450,
          x: chart.x ?? 0,
          y: chart.y ?? 0,
          sortType: chart.sortOrder,
          filters: {
            ...chart.filters,
            hasMobileNo: chart.filters?.hasMobileNo,
            hasWhatsappNo: chart.filters?.hasWhatsappNo,
            star: chart.filters?.star,
          },
          showPercentage: chart.showPercentage ?? false,
          selectedSchemeId: chart.selectedSchemeId,
          selectedSchemeName: chart.selectedSchemeName,
        }));

        // Use the provided interval or the current state value
        const intervalToSave =
          newRefreshInterval !== undefined
            ? newRefreshInterval
            : refreshInterval;

        console.log("Auto-saving chartConfigs:", chartConfigs);
        console.log("Auto-saving refresh-interval :", intervalToSave);
        await savePollDayChartConfig(
          selectedElectionId,
          chartConfigs,
          intervalToSave,
        );
        const newSaveStatus: { [key: string]: "saved" } = {};
        charts.forEach((chart) => {
          newSaveStatus[chart.id] = "saved";
        });
        setSaveStatus(newSaveStatus);
        console.log("Auto-saved chart configuration");
      } catch (error) {
        console.error("Error auto-saving configuration:", error);
      } finally {
        setSavingConfig(false);
      }
    },
    [charts, selectedElectionId, autoSaveEnabled, refreshInterval],
  );

  // const saveIndividualChart = async (chartId: string) => {
  //   if (!selectedElectionId) {
  //     message.warning("Please select an election first");
  //     return;
  //   }
  //   try {
  //     setSaveStatus((prev) => ({ ...prev, [chartId]: "saving" }));
  //     const chartConfigs: APIChartConfig[] = charts.map((chart) => ({
  //       id: chart.id,
  //       selectedParts: chart.selectedParts,
  //       viewType: chart.viewType || "bar",
  //       customTitle: chart.customTitle,
  //       chartColor: chart.chartColor || "#1890ff",
  //       order: chart.order ?? 0,
  //       width: chart.width ?? 600,
  //       height: chart.height ?? 450,
  //       x: chart.x ?? 0,
  //       y: chart.y ?? 0,
  //     }));
  //     await savePollDayChartConfig(selectedElectionId, chartConfigs);
  //     setSaveStatus((prev) => ({ ...prev, [chartId]: "saved" }));
  //     message.success("Chart configuration saved successfully");
  //   } catch (error) {
  //     console.error("Error saving configuration:", error);
  //     setSaveStatus((prev) => ({ ...prev, [chartId]: "unsaved" }));
  //     message.error("Failed to save chart configuration");
  //   }
  // };

  const handleTitleDoubleClick = (chartId: string, currentTitle: string) => {
    setEditingTitleId(chartId);
    setEditingTitleValue(currentTitle);
  };

  const handleTitleSave = (chartId: string) => {
    const trimmedTitle = editingTitleValue.trim();
    updateChartTitle(chartId, trimmedTitle);
    setEditingTitleId(null);
    setEditingTitleValue("");
  };

  const handleTitleCancel = () => {
    setEditingTitleId(null);
    setEditingTitleValue("");
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent, chartId: string) => {
    if (e.key === "Enter") {
      handleTitleSave(chartId);
    } else if (e.key === "Escape") {
      handleTitleCancel();
    }
  };

  const selectAllParts = (chartId: string) => {
    if (partNumbers.length === 0) {
      message.warning("No parts available to select");
      return;
    }
    updateChartParts(chartId, [...partNumbers]);
  };

  const clearAllParts = (chartId: string) => {
    updateChartParts(chartId, []);
  };

  const renderDropdownWithSelectAll = (chartId: string) => (
    <div style={{ padding: "8px" }}>
      <div
        style={{
          marginBottom: "8px",
          display: "flex",
          gap: "8px",
          justifyContent: "space-between",
        }}
      >
        <Button
          size="small"
          type="link"
          onClick={() => selectAllParts(chartId)}
          style={{ padding: "0", fontSize: "12px", fontWeight: "bold" }}
        >
          Select All Parts
        </Button>
        <Button
          size="small"
          type="link"
          onClick={() => clearAllParts(chartId)}
          style={{ padding: "0", fontSize: "12px", fontWeight: "bold" }}
        >
          Clear All
        </Button>
      </div>
      <Divider style={{ margin: "8px 0" }} />
    </div>
  );

  const toggleFullscreen = async (chartId: string) => {
    const element = chartRefs.current.get(chartId);
    if (!element) return;
    try {
      if (!document.fullscreenElement) {
        await element.requestFullscreen();
        setFullscreenChartId(chartId);
      } else {
        await document.exitFullscreen();
        setFullscreenChartId(null);
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
      message.error("Failed to toggle fullscreen mode");
    }
  };

  const toggleGridFullscreen = async () => {
    const element = chartsGridRef.current;
    if (!element) return;
    try {
      if (!document.fullscreenElement) {
        await element.requestFullscreen();
        setIsGridFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsGridFullscreen(false);
      }
    } catch (error) {
      console.error("Error toggling grid fullscreen:", error);
      message.error("Failed to toggle fullscreen mode");
    }
  };

  // Campaign handlers
  const handleOpenCampaign = (chart: ChartConfig) => {
    setSelectedChartForCampaign(chart);
    setCampaignModalVisible(true);
  };

  const handleCampaignTypeSelect = (type: "whatsapp" | "sms" | "voice") => {
    if (!selectedChartForCampaign) return;
    if (type === "voice") {
      message.info("Voice campaigns are coming soon!");
      return;
    }
    const parts = selectedChartForCampaign.selectedParts;
    const electionId = selectedElectionId;
    const partsParam =
      parts.length > 0 ? `&parts=${parts.join(",")}&autoEstimate=true` : "";
    navigate(
      `/create-message?type=${type}&electionId=${electionId}${partsParam}`,
    );
    setCampaignModalVisible(false);
  };

  // Listen for fullscreen changes (e.g., user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenChartId(null);
        setIsGridFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const logChartState = () => {
    console.log(
      "Current Chart State:",
      charts.map((chart) => ({
        id: chart.id,
        x: chart.x,
        y: chart.y,
        width: chart.width,
        height: chart.height,
        selectedParts: chart.selectedParts.length,
      })),
    );
  };

  useEffect(() => {
    logChartState();
  }, [charts]);

  // Save chart configuration
  // const saveChartConfiguration = async () => {
  //   if (!selectedElectionId) {
  //     message.warning("Please select an election first");
  //     return;
  //   }
  //   try {
  //     setSavingConfig(true);
  //     const chartConfigs: APIChartConfig[] = charts.map((chart) => ({
  //       id: chart.id,
  //       selectedParts: chart.selectedParts,
  //       viewType: chart.viewType || "bar",
  //       customTitle: chart.customTitle,
  //       chartColor: chart.chartColor || "#1890ff",
  //       order: chart.order ?? 0,
  //       width: chart.width ?? 600,
  //       height: chart.height ?? 450,
  //     }));
  //     await savePollDayChartConfig(selectedElectionId, chartConfigs);
  //     message.success("Chart configuration saved successfully");
  //   } catch (error) {
  //     console.error("Error saving configuration:", error);
  //   } finally {
  //     setSavingConfig(false);
  //   }
  // };

  // Load saved configuration on mount
  useEffect(() => {
    const loadSavedConfiguration = async () => {
      if (!selectedElectionId) return;

      // Reset flags when election changes (do this first)
      configLoadedRef.current = false;
      initialLoadCompleteRef.current = false;

      try {
        const savedConfig = await getPollDayChartConfig(selectedElectionId);
        console.log("Fetched saved configuration:", savedConfig);
        if (savedConfig?.["refresh-time"]) {
          setRefreshInterval(savedConfig["refresh-time"]);
        }
        if (savedConfig?.charts && savedConfig.charts.length > 0) {
          const loadedCharts: ChartConfig[] = savedConfig.charts.map(
            (chart, index) => ({
              id: chart.id,
              selectedParts: chart.selectedParts,
              viewType:
                chart.chartType === "schemeVoterCount" &&
                chart.viewType === "stacked"
                  ? "bar"
                  : chart.viewType || "bar",
              customTitle: chart.customTitle,
              chartColor: chart.chartColor || "#1890ff",
              chartType: chart.chartType,
              order: chart.order ?? index,
              width: chart.width ?? 600,
              height: chart.height ?? 450,
              x: chart.x ?? 0,
              y: chart.y ?? 0,
              sortOrder: chart.sortType,
              filters: chart.filters,
              showPercentage: chart.showPercentage ?? false,
              selectedSchemeId: chart.selectedSchemeId,
              selectedSchemeName: chart.selectedSchemeName,
            }),
          );
          loadedCharts.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          const allSamePosition = loadedCharts.every(
            (chart) =>
              chart.x === loadedCharts[0].x && chart.y === loadedCharts[0].y,
          );
          const allAtOrigin = loadedCharts.every(
            (chart) => chart.x === 0 && chart.y === 0,
          );
          if (allSamePosition || allAtOrigin) {
            console.log("Auto-arranging overlapping charts in grid layout");
            const arrangedCharts = loadedCharts.map((chart, index) => {
              const gridPosition = calculateGridPosition(index);
              return {
                ...chart,
                ...gridPosition,
              };
            });
            setCharts(arrangedCharts);
            console.log("Charts auto-arranged:", arrangedCharts);
          } else {
            setCharts(loadedCharts);
            console.log("Loaded chart configuration:", loadedCharts);
          }
          const maxChartNumber = loadedCharts.reduce((max, chart) => {
            if (chart.customTitle) {
              const match = chart.customTitle.match(/Chart (\d+)/);
              if (match) {
                const num = parseInt(match[1]);
                return Math.max(max, num);
              }
            }
            return max;
          }, 0);
          chartCounterRef.current = Math.max(
            maxChartNumber,
            loadedCharts.length,
          );
        } else {
          // No saved config or empty charts - reset to default single chart
          console.log(
            "No saved configuration found, resetting to default chart",
          );
          const defaultChart: ChartConfig = {
            id: "1",
            selectedParts: [],
            viewType: "bar",
            chartColor: "#1890ff",
            order: 0,
            customTitle: "Chart 1",
            chartType: "voterCount",
            showPercentage: false,
            ...calculateGridPosition(0),
          };
          setCharts([defaultChart]);
          chartCounterRef.current = 1;
        }

        // Mark as loaded for this election
        configLoadedRef.current = true;

        // Mark initial load as complete after a short delay to prevent immediate auto-save
        setTimeout(() => {
          initialLoadCompleteRef.current = true;
        }, 1000);
      } catch (error) {
        console.error("Error loading configuration:", error);
        // On error (404, network error, etc.), reset to default single chart
        console.log("Error loading config, resetting to default chart");
        const defaultChart: ChartConfig = {
          id: "1",
          selectedParts: [],
          viewType: "bar",
          chartColor: "#1890ff",
          order: 0,
          customTitle: "Chart 1",
          chartType: "voterCount",
          showPercentage: false,
          ...calculateGridPosition(0),
        };
        setCharts([defaultChart]);
        chartCounterRef.current = 1;

        // Mark as loaded even on error to prevent infinite retries
        configLoadedRef.current = true;

        // Mark initial load as complete
        setTimeout(() => {
          initialLoadCompleteRef.current = true;
        }, 1000);
      }
    };
    loadSavedConfiguration();
  }, [selectedElectionId]);

  // Calculate overall summary statistics from ALL parts
  const summaryStats = useMemo(() => {
    const allParts = partWisePolling.data?.parts || [];
    if (allParts.length === 0) {
      return {
        totalVoters: 0,
        polled2025: 0,
        didNotVote: 0,
        percentage: 0,
        firstTimeVoters: 0,
      };
    }
    const totalVoters = allParts.reduce(
      (sum, part) => sum + (part.totalVoters || 0),
      0,
    );
    const polled2025 = allParts.reduce(
      (sum, part) => sum + (part.polled2025 || 0),
      0,
    );
    const didNotVote = allParts.reduce(
      (sum, part) => sum + (part.didNotVote || 0),
      0,
    );
    const percentage = totalVoters > 0 ? (polled2025 / totalVoters) * 100 : 0;
    return {
      totalVoters,
      polled2025,
      didNotVote,
      percentage,
      firstTimeVoters: 0,
    };
  }, [partWisePolling.data?.parts]);

  const familySummaryStats = useMemo(() => {
    const summary = familyWisePolling.data?.summary;

    if (!summary) {
      return {
        totalFamilies: 0,
        totalVotedFamilies: 0,
        partiallyVotedFamilies: 0,
        notVotedFamilies: 0,
        overallVotingPercentage: 0,
      };
    }

    return {
      totalFamilies: summary.totalFamilies,
      totalVotedFamilies: summary.totalVotedFamilies,
      partiallyVotedFamilies: summary.partiallyVotedFamilies,
      notVotedFamilies:
        summary.notVotedFamilies ?? summary.totalNotVotedFamilies,
      overallVotingPercentage: summary.overallVotingPercentage,
    };
  }, [familyWisePolling.data?.summary]);

  useEffect(() => {
    const election = allElections.find(
      (election) => election.id === selectedElectionId,
    );
    if (election) {
      setElectionName(election.electionName);
    }
  }, [allElections, selectedElectionId]);

  useEffect(() => {
    if (!selectedElectionId) {
      return;
    }

    void fetchSchemeData();
  }, [selectedElectionId]);

  useEffect(() => {
    if (!partWisePolling.loading && partWisePolling?.data) {
      const { parts } = partWisePolling.data;
      console.log("Use effect 10");

      if (!parts || !Array.isArray(parts)) return;

      // Calculate stats for ALL charts combined (global stats)
      const allParts = parts;

      const totalVotes = allParts.reduce(
        (acc, part) => acc + (part.totalVoters || 0),
        0,
      );
      const voted = allParts.reduce(
        (acc, part) => acc + (part.polled2025 || 0),
        0,
      );
      const notVoted = totalVotes - voted;
      const turnoutPercentage = totalVotes > 0 ? (voted / totalVotes) * 100 : 0;

      setHeaderStats({
        totalVotes,
        voted,
        notVoted,
        turnoutPercentage: Number(turnoutPercentage.toFixed(2)),
      });
    }
  }, [partWisePolling.data, partWisePolling.loading]);

  useEffect(() => {
    if (charts.length === 0 || !initialLoadCompleteRef.current) return;
    const timeoutId = setTimeout(() => {
      autoSaveChartConfig();
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [charts, autoSaveChartConfig]);

  // Stacked chart options
  const stackedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y || 0;
            return `${label}: ${formatIndianNumber(value)} voters`;
          },
        },
      },
      title: {
        display: true,
        text: "Voting Distribution by Part",
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatIndianNumber(value ?? 0),
        },
      },
    },
  };

  // Helper to find chart by selectedParts - improved to handle edge cases
  const findChartConfigBySelectedParts = (selectedParts: number[]) => {
    // Sort both arrays for consistent comparison
    const sortedSelectedParts = [...selectedParts].sort((a, b) => a - b);

    return charts.find((chart) => {
      const sortedChartParts = [...chart.selectedParts].sort((a, b) => a - b);
      return (
        sortedChartParts.length === sortedSelectedParts.length &&
        sortedChartParts.every(
          (part, index) => part === sortedSelectedParts[index],
        )
      );
    });
  };
  // Stacked chart data function
  const getStackedChartDataForParts = (
    selectedParts: number[],
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    const allParts = partWisePolling.data?.parts || [];
    const filteredParts =
      selectedParts.length > 0
        ? allParts.filter((part) => selectedParts.includes(part.partNumber))
        : allParts;

    // Apply sorting based on sortOrder parameter
    let sortedParts = [...filteredParts];

    if (sortOrder) {
      sortedParts.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.partNumber - b.partNumber;
        } else {
          return b.partNumber - a.partNumber;
        }
      });
    }

    const labels = sortedParts.map((part) => `Part ${part.partNumber}`);
    const polledData = sortedParts.map((part) => part.polled2025 || 0);
    const didNotVoteData = sortedParts.map((part) => part.didNotVote || 0);

    return {
      labels,
      datasets: [
        {
          label: "Voted",
          data: polledData,
          backgroundColor: "#52c41a",
          borderColor: "#389e0d",
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Not Voted",
          data: didNotVoteData,
          backgroundColor: "#ff4d4f",
          borderColor: "#cf1322",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
      filteredParts: sortedParts,
    };
  };

  const getSectionChartData = (
    sectionData: any[],
    chartColor: string = "#1D4ED8",
  ) => {
    const labels = sectionData.map((s) => `${s.sectionNo}`);
    const voterCounts = sectionData.map((s) => s.voterCount);

    const barColor = chartColor ? `${chartColor}CC` : "rgba(29, 78, 216, 0.8)";
    const borderColor = chartColor || "rgba(29, 78, 216, 1)";

    return {
      labels,
      datasets: [
        {
          label: "Voter Count",
          data: voterCounts,
          backgroundColor: barColor,
          borderColor: borderColor,
          borderWidth: 0,
          borderRadius: 6,
          barThickness: "flex" as const,
          maxBarThickness: 60,
        },
      ],
      tooltipLabel: (context: any) => {
        const index = context.dataIndex;
        const section = sectionData[index];
        return [
          `Section ${section.sectionNo}`,
          `Voters: ${section.voterCount}`,
          `Name: ${section.sectionNameEn}`,
        ];
      },
    };
  };

  const getSectionTableData = (sectionData: any[]) => {
    return sectionData.map((s, index) => ({
      key: index,
      sectionNo: s.sectionNo,
      sectionNameEn: s.sectionNameEn,
      voterCount: s.voterCount,
    }));
  };

  // Chart options
  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { size: 12, weight: "bold" as const },
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y || 0;
            const total = context.chart.data.datasets.reduce(
              (sum: number, dataset: any) => {
                return sum + (dataset.data[context.dataIndex] || 0);
              },
              0,
            );
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${formatIndianNumber(value)} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatIndianNumber(value ?? 0),
        },
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Voters: ${formatIndianNumber(context.parsed.y ?? 0)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatIndianNumber(value ?? 0),
        },
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
    },
  };

  const horizontalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Polled: ${formatIndianNumber(context.parsed.x ?? 0)}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatIndianNumber(value ?? 0),
        },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  // Generate chart data for specific parts
  const getChartDataForParts = (
    selectedParts: number[],
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    const allParts = partWisePolling.data?.parts || [];
    const filteredParts =
      selectedParts.length > 0
        ? allParts.filter((part) => selectedParts.includes(part.partNumber))
        : allParts;

    // Apply sorting based on sortOrder parameter
    let sortedParts = [...filteredParts];

    if (sortOrder) {
      sortedParts.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.partNumber - b.partNumber;
        } else {
          return b.partNumber - a.partNumber;
        }
      });
    } else {
      sortedParts.sort((a, b) => a.partNumber - b.partNumber);
    }

    const labels: string[] = [];
    const polledData: number[] = [];

    const barColor = chartColor ? `${chartColor}CC` : "rgba(24, 144, 255, 0.8)";
    const borderColor = chartColor || "rgba(24, 144, 255, 1)";

    sortedParts.forEach((part) => {
      labels.push(`${part.partNumber}`);
      if (showPercentage) {
        const percentage =
          part.totalVoters > 0 ? (part.polled2025 / part.totalVoters) * 100 : 0;
        polledData.push(parseFloat(percentage.toFixed(2)));
      } else {
        polledData.push(part.polled2025 || 0);
      }
    });

    return {
      labels,
      datasets: [
        {
          label: showPercentage ? "Voter Percentage" : "Voter Count",
          data: polledData,
          backgroundColor: barColor,
          borderColor: borderColor,
          borderWidth: 0,
          borderRadius: 6,
          barThickness: "flex" as const,
          maxBarThickness: 60,
        },
      ],
      filteredParts: sortedParts,
      tooltipLabel: (context: any) => {
        const label = context.label;
        return `Part ${label}`;
      },
    };
  };

  // Generate line chart data for specific parts
  // const getLineChartDataForParts = (
  //   selectedParts: number[],
  //   chartColor: string = "#1890ff"
  // ) => {
  //   const allParts = partWisePolling.data?.parts || [];
  //   const filteredParts =
  //     selectedParts.length > 0
  //       ? allParts.filter((part) => selectedParts.includes(part.partNumber))
  //       : allParts;

  //   // Apply sorting based on chart's sortOrder
  //   let sortedParts = [...filteredParts];
  //   const chartConfig = findChartConfigBySelectedParts(selectedParts);

  //   if (chartConfig?.sortOrder) {
  //     sortedParts.sort((a, b) => {
  //       if (chartConfig.sortOrder === "asc") {
  //         return a.partNumber - b.partNumber;
  //       } else {
  //         return b.partNumber - a.partNumber;
  //       }
  //     });
  //   }

  //   const labels: string[] = [];
  //   const polledData: number[] = [];

  //   const lineColor = chartColor
  //     ? `${chartColor}CC`
  //     : "rgba(24, 144, 255, 0.8)";
  //   const borderColor = chartColor || "rgba(24, 144, 255, 1)";

  //   sortedParts.forEach((part) => {
  //     labels.push(`${part.partNumber}`);
  //     if (showPercentage) {
  //       const percentage =
  //         part.totalVoters > 0 ? (part.polled2025 / part.totalVoters) * 100 : 0;
  //       polledData.push(parseFloat(percentage.toFixed(2)));
  //     } else {
  //       polledData.push(part.polled2025 || 0);
  //     }
  //   });

  //   return {
  //     labels,
  //     datasets: [
  //       {
  //         label: showPercentage ? "Voter Percentage" : "Voter Count",
  //         data: polledData,
  //         borderColor: borderColor,
  //         backgroundColor: lineColor,
  //         borderWidth: 3,
  //         tension: 0.4,
  //         fill: true,
  //         pointRadius: 5,
  //         pointHoverRadius: 7,
  //         pointBackgroundColor: borderColor,
  //         pointBorderColor: "#fff",
  //         pointBorderWidth: 2,
  //       },
  //     ],
  //     filteredParts: sortedParts,
  //     tooltipLabel: (context: any) => {
  //       const label = context.label;
  //       return `Part ${label}`;
  //     },
  //   };
  // };

  // Generate table data for specific parts
  const getLineChartDataForParts = (
    selectedParts: number[],
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    const allParts = partWisePolling.data?.parts || [];
    const filteredParts =
      selectedParts.length > 0
        ? allParts.filter((part) => selectedParts.includes(part.partNumber))
        : allParts;

    // Apply sorting based on sortOrder parameter
    let sortedParts = [...filteredParts];

    if (sortOrder) {
      sortedParts.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.partNumber - b.partNumber;
        } else {
          return b.partNumber - a.partNumber;
        }
      });
    } else {
      sortedParts.sort((a, b) => a.partNumber - b.partNumber);
    }

    const labels: string[] = [];
    const polledData: number[] = [];

    const lineColor = chartColor
      ? `${chartColor}CC`
      : "rgba(24, 144, 255, 0.8)";
    const borderColor = chartColor || "rgba(24, 144, 255, 1)";

    sortedParts.forEach((part) => {
      labels.push(`${part.partNumber}`);
      if (showPercentage) {
        const percentage =
          part.totalVoters > 0 ? (part.polled2025 / part.totalVoters) * 100 : 0;
        polledData.push(parseFloat(percentage.toFixed(2)));
      } else {
        polledData.push(part.polled2025 || 0);
      }
    });

    return {
      labels,
      datasets: [
        {
          label: showPercentage ? "Voter Percentage" : "Voter Count",
          data: polledData,
          borderColor: borderColor,
          backgroundColor: borderColor,
          borderWidth: 3,
          tension: 0.4,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: borderColor,
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
      filteredParts: sortedParts,
      tooltipLabel: (context: any) => {
        const label = context.label;
        return `Part ${label}`;
      },
    };
  };

  const getTableDataForParts = (
    selectedParts: number[],
    sortOrder?: "asc" | "desc",
  ) => {
    const allParts = partWisePolling.data?.parts || [];
    const filteredParts =
      selectedParts.length > 0
        ? allParts.filter((part) => selectedParts.includes(part.partNumber))
        : allParts;

    // Apply sorting based on sortOrder parameter
    let sortedParts = [...filteredParts];

    if (sortOrder) {
      sortedParts.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.partNumber - b.partNumber;
        } else {
          return b.partNumber - a.partNumber;
        }
      });
    } else {
      sortedParts.sort((a, b) => a.partNumber - b.partNumber);
    }

    return sortedParts.map((part, index) => ({
      key: index,
      partNumber: part.partNumber,
      totalVoters: part.totalVoters,
      polled2025: part.polled2025,
      didNotVote: part.didNotVote,
      turnoutPercentage: part.turnoutPercentage.toFixed(2),
    }));
  };

  // Family data functions
  const getFamilyChartData = (
    selectedParts: number[],
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    const allFamilies = familyWisePolling.data?.parts || [];
    const filteredFamilies =
      selectedParts.length > 0
        ? allFamilies.filter((fam) => selectedParts.includes(fam.partNumber))
        : allFamilies;

    let sortedFamilies = [...filteredFamilies];

    if (sortOrder) {
      sortedFamilies.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.partNumber - b.partNumber;
        } else {
          return b.partNumber - a.partNumber;
        }
      });
    } else {
      sortedFamilies.sort((a, b) => a.partNumber - b.partNumber);
    }

    const labels: string[] = [];
    const familyData: number[] = [];

    const barColor = chartColor ? `${chartColor}CC` : "rgba(24, 144, 255, 0.8)";
    const borderColor = chartColor || "rgba(24, 144, 255, 1)";

    sortedFamilies.forEach((fam) => {
      labels.push(`${fam.partNumber}`);
      if (showPercentage) {
        familyData.push(parseFloat(fam.votingPercentage.toFixed(2)));
      } else {
        familyData.push(getFullyVotedFamilies(fam));
      }
    });

    return {
      labels,
      datasets: [
        {
          label: showPercentage ? "Voting Percentage" : "Fully Voted Families",
          data: familyData,
          backgroundColor: barColor,
          borderColor: borderColor,
          borderWidth: 0,
          borderRadius: 6,
          barThickness: "flex" as const,
          maxBarThickness: 60,
        },
      ],
      filteredFamilies: sortedFamilies,
      tooltipLabel: (context: any) => {
        const label = context.label;
        return `Part ${label}`;
      },
    };
  };

  const getFamilyLineChartData = (
    selectedParts: number[],
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    const allFamilies = familyWisePolling.data?.parts || [];
    const filteredFamilies =
      selectedParts.length > 0
        ? allFamilies.filter((fam) => selectedParts.includes(fam.partNumber))
        : allFamilies;

    let sortedFamilies = [...filteredFamilies];

    if (sortOrder) {
      sortedFamilies.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.partNumber - b.partNumber;
        } else {
          return b.partNumber - a.partNumber;
        }
      });
    } else {
      sortedFamilies.sort((a, b) => a.partNumber - b.partNumber);
    }

    const labels: string[] = [];
    const familyData: number[] = [];

    const lineColor = chartColor
      ? `${chartColor}CC`
      : "rgba(24, 144, 255, 0.8)";
    const borderColor = chartColor || "rgba(24, 144, 255, 1)";

    sortedFamilies.forEach((fam) => {
      labels.push(`${fam.partNumber}`);
      if (showPercentage) {
        familyData.push(parseFloat(fam.votingPercentage.toFixed(2)));
      } else {
        familyData.push(getFullyVotedFamilies(fam));
      }
    });

    return {
      labels,
      datasets: [
        {
          label: showPercentage ? "Voting Percentage" : "Fully Voted Families",
          data: familyData,
          borderColor: borderColor,
          backgroundColor: borderColor,
          borderWidth: 3,
          tension: 0.4,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: borderColor,
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
      filteredFamilies: sortedFamilies,
      tooltipLabel: (context: any) => {
        const label = context.label;
        return `Part ${label}`;
      },
    };
  };

  const getFamilyTableData = (
    selectedParts: number[],
    sortOrder?: "asc" | "desc",
  ) => {
    const allFamilies = familyWisePolling.data?.parts || [];
    const filteredFamilies =
      selectedParts.length > 0
        ? allFamilies.filter((fam) => selectedParts.includes(fam.partNumber))
        : allFamilies;

    let sortedFamilies = [...filteredFamilies];

    if (sortOrder) {
      sortedFamilies.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.partNumber - b.partNumber;
        } else {
          return b.partNumber - a.partNumber;
        }
      });
    } else {
      sortedFamilies.sort((a, b) => a.partNumber - b.partNumber);
    }

    return sortedFamilies.map((fam, index) => ({
      key: index,
      partNumber: fam.partNumber,
      totalFamilies: fam.totalFamilies,
      votedFamilies: getFullyVotedFamilies(fam),
      partiallyVotedFamilies: fam.partiallyVotedFamilies,
      notVotedFamilies: fam.notVotedFamilies,
      votingPercentage: fam.votingPercentage,
    }));
  };

  const getFamilyStackedChartData = (
    selectedParts: number[],
    chartColor: string = "#1890ff",
    sortOrder?: "asc" | "desc",
  ) => {
    const allFamilies = familyWisePolling.data?.parts || [];
    const filteredFamilies =
      selectedParts.length > 0
        ? allFamilies.filter((fam) => selectedParts.includes(fam.partNumber))
        : allFamilies;

    let sortedFamilies = [...filteredFamilies];

    if (sortOrder) {
      sortedFamilies.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.partNumber - b.partNumber;
        } else {
          return b.partNumber - a.partNumber;
        }
      });
    } else {
      sortedFamilies.sort((a, b) => a.partNumber - b.partNumber);
    }

    const labels = sortedFamilies.map((fam) => `Part ${fam.partNumber}`);
    const votedData = sortedFamilies.map((fam) => getFullyVotedFamilies(fam));
    const partiallyVotedData = sortedFamilies.map(
      (fam) => fam.partiallyVotedFamilies || 0,
    );
    const notVotedData = sortedFamilies.map((fam) => fam.notVotedFamilies || 0);

    return {
      labels,
      datasets: [
        {
          label: "Fully Voted Families",
          data: votedData,
          backgroundColor: "#52c41a",
          borderColor: "#389e0d",
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Partially Voted Families",
          data: partiallyVotedData,
          backgroundColor: "#faad14",
          borderColor: "#d48806",
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Not Voted Families",
          data: notVotedData,
          backgroundColor: "#ff4d4f",
          borderColor: "#cf1322",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
      filteredFamilies: sortedFamilies,
    };
  };

  const partWiseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          font: { size: 13 },
          padding: 15,
          color: "#374151",
        },
      },
      datalabels: {
        display: true,
        color: "#1f2937",
        anchor: "end" as const,
        align: "top" as const,
        formatter: (value: number) =>
          showPercentage ? `${value ?? 0}%` : formatIndianNumber(value ?? 0),
        font: {
          size: 11,
          weight: "bold" as const,
        },
      },
      tooltip: {
        backgroundColor: "rgba(31, 41, 55, 0.95)",
        padding: 12,
        titleFont: { size: 14, weight: "bold" as const },
        bodyFont: { size: 13 },
        borderColor: "rgba(209, 213, 219, 0.3)",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const filteredParts = context.chart.data.filteredParts || [];
            const partIndex = context.dataIndex;
            const part = filteredParts[partIndex];
            if (part) {
              if (showPercentage) {
                return [
                  `Polled: ${formatIndianNumber(part.polled2025 ?? 0)} voters`,
                  `Total Voters: ${formatIndianNumber(part.totalVoters ?? 0)}`,
                  `Percentage: ${(
                    ((part.polled2025 ?? 0) / (part.totalVoters ?? 1)) *
                    100
                  ).toFixed(2)}%`,
                ];
              } else {
                return [
                  `Polled: ${formatIndianNumber(part.polled2025 ?? 0)} voters`,
                  `Total Voters: ${formatIndianNumber(part.totalVoters ?? 0)}`,
                ];
              }
            }
            return showPercentage
              ? `${context.parsed.y || 0}%`
              : `Polled: ${formatIndianNumber(context.parsed.y || 0)} voters`;
          },
          afterLabel: (context: any) => {
            if (!showPercentage) {
              const filteredParts = context.chart.data.filteredParts || [];
              const partIndex = context.dataIndex;
              const part = filteredParts[partIndex];
              if (part) {
                return `Turnout: ${(part.turnoutPercentage ?? 0).toFixed(2)}%`;
              }
            }
            return "";
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Part Number",
          font: {
            size: 14,
            weight: "bold" as const,
          },
          color: "#374151",
          padding: { top: 10, bottom: 0 },
        },
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 12 },
          color: "#4B5563",
        },
      },
      y: {
        title: {
          display: true,
          text: showPercentage ? "Percentage (%)" : "Voter Count",
          font: {
            size: 14,
            weight: "bold" as const,
          },
          color: "#374151",
          padding: { top: 0, bottom: 10 },
        },
        beginAtZero: true,
        grace: showPercentage ? "5%" : "10%",
        grid: {
          color: "rgba(229, 231, 235, 0.8)",
          drawBorder: false,
        },
        ticks: {
          font: { size: 12 },
          color: "#6B7280",
          callback: (value: any) =>
            showPercentage ? `${value ?? 0}%` : formatIndianNumber(value ?? 0),
        },
      },
    },
    datasets: {
      bar: {
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      },
    },
    animation: {
      duration: 800,
      easing: "easeInOutQuad" as const,
    },
  };

  const starVoterBarOptions = {
    ...partWiseChartOptions,
    datasets: {
      bar: {
        barPercentage: 0.8,
        categoryPercentage: 0.7,
      },
    },
    scales: {
      ...partWiseChartOptions.scales,
      x: {
        ...partWiseChartOptions.scales.x,
        stacked: false,
      },
      y: {
        ...partWiseChartOptions.scales.y,
        stacked: false,
      },
    },
    plugins: {
      ...partWiseChartOptions.plugins,
      tooltip: {
        ...partWiseChartOptions.plugins.tooltip,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y || 0;
            return `${label}: ${formatIndianNumber(value)}`;
          },
        },
      },
    },
  };

  const partWiseLineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          font: { size: 13 },
          padding: 15,
          color: "#374151",
        },
      },
      tooltip: {
        backgroundColor: "rgba(31, 41, 55, 0.95)",
        padding: 12,
        titleFont: { size: 14, weight: "bold" as const },
        bodyFont: { size: 13 },
        borderColor: "rgba(209, 213, 219, 0.3)",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const filteredParts = context.chart.data.filteredParts || [];
            const partIndex = context.dataIndex;
            const part = filteredParts[partIndex];
            if (part) {
              if (showPercentage) {
                return [
                  `Polled: ${formatIndianNumber(part.polled2025 ?? 0)} voters`,
                  `Total Voters: ${formatIndianNumber(part.totalVoters ?? 0)}`,
                  `Percentage: ${(
                    ((part.polled2025 ?? 0) / (part.totalVoters ?? 1)) *
                    100
                  ).toFixed(2)}%`,
                ];
              } else {
                return [
                  `Polled: ${formatIndianNumber(part.polled2025 ?? 0)} voters`,
                  `Total Voters: ${formatIndianNumber(part.totalVoters ?? 0)}`,
                ];
              }
            }
            return showPercentage
              ? `${context.parsed.y || 0}%`
              : `Polled: ${formatIndianNumber(context.parsed.y || 0)} voters`;
          },
          afterLabel: (context: any) => {
            if (!showPercentage) {
              const filteredParts = context.chart.data.filteredParts || [];
              const partIndex = context.dataIndex;
              const part = filteredParts[partIndex];
              if (part) {
                return `Turnout: ${(part.turnoutPercentage ?? 0).toFixed(2)}%`;
              }
            }
            return "";
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Part Number",
          font: {
            size: 14,
            weight: "bold" as const,
          },
          color: "#374151",
          padding: { top: 10, bottom: 0 },
        },
        grid: {
          color: "rgba(229, 231, 235, 0.5)",
          drawBorder: false,
        },
        ticks: {
          font: { size: 12 },
          color: "#4B5563",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 20,
        },
      },
      y: {
        title: {
          display: true,
          text: showPercentage ? "Percentage (%)" : "Voter Count",
          font: {
            size: 14,
            weight: "bold" as const,
          },
          color: "#374151",
          padding: { top: 0, bottom: 10 },
        },
        beginAtZero: true,
        suggestedMin: 0,
        suggestedMax: showPercentage ? 100 : undefined,
        grid: {
          color: "rgba(229, 231, 235, 0.8)",
          drawBorder: false,
        },
        ticks: {
          font: { size: 12 },
          color: "#6B7280",
          callback: (value: any) =>
            showPercentage ? `${value ?? 0}%` : formatIndianNumber(value ?? 0),
        },
      },
    },
    animation: {
      duration: 800,
      easing: "easeInOutQuad" as const,
    },
  };

  const sectionChartOptions = {
    ...partWiseChartOptions,
    plugins: {
      ...partWiseChartOptions.plugins,
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            // This will be handled in SortableChartItem where sectionData is available
            return `Voters: ${context.parsed.y}`;
          },
          afterLabel: (context: any) => {
            // This will be handled in SortableChartItem
            return "";
          },
        },
      },
    },
    scales: {
      x: {
        ...partWiseChartOptions.scales.x,
        title: {
          display: true,
          text: "Section Number",
          font: { weight: "bold" },
        },
      },
      y: {
        ...partWiseChartOptions.scales.y,
        title: {
          display: true,
          text: "Voter Count",
          font: { weight: "bold" },
        },
      },
    },
  };

  return (
    <div className="p-6 bg-gray-50">
      <style>{fullscreenStyles}</style>

      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{electionName}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time Poll Day Dashboard - {charts.length} Chart
            {charts.length !== 1 ? "s" : ""} Active
            {autoSaveEnabled && " • Auto-save enabled"}
          </p>
          <div
            style={{
              marginTop: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              backgroundColor: refreshStatusMeta.backgroundColor,
              borderRadius: "6px",
              border: `1px solid ${refreshStatusMeta.borderColor}`,
              flexWrap: "wrap",
            }}
          >
            {(refreshStatus === "refreshing" || recomputing) && (
              <Spin size="small" />
            )}
            <span
              style={{
                color: refreshStatusMeta.color,
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {refreshStatusMeta.text}
            </span>
            <span style={{ color: "#8c8c8c", fontSize: "12px" }}>
              {refreshStatusMeta.detail}
            </span>
          </div>
          {activeExportJob &&
            (activeExportJob.status === "PENDING" ||
              activeExportJob.status === "RUNNING") && (
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  backgroundColor: "#e6f7ff",
                  borderRadius: "4px",
                  border: "1px solid #91d5ff",
                }}
              >
                <Spin size="small" />
                <span
                  style={{
                    color: "#0050b3",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Export in progress ({activeExportJob.format.toUpperCase()})...
                </span>
              </div>
            )}
        </div>
        <div className="flex gap-3 items-center">
          <Button
            icon={<PlusOutlined />}
            onClick={() => setAddChartModalVisible(true)}
            disabled={charts.length >= 100}
          >
            Add Chart ({charts.length}/100)
          </Button>

          <Select
            value={refreshInterval}
            onChange={handleRefreshTimeChange}
            style={{ width: 120 }}
            options={[
              { value: 30000, label: "30 sec" },
              { value: 60000, label: "1 min" },
              { value: 120000, label: "2 min" },
            ]}
          />

          {isGridFullscreen && (
            <Button
              icon={<AppstoreOutlined />}
              onClick={resetLayoutToGrid}
              title="Reset all charts to grid layout"
            >
              Reset Layout
            </Button>
          )}
          <Button
            icon={
              isGridFullscreen ? (
                <FullscreenExitOutlined />
              ) : (
                <FullscreenOutlined />
              )
            }
            onClick={toggleGridFullscreen}
            type={isGridFullscreen ? "primary" : "default"}
          >
            {isGridFullscreen ? "Exit" : "Fullscreen"}
          </Button>

          <Button
            danger
            icon={<ReloadOutlined />}
            onClick={handleResetVotersClick}
            title="Reset all voted voters to non-voted"
          >
            Reset
          </Button>

          <Button
            icon={<ReloadOutlined spin={recomputing} />}
            loading={recomputing}
            onClick={handleRefresh}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <Row gutter={[16, 16]} className="my-8">
        <Col span={24 / 4}>
          <Card
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{ height: "100%", cursor: "pointer" }}
            onClick={() => navigateToPollDayManager()}
          >
            <Statistic
              title="Total Voters"
              value={summaryStats.totalVoters}
              prefix={<UserOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff", fontSize: "24px" }}
            />
          </Card>
        </Col>
        <Col span={24 / 4}>
          <Card
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{ height: "100%", cursor: "pointer" }}
            onClick={() => navigateToPollDayManager("voted")}
          >
            <Statistic
              title="Voted (2025)"
              value={summaryStats.polled2025}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a", fontSize: "24px" }}
            />
            <Progress
              percent={Number(summaryStats.percentage)}
              strokeColor="#52c41a"
              size="small"
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={24 / 4}>
          <Card
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{ height: "100%", cursor: "pointer" }}
            onClick={() => navigateToPollDayManager("notVoted")}
          >
            <Statistic
              title="Not Voted"
              value={summaryStats.didNotVote}
              prefix={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
              valueStyle={{ color: "#ff4d4f", fontSize: "24px" }}
            />
          </Card>
        </Col>
        <Col span={24 / 4}>
          <Card
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{ height: "100%", cursor: "pointer" }}
            onClick={() => navigateToPollDayManager("voted")}
          >
            <Statistic
              title="Overall Turnout"
              value={summaryStats.percentage}
              suffix="%"
              prefix={<RiseOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1", fontSize: "24px" }}
              precision={2}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="my-8">
        <Col span={24 / 4}>
          <Card
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{ height: "100%", cursor: "pointer" }}
            // onClick={() => navigate("/poll-day-manager")}
          >
            <Statistic
              title="Total Family"
              value={familySummaryStats.totalFamilies}
              prefix={<UserOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff", fontSize: "24px" }}
            />
          </Card>
        </Col>
        <Col span={24 / 4}>
          <Card
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{ height: "100%", cursor: "pointer" }}
            // onClick={() => navigate("/poll-day-manager?status=voted")}
          >
            <Statistic
              title="Fully Voted Family"
              value={familySummaryStats.totalVotedFamilies}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a", fontSize: "24px" }}
            />
            <Progress
              percent={Number(familySummaryStats.overallVotingPercentage)}
              strokeColor="#52c41a"
              size="small"
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={24 / 4}>
          <Card
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{ height: "100%", cursor: "pointer" }}
            // onClick={() => navigate("/poll-day-manager?status=notVoted")}
          >
            <Statistic
              title="Not Voted Family"
              value={familySummaryStats.notVotedFamilies}
              prefix={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
              valueStyle={{ color: "#ff4d4f", fontSize: "24px" }}
            />
          </Card>
        </Col>
        <Col span={24 / 4}>
          <Card
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{ height: "100%", cursor: "pointer" }}
            // onClick={() => navigate("/poll-day-manager?status=notVoted")}
          >
            <Statistic
              title="Partially Voted Family"
              value={familySummaryStats.partiallyVotedFamilies}
              prefix={<MinusCircleOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1", fontSize: "24px" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Multiple Charts: Part-wise Polling Count with Drag & Drop and Resize */}
      <div ref={chartsGridRef} className="charts-grid-fullscreen">
        {isGridFullscreen && (
          <div className="fullscreen-controls">
            <Button
              icon={<ReloadOutlined spin={recomputing} />}
              onClick={handleRefresh}
              title="Refresh dashboard data"
              size="large"
              loading={recomputing}
              type="default"
              shape="circle"
            />
            <Button
              icon={<AppstoreOutlined spin={resettingLayout} />}
              onClick={resetLayoutToGrid}
              title="Reset all charts to grid layout"
              size="large"
              loading={resettingLayout}
              type="default"
              shape="circle"
            />
            <Button
              icon={<FullscreenExitOutlined />}
              onClick={toggleGridFullscreen}
              type="primary"
              size="large"
              title="Exit fullscreen mode"
              shape="circle"
            />
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={charts.map((c) => c.id).filter(Boolean)}
            strategy={rectSortingStrategy}
          >
            {partWisePolling.loading && !partWisePolling.data ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <Spin size="large" tip="Loading poll day data..." />
              </div>
            ) : (
              <Row gutter={[16, 16]} className="charts-wrapper">
                {charts.map((chart, index) => {
                  const allParts = partWisePolling.data?.parts || [];
                  return (
                    <Col span={12} key={chart.id}>
                      <SortableChartItem
                        chart={chart}
                        index={index}
                        allParts={allParts}
                        allFamilies={familyWisePolling.data?.parts || []}
                        familySummaryData={familyWisePolling.data?.summary}
                        pollingDate={pollingDate}
                        saveStatus={saveStatus}
                        editingTitleId={editingTitleId}
                        editingTitleValue={editingTitleValue}
                        onUpdateChartParts={updateChartParts}
                        onUpdateChartViewType={updateChartViewType}
                        onUpdateChartColor={updateChartColor}
                        onUpdateChartSize={updateChartSize}
                        onUpdateChartPosition={updateChartPosition}
                        onUpdateChartFilters={updateChartFilters}
                        onUpdateChartScheme={updateChartScheme}
                        onRemoveChart={removeChart}
                        onToggleFullscreen={toggleFullscreen}
                        onOpenCampaign={handleOpenCampaign}
                        onTitleDoubleClick={handleTitleDoubleClick}
                        onTitleSave={handleTitleSave}
                        onTitleCancel={handleTitleCancel}
                        onTitleKeyDown={handleTitleKeyDown}
                        setEditingTitleValue={setEditingTitleValue}
                        fullscreenChartId={fullscreenChartId}
                        chartsLength={charts.length}
                        partNumbers={partNumbers}
                        loadingParts={loadingParts}
                        renderDropdownWithSelectAll={
                          renderDropdownWithSelectAll
                        }
                        schemes={schemes}
                        schemesLoading={schemesLoading}
                        refreshVersion={refreshVersion}
                        partWisePollingLoading={partWisePolling.loading}
                        getChartDataForParts={getChartDataForParts}
                        getLineChartDataForParts={getLineChartDataForParts}
                        getTableDataForParts={getTableDataForParts}
                        getStackedChartDataForParts={
                          getStackedChartDataForParts
                        }
                        getFamilyChartData={getFamilyChartData}
                        getFamilyLineChartData={getFamilyLineChartData}
                        getFamilyTableData={getFamilyTableData}
                        getFamilyStackedChartData={getFamilyStackedChartData}
                        getSectionChartData={getSectionChartData}
                        getSectionTableData={getSectionTableData}
                        partWiseChartOptions={partWiseChartOptions}
                        partWiseLineChartOptions={partWiseLineChartOptions}
                        stackedChartOptions={stackedChartOptions}
                        starVoterBarOptions={starVoterBarOptions}
                        sectionChartOptions={sectionChartOptions}
                        chartRefs={chartRefs}
                        isGridFullscreen={isGridFullscreen}
                        selectedElectionId={selectedElectionId}
                        onOpenSortModal={handleOpenSortModal}
                        onOpenExportModal={handleOpenExportModal}
                        onToggleChartPercentage={toggleChartPercentage}
                        autoSaveChartConfig={autoSaveChartConfig}
                      />
                    </Col>
                  );
                })}
              </Row>
            )}
          </SortableContext>
        </DndContext>
      </div>

      {/* NEW MODALS */}
      {/* Sort Modal */}
      <Modal
        title="Sort Chart by Part Number"
        open={sortModalVisible}
        onCancel={() => setSortModalVisible(false)}
        footer={null}
        width={300}
        mask={!(fullscreenChartId || isGridFullscreen)}
        getContainer={() => {
          if (fullscreenChartId || isGridFullscreen) {
            const fullscreenElement = document.querySelector(
              ".chart-fullscreen-container:fullscreen, .charts-grid-fullscreen:fullscreen",
            );
            return (fullscreenElement as HTMLElement) || document.body;
          }
          return document.body;
        }}
        style={fullscreenChartId || isGridFullscreen ? { zIndex: 10000 } : {}}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Button
            icon={<SortAscendingOutlined />}
            onClick={() =>
              selectedChartForSort &&
              handleSortChart(selectedChartForSort, "asc")
            }
            size="large"
            type={
              charts.find((c) => c.id === selectedChartForSort)?.sortOrder ===
              "asc"
                ? "primary"
                : "default"
            }
          >
            Show Ascending Values
          </Button>
          <Button
            icon={
              <SortAscendingOutlined style={{ transform: "rotate(180deg)" }} />
            }
            onClick={() =>
              selectedChartForSort &&
              handleSortChart(selectedChartForSort, "desc")
            }
            size="large"
            type={
              charts.find((c) => c.id === selectedChartForSort)?.sortOrder ===
              "desc"
                ? "primary"
                : "default"
            }
          >
            Show Descending Values
          </Button>
          <Button
            icon={<CloseCircleOutlined />}
            onClick={() =>
              selectedChartForSort && handleClearSort(selectedChartForSort)
            }
            size="large"
            type={
              charts.find((c) => c.id === selectedChartForSort)?.sortOrder ===
              undefined
                ? "primary"
                : "default"
            }
            danger={
              charts.find((c) => c.id === selectedChartForSort)?.sortOrder !==
              undefined
            }
          >
            Clear Sort (Default)
          </Button>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <DownloadOutlined
              style={{
                fontSize: "20px",
                color: activeExportJob ? "#1890ff" : "#52c41a",
              }}
            />
            <span>
              {activeExportJob &&
              (activeExportJob.status === "PENDING" ||
                activeExportJob.status === "RUNNING")
                ? "Export in Progress"
                : "Export Chart Data"}
            </span>
          </div>
        }
        open={exportModalVisible}
        mask={!(fullscreenChartId || isGridFullscreen)}
        getContainer={() => {
          if (fullscreenChartId || isGridFullscreen) {
            const fullscreenElement = document.querySelector(
              ".chart-fullscreen-container:fullscreen, .charts-grid-fullscreen:fullscreen",
            );
            return (fullscreenElement as HTMLElement) || document.body;
          }
          return document.body;
        }}
        style={fullscreenChartId || isGridFullscreen ? { zIndex: 10000 } : {}}
        onCancel={() => {
          if (
            activeExportJob &&
            (activeExportJob.status === "PENDING" ||
              activeExportJob.status === "RUNNING")
          ) {
            setExportModalVisible(false);
            message.info(
              "Export continues in background. You can navigate to other pages.",
            );
            return;
          }
          setExportModalVisible(false);
        }}
        footer={null}
        width={480}
        closable={true}
      >
        {activeExportJob &&
        (activeExportJob.status === "PENDING" ||
          activeExportJob.status === "RUNNING") ? (
          <div style={{ padding: "30px 20px", textAlign: "center" }}>
            <Spin size="large" />
            <div
              style={{
                marginTop: "24px",
                fontSize: "16px",
                fontWeight: 500,
                color: "#262626",
              }}
            >
              {activeExportJob.status === "PENDING"
                ? "Preparing your export..."
                : "Processing export..."}
            </div>
            <div
              style={{
                marginTop: "12px",
                padding: "12px 20px",
                backgroundColor: "#f0f5ff",
                borderRadius: "8px",
                border: "1px solid #adc6ff",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: "#0050b3",
                  marginBottom: "4px",
                }}
              >
                <strong>Format:</strong> {activeExportJob.format.toUpperCase()}
              </div>
              <div style={{ fontSize: "13px", color: "#0050b3" }}>
                <strong>Chart Type:</strong>{" "}
                {activeExportJob.chartType === "voterCount"
                  ? "Voter Count"
                  : "Family Count"}
              </div>
            </div>
            <div
              style={{
                marginTop: "20px",
                fontSize: "13px",
                color: "#8c8c8c",
                lineHeight: "1.6",
              }}
            >
              <p style={{ margin: 0 }}>✓ You can navigate to other pages</p>
              <p style={{ margin: "4px 0 0 0" }}>
                ✓ Export will continue in background
              </p>
              <p style={{ margin: "4px 0 0 0" }}>
                ✓ File will auto-download when ready
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <Card
                hoverable
                onClick={() =>
                  selectedChartForExport &&
                  handleExportChart(selectedChartForExport, "excel")
                }
                style={{
                  cursor: exportLoading ? "not-allowed" : "pointer",
                  border: "2px solid #217346",
                  borderRadius: "8px",
                  opacity: exportLoading && exportFormat !== "excel" ? 0.6 : 1,
                }}
                bodyStyle={{ padding: "20px" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "#f0f9ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {exportLoading && exportFormat === "excel" ? (
                      <Spin size="small" />
                    ) : (
                      <FileExcelOutlined
                        style={{ fontSize: "24px", color: "#217346" }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#217346",
                        marginBottom: "4px",
                      }}
                    >
                      Export as Excel
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Download data in XLSX format • Best for analysis
                    </div>
                  </div>
                  {!exportLoading && (
                    <div style={{ fontSize: "20px", color: "#217346" }}>→</div>
                  )}
                </div>
              </Card>

              <Card
                hoverable
                onClick={() =>
                  selectedChartForExport &&
                  handleExportChart(selectedChartForExport, "pdf")
                }
                style={{
                  cursor: exportLoading ? "not-allowed" : "pointer",
                  border: "2px solid #ff4d4f",
                  borderRadius: "8px",
                  opacity: exportLoading && exportFormat !== "pdf" ? 0.6 : 1,
                }}
                bodyStyle={{ padding: "20px" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "#fff1f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {exportLoading && exportFormat === "pdf" ? (
                      <Spin size="small" />
                    ) : (
                      <FilePdfOutlined
                        style={{ fontSize: "24px", color: "#ff4d4f" }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#ff4d4f",
                        marginBottom: "4px",
                      }}
                    >
                      Export as PDF
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Download data in PDF format • Best for printing
                    </div>
                  </div>
                  {!exportLoading && (
                    <div style={{ fontSize: "20px", color: "#ff4d4f" }}>→</div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Chart Modal */}
      <Modal
        title="Add New Chart"
        open={addChartModalVisible}
        onCancel={() => setAddChartModalVisible(false)}
        footer={null}
        getContainer={false}
        width={400}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Card
            hoverable
            onClick={() => addChart("voterCount")}
            style={{ cursor: "pointer", border: "1px solid #1890ff" }}
            bodyStyle={{ padding: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <UserOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              <div>
                <div style={{ fontSize: "16px", fontWeight: 500 }}>
                  Part Number Vs Voter Count
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Show voter statistics by part number
                </div>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => addChart("familyCount")}
            style={{ cursor: "pointer", border: "1px solid #52c41a" }}
            bodyStyle={{ padding: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <TeamOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
              <div>
                <div style={{ fontSize: "16px", fontWeight: 500 }}>
                  Part Number Vs Family Count
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Show family statistics by part number
                </div>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => addChart("schemeVoterCount")}
            style={{ cursor: "pointer", border: "1px solid #fa8c16" }}
            bodyStyle={{ padding: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <AreaChartOutlined
                style={{ fontSize: "24px", color: "#fa8c16" }}
              />
              <div>
                <div style={{ fontSize: "16px", fontWeight: 500 }}>
                  Part Number Vs Schemes
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Show voted beneficiaries of a selected scheme by part number
                </div>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => addChart("sectionVoterCount")}
            style={{ cursor: "pointer", border: "1px solid #1D4ED8" }}
            bodyStyle={{ padding: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <BarChartOutlined
                style={{ fontSize: "24px", color: "#1D4ED8" }}
              />
              <div>
                <div style={{ fontSize: "16px", fontWeight: 500 }}>
                  Section Number Vs Voter Count
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Analyze voting pattern by sections in a specific part
                </div>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => addChart("starVoterCount")}
            style={{ cursor: "pointer", border: "1px solid #722ed1" }}
            bodyStyle={{ padding: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <StarOutlined style={{ fontSize: "24px", color: "#722ed1" }} />
              <div>
                <div style={{ fontSize: "16px", fontWeight: 500 }}>
                  Part No Vs Star Voter Count
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Compare total voters, star voters, and non-star voters per part
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Modal>

      {/* Campaign Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <SoundOutlined style={{ color: "#52c41a" }} />
            <span>Start Campaign</span>
          </div>
        }
        open={campaignModalVisible}
        onCancel={() => setCampaignModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: "16px" }}>
          <p style={{ color: "#666", marginBottom: "24px" }}>
            {selectedChartForCampaign &&
            selectedChartForCampaign.selectedParts.length > 0
              ? `Launch a campaign for voters in Parts: ${selectedChartForCampaign.selectedParts.join(
                  ", ",
                )}`
              : "Launch a campaign for all voters in this chart"}
          </p>

          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Card
              hoverable
              onClick={() => handleCampaignTypeSelect("whatsapp")}
              style={{
                cursor: "pointer",
                border: "1px solid #25D366",
                transition: "all 0.3s",
              }}
              bodyStyle={{ padding: "16px" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <WhatsAppOutlined
                  style={{ fontSize: "32px", color: "#25D366" }}
                />
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 500 }}>
                    WhatsApp Campaign
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Send rich messages with media
                  </div>
                </div>
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => handleCampaignTypeSelect("sms")}
              style={{
                cursor: "pointer",
                border: "1px solid #1890ff",
                transition: "all 0.3s",
              }}
              bodyStyle={{ padding: "16px" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <MessageOutlined
                  style={{ fontSize: "32px", color: "#1890ff" }}
                />
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 500 }}>
                    SMS Campaign
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Send text messages to voters
                  </div>
                </div>
              </div>
            </Card>

            <Card
              style={{
                border: "1px solid #d9d9d9",
                opacity: 0.6,
                cursor: "not-allowed",
              }}
              bodyStyle={{ padding: "16px" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <PhoneOutlined style={{ fontSize: "32px", color: "#999" }} />
                <div>
                  <div
                    style={{ fontSize: "16px", fontWeight: 500, color: "#999" }}
                  >
                    Voice Campaign
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "11px",
                        color: "#fff",
                        background: "#faad14",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      Coming Soon
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#999" }}>
                    Automated voice calls
                  </div>
                </div>
              </div>
            </Card>
          </Space>
        </div>
      </Modal>

      <ResetVotersModal
        visible={isResetModalVisible}
        onCancel={() => setIsResetModalVisible(false)}
        electionId={Number(selectedElectionId)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
