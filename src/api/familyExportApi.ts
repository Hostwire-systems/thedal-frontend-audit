import axios from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

const getJwtToken = async () => localStorage.getItem("jwtToken");

export interface UnifiedExportJob {
  id: number | string;
  exportType: "PDF" | "EXCEL";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  electionId: number;
  accountId: number;
  familyId?: string | null;
  partNo?: number | null;
  orderBy?: "family" | "serial" | null;
  columns?: 2 | 3 | null;
  s3Url: string | null;
  s3Key?: string | null;
  rowCount: number | null;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface PagedExportJobs {
  content: UnifiedExportJob[];
  pageable?: any;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  sort?: any;
  empty?: boolean;
}

export interface UnifiedExportJobsResponse {
  status: string;
  message?: string;
  data: PagedExportJobs;
}

/**
 * List all export jobs (both PDF and Excel) for an election
 */
export const listAllExportJobs = async (
  electionId: number,
  accountId: number,
  page = 0,
  size = 10
): Promise<UnifiedExportJobsResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const { data } = await axios.get<UnifiedExportJobsResponse>(
      `${BASE_URL}/api/v1/family-export/jobs`,
      {
        params: { electionId, accountId, page, size },
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    return data;
  } catch (e: any) {
    message.error(e.response?.data?.message || "Failed to list export jobs");
    throw e;
  }
};
