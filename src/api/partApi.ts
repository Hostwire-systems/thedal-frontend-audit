// partApi.ts
import axios, { AxiosResponse } from "axios";
import { BASE_URL } from "../config";
import { message, notification } from "antd";
import { RcFile } from "antd/es/upload";

interface BoothCommitteeMember {
  name: string;
  designation: string;
  mobileNumber?: string;
}

interface Part {
  id: number;
  partNo: string;
  partNameEnglish: string;
  partCaptainName: string;
  captainDesignation: string;
  captainMobileNo: string;
  partNameL1: string;
  partType?: string;
  schoolName: string;
  schoolLat: number;
  schoolLong: number;
  partLat: number;
  partLong: number;
  pincode: string;
  bloName: string;
  bloDesignation: string;
  bloMobileNumber: string;
  bla2Name: string;
  bla2Designation: string;
  bla2MobileNumber: string;
  boothVulnerability?: string;
  orderIndex?: number;
  partImageUrl?: string | null;
  boothCommitteeMembers?: BoothCommitteeMember[];
}

interface UpdatePartData {
  partNo: string;
  partNameEnglish: string;
  partNameL1: string;
  partType?: string;
  schoolName: string;
  partLat: number;
  partLong: number;
  pincode: string;
  schoolLat: number;
  schoolLong: number;
  boothVulnerability?: string;
  orderIndex?: number;
  partCaptainName: string;
  captainDesignation: string;
  captainMobileNo: string;
  bloName?: string;
  bloDesignation?: string;
  bloMobileNumber?: string;
  bla2Name?: string;
  bla2Designation?: string;
  bla2MobileNumber?: string;
  partImageUrl?: string | null;
  boothCommitteeMembers?: BoothCommitteeMember[];
}

export interface ExportJobResponse {
  jobId: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  progress: number;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: string;
}

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const getPartsApi = async (electionId: number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/elections/partmanager/${electionId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error: any) {
    console.error("Error fetching parts:", error);
    throw error;
  }
};

export const getPartsVulnerabilityApi = async (
  electionId: number,
  page = 0,
  size = 10
) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/elections/partmanager/vulnerability/${electionId}?page=${page}&size=${size}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error: any) {
    console.error("Error fetching parts vulnerability:", error);
    throw error;
  }
};

export const deletePartApi = async (
  electionId: number,
  partManagerId: number
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.delete(
      `${BASE_URL}/elections/partmanager/${electionId}/${partManagerId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Error deleting part");
    console.error("Error deleting part:", error);
    throw error;
  }
};

export const deleteMultiplePartsApi = async (
  electionId: number,
  partManagerIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    console.log("Part manager ids", partManagerIds);
    const params = new URLSearchParams();
    if (partManagerIds && partManagerIds.length > 0) {
      partManagerIds.forEach((id) => {
        params.append("partManagerIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/elections/partmanager/election/${electionId}`,
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
    const errorMessage = partManagerIds?.length
      ? "Error deleting parts"
      : "Error deleting all parts";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};

export const updatePartApi = async (
  electionId: number,
  partManagerId: number,
  partData: UpdatePartData,
  partImage?: RcFile | null
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();

    // If there's an image, use multipart/form-data
    if (partImage) {
      const formData = new FormData();

      const partManagerData = {
        partNo: partData.partNo,
        partNameEnglish: partData.partNameEnglish,
        partNameL1: partData.partNameL1,
        schoolName: partData.schoolName,
        partLat: partData.partLat,
        partLong: partData.partLong,
        pincode: partData.pincode,
        schoolLat: partData.schoolLat,
        schoolLong: partData.schoolLong,
        boothVulnerability: partData.boothVulnerability,
        orderIndex: partData.orderIndex,
        partCaptainName: partData.partCaptainName,
        captainDesignation: partData.captainDesignation,
        captainMobileNo: partData.captainMobileNo,
        bloName: partData.bloName,
        bloDesignation: partData.bloDesignation,
        bloMobileNumber: partData.bloMobileNumber,
        bla2Name: partData.bla2Name,
        bla2Designation: partData.bla2Designation,
        bla2MobileNumber: partData.bla2MobileNumber,
      };

      const blob = new Blob([JSON.stringify(partManagerData)], {
        type: "application/json",
      });
      formData.append("partManagerData", blob);
      formData.append("partImage", partImage);

      const response = await axios.put(
        `${BASE_URL}/elections/partmanager/${electionId}/${partManagerId}`,
        formData,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );
      return response;
    } else {
      // If no image, use JSON
      const response = await axios.put(
        `${BASE_URL}/elections/partmanager/${electionId}/${partManagerId}`,
        partData,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );
      return response;
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || "Error updating part");
    console.error("Error updating part:", error);
    throw error;
  }
};

