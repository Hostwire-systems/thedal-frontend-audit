import { message } from "antd";
import axios from "axios";
import { BASE_URL } from "../config";

interface duplicateParams {
  page: number;
  size: number;
  accountId: number;
  partNo?: string[];
}
interface duplicateFinalParams {
  page: number;
  size: number;
  accountId: number;
  partNo?: string;
}

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const getDuplicateVotersApi = async (
  electionId: string,
  params: duplicateParams
) => {
  const jwtToken = await getjwtToken();
  let finalParams: duplicateFinalParams = { ...params };
  if (params.partNo) {
    let finalPartNo = params.partNo.map((no) => Number(no)).join(",");
    delete params["partNo"];
    finalParams = { ...params, partNo: finalPartNo };
  }
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/duplicates`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params: finalParams,
      }
    );

    console.log("Get duplicate voters response:", response);
    return response;
  } catch (error: any) {
    let finalError = error.response ? error.response.data : error;
    console.log("Error fetching duplicate voters response:", finalError);
    throw finalError;
  }
};

export const runDuplicateVotersApi = async (
  electionId: number,
  accountId: number
) => {
  try {
    const jwtToken = await getjwtToken();
    let params = { accountId };
    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/election/${electionId}/duplicates/run`,
      {},
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "application/json",
        },
        params,
      }
    );
    message.success("Duplicate voters check triggered");
    return response;
  } catch (error: any) {
    if (error.response?.data?.message) {
      const parts = error.response.data.message.split(
        "An unexpected error occured:"
      );

      console.log(parts[1]);
      message.error(parts.length > 1 ? parts[1] : error.response.data.message);
    }

    console.error("Unable to trigger duplicate voters check: ", error);
  }
};

export const checkDuplicateVotersApiStatus = async (
  electionId: string,
  accountId: number
) => {
  const jwtToken = await getjwtToken();
  let params = {
    accountId,
  };
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/duplicates/status`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params,
      }
    );

    console.log("Get status duplicate voters response:", response);
    return response;
  } catch (error: any) {
    let finalError = error.response ? error.response.data : error;
    console.log("Error fetching status of duplicate voters:", finalError);
    throw finalError;
  }
};

export const initializeDuplicateExport = async (
  electionId: number,
  accountId: number,
  partNo: string[]
) => {
  const jwtToken = await getjwtToken();
  try {
    console.log(
      "Initializing duplicate voters export for electionId:",
      electionId,
      "accountId:",
      accountId,
      "partNos",
      partNo
    );
    let params: any = { accountId };
    if (partNo?.length > 0 && !partNo.includes("all")) {
      const numericParts = partNo
        .map((no) => Number(no))
        .filter((no) => !isNaN(no));
      console.log("Numeric parts", numericParts);
      params["partNo"] = numericParts.join(",");
    }

    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/election/${electionId}/duplicates/export-jobs`,
      {},
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params,
      }
    );
    return response.data;
  } catch (error: any) {
    message.error(
      error.response?.data?.message ||
        "Error initiating export for duplicate voters"
    );
    console.error("Error initiating export for duplicate voters", error);
    throw error;
  }
};

export const checkDuplicateExportStatus = async (
  electionId: number,
  accountId: number,
  jobId: number
) => {
  const jwtToken = await getjwtToken();
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/duplicates/export-jobs/${jobId}`,
      {
        params: { accountId, jobId },
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
        error.response?.data?.message ||
          "Error checking export status for duplicate voters"
      );
    }
    console.error("Error checking export status for duplicate voters", error);
    throw error;
  }
};
