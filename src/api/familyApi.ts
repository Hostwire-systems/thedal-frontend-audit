// api/familyApi.ts
import axios, { AxiosProgressEvent, AxiosResponse } from "axios";
import { BASE_URL } from "../config";
import { message } from "antd";
import { PartFamilyStats } from "../types/family";

// Get JWT token
const getJwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  password: string;
  whats_app_number: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  assigned_families: string[];
  remarks: string;
  status: string;
  gender: string;
}

// Family Summary API (Initial Page Load) - NEW API
export const getFamiliesSummary = async (
  electionId: number,
  boothNumbers?: string,
  partNumbers?: string,
  page = 0,
  size = 20,
  crossFamily?: boolean | null,
  filters?: any,
  singleVoterFamily?: boolean
) => {
  const jwtToken = await getJwtToken();

  const params: any = {
    page,
    size,
  };

  try {
    if (boothNumbers) params["booth-number"] = boothNumbers;
    if (partNumbers && !(filters && (filters.partNumber || filters.part_number)))
      params["part-number"] = partNumbers;
    if (crossFamily !== undefined && crossFamily !== null)
      params["crossfamily"] = crossFamily;
    if (singleVoterFamily) params["singleVoterFamily"] = true;

    // ADD FILTERS
    if (filters) {
      if (filters.epic_number) params["epicId"] = filters.epic_number;
      if (filters.serial_number) params["serialNumber"] = filters.serial_number;
      if (filters.mobileNo) params["mobileNumber"] = filters.mobileNo;
      if (filters.voterFNameEn) params["voterFirstName"] = filters.voterFNameEn;
      if (filters.voterLNameEn) params["voterLastName"] = filters.voterLNameEn;
      if (filters.relationFirstNameEn) params["relationFirstName"] = filters.relationFirstNameEn;
      if (filters.relationLastNameEn) params["relationLastName"] = filters.relationLastNameEn;
      if (filters.age) params["age"] = filters.age;
      if (filters.house_no) params["house-no"] = filters.house_no;
    }
    console.log("filters",filters);

    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/families/summary`,
      {
        params,
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching families summary:", error);
    throw error;
  }
};

export const getFamilyPartStats = async (
  electionId: number,
  partNumbers?: number[]
): Promise<PartFamilyStats[]> => {
  const jwtToken = await getJwtToken();
  const params: Record<string, string> = {};

  if (partNumbers && partNumbers.length > 0) {
    params["part-number"] = partNumbers.join(",");
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/families/part-stats`,
      {
        params,
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error: any) {
    console.error("Error fetching family part stats:", error);
    throw error;
  }
};

// Family Details API (When user clicks on a family) - NEW API
export const getFamilyMembers = async (
  electionId: number,
  familyId: string,
  sortBy = "serialNo",
  order = "asc",
  page = 0,
  size = 20
) => {
  const jwtToken = await getJwtToken();
  const params = {
    sortBy,
    order,
    page,
    size,
  };

  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/families/${familyId}/members`,
      {
        params,
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching family members:", error);
    if (error?.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
};

// Legacy API - keeping for backward compatibility
export const getFamilies = async (
  electionId: number,
  boothNumber?: number | null,
  page = 0,
  size = 10
) => {
  const jwtToken = await getJwtToken();
  const params: any = {
    page,
    size,
  };
  try {
    if (boothNumber != null) {
      params["booth-number"] = boothNumber;
    }
    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/families`,
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
    console.error("Error fetching families:", error);
    throw error;
  }
};

// Start family mapping job
export const startFamilyMapping = async (
  electionId: number,
  mobileNumber: string,
  partNumbers: number[]
) => {
  const jwtToken = await getJwtToken();
  let body = {
    electionId,
    mobileNumber,
    partNumbers,
  };
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/request-family-mapping-otp`,
      body,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error starting family mapping:", error);
    throw error;
  }
};

export const verifyRunFamilyOTP = async ({
  electionId,
  mobileNumber,
  otp,
  partNumbers,
}: {
  electionId: number;
  mobileNumber: string;
  otp: string;
  partNumbers: number[];
}) => {
  const jwtToken = await getJwtToken();
  let body = {
    electionId,
    mobileNumber,
    otp,
    partNumbers,
  };
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/verify-otp-and-run-family-mapping`,
      body,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying family mapping:", error);
    throw error;
  }
};

