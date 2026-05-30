import axios from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

const getJwtToken = async () => localStorage.getItem("jwtToken");

export interface ExportFilters {
  parties?: string[];
  religions?: string[];
  casteCategories?: string[];
  castes?: string[];
  subCastes?: string[];
  languages?: string[];
  schemes?: string[];
  genders?: string[];
  minAge?: number;
  maxAge?: number;
  includeUnknownAge?: boolean;
  hasMobileNo?: boolean;
  hasWhatsappNo?: boolean;
  star?: boolean;
}

export interface ExportJobRequest {
  electionId: number;
  format: "excel" | "pdf";
  chartType: "voterCount" | "familyCount";
  selectedParts: number[];
  pollingDate?: string; // "YYYY-MM-DD"
  filters?: ExportFilters;
}

export interface ExportJobResponse {
  jobId: number;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  format: "excel" | "pdf";
  chartType: "voterCount" | "familyCount";
  createdAt: string;
}

export interface ExportJobStatusResponse extends ExportJobResponse {
  s3Url?: string;
  rowCount?: number;
  errorMessage?: string;
  finishedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * Create a new poll day export job
 */
export const createPollDayExport = async (
  request: ExportJobRequest
): Promise<ApiResponse<ExportJobResponse>> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.post<ApiResponse<ExportJobResponse>>(
      `${BASE_URL}/api/v1/poll-day/chart/export`,
      request,
      {
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    return response.data;
  } catch (e: any) {
    message.error(
      e.response?.data?.message || "Failed to create export job"
    );
    throw e;
  }
};

/**
 * Get the status of a poll day export job
 */
export const getPollDayExportStatus = async (
  jobId: number
): Promise<ApiResponse<ExportJobStatusResponse>> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get<ApiResponse<ExportJobStatusResponse>>(
      `${BASE_URL}/api/v1/poll-day/chart/export/status`,
      {
        params: { jobId },
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    return response.data;
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(
        e.response?.data?.message || "Failed to fetch export job status"
      );
    }
    throw e;
  }
};

/**
 * Poll an export job until completion
 */
export const pollPollDayExportJob = async (
  jobId: number,
  onStatusUpdate?: (status: ExportJobStatusResponse) => void,
  maxAttempts = 120,
  intervalMs = 5000
): Promise<ExportJobStatusResponse> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await getPollDayExportStatus(jobId);
    const job = response.data;

    if (!job) {
      throw new Error("Export job not found");
    }

    if (onStatusUpdate) {
      onStatusUpdate(job);
    }

    if (job.status === "COMPLETED") {
      return job;
    }

    if (job.status === "FAILED") {
      throw new Error(job.errorMessage || "Export job failed");
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Export job polling timeout");
};
