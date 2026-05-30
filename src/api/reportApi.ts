import axios from "axios";
import { BASE_URL } from "../config";


interface CreateVoterTickSheetExportJobPayload {
  electionId: number;
  selectedParts: number[];
  format: "word" | "pdf";
}

interface CreateVoterTickSheetExportJobResponse {
  status: string;
  data: {
    id: string;
    jobId: string;
    status: string;
    progress: number;
    downloadUrl: string | null;
  };
  message: string;
}

export const createVoterTickSheetExportJob = async (
  payload: CreateVoterTickSheetExportJobPayload,
): Promise<CreateVoterTickSheetExportJobResponse> => {
  const jwtToken = localStorage.getItem("jwtToken");
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/report/voter-tick-sheets/export-jobs`,
      payload,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error creating voter tick sheet export job:", error);
    throw error;
  }
};

interface CreateFamilySlipExportJobPayload {
  electionId: number;
  partNo: number;
  language: "english" | "regional";
}

export const createFamilySlipExportJob = async (
  payload: CreateFamilySlipExportJobPayload,
): Promise<CreateVoterTickSheetExportJobResponse> => {
  const jwtToken = localStorage.getItem("jwtToken");
  try {
    const response = await axios.post(
      `${BASE_URL}/report/family-slip/export-jobs`,
      payload,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error creating family slip export job:", error);
    throw error;
  }
};

export const getVoterTickSheetExportJobStatus = async (
  jobId: string,
): Promise<CreateVoterTickSheetExportJobResponse> => {
  const jwtToken = localStorage.getItem("jwtToken");
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/report/voter-tick-sheets/export-jobs/${jobId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error getting voter tick sheet export job status:", error);
    throw error;
  }
};

export const downloadVoterTickSheetExport = async (
  jobId: string,
): Promise<Blob> => {
  const jwtToken = localStorage.getItem("jwtToken");
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/report/voter-tick-sheets/export-jobs/${jobId}/download`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error downloading voter tick sheet export:", error);
    throw error;
  }
};