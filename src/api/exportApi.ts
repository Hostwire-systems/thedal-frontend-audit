import axios, { AxiosResponse } from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

// Get JWT token
const getJwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export type ExportType = "VOTER" | "CADRE" | "POLL_DAY" | "ID_CARD" | "SIR_REPORT";

export const getExportApi = async (
  electionId: number,
  page: number = 0,
  size: number = 10,
  type?: ExportType,
  status?: string
) => {
  try {
    const jwtToken = await getJwtToken();
    let url = `${BASE_URL}/api/exports/${electionId}?page=${page}&size=${size}`;
    
    if (type) {
      url += `&type=${type}`;
    }
    if (status) {
      url += `&status=${status}`;
    }
    
    const response = await axios.get(url, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching exports data:", error);
    throw error;
  }
};

export const deleteExportApi = async (
  electionId: number,
  jobId?: string | number
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    console.log("jobId", jobId);
    const response = await axios.delete(
      `${BASE_URL}/api/v1/voters/${electionId}/export/${jobId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Error deleteing export");
    console.error("Error deleteing export", error);
    throw error;
  }
};

export const deleteSurveyExportApi = async (
  electionId: number,
  jobIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    console.log("Job ids", jobIds);
    const params = new URLSearchParams();
    if (jobIds && jobIds.length > 0) {
      jobIds.forEach((id) => {
        params.append("jobIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/api/survey-forms/election/${electionId}/export-jobs`,
      {
        params: params,
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error: any) {
    const errorMessage = jobIds?.length
      ? "Error deleting Survey form exports"
      : "Error deleting all Survey form exports";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};

export const initializeSurveyExport = async (
  electionId: number,
  formId: string
) => {
  const jwtToken = await getJwtToken();
  try {
    console.log(
      "Initializing survey export for electionId:",
      electionId,
      "formId:",
      formId
    );
    const response = await axios.post(
      `${BASE_URL}/api/survey-forms/election/${electionId}/form/${formId}/export`,
      {},
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Error initiating export");
    console.error("Error initiating export", error);
    throw error;
  }
};

export const checkSurveyExportStatus = async (
  electionId: number,
  jobId: number
) => {
  const jwtToken = await getJwtToken();
  try {
    const response = await axios.get(
      `${BASE_URL}/api/survey-forms/election/${electionId}/export-jobs`,
      {
        params: { jobId },
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status !== 401) {
      message.error(
        error.response?.data?.message || "Error checking export status"
      );
    }
    console.error("Error checking export status", error);
    throw error;
  }
};
