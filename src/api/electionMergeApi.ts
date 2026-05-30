import axios from "axios";
import { BASE_URL } from "../config";

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const dryRunMergeElection = async (
  targetElectionId: string,
  sourceElectionId: string,
  fields: string[]
) => {
  try {
    const jwtToken = await getjwtToken();
    const payload = {
      sourceElectionId: parseInt(sourceElectionId),
      fields,
      dryRun: true,
    };
    console.log("Payload for dry run merge election", payload);

    const response = await axios.post(
      `${BASE_URL}/api/elections/${targetElectionId}/merge/dry-run`,
      payload,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    const body = response.data;
    const jobId = body?.data?.jobId || body?.jobId;
    if (!jobId) {
      throw new Error("Dry-run jobId missing in response");
    }
    return { jobId };
  } catch (error: any) {
    console.error(
      "Dry-run merge failed:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to perform dry-run merge"
    );
  }
};

export const finalMergeElection = async (
  targetElectionId: string,
  sourceElectionId: string,
  fields: string[]
) => {
  try {
    const jwtToken = await getjwtToken();
    console.log("Final merge election data",{targetElectionId,sourceElectionId})

    const response = await axios.post(
      `${BASE_URL}/api/elections/${targetElectionId}/merge`,
      {
        sourceElectionId: parseInt(sourceElectionId),
        fields,
      },
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Final merge failed:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || "Failed to perform final merge"
    );
  }
};

export const checkStatusMergeElection = async (
  targetElectionId: string,
  jobId: string
) => {
  try {
    const jwtToken = await getjwtToken();

    const response = await axios.get(
      `${BASE_URL}/api/elections/${targetElectionId}/merge/jobs/${jobId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Check merge status failed:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to check merge job status"
    );
  }
};

export const listMergeJobs = async (
  targetElectionId: string,
  page: number = 0,
  size: number = 20
) => {
  try {
    const jwtToken = await getjwtToken();

    const response = await axios.get(
      `${BASE_URL}/api/elections/${targetElectionId}/merge/jobs`,
      {
        params: { page, size },
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "List merge jobs failed:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to list merge jobs"
    );
  }
};

export const getMergeJobDetail = async (
  targetElectionId: string,
  jobId: string
) => {
  try {
    const jwtToken = await getjwtToken();

    const response = await axios.get(
      `${BASE_URL}/api/elections/${targetElectionId}/merge/jobs/${jobId}/detail`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Get merge job detail failed:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to get merge job detail"
    );
  }
};

export const forceFailMergeJob = async (
  targetElectionId: string,
  jobId: string,
  reason?: string
) => {
  try {
    const jwtToken = await getjwtToken();

    const response = await axios.post(
      `${BASE_URL}/api/elections/${targetElectionId}/merge/jobs/${jobId}/force-fail`,
      {},
      {
        params: reason ? { reason } : {},
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Force fail merge job failed:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to force fail merge job"
    );
  }
};

export const listActiveMergeJobs = async (targetElectionId: string) => {
  try {
    const jwtToken = await getjwtToken();

    const response = await axios.get(
      `${BASE_URL}/api/elections/${targetElectionId}/merge/jobs/active`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "List active merge jobs failed:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to list active merge jobs"
    );
  }
};

export const cancelMergeJob = async (
  targetElectionId: string,
  jobId: string
) => {
  try {
    const jwtToken = await getjwtToken();

    const response = await axios.post(
      `${BASE_URL}/api/elections/${targetElectionId}/merge/jobs/${jobId}/cancel`,
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
    console.error(
      "Cancel merge job failed:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to cancel merge job"
    );
  }
};
