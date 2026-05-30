import axios, { AxiosResponse } from "axios";
import { message, notification } from "antd";
import { BASE_URL } from "../config";

// Fetch castes from cpanel
export const getCpanelCastesApi = async () => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await axios.get(`${BASE_URL}/api/cpanel/caste`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cpanel castes:", error);
    message.error(
      error.response?.data?.message || "Error fetching cpanel castes"
    );
    throw error;
  }
};

// Fetch all castes or castes by religionId
export const fetchCaste = async (electionId: number, religionId?: number) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    console.log("religionId", religionId);
    const url = religionId
      ? `${BASE_URL}/election-settings/castes/${electionId}?religionId=${religionId}`
      : `${BASE_URL}/election-settings/castes/${electionId}`;

    console.log("url", url);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        accept: "*/*",
      },
    });
    return response;
  } catch (error: any) {
    // message.error(error.response?.data?.message || "Unable to fetch castes");
    console.log("Error fetch Castes: ", error);
    throw error;
  }
};

// Add a new caste
export const addCaste = async (
  casteName: string,
  religionId: number,
  electionId: number
) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    console.log(
      "caste name" + casteName,
      "religion id" + religionId,
      "election id" + electionId
    );
    const response = await axios.post(
      `${BASE_URL}/election-settings/castes/${electionId}`,
      { casteName, religionId },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    message.success("Added new caste successfully");
    return response;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Unable to create a caste");
    console.log("Error adding Caste:", error);
  }
};

// Edit an existing caste (only casteName is updated, not religionId)
export const editCaste = async (
  casteId: number,
  payload: { casteName: string; religionId: number },
  electionId: number
) => {
  const jwtToken = localStorage.getItem("jwtToken");
  try {
    const response = await axios.put(
      `${BASE_URL}/election-settings/castes/${electionId}/${casteId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    message.success("Edited caste successfully");
    return response;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Unable to edit caste");
    console.error("Error edit Caste: ", error);
  }
};

export const addCasteBulkApi = async (
  electionId: number,
  formData: FormData
): Promise<AxiosResponse> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await axios.post(
      `${BASE_URL}/election-settings/castes/${electionId}/bulk-upload`,
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

//Update caste order
export const updateCasteOrder = async (
  electionId: number,
  payload: { casteId: number; newOrderIndex: number }[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await axios.put(
      `${BASE_URL}/election-settings/castes/reorder/${electionId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    message.success("Order updated successfully!");
    return response.data;
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Error updating Castes order"
    );
    console.error("Error updating Castes order", error);
    throw error;
  }
};

export const deleteCaste = async (
  electionId: number,
  casteIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    console.log("caste ids", casteIds);
    const params = new URLSearchParams();
    if (casteIds && casteIds.length > 0) {
      casteIds.forEach((id) => {
        params.append("casteIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/election-settings/castes/${electionId}`,
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
    const errorMessage = casteIds?.length
      ? "Error deleting castes"
      : "Error deleting all castes";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};
