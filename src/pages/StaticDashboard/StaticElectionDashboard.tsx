import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  Col,
  Row,
  Typography,
  Table,
  Modal,
  Tooltip as Tooltip2,
  Select,
  Progress,
  Divider,
  Menu,
  ConfigProvider,
  Dropdown,
  Tabs,
  Skeleton,
  Button,
  Checkbox,
  Input,
  ColorPicker,
  Popover,
  message,
  Spin,
} from "antd";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Cell,
  BarChart,
  Bar as Barchart,
  XAxis,
  ResponsiveContainer,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
} from "recharts";
import "chart.js/auto";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  useElectionStats,
  useDemographics,
  usePartyPolling,
  useFeedbackIssues,
  useBoothProgress,
} from "../../hooks/useReportingSlices";
import { useExport } from "../../context/ExportContext";
import {
  recomputeElectionStats,
  recomputeDemographics,
  recomputePartyPolling,
  recomputeFeedbackIssues,
  recomputeBoothProgress,
  getElectionStats,
  AsyncRecomputeResponse,
  listRecentJobs,
  JobStatusData,
} from "../../api/reportingApi";
import { formatIndianNumber } from "../../utlis";
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
  EditOutlined,
  SortAscendingOutlined,
  DownloadOutlined,
  FilterOutlined,
  AppstoreOutlined,
  AreaChartOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { safeParseMap } from "../../api/reportingApi";
import { EllipsisOutlined } from "@ant-design/icons";
import { fetchParties } from "../../api/partyApi";
import { getPartsApi } from "../../api/partApi";
import "../electionDashboard/ElectionDashboard.css";
import { usePersistentRefreshTimer } from "../../hooks/usePersistentRefreshTimer";
import MobileNumberBreakdownModal from "../../components/MobileNumberBreakdownModal";
import DateOfBirthBreakdownModal from "../../components/DateOfBirthBreakdownModal";
import TotalVotersBreakdownModal from "../../components/TotalVotersBreakdownModal";
import AddressedVotersBreakdownModal from "../../components/AddressedVotersBreakdownModal";
import CommunicationBreakdownModal from "../../components/CommunicationBreakdownModal";
import UnaddressedVotersBreakdownModal from "../../components/UnaddressedVotersBreakdownModal";
import VoterSlipBreakdownModal from "../../components/VoterSlipBreakdownModal";
import RecomputeProgressModal from "../../components/RecomputeProgressModal";
import RefreshStatusBanner from "../../components/RefreshStatusBanner";
import AggregateBreakdownModal from "../../components/AggregateBreakdownModal";
import ElectionSectionBreakdownModal from "../../components/ElectionSectionBreakdownModal";
import PdfExcelExportModal from "../../components/PdfExcelExportModal/PdfExcelExportModal";
import FilterDropdown from "./FilterDropdown";
import ExportModal from "./ExportModal";
import SchemePartSummaryModal from "../../components/SchemePartSummaryModal";
import SchoolBreakdownModal from "../../components/SchoolBreakdownModal";
import StarVotersBreakdownModal from "../../components/StarVotersBreakdownModal";
import axios from "axios";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Chart card background color matching PollDay dashboard
const CHART_BG_COLOR = "#F9FAFB";

// Default bar color for charts (matching PollDay)
const DEFAULT_CHART_COLOR = "#1890ff";

const ELECTION_AUTO_REFRESH_INTERVAL_MS = 600000;

const formatYAxis = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

