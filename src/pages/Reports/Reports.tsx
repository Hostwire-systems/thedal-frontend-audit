import React from "react";
import axios from "axios";
import { Card, Row, Col, Button, Modal, Select, message, Progress, Radio, DatePicker, Typography } from "antd";
import dayjs from "dayjs";
import {
  TeamOutlined,
  UserOutlined,
  IdcardOutlined,
  NotificationOutlined,
  BarChartOutlined,
  RightOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { getPartsApi } from "../../api/partApi";
import { fetchParties } from "../../api/partyApi";
import { useExport } from "../../context/ExportContext";
import { getBenefitSchemesApi } from "../../api/benefitSchemeApi";
import {
  createFamilyVoterCardExportJob,
  getFamilyVoterCardExportJobStatus,
} from "../../api/familyExportJobApi";
import {
  createFamilyExcelExportJob,
  FamilyExcelExportJob,
  pollExcelExportJob,
} from "../../api/familyExcelExportApi";
import { listAllExportJobs, UnifiedExportJob } from "../../api/familyExportApi";
import FamilyExportJobsModal from "../FamilyManager/FamilyExportJobsModal";
import PdfExcelExportModal from "../../components/PdfExcelExportModal/PdfExcelExportModal";
import SchemeExportModal from "../../components/Modals/SchemeExportModal";
import GenerateFamilySlipModal from "../../components/GenerateFamilySlipModal";
import {
  createVoterTickSheetExportJob,
  getVoterTickSheetExportJobStatus,
  downloadVoterTickSheetExport,
  createFamilySlipExportJob,
} from "../../api/reportApi";
import { getFamiliesSummary } from "../../api/familyApi";
import { BASE_URL } from "../../config";
import CustomRadioGroup from "../../components/common/CustomRadioGroup";

const DEFAULT_ID_CARD_BACKGROUND_COLOR = "#ffffff";
const UNMAPPED_EXPORT_FAMILY_ID = "00000000-0000-0000-0000-000000000000";

interface ReportExportFilters {
  minAge?: number;
  maxAge?: number;
  includeUnknownAge?: boolean;
  addressed?: boolean;
}

interface BenefitSchemeOption {
  key: number;
  schemeName: string;
  orderIndex?: number;
}

const Reports: React.FC = () => {
  const {
    showExportModal,
    showPdfExcelExportModal,
    isExportInProgress,
    startIdCardExport,
    startFamilyIdCardExport,
    isIdCardExporting,
  } = useExport();
  const [partListModalVisible, setPartListModalVisible] = React.useState(false);
  const [idCardModalVisible, setIdCardModalVisible] = React.useState(false);
  const [familyCardModalVisible, setFamilyCardModalVisible] = React.useState(false);
  const [familySlipModalVisible, setFamilySlipModalVisible] = React.useState(false);
  const [isGeneratingFamilySlip, setIsGeneratingFamilySlip] = React.useState(false);
  const [availableParts, setAvailableParts] = React.useState<any[]>([]);
  const [selectedParts, setSelectedParts] = React.useState<number[]>([]);
  const [selectedFamilyCardParts, setSelectedFamilyCardParts] = React.useState<number[]>([]);
  const [photoMode, setPhotoMode] = React.useState<"yes" | "no" | "both">(
    "both"
  );
  const [familyCardPhotoMode, setFamilyCardPhotoMode] = React.useState<"yes" | "no" | "both">(
    "both"
  );
  const [cardTemplate, setCardTemplate] = React.useState<
    "8perpage" | "10perpage"
  >("8perpage");
  const [familyCardTemplate, setFamilyCardTemplate] = React.useState<
    "8perpage" | "10perpage"
  >("8perpage");
  const [backgroundColor, setBackgroundColor] = React.useState(
    DEFAULT_ID_CARD_BACKGROUND_COLOR
  );
  const [familyCardBackgroundColor, setFamilyCardBackgroundColor] = React.useState(
    DEFAULT_ID_CARD_BACKGROUND_COLOR
  );
  const [photoDateRange, setPhotoDateRange] = React.useState<
    [string | null, string | null]
  >([null, null]);
  const [familyCardPhotoDateRange, setFamilyCardPhotoDateRange] = React.useState<
    [string | null, string | null]
  >([null, null]);
  const [parties, setParties] = React.useState<any[]>([]);
  const [selectedPartyIds, setSelectedPartyIds] = React.useState<number[]>([]);
  const [loadingParties, setLoadingParties] = React.useState(false);
  const [idCardBgImage, setIdCardBgImage] = React.useState<File | null>(null);
  const [idCardBgImagePreview, setIdCardBgImagePreview] = React.useState<string | null>(null);

  const [unmappedExportModalVisible, setUnmappedExportModalVisible] =
    React.useState(false);
  const [selectedUnmappedPart, setSelectedUnmappedPart] = React.useState<
    number | null
  >(null);
  const [unmappedExportFormat, setUnmappedExportFormat] = React.useState<
    "pdf" | "excel"
  >("pdf");
  const [unmappedExportColumns, setUnmappedExportColumns] = React.useState<
    2 | 3
  >(2);
  const [isGeneratingUnmappedExport, setIsGeneratingUnmappedExport] =
    React.useState(false);
  const [unmappedExportStatus, setUnmappedExportStatus] = React.useState<
    "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | null
  >(null);
  const [unmappedExportJobId, setUnmappedExportJobId] = React.useState<
    string | null
  >(null);
  const [unmappedProgressModalVisible, setUnmappedProgressModalVisible] =
    React.useState(false);
  const [familyExportJobsVisible, setFamilyExportJobsVisible] =
    React.useState(false);
  const unmappedExportPollingRef = React.useRef<number | null>(null);

  const [pdfExcelModalVisible, setPdfExcelModalVisible] = React.useState(false);
  const [pdfExcelModalTitle, setPdfExcelModalTitle] = React.useState("");
  const [pdfExcelModalFilters, setPdfExcelModalFilters] =
    React.useState<ReportExportFilters | null>(null);
  const [pdfExcelModalMode, setPdfExcelModalMode] = React.useState<
    "standard" | "scheme" | "voter-tick-sheet" | "one-voter-family"
  >("standard");
  const [selectedReportParts, setSelectedReportParts] = React.useState<
    number[]
  >([]);
  const [allReportPartsSelected, setAllReportPartsSelected] =
    React.useState(false);
  const [reportAllowAllParts, setReportAllowAllParts] = React.useState(false);
  const [reportPdfColumns, setReportPdfColumns] = React.useState<2 | 3>(2);
  const [loadingReportParts, setLoadingReportParts] = React.useState(false);
  const [loadingReportSchemes, setLoadingReportSchemes] = React.useState(false);
  const [reportExportLoadingFormat, setReportExportLoadingFormat] =
    React.useState<"pdf" | "excel" | "word" | null>(null);
  const [reportSchemes, setReportSchemes] = React.useState<
    BenefitSchemeOption[]
  >([]);
  const [selectedReportSchemeId, setSelectedReportSchemeId] = React.useState<
    number | null
  >(null);
  const [familyType, setFamilyType] = React.useState<"CROSS_BOOTH" | "SAME_BOOTH" | "SINGLE_VOTER">("CROSS_BOOTH");

  const [schemeExportModalVisible, setSchemeExportModalVisible] =
    React.useState(false);
  const [benefitSchemesList, setBenefitSchemesList] = React.useState<any[]>([]);
  const [loadingSchemes, setLoadingSchemes] = React.useState(false);

  const [voterTickListExportJobId, setVoterTickListExportJobId] = React.useState<string | null>(null);
  const [voterTickListExportStatus, setVoterTickListExportStatus] = React.useState<
    "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | null
  >(null);
  const voterTickListExportPollingRef = React.useRef<number | null>(null);

  const [oneVoterFamilyExporting, setOneVoterFamilyExporting] = React.useState(false);
  const [oneVoterFamilyExportStatus, setOneVoterFamilyExportStatus] = React.useState<"PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | null>(null);
  const oneVoterFamilyExportPollingRef = React.useRef<number | null>(null);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const getAccountIdFromToken = React.useCallback((): number | null => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      const tokenAccountId = Number(payload?.accountId);
      return Number.isFinite(tokenAccountId) && tokenAccountId > 0
        ? tokenAccountId
        : null;
    } catch {
      return null;
    }
  }, []);

  const accountId = React.useMemo(
    () => Number(localStorage.getItem("accountId")) || getAccountIdFromToken() || null,
    [getAccountIdFromToken]
  );

  const SLIP_EXPORT_COLUMNS = [
    "partNumber",
    "sectionNumber",
    "serialNumber",
    "epicNumber",
    "voterFnameEn",
    "voterLnameEn",
    "mobileNo",
    "voterSlipPrintCount",
    "familySlipPrintCount",
    "benefitSlipPrintCount",
    "slipCount",
  ];

  const fetchAvailableParts = React.useCallback(async () => {
    if (!selectedElectionId) return;

    try {
      const partsResponse = await getPartsApi(parseInt(selectedElectionId));
      console.log("parts response", partsResponse);

      // Fix part fetching logic based on API response format
      const responseData = partsResponse.data;
      const partsArray = Array.isArray(responseData)
        ? responseData
        : (responseData && typeof responseData === "object" && Array.isArray(responseData.data)
          ? responseData.data
          : []);

      const mappedParts = partsArray
        .map((part: any) => ({
          partNo: Number(part?.partNo || part?.partNumber),
          partNameEnglish: part?.partNameEnglish || part?.partName || "",
        }))
        .filter((part: any) => !isNaN(part.partNo) && part.partNo > 0)
        .sort((a: any, b: any) => a.partNo - b.partNo);

      // Deduplicate by partNo
      const uniqueParts = Array.from(
        new Map(mappedParts.map((item: any) => [item.partNo, item])).values()
      );

      setAvailableParts(uniqueParts);
    } catch (error) {
      console.error("Error fetching parts:", error);
      message.error("Failed to load part data. Please try again.");
    }
  }, [selectedElectionId]);

  const fetchPartiesData = React.useCallback(async () => {
    if (!selectedElectionId) {
      setParties([]);
      return;
    }
    setLoadingParties(true);
    try {
      const response = await fetchParties(parseInt(selectedElectionId));
      setParties(response?.data || []);
    } catch (error) {
      console.error("Error fetching parties:", error);
      setParties([]);
    } finally {
      setLoadingParties(false);
    }
  }, [selectedElectionId]);

  const fetchReportSchemes = React.useCallback(async () => {
    if (!selectedElectionId) {
      setReportSchemes([]);
      return;
    }

    try {
      const response = await getBenefitSchemesApi(parseInt(selectedElectionId));
      const fetchedSchemes =
        response?.data
          ?.map((scheme: any) => ({
            key: Number(scheme.id),
            schemeName: scheme.schemeName,
            orderIndex: scheme?.orderIndex,
          }))
          .filter(
            (scheme: BenefitSchemeOption) => Number.isFinite(scheme.key) && scheme.key > 0
          )
          .sort(
            (a: BenefitSchemeOption, b: BenefitSchemeOption) =>
              Number(a?.orderIndex ?? 0) - Number(b?.orderIndex ?? 0)
          ) || [];

      setReportSchemes(fetchedSchemes);
    } catch (error) {
      console.error("Error fetching report schemes:", error);
      setReportSchemes([]);
      message.error("Failed to load schemes for export.");
    }
  }, [selectedElectionId]);

  React.useEffect(() => {
    const shouldLoadParts =
      idCardModalVisible || familyCardModalVisible || unmappedExportModalVisible || pdfExcelModalVisible || familySlipModalVisible;

    if (!shouldLoadParts || !selectedElectionId) {
      return;
    }

    let cancelled = false;

    const loadParts = async () => {
      if (pdfExcelModalVisible) {
        setLoadingReportParts(true);
      }

      try {
        const tasks: Promise<void>[] = [fetchAvailableParts()];
        if (idCardModalVisible) {
          tasks.push(fetchPartiesData());
        }
        if (pdfExcelModalVisible && pdfExcelModalMode === "scheme") {
          setLoadingReportSchemes(true);
          tasks.push(fetchReportSchemes());
        }

        await Promise.all(tasks);
      } finally {
        if (!cancelled && pdfExcelModalVisible) {
          setLoadingReportParts(false);
          setLoadingReportSchemes(false);
        }
      }
    };

    void loadParts();

    return () => {
      cancelled = true;
      if (pdfExcelModalVisible) {
        setLoadingReportParts(false);
        setLoadingReportSchemes(false);
      }
    };
  }, [
    fetchAvailableParts,
    fetchReportSchemes,
    idCardModalVisible,
    familyCardModalVisible,
    pdfExcelModalMode,
    pdfExcelModalVisible,
    selectedElectionId,
    unmappedExportModalVisible,
    familySlipModalVisible,
  ]);

  React.useEffect(() => {
    if (!isIdCardExporting) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue =
        "Voter ID card export is in progress. Leaving will stop live progress updates, but the finished file will remain available in Settings -> Downloads for 24 hours.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isIdCardExporting]);

  React.useEffect(() => {
    return () => {
      if (unmappedExportPollingRef.current) {
        window.clearInterval(unmappedExportPollingRef.current);
        unmappedExportPollingRef.current = null;
      }
      if (voterTickListExportPollingRef.current) {
        window.clearInterval(voterTickListExportPollingRef.current);
        voterTickListExportPollingRef.current = null;
      }
      if (oneVoterFamilyExportPollingRef.current) {
        window.clearInterval(oneVoterFamilyExportPollingRef.current);
        oneVoterFamilyExportPollingRef.current = null;
      }
    };
  }, []);

    const triggerFileDownload = React.useCallback((blob: Blob, fileName: string) => {
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
  }, []);

  const pollVoterTickListExportJob = React.useCallback(
    (jobId: string, format: "pdf" | "word") => {
      if (voterTickListExportPollingRef.current) {
        window.clearInterval(voterTickListExportPollingRef.current);
      }

      const startedAt = Date.now();
      voterTickListExportPollingRef.current = window.setInterval(async () => {
        if (!selectedElectionId) return;
        if (Date.now() - startedAt > 10 * 60 * 1000) {
          // Timeout after 10 minutes
          if (voterTickListExportPollingRef.current) {
            window.clearInterval(voterTickListExportPollingRef.current);
            voterTickListExportPollingRef.current = null;
          }
          setVoterTickListExportStatus("FAILED");
          message.warning("Voter tick sheet export timed out.");
          return;
        }

        try {
          const statusRes = await getVoterTickSheetExportJobStatus(jobId);
          const job = statusRes.data;

          if (!job) {
            if (voterTickListExportPollingRef.current) {
              window.clearInterval(voterTickListExportPollingRef.current);
              voterTickListExportPollingRef.current = null;
            }
            setVoterTickListExportStatus("FAILED");
            message.error("Voter tick sheet export job not found.");
            return;
          }

          setVoterTickListExportStatus(
            job.status as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED",
          );

          if (job.status === "COMPLETED") {
            if (voterTickListExportPollingRef.current) {
              window.clearInterval(voterTickListExportPollingRef.current);
              voterTickListExportPollingRef.current = null;
            }
            
            try {
              message.loading({ content: "Downloading file...", key: "voterTickDownload" });
              const blob = await downloadVoterTickSheetExport(jobId);
              const extension = format === "word" ? "docx" : "pdf";
              triggerFileDownload(blob, `VoterTickSheet_${jobId}.${extension}`);
              message.success({ content: "Download complete!", key: "voterTickDownload" });
            } catch (downloadError) {
              console.error("Error downloading file:", downloadError);
              message.error({ content: "Failed to download the file.", key: "voterTickDownload" });
            }

            setVoterTickListExportJobId(null);
            setVoterTickListExportStatus(null);
          } else if (job.status === "FAILED") {
            if (voterTickListExportPollingRef.current) {
              window.clearInterval(voterTickListExportPollingRef.current);
              voterTickListExportPollingRef.current = null;
            }
            message.error(job.errorMessage || "Voter tick sheet export failed.");
            setVoterTickListExportJobId(null);
            setVoterTickListExportStatus(null);
          }
        } catch (err) {
          console.error("Error polling voter tick sheet export job:", err);
        }
      }, 3000);
    },
    [selectedElectionId, triggerFileDownload]
  );

  const openFamilyExportJobs = React.useCallback(() => {
    if (!selectedElectionId) {
      message.error("Election is not selected.");
      return;
    }

    if (!accountId) {
      message.error("Account ID not found. Please refresh and try again.");
      return;
    }

    setFamilyExportJobsVisible(true);
  }, [accountId, selectedElectionId]);

  const triggerPdfDownload = React.useCallback((blob: Blob, fileName: string) => {
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
  }, []);



  const getDownloadFileName = React.useCallback(
    (contentDisposition: string | undefined, fallbackFileName: string) => {
      if (!contentDisposition) {
        return fallbackFileName;
      }

      const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (encodedMatch?.[1]) {
        try {
          return decodeURIComponent(encodedMatch[1]);
        } catch {
          return encodedMatch[1];
        }
      }

      const standardMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      return standardMatch?.[1] || fallbackFileName;
    },
    []
  );

  const handleClosePdfExcelModal = React.useCallback(() => {
    const isBlockingExport =
      reportExportLoadingFormat &&
      pdfExcelModalMode !== "one-voter-family" &&
      pdfExcelModalMode !== "voter-tick-sheet";
    if (isBlockingExport) {
      return;
    }

    setPdfExcelModalVisible(false);
    setSelectedReportParts([]);
    setAllReportPartsSelected(false);
    setReportAllowAllParts(false);
    setReportPdfColumns(2);
    setSelectedReportSchemeId(null);
    setPdfExcelModalMode("standard");
  }, [reportExportLoadingFormat, pdfExcelModalMode]);

  const fetchBenefitSchemesData = React.useCallback(async () => {
    if (!selectedElectionId) return;
    setLoadingSchemes(true);
    try {
      const response = await getBenefitSchemesApi(parseInt(selectedElectionId));
      setBenefitSchemesList(response?.data || []);
    } catch (error) {
      console.error("Error fetching benefit schemes:", error);
      message.error("Failed to load schemes.");
    } finally {
      setLoadingSchemes(false);
    }
  }, [selectedElectionId]);

  const handleVoterTickSheetExport = React.useCallback(
    async (format: "pdf" | "word") => {
      if (!selectedElectionId) {
        message.error("Election not selected");
        return;
      }

      const parts = allReportPartsSelected ? [] : selectedReportParts;

      if (!allReportPartsSelected && !parts.length) {
        message.warning("Please select at least one part number.");
        return;
      }

      try {
        setReportExportLoadingFormat(format);
        message.info("Creating voter tick sheet export job...");

        const response = await createVoterTickSheetExportJob({
          electionId: parseInt(selectedElectionId),
          selectedParts: parts,
          format: format,
        });

        if (response.status === "success" && response.data) {
          setVoterTickListExportJobId(response.data.jobId);
          setVoterTickListExportStatus("PENDING");
          message.success("Voter tick sheet export job created successfully!");
          pollVoterTickListExportJob(response.data.jobId, format);
          setPdfExcelModalVisible(false);
          // Don't reset parts yet, wait for job
        } else {
          message.error(response.message || "Failed to create voter tick sheet export job.");
        }
      } catch (error: any) {
        console.error("Error creating voter tick sheet export job:", error);
        message.error(error.response?.data?.message || "An error occurred during export.");
      } finally {
        setReportExportLoadingFormat(null);
      }
    },
    [
      selectedElectionId,
      selectedReportParts,
      allReportPartsSelected,
      pollVoterTickListExportJob,
    ]
  );

  const handleReportExport = React.useCallback(
    async (format: "pdf" | "excel") => {
      if (!selectedElectionId) {
        message.error("Election not selected");
        return;
      }

      if (!allReportPartsSelected && !selectedReportParts.length) {
        message.warning("Please select at least one part number.");
        return;
      }

      try {
        setReportExportLoadingFormat(format);

        const jwtToken = localStorage.getItem("jwtToken");
        const params: Record<string, string | number | boolean> = {
          directDownload: true,
          format: format.toUpperCase(),
          columns: "ALL",
        };

        if (allReportPartsSelected) {
          params["booth-number"] = "all";
        } else {
          params["booth-number"] = selectedReportParts.join(",");
        }

        if (format === "pdf") {
          params.pdfColumns = reportPdfColumns;

          if (pdfExcelModalTitle) {
            params.pdfTitle = pdfExcelModalTitle;
          }
        }

        if (pdfExcelModalFilters?.minAge !== undefined) {
          params.minAge = pdfExcelModalFilters.minAge;
        }

        if (pdfExcelModalFilters?.maxAge !== undefined) {
          params.maxAge = pdfExcelModalFilters.maxAge;
        }

        if (pdfExcelModalFilters?.includeUnknownAge !== undefined) {
          params.includeUnknownAge = pdfExcelModalFilters.includeUnknownAge;
        }

        if (pdfExcelModalFilters?.addressed !== undefined) {
          params.addressed = pdfExcelModalFilters.addressed;
        }

        if (pdfExcelModalMode === "scheme" && selectedReportSchemeId) {
          params.schemeId = selectedReportSchemeId;
        }

        const response = await axios.post(
          `${BASE_URL}/api/v1/voters/${Number(selectedElectionId)}/export`,
          {},
          {
            headers: {
              accept: "*/*",
              ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
            },
            params,
            responseType: "blob",
          }
        );

        const safeTitle =
          pdfExcelModalTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "voter-export";
        const partLabel = allReportPartsSelected ? "all-parts" : selectedReportParts.join("-");
        const fallbackFileName = `${safeTitle}-${partLabel}.${
          format === "pdf" ? "pdf" : "xlsx"
        }`;
        const fileName = getDownloadFileName(
          response.headers["content-disposition"],
          fallbackFileName
        );

        triggerFileDownload(response.data, fileName);
        message.success(
          `${format === "pdf" ? "PDF" : "Excel"} export downloaded successfully.`
        );
        setPdfExcelModalVisible(false);
        setSelectedReportParts([]);
        setAllReportPartsSelected(false);
        setReportAllowAllParts(false);
        setSelectedReportSchemeId(null);
        setPdfExcelModalMode("standard");
      } catch (error) {
        console.error(`Failed to download ${format.toUpperCase()} export:`, error);
        message.error(`Failed to download ${format.toUpperCase()} export.`);
      } finally {
        setReportExportLoadingFormat(null);
      }
    },
    [
      getDownloadFileName,
      allReportPartsSelected,
      pdfExcelModalFilters,
      pdfExcelModalMode,
      pdfExcelModalTitle,
      reportPdfColumns,
      selectedReportSchemeId,
      selectedElectionId,
      selectedReportParts,
      triggerFileDownload,
    ]
  );

  const resetIdCardModalOptions = React.useCallback(() => {
    setSelectedParts([]);
    setPhotoMode("both");
    setCardTemplate("8perpage");
    setBackgroundColor(DEFAULT_ID_CARD_BACKGROUND_COLOR);
    setPhotoDateRange([null, null]);
    setSelectedPartyIds([]);
    setIdCardBgImage(null);
    setIdCardBgImagePreview(null);
  }, []);

  const resetFamilyCardModalOptions = React.useCallback(() => {
    setSelectedFamilyCardParts([]);
    setFamilyCardPhotoMode("both");
    setFamilyCardTemplate("8perpage");
    setFamilyCardBackgroundColor(DEFAULT_ID_CARD_BACKGROUND_COLOR);
    setFamilyCardPhotoDateRange([null, null]);
    setFamilyType("CROSS_BOOTH");
  }, []);

  const handleCloseIdCardModal = React.useCallback(() => {
    if (isIdCardExporting) {
      return;
    }

    setIdCardModalVisible(false);
    resetIdCardModalOptions();
  }, [isIdCardExporting, resetIdCardModalOptions]);

  const handleCloseFamilyCardModal = React.useCallback(() => {
    // Check if any export is in progress (if needed)
    setFamilyCardModalVisible(false);
    resetFamilyCardModalOptions();
  }, [resetFamilyCardModalOptions]);

  const resetUnmappedExportOptions = React.useCallback(() => {
    setSelectedUnmappedPart(null);
    setUnmappedExportFormat("pdf");
    setUnmappedExportColumns(2);
    setUnmappedExportJobId(null);
    setUnmappedExportStatus(null);
  }, []);

  const resetOneVoterFamilyModalOptions = React.useCallback(() => {
    setSelectedReportParts([]);
    setReportPdfColumns(2);
    setOneVoterFamilyExporting(false);
    setOneVoterFamilyExportStatus(null);
    setReportExportLoadingFormat(null);
  }, []);

  const handleCloseUnmappedExportModal = React.useCallback(() => {
    if (isGeneratingUnmappedExport) {
      return;
    }

    setUnmappedExportModalVisible(false);
    resetUnmappedExportOptions();
  }, [isGeneratingUnmappedExport, resetUnmappedExportOptions]);

  const handleCloseUnmappedProgressModal = React.useCallback(() => {
    setUnmappedProgressModalVisible(false);
  }, []);

  const finishUnmappedExportSuccess = React.useCallback(
    (job: Pick<UnifiedExportJob, "s3Url" | "partNo" | "rowCount">, format: "pdf" | "excel", fallbackPart: number | null) => {
      const partNo = job.partNo ?? fallbackPart;

      setIsGeneratingUnmappedExport(false);
      setUnmappedProgressModalVisible(false);
      setUnmappedExportStatus("COMPLETED");
      resetUnmappedExportOptions();

      message.success({
        content: (
          <span>
            Unmapped voter {format.toUpperCase()} ready{partNo ? ` for Part ${partNo}` : ""}
            {format === "excel" ? ` (${job.rowCount || 0} rows)` : ""}.{" "}
            <a href={job.s3Url || undefined} target="_blank" rel="noreferrer">
              Download
            </a>
          </span>
        ),
        duration: 10,
      });

      if (job.s3Url) {
        window.open(job.s3Url, "_blank");
      }
    },
    [resetUnmappedExportOptions]
  );

  const failUnmappedExport = React.useCallback(
    (errorMessage: string) => {
      setIsGeneratingUnmappedExport(false);
      setUnmappedProgressModalVisible(false);
      setUnmappedExportStatus("FAILED");
      resetUnmappedExportOptions();
      message.error(errorMessage);
    },
    [resetUnmappedExportOptions]
  );

  const resumeUnmappedExcelExportJob = React.useCallback(
    async (jobId: number, currentAccountId: number, fallbackPart: number | null) => {
      try {
        const job = await pollExcelExportJob(jobId, currentAccountId, (status) => {
          setUnmappedExportStatus(status as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED");
        });

        finishUnmappedExportSuccess(job, "excel", fallbackPart);
      } catch (error) {
        failUnmappedExport(
          error instanceof Error && error.message
            ? error.message
            : "Unmapped voter Excel export failed"
        );
      }
    },
    [failUnmappedExport, finishUnmappedExportSuccess]
  );

  const pollUnmappedPdfExportJob = React.useCallback(
    (jobId: string, electionId: number, currentAccountId: number) => {
      if (unmappedExportPollingRef.current) {
        window.clearInterval(unmappedExportPollingRef.current);
      }

      const startedAt = Date.now();
      unmappedExportPollingRef.current = window.setInterval(async () => {
        if (Date.now() - startedAt > 2 * 60 * 1000) {
          if (unmappedExportPollingRef.current) {
            window.clearInterval(unmappedExportPollingRef.current);
            unmappedExportPollingRef.current = null;
          }
          setIsGeneratingUnmappedExport(false);
            setUnmappedProgressModalVisible(false);
          setUnmappedExportStatus(null);
          message.warning("Unmapped voter export polling timed out");
          return;
        }

        try {
          const statusRes = await getFamilyVoterCardExportJobStatus(
            UNMAPPED_EXPORT_FAMILY_ID,
            electionId,
            jobId,
            currentAccountId
          );
          const job = statusRes.data;

          if (!job) {
            if (unmappedExportPollingRef.current) {
              window.clearInterval(unmappedExportPollingRef.current);
              unmappedExportPollingRef.current = null;
            }
            setIsGeneratingUnmappedExport(false);
            setUnmappedProgressModalVisible(false);
            setUnmappedExportStatus(null);
            message.error("Unmapped voter export job not found");
            return;
          }

          setUnmappedExportStatus(job.status);

          if (job.status === "COMPLETED") {
            if (unmappedExportPollingRef.current) {
              window.clearInterval(unmappedExportPollingRef.current);
              unmappedExportPollingRef.current = null;
            }
            finishUnmappedExportSuccess(job, "pdf", job.partNo ?? null);
          } else if (job.status === "FAILED") {
            if (unmappedExportPollingRef.current) {
              window.clearInterval(unmappedExportPollingRef.current);
              unmappedExportPollingRef.current = null;
            }
            failUnmappedExport(job.errorMessage || "Unmapped voter PDF export failed");
          }
        } catch {
          // Ignore transient polling failures and retry on next interval.
        }
      }, 2500);
    },
    [failUnmappedExport, finishUnmappedExportSuccess]
  );

  const openUnmappedExportFlow = React.useCallback(async () => {
    if (!selectedElectionId) {
      message.error("Election is not selected.");
      return;
    }

    if (!accountId) {
      message.error("Account ID not found. Please refresh and try again.");
      return;
    }

    if (
      isGeneratingUnmappedExport &&
      (unmappedExportStatus === "PENDING" || unmappedExportStatus === "RUNNING")
    ) {
      setUnmappedProgressModalVisible(true);
      return;
    }

    try {
      const response = await listAllExportJobs(Number(selectedElectionId), accountId, 0, 25);
      const latestRunningUnmappedJob = [...(response.data?.content || [])]
        .filter(
          (job) =>
            job.familyId === UNMAPPED_EXPORT_FAMILY_ID &&
            (job.status === "PENDING" || job.status === "RUNNING")
        )
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )[0];

      if (latestRunningUnmappedJob) {
        setSelectedUnmappedPart(latestRunningUnmappedJob.partNo ?? null);
        setUnmappedExportFormat(latestRunningUnmappedJob.exportType === "EXCEL" ? "excel" : "pdf");
        setUnmappedExportColumns(latestRunningUnmappedJob.columns === 3 ? 3 : 2);
        setUnmappedExportJobId(String(latestRunningUnmappedJob.id));
        setUnmappedExportStatus(latestRunningUnmappedJob.status);
        setIsGeneratingUnmappedExport(true);
        setUnmappedProgressModalVisible(true);

        if (latestRunningUnmappedJob.exportType === "EXCEL") {
          void resumeUnmappedExcelExportJob(
            Number(latestRunningUnmappedJob.id),
            accountId,
            latestRunningUnmappedJob.partNo ?? null
          );
        } else {
          pollUnmappedPdfExportJob(
            String(latestRunningUnmappedJob.id),
            Number(selectedElectionId),
            accountId
          );
        }
        return;
      }
    } catch (error) {
      console.error("Failed to resume unmapped export job:", error);
    }

    setUnmappedExportModalVisible(true);
  }, [
    accountId,
    isGeneratingUnmappedExport,
    pollUnmappedPdfExportJob,
    resumeUnmappedExcelExportJob,
    selectedElectionId,
    unmappedExportStatus,
  ]);

  const handleGenerateUnmappedExport = React.useCallback(async () => {
    const electionId = Number(selectedElectionId);

    if (!electionId) {
      message.error("Election is not selected.");
      return;
    }

    if (!accountId) {
      message.error("Account ID not found. Please refresh and try again.");
      return;
    }

    if (!selectedUnmappedPart) {
      message.warning("Please select a part.");
      return;
    }

    try {
      setIsGeneratingUnmappedExport(true);
      setUnmappedExportStatus("PENDING");
      setUnmappedExportModalVisible(false);
      setUnmappedProgressModalVisible(true);

      if (unmappedExportFormat === "excel") {
        const response = await createFamilyExcelExportJob({
          electionId,
          accountId,
          exportType: "part",
          familyId: UNMAPPED_EXPORT_FAMILY_ID,
          partNo: selectedUnmappedPart,
          orderBy: "serial",
          crossFamily: null,
        });

        if (!response.data?.id) {
          throw new Error("Failed to create unmapped voter Excel export job");
        }

        setUnmappedExportJobId(response.data.id.toString());
        void resumeUnmappedExcelExportJob(
          response.data.id,
          accountId,
          selectedUnmappedPart
        );
        return;
      }

      const response = await createFamilyVoterCardExportJob({
        familyId: UNMAPPED_EXPORT_FAMILY_ID,
        electionId,
        accountId,
        partNo: selectedUnmappedPart,
        columns: unmappedExportColumns,
        orderBy: "serial",
      });

      if (!response.data?.id) {
        throw new Error("Failed to create unmapped voter PDF export job");
      }

      setUnmappedExportJobId(String(response.data.id));
      pollUnmappedPdfExportJob(String(response.data.id), electionId, accountId);
    } catch (error) {
      console.error("Error generating unmapped voter export:", error);
      failUnmappedExport(
        error instanceof Error && error.message
          ? error.message
          : "Failed to generate unmapped voter export. Please try again."
      );
    }
  }, [
    accountId,
    failUnmappedExport,
    pollUnmappedPdfExportJob,
    resumeUnmappedExcelExportJob,
    selectedElectionId,
    selectedUnmappedPart,
    unmappedExportColumns,
    unmappedExportFormat,
  ]);

  const handleGeneratePartWiseIdCards = async () => {
    if (!selectedElectionId) {
      message.error("Election is not selected.");
      return;
    }

    if (selectedParts.length === 0) {
      message.warning("Please select at least one part.");
      return;
    }

    try {
      const sortedParts = [...selectedParts].sort((a, b) => a - b);

      await startIdCardExport({
        electionId: Number(selectedElectionId),
        selectedParts: sortedParts,
        photoMode,
        cardTemplate,
        backgroundColor,
        ...(photoDateRange[0] ? { photoUploadedFrom: photoDateRange[0] } : {}),
        ...(photoDateRange[1] ? { photoUploadedTo: photoDateRange[1] } : {}),
        ...(selectedPartyIds.length > 0 ? { partyIds: selectedPartyIds } : {}),
      }, idCardBgImage || undefined);

      setIdCardModalVisible(false);
      resetIdCardModalOptions();
    } catch (error) {
      console.error("Error generating part-wise voter ID cards:", error);
    }
  };

  const handleGeneratePartWiseFamilyCards = async () => {
    if (!selectedElectionId) {
      message.error("Election is not selected.");
      return;
    }

    if (selectedFamilyCardParts.length === 0) {
      message.warning("Please select at least one part.");
      return;
    }

    try {
      const sortedParts = [...selectedFamilyCardParts].sort((a, b) => a - b);

      await startFamilyIdCardExport({
        electionId: Number(selectedElectionId),
        selectedParts: sortedParts,
        photoMode: familyCardPhotoMode,
        cardTemplate: familyCardTemplate,
        backgroundColor: familyCardBackgroundColor,
        ...(familyCardPhotoDateRange[0] ? { photoUploadedFrom: familyCardPhotoDateRange[0].toISOString() } : {}),
        ...(familyCardPhotoDateRange[1] ? { photoUploadedTo: familyCardPhotoDateRange[1].toISOString() } : {}),
        familyType,
      });

      setFamilyCardModalVisible(false);
      resetFamilyCardModalOptions();
    } catch (error) {
      console.error("Error generating part-wise family cards:", error);
    }
  };

  const handleGenerateFamilySlip = async (partNo: number, language: "english" | "regional") => {
    if (!selectedElectionId) {
      message.error("Election ID not found");
      return;
    }

    setIsGeneratingFamilySlip(true);
    try {
      const response = await createFamilySlipExportJob({
        electionId: Number(selectedElectionId),
        partNo,
        language,
      });

      if (response.status === "SUCCESS") {
        message.success("Family slip generation job started successfully");
        setFamilySlipModalVisible(false);
      } else {
        message.error("Failed to start family slip generation job");
      }
    } catch (error) {
      console.error("Error generating family slip:", error);
      message.error("Failed to generate family slip");
    } finally {
      setIsGeneratingFamilySlip(false);
    }
  };

  const handleVoterSlipExport = async () => {
    const electionId = Number(selectedElectionId);
    if (!electionId) {
      message.error("Election is not selected.");
      return;
    }

    try {
      const partsResponse = await getPartsApi(electionId);
      const partNumbers = (Array.isArray(partsResponse?.data) ? partsResponse.data : [])
        .map((part: any) => Number(part?.partNo))
        .filter((partNo: number) => Number.isFinite(partNo) && partNo > 0)
        .sort((a: number, b: number) => a - b);

      if (!partNumbers.length) {
        message.warning("No parts found for this election.");
        return;
      }

      showPdfExcelExportModal(
        electionId,
        partNumbers,
        {
          title: "Export Voters",
          presetColumns: SLIP_EXPORT_COLUMNS,
          lockColumns: true,
          showColumnSelection: true,
          allowAllParts: true,
        }
      );
    } catch (error) {
      console.error("Failed to prepare voter slip export:", error);
      message.error("Failed to prepare voter slip export. Please try again.");
    }
  };

  const handlePollDayVotersExport = async (voted: boolean) => {
    const electionId = Number(selectedElectionId);
    if (!electionId) {
      message.error("Election is not selected.");
      return;
    }

    try {
      const partsResponse = await getPartsApi(electionId);
      const partNumbers = (Array.isArray(partsResponse?.data) ? partsResponse.data : [])
        .map((part: any) => Number(part?.partNo))
        .filter((partNo: number) => Number.isFinite(partNo) && partNo > 0)
        .sort((a: number, b: number) => a - b);

      if (!partNumbers.length) {
        message.warning("No parts found for this election.");
        return;
      }

      showPdfExcelExportModal(
        electionId,
        partNumbers,
        {
          title: "Export Voters",
          filters: {
            pollStatus: [voted.toString()],
          },
          showColumnSelection: true,
          allowAllParts: true,
        }
      );
    } catch (error) {
      console.error("Failed to prepare poll day voters export:", error);
      message.error("Failed to prepare export. Please try again.");
    }
  };

  const pollOneVoterFamilyPdfExportJob = React.useCallback(
    (jobId: string, familyId: string, electionId: number, currentAccountId: number) => {
      if (oneVoterFamilyExportPollingRef.current) {
        window.clearInterval(oneVoterFamilyExportPollingRef.current);
      }

      const startedAt = Date.now();
      oneVoterFamilyExportPollingRef.current = window.setInterval(async () => {
        if (Date.now() - startedAt > 5 * 60 * 1000) {
          if (oneVoterFamilyExportPollingRef.current) {
            window.clearInterval(oneVoterFamilyExportPollingRef.current);
            oneVoterFamilyExportPollingRef.current = null;
          }
          setOneVoterFamilyExporting(false);
          setOneVoterFamilyExportStatus(null);
          message.warning("1-Voter Family PDF export timed out");
          return;
        }

        try {
          const statusRes = await getFamilyVoterCardExportJobStatus(
            familyId,
            electionId,
            jobId,
            currentAccountId
          );
          const job = statusRes.data;

          if (!job) {
            if (oneVoterFamilyExportPollingRef.current) {
              window.clearInterval(oneVoterFamilyExportPollingRef.current);
              oneVoterFamilyExportPollingRef.current = null;
            }
            setOneVoterFamilyExporting(false);
            setOneVoterFamilyExportStatus(null);
            message.error("1-Voter Family PDF export job not found");
            return;
          }

          setOneVoterFamilyExportStatus(job.status);

          if (job.status === "COMPLETED") {
            if (oneVoterFamilyExportPollingRef.current) {
              window.clearInterval(oneVoterFamilyExportPollingRef.current);
              oneVoterFamilyExportPollingRef.current = null;
            }
            setOneVoterFamilyExporting(false);
            setOneVoterFamilyExportStatus("COMPLETED");
            message.success({
              content: (
                <span>
                  1-Voter Family PDF ready.{" "}
                  <a href={job.s3Url || undefined} target="_blank" rel="noreferrer">
                    Download
                  </a>
                </span>
              ),
              duration: 10,
            });
            if (job.s3Url) {
              window.open(job.s3Url, "_blank");
            }
          } else if (job.status === "FAILED") {
            if (oneVoterFamilyExportPollingRef.current) {
              window.clearInterval(oneVoterFamilyExportPollingRef.current);
              oneVoterFamilyExportPollingRef.current = null;
            }
            setOneVoterFamilyExporting(false);
            setOneVoterFamilyExportStatus("FAILED");
            message.error(job.errorMessage || "1-Voter Family PDF export failed");
          }
        } catch {
          // Ignore transient failures
        }
      }, 2500);
    },
    []
  );

  const handleOneVoterFamilyExport = async (format: "pdf" | "excel") => {
    if (!selectedElectionId) {
      message.error("Election not selected");
      return;
    }
    if (!accountId) {
      message.error("Account ID not found");
      return;
    }

    const selectedPart = selectedReportParts[0];
    if (!selectedPart) {
      message.warning("Please select a part number");
      return;
    }

    setOneVoterFamilyExporting(true);
    setOneVoterFamilyExportStatus("PENDING");
    setPdfExcelModalVisible(false);
    setReportExportLoadingFormat(format);

    try {
      const electionId = Number(selectedElectionId);

      if (format === "excel") {
        const response = await createFamilyExcelExportJob({
           electionId,
           accountId,
           exportType: "part",
           partNo: selectedPart,
           orderBy: "family",
           crossFamily: null,
           singleVoterFamily: true,
         });

        if (!response.data?.id) {
          throw new Error("Failed to create 1-Voter Family Excel export job");
        }

        const jobId = response.data.id;
        const job = await pollExcelExportJob(jobId, accountId, (status) => {
          setOneVoterFamilyExportStatus(status as any);
        });

        setOneVoterFamilyExporting(false);
        setOneVoterFamilyExportStatus("COMPLETED");
        setReportExportLoadingFormat(null);
        message.success({
          content: (
            <span>
              1-Voter Family Excel ready ({job.rowCount || 0} rows).{" "}
              <a href={job.s3Url || undefined} target="_blank" rel="noreferrer">
                Download
              </a>
            </span>
          ),
          duration: 10,
        });
        if (job.s3Url) {
          window.open(job.s3Url, "_blank");
        }
      } else {
        // PDF Export
        // Step 1: Fetch first familyId
        const familiesRes = await getFamiliesSummary(
          electionId,
          undefined,
          selectedPart.toString(),
          0,
          1,
          null,
          null,
          true // singleVoterFamily param
        );

        const firstFamily = familiesRes.data?.families?.content?.[0];
        if (!firstFamily?.familyId) {
          throw new Error("No 1-Voter families found in this part");
        }

        const familyId = firstFamily.familyId;

        // Step 2: Create PDF job
        const response = await createFamilyVoterCardExportJob({
          familyId,
          electionId,
          accountId,
          partNo: selectedPart,
          columns: reportPdfColumns,
          orderBy: "family",
          singleVoterFamily: true,
        });

        if (!response.data?.id) {
          throw new Error("Failed to create 1-Voter Family PDF export job");
        }

        const jobId = String(response.data.id);
        pollOneVoterFamilyPdfExportJob(jobId, familyId, electionId, accountId);
        setReportExportLoadingFormat(null);
      }
    } catch (error: any) {
      console.error("1-Voter Family export error:", error);
      message.error(error?.response?.data?.message || error.message || "Export failed");
      setOneVoterFamilyExporting(false);
      setOneVoterFamilyExportStatus(null);
      setReportExportLoadingFormat(null);
    }
  };

  const unmappedExportProgressPercent = React.useMemo(() => {
    switch (unmappedExportStatus) {
      case "PENDING":
        return 20;
      case "RUNNING":
        return 70;
      case "COMPLETED":
        return 100;
      case "FAILED":
        return 100;
      default:
        return 10;
    }
  }, [unmappedExportStatus]);

  const unmappedExportProgressMessage = React.useMemo(() => {
    if (unmappedExportStatus === "PENDING") {
      return `Queueing unmapped voter ${unmappedExportFormat.toUpperCase()} export job...`;
    }
    if (unmappedExportStatus === "RUNNING") {
      return `Generating unmapped voter ${unmappedExportFormat.toUpperCase()} on the server for Part ${selectedUnmappedPart ?? "-"}...`;
    }
    if (unmappedExportStatus === "COMPLETED") {
      return "Download is starting...";
    }
    if (unmappedExportStatus === "FAILED") {
      return "Export failed.";
    }
    return "Preparing export...";
  }, [selectedUnmappedPart, unmappedExportFormat, unmappedExportStatus]);

  const oneVoterFamilyProgressPercent = React.useMemo(() => {
    switch (oneVoterFamilyExportStatus) {
      case "PENDING":
        return 20;
      case "RUNNING":
        return 70;
      case "COMPLETED":
        return 100;
      case "FAILED":
        return 100;
      default:
        return 10;
    }
  }, [oneVoterFamilyExportStatus]);

  const oneVoterFamilyProgressMessage = React.useMemo(() => {
    const format = reportExportLoadingFormat || "PDF";
    const partNo = selectedReportParts[0] ?? "-";
    if (oneVoterFamilyExportStatus === "PENDING") {
      return `Queueing 1-Voter Family ${format.toUpperCase()} export job...`;
    }
    if (oneVoterFamilyExportStatus === "RUNNING") {
      return `Generating 1-Voter Family ${format.toUpperCase()} on the server for Part ${partNo}...`;
    }
    if (oneVoterFamilyExportStatus === "COMPLETED") {
      return "Download is starting...";
    }
    if (oneVoterFamilyExportStatus === "FAILED") {
      return "Export failed.";
    }
    return "Preparing export...";
  }, [selectedReportParts, reportExportLoadingFormat, oneVoterFamilyExportStatus]);

  const cardData = [
    {
      title: "Part Manager",
      icon: <TeamOutlined style={{ fontSize: "20px", color: "#16a34a" }} />,
      options: [
        "Part List",
        "Section List",
        "Part Map",
        "Vulnerability",
        "BLO Details",
        "BLA-2 Details",
        "BLO & BLA-2",
        "Booth Committee",
        "All Part Details",
      ],
      gradient: "linear-gradient(to right, #dcfce7, #ffffff)",
    },
    {
      title: "Voter Manager",
      icon: <UserOutlined style={{ fontSize: "20px", color: "#dc2626" }} />,
      options: [
        "Voter List",
        "Scheme Export",
        "Generate ID Card",
        "Voter Slips Export",
        "Addressed Voters",
        "Unaddressed Voters",
        "First Time Voters- Age 18-20",
        "85 and above",
        "Postal Voters",
        "Scheme Export"
      ],
      gradient: "linear-gradient(to right, #fecaca, #ffffff)",
    },
    {
      title: "Family Manager",
      icon: <TeamOutlined style={{ fontSize: "20px", color: "#1d4ed8" }} />,
      options: ["Unmapped Voter", "Generate Family Card", "Generate Family Slip", "1-Voter Family"],
      gradient: "linear-gradient(to right, #dbeafe, #ffffff)",
    },
    {
      title: "Cadre Manager",
      icon: <IdcardOutlined style={{ fontSize: "20px", color: "#d97706" }} />,
      options: ["Cadre List", "Active Cadres", "Inactive Cadres"],
      gradient: "linear-gradient(to right, #fef3c7, #ffffff)",
    },
    {
      title: "Campaign Manager",
      icon: (
        <NotificationOutlined style={{ fontSize: "20px", color: "#0369a1" }} />
      ),
      options: [],
      gradient: "linear-gradient(to right, #bae6fd, #ffffff)",
    },
    {
      title: "Pollday Manager",
      icon: <BarChartOutlined style={{ fontSize: "20px", color: "#7c3aed" }} />,
      options: ["Voted List", "Not Voted List", "Voter Tick List"],
      gradient: "linear-gradient(to right, #e9d5ff, #ffffff)",
    },
    {
      title: "Form Manager",
      icon: <BarChartOutlined style={{ fontSize: "20px", color: "#7c3aed" }} />,
      options: ["Form 17 Part-1 (Accounts of votes recorded)"],
      gradient: "linear-gradient(to right, #fecaca, #ffffff)",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h2 className="font-bold text-[31px] leading-8">Report</h2>
        {/* <Button
          type="primary"
          className="text-white px-6 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
            hover:!bg-[#1D4ED8] hover:text-[#fff]
            hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
        >
          Add New Report
        </Button> */}
      </div>

      <Row gutter={[24, 24]}>
        {cardData.map((card, index) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={index}>
            <Card
              style={{
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "1px solid #e8e8e8",
                height: "100%",
                overflow: "hidden",
              }}
              bodyStyle={{ padding: "0" }}
            >
              {/* Gradient Header */}
              <div
                style={{
                  background: card.gradient,
                  padding: "20px",
                  color: "black",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  {card.icon}
                  <h3
                    style={{
                      margin: "0 0 0 12px",
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#000000",
                    }}
                  >
                    {card.title}
                  </h3>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666666",
                    marginLeft: "32px",
                  }}
                >
                  {card.options.length} options available
                </div>
              </div>

              {/* Content Area */}
              <div style={{ padding: "16px 20px" }}>
                <div style={{ marginTop: "8px" }}>
                  {card.options.map((option, optionIndex) => {
                    const enabledOptions = [
                      "Generate ID Card",
                       "Addressed Voters",
        "Unaddressed Voters",
                      "Voter Slips Export",
                      "Unmapped Voter",
                      "Voter List",
                      "Scheme Export",
                      "First Time Voters- Age 18-20",
                      "85 and above",
                      "Voted List",
                      "Not Voted List",
                      "Generate Family Card",
                      "Generate Family Slip",
                      "Voter Tick List",
                      "1-Voter Family"
                    ];
                    const isDisabled = !enabledOptions.includes(option);

                    return (
                      <React.Fragment key={optionIndex}>
                        <div
                          style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 8px",
                          borderBottom: "1px solid #f0f0f0",
                          borderRadius: "4px",
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          opacity: isDisabled ? 0.5 : 1,
                          backgroundColor: isDisabled
                            ? "#f8fafc"
                            : "transparent",
                        }}
                        onClick={() => {
                          if (isDisabled) return;

                          if (option === "Generate ID Card") {
                            setIdCardModalVisible(true);
                            return;
                          }

                          if (option === "Generate Family Card") {
                            setFamilyCardModalVisible(true);
                            return;
                          }

                          if (option === "Generate Family Slip") {
                            setFamilySlipModalVisible(true);
                            return;
                          }

                          if (option === "Voter Slips Export") {
                            handleVoterSlipExport();
                            return;
                          }

                          if (option === "Unmapped Voter") {
                            void openUnmappedExportFlow();
                            return;
                          }

                          if (option === "85 and above") {
                            setPdfExcelModalTitle("Export 85 and Above Voters");
                            setPdfExcelModalFilters({
                              minAge: 85,
                              maxAge: 150,
                              includeUnknownAge: false,
                            });
                            setReportAllowAllParts(true);
                            setAllReportPartsSelected(false);
                            setReportPdfColumns(2);
                            setSelectedReportParts([]);
                            setPdfExcelModalVisible(true);
                            return;
                          }

                          if (option === "First Time Voters- Age 18-20") {
                            setPdfExcelModalTitle("Export First Time Voters (18-20)");
                            setPdfExcelModalFilters({
                              minAge: 18,
                              maxAge: 20,
                              includeUnknownAge: false,
                            });
                            setReportAllowAllParts(true);
                            setAllReportPartsSelected(false);
                            setReportPdfColumns(2);
                            setSelectedReportParts([]);
                            setPdfExcelModalVisible(true);
                            return;
                          }

                          if (option === "Voter List") {
                            setPdfExcelModalMode("standard");
                            setPdfExcelModalTitle("Export Voter List");
                            setPdfExcelModalFilters({});
                            setReportAllowAllParts(false);
                            setAllReportPartsSelected(false);
                            setReportPdfColumns(2);
                            setSelectedReportParts([]);
                            setSelectedReportSchemeId(null);
                            setPdfExcelModalVisible(true);
                            return;
                          }

                          if (option === "Addressed Voters") {
                            setPdfExcelModalMode("standard");
                            setPdfExcelModalTitle("Export Addressed Voters");
                            setPdfExcelModalFilters({ addressed: true });
                            setReportAllowAllParts(false);
                            setAllReportPartsSelected(false);
                            setReportPdfColumns(2);
                            setSelectedReportParts([]);
                            setSelectedReportSchemeId(null);
                            setPdfExcelModalVisible(true);
                            return;
                          }

                          if (option === "Unaddressed Voters") {
                            setPdfExcelModalMode("standard");
                            setPdfExcelModalTitle("Export Unaddressed Voters");
                            setPdfExcelModalFilters({ addressed: false });
                            setReportAllowAllParts(false);
                            setAllReportPartsSelected(false);
                            setReportPdfColumns(2);
                            setSelectedReportParts([]);
                            setSelectedReportSchemeId(null);
                            setPdfExcelModalVisible(true);
                            return;
                          }

                          if (option === "Scheme Export") {
                            setPdfExcelModalMode("scheme");
                            setPdfExcelModalTitle("Export Scheme Voters");
                            setPdfExcelModalFilters({});
                            setReportAllowAllParts(false);
                            setAllReportPartsSelected(false);
                            setReportPdfColumns(2);
                            setSelectedReportParts([]);
                            setSelectedReportSchemeId(null);
                            setPdfExcelModalVisible(true);
                            return;
                          }

                          if (option === "Scheme Export") {
                            setSchemeExportModalVisible(true);
                            void fetchBenefitSchemesData();
                            return;
                          }

                          if (option === "Voted List") {
                            handlePollDayVotersExport(true);
                            return;
                          }

                          if (option === "Not Voted List") {
                            handlePollDayVotersExport(false);
                            return;
                          }

                          if (option === "Voter Tick List") {
                            setPdfExcelModalMode("voter-tick-sheet");
                            setPdfExcelModalTitle("Export Voter Tick Sheet");
                            setPdfExcelModalFilters(null);
                            setReportAllowAllParts(true);
                            setAllReportPartsSelected(false);
                            setReportPdfColumns(2);
                            setSelectedReportParts([]);
                            setSelectedReportSchemeId(null);
                            setPdfExcelModalVisible(true);
                            return;
                          }

                          if (option === "1-Voter Family") {
                            setPdfExcelModalMode("one-voter-family");
                            setPdfExcelModalTitle("Export 1-Voter Family");
                            setPdfExcelModalFilters(null);
                            setReportAllowAllParts(false);
                            setAllReportPartsSelected(false);
                            setReportPdfColumns(2);
                            setSelectedReportParts([]);
                            setSelectedReportSchemeId(null);
                            setPdfExcelModalVisible(true);
                            return;
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (isDisabled) return;
                          e.currentTarget.style.backgroundColor = "#f8fafc";
                          e.currentTarget.style.color = "#1D4ED8";
                        }}
                        onMouseLeave={(e) => {
                          if (isDisabled) return;
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "inherit";
                        }}
                      >
                        <span>{option}</span>

                        {isDisabled ? (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#94a3b8",
                              fontStyle: "italic",
                            }}
                          >
                            Disabled
                          </span>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {option === "Voter Slips Export" && isExportInProgress && (
                              <span style={{ fontSize: "11px", color: "#2563eb" }}>
                                In progress
                              </span>
                            )}
                            {option === "Unmapped Voter" &&
                              isGeneratingUnmappedExport &&
                              (unmappedExportStatus === "PENDING" ||
                                unmappedExportStatus === "RUNNING") && (
                                <span style={{ fontSize: "11px", color: "#2563eb" }}>
                                  In progress
                                </span>
                              )}
                            {option === "Voter Tick List" &&
                              (voterTickListExportStatus === "PENDING" ||
                                voterTickListExportStatus === "RUNNING") && (
                                <span style={{ fontSize: "11px", color: "#2563eb" }}>
                                  {voterTickListExportStatus === "RUNNING" ? "Generating..." : "Queued..."}
                                </span>
                              )}
                            {option === "1-Voter Family" &&
                              oneVoterFamilyExporting &&
                              (oneVoterFamilyExportStatus === "PENDING" ||
                                oneVoterFamilyExportStatus === "RUNNING") && (
                                <span style={{ fontSize: "11px", color: "#2563eb" }}>
                                  In progress
                                </span>
                              )}
                            <RightOutlined
                              style={{
                                fontSize: "10px",
                                color: "#64748b",
                              }}
                            />
                          </div>
                        )}
                      </div>
                      {option === "1-Voter Family" && oneVoterFamilyExporting && (
                        <div style={{ padding: "0 12px 12px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <Typography.Text style={{ fontSize: "11px", color: "#64748b" }}>
                              {oneVoterFamilyProgressMessage}
                            </Typography.Text>
                            <Typography.Text style={{ fontSize: "11px", fontWeight: "bold", color: "#1d4ed8" }}>
                              {oneVoterFamilyProgressPercent}%
                            </Typography.Text>
                          </div>
                          <Progress
                            percent={oneVoterFamilyProgressPercent}
                            status={oneVoterFamilyExportStatus === "FAILED" ? "exception" : "active"}
                            showInfo={false}
                            strokeColor="#1d4ed8"
                            size="small"
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                  {card.options.length === 0 && (
                    <div
                      style={{
                        padding: "20px 8px",
                        textAlign: "center",
                        color: "#64748b",
                        //   fontSize: '13px',
                        fontStyle: "italic",
                      }}
                    >
                      Options coming soon
                    </div>
                  )}
                </div>

                <Button
                  type="primary"
                  disabled={card.title !== "Family Manager"}
                  onClick={card.title === "Family Manager" ? openFamilyExportJobs : undefined}
                  style={{
                    width: "100%",
                    marginTop: "16px",
                    backgroundColor:
                      card.title === "Family Manager" ? "#1D4ED8" : "#cbd5e1",
                    borderColor:
                      card.title === "Family Manager" ? "#1D4ED8" : "#cbd5e1",
                    color: card.title === "Family Manager" ? "#ffffff" : "#475569",
                    borderRadius: "6px",
                    height: "36px",
                    fontWeight: "500",
                    // fontSize: '13px'
                  }}
                >
                  {card.title === "Family Manager"
                    ? "View Export Jobs"
                    : `Manage ${card.title.split(" ")[0]}`}
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <Modal
        title="Part List Report"
        open={partListModalVisible}
        onCancel={() => setPartListModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ padding: "20px" }}>
          <h3 style={{ fontWeight: 600 }}>Download Reports</h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            <Card
              hoverable
              onClick={() => console.log("Generate Excel")}
              style={{
                border: "2px solid #217346",
                borderRadius: "8px",
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
                  <FileExcelOutlined
                    style={{ fontSize: "24px", color: "#217346" }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "16px", fontWeight: 600 }}>
                    Download as Excel
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    XLSX format
                  </div>
                </div>
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => console.log("Generate PDF")}
              style={{
                border: "2px solid #ff4d4f",
                borderRadius: "8px",
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
                  <FilePdfOutlined
                    style={{ fontSize: "24px", color: "#ff4d4f" }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "16px", fontWeight: 600 }}>
                    Download as PDF
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    PDF format
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Modal>



      <Modal
        title="Export Unmapped Voters"
        open={unmappedExportModalVisible}
        onCancel={handleCloseUnmappedExportModal}
        onOk={handleGenerateUnmappedExport}
        okText={unmappedExportFormat === "pdf" ? "Export PDF" : "Export Excel"}
        cancelText="Cancel"
        width={540}
        okButtonProps={{
          disabled: !selectedUnmappedPart,
          loading: isGeneratingUnmappedExport,
          style: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
        }}
      >
        <div style={{ paddingTop: "8px" }}>
          <div style={{ marginBottom: "8px", fontWeight: 600 }}>Select Part</div>
          <Select
            placeholder="Choose part number"
            value={selectedUnmappedPart ?? undefined}
            onChange={(value) => setSelectedUnmappedPart(Number(value))}
            style={{ width: "100%" }}
            showSearch
            optionFilterProp="children"
            disabled={isGeneratingUnmappedExport}
          >
{availableParts.map((part) => (
  <Select.Option key={part.partNo} value={part.partNo}>
    Part {part.partNo}
  </Select.Option>
))}
          </Select>

          <div style={{ marginTop: "16px", marginBottom: "4px", fontWeight: 600 }}>Export Format</div>
          <Radio.Group
            value={unmappedExportFormat}
            onChange={(e) => setUnmappedExportFormat(e.target.value)}
            disabled={isGeneratingUnmappedExport}
          >
            <Radio value="pdf">PDF</Radio>
            <Radio value="excel">Excel</Radio>
          </Radio.Group>

          {unmappedExportFormat === "pdf" && (
            <>
              <div style={{ marginTop: "16px", marginBottom: "4px", fontWeight: 600 }}>Layout</div>
              <Select
                value={unmappedExportColumns}
                onChange={(value) => setUnmappedExportColumns(value)}
                style={{ width: "100%" }}
                disabled={isGeneratingUnmappedExport}
              >
                <Select.Option value={2}>2 columns</Select.Option>
                <Select.Option value={3}>3 columns</Select.Option>
              </Select>
            </>
          )}

          <div style={{ marginTop: "12px", fontSize: "12px", color: "#64748b" }}>
            This export runs asynchronously like the current family export. PDF uses the family export card template and labels each page as Unmapped Family voter.
          </div>
          <Button type="link" style={{ paddingLeft: 0, marginTop: "8px" }} onClick={openFamilyExportJobs}>
            View export jobs
          </Button>
        </div>
      </Modal>

      <Modal
        title="Generate Voter ID Cards"
        open={idCardModalVisible}
        onCancel={handleCloseIdCardModal}
        width={560}
        footer={[
          <Button
            key="cancel"
            onClick={handleCloseIdCardModal}
            disabled={isIdCardExporting}
          >
            Cancel
          </Button>,
          <Button
            key="generate"
            type="primary"
            loading={isIdCardExporting}
            onClick={handleGeneratePartWiseIdCards}
            className="hover:!bg-[#1D4ED8] hover:!border-[#1D4ED8]"
            style={{ backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" }}
          >
            Generate
          </Button>,
        ]}
      >
        <div style={{ padding: "10px 0" }}>
          <div style={{ marginBottom: "8px", fontWeight: 600 }}>Select Parts</div>
          <Select
            mode="multiple"
            placeholder="Choose part number(s)"
            value={selectedParts}
            onChange={(values) =>
              setSelectedParts(values.map((value) => Number(value)).sort((a, b) => a - b))
            }
            style={{ width: "100%" }}
            showSearch
            optionFilterProp="children"
            maxTagCount="responsive"
            disabled={isIdCardExporting}
          >
           {availableParts.map((part) => (
  <Select.Option key={part.partNo} value={part.partNo}>
    Part {part.partNo}
  </Select.Option>
))}
          </Select>

          <div style={{ marginTop: "16px", marginBottom: "8px", fontWeight: 600 }}>
            Party Affiliation
          </div>
          <Select
            mode="multiple"
            placeholder="Select Parties (Optional)"
            value={selectedPartyIds}
            onChange={(values) =>
              setSelectedPartyIds(
                (values ?? [])
                  .map((value) => Number(value))
                  .filter((value) => Number.isFinite(value) && value > 0)
                  .sort((a, b) => a - b)
              )
            }
            style={{ width: "100%" }}
            showSearch
            allowClear
            loading={loadingParties}
            optionFilterProp="children"
            maxTagCount="responsive"
            disabled={isIdCardExporting}
          >
            {parties
              .map((party) => ({
                value: Number(party?.id ?? party?.key),
                label: party?.partyName,
              }))
              .filter((party) => Number.isFinite(party.value) && party.value > 0)
              .map((party) => (
                <Select.Option key={party.value} value={party.value}>
                  {party.label}
                </Select.Option>
              ))}
          </Select>

          <div style={{ marginTop: "16px", marginBottom: "4px", fontWeight: 600 }}>Include Photo</div>
          <Radio.Group
            value={photoMode}
            onChange={(e) => setPhotoMode(e.target.value)}
            disabled={isIdCardExporting}
          >
            <Radio value="yes">Yes (with photo)</Radio>
            <Radio value="no">No (without photo)</Radio>
            <Radio value="both">Both</Radio>
          </Radio.Group>
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#64748b" }}>
            <b>Yes</b> — only voters <em>with a photo</em> are exported. <b>No</b> — only voters <em>without a photo</em> are exported. <b>Both</b> — all voters exported, photos shown where available (default).
          </div>
          <div style={{ marginTop: "16px", marginBottom: "4px", fontWeight: 600 }}>Card Template</div>
          <Select
            value={cardTemplate}
            onChange={(value) => setCardTemplate(value)}
            style={{ width: "100%" }}
            disabled={isIdCardExporting}
          >
            <Select.Option value="8perpage">8 cards per page — 91mm × 54mm</Select.Option>
            <Select.Option value="10perpage">10 cards per page — 88mm × 58mm</Select.Option>
          </Select>
          <div style={{ marginTop: "6px", marginBottom: "16px", fontSize: "12px", color: "#64748b" }}>
            Choose the card layout and size that matches your print sheet.
          </div>
          <div style={{ marginBottom: "4px", fontWeight: 600 }}>PDF Background Color</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => setBackgroundColor(event.target.value)}
              disabled={isIdCardExporting}
              style={{
                width: "52px",
                height: "40px",
                padding: 0,
                border: "1px solid #d9d9d9",
                borderRadius: "8px",
                backgroundColor: "transparent",
                cursor: isIdCardExporting ? "not-allowed" : "pointer",
              }}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #d9d9d9",
                borderRadius: "8px",
                padding: "9px 12px",
                backgroundColor: "#ffffff",
              }}
            >
              <span style={{ color: "#475569" }}>Selected color</span>
              <span style={{ color: "#0f172a", fontFamily: "monospace", letterSpacing: "0.04em" }}>
                {backgroundColor.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ marginTop: "6px", marginBottom: "16px", fontSize: "12px", color: "#64748b" }}>
            The selected color will be used as the background when the backend renders the voter ID card PDF.
          </div>
          <div style={{ marginBottom: "4px", fontWeight: 600 }}>Photo Updated Date</div>
          <DatePicker.RangePicker
            style={{ width: "100%" }}
            value={[
              photoDateRange[0] ? dayjs(photoDateRange[0]) : null,
              photoDateRange[1] ? dayjs(photoDateRange[1]) : null,
            ]}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setPhotoDateRange([
                  dates[0].startOf("day").toISOString(),
                  dates[1].endOf("day").toISOString(),
                ]);
              } else {
                setPhotoDateRange([null, null]);
              }
            }}
            disabled={isIdCardExporting}
            allowClear
            placeholder={["From date", "To date"]}
          />
          <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
            Filter voters by the date their photo was uploaded. Leave blank to include all.
          </div>

          <div style={{ marginTop: "16px", marginBottom: "4px", fontWeight: 600 }}>Page Background Image (Optional)</div>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
            Upload an image (landscape, ~91×54 mm). Each row in the PDF will show the image on the left and one voter ID card on the right.
          </div>
          {idCardBgImagePreview ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <img
                src={idCardBgImagePreview}
                alt="Preview"
                style={{
                  width: 182,
                  height: 108,
                  objectFit: "contain",
                  background: "#f1f5f9",
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                }}
              />
              <div>
                <div style={{ fontSize: "12px", color: "#475569", marginBottom: 6 }}>
                  {idCardBgImage?.name}
                </div>
                <Button
                  size="small"
                  danger
                  disabled={isIdCardExporting}
                  onClick={() => {
                    setIdCardBgImage(null);
                    setIdCardBgImagePreview(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isIdCardExporting}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setIdCardBgImage(file);
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) =>
                    setIdCardBgImagePreview(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }
                e.target.value = "";
              }}
              style={{ display: "block" }}
            />
          )}
        </div>
      </Modal>

      <Modal
        title="Generate Family Cards"
        open={familyCardModalVisible}
        onCancel={handleCloseFamilyCardModal}
        width={560}
        footer={[
          <Button
            key="cancel"
            onClick={handleCloseFamilyCardModal}
          >
            Cancel
          </Button>,
          <Button
            key="generate"
            type="primary"
            onClick={handleGeneratePartWiseFamilyCards}
            className="hover:!bg-[#1D4ED8] hover:!border-[#1D4ED8]"
            style={{ backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" }}
          >
            Generate
          </Button>,
        ]}
      >
        <div style={{ padding: "10px 0" }}>
          <div style={{ marginBottom: "8px", fontWeight: 600 }}>Select Parts</div>
          <Select
            mode="multiple"
            placeholder="Choose part number(s)"
            value={selectedFamilyCardParts}
            onChange={(values) =>
              setSelectedFamilyCardParts(values.map((value) => Number(value)).sort((a, b) => a - b))
            }
            style={{ width: "100%" }}
            showSearch
            optionFilterProp="children"
            maxTagCount="responsive"
          >
         {availableParts.map((part) => (
  <Select.Option key={part.partNo} value={part.partNo}>
    Part {part.partNo}
  </Select.Option>
))}
          </Select>

          <div style={{ marginTop: "16px", marginBottom: "4px", fontWeight: 600 }}>Include Photo</div>
          <CustomRadioGroup
            value={familyCardPhotoMode}
            onChange={(e) => setFamilyCardPhotoMode(e.target.value)}
          >
            <Radio value="yes">Yes (with photo)</Radio>
            <Radio value="no">No (without photo)</Radio>
            <Radio value="both">Both</Radio>
          </CustomRadioGroup>
                    <div style={{ marginTop: "16px", marginBottom: "4px", fontWeight: 600 }}>Family Type</div>
                        <CustomRadioGroup
  value={familyType} onChange={(e) => setFamilyType(e.target.value)}>
  <Radio value="CROSS_BOOTH">Cross Booth Family</Radio>
  <Radio value="SAME_BOOTH">Same Booth Family</Radio>
  <Radio value="SINGLE_VOTER">1-Voter Family</Radio>
</CustomRadioGroup>
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#64748b" }}>
            <b>Yes</b> — only voters <em>with a photo</em> are exported. <b>No</b> — only voters <em>without a photo</em> are exported. <b>Both</b> — all voters exported, photos shown where available (default).
          </div>
          <div style={{ marginTop: "16px", marginBottom: "4px", fontWeight: 600 }}>Card Template</div>
          <Select
            value={familyCardTemplate}
            onChange={(value) => setFamilyCardTemplate(value)}
            style={{ width: "100%" }}
          >
            <Select.Option value="8perpage">8 cards per page — 91mm × 54mm</Select.Option>
            <Select.Option value="10perpage">10 cards per page — 88mm × 58mm</Select.Option>
          </Select>
          <div style={{ marginTop: "6px", marginBottom: "16px", fontSize: "12px", color: "#64748b" }}>
            Choose the card layout and size that matches your print sheet.
          </div>
          <div style={{ marginBottom: "4px", fontWeight: 600 }}>PDF Background Color</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="color"
              value={familyCardBackgroundColor}
              onChange={(event) => setFamilyCardBackgroundColor(event.target.value)}
              style={{
                width: "52px",
                height: "40px",
                padding: 0,
                border: "1px solid #d9d9d9",
                borderRadius: "8px",
                backgroundColor: "transparent",
                cursor: "pointer",
              }}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #d9d9d9",
                borderRadius: "8px",
                padding: "9px 12px",
                backgroundColor: "#ffffff",
              }}
            >
              <span style={{ color: "#475569" }}>Selected color</span>
              <span style={{ color: "#0f172a", fontFamily: "monospace", letterSpacing: "0.04em" }}>
                {familyCardBackgroundColor.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ marginTop: "6px", marginBottom: "16px", fontSize: "12px", color: "#64748b" }}>
            The selected color will be used as the background when the backend renders the family card PDF.
          </div>
          <div style={{ marginBottom: "4px", fontWeight: 600 }}>Photo Updated Date</div>
          <DatePicker.RangePicker
            style={{ width: "100%" }}
            value={[
              familyCardPhotoDateRange[0] ? dayjs(familyCardPhotoDateRange[0]) : null,
              familyCardPhotoDateRange[1] ? dayjs(familyCardPhotoDateRange[1]) : null,
            ]}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setFamilyCardPhotoDateRange([
                  dates[0].startOf("day").toISOString(),
                  dates[1].endOf("day").toISOString(),
                ]);
              } else {
                setFamilyCardPhotoDateRange([null, null]);
              }
            }}
            allowClear
            placeholder={["From date", "To date"]}
          />
          <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
            Filter voters by the date their photo was uploaded. Leave blank to include all.
          </div>
        </div>
      </Modal>

      <Modal
        title="Generating Unmapped Voter Export"
        open={unmappedProgressModalVisible}
        onCancel={handleCloseUnmappedProgressModal}
        footer={[
          <Button key="jobs" onClick={openFamilyExportJobs}>
            View Export Jobs
          </Button>,
          <Button key="close" type="primary" onClick={handleCloseUnmappedProgressModal}>
            Close
          </Button>,
        ]}
        width={520}
      >
        <div style={{ paddingTop: "8px" }}>
          <Progress
            percent={unmappedExportProgressPercent}
            status={unmappedExportStatus === "FAILED" ? "exception" : "active"}
          />
          <div style={{ marginTop: "10px", color: "#334155", fontSize: "13px" }}>
            {unmappedExportProgressMessage}
          </div>
          <div style={{ marginTop: "8px", color: "#64748b", fontSize: "12px" }}>
            You can close this dialog and reopen it from Family Manager while the export continues.
          </div>
          {unmappedExportJobId && (
            <div style={{ marginTop: "8px", color: "#64748b", fontSize: "12px" }}>
              Job ID: {unmappedExportJobId}
            </div>
          )}
        </div>
      </Modal>

      <FamilyExportJobsModal
        open={familyExportJobsVisible}
        onClose={() => setFamilyExportJobsVisible(false)}
        familyId={UNMAPPED_EXPORT_FAMILY_ID}
        electionId={selectedElectionId ? Number(selectedElectionId) : null}
        accountId={accountId}
      />

      <PdfExcelExportModal
        open={pdfExcelModalVisible}
        onClose={handleClosePdfExcelModal}
        title={pdfExcelModalTitle}
        availableParts={availableParts}
        selectedParts={selectedReportParts}
        onSelectedPartsChange={(parts) => {
          if (pdfExcelModalMode === "one-voter-family") {
            // Only allow one part to be selected
            setSelectedReportParts(parts.length > 0 ? [parts[parts.length - 1]] : []);
          } else {
            setSelectedReportParts(parts);
          }
        }}
        allowAllParts={reportAllowAllParts && pdfExcelModalMode !== "one-voter-family"}
        allPartsSelected={allReportPartsSelected}
        onAllPartsChange={setAllReportPartsSelected}
        loadingParts={loadingReportParts}
        loadingSchemes={loadingReportSchemes}
        loadingFormat={reportExportLoadingFormat}
        pdfColumns={reportPdfColumns}
        onPdfColumnsChange={
          pdfExcelModalMode === "scheme" || pdfExcelModalMode === "voter-tick-sheet"
            ? undefined
            : setReportPdfColumns
        }
        availableSchemes={reportSchemes}
        selectedSchemeId={selectedReportSchemeId}
        onSelectedSchemeChange={
          pdfExcelModalMode === "scheme" ? setSelectedReportSchemeId : undefined
        }
        allowPdfExport={pdfExcelModalMode !== "scheme"}
        allowExcelExport={pdfExcelModalMode !== "voter-tick-sheet"}
        allowWordExport={pdfExcelModalMode === "voter-tick-sheet"}
        onExportPdf={() => {
          if (pdfExcelModalMode === "voter-tick-sheet") {
            void handleVoterTickSheetExport("pdf");
          } else if (pdfExcelModalMode === "one-voter-family") {
            void handleOneVoterFamilyExport("pdf");
          } else if (pdfExcelModalMode === "scheme") {
            // Scheme mode handled differently
          } else {
            void handleReportExport("pdf");
          }
        }}
        onExportExcel={() => {
          if (pdfExcelModalMode === "one-voter-family") {
            void handleOneVoterFamilyExport("excel");
          } else {
            void handleReportExport("excel");
          }
        }}
        onExportWord={() => {
          if (pdfExcelModalMode === "voter-tick-sheet") {
            void handleVoterTickSheetExport("word");
          }
        }}
      />

      <SchemeExportModal
        open={schemeExportModalVisible}
        onClose={() => setSchemeExportModalVisible(false)}
        schemes={benefitSchemesList}
        loading={loadingSchemes}
        onExport={async (schemeNames) => {
          if (!selectedElectionId) {
            message.error("Election not selected");
            return;
          }
          try {
            const partsResponse = await getPartsApi(Number(selectedElectionId));
            const responseData = partsResponse.data;
            const partsArray = Array.isArray(responseData)
              ? responseData
              : (responseData && typeof responseData === "object" && Array.isArray(responseData.data)
                ? responseData.data
                : []);

            const partNumbers = partsArray
              .map((part: any) => Number(part?.partNo || part?.partNumber))
              .filter((partNo: number) => !isNaN(partNo) && partNo > 0)
              .sort((a: number, b: number) => a - b);

            const uniquePartNumbers = [...new Set(partNumbers)];

            if (!uniquePartNumbers.length) {
              message.warning("No parts found for this election.");
              return;
            }

            showExportModal(
              "voter",
              Number(selectedElectionId),
              uniquePartNumbers,
              accountId || undefined,
              { scheme: schemeNames },
              {
                hideFilterCheckbox: true,
              }
            );
          } catch (error) {
            console.error("Failed to trigger scheme export:", error);
            message.error("Failed to trigger scheme export");
          }
        }}
      />

      <GenerateFamilySlipModal
        open={familySlipModalVisible}
        onClose={() => setFamilySlipModalVisible(false)}
        availableParts={availableParts}
        onGenerate={handleGenerateFamilySlip}
        loading={isGeneratingFamilySlip}
      />
    </div>
  );
};

export default Reports;