export const addPartApi = async (
  electionId: number,
  partData: Omit<Part, "id">,
  partImage?: RcFile
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();

    // If there's an image, use multipart/form-data
    if (partImage) {
      const formData = new FormData();
      const partManagerData = {
        partNo: partData.partNo,
        partNameEnglish: partData.partNameEnglish,
        partNameL1: partData.partNameL1,
        schoolName: partData.schoolName,
        partLat: partData.partLat,
        partLong: partData.partLong,
        pincode: partData.pincode,
        schoolLat: partData.schoolLat,
        schoolLong: partData.schoolLong,
        boothVulnerability: partData.boothVulnerability,
        orderIndex: partData.orderIndex,
        partCaptainName: partData.partCaptainName,
        captainDesignation: partData.captainDesignation,
        captainMobileNo: partData.captainMobileNo,
        bloName: partData.bloName,
        bloDesignation: partData.bloDesignation,
        bloMobileNumber: partData.bloMobileNumber,
        bla2Name: partData.bla2Name,
        bla2Designation: partData.bla2Designation,
        bla2MobileNumber: partData.bla2MobileNumber,
      };
      
      const blob = new Blob([JSON.stringify(partManagerData)], {
        type: "application/json",
      });
      formData.append("partManagerData", blob);
      formData.append("partImage", partImage);
      
      const response = await axios.post(
        `${BASE_URL}/elections/partmanager/${electionId}`,
        formData,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );
      return response;
    } else {
      console.log("Part manager data:", partData);
      // If no image, use JSON
      const response = await axios.post(
        `${BASE_URL}/elections/partmanager/${electionId}`,
        partData,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );
      return response;
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || "Error adding part");
    console.error("Error adding part:", error);
    throw error;
  }
};

export const exportPartsApi = async (electionId: number, type: string) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/elections/partmanager/${electionId}/export`,
      { format: type },
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Error fetching parts:", error);
    throw error;
  }
};

export const partExportJob = async (
  electionId: number,
  jobId: string
): Promise<ExportJobResponse> => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/elections/partmanager/${electionId}/export/status/${jobId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    const payload = response.data?.data || response.data;
    return {
      jobId: String(payload.jobId),
      status: payload.status,
      progress:
        payload.status === "COMPLETED"
          ? 100
          : payload.status === "FAILED"
          ? 0
          : 50,
      downloadUrl: payload.awsS3DownloadUrl || payload.localFilePath,
      errorMessage: payload.status === "FAILED" ? payload.message : undefined,
      createdAt: payload.timeStarted,
    };
  } catch (error: any) {
    console.error("Error polling export job:", error);
    throw error;
  }
};

export const downloadPartExport = async (electionId: number, jobId: number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/elections/partmanager/${electionId}/export/download/${jobId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Error downloading export file:", error);
    throw error;
  }
};

export const listAllExportJobs = async (
  electionId: number,
  page: number,
  size: number
) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/elections/partmanager/${electionId}/exports`,
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
    console.error("Error fetching export jobs:", error);
    throw error;
  }
};

export const addPartBulkApi = async (
  electionId: number,
  formData: FormData
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/elections/partmanager/election/${electionId}/bulk-upload`,
      formData,
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

    return result;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "An error occurred during bulk upload";

    notification.error({
      message: "Bulk Upload Error",
      description: errorMessage,
      duration: 5,
    });

    console.error("Error uploading parts:", error);
    throw error;
  }
};
