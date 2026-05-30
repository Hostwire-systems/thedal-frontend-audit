import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import {
  Button,
  Checkbox,
  Modal,
  notification,
  Select,
  Space,
  Tag,
  Collapse,
  Row,
  Col,
} from "antd";
import { BASE_URL } from "../config";
import { DownloadOutlined } from "@ant-design/icons";
import {
  initializeDuplicateExport,
  checkDuplicateExportStatus,
} from "../api/duplicateVoterApi";
import {
  createVoterIdCardExportJob,
  getVoterIdCardExportJobStatus,
  downloadVoterIdCardExportJob,
  VoterIdCardExportRequest,
  VoterIdCardExportStatusResponse,
} from "../api/voterIdCardExportApi";
import {
  createFamilyIdCardExportJob,
  getFamilyIdCardExportJobStatus,
  downloadFamilyIdCardExportJob,
  FamilyIdCardExportRequest,
  FamilyIdCardExportStatusResponse,
} from "../api/familyIdCardExportApi";
import { VoterFilters } from "../types/voterFilter";
import {
  VOTER_EXPORT_COLUMNS,
  COLUMN_CATEGORIES,
  getColumnsByCategory,
  getAllColumnIds,
  getDefaultColumns,
} from "../types/voterExportColumns";
import { Progress, Spin, message, Typography } from "antd";
import { LoadingOutlined, CloseOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import PdfExcelExportModal from "../components/PdfExcelExportModal/PdfExcelExportModal";
import ExportProgressModal from "../components/ExportProgressModal";

const { Panel } = Collapse;
const { Text } = Typography;

type ExportType = "voter" | "cadre" | "duplicate";

interface ExportModalOptions {
  presetColumns?: string[];
  lockColumns?: boolean;
  defaultPartSelection?: (number | "all")[];
  hideFilterCheckbox?: boolean;
}

interface PdfExcelExportOptions {
  title: string;
  filters?: VoterFilters;
  mode?: "standard" | "scheme";
  allowAllParts?: boolean;
  allowPdfExport?: boolean;
  showColumnSelection?: boolean;
  lockColumns?: boolean;
  presetColumns?: string[];
}

interface ExportContextType {
  exportJobId: number | null;
  isExportInProgress: boolean;
  isIdCardExporting: boolean;
  idCardExportProgress: VoterIdCardExportStatusResponse | FamilyIdCardExportStatusResponse | null;
  idCardExportType: "voter" | "family" | null;
  showExportModal: (
    type: ExportType,
    electionId: number,
    boothNumbers: number[],
    accountId?: number,
    filters?: VoterFilters,
    options?: ExportModalOptions
  ) => void;
  showPdfExcelExportModal: (
    electionId: number,
    boothNumbers: number[],
    options: PdfExcelExportOptions
  ) => void;
  startIdCardExport: (request: VoterIdCardExportRequest, backgroundImage?: File | null) => Promise<void>;
  startFamilyIdCardExport: (request: FamilyIdCardExportRequest) => Promise<void>;
}

type ExportContextGlobal = typeof globalThis & {
  __thedalExportContext__?: React.Context<ExportContextType | undefined>;
};

const exportContextGlobal = globalThis as ExportContextGlobal;

const getDocumentVisibility = () =>
  typeof document === "undefined" || document.visibilityState === "visible";

const ExportContext =
  exportContextGlobal.__thedalExportContext__ ??
  createContext<ExportContextType | undefined>(undefined);

exportContextGlobal.__thedalExportContext__ = ExportContext;

export const ExportProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [exportJobId, setExportJobId] = useState<number | null>(() => {
    const storedJobId = localStorage.getItem("exportJobId");
    return storedJobId ? parseInt(storedJobId, 10) : null;
  });

  const [exportType, setExportType] = useState<ExportType>("voter");
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedPartNos, setSelectedPartNos] = useState<(number | "all")[]>(
    []
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [currentElectionId, setCurrentElectionId] = useState<number | null>(
    null
  );
  const [availableBoothNumbers, setAvailableBoothNumbers] = useState<number[]>(
    []
  );
  const [includeFilters, setIncludeFilters] = useState<boolean>(true); 
  const [exportFilters, setExportFilters] = useState<VoterFilters>({}); // Store filters
  const [accountId, setAccountId] = useState<number | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]); // Selected columns for export
  const [selectAllColumns, setSelectAllColumns] = useState<boolean>(true); // Select all columns by default
  const [isExportInProgress, setIsExportInProgress] = useState<boolean>(false); // Track if export is in progress
  const [lockColumns, setLockColumns] = useState<boolean>(false);
  const [hideFilterCheckbox, setHideFilterCheckbox] = useState<boolean>(false);

  // PdfExcelExportModal states
  const [isPdfExcelModalVisible, setIsPdfExcelModalVisible] = useState(false);
  const [pdfExcelTitle, setPdfExcelTitle] = useState("");
  const [pdfExcelFilters, setPdfExcelFilters] = useState<VoterFilters>({});
  const [pdfExcelMode, setPdfExcelMode] = useState<"standard" | "scheme">("standard");
  const [pdfExcelAllowAllParts, setPdfExcelAllowAllParts] = useState(false);
  const [pdfExcelAllPartsSelected, setPdfExcelAllPartsSelected] = useState(false);
  const [pdfExcelSelectedParts, setPdfExcelSelectedParts] = useState<number[]>([]);
  const [pdfExcelPdfColumns, setPdfExcelPdfColumns] = useState<2 | 3>(2);
  const [pdfExcelSelectedSchemeId, setPdfExcelSelectedSchemeId] = useState<number | null>(null);
  const [pdfExcelLoadingFormat, setPdfExcelLoadingFormat] = useState<"pdf" | "excel" | "word" | null>(null);
  const [pdfExcelAllowPdfExport, setPdfExcelAllowPdfExport] = useState(true);
  const [pdfExcelShowColumnSelection, setPdfExcelShowColumnSelection] = useState(false);
  const [pdfExcelLockColumns, setPdfExcelLockColumns] = useState(false);
  const [pdfExcelSelectedColumns, setPdfExcelSelectedColumns] = useState<string[]>([]);
  const [pdfExcelSelectAllColumns, setPdfExcelSelectAllColumns] = useState(true);
  const [pdfExcelIncludeFilters, setPdfExcelIncludeFilters] = useState(true);

  // ExportProgressModal states
