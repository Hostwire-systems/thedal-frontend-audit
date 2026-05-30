import axios from "axios";
import { BASE_URL } from "../config";

const API_BASE_URL = `${BASE_URL}/api/photo-processing`;

// Get JWT token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("jwtToken");
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Extract photos from PDF
export const extractPhotosFromPdf = async (
  pdfFile: File,
  partNo: string,
  electionId: number,
  accountId: number,
  startPage?: number,
  endPage?: number
) => {
  const formData = new FormData();
  formData.append("file", pdfFile);  // Changed from "pdfFile" to "file"
  formData.append("partNo", partNo);
  formData.append("electionId", electionId.toString());
  formData.append("accountId", accountId.toString());
  
  // Add optional page range parameters
  if (startPage !== undefined && startPage > 0) {
    formData.append("startPage", startPage.toString());
  }
  if (endPage !== undefined && endPage > 0) {
    formData.append("endPage", endPage.toString());
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/extract-photos-async`,  // Updated to use async endpoint
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error extracting photos from PDF:", error);
    throw error;
  }
};

// Get processing status by job ID
export const getProcessingStatus = async (jobId: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/processing-status/${jobId}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching processing status:", error);
    throw error;
  }
};

// Get job status by job ID (detailed results)
export const getJobStatus = async (jobId: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/job-status/${jobId}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching job status:", error);
    throw error;
  }
};

// Health check for photo processing service
export const checkPhotoProcessingHealth = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/health-check`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error checking photo processing health:", error);
    throw error;
  }
};

// Download voter photo by job ID and serial number
export const downloadVoterPhoto = async (jobId: string, serialNo: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/voter-photo/${jobId}/${serialNo}`,
      {
        headers: getAuthHeaders(),
        responseType: 'blob', // Important for file downloads
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error downloading voter photo:", error);
    throw error;
  }
};

// Types for the API responses
export interface PhotoExtractionResponse {
  success: boolean;
  jobId: string;
  message: string;
  statusUrl?: string;  // Optional URL for status polling
  error?: string;
}

export interface ProcessingStatusResponse {
  success: boolean;
  jobId: string;
  status: "STARTED" | "PROCESSING" | "COMPLETED" | "FAILED";
  message: string;
  progress: number;
  totalPhotos: number | null;
  processedPhotos: number | null;
  successfulUpdates: number | null;
  failedUpdates: number | null;
  startTime: string;
  endTime: string | null;
  isCompleted: boolean;
  error?: string;
}

export interface JobStatusResponse {
  success: boolean;
  jobId: string;
  status: {
    jobId: string;
    status: "STARTED" | "PROCESSING" | "COMPLETED" | "FAILED";
    message: string;
    startTime: string;
    endTime: string | null;
    totalPhotos: number;
    processedPhotos: number;
    successfulUpdates: number;
    failedUpdates: number;
    errors: string[];
    progressPercentage: number;
  };
  error?: string;
}

export interface HealthCheckResponse {
  timestamp: number;
  service: string;
  ocrServiceHealthy: boolean;
  status: string;
  message: string;
}
