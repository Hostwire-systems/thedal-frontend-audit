import axios from "axios";
import { BASE_URL } from "../config";

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

// ==================== NEW SIR REPORT API ====================

/**
 * Upload & Start Comparison
 * POST /api/voter/sir-report/compare
 */
export const compareFilesApi = async (
  baseFile: File,
  newFile: File,
  electionId?: number
) => {
  try {
    const jwtToken = await getjwtToken();
    const formData = new FormData();
    formData.append("baseFile", baseFile);
    formData.append("newFile", newFile);
    if (electionId) {
      formData.append("electionId", electionId.toString());
    }

    const response = await axios.post(
      `${BASE_URL}/api/voter/sir-report/compare`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error starting SIR comparison:", error);
    throw error;
  }
};

/**
 * Check Job Status
 * GET /api/voter/sir-report/{jobId}/status
 */
export const getJobStatusApi = async (jobId: string) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/voter/sir-report/${jobId}/status`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching job status:", error);
    throw error;
  }
};

/**
 * Get Summary
 * GET /api/voter/sir-report/{jobId}/summary
 */
export const getSummaryApi = async (jobId: string) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/voter/sir-report/${jobId}/summary`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching summary:", error);
    throw error;
  }
};

/**
 * Get Detailed Records
 * GET /api/voter/sir-report/{jobId}/details
 */
export const getDetailedRecordsApi = async (
  jobId: string,
  type: "ADDITIONS" | "DELETIONS" | "SHIFTS",
  page: number = 0,
  size: number = 50
) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/voter/sir-report/${jobId}/details`,
      {
        params: { type, page, size },
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching detailed records:", error);
    throw error;
  }
};

/**
 * List All Comparisons
 * GET /api/voter/sir-report/list
 */
export const listAllComparisonsApi = async (
  electionId?: number,
  page: number = 0,
  size: number = 20
) => {
  try {
    const jwtToken = await getjwtToken();
    const params: any = { page, size };
    if (electionId) {
      params.electionId = electionId;
    }

    const response = await axios.get(
      `${BASE_URL}/api/voter/sir-report/list`,
      {
        params,
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching comparison list:", error);
    throw error;
  }
};

/**
 * Delete Comparison
 * DELETE /api/voter/sir-report/{jobId}
 */
export const deleteComparisonApi = async (jobId: string) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.delete(
      `${BASE_URL}/api/voter/sir-report/${jobId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting comparison:", error);
    throw error;
  }
};

/**
 * Initiate Export
 * POST /api/voter/sir-report/{jobId}/export/initiate?type=ADDITIONS&format=EXCEL
 */
export const initiateExportApi = async (
  jobId: string,
  type: "ADDITIONS" | "DELETIONS" | "SHIFTS",
  format: "EXCEL" | "PDF"
) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/voter/sir-report/${jobId}/export/initiate`,
      null,
      {
        params: { type, format },
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error initiating export:", error);
    throw error;
  }
};

/**
 * Get Export Status
 * GET /api/voter/sir-report/export/{exportJobId}/status
 */
export const getExportStatusApi = async (exportJobId: number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/voter/sir-report/export/${exportJobId}/status`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching export status:", error);
    throw error;
  }
};