const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
const [progressFormat, setProgressFormat] = useState<"pdf"|"excel"|null>(null);
const [progressStatus, setProgressStatus] = useState<"preparing"|"processing"|"downloading"|"completed"|"failed">("preparing");
const [progressPercent, setProgressPercent] = useState(0);

  const fakeProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopFakeProgress = useCallback(() => {
    if (fakeProgressIntervalRef.current) {
      clearInterval(fakeProgressIntervalRef.current);
      fakeProgressIntervalRef.current = null;
    }
  }, []);

  const startFakeProgress = useCallback(() => {
    stopFakeProgress();
    setProgressPercent(5); // Start at ~5%

    fakeProgressIntervalRef.current = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 90) {
          stopFakeProgress();
          return 90;
        }
        // Increment slows down as it approaches 90
        const remaining = 90 - prev;
        const increment = Math.max(0.2, remaining * 0.03); // Fast at start, slow at end
        return Math.min(90, prev + increment);
      });
    }, 400);
  }, [stopFakeProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fakeProgressIntervalRef.current) clearInterval(fakeProgressIntervalRef.current);
    };
  }, []);

  // Voter/Family ID card export states
  const [idCardExportJobId, setIdCardExportJobId] = useState<string | null>(() => {
    return localStorage.getItem("idCardExportJobId");
  });
  const [idCardExportType, setIdCardExportType] = useState<"voter" | "family" | null>(() => {
    return localStorage.getItem("idCardExportType") as "voter" | "family" | null;
  });
  const [isIdCardExporting, setIsIdCardExporting] = useState<boolean>(false);
  const [isIdCardDownloading, setIsIdCardDownloading] = useState<boolean>(false);
  const [idCardExportProgress, setIdCardExportProgress] = useState<VoterIdCardExportStatusResponse | FamilyIdCardExportStatusResponse | null>(null);
  const [isIdCardProgressVisible, setIsIdCardProgressVisible] = useState<boolean>(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState<boolean>(getDocumentVisibility);
  const exportStatusRequestInFlightRef = useRef(false);
  const idCardStatusRequestInFlightRef = useRef(false);
  const idCardDownloadInFlightRef = useRef(false);

  const resetIdCardExportState = () => {
    idCardStatusRequestInFlightRef.current = false;
    idCardDownloadInFlightRef.current = false;
    setIdCardExportJobId(null);
    setIdCardExportType(null);
    setIsIdCardExporting(false);
    setIsIdCardDownloading(false);
    setIdCardExportProgress(null);
    localStorage.removeItem("idCardExportJobId");
    localStorage.removeItem("idCardExportType");
  };

  const getjwtToken = async () => localStorage.getItem("jwtToken");

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(getDocumentVisibility());
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const startIdCardExport = async (request: VoterIdCardExportRequest, backgroundImage?: File | null) => {
    try {
      setIsIdCardExporting(true);
      setIsIdCardDownloading(false);
      setIdCardExportProgress(null);
      setIsIdCardProgressVisible(true);
      setIdCardExportType("voter");
      localStorage.setItem("idCardExportType", "voter");

      const response = await createVoterIdCardExportJob(request, backgroundImage);
      const job = response?.data;

      if (job?.jobId) {
        setIdCardExportJobId(job.jobId);
        setIdCardExportProgress(job);
        localStorage.setItem("idCardExportJobId", job.jobId);
        notification.info({
          message: "ID Card Generation Started",
          description: "Voter ID cards are being generated. You will be notified when the download is ready.",
        });
      }
    } catch (error) {
      setIsIdCardExporting(false);
      setIdCardExportType(null);
      localStorage.removeItem("idCardExportType");
      console.error("Failed to start ID card export:", error);
    }
  };

  const startFamilyIdCardExport = async (request: FamilyIdCardExportRequest) => {
    try {
      setIsIdCardExporting(true);
      setIsIdCardDownloading(false);
      setIdCardExportProgress(null);
      setIsIdCardProgressVisible(true);
      setIdCardExportType("family");
      localStorage.setItem("idCardExportType", "family");

      const response = await createFamilyIdCardExportJob(request);
      const job = response?.data;

      if (job?.jobId) {
        setIdCardExportJobId(job.jobId);
        setIdCardExportProgress(job);
        localStorage.setItem("idCardExportJobId", job.jobId);
        notification.info({
          message: "Family ID Card Generation Started",
          description: "Family ID cards are being generated. You will be notified when the download is ready.",
        });
      }
    } catch (error) {
      setIsIdCardExporting(false);
      setIdCardExportType(null);
      localStorage.removeItem("idCardExportType");
      console.error("Failed to start family ID card export:", error);
    }
  };

  const checkIdCardExportStatus = useCallback(async (jobId: string) => {
    if (idCardStatusRequestInFlightRef.current || idCardDownloadInFlightRef.current || !idCardExportType) {
      return;
    }

    idCardStatusRequestInFlightRef.current = true;

    try {
      const response = idCardExportType === "voter" 
        ? await getVoterIdCardExportJobStatus(jobId)
        : await getFamilyIdCardExportJobStatus(jobId);
      
      const job = response.data;

      if (!job) {
        throw new Error("ID card export job not found");
      }

      setIdCardExportProgress(job);

      if (job.status === "COMPLETED") {
        idCardDownloadInFlightRef.current = true;
        setIdCardExportJobId(null);
        localStorage.removeItem("idCardExportJobId");
        setIsIdCardDownloading(true);

        if (idCardExportType === "voter") {
          await downloadVoterIdCardExportJob(jobId);
        } else {
          await downloadFamilyIdCardExportJob(jobId);
        }

        notification.success({
          message: "ID Card Generation Completed",
          description: `${idCardExportType === "voter" ? "Voter" : "Family"} ID cards have been generated and downloaded successfully (${job.totalVoters || 0} cards). The file is also available in Settings -> Downloads for 24 hours.`,
        });

        resetIdCardExportState();
      } else if (job.status === "FAILED") {
        notification.error({
          message: "ID Card Generation Failed",
          description: `${job.errorMessage || `Failed to generate ${idCardExportType === "voter" ? "voter" : "family"} ID cards. Please try again.`} The job entry will remain visible in Settings -> Downloads for a limited time.`,
        });
        resetIdCardExportState();
      }
    } catch (error) {
      console.error("Failed to check ID card export status:", error);
      if (idCardDownloadInFlightRef.current) {
        notification.error({
          message: "ID Card Download Failed",
          description: "The PDF was generated, but the automatic download did not complete. You can download it from Settings -> Downloads.",
        });
        resetIdCardExportState();
      }
    } finally {
      idCardStatusRequestInFlightRef.current = false;
    }
  }, [idCardExportType]);

  const showPdfExcelExportModal = (
    electionId: number,
    boothNumbers: number[],
    options: PdfExcelExportOptions
  ) => {
    setCurrentElectionId(electionId);
    setAvailableBoothNumbers(boothNumbers);
    setPdfExcelTitle(options.title);
    setPdfExcelFilters(options.filters || {});
    setPdfExcelMode(options.mode || "standard");
    setPdfExcelAllowAllParts(options.allowAllParts ?? true);
    setPdfExcelAllowPdfExport(options.allowPdfExport ?? true);
    setPdfExcelAllPartsSelected(false);
    setPdfExcelSelectedParts([]);
    setPdfExcelPdfColumns(2);
    setPdfExcelSelectedSchemeId(null);

    // Initialize column selection and filters
    setPdfExcelShowColumnSelection(!!options.showColumnSelection);
    setPdfExcelLockColumns(!!options.lockColumns);
    setPdfExcelIncludeFilters(true);

    if (options.presetColumns && options.presetColumns.length > 0) {
      setPdfExcelSelectAllColumns(false);
      setPdfExcelSelectedColumns(Array.from(new Set(options.presetColumns)));
    } else {
      setPdfExcelSelectAllColumns(true);
      setPdfExcelSelectedColumns([]);
    }

    setIsPdfExcelModalVisible(true);
  };

  const triggerFileDownload = (blob: Blob, fileName: string) => {
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
  };

  const handlePdfExcelExport = async (format: "pdf" | "excel") => {
    if (!currentElectionId) {
      message.error("Election not selected");
      return;
    }

    if (!pdfExcelAllPartsSelected && !pdfExcelSelectedParts.length) {
      message.warning("Please select at least one part number.");
      return;
    }

    // Initialize progress UI immediately
    setIsPdfExcelModalVisible(false);
    setProgressFormat(format);
    setProgressStatus("preparing");
    setProgressPercent(5);
    setIsProgressModalVisible(true);

    // Start background fake progress
    startFakeProgress();

    try {
      setPdfExcelLoadingFormat(format);
      const jwtToken = localStorage.getItem("jwtToken");
      const params: Record<string, string | number | boolean> = {
        directDownload: true,
        format: format.toUpperCase(),
        columns: "ALL",
      };

      if (pdfExcelAllPartsSelected) {
        params["booth-number"] = "all";
      } else {
        params["booth-number"] = pdfExcelSelectedParts.join(",");
      }

      if (format === "pdf") {
        params.pdfColumns = pdfExcelPdfColumns;
        params.pdfTitle = pdfExcelTitle;
      }

      if (pdfExcelMode === "scheme" && pdfExcelSelectedSchemeId) {
        params.schemeId = pdfExcelSelectedSchemeId;
      }

      // Add columns parameter
      if (pdfExcelShowColumnSelection) {
        if (pdfExcelSelectAllColumns) {
          params["columns"] = "ALL";
        } else if (pdfExcelSelectedColumns.length > 0) {
          params["columns"] = pdfExcelSelectedColumns.join(",");
        } else {
          params["columns"] = getDefaultColumns().join(",");
        }
      } else {
        params["columns"] = "ALL";
      }

      // Apply filters
      if (pdfExcelIncludeFilters) {
        const filterMappings: Record<string, keyof VoterFilters> = {
          gender: "gender",
          minAge: "minAge",
          maxAge: "maxAge",
          includeUnknownAge: "includeUnknownAge",
          religion: "religion",
          casteName: "casteName",
          subCaste: "subcaste",
          casteCategoryName: "casteCategoryName",
          party: "party",
          voterHistoryName: "voterHistoryName",
          catagoryDescription: "categoryDescription",
          search: "search",
          "epic-number": "voterId",
          "serial-no": "serial_number",
          voterFnameEn: "voterFnameEn",
          voterLnameEn: "voterLnameEn",
          relationFirstNameEn: "relationFirstNameEn",
          relationLastNameEn: "relationLastNameEn",
          schemeId: "schemeId",
          sortBy: "sortBy",
          order: "order",
          pollStatus: "pollStatus",
          hasMobileNo: "hasMobileNo",
          hasWhatsappNo: "hasWhatsappNo",
          addressed: "addressed",
        };

        Object.entries(filterMappings).forEach(([paramKey, filterKey]) => {
          const value = pdfExcelFilters[filterKey];
          if (value !== undefined && value !== null && value !== "") {
            if (Array.isArray(value)) {
              params[paramKey] = value.join(",");
            } else {
              params[paramKey] = value.toString();
            }
          }
        });
      }

      // Switch status to processing before API call
      setProgressStatus("processing");

      const response = await axios.post(
        `${BASE_URL}/api/v1/voters/${currentElectionId}/export`,
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

      // API Resolved: Stop fake progress and jump to 95%
      stopFakeProgress();
      setProgressStatus("downloading");
      setProgressPercent(95);

      const safeTitle =
        pdfExcelTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "export";
      const partLabel = pdfExcelAllPartsSelected ? "all-parts" : pdfExcelSelectedParts.join("-");
      const fallbackFileName = `${safeTitle}-${partLabel}.${
        format === "pdf" ? "pdf" : "xlsx"
      }`;
      
      const contentDisposition = response.headers["content-disposition"];
      let fileName = fallbackFileName;
      if (contentDisposition) {
        const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (encodedMatch?.[1]) {
          try {
            fileName = decodeURIComponent(encodedMatch[1]);
          } catch {
            fileName = encodedMatch[1];
          }
        } else {
          const standardMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
          fileName = standardMatch?.[1] || fallbackFileName;
        }
      }

      triggerFileDownload(response.data, fileName);
      
      setProgressStatus("completed");
      setProgressPercent(100);
      message.success(
        `${format === "pdf" ? "PDF" : "Excel"} export downloaded successfully.`
      );
    } catch (error) {
      console.error(`Failed to download ${format.toUpperCase()} export:`, error);
      stopFakeProgress();
      setProgressStatus("failed");
      message.error(`Failed to download ${format.toUpperCase()} export.`);
    } finally {
      setPdfExcelLoadingFormat(null);
    }
  };

  const showExportModal = (
    type: ExportType,
    electionId: number,
    boothNumbers: number[],
    accId?: number,
    filters?: VoterFilters,
    options?: ExportModalOptions
  ) => {
    if (boothNumbers.length === 0 && type !== "duplicate") {
      notification.warning({
        message: "No Booth Numbers Available",
        description: "There are no booth numbers available for export.",
      });
      return;
    }

    setExportType(type);
    setCurrentElectionId(electionId);
    setAvailableBoothNumbers(boothNumbers);
    setIsExportModalVisible(true);
    setSelectedPartNos(options?.defaultPartSelection || []);
    setHideFilterCheckbox(!!options?.hideFilterCheckbox);
    if (accId) setAccountId(accId);

    // Store filters if provided
    if (filters) {
      setExportFilters(filters);
      // If we hide the checkbox, we should probably default to including the filters
      if (options?.hideFilterCheckbox) {
        setIncludeFilters(true);
      }
    } else {
      setExportFilters({});
    }

    // Reset column selection to "Select All" by default or preset values
    if (type === "voter" && options?.presetColumns && options.presetColumns.length > 0) {
      setSelectAllColumns(false);
      setSelectedColumns(Array.from(new Set(options.presetColumns)));
      setLockColumns(!!options.lockColumns);
    } else {
      setSelectAllColumns(true);
      setSelectedColumns([]);
      setLockColumns(false);
    }
  };

  const handlePartSelectionChange = (value: (number | "all")[]) => {
    if (value.includes("all")) {
      setSelectedPartNos(["all"]);
    } else {
      setSelectedPartNos(value);
    }
  };

  const handleSelectAllColumnsChange = (checked: boolean) => {
    setSelectAllColumns(checked);
    if (checked) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(getDefaultColumns());
    }
  };

  const handleColumnSelection = (columnId: string, checked: boolean) => {
    if (checked) {
      setSelectedColumns([...selectedColumns, columnId]);
    } else {
      setSelectedColumns(selectedColumns.filter((id) => id !== columnId));
    }
  };

  const handleCategorySelection = (category: string, checked: boolean) => {
    const categoryColumns = getColumnsByCategory(category).map((col) => col.id);
    if (checked) {
      const newColumns = [...new Set([...selectedColumns, ...categoryColumns])];
      setSelectedColumns(newColumns);
    } else {
      setSelectedColumns(
        selectedColumns.filter((id) => !categoryColumns.includes(id))
      );
    }
  };

  const isCategorySelected = (category: string): boolean => {
    const categoryColumns = getColumnsByCategory(category).map((col) => col.id);
    return categoryColumns.every((colId) => selectedColumns.includes(colId));
  };

  const isCategoryIndeterminate = (category: string): boolean => {
    const categoryColumns = getColumnsByCategory(category).map((col) => col.id);
    const selectedCount = categoryColumns.filter((colId) =>
      selectedColumns.includes(colId)
    ).length;
    return selectedCount > 0 && selectedCount < categoryColumns.length;
  };

  const handlePdfExcelSelectAllColumnsChange = (checked: boolean) => {
    setPdfExcelSelectAllColumns(checked);
    if (checked) {
      setPdfExcelSelectedColumns([]);
    } else {
      setPdfExcelSelectedColumns(getDefaultColumns());
    }
  };

  const handlePdfExcelColumnSelection = (columnId: string, checked: boolean) => {
    if (checked) {
      setPdfExcelSelectedColumns([...pdfExcelSelectedColumns, columnId]);
    } else {
      setPdfExcelSelectedColumns(pdfExcelSelectedColumns.filter((id) => id !== columnId));
    }
  };

  const handlePdfExcelCategorySelection = (category: string, checked: boolean) => {
    const categoryColumns = getColumnsByCategory(category).map((col) => col.id);
    if (checked) {
      const newColumns = [...new Set([...pdfExcelSelectedColumns, ...categoryColumns])];
      setPdfExcelSelectedColumns(newColumns);
    } else {
      setPdfExcelSelectedColumns(
        pdfExcelSelectedColumns.filter((id) => !categoryColumns.includes(id))
      );
    }
  };

  const isPdfExcelCategorySelected = (category: string): boolean => {
    const categoryColumns = getColumnsByCategory(category).map((col) => col.id);
    return categoryColumns.every((colId) => pdfExcelSelectedColumns.includes(colId));
  };

  const isPdfExcelCategoryIndeterminate = (category: string): boolean => {
    const categoryColumns = getColumnsByCategory(category).map((col) => col.id);
    const selectedCount = categoryColumns.filter((colId) =>
      pdfExcelSelectedColumns.includes(colId)
    ).length;
    return selectedCount > 0 && selectedCount < categoryColumns.length;
  };

  const handleExport = async () => {
    if (!currentElectionId || selectedPartNos.length === 0) {
      notification.warning({
        message: "Selection Required",
        description: "Please select a part number to export.",
      });
      return;
    }

    try {
      const jwtToken = await getjwtToken();
      setIsExporting(true);

      const isAllParts = selectedPartNos.includes("all");
      let jobId: number | undefined;

      if (exportType === "duplicate") {
        if (!accountId)
          throw new Error("Account ID is required for duplicate export");

        const response = await initializeDuplicateExport(
          currentElectionId,
          accountId,
          isAllParts ? ["all"] : selectedPartNos.map(String)
        );
        jobId = response?.data?.id;
      } else {
        // Create params object
        const params: Record<string, string> = {};

        // Add part/booth numbers
        if (!isAllParts) {
          const paramKey =
            exportType === "voter" ? "booth-number" : "assignedBooths";
          params[paramKey] = selectedPartNos
            .filter((no) => typeof no === "number")
            .join(",");
        }

        // Add columns parameter for voter export
        if (exportType === "voter") {
          if (selectAllColumns) {
            params["columns"] = "ALL";
          } else if (selectedColumns.length > 0) {
            params["columns"] = selectedColumns.join(",");
          } else {
            // If no columns selected but not "all", use default columns
            params["columns"] = getDefaultColumns().join(",");
          }
        }

        // Add filters for voter export
        if (exportType === "voter" && includeFilters && exportFilters) {
          const filterMappings: Record<string, keyof VoterFilters> = {
            gender: "gender",
            minAge: "minAge",
            maxAge: "maxAge",
            includeUnknownAge: "includeUnknownAge",
            religion: "religion",
            casteName: "casteName",
            subCaste: "subcaste",
            casteCategoryName: "casteCategoryName",
            party: "party",
            voterHistoryName: "voterHistoryName",
            catagoryDescription: "categoryDescription",
            search: "search",
            "epic-number": "voterId",
            "serial-no": "serial_number",
            voterFnameEn: "voterFnameEn",
            voterLnameEn: "voterLnameEn",
            relationFirstNameEn: "relationFirstNameEn",
            relationLastNameEn: "relationLastNameEn",
            schemeId: "schemeId",
            sortBy: "sortBy",
            order: "order",
            pollStatus: "pollStatus",
            hasMobileNo: "hasMobileNo",
            hasWhatsappNo: "hasWhatsappNo",
            addressed: "addressed",
          };

          Object.entries(filterMappings).forEach(([paramKey, filterKey]) => {
            const value = exportFilters[filterKey];
            if (value !== undefined && value !== null && value !== "") {
              if (Array.isArray(value)) {
                params[paramKey] = value.join(",");
              } else {
                params[paramKey] = value.toString();
              }
            }
          });
        }

        // Log the params before making the request
        console.log("Export API Parameters:", params);
        console.log("Export Type:", exportType);
        console.log(
          "Endpoint:",
          exportType === "voter"
            ? `/api/v1/voters/${currentElectionId}/export`
            : `/volunteers/${currentElectionId}/export`
        );

        const endpoint =
          exportType === "voter"
            ? `/api/v1/voters/${currentElectionId}/export`
            : `/volunteers/${currentElectionId}/export`;

        const response = await axios.post(
          `${BASE_URL}${endpoint}`,
          {},
          {
            headers: { accept: "*/*", Authorization: `Bearer ${jwtToken}` },
            params: params,
          }
        );

        jobId = response.data?.data?.jobId;
      }

      if (jobId) {
        setExportJobId(jobId);
        setIsExportInProgress(true);
        localStorage.setItem("exportJobId", jobId.toString());

        const typeLabel =
          exportType === "voter"
            ? "Voter"
            : exportType === "cadre"
            ? "Cadre"
            : "Duplicate";
        notification.info({
          message: `${typeLabel} Export Initiated`,
          description: isAllParts ? (
            <span>
              {exportType} export for <Tag color="blue">All Parts</Tag> has
              started.
            </span>
          ) : (
            <span>
              {exportType} export for{" "}
              <Space size={[0, 8]} wrap>
                {selectedPartNos.map((part,idx) => (
                  <span>

                  <Tag key={part} color="blue">
                    {part}
                  </Tag>
                  {idx<selectedPartNos.length-1 && ","}
                  </span>
                ))}
              </Space>
              has started.
            </span>
          ),
        });
      }
    } catch (error) {
      console.error("Failed to initiate export:", error);
      notification.error({
        message: "Export Failed",
        description: "Failed to initiate export. Please try again.",
      });
    } finally {
      setSelectedPartNos([]);
      setIsExporting(false);
      setIsExportModalVisible(false);
      setExportFilters({});
      setSelectedColumns([]);
      setSelectAllColumns(true);
      setLockColumns(false);
    }
  };

  const checkExportStatus = useCallback(async (jobId: number) => {
    if (exportStatusRequestInFlightRef.current) {
      return;
    }

    exportStatusRequestInFlightRef.current = true;

    try {
      const jwtToken = await getjwtToken();

      let status: string | undefined;
      let downloadUrl: string | undefined;

      if (exportType === "duplicate") {
        if (!accountId) return;
        const res = await checkDuplicateExportStatus(
          currentElectionId!,
          Number(accountId),
          jobId
        );
        status = res.data?.status;
        downloadUrl = res.data?.s3Url;
      } else {
        const endpoint =
          exportType === "voter"
            ? `/api/v1/voters/export/status/${jobId}`
            : `/volunteers/${currentElectionId}/export/status/${jobId}`;

        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${jwtToken}`,
          },
        });

        status = response.data.data.status;
        downloadUrl =
          exportType === "voter"
            ? response.data.data.awsS3DownloadUrl
            : response.data.data.download_url;
      }

      if (status === "COMPLETED" && downloadUrl) {
        const resolvedDownloadUrl =
          /^https?:\/\//i.test(downloadUrl) || downloadUrl.startsWith("blob:")
            ? downloadUrl
            : `${BASE_URL}${downloadUrl.startsWith("/") ? "" : "/"}${downloadUrl}`;

        const handleDownload = () => {
          const opened = window.open(
            resolvedDownloadUrl,
            "_blank",
            "noopener,noreferrer"
          );

          if (!opened) {
            const link = document.createElement("a");
            link.href = resolvedDownloadUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        };
        const typeLabel =
          exportType === "voter"
            ? "Voter"
            : exportType === "cadre"
            ? "Cadre"
            : "Duplicate";

        notification.success({
          message: (
            <Space align="center">
              <span>Export Completed</span>
              <Tag
                color={
                  exportType === "voter"
                    ? "blue"
                    : exportType === "cadre"
                    ? "green"
                    : "orange"
                }
              >
                {typeLabel}
              </Tag>
            </Space>
          ),
          description:
            "Your export is ready. Click the button below to download the file.",
          btn: (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              Download File
            </Button>
          ),
          duration: 0, // stays until user closes
        });

        setExportJobId(null);
        setIsExportInProgress(false);
        localStorage.removeItem("exportJobId");
      }
    } catch (error) {
      console.error("Failed to check export status:", error);
    } finally {
      exportStatusRequestInFlightRef.current = false;
    }
  }, [accountId, currentElectionId, exportType]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (exportJobId) {
      void checkExportStatus(exportJobId);
      const pollingIntervalMs = isDocumentVisible ? 10000 : 30000;
      interval = setInterval(() => checkExportStatus(exportJobId), pollingIntervalMs);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkExportStatus, exportJobId, isDocumentVisible]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (idCardExportJobId) {
      setIsIdCardExporting(true);
      void checkIdCardExportStatus(idCardExportJobId);
      const pollingIntervalMs = isDocumentVisible ? 8000 : 20000;
      interval = setInterval(() => checkIdCardExportStatus(idCardExportJobId), pollingIntervalMs);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkIdCardExportStatus, idCardExportJobId, isDocumentVisible]);

  return (
    <>
      <ExportContext.Provider
        value={{
          exportJobId,
          isExportInProgress,
          isIdCardExporting,
          idCardExportProgress,
          idCardExportType,
          showExportModal,
          showPdfExcelExportModal,
          startIdCardExport,
          startFamilyIdCardExport,
        }}
      >
        {children}
        <PdfExcelExportModal
          open={isPdfExcelModalVisible}
          onClose={() => setIsPdfExcelModalVisible(false)}
          title={pdfExcelTitle}
          availableParts={availableBoothNumbers}
          selectedParts={pdfExcelSelectedParts}
          onSelectedPartsChange={setPdfExcelSelectedParts}
          allowAllParts={pdfExcelAllowAllParts}
          allPartsSelected={pdfExcelAllPartsSelected}
          onAllPartsChange={setPdfExcelAllPartsSelected}
          loadingFormat={pdfExcelLoadingFormat}
          pdfColumns={pdfExcelPdfColumns}
          onPdfColumnsChange={setPdfExcelPdfColumns}
          onExportPdf={() => handlePdfExcelExport("pdf")}
          onExportExcel={() => handlePdfExcelExport("excel")}
          allowPdfExport={pdfExcelAllowPdfExport}
          selectedSchemeId={pdfExcelSelectedSchemeId}
          onSelectedSchemeChange={setPdfExcelSelectedSchemeId}
          // Column selection
          showColumnSelection={pdfExcelShowColumnSelection}
          selectedColumns={pdfExcelSelectedColumns}
          onSelectedColumnsChange={handlePdfExcelColumnSelection}
          selectAllColumns={pdfExcelSelectAllColumns}
          onSelectAllColumnsChange={handlePdfExcelSelectAllColumnsChange}
          lockColumns={pdfExcelLockColumns}
          columnCategories={COLUMN_CATEGORIES}
          getColumnsByCategory={getColumnsByCategory}
          isCategorySelected={isPdfExcelCategorySelected}
          isCategoryIndeterminate={isPdfExcelCategoryIndeterminate}
          onCategorySelection={handlePdfExcelCategorySelection}
          // Filters
          showFilterCheckbox={pdfExcelShowColumnSelection} // Only show if we're doing the advanced voter export
          includeFilters={pdfExcelIncludeFilters}
          onIncludeFiltersChange={setPdfExcelIncludeFilters}
        />
        <ExportProgressModal
          open={isProgressModalVisible}
          format={progressFormat}
          title={pdfExcelTitle}
          status={progressStatus}
          percent={progressPercent}
          onClose={() => setIsProgressModalVisible(false)}
        />
        {isIdCardExporting && idCardExportProgress && isIdCardProgressVisible && (
          <div
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              width: 340,
              zIndex: 9999,
              backgroundColor: "#fff",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isIdCardDownloading || idCardExportProgress.status === "RUNNING" ? (
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
                ) : idCardExportProgress.status === "COMPLETED" ? (
                  <CheckCircleOutlined style={{ color: "#22c55e", fontSize: 16 }} />
                ) : (
                  <ExclamationCircleOutlined style={{ color: "#ef4444", fontSize: 16 }} />
                )}
                <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>
                  {idCardExportType === "voter" ? "Voter" : "Family"} ID Card Generation
                </span>
              </div>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined style={{ fontSize: 14, color: "#64748b" }} />}
                onClick={() => setIsIdCardProgressVisible(false)}
                className="flex items-center justify-center hover:bg-gray-200 rounded-full"
              />
            </div>
            <div style={{ padding: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  {isIdCardDownloading
                    ? "Downloading PDF..."
                    : idCardExportProgress.phase === "RENDERING"
                    ? "Rendering PDF..."
                    : idCardExportProgress.phase === "FETCHING"
                    ? `Processing Part ${idCardExportProgress.currentPart || ""}`
                    : idCardExportProgress.phase === "QUEUED"
                    ? "In Queue"
                    : idCardExportProgress.phase === "COMPLETED"
                    ? "Completed"
                    : "Preparing..."}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                  {Math.round(isIdCardDownloading ? 100 : idCardExportProgress.progressPercent || 0)}%
                </span>
              </div>
              <Progress
                percent={isIdCardDownloading ? 100 : idCardExportProgress.progressPercent}
                showInfo={false}
                strokeColor="#1d4ed8"
                trailColor="#f1f5f9"
                status="active"
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#94a3b8",
                  lineHeight: "1.4",
                }}
              >
                {isIdCardDownloading && "Downloading the PDF file..."}
                {idCardExportProgress.phase === "FETCHING" && (
                  <>
                    Part {idCardExportProgress.processedParts || 0} of {idCardExportProgress.totalParts || 1}
                  </>
                )}
                {!isIdCardDownloading && idCardExportProgress.phase === "RENDERING" && "Rendering the PDF cards..."}
              </div>
            </div>
          </div>
        )}
      </ExportContext.Provider>
      <Modal
        title={
          exportType === "voter"
            ? "Select Part Number for Export"
            : exportType === "cadre"
            ? "Select Assigned Booth for Export"
            : "Select Part Number for Duplicate Export"
        }
        open={isExportModalVisible}
        onCancel={() => setIsExportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsExportModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="export"
            type="primary"
            style={{ color: "white" }}
            onClick={handleExport}
            disabled={selectedPartNos.length === 0 || isExporting}
            icon={<DownloadOutlined />}
            loading={isExporting}
          >
            Export
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <p>
            Please select{" "}
            {exportType === "voter"
              ? "a part number"
              : exportType === "cadre"
              ? "an assigned booth"
              : "a part number for duplicate export"}
            :
          </p>
          <Select
            style={{ width: "100%" }}
            placeholder={
              exportType === "voter"
                ? "Select a part number"
                : exportType === "cadre"
                ? "Select an assigned booth"
                : "Select part numbers"
            }
            onChange={handlePartSelectionChange}
            value={selectedPartNos}
            mode="multiple"
          >
            <Select.Option key="all" value="all">
              {exportType === "voter"
                ? "All Parts"
                : exportType === "cadre"
                ? "All Assigned Booths"
                : "All Parts"}
            </Select.Option>
            {availableBoothNumbers.map((boothNumber) => (
              <Select.Option key={boothNumber} value={boothNumber}>
                {exportType === "voter"
                  ? `Part ${boothNumber}`
                  : exportType === "cadre"
                  ? `Booth ${boothNumber}`
                  : `Part ${boothNumber}`}
              </Select.Option>
            ))}
          </Select>
          {exportType === "voter" && Object.keys(exportFilters).length > 0 && !hideFilterCheckbox && (
            <Checkbox
              checked={includeFilters}
              onChange={(e) => setIncludeFilters(e.target.checked)}
              style={{ marginTop: 16 }}
            >
              Apply current filters to export
            </Checkbox>
          )}

          {/* Column Selection for Voter Export */}
          {exportType === "voter" && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ marginBottom: 12 }}>Select Columns to Export</h4>
              {!lockColumns && (
                <Checkbox
                  checked={selectAllColumns}
                  onChange={(e) => handleSelectAllColumnsChange(e.target.checked)}
                  style={{ marginBottom: 16, fontWeight: "bold" }}
                >
                  Select All Columns
                </Checkbox>
              )}

              {lockColumns && (
                <Tag color="blue" style={{ marginBottom: 16 }}>
                  {selectedColumns.length} required columns preselected
                </Tag>
              )}

              {!selectAllColumns && !lockColumns && (
                <Collapse accordion>
                  {COLUMN_CATEGORIES.map((category) => (
                    <Panel
                      header={
                        <span
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "inline-block" }}
                        >
                          <Checkbox
                            checked={isCategorySelected(category)}
                            indeterminate={isCategoryIndeterminate(category)}
                            onChange={(e) => {
                              handleCategorySelection(category, e.target.checked);
                            }}
                          >
                            {category}
                          </Checkbox>
                        </span>
                      }
                      key={category}
                    >
                      <Row gutter={[8, 8]}>
                        {getColumnsByCategory(category).map((column) => (
                          <Col span={12} key={column.id}>
                            <Checkbox
                              checked={selectedColumns.includes(column.id)}
                              onChange={(e) =>
                                handleColumnSelection(column.id, e.target.checked)
                              }
                            >
                              {column.label}
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </Panel>
                  ))}
                </Collapse>
              )}

              {!selectAllColumns && selectedColumns.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Tag color="blue">{selectedColumns.length} columns selected</Tag>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export const useExport = () => {
  const context = useContext(ExportContext);
  if (context === undefined) {
    throw new Error("useExport must be used within an ExportProvider");
  }
  return context;
};
