import axios from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

const getJwtToken = async () => localStorage.getItem("jwtToken");

export interface FamilyExcelExportJob {
  id: number;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  exportType: "EXCEL";
  s3Url: string | null;
  rowCount: number | null;
  errorMessage?: string | null;
  createdAt?: string;
  finishedAt?: string | null;
  partNo?: number | null;
  orderBy?: "family" | "serial";
  familyId?: string;
  electionId?: number;
  accountId?: number;
}

export interface CreateFamilyExcelExportRequest {
  electionId: number;
  accountId: number;
  crossFamily: boolean | null;
  exportType: "family" | "part";
  familyId?: string;
  partNo?: number;
  orderBy?: "family" | "serial";
  singleVoterFamily?: boolean;
}

export interface FamilyExcelExportResponse {
  status: string;
  message?: string;
  data?: FamilyExcelExportJob | null;
}

/**
 * Create a new family Excel export job
 */
export const createFamilyExcelExportJob = async (
  request: CreateFamilyExcelExportRequest
): Promise<FamilyExcelExportResponse> => {
  try {
    const jwtToken = await getJwtToken();
    console.log("Payload for family export excel file:",request);
    const response = await axios.post<FamilyExcelExportResponse>(
      `${BASE_URL}/api/v1/family-export/excel`,
      request,
      {
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    return response.data;
  } catch (e: any) {
    message.error(e.response?.data?.message || "Failed to create Excel export job");
    throw e;
  }
};

/**
 * Get the status of a family Excel export job
 */
export const getFamilyExcelExportJobStatus = async (
  jobId: number,
  accountId: number
): Promise<FamilyExcelExportResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get<FamilyExcelExportResponse>(
      `${BASE_URL}/api/v1/family-export/excel/${jobId}/status`,
      {
        params: { accountId },
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    return response.data;
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || "Failed to fetch Excel export job status");
    }
    throw e;
  }
};

/**
 * Poll an Excel export job until completion
 */
export const pollExcelExportJob = async (
  jobId: number,
  accountId: number,
  onStatusUpdate?: (status: string) => void,
  maxAttempts = 120,
  intervalMs = 2000
): Promise<FamilyExcelExportJob> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await getFamilyExcelExportJobStatus(jobId, accountId);
    const job = response.data;

    if (!job) {
      throw new Error(
        response.message ||
          "Excel export job not available for current account context"
      );
    }

    if (onStatusUpdate) {
      onStatusUpdate(job.status);
    }

    if (job.status === "COMPLETED") {
      return job;
    }

    if (job.status === "FAILED") {
      throw new Error(job.errorMessage || "Excel export job failed");
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Excel export job polling timeout");
};

export interface PagedExcelJobs {
  content: FamilyExcelExportJob[];
  pageable: any;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page
  first: boolean;
  last: boolean;
  numberOfElements: number;
  sort: any;
  empty: boolean;
}

export interface FamilyExcelExportListResponse {
  status: string;
  message?: string;
  data: PagedExcelJobs;
}

/**
 * List all Excel export jobs for an election
 */
export const listFamilyExcelExportJobs = async (
  electionId: number,
  accountId: number,
  page = 0,
  size = 10
): Promise<FamilyExcelExportListResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const { data } = await axios.get(
      `${BASE_URL}/api/v1/family-export/excel`,
      {
        params: { electionId, accountId, page, size },
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    return data;
  } catch (e: any) {
    message.error(e.response?.data?.message || "Failed to list Excel export jobs");
    throw e;
  }
};
