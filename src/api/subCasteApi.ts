import axios, { AxiosResponse } from "axios";
import { message, notification } from "antd";
import { BASE_URL } from "../config";

// Fetch subcastes from cpanel
export const getCpanelSubCastesApi = async () => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await axios.get(`${BASE_URL}/api/cpanel/subcaste`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cpanel subcastes:", error);
    message.error(
      error.response?.data?.message || "Error fetching cpanel subcastes"
    );
    throw error;
  }
};

// Fetch all sub-castes or sub-castes by casteId
export const fetchSubCaste = async (electionId: number, casteId?: number) => {
  const jwtToken = localStorage.getItem("jwtToken");

  try {
    const url = casteId
      ? `${BASE_URL}/election-settings/elections/${electionId}/subcastes?casteId=${casteId}`
      : `${BASE_URL}/election-settings/elections/${electionId}/subcastes`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        accept: "*/*",
      },
    });
    return response;
  } catch (error: any) {
    console.log("Error fetch Sub-Castes: ", error);
    throw error;
  }
};

// Add a new sub-caste
export const addSubCaste = async (
  subCasteName: string,
  casteId: number,
  religionId: number,
  electionId: number
) => {
  const jwtToken = localStorage.getItem("jwtToken");

  try {
    console.log("SubCasteName", subCasteName);
    console.log("CasteId", casteId);
    console.log("ReligionId", religionId);
    const response = await axios.post(
      `${BASE_URL}/election-settings/subcastes/${electionId}`,
      { subCasteName, casteId, religionId },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    message.success("Added new sub-caste successfully");
    return response;
  } catch (error: any) {
    message.error("Unable to create a sub-caste");
    console.log("Error adding Sub-Caste:", error);
    throw error;
  }
};

export const addSubcasteBulkApi = async (
  electionId: number,
  formData: FormData
): Promise<AxiosResponse> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await axios.post(
      `${BASE_URL}/election-settings/subcastes/${electionId}/bulk-upload`,
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

// Edit an existing sub-caste
export const editSubCaste = async (
  subCasteId: number,
  payload: { religionId: number; casteId: number; subCasteName: string },
  electionId: number
) => {
  const jwtToken = localStorage.getItem("jwtToken");

  try {
    const response = await axios.put(
      `${BASE_URL}/election-settings/subcastes/${electionId}/${subCasteId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    message.success("Edited sub-caste successfully");
    return response;
  } catch (error: any) {
    message.error("Unable to edit sub-caste");
    console.log("Error editing Sub-Caste: ", error);
    throw error;
  }
};

//Update sub-caste order
export const updateSubCasteOrder = async (
  electionId: number,
  payload: { subCasteId: number; newOrderIndex: number }[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await axios.put(
      `${BASE_URL}/election-settings/subcastes/reorder/${electionId}`,
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
      error.response?.data?.message || "Error updating Sub-Castes order"
    );
    console.error("Error updating Sub-Castes order", error);
    throw error;
  }
};

// Delete a sub-caste
export const deleteSubCaste2 = async (
  subCasteId: number,
  electionId: number
) => {
  const jwtToken = localStorage.getItem("jwtToken");

  try {
    console.log("Sub-Caste id before deleting", subCasteId);
    const response = await axios.delete(
      `${BASE_URL}/election-settings/subcastes/${electionId}/${subCasteId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    message.success("Sub-Caste deleted successfully");
    return response;
  } catch (error: any) {
    message.error(error.response.data.message || "Unable to delete sub-caste");
    console.log("Error deleting Sub-Caste: ", error);
    throw error;
  }
};

export const deleteSubCaste = async (
  electionId: number,
  subCasteIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    console.log("SubCaste ids", subCasteIds);
    const params = new URLSearchParams();
    if (subCasteIds && subCasteIds.length > 0) {
      subCasteIds.forEach((id) => {
        params.append("subCasteIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/election-settings/subcastes/${electionId}`,
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
    const errorMessage = subCasteIds?.length
      ? "Error deleting SubCastes"
      : "Error deleting all SubCastes";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};