export const forceCancelFamilyMappingJob = async (jobId: number) => {
  const jwtToken = await getJwtToken();
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/family-job-force-cancel/${jobId}`,
      {},
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error force-cancelling family mapping job:", error);
    throw error;
  }
};

// Create family captain
export const createFamilyCaptain = async (
  electionId: number,
  payload: FormData
) => {
  const jwtToken = await getJwtToken();
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/family-captains/election/${electionId}`,
      payload,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    message.success("Family Captain created successfully!");
    return response.data;
  } catch (error) {
    console.error("Error creating family captains:", error);
    throw error;
  }
};

export const familyCaptainBulkUploadApi = async (
  formData: FormData,
  electionId: number
) => {
  try {
    const jwtToken = await getJwtToken();
    console.log("electionId", electionId);
    console.log("formData", formData);
    const response = await axios.post(
      `${BASE_URL}/api/v1/family-captains/election/${electionId}/upload`,
      formData,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "multipart/form-data",
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000,
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const total = progressEvent.total ?? 0;
          const percentCompleted = total
            ? Math.round((progressEvent.loaded * 100) / total)
            : 0;
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      }
    );
    const responseData = response.data;

    // Check if there are failed records and throw an error
    if (
      responseData.status === "success" &&
      responseData.data?.failedCount > 0
    ) {
      const failedRecords = responseData.data.failedRecords
        .map((record: any) => `Row ${record.rowNumber}: ${record.reason}`)
        .join("\n");

      throw {
        status: "error",
        code: 422,
        message: `Bulk upload completed with errors:\n${failedRecords}`,
      };
    }

    return responseData;
  } catch (error: any) {
    console.error("error", error);
    if (error.response?.status === 413) {
      throw {
        status: "error",
        code: 413,
        message:
          "File size exceeds server limits. Please reduce the file size and try again.",
      };
    }
    const errorMessage =
      error.response?.data?.message || "An error occurred during bulk upload";
    throw {
      status: "error",
      code: error.response?.status || 500,
      message: errorMessage,
    };
  }
};

// Get family mapping job status
export const getFamilyMappingStatus = async (jobId: number) => {
  const jwtToken = await getJwtToken();
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/family-job-status/${jobId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching family mapping status:", error);
    throw error;
  }
};

// Check if family mapping is already completed for an election
export const checkFamilyMappingStatus = async (electionId: number) => {
  const jwtToken = await getJwtToken();
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/family-mapping-status/election/${electionId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error checking family mapping status:", error);
    throw error;
  }
};

//update religion order
export const reorderFamily = async (
  electionId: number,
  payload: { familyId: string; newSequenceNumber: number }[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/v1/voters/election/${electionId}/families/reorder`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    message.success("Families sequence number updated successfully!");
    return response.data;
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Error updating family sequence number"
    );
    console.error("Error updating family sequence order", error);
    throw error;
  }
};

export const updateFamilyPartNumber = async (
  electionId: number,
  familyId: string,
  partNumber: number
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const params = { partNumber };
    const response = await axios.put(
      `${BASE_URL}/api/v1/voters/election/${electionId}/families/${familyId}/part`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params,
      }
    );
    message.success("Family's part number updated successfully!");
    return response.data;
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Error updating family's part number"
    );
    console.error("Error updating family's part number", error);
    throw error;
  }
};

export const updateFamilyHead = async (
  electionId: number,
  familyId: string,
  voterId: string
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/v1/voters/election/${electionId}/families/${familyId}/head`,
      { voterId },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    message.success("Family's head updated successfully!");
    return response.data;
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Error updating family's head"
    );
    console.error("Error updating family's head", error);
    throw error;
  }
};

