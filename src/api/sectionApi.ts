// partApi.ts
import axios, { AxiosResponse } from "axios";
import { BASE_URL } from "../config";
import { message, notification } from "antd";

interface Section {
  sectionNo: string;
  partNo: string;
  sectionNameEnglish: string;
  sectionNameL1: string;
}

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const getSectionsApi = async (electionId: number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(`${BASE_URL}/api/sections/${electionId}`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response;
  } catch (error: any) {
    console.error("Error fetching sections:", error);
    // message.error(error.response?.data?.message || "Error fetching sections");
    throw error;
  }
};

export const deleteSectionApi = async (
  electionId: number,
  id: number
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.delete(
      `${BASE_URL}/api/sections/${electionId}/${id}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Error deleting section");
    console.error("Error deleting section:", error);
    throw error;
  }
};

export const deleteMultipleSectionsApi = async (
  electionId: number,
  sectionIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    console.log("section manager ids", sectionIds);
    const params = new URLSearchParams();
    if (sectionIds && sectionIds.length > 0) {
      sectionIds.forEach((id) => {
        params.append("sectionIds", id.toString());
      });
    }
    console.log("params", params);
    const response = await axios.delete(
      `${BASE_URL}/api/sections/election/${electionId}`,
      {
        params: sectionIds?.length ? params : undefined,
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error: any) {
    const errorMessage = sectionIds?.length
      ? "Error deleting sections"
      : "Error deleting all sections";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};

export const updateSectionApi = async (
  electionId: number,
  id: number,
  sectionData: Section
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/sections/${electionId}/${id}`,
      sectionData,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Error updating section");
    console.error("Error updating section:", error);
    throw error;
  }
};

export const addSectionApi = async (
  electionId: number,
  sectionData: Section
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/sections/${electionId}`,
      sectionData,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Error adding section");
    console.error("Error adding section:", error);
    throw error;
  }
};

export const addSectionBulkApi = async (
  electionId: number,
  sectionData: Section[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/sections/election/${electionId}/section-upload`,
      sectionData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent?.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      }
    );
    const result = response.data;
    const {
      totalRecords,
      totalProcessedRecords,
      totalSuccessRecords,
      totalFailedRecords,
    } = result.data || {};

    console.log({
      totalRecords,
      totalProcessedRecords,
      totalSuccessRecords,
      totalFailedRecords,
    });

    if (totalFailedRecords > 0) {
      if (totalSuccessRecords === 0) {
        // Case: All records failed
        notification.error({
          message: "Bulk Upload Failed",
          description: `All ${totalRecords} records failed. Please check the file and try again.`,
          duration: 5,
        });
        throw {
          status: "error",
          code: 500,
          message: `Bulk upload failed completely. Total Records: ${totalRecords}, Failed: ${totalFailedRecords}.`,
        };
      } else {
        // Case: Some records failed
        notification.warning({
          message: "Bulk Upload Completed with Errors",
          description: `Out of ${totalRecords} records, ${totalSuccessRecords} succeeded and ${totalFailedRecords} failed.`,
          duration: 5,
        });
      }
    } else {
      // Case: All records succeeded
      notification.success({
        message: "Bulk Upload Successful",
        description: `All ${totalRecords} records uploaded successfully!`,
        duration: 5,
      });
    }

    return response;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "An error occurred during bulk upload";

    notification.error({
      message: "Bulk Upload Error",
      description: errorMessage,
      duration: 5,
    });

    console.error("Error uploading section:", error);
    throw error;
  }
};

/**
 * Fetch available sections for given booth/part numbers (for cadre assignment)
 * @param electionId - Election ID
 * @param boothNumbers - Array of booth/part numbers
 * @returns Promise with section data grouped by booth
 */
export const getSectionsByBooths = async (
  electionId: number,
  boothNumbers: number[]
) => {
  try {
    const jwtToken = await getjwtToken();
    const boothNumbersStr = boothNumbers.join(",");
    
    const response = await axios.get(`${BASE_URL}/booth-sections/by-booths`, {
      params: {
        electionId,
        boothNumbers: boothNumbersStr,
      },
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    
    return response.data;
  } catch (error: any) {
    console.error("Error fetching sections by booths:", error);
    message.error(error.response?.data?.message || "Error fetching sections");
    throw error;
  }
};

export interface SectionInfo {
  sectionNo: number | null;
  sectionNameEn: string | null;
  sectionNameL1: string | null;
  voterCount: number;
}

export interface PartSectionVoterCount {
  partNo: number;
  sections: SectionInfo[];
}

export interface VoterCountBySectionResponse {
  status: string;
  code: number;
  message: string;
  data: PartSectionVoterCount[];
}

/**
 * Fetch voter count by section for a specific election and parts.
 * @param electionId - Election ID
 * @param partNos - Array of part numbers
 * @returns Promise with voter count by section data
 */
export const getVoterCountBySectionApi = async (
  electionId: number,
  partNos: number[]
): Promise<VoterCountBySectionResponse> => {
  try {
    const jwtToken = await getjwtToken();
    const partNosStr = partNos.join(",");

    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/voter-count-by-section`,
      {
        params: {
          partNos: partNosStr,
        },
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching voter count by section:", error);
    // message.error(error.response?.data?.message || "Error fetching voter count by section");
    throw error;
  }
};

export interface SectionInfoOld {
  sectionNo: number;
  voterCount: number;
}

export interface BoothSectionData {
  [boothNumber: number]: SectionInfoOld[];
}