const normalizeSchoolName = (schoolName?: string | null) => {
  if (!schoolName) {
    return null;
  }

  const normalized = schoolName
    .replace(/\u00A0/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();

  return normalized.length > 0 ? normalized : null;
};

const StaticElectionDashboard: React.FC<{ isActive?: boolean }> = ({
  isActive = false,
}) => {
  const { showPdfExcelExportModal } = useExport();
  const [activeTab, setActiveTab] = useState("1");
  const [demographicsValueMode, setDemographicsValueMode] = useState<
    "percentage" | "count" | "both"
  >("percentage");
  const [showUnknown, setShowUnknown] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showAggregateModal, setShowAggregateModal] = useState(false);
  const [showSectionBreakdownModal, setShowSectionBreakdownModal] = useState(false);
  const [showDobModal, setShowDobModal] = useState(false);
  const [showVotersModal, setShowVotersModal] = useState(false);
  const [showAddressedModal, setShowAddressedModal] = useState(false);
  const [showUnaddressedModal, setShowUnaddressedModal] = useState(false);
  const [showVoterSlipModal, setShowVoterSlipModal] = useState(false);
  const [voterSlipMetricType, setVoterSlipMetricType] = useState<"unique" | "total">("unique");
  const [showSchemeSummaryModal, setShowSchemeSummaryModal] = useState(false);
  const [showTotalSchoolModal, setShowTotalSchoolModal] = useState(false);
  const [showStarVotersModal, setShowStarVotersModal] = useState(false);
  const [breakdownModalVisible, setBreakdownModalVisible] = useState(false);
  const [aggregateBreakdownModalVisible, setAggregateBreakdownModalVisible] = useState(false);
const [breakdownType, setBreakdownType] = useState<
  "sms" | "whatsapp" | "family-slip" | "benefit-slip" | null
>(null);
const [aggregateBreakdownType, setAggregateBreakdownType] = useState<
  "religion" | "caste" | "subcaste" | "language" | "party" | "caste-category" |"star-voter"| "voters-with-photo" | "voters-without-photo" | "whatsapp-number" | null
>(null);

  const [schemeSummaryData, setSchemeSummaryData] = useState<any>({
    electionId: "",
    schemes: [],
  });
  const [showUnknownParty, setShowUnknownParty] = useState(false);
  const [genderChartType, setGenderChartType] = useState<
    "pie" | "bar" | "line"
  >("pie");
  const [genderColors, setGenderColors] = useState({
    Male: "#6A80FF",
    Female: "#FADADD",
    Transgender: "#191919",
  });
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<
    "1-voter" | "cross-booth" | null
  >(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf" | null>(
    null
  );
  const [activeExportJob, setActiveExportJob] = useState<any>(null);
  const [parties, setParties] = useState<
    {
      key: number;
      partyName: string;
      partyShortName: string;
      partyId?: number;
      partyColor?: string;
    }[]
  >([]);
  const [selectedPartStats, setSelectedPartStats] = useState<number[]>([]);
  const [selectedPartGender, setSelectedPartGender] = useState<number[]>([]);
  const [selectedPartParty, setSelectedPartParty] = useState<number[]>([]);
  const [selectedPartDemographics, setSelectedPartDemographics] = useState<
    number[]
  >([]);
  const [selectedPartAge, setSelectedPartAge] = useState<number[]>([]);
  const [parts, setParts] = useState<
    { partNumber: number; partName: string; schoolName?: string | null }[]
  >([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [partsLoaded, setPartsLoaded] = useState(false);

  // Chart customization states
  const [genderChartTitle, setGenderChartTitle] = useState("Gender");
  const [partyChartTitle, setPartyChartTitle] = useState("Party Affiliation");
  const [ageChartTitle, setAgeChartTitle] = useState("Polling based on Age");
  const [demographicsChartTitle, setDemographicsChartTitle] =
    useState("Demographics");

  const [editingGenderTitle, setEditingGenderTitle] = useState(false);
  const [editingPartyTitle, setEditingPartyTitle] = useState(false);
  const [editingAgeTitle, setEditingAgeTitle] = useState(false);
  const [editingDemographicsTitle, setEditingDemographicsTitle] =
    useState(false);

  const [partyChartColor, setPartyChartColor] = useState(DEFAULT_CHART_COLOR);
  const [ageChartColor, setAgeChartColor] = useState(DEFAULT_CHART_COLOR);
  const [demographicsChartColor, setDemographicsChartColor] =
    useState(DEFAULT_CHART_COLOR);

  const [partyChartType, setPartyChartType] = useState<"bar" | "line">("bar");
  const [ageChartType, setAgeChartType] = useState<"bar" | "line">("bar");
  const [demographicsChartType, setDemographicsChartType] = useState<
    "bar" | "line"
  >("bar");

  const [partySortOrder, setPartySortOrder] = useState<"asc" | "desc" | null>(
    null
  );
  const [ageSortOrder, setAgeSortOrder] = useState<"asc" | "desc" | null>(null);
  const [demographicsSortOrder, setDemographicsSortOrder] = useState<
    "asc" | "desc" | null
  >(null);

  const navigate = useNavigate();
  const location = useLocation();

  const selectedElectionId = useSelector(
    (s: RootState) => Number(s.election.selectedElectionId) || 0
  );
  const accountId = Number(localStorage.getItem("accountId")) || Number(localStorage.getItem("userId")) || undefined;

  // Reporting slices - with separate part filtering for each chart area
  // Convert empty arrays to undefined to avoid unnecessary re-renders and ensure proper API calls
  const statsPartNumbers =
    selectedPartStats.length > 0 ? selectedPartStats : undefined;
  const genderPartNumbers =
    selectedPartGender.length > 0 ? selectedPartGender : undefined;
  const demoPartNumbers =
    selectedPartDemographics.length > 0 ? selectedPartDemographics : undefined;
  const partyPartNumbers =
    selectedPartParty.length > 0 ? selectedPartParty : undefined;
  const agePartNumbers =
    selectedPartAge.length > 0 ? selectedPartAge : undefined;

  const [lastSuccessfulRefreshAt, setLastSuccessfulRefreshAt] = useState<number | null>(() => {
    const stored = localStorage.getItem("dashboard_last_recompute_election");
    return stored ? parseInt(stored, 10) : null;
  });
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'refr eshing' | 'success' | 'error'>('idle');

  const formatRefreshTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const stats = useElectionStats(selectedElectionId, statsPartNumbers, 600000);
  const statsGender = useElectionStats(selectedElectionId, genderPartNumbers, 600000);
  const statsAge = useElectionStats(selectedElectionId, agePartNumbers, 600000);
  const demographics = useDemographics(selectedElectionId, demoPartNumbers, 600000);
  const partyPolling = usePartyPolling(selectedElectionId, partyPartNumbers, 600000);
  const feedbackIssues = useFeedbackIssues(selectedElectionId, 600000);
  const boothProgress = useBoothProgress(selectedElectionId, 600000);

  // Update refresh status based on slice loading/error states
  useEffect(() => {
    const allSlices = [stats, statsGender, statsAge, demographics, partyPolling, feedbackIssues, boothProgress];
    const isAnyRefreshing = allSlices.some(s => s.loading);
    const hasAnyError = allSlices.some(s => s.error);
    const areAllIdle = allSlices.every(s => !s.loading);

    if (isAnyRefreshing) {
      setRefreshStatus('refreshing');
    } else if (hasAnyError) {
      setRefreshStatus('error');
    } else if (areAllIdle) {
      setRefreshStatus('success');
    }
  }, [
    stats.loading, stats.error,
    statsGender.loading, statsGender.error,
    statsAge.loading, statsAge.error,
    demographics.loading, demographics.error,
    partyPolling.loading, partyPolling.error,
    feedbackIssues.loading, feedbackIssues.error,
    boothProgress.loading, boothProgress.error
  ]);

  const [recomputing, setRecomputing] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<JobStatusData | null>(null);

  // Check for active jobs on mount and election change
  useEffect(() => {
    const checkActiveJobs = async () => {
      if (!selectedElectionId) return;

      try {
        const response = await listRecentJobs(selectedElectionId, 5);
        if (response.status === "success" && response.data) {
          const inProgressJob = response.data.find(
            (job) => job.status === "QUEUED" || job.status === "IN_PROGRESS"
          );

          if (inProgressJob) {
            setActiveJob(inProgressJob);
            setCurrentJobId(inProgressJob.jobId);
            setShowProgressModal(true);
          } else {
            setActiveJob(null);
          }
        }
      } catch (error) {
        console.error("Failed to check active jobs:", error);
      }
    };

    checkActiveJobs();
  }, [selectedElectionId]);

  const handleRecomputeAll = async () => {
    if (!selectedElectionId || activeJob) return;
    try {
      setRecomputing(true);

      // Call recompute API (may be sync or async based on election size)
      const result = await recomputeElectionStats(selectedElectionId);

      // Check if async job was started (202 response)
      if ("jobId" in result) {
        const asyncResult = result as AsyncRecomputeResponse;
        setCurrentJobId(asyncResult.jobId);
        setShowProgressModal(true);
        // Mark as active job to prevent duplicate recomputes
        setActiveJob({
          jobId: asyncResult.jobId,
          status: "IN_PROGRESS",
          accountId: 0,
          electionId: selectedElectionId,
          jobType: "ELECTION_STATS",
          partNumber: null,
          totalParts: 0,
          completedParts: 0,
          progressPercent: 0,
          startedAt: new Date().toISOString(),
          completedAt: null,
          elapsedSeconds: 0,
          errorMessage: null,
        });
      } else {
        // Synchronous response - just reload the data
        stats.reload();
        statsGender.reload();
      }

      // Also recompute other slices (these use old API for now)
      await Promise.all([
        recomputeDemographics(
          selectedElectionId,
          selectedPartDemographics.length > 0
            ? selectedPartDemographics
            : undefined
        ),
        recomputePartyPolling(
          selectedElectionId,
          selectedPartParty.length > 0 ? selectedPartParty : undefined
        ),
        recomputeFeedbackIssues(selectedElectionId),
        recomputeBoothProgress(selectedElectionId),
      ]);

      demographics.reload();
      partyPolling.reload();
      feedbackIssues.reload();
      boothProgress.reload();
    } catch (error) {
      console.error("Recompute failed:", error);
    } finally {
      setRecomputing(false);
    }
  };

  const handleRecomputeComplete = () => {
    // Reload stats when async job completes
    stats.reload();
    statsGender.reload();
    setShowProgressModal(false);
    setCurrentJobId(null);
    setActiveJob(null);
  };

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
    setCurrentJobId(null);
    setActiveJob(null);
  };

  const isRecomputeActive = recomputing || !!activeJob;

  usePersistentRefreshTimer({
    enabled: !!isActive && !!selectedElectionId && !isRecomputeActive,
    intervalMs: ELECTION_AUTO_REFRESH_INTERVAL_MS,
    storageKey: "dashboard_last_recompute_election",
    activationKey: `${selectedElectionId}-${demographicsValueMode}-${showUnknown}`,
    onTick: handleRecomputeAll,
    onTimestampUpdate: setLastSuccessfulRefreshAt,
  });

  const effectiveRefreshStatus = isRecomputeActive ? 'refreshing' : refreshStatus;
  const refreshBannerTitle =
    activeJob
      ? 'Election dashboard recompute in progress'
      : recomputing
      ? 'Election dashboard refresh in progress'
      : refreshStatus === 'success'
      ? 'Election dashboard is up to date'
      : refreshStatus === 'error'
      ? 'Election dashboard refresh needs attention'
      : 'Election dashboard auto-refresh is ready';

  const refreshBannerDetail =
    activeJob
      ? 'Large election aggregates are being recomputed in the background. The progress dialog will update automatically.'
      : recomputing
      ? `Recomputing dashboard aggregates and reloading charts. Last successful refresh: ${formatRefreshTime(lastSuccessfulRefreshAt)}.`
      : refreshStatus === 'success'
      ? `Last refreshed at ${formatRefreshTime(lastSuccessfulRefreshAt)}. Auto-refresh runs every 10 minutes.`
      : refreshStatus === 'error'
      ? `The latest dashboard refresh did not complete successfully. Last successful refresh: ${formatRefreshTime(lastSuccessfulRefreshAt)}.`
      : 'Auto-refresh will reload the dashboard every 10 minutes while you stay on this tab.';

  // Fetch parties for mapping party IDs to names
  useEffect(() => {
    const loadParties = async () => {
      if (!selectedElectionId) return;
      try {
        const response = await fetchParties(selectedElectionId);
        const partyData =
          response.data?.map((party: any) => ({
            key: party.partyId || party.id,
            partyName: party.partyName,
            partyShortName: party.partyShortName,
            partyId: party.partyId || party.id,
            partyColor: party.partyColor,
          })) || [];
        setParties(partyData);
      } catch (error) {
        console.error("Error fetching parties:", error);
      }
    };
    loadParties();
  }, [selectedElectionId]);

  // Fetch parts for filtering
  useEffect(() => {
    const loadParts = async () => {
      if (!selectedElectionId) return;
      try {
        setLoadingParts(true);
        setPartsLoaded(false);
        const response = await getPartsApi(selectedElectionId);
        const partsData =
          response.data?.map((part: any) => ({
            partNumber: parseInt(part.partNo),
            partName: part.partNameEnglish || `Part ${part.partNo}`,
            schoolName: part.schoolName,
          })) || [];
        setParts(partsData);
      } catch (error) {
        console.error("Error fetching parts:", error);
      } finally {
        setLoadingParts(false);
        setPartsLoaded(true);
      }
    };

    setParts([]);
    setPartsLoaded(false);
    loadParts();
    // Reset selected parts when election changes
    setSelectedPartStats([]);
    setSelectedPartGender([]);
    setSelectedPartParty([]);
    setSelectedPartDemographics([]);
  }, [selectedElectionId]);

  const totalBooths = useMemo(() => {
    const bp = safeParseMap<any>(boothProgress.data?.boothProgressJson);
    if (!bp) return 0;
    return Object.keys(bp).length;
  }, [boothProgress.data]);

  const totalSchoolCount = useMemo(() => {
    if (!selectedElectionId) {
      return 0;
    }

    if (!partsLoaded) {
      return null;
    }

    if (parts.length === 0) {
      return stats.data?.totalSchool ?? 0;
    }

    const selectedPartSet = new Set(selectedPartStats);
    const relevantParts =
      selectedPartSet.size > 0
        ? parts.filter((part) => selectedPartSet.has(part.partNumber))
        : parts;

    return relevantParts.reduce((uniqueSchools, part) => {
      const normalizedSchoolName = normalizeSchoolName(part.schoolName);

      if (normalizedSchoolName) {
        uniqueSchools.add(normalizedSchoolName);
      }

      return uniqueSchools;
    }, new Set<string>()).size;
  }, [parts, selectedPartStats, stats.data?.totalSchool, selectedElectionId, partsLoaded]);

  const totalVoters = stats.data?.totalVoters || 0;

  const cardColors = [
     "#E4F0FB", // soft blue
  "#EAF7E6", // soft green
  "#FDEDEB", // soft peach
  "#FFF4D6", // soft yellow
  "#F2E9FB", // soft lavender
  "#E6F7F4", // soft teal
  "#FBEAEA", // soft rose
  "#EDF3E8", // muted sage
  "#F4F1EA", // warm neutral
  "#E8F0FE", // light sky
  "#F7EDE2", // beige peach
  "#E9F5DB", // light lime
  "#F3E8FF", // violet pastel
  "#FFF1F0", // coral tint
  "#E0F7FA", // aqua
  "#FDF6EC", // cream
  "#ECEFF1", // cool grey
  "#F6F0FF", // pale purple
  "#FFF8E1", // muted amber
  "#E3FCEC", // mint tint
  "#FCE4EC", // blush
  "#EDE7F6", // indigo tint
  "#F1F8E9", // light olive
  "#FFF3E0", // light orange
  "#E8EAF6", // soft indigo
  ];

  const summaryItems = [
    {
      title: "Total School",
      count:
        totalSchoolCount === null
          ? "..."
          : totalSchoolCount.toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Total Booth",
      count: (stats.data?.totalBooth ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Total Section",
      count: (stats.data?.totalSection ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Total Voters",
      count: (totalVoters ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Voters With Photo",
      count: (stats.data?.votersWithPhoto ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Voters Without Photo",
      count: (stats.data?.votersWithoutPhoto ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Date Of Birth",
      count: (stats.data?.dateOfBirth ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Mobile Number",
      count: (stats.data?.totalMobileCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Whatsapp Number",
      count: (stats.data?.whatsappNumberCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Total Family",
      count: (stats.data?.totalFamily ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Cross Booth Family",
      count: (stats.data?.crossBoothFamily ?? 0).toLocaleString("en-IN"),
      exportType: "cross-booth",
      exportable: true,
    },
    {
      title: "1-Voter Family",
      count: (stats.data?.oneVoterFamily ?? 0).toLocaleString("en-IN"),
      exportType: "1-voter",
      exportable: true,
    },
    {
      title: "Addressed Voters",
      count: (stats.data?.addressedVoters ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Unaddressed Voters",
      count: (stats.data?.unaddressedVoters ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Star Voters",
      count: (stats.data?.totalStarVoters ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Religion",
      count: (stats.data?.religionCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Caste Category",
      count: (stats.data?.casteCategoryCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Caste",
      count: (stats.data?.casteCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Sub Caste",
      count: (stats.data?.subCasteCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Language",
      count: (stats.data?.languageCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Party Affiliation",
      count: (stats.data?.partyAffiliationCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Schemes",
      count: (stats.data?.schemesCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Unique Voter Slip Count",
      count: (stats.data?.uniqueVoterSlipCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Total Voter Slip Count",
      count: (stats.data?.voterSlipCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Family Slip",
      count: (stats.data?.familySlipCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Benefit Slip",
      count: (stats.data?.benefitSlipCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Whatsapp",
      count: (stats.data?.whatsappCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "SMS",
      count: (stats.data?.smsCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
    {
      title: "Voice Call",
      count: (stats.data?.voiceCallCount ?? 0).toLocaleString("en-IN"),
      exportType: null,
    },
  ];

  const dataSummary = summaryItems.map((item, idx) => ({
    ...item,
    bgColor: cardColors[idx % cardColors.length],
  }));

  const dataColumns = [
    { title: "Booths", dataIndex: "booths" },
    { title: "ULB", dataIndex: "ulb" },
    { title: "RLB", dataIndex: "rlb" },
    { title: "Total", dataIndex: "total" },
  ];

  const tableData = [
    { key: "1", booths: "General Booth", ulb: 50, rlb: 40, total: 90 },
    { key: "2", booths: "Pink Booth", ulb: 30, rlb: 25, total: 55 },
  ];

  const barColors = [
    "#95A4FC",
    "#BAEDBD",
    "#1C1C1C",
    "#B1E3FF",
    "#A8C5DA",
    "#A1E3CB",
  ];
  const genderBarColors: Record<string, string> = {
    Male: "#6A80FF",
    Female: "#FADADD",
    Transgender: "#191919",
  };

  const genderLabels = ["Male", "Female", "Transgender"];
  const genderData = [
    statsGender.data?.male || 0,
    statsGender.data?.female || 0,
    statsGender.data?.transgender || 0,
  ];

  const handleCardClick = (title: string, item?: any) => {
    const t = (title || "").trim().toLowerCase();
    const routes: Record<string, string | (() => void)> = {
      "total school": () => {
        setShowTotalSchoolModal(true);
      },
      "total booth": "/part-list",
      "total family": "/family-detail",
      "total section": () => setShowSectionBreakdownModal(true),
      "mobile number": () => setShowMobileModal(true),
      "date of birth": () => setShowDobModal(true),
      "total voters": () => setShowVotersModal(true),
      "voters with photo": () => {
        setAggregateBreakdownType("voters-with-photo");
        setAggregateBreakdownModalVisible(true);
      },
      "star voters": () => setShowStarVotersModal(true),
      "voters without photo": () => {
        setAggregateBreakdownType("voters-without-photo");
        setAggregateBreakdownModalVisible(true);
      },
      "whatsapp number": () => {
        setAggregateBreakdownType("whatsapp-number");
        setAggregateBreakdownModalVisible(true);
      },
      "schemes": () => {
        setSchemeSummaryData({
          electionId: String(selectedElectionId || ""),
          schemes: [],
        });
        setShowSchemeSummaryModal(true);
      },
      "scheme": () => {
        setSchemeSummaryData({
          electionId: String(selectedElectionId || ""),
          schemes: [],
        });
        setShowSchemeSummaryModal(true);
      },
     "religion": () => {
    setAggregateBreakdownType("religion");
    setAggregateBreakdownModalVisible(true);
     },
     "caste category": () => {
    setAggregateBreakdownType("caste-category");
    setAggregateBreakdownModalVisible(true);
  },
     "caste": () => {
    setAggregateBreakdownType("caste");
    setAggregateBreakdownModalVisible(true);
  },
     "language": () => {
    setAggregateBreakdownType("language");
    setAggregateBreakdownModalVisible(true);
  },
     "sub caste": () => {
    setAggregateBreakdownType("subcaste");
    setAggregateBreakdownModalVisible(true);
  },
     "party affiliation": () => {
    setAggregateBreakdownType("party");
    setAggregateBreakdownModalVisible(true);
  },
     "family slip": () => {
    setBreakdownType("family-slip");
    setBreakdownModalVisible(true);
  },

  "benefit slip": () => {
    setBreakdownType("benefit-slip");
    setBreakdownModalVisible(true);
  },

  "whatsapp": () => {
    setBreakdownType("whatsapp");
    setBreakdownModalVisible(true);
  },

  "sms": () => {
    setBreakdownType("sms");
    setBreakdownModalVisible(true);
  },
  "voice call": () => {
    setBreakdownType("voice-call");
    setBreakdownModalVisible(true);
  },
      "addressed voters": () => setShowAddressedModal(true),
      "unaddressed voters": () => setShowUnaddressedModal(true),
      "unique voter slip count": () => {
        setVoterSlipMetricType("unique");
        setShowVoterSlipModal(true);
      },
      "total voter slip count": () => {
        setVoterSlipMetricType("total");
        setShowVoterSlipModal(true);
      },
    };

    // Check if it's an exportable item
    const clickedItem = dataSummary.find((item) => item && (item.title || "").trim().toLowerCase() === t);

    if (clickedItem?.exportable) {
      setSelectedExportType(
        clickedItem.exportType as "1-voter" | "cross-booth"
      );
      setExportModalVisible(true);
      return;
    }

    if (typeof routes[t] === "string") navigate(routes[t] as string);
    if (typeof routes[t] === "function") (routes[t] as () => void)();
  };

  const handleExportData = async (format: "excel" | "pdf") => {
    if (!selectedExportType || !selectedElectionId) return;

    try {
      setExportLoading(true);
      setExportFormat(format);

      // Prepare export data based on type
      const exportPayload = {
        electionId: selectedElectionId,
        exportType: selectedExportType,
        format: format,
        // Add any filters if needed
        filters:
          selectedPartStats.length > 0
            ? { partNumbers: selectedPartStats }
            : {},
      };

      // Call export API here
      // const response = await exportFamilyData(exportPayload);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For demo, showing success message
      message.success(
        `${format.toUpperCase()} export started for ${
          selectedExportType === "1-voter"
            ? "1-Voter Family"
            : "Cross Booth Family"
        }`
      );

      // Simulate job creation
      setActiveExportJob({
        jobId: `export_${Date.now()}`,
        status: "PENDING",
        format: format,
        chartType: selectedExportType,
      });

      // Simulate job completion after 3 seconds
      setTimeout(() => {
        setActiveExportJob({
          ...activeExportJob,
          status: "COMPLETED",
        });
        setExportLoading(false);

        // Auto-download simulation
        const blob = new Blob([], {
          type:
            format === "excel" ? "application/vnd.ms-excel" : "application/pdf",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedExportType}_family_data_${
          new Date().toISOString().split("T")[0]
        }.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        message.success(`Export completed! File downloaded.`);

        // Close modal after delay
        setTimeout(() => {
          setExportModalVisible(false);
          setSelectedExportType(null);
          setActiveExportJob(null);
        }, 1000);
      }, 3000);
    } catch (error) {
      console.error("Export failed:", error);
      message.error("Export failed. Please try again.");
      setExportLoading(false);
      setExportFormat(null);
    }
  };

  const pieOptions: any = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "right",
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          color: "#334155",
          font: { size: 14, family: "Inter, sans-serif", weight: "500" },
          generateLabels: (chart: any) => {
            const dataset = chart.data.datasets[0];
            return chart.data.labels.map((label: any, i: number) => ({
              text: `${label}: ${dataset.data[i]}`,
              fillStyle: dataset.backgroundColor[i],
              pointStyle: "circle",
            }));
          },
        },
      },
    },
  };

  const barLineOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  const renderChart = () => {
    const pieBarDataset = {
      labels: genderLabels,
      datasets: [
        {
          label: "Voters",
          data: genderData,
          backgroundColor: genderLabels.map((g) => genderColors[g]),
          borderWidth: 3,
          borderColor: "#fff",
          hoverOffset: 8,
        },
      ],
    };

    const lineDataset = {
      labels: genderLabels,
      datasets: [
        {
          label: "Voters",
          data: genderData,
          backgroundColor: genderLabels.map((g) => genderColors[g]), // Use custom colors
          borderWidth: 3,
          borderColor: genderLabels.map((g) => genderColors[g]), // Use custom colors
          tension: 0.4,
          pointBackgroundColor: genderLabels.map((g) => genderColors[g]), // Use custom colors
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };

    switch (genderChartType) {
      case "bar":
        return <Bar data={pieBarDataset} options={barLineOptions} />;
      case "line":
        return <Line data={lineDataset} options={barLineOptions} />;
      default:
        return <Pie data={pieBarDataset} options={pieOptions} />;
    }
  };

  const partyCounts =
    safeParseMap<Record<string, number>>(partyPolling.data?.partyCountsJson) ||
    {};

  // Map party IDs to party names
  const partyCountsWithNames = useMemo(() => {
    const mapped = {};

    Object.entries(partyCounts).forEach(([partyId, count]) => {
      const party = parties.find(
        (p) =>
          p.partyId?.toString() === partyId || p.key?.toString() === partyId
      );
      const partyName = party?.partyShortName || party?.partyName || partyId;
      mapped[partyName] = count;
    });

    // Apply your filterUnknownEntries logic here
    if (!showUnknownParty) {
      return Object.fromEntries(
        Object.entries(mapped).filter(
          ([key]) =>
            !key.toLowerCase().includes("unknown") &&
            !key.toLowerCase().includes("other") &&
            key.trim() !== ""
        )
      );
    }

    return mapped;
  }, [partyCounts, parties, showUnknownParty]);

  // Use uniform color for party chart bars (matching PollDay dashboard style)
  const pollingBarData = useMemo(
    () => ({
      labels: Object.keys(partyCountsWithNames),
      datasets: [
        {
          label: "Voter Count",
          data: Object.values(partyCountsWithNames),
          backgroundColor: partyChartColor,
          borderRadius: 10,
        },
      ],
    }),
    [partyCountsWithNames, partyChartColor]
  );

  const pollingBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, // show legend
        position: "top" as const,
        labels: {
          font: {
            size: 12,
            family: "sans-serif",
          },
          color: "#333",
          boxWidth: 12,
          padding: 10,
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Party Name",
          color: "#555",
          font: {
            size: 13,
            weight: 600,
          },
        },
        ticks: {
          color: "#555",
          font: {
            size: 12,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: "Voter Count",
          color: "#555",
          font: {
            size: 13,
            weight: 600,
          },
        },
        ticks: {
          color: "#555",
          font: {
            size: 12,
          },
          beginAtZero: true,
        },
        grid: {
          color: "#eee",
        },
      },
    },
  };

  const issuesJson = safeParseMap<Record<string, number>>(
    feedbackIssues.data?.issueCountsJson || feedbackIssues.data?.issuesJson
  );
  const issuesData = (issuesJson ? Object.entries(issuesJson) : [])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => ({ title: k, value: v }));

  const boothProgressMap =
    safeParseMap<Record<string, { total: number; voted: number }>>(
      boothProgress.data?.boothProgressJson
    ) || {};
  const boothData = Object.entries(boothProgressMap)
    .map(([booth, obj]) => ({ booth: `Booth ${booth}`, count: obj.voted }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const pollingData = [
    { ageGroup: "18-30", value: statsAge.data?.age18To30 || 0 },
    { ageGroup: "30-40", value: statsAge.data?.age30To40 || 0 },
    { ageGroup: "40-50", value: statsAge.data?.age40To50 || 0 },
    { ageGroup: "50-60", value: statsAge.data?.age50To60 || 0 },
    { ageGroup: "60-70", value: statsAge.data?.age60To70 || 0 },
    { ageGroup: ">70", value: statsAge.data?.ageGreaterThan70 || 0 },
  ];

  const issuesMenu = (
    <Menu>
      <Menu.Item key="1">View Details</Menu.Item>
    </Menu>
  );

  const casteEntries =
    safeParseMap<Record<string, number>>(demographics.data?.casteJson) || {};
  const data = Object.entries(casteEntries)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 25);

  const religionEntries =
    safeParseMap<Record<string, number>>(demographics.data?.religionJson) || {};
  const religionData = Object.entries(religionEntries)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 25);

  const casteCategoryEntries =
    safeParseMap<Record<string, number>>(
      demographics.data?.casteCategoryJson
    ) || {};
  const casteCategoryData = Object.entries(casteCategoryEntries)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 25);

  const voterCategoryEntries =
    safeParseMap<Record<string, number>>(demographics.data?.availabilityJson) ||
    {};
  const voterCategoryData = Object.entries(voterCategoryEntries)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 25);

  const subCasteEntries =
    safeParseMap<Record<string, number>>(demographics.data?.subCasteJson) || {};
  const subCasteData = Object.entries(subCasteEntries)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 25);

  const schemeEntries =
    safeParseMap<Record<string, number>>(demographics.data?.schemesJson) || {};
  const schemeData = Object.entries(schemeEntries)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 25);

  const languageEntries =
    safeParseMap<Record<string, number>>(demographics.data?.languageJson) || {};
  const languageData = Object.entries(languageEntries)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 25);

  const relationEntries =
    safeParseMap<Record<string, number>>(demographics.data?.relationJson) || {};
  const relationData = Object.entries(relationEntries)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 25);

  const filterUnknownEntries = (entries: Record<string, number>) => {
    if (showUnknown) {
      return entries;
    }
    return Object.fromEntries(
      Object.entries(entries).filter(
        ([key]) =>
          !key.toLowerCase().includes("unknown") &&
          !key.toLowerCase().includes("other") &&
          key.trim() !== ""
      )
    );
  };

  const filteredCasteEntries = filterUnknownEntries(casteEntries);
  const filteredSubCasteEntries = filterUnknownEntries(subCasteEntries);
  const filteredCasteCategoryEntries =
    filterUnknownEntries(casteCategoryEntries);
  const filteredVoterCategoryEntries =
    filterUnknownEntries(voterCategoryEntries);
  const filteredSchemesEntries = filterUnknownEntries(schemeEntries);
  const filteredReligionEntries = filterUnknownEntries(religionEntries);
  const filteredLanguageEntries = filterUnknownEntries(languageEntries);
  const filteredRelationEntries = filterUnknownEntries(relationEntries);

  const buildCountData = (entries: Record<string, number>) =>
    Object.entries(entries)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 25);

  const buildDemographicsChartData = (
    countData: { name: string; value: number }[],
    total: number
  ) =>
    countData.map((item) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;

      return {
        name: item.name,
        count: item.value,
        percentage,
        value: demographicsValueMode === "percentage" ? percentage : item.value,
      };
    });

  // Calculate totals for each category
  const totalCaste = Object.values(filteredCasteEntries).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalSubCaste = Object.values(filteredSubCasteEntries).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalCasteCategory = Object.values(filteredCasteCategoryEntries).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalVoterCategory = Object.values(filteredVoterCategoryEntries).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalSchemes = Object.values(filteredSchemesEntries).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalReligion = Object.values(filteredReligionEntries).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalLanguage = Object.values(filteredLanguageEntries).reduce(
    (sum, count) => sum + count,
    0
  );

  const totalRelation = Object.values(filteredRelationEntries).reduce(
    (sum, count) => sum + count,
    0
  );

  const casteCountData = buildCountData(filteredCasteEntries);
  const religionCountData = buildCountData(filteredReligionEntries);
  const casteCategoryCountData = buildCountData(filteredCasteCategoryEntries);
  const voterCategoryCountData = buildCountData(filteredVoterCategoryEntries);
  const subCasteCountData = buildCountData(filteredSubCasteEntries);
  const languageCountData = buildCountData(filteredLanguageEntries);
  const schemeCountData = buildCountData(filteredSchemesEntries);
  const relationCountData = buildCountData(filteredRelationEntries);

  const getChartData = () => {
    switch (activeTab) {
      case "1":
        return buildDemographicsChartData(voterCategoryCountData, totalVoterCategory);
      case "2":
        return buildDemographicsChartData(religionCountData, totalReligion);
      case "3":
        return buildDemographicsChartData(casteCategoryCountData, totalCasteCategory);
      case "4":
        return buildDemographicsChartData(casteCountData, totalCaste);
      case "5":
        return buildDemographicsChartData(subCasteCountData, totalSubCaste);
      case "6":
        return buildDemographicsChartData(languageCountData, totalLanguage);
      case "7":
        return buildDemographicsChartData(schemeCountData, totalSchemes);
      case "8":
        return buildDemographicsChartData(relationCountData, totalRelation);
      default:
        return [];
    }
  };

  const chartData = getChartData();
  const sortedChartData =
    demographicsSortOrder !== null
      ? [...chartData].sort((a, b) =>
          demographicsSortOrder === "asc" ? a.value - b.value : b.value - a.value
        )
      : chartData;
  const currentChartTotalCount = chartData.reduce(
    (acc, item) => acc + (item.count || 0),
    0
  );

  const percentageValues = sortedChartData.map(d => d.percentage);
const countValues = sortedChartData.map(d => d.count);

const minPercentage = Math.min(...percentageValues);
const maxPercentage = Math.max(...percentageValues);

const minCount = Math.min(...countValues);
const maxCount = Math.max(...countValues);

const PADDING_PERCENT = 5;

const percentageDomain =
  maxPercentage - minPercentage < 15
    ? [
        Math.max(0, minPercentage - PADDING_PERCENT),
        Math.min(100, maxPercentage + PADDING_PERCENT),
      ]
    : [0, 100];

const countDomain = [0, maxCount * 1.1];

  return (
    <div className="main-container p-6" style={{ background: "#FAFAFA" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title
          level={4}
          style={{
            fontFamily: "sans-serif",
            fontWeight: "700",
            marginBottom: "20px",
          }}
          className="fade-in"
        >
          Election Dashboard
        </Title>
        <div style={{ marginTop: '-12px', marginBottom: '20px' }}>
          <RefreshStatusBanner
            status={effectiveRefreshStatus}
            title={refreshBannerTitle}
            detail={refreshBannerDetail}
            busy={isRecomputeActive || refreshStatus === 'refreshing'}
          />
        </div>
        <Button
          icon={<ReloadOutlined spin={isRecomputeActive} />}
          loading={isRecomputeActive}
          onClick={handleRecomputeAll}
          type="default"
          size="small"
          disabled={!!activeJob}
        >
          {activeJob ? "Processing" : recomputing ? "Refreshing" : "Refresh"}
        </Button>
      </div>

      {/* Summary Row - Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4 fade-in">
        {dataSummary.map((item, index) => (
          <div
            key={index}
            className="p-4 md:p-6 rounded-xl hover-card cursor-pointer"
            onClick={() => handleCardClick(item.title, item)}
            style={{
              backgroundColor: item.bgColor,
              boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 className="text-[12px] md:text-[12px] font-normal leading-4 text-[#1C1C1C] mb-1">
              {item.title}
            </h3>
            <p className="text-[18px] md:text-[20px] font-semibold text-[#1C1C1C]">
              {item.count}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <Row gutter={[16, 16]} className="mt-8 fade-in">
        {/* Gender Chart - Pie chart with different colors */}
        <Col xs={24} md={12}>
          <Card
            className="shadow-lg rounded-lg"
            style={{
              background: CHART_BG_COLOR,
              borderRadius: "12px",
              border: "none",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{
              padding: "16px",
            }}
          >
            {/* Title Bar */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 flex-1">
                {editingGenderTitle ? (
                  <Input
                    value={genderChartTitle}
                    onChange={(e) => setGenderChartTitle(e.target.value)}
                    onBlur={() => setEditingGenderTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingGenderTitle(false);
                      if (e.key === "Escape") {
                        setGenderChartTitle("Gender");
                        setEditingGenderTitle(false);
                      }
                    }}
                    autoFocus
                    maxLength={50}
                    className="font-semibold text-gray-800 text-lg"
                    style={{ width: "100%", maxWidth: "250px" }}
                  />
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h3 className="font-semibold text-gray-800 text-lg m-0">
                      {genderChartTitle} {statsGender.loading && "(loading...)"}
                    </h3>
                    <EditOutlined
                      className="text-gray-400 group-hover:text-blue-500 transition-colors text-sm cursor-pointer"
                      onClick={() => setEditingGenderTitle(true)}
                      title="Click to edit chart name"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Part Bar */}
            <Select
              mode="multiple"
              placeholder="Select Parts (All by default)"
              value={selectedPartGender}
              onChange={(value) => setSelectedPartGender(value)}
              style={{ width: "100%", marginBottom: 12 }}
              loading={loadingParts}
              showSearch
              allowClear
              maxTagCount="responsive"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={parts.map((part) => ({
                value: part.partNumber,
                label: `Part ${part.partNumber}`,
              }))}
            />

            {/* Statistics Bar */}
            <div className="w-full flex justify-between items-center bg-[#F3F4F6] px-4 py-2 rounded-lg border border-gray-300 shadow-sm mb-4">
              <span className="text-[14px] font-semibold text-[#1F2937]">
                Male:{" "}
                <span className="text-[#ff4d4f]">
                  {formatIndianNumber(statsGender.data?.male || 0)}
                </span>{" "}
                | Female:{" "}
                <span className="text-[#6A80FF]">
                  {formatIndianNumber(statsGender.data?.female || 0)}
                </span>{" "}
                | Transgender:{" "}
                <span className="text-[#faad14]">
                  {formatIndianNumber(statsGender.data?.transgender || 0)}
                </span>{" "}
                | Total:{" "}
                <span className="text-[#52c41a]">
                  {formatIndianNumber(
                    (statsGender.data?.male || 0) +
                      (statsGender.data?.female || 0) +
                      (statsGender.data?.transgender || 0)
                  )}
                </span>
              </span>
            </div>

            {/* Control Bar */}
            <div className="flex gap-2 mb-4 items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Left actions: Filter, Campaign, Sort, Export */}
                <Popover
                  content={
                    <div className="flex flex-col gap-2" style={{ width: 200 }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Male:</span>
                        <ColorPicker
                          size="small"
                          value={genderColors.Male}
                          onChange={(color) =>
                            setGenderColors({
                              ...genderColors,
                              Male: color.toHexString(),
                            })
                          }
                          showText
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Female:</span>
                        <ColorPicker
                          size="small"
                          value={genderColors.Female}
                          onChange={(color) =>
                            setGenderColors({
                              ...genderColors,
                              Female: color.toHexString(),
                            })
                          }
                          showText
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Transgender:</span>
                        <ColorPicker
                          size="small"
                          value={genderColors.Transgender}
                          onChange={(color) =>
                            setGenderColors({
                              ...genderColors,
                              Transgender: color.toHexString(),
                            })
                          }
                          showText
                        />
                      </div>
                      <Button
                        type="link"
                        size="small"
                        onClick={() =>
                          setGenderColors({
                            Male: "#6A80FF",
                            Female: "#FADADD",
                            Transgender: "#191919",
                          })
                        }
                      >
                        Reset to Default
                      </Button>
                    </div>
                  }
                  title="Customize Gender Colors"
                  trigger="click"
                  placement="bottomLeft"
                >
                  <Tooltip2 title="Customize Colors">
                    <Button
                      type="text"
                      icon={<AppstoreOutlined />}
                      size="middle"
                    />
                  </Tooltip2>
                </Popover>

                <FilterDropdown
                  chartId="gender"
                  selectedElectionId={String(selectedElectionId)}
                  currentFilters={undefined}
                  onApply={(filters) =>
                    console.log("Gender chart filters:", filters)
                  }
                />
                <Tooltip2 title="Campaign">
                  <Button
                    type="text"
                    icon={<SoundOutlined />}
                    size="middle"
                    onClick={() =>
                      console.log("Open campaign for gender chart")
                    }
                  />
                </Tooltip2>
                <Tooltip2 title="Sort">
                  <Button
                    type={genderChartType ? "primary" : "text"}
                    icon={<SortAscendingOutlined />}
                    onClick={() => console.log("Sort gender chart")}
                    size="middle"
                  />
                </Tooltip2>
                <Tooltip2 title="Export">
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    size="middle"
                    onClick={() => console.log("Export gender chart")}
                  />
                </Tooltip2>
              </div>

              {/* Chart Type Selector */}
              <div className="flex items-center gap-1">
                <Button.Group>
                  <Tooltip2 title="Pie Chart">
                    <Button
                      type={genderChartType === "pie" ? "primary" : "default"}
                      icon={<PieChartOutlined />}
                      onClick={() => setGenderChartType("pie")}
                      size="middle"
                    />
                  </Tooltip2>
                  <Tooltip2 title="Bar Chart">
                    <Button
                      type={genderChartType === "bar" ? "primary" : "default"}
                      icon={<BarChartOutlined />}
                      onClick={() => setGenderChartType("bar")}
                      size="middle"
                    />
                  </Tooltip2>
                  <Tooltip2 title="Line Chart">
                    <Button
                      type={genderChartType === "line" ? "primary" : "default"}
                      icon={<LineChartOutlined />}
                      onClick={() => setGenderChartType("line")}
                      size="middle"
                    />
                  </Tooltip2>
                </Button.Group>
              </div>
            </div>

            {/* Chart Content */}
            <div
              style={{
                height: "280px",
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {statsGender.loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                renderChart()
              )}
            </div>
          </Card>
        </Col>

        {/* Party Affiliation Chart */}
        <Col xs={24} md={12}>
          <Card
            className="shadow-lg rounded-lg"
            style={{
              background: CHART_BG_COLOR,
              borderRadius: "12px",
              border: "none",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{
              padding: "16px",
            }}
          >
            {/* Title Bar */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 flex-1">
                {editingPartyTitle ? (
                  <Input
                    value={partyChartTitle}
                    onChange={(e) => setPartyChartTitle(e.target.value)}
                    onBlur={() => setEditingPartyTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingPartyTitle(false);
                      if (e.key === "Escape") {
                        setPartyChartTitle("Party Affiliation");
                        setEditingPartyTitle(false);
                      }
                    }}
                    autoFocus
                    maxLength={50}
                    className="font-semibold text-gray-800 text-lg"
                    style={{ width: "100%", maxWidth: "250px" }}
                  />
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h3 className="font-semibold text-gray-800 text-lg m-0">
                      {partyChartTitle} {partyPolling.loading && "(loading...)"}
                    </h3>
                    <EditOutlined
                      className="text-gray-400 group-hover:text-blue-500 transition-colors text-sm cursor-pointer"
                      onClick={() => setEditingPartyTitle(true)}
                      title="Click to edit chart name"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Part Bar */}
            <Select
              mode="multiple"
              placeholder="Select Parts (All by default)"
              value={selectedPartParty}
              onChange={(value) => setSelectedPartParty(value)}
              style={{ width: "100%", marginBottom: 12 }}
              loading={loadingParts}
              showSearch
              allowClear
              maxTagCount="responsive"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={parts.map((part) => ({
                value: part.partNumber,
                label: `Part ${part.partNumber}`,
              }))}
            />

            {/* Statistics Bar */}
            <div className="w-full flex justify-between items-center bg-[#F3F4F6] px-4 py-2 rounded-lg border border-gray-300 shadow-sm mb-4">
              <span className="text-[14px] font-semibold text-[#1F2937]">
                Total Parties:{" "}
                <span className="text-[#2563EB]">
                  {Object.keys(partyCountsWithNames).length}
                </span>{" "}
                | Total Voters:{" "}
                <span className="text-[#52c41a]">
                  {formatIndianNumber(
                    Object.values(
                      partyCountsWithNames as Record<string, number>
                    ).reduce((a, b) => a + b, 0)
                  )}
                </span>
              </span>
            </div>

            {/* Control Bar */}
            <div className="flex gap-2 mb-4 items-center justify-between">
              {/* Left: Color Picker */}
              <div className="flex items-center">
                <ColorPicker
                  value={partyChartColor}
                  onChange={(color) => setPartyChartColor(color.toHexString())}
                  showText
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
                <FilterDropdown
                  chartId="party-affiliation"
                  selectedElectionId={String(selectedElectionId)}
                  currentFilters={undefined}
                  onApply={(filters) => {
                    console.log("Party chart filters:", filters);
                  }}
                />
                <Tooltip2 title="Campaign">
                  <Button
                    type="text"
                    icon={<SoundOutlined />}
                    size="middle"
                    onClick={() => {
                      // Campaign functionality placeholder
                      console.log("Open campaign for party chart");
                    }}
                  />
                </Tooltip2>
                <Tooltip2 title="Sort">
                  <Button
                    type={partySortOrder ? "primary" : "text"}
                    icon={<SortAscendingOutlined />}
                    onClick={() => {
                      if (!partySortOrder) setPartySortOrder("desc");
                      else if (partySortOrder === "desc")
                        setPartySortOrder("asc");
                      else setPartySortOrder(null);
                    }}
                    size="middle"
                  />
                </Tooltip2>
                <Tooltip2 title="Export">
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    size="middle"
                    onClick={() => {
                      // Export functionality placeholder
                      console.log("Export party chart");
                    }}
                  />
                </Tooltip2>
                <Checkbox
                  checked={showUnknownParty}
                  onChange={(e) => setShowUnknownParty(e.target.checked)}
                >
                  <span className="font-normal text-sm">Show Unknown</span>
                </Checkbox>
              </div>

              {/* Right: Chart Type */}
              <Popover
                content={
                  <div className="flex flex-col gap-2" style={{ width: 150 }}>
                    <Button
                      type={partyChartType === "bar" ? "primary" : "default"}
                      icon={<BarChartOutlined />}
                      onClick={() => setPartyChartType("bar")}
                      block
                    >
                      Bar Chart
                    </Button>
                    <Button
                      type={partyChartType === "line" ? "primary" : "default"}
                      icon={<LineChartOutlined />}
                      onClick={() => setPartyChartType("line")}
                      block
                    >
                      Line Chart
                    </Button>
                  </div>
                }
                title="Chart View"
                trigger="click"
                placement="bottomRight"
              >
                <Tooltip2 title="Change View">
                  <Button
                    type="primary"
                    icon={<AreaChartOutlined />}
                    size="middle"
                  />
                </Tooltip2>
              </Popover>
            </div>

            {/* Chart Content */}
            <div style={{ height: "280px", position: "relative" }}>
              {partyPolling.loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : partyChartType === "line" ? (
                <Line
                  data={{
                    labels: Object.keys(partyCountsWithNames),
                    datasets: [
                      {
                        label: "Voter Count",
                        data: Object.values(partyCountsWithNames),
                        fill: false,
                        borderColor: partyChartColor,
                        backgroundColor: partyChartColor,
                        tension: 0.1,
                      },
                    ],
                  }}
                  options={pollingBarOptions}
                />
              ) : (
                <Bar data={pollingBarData} options={pollingBarOptions} />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Voter Information Row */}
      <div className="mt-8 fade-in">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            paddingLeft: "4px",
          }}
        >
          <Title
            level={5}
            style={{
              fontFamily: "sans-serif",
              fontWeight: "700",
              margin: 0,
            }}
          >
            Statistics Dashboard
            {stats.loading && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "normal",
                  marginLeft: "8px",
                }}
              >
                (loading...)
              </span>
            )}
          </Title>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Text strong style={{ fontSize: "14px" }}>
              Part:
            </Text>
            <Select
              mode="multiple"
              placeholder="All Parts"
              allowClear
              loading={loadingParts}
              value={selectedPartStats}
              onChange={(value) => setSelectedPartStats(value)}
              style={{ width: 200 }}
              size="small"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children?.toString() ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              maxTagCount="responsive"
            >
              {parts.map((part) => (
                <Option key={part.partNumber} value={part.partNumber}>
                  {part.partNumber}
                </Option>
              ))}
            </Select>
          </div>
        </div>
        <Row
          gutter={[16, 16]}
          className="shadow-lg p-4 hover-card"
          style={{
            borderRadius: "10px",
            background: "#FFF",
            marginLeft: "1px",
            marginRight: "1px",
          }}
        >
          {[
            {
              title: "First Time Voters",
              count: formatIndianNumber(stats.data?.firstTimeVoters || 0),
              description: "Age: 18 years",
            },
            {
              title: "Senior Citizens",
              count: formatIndianNumber(stats.data?.seniorCitizens || 0),
              description: "Age: 60 to 84 years",
            },
            {
              title: "Super Seniors",
              count: formatIndianNumber(stats.data?.superSeniors || 0),
              description: "Age: 85 and above",
            },
            {
              title: "Star Voters",
              count: formatIndianNumber(stats.data?.starVoters || 0),
              description: "Influencers",
            },
          ].map((item, index) => (
            <Col
              key={index}
              xs={12}
              md={6}
              className="md:border-r last:border-none pr-4"
              style={{ borderColor: "#E2E8F0" }}
            >
              <Title
                level={4}
                className="font-extrabold !mb-1 text-black"
                style={{ fontFamily: "sans-serif" }}
              >
                {item.count}
              </Title>
              <Text
                className="block text-[#1D4ED8] font-semibold text-[16px]"
                style={{ fontFamily: "sans-serif" }}
              >
                {item.title}
              </Text>
              {item.description && (
                <Text
                  className="block text-gray-500 text-[14px]"
                  style={{ fontFamily: "sans-serif" }}
                >
                  {item.description}
                </Text>
              )}
            </Col>
          ))}
        </Row>
      </div>

      {/* Voter Information Row - for mobile screens */}
      <Row gutter={16}></Row>

      {/* Booth Information and Issues Row */}
      {/* <Row gutter={[16, 16]} align="stretch" className="mt-8 flex fade-in">
        <Col xs={24} md={12} style={{ display: "flex" }}>
          <Card
            title={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontFamily: "sans-serif" }}>Top 5 Issues</span>
                <Dropdown overlay={issuesMenu} trigger={["click"]}>
                  <EllipsisOutlined />
                </Dropdown>
              </div>
            }
            className="hover-card"
            style={{
              borderRadius: "10px",
              boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
              border: "none",
              flex: 1,
            }}
          >
            {issuesData.map((issue) => (
              <div key={issue.title} className="mt-4">
                <Text>{issue.title}</Text>
                <Progress
                  percent={issue.value}
                  showInfo={false}
                  strokeColor="#3b82f6"
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} md={12} style={{ display: "flex" }}>
          <div
            className="flex flex-col shadow-lg  p-4 hover-card"
            style={{ background: "#FFF", borderRadius: "10px" }}
          >
            <div className="flex justify-between items-center">
              <Title
                level={5}
                className="font-bold"
                style={{ fontFamily: "sans-serif" }}
              >
                Voters by Booth Having Contacts
              </Title>
           
              <div style={{ width: 120 }} />
            </div>
            {boothProgress.loading ? (
              <Skeleton active />
            ) : (
              boothData.map((item, index) => (
                <div key={index} className="mt-4">
                  <Text>{item.booth}</Text>
                  <Progress
                    percent={item.count}
                    showInfo={false}
                    strokeColor="#3b82f6"
                    style={{ transition: "width 0.5s ease" }}
                  />
                </div>
              ))
            )}
          </div>
        </Col>
      </Row> */}

      <Row
        gutter={16}
        className="mt-8 fade-in"
        style={{ display: "flex", alignItems: "stretch" }}
      >
        <Col xs={24} md={24}>
          <Card
            className="shadow-lg rounded-lg"
            style={{
              background: CHART_BG_COLOR,
              borderRadius: "12px",
              border: "none",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{
              padding: "16px",
            }}
          >
            {/* Title Bar */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 flex-1">
                {editingAgeTitle ? (
                  <Input
                    value={ageChartTitle}
                    onChange={(e) => setAgeChartTitle(e.target.value)}
                    onBlur={() => setEditingAgeTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingAgeTitle(false);
                      if (e.key === "Escape") {
                        setAgeChartTitle("Polling based on Age");
                        setEditingAgeTitle(false);
                      }
                    }}
                    autoFocus
                    maxLength={50}
                    className="font-semibold text-gray-800 text-lg"
                    style={{ width: "100%", maxWidth: "300px" }}
                  />
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h3 className="font-semibold text-gray-800 text-lg m-0">
                      {ageChartTitle} {stats.loading && "(loading...)"}
                    </h3>
                    <EditOutlined
                      className="text-gray-400 group-hover:text-blue-500 transition-colors text-sm cursor-pointer"
                      onClick={() => setEditingAgeTitle(true)}
                      title="Click to edit chart name"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Part Bar */}
            <Select
              mode="multiple"
              placeholder="Select Parts (All by default)"
              value={selectedPartAge}
              onChange={(value) => setSelectedPartAge(value)}
              style={{ width: "100%", marginBottom: 12 }}
              loading={loadingParts}
              showSearch
              allowClear
              maxTagCount="responsive"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={parts.map((part) => ({
                value: part.partNumber,
                label: `Part ${part.partNumber}`,
              }))}
            />

            {/* Statistics Bar */}
            <div className="w-full flex justify-between items-center bg-[#F3F4F6] px-4 py-2 rounded-lg border border-gray-300 shadow-sm mb-4">
              <span className="text-[14px] font-semibold text-[#1F2937]">
                18-30:{" "}
                <span className="text-green-500">
                  {formatIndianNumber(stats.data?.age18To30 || 0)}
                </span>{" "}
                | 30-40:{" "}
                <span className="text-orange-500">
                  {formatIndianNumber(stats.data?.age30To40 || 0)}
                </span>{" "}
                | 40-50:{" "}
                <span className="text-[#ff4d4f]">
                  {formatIndianNumber(stats.data?.age40To50 || 0)}
                </span>{" "}
                | 50-60:{" "}
                <span className="text-[#faad14]">
                  {formatIndianNumber(stats.data?.age50To60 || 0)}
                </span>{" "}
                | 60-70:{" "}
                <span className="text-[#722ed1]">
                  {formatIndianNumber(stats.data?.age60To70 || 0)}
                </span>{" "}
                | 70+:{" "}
                <span className="text-[#ff4d4f]">
                  {formatIndianNumber(stats.data?.ageGreaterThan70 || 0)}
                </span>{" "}
                | Total:{" "}
                <span className="text-[#2563EB]">
                  {formatIndianNumber(
                    pollingData.reduce((acc, item) => acc + item.value, 0)
                  )}
                </span>
              </span>
            </div>

            {/* Control Bar */}
            <div className="flex gap-2 mb-4 items-center justify-between">
              {/* Left: Color Picker */}
              <div className="flex items-center">
                <ColorPicker
                  value={ageChartColor}
                  onChange={(color) => setAgeChartColor(color.toHexString())}
                  showText
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
                <FilterDropdown
                  chartId="age"
                  selectedElectionId={String(selectedElectionId)}
                  currentFilters={undefined}
                  onApply={(filters) =>
                    console.log("Age chart filters:", filters)
                  }
                />
                <Tooltip2 title="Campaign">
                  <Button
                    type="text"
                    icon={<SoundOutlined />}
                    size="middle"
                    onClick={() => console.log("Open campaign for age chart")}
                  />
                </Tooltip2>
                <Tooltip2 title="Sort">
                  <Button
                    type={ageSortOrder ? "primary" : "text"}
                    icon={<SortAscendingOutlined />}
                    onClick={() => {
                      if (!ageSortOrder) setAgeSortOrder("desc");
                      else if (ageSortOrder === "desc") setAgeSortOrder("asc");
                      else setAgeSortOrder(null);
                    }}
                    size="middle"
                  />
                </Tooltip2>
                <Tooltip2 title="Export">
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    size="middle"
                    onClick={() => console.log("Export age chart")}
                  />
                </Tooltip2>
              </div>

              {/* Right: Chart Type */}
              <Popover
                content={
                  <div className="flex flex-col gap-2" style={{ width: 150 }}>
                    <Button
                      type={ageChartType === "bar" ? "primary" : "default"}
                      icon={<BarChartOutlined />}
                      onClick={() => setAgeChartType("bar")}
                      block
                    >
                      Bar Chart
                    </Button>
                    <Button
                      type={ageChartType === "line" ? "primary" : "default"}
                      icon={<LineChartOutlined />}
                      onClick={() => setAgeChartType("line")}
                      block
                    >
                      Line Chart
                    </Button>
                  </div>
                }
                title="Chart View"
                trigger="click"
                placement="bottomRight"
              >
                <Tooltip2 title="Change View">
                  <Button
                    type="primary"
                    icon={<AreaChartOutlined />}
                    size="middle"
                  />
                </Tooltip2>
              </Popover>
            </div>

            {/* Chart Content */}
            <div style={{ height: "250px", position: "relative" }}>
              {statsAge.loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : ageChartType === "line" ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={
                      ageSortOrder
                        ? [...pollingData].sort((a, b) =>
                            ageSortOrder === "asc"
                              ? a.value - b.value
                              : b.value - a.value
                          )
                        : pollingData
                    }
                    margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid stroke="none" />
                    <XAxis
                      axisLine={false}
                      tickLine={false}
                      dataKey="ageGroup"
                      label={{
                        value: "Age Group",
                        position: "insideBottom",
                        offset: 0,
                        style: { fontSize: 13, fontWeight: 600 },
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatYAxis}
                      label={{
                        value: "Voter Count",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 13, fontWeight: 600 },
                      }}
                    />
                    <Tooltip
                      formatter={(value: any) => formatIndianNumber(value)}
                    />
                    <Legend />
                    <Barchart
                      dataKey="value"
                      name="Voters"
                      barSize={30}
                      fill={ageChartColor}
                      isAnimationActive={true}
                    >
                      {pollingData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          // @ts-ignore radius array supported by recharts
                          radius={[8, 8, 0, 0]}
                          fill={ageChartColor}
                        />
                      ))}
                    </Barchart>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={
                      ageSortOrder
                        ? [...pollingData].sort((a, b) =>
                            ageSortOrder === "asc"
                              ? a.value - b.value
                              : b.value - a.value
                          )
                        : pollingData
                    }
                    margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid stroke="none" />
                    <XAxis
                      axisLine={false}
                      tickLine={false}
                      dataKey="ageGroup"
                      label={{
                        value: "Age Group",
                        position: "insideBottom",
                        offset: 0,
                        style: { fontSize: 13, fontWeight: 600 },
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatYAxis}
                      label={{
                        value: "Voter Count",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 13, fontWeight: 600 },
                      }}
                    />
                    <Tooltip
                      formatter={(value: any) => formatIndianNumber(value)}
                    />
                    <Barchart
                      dataKey="value"
                      barSize={30}
                      isAnimationActive={true}
                    >
                      {(ageSortOrder
                        ? [...pollingData].sort((a, b) =>
                            ageSortOrder === "asc"
                              ? a.value - b.value
                              : b.value - a.value
                          )
                        : pollingData
                      ).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          // @ts-ignore radius array supported by recharts
                          radius={[8, 8, 0, 0]}
                          fill={ageChartColor}
                        />
                      ))}
                    </Barchart>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
          <Divider />
        </Col>
      </Row>
      {/* <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ fontFamily: "sans-serif" }}>Pincode Map</span>
            }
            className="hover-card"
            style={{
              borderRadius: "10px",
              boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
              border: "none",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <img src={Frame} alt="Example SVG" />

            <Divider />

            <div>
              {[
                { name: "Panchayat no 11", number: 23487946 },
                { name: "Panchayat no 12", number: 45893457 },
                { name: "Panchayat no 13", number: 34574365 },
                { name: "Panchayat no 14", number: 3213437 },
              ].map((obj, index, array) => {
                const maxNumber = Math.max(...array.map((item) => item.number));
                const percentage = (obj.number / maxNumber) * 100;

                return (
                  <div key={index} style={{ marginBottom: "10px" }}>
                    <div
                      style={{
                        position: "relative",
                        height: "30px",
                        backgroundColor: "white",
                        borderRadius: "5px",
                        overflow: "hidden",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: `${percentage}%`,
                          backgroundColor: "#EFF4FB",
                          transition: "width 0.5s ease",
                        }}
                      ></div>
                      <span
                        style={{
                          position: "absolute",
                          left: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "black",
                          fontWeight: "600",
                        }}
                      >
                        {obj.name}
                      </span>
                      <span
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontWeight: "500",
                        }}
                      >
                        {obj.number}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col> */}

      {/* Demographics Chart - Religion, Caste, Subcaste, etc. */}
      <Row gutter={16} className="fade-in">
        <Col span={24}>
          <Card
            className="shadow-lg rounded-lg"
            style={{
              background: CHART_BG_COLOR,
              borderRadius: "12px",
              border: "none",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
              margin: "20px 0",
            }}
            bodyStyle={{
              padding: "16px",
            }}
          >
            {/* Title Bar */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 flex-1">
                {editingDemographicsTitle ? (
                  <Input
                    value={demographicsChartTitle}
                    onChange={(e) => setDemographicsChartTitle(e.target.value)}
                    onBlur={() => setEditingDemographicsTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingDemographicsTitle(false);
                      if (e.key === "Escape") {
                        setDemographicsChartTitle("Demographics");
                        setEditingDemographicsTitle(false);
                      }
                    }}
                    autoFocus
                    maxLength={50}
                    className="font-semibold text-gray-800 text-lg"
                    style={{ width: "100%", maxWidth: "300px" }}
                  />
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h3 className="font-semibold text-gray-800 text-lg m-0">
                      {demographicsChartTitle}{" "}
                      {demographics.loading && "(loading...)"}
                    </h3>
                    <EditOutlined
                      className="text-gray-400 group-hover:text-blue-500 transition-colors text-sm cursor-pointer"
                      onClick={() => setEditingDemographicsTitle(true)}
                      title="Click to edit chart name"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Part Bar */}
            <Select
              mode="multiple"
              placeholder="Select Parts (All by default)"
              value={selectedPartDemographics}
              onChange={(value) => setSelectedPartDemographics(value)}
              style={{ width: "100%", marginBottom: 12 }}
              loading={loadingParts}
              showSearch
              allowClear
              maxTagCount="responsive"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={parts.map((part) => ({
                value: part.partNumber,
                label: `Part ${part.partNumber}`,
              }))}
            />

            {/* Statistics Bar */}
            <div className="w-full flex justify-between items-center bg-[#F3F4F6] px-4 py-2 rounded-lg border border-gray-300 shadow-sm mb-4">
              <span className="text-[14px] font-semibold text-[#1F2937]">
                Total Items:{" "}
                <span className="text-[#2563EB]">{chartData.length}</span>{" "}
                | Total Count:{" "}
                <span className="text-[#52c41a]">
                  {formatIndianNumber(currentChartTotalCount)}
                </span>
              </span>
            </div>

            {/* Control Bar */}
            <div className="flex gap-2 mb-4 items-center justify-between flex-wrap">
              {/* Left: Color Picker */}
              <div className="flex items-center">
                <ColorPicker
                  value={demographicsChartColor}
                  onChange={(color) =>
                    setDemographicsChartColor(color.toHexString())
                  }
                  showText
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

              {/* Center: Tabs and Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <FilterDropdown
                  chartId="demographics"
                  selectedElectionId={String(selectedElectionId)}
                  currentFilters={undefined}
                  onApply={(filters) =>
                    console.log("Demographics chart filters:", filters)
                  }
                />
                <Tooltip2 title="Campaign">
                  <Button
                    type="text"
                    icon={<SoundOutlined />}
                    size="middle"
                    onClick={() =>
                      console.log("Open campaign for demographics chart")
                    }
                  />
                </Tooltip2>
                <Tooltip2 title="Export">
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    size="middle"
                    onClick={() => console.log("Export demographics chart")}
                  />
                </Tooltip2>
                <ConfigProvider
                  theme={{
                    components: {
                      Tabs: {
                        colorPrimary: "#3b82f6",
                        colorPrimaryHover: "#1d4ed8",
                        colorPrimaryActive: "#2563eb",
                      },
                    },
                  }}
                >
                  <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    size="small"
                    tabBarStyle={{
                      marginBottom: "0",
                      fontWeight: "500",
                    }}
                  >
                    <TabPane tab="Voter Category" key="1" />
                    <TabPane tab="Religion" key="2" />
                    <TabPane tab="Caste Category" key="3" />
                    <TabPane tab="Caste" key="4" />
                    <TabPane tab="Sub Caste" key="5" />
                    <TabPane tab="Language" key="6" />
                    <TabPane tab="Schemes" key="7" />
                    <TabPane tab="Relation" key="8" />
                  </Tabs>
                </ConfigProvider>
              </div>

              {/* Right: Sort, Unknown toggle, Chart Type */}
              <div className="flex items-center gap-1">
                <Tooltip2 title="Sort">
                  <Button
                    type={demographicsSortOrder ? "primary" : "text"}
                    icon={<SortAscendingOutlined />}
                    onClick={() => {
                      if (!demographicsSortOrder)
                        setDemographicsSortOrder("desc");
                      else if (demographicsSortOrder === "desc")
                        setDemographicsSortOrder("asc");
                      else setDemographicsSortOrder(null);
                    }}
                    size="middle"
                  />
                </Tooltip2>
                <Select
                  size="small"
                  value={demographicsValueMode}
                  onChange={(value: "percentage" | "count" | "both") =>
                    setDemographicsValueMode(value)
                  }
                  style={{ width: 130 }}
                >
                  <Option value="percentage">Percentage</Option>
                  <Option value="count">Count</Option>
                  <Option value="both">Both</Option>
                </Select>
                <Checkbox
                  checked={showUnknown}
                  onChange={(e) => setShowUnknown(e.target.checked)}
                >
                  <span className="font-normal text-sm">Show Unknown</span>
                </Checkbox>
                <Popover
                  content={
                    <div className="flex flex-col gap-2" style={{ width: 150 }}>
                      <Button
                        type={
                          demographicsChartType === "bar"
                            ? "primary"
                            : "default"
                        }
                        icon={<BarChartOutlined />}
                        onClick={() => setDemographicsChartType("bar")}
                        block
                      >
                        Bar Chart
                      </Button>
                      <Button
                        type={
                          demographicsChartType === "line"
                            ? "primary"
                            : "default"
                        }
                        icon={<LineChartOutlined />}
                        onClick={() => setDemographicsChartType("line")}
                        block
                      >
                        Line Chart
                      </Button>
                    </div>
                  }
                  title="Chart View"
                  trigger="click"
                  placement="bottomRight"
                >
                  <Tooltip2 title="Change View">
                    <Button
                      type="primary"
                      icon={<AreaChartOutlined />}
                      size="middle"
                    />
                  </Tooltip2>
                </Popover>
              </div>
            </div>

            {/* Chart Content */}
            <div style={{ height: "350px", position: "relative" }}>
              {demographics.loading ? (
                <Skeleton active paragraph={{ rows: 8 }} />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={sortedChartData}
                  >
                    <CartesianGrid stroke="none" />
                    <XAxis
                      axisLine={false}
                      dataKey="name"
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={({ x, y, payload }) => {
                        const label = payload.value || "";
                        const words = label.split(" ");

                        return (
                          <g transform={`translate(${x},${y + 8}) rotate(-45)`}>
                            <text textAnchor="end" fontSize={10}>
                              {words.map((word: string, index: number) => (
                                <tspan
                                  key={index}
                                  x="0"
                                  dy={index === 0 ? 0 : 12}
                                >
                                  {word}
                                </tspan>
                              ))}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <YAxis
                      scale="linear"
                      domain={[
    (dataMin: number) => Math.min(0, dataMin),
    (dataMax: number) => dataMax
  ]}
                      
                      allowDecimals={demographicsValueMode === "percentage"}
                      tickFormatter={(value) =>
                        demographicsValueMode === "percentage"
                          ? `${value.toFixed(1)}%`
                          : formatYAxis(value)
                      }
                    />
                    <Tooltip
                      formatter={(value: number, _name, payload: any) => {
                        const count = payload?.payload?.count ?? value;
                        const percentage = payload?.payload?.percentage ?? 0;

                        if (demographicsValueMode === "percentage") {
                          return [`${percentage.toFixed(2)}%`, "Percentage"];
                        }

                        if (demographicsValueMode === "both") {
                          return [
                            `${formatIndianNumber(count)} (${percentage.toFixed(
                              2
                            )}%)`,
                            "Count (Percentage)",
                          ];
                        }

                        return [formatIndianNumber(count), "Count"];
                      }}
                    />
                    <Barchart dataKey="value" barSize={30}>
                      {sortedChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={demographicsChartColor}
                          // @ts-ignore radius array
                          radius={[8, 8, 0, 0]}
                        />
                      ))}
                    </Barchart>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Mobile Number Breakdown Modal */}
      <MobileNumberBreakdownModal
        visible={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        electionId={selectedElectionId}
      />
      {/* Date of Birth Breakdown Modal */}
      <DateOfBirthBreakdownModal
        visible={showDobModal}
        onClose={() => setShowDobModal(false)}
        electionId={selectedElectionId}
      />

      {/* Total Voters Breakdown Modal */}
      <TotalVotersBreakdownModal
        visible={showVotersModal}
        onClose={() => setShowVotersModal(false)}
        electionId={selectedElectionId}
      />
      <StarVotersBreakdownModal
        visible={showStarVotersModal}
        onClose={() => setShowStarVotersModal(false)}
        electionId={selectedElectionId}
      />
      <ElectionSectionBreakdownModal
        visible={showSectionBreakdownModal}
        onClose={() => setShowSectionBreakdownModal(false)}
        electionId={selectedElectionId}
        partNumbers={selectedPartStats}
      />
      <SchemePartSummaryModal
        open={showSchemeSummaryModal}
        onClose={() => setShowSchemeSummaryModal(false)}
        data={schemeSummaryData}
      />

      {/* Addressed Voters Breakdown Modal */}
      <AddressedVotersBreakdownModal
        visible={showAddressedModal}
        onClose={() => setShowAddressedModal(false)}
        electionId={selectedElectionId}
        onExport={() => showPdfExcelExportModal(selectedElectionId, parts.map(p => p.partNumber), {
          title: "Addressed Voters",
          filters: { addressed: true }
        })}
      />

      {/* Unaddressed Voters Breakdown Modal */}
      <UnaddressedVotersBreakdownModal
        visible={showUnaddressedModal}
        onClose={() => setShowUnaddressedModal(false)}
        electionId={selectedElectionId}
        onExport={() => showPdfExcelExportModal(selectedElectionId, parts.map(p => p.partNumber), {
          title: "Unaddressed Voters",
          filters: { addressed: false }
        })}
      />

      {/* Voter Slip Breakdown Modal */}
      <VoterSlipBreakdownModal
        visible={showVoterSlipModal}
        onClose={() => setShowVoterSlipModal(false)}
        electionId={selectedElectionId}
        metricType={voterSlipMetricType}
      />
      {/* Whatsapp, Benefit-slip, Family-slip, SMS Breakdown Modal */}

        <CommunicationBreakdownModal
  visible={breakdownModalVisible}
  onClose={() => setBreakdownModalVisible(false)}
  type={breakdownType}
  electionId={Number(selectedElectionId)}
  accountId={Number(accountId)}
/>

      {/* Religion, Caste, Sub Caste, Party, Language Breakdown Modal */}

{aggregateBreakdownType && (
  <AggregateBreakdownModal
    visible={aggregateBreakdownModalVisible}
    onClose={() => setAggregateBreakdownModalVisible(false)}
    electionId={selectedElectionId}
    type={aggregateBreakdownType}
  />
)}

      {/* Recompute Progress Modal */}
      <RecomputeProgressModal
        visible={showProgressModal}
        jobId={currentJobId}
        onComplete={handleRecomputeComplete}
        onClose={handleCloseProgressModal}
      />

      <ExportModal
        visible={exportModalVisible}
        onCancel={() => {
          setExportModalVisible(false);
          setSelectedExportType(null);
          setActiveExportJob(null);
        }}
        onExport={handleExportData}
        loading={exportLoading}
        exportFormat={exportFormat}
        activeExportJob={activeExportJob}
        title={`Export ${
          selectedExportType === "1-voter"
            ? "1-Voter Family"
            : "Cross Booth Family"
        } Data`}
        description={`Exporting ${
          selectedExportType === "1-voter"
            ? "1-Voter Family"
            : "Cross Booth Family"
        } data with ${
          selectedPartStats.length > 0
            ? `${selectedPartStats.length} selected parts`
            : "all parts"
        }`}
        width={480}
      />

      <SchoolBreakdownModal
        visible={showTotalSchoolModal}
        onClose={() => setShowTotalSchoolModal(false)}
        electionId={selectedElectionId}
      />
    </div>
  );
};

export default StaticElectionDashboard;