// Family Captain Management APIs

// Get family captains with search, filter, pagination
export const getFamilyCaptains = async (
  electionId: number,
  page = 0,
  size = 10,
  assignedFamilies?: string[],
  mobileNumber?: string,
  searchTerm?: string,
  sortBy = "firstName",
  direction = "asc"
) => {
  const jwtToken = await getJwtToken();
  try {
    let url = `${BASE_URL}/api/v1/family-captains/election/${electionId}?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`;

    if (assignedFamilies && assignedFamilies.length > 0) {
      url += `&assignedFamilies=${assignedFamilies.join(",")}`;
    }
    if (mobileNumber) {
      url += `&mobileNumber=${encodeURIComponent(mobileNumber)}`;
    }
    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    }

    const response = await axios.get(url, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching family captains:", error);
    throw error;
  }
};

// Get family captain details by user ID and election ID
export const getFamilyCaptainDetails = async (
  electionId: number,
  userId: number
) => {
  const jwtToken = await getJwtToken();
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/family-captains/election/${electionId}/user/${userId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching family captain details:", error);
    throw error;
  }
};

// Update family captain details (excluding family assignments)
export const updateFamilyCaptain = async (
  electionId: number,
  userId: number,
  payload: {
    first_name: string;
    last_name: string;
    email: string;
    mobile_number: string;
    address: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    status: string;
    photo_url?: string;
    remarks?: string;
    whats_app_number?: string;
    gender: string;
  }
) => {
  const jwtToken = await getJwtToken();
  try {
    const response = await axios.put(
      `${BASE_URL}/api/v1/family-captains/election/${electionId}/user/${userId}`,
      payload,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating family captain:", error);
    throw error;
  }
};

// Update assigned families for a family captain
export const updateAssignedFamilies = async (
  electionId: number,
  userId: number,
  assignedFamilies: string[]
) => {
  const jwtToken = await getJwtToken();
  try {
    const response = await axios.put(
      `${BASE_URL}/api/v1/family-captains/election/${electionId}/user/${userId}/families`,
      { assigned_families: assignedFamilies },
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating assigned families:", error);
    throw error;
  }
};

// Delete single family captain
export const deleteFamilyCaptain = async (
  electionId: number,
  userId: number
) => {
  const jwtToken = await getJwtToken();
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/family-captains/election/${electionId}/user/${userId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting family captain:", error);
    throw error;
  }
};

// Delete multiple family captains
export const deleteFamilyCaptains = async (
  electionId: number,
  userIds: number[]
) => {
  const jwtToken = await getJwtToken();
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/family-captains/election/${electionId}?userIds=${userIds.join(
        ","
      )}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting family captains:", error);
    throw error;
  }
};

// Get family captains by assigned family
export const getFamilyCaptainsByFamily = async (
  electionId: number,
  familyId: string
) => {
  const jwtToken = await getJwtToken();
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/family-captains/election/${electionId}/family/${familyId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching family captains by family:", error);
    throw error;
  }
};

// Get family options for dropdown
export const getFamilyOptions = async (
  electionId: number,
  searchTerm?: string,
  page = 0,
  size = 20
) => {
  const jwtToken = await getJwtToken();
  try {
    let url = `${BASE_URL}/api/v1/family-captains/election/${electionId}/family-options?page=${page}&size=${size}`;

    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    }

    const response = await axios.get(url, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching family options:", error);
    throw error;
  }
};

// Get family numbers by booth/part for cadre assignment
export const getFamilyNumbersByBooth = async (
  electionId: number,
  partNumbers?: number[]
) => {
  const jwtToken = await getJwtToken();
  try {
    const params: any = {
      page: 0,
      size: 5000, // Get all families for selected booths
    };

    if (partNumbers && partNumbers.length > 0) {
      params["part-number"] = partNumbers.join(",");
    }

    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/families/summary`,
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
    console.error("Error fetching family numbers by booth:", error);
    throw error;
  }
};
