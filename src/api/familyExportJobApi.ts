import axios from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

const getJwtToken = async () => localStorage.getItem("jwtToken");

export interface FamilyVoterCardExportJob {
  id: string;
  accountId: number;
  electionId: number;
  familyId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  s3Key: string | null;
  s3Url: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  rowCount: number | null;
  partNo: number | null;
  columns: 2 | 3;
}

interface ApiEnvelope<T> {
  status: string;
  code: number;
  message: string;
  data: T;
}

export const createFamilyVoterCardExportJob = async ({
  familyId,
  electionId,
  accountId,
  partNo,
  columns = 2,
  orderBy,
  crossFamily,
  singleVoterFamily,
}: {
  familyId: string;
  electionId: number;
  accountId: number;
  partNo?: number;
  columns?: 2 | 3;
  orderBy?: "family" | "serial";
  crossFamily?: boolean;
  singleVoterFamily?: boolean;
}): Promise<ApiEnvelope<FamilyVoterCardExportJob>> => {
  try {
    const jwtToken = await getJwtToken();
    const params: any = { accountId };
    
    // Ensure columns defaults to 2 if not provided
    params.columns = columns;
    
    // Ensure partNo > 0 before including it
    if (partNo && partNo > 0) {
      params.partNo = partNo;
    }

    // Add orderBy parameter if provided (for part exports)
    if (orderBy) {
      params.orderBy = orderBy;
    }

    // Add crossFamily parameter if provided
    if (crossFamily !== undefined && crossFamily !== null) {
      params.crossFamily = crossFamily;
    }

    // Add singleVoterFamily parameter if provided
    if (singleVoterFamily) {
      params.singleVoterFamily = true;
    }

    const { data } = await axios.post(
      `${BASE_URL}/api/v1/families/${familyId}/election/${electionId}/voter-cards/export-jobs`,
      {},
      {
        params,
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    return data;
  } catch (e: any) {
    // Handle 400 INVALID_INPUT error with friendly message
    if (e.response?.status === 400 && e.response?.data?.code === 40513) {
      message.error("Invalid export parameters (columns must be 2 or 3; partNo > 0)");
    } else {
      message.error(e.response?.data?.message || "Failed to create export job");
    }
    throw e;
  }
};

export const getFamilyVoterCardExportJobStatus = async (
  familyId: string,
  electionId: number,
  jobId: string,
  accountId: number
): Promise<ApiEnvelope<FamilyVoterCardExportJob | null>> => {
  try {
    const jwtToken = await getJwtToken();
    const { data } = await axios.get(
      `${BASE_URL}/api/v1/families/${familyId}/election/${electionId}/voter-cards/export-jobs/${jobId}`,
      {
        params: { accountId },
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    return data;
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(
        e.response?.data?.message || "Failed to fetch export job status"
      );
    }
    throw e;
  }
};

export interface PagedJobs {
  content: FamilyVoterCardExportJob[];
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

export const listFamilyVoterCardExportJobs = async (
  familyId: string,
  electionId: number,
  accountId: number,
  page = 0,
  size = 10
): Promise<ApiEnvelope<PagedJobs>> => {
  try {
    const jwtToken = await getJwtToken();
    const { data } = await axios.get(
      `${BASE_URL}/api/v1/families/${familyId}/election/${electionId}/voter-cards/export-jobs`,
      {
        params: { accountId, page, size },
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    return data;
  } catch (e: any) {
    message.error(e.response?.data?.message || "Failed to list export jobs");
    throw e;
  }
};
