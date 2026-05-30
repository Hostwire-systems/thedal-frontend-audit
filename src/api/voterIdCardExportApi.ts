import axios from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

const getJwtToken = async () => localStorage.getItem("jwtToken");

export interface VoterIdCardExportRequest {
  electionId: number;
  selectedParts: number[];
  photoMode: "yes" | "no" | "both";
  cardTemplate: "8perpage" | "10perpage";
  backgroundColor: string;
  photoUploadedFrom?: string | null;
  photoUploadedTo?: string | null;
  partyIds?: number[];
  partyId?: number | null;
}

export interface VoterIdCardExportStatusResponse {
  jobId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  phase: "QUEUED" | "FETCHING" | "RENDERING" | "COMPLETED" | "FAILED";
  progressPercent: number;
  totalParts?: number;
  processedParts?: number;
  totalVoters?: number;
  processedVoters?: number;
  currentPart?: number | null;
  currentPage?: number | null;
  totalPages?: number | null;
  fileName?: string | null;
  errorMessage?: string | null;
  createdAt?: string;
  finishedAt?: string | null;
  expiresAt?: string | null;
}

interface VoterIdCardDownloadLinkResponse {
  downloadUrl: string;
}

interface ApiEnvelope<T> {
  status: string;
  code: number;
  message: string;
  data: T;
}

const extractErrorMessage = async (error: any, fallbackMessage: string) => {
  const responseData = error?.response?.data;

  if (responseData instanceof Blob) {
    try {
      const text = await responseData.text();

      if (!text) {
        return fallbackMessage;
      }

      try {
        const parsed = JSON.parse(text);
        return parsed?.message || parsed?.error || fallbackMessage;
      } catch {
        return text;
      }
    } catch {
      return fallbackMessage;
    }
  }

  return error?.response?.data?.message || fallbackMessage;
};

export const createVoterIdCardExportJob = async (
  request: VoterIdCardExportRequest,
  backgroundImage?: File | null
): Promise<ApiEnvelope<VoterIdCardExportStatusResponse>> => {
  try {
    const jwtToken = await getJwtToken();
    const formData = new FormData();
    formData.append("request", new Blob([JSON.stringify(request)], { type: "application/json" }));
    if (backgroundImage) {
      formData.append("backgroundImage", backgroundImage);
    }
    const { data } = await axios.post<ApiEnvelope<VoterIdCardExportStatusResponse>>(
      `${BASE_URL}/api/v1/report/voter-id-cards/export-jobs`,
      formData,
      {
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    return data;
  } catch (e: any) {
    message.error(e.response?.data?.message || "Failed to create voter ID card export job");
    throw e;
  }
};

export const getVoterIdCardExportJobStatus = async (
  jobId: string
): Promise<ApiEnvelope<VoterIdCardExportStatusResponse>> => {
  try {
    const jwtToken = await getJwtToken();
    const { data } = await axios.get<ApiEnvelope<VoterIdCardExportStatusResponse>>(
      `${BASE_URL}/api/v1/report/voter-id-cards/export-jobs/${jobId}`,
      {
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    return data;
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || "Failed to fetch voter ID card export status");
    }
    throw e;
  }
};

export const pollVoterIdCardExportJob = async (
  jobId: string,
  onStatusUpdate?: (status: VoterIdCardExportStatusResponse) => void,
  maxAttempts = 240,
  intervalMs = 2000
): Promise<VoterIdCardExportStatusResponse> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await getVoterIdCardExportJobStatus(jobId);
    const job = response.data;

    if (!job) {
      throw new Error("Export job not found");
    }

    onStatusUpdate?.(job);

    if (job.status === "COMPLETED") {
      return job;
    }

    if (job.status === "FAILED") {
      throw new Error(job.errorMessage || "Voter ID card export failed");
    }

    attempts += 1;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Voter ID card export polling timeout");
};

const resolveDownloadUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const triggerBrowserDownload = (downloadUrl: string) => {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = downloadUrl;
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  window.setTimeout(() => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }, 60000);
};

export const getVoterIdCardExportDownloadLink = async (jobId: string): Promise<string> => {
  try {
    const jwtToken = await getJwtToken();
    const { data } = await axios.get<ApiEnvelope<VoterIdCardDownloadLinkResponse>>(
      `${BASE_URL}/api/v1/report/voter-id-cards/export-jobs/${jobId}/download-link`,
      {
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );

    if (!data?.data?.downloadUrl) {
      throw new Error("Download link is not available");
    }

    return resolveDownloadUrl(data.data.downloadUrl);
  } catch (e: any) {
    message.error(
      await extractErrorMessage(e, "Failed to prepare voter ID card PDF download")
    );
    throw e;
  }
};

export const downloadVoterIdCardExportJob = async (jobId: string) => {
  const downloadUrl = await getVoterIdCardExportDownloadLink(jobId);
  triggerBrowserDownload(downloadUrl);
  return { downloadUrl };
};

export const deleteVoterIdCardExportJob = async (jobId: string) => {
  try {
    const jwtToken = await getJwtToken();
    await axios.delete(`${BASE_URL}/api/v1/report/voter-id-cards/export-jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
  } catch (e: any) {
    message.error(e.response?.data?.message || "Failed to delete voter ID card export job");
    throw e;
  }
};