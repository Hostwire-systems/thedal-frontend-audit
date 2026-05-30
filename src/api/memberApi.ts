import axios, { AxiosResponse } from "axios";
import { message, notification } from "antd";
import { BASE_URL } from "../config";

const getJwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const getMembersApi = async (electionId: number) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/member/${electionId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.log("Error fetching Member: ", error);
    throw error;
  }
};

// New API to check member by EPIC number
export const checkMemberByEpicNumber = async (electionId: number, epicNumber: string) => {
  try {
    console.log(`🔍 checkMemberByEpicNumber called with:
      - electionId: ${electionId}
      - epicNumber: ${epicNumber}`);
    
    const jwtToken = await getJwtToken();
    console.log(`🔑 JWT token retrieved: ${jwtToken ? "Yes" : "No"}`);
    
    const url = `${BASE_URL}/api/member/${electionId}/members-data`;
    console.log(`🌐 Making API request to: ${url}?epicNumber=${epicNumber}`);
    
    const response = await axios.get(
      url,
      {
        params: {
          epicNumber: epicNumber
        },
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    
    console.log(`✅ API response received:`, response.status, response.statusText);
    console.log(`📦 Response data:`, JSON.stringify(response.data, null, 2).substring(0, 200) + "...");
    
    return response;
  } catch (error: any) {
    console.error("❌ Error checking member by EPIC:", error);
    console.error("❌ Error details:", error.response?.status, error.response?.statusText);
    console.error("❌ Error data:", error.response?.data);
    
    // Rethrow the error for the caller to handle
    throw error;
  }
};

export const addMemberApi = async (formData, electionId: number) => {
  try {
    const jwtToken = await getJwtToken();
    // EPIC number will now be included in formData
    const response = await axios.post(
      `${BASE_URL}/api/member/election/${electionId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );
    return response;
  } catch (error: any) {
    message.error(error.response.data.message || "Unable to create a member");
    console.log("Error adding member: ", error);
  }
};

export const addMemberBulkApi = async (
  electionId: number,
  formData: FormData
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    // FormData will include EPIC number from the CSV file
    const response = await axios.post(
      `${BASE_URL}/api/member/${electionId}/upload`,
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

    console.error("Error uploading members:", error);
    throw error;
  }
};


export const updateMemberApi = async (electionId, data) => {
  try {
    const jwtToken = await getJwtToken();
    console.log("Data going to be updated", data);
    const memberId=Number(data.id);
    // EPIC number will now be included in data for updates

    const response = await axios.put(
      `${BASE_URL}/api/member/${electionId}/${memberId}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    console.log("updatedMember response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error updating member:", error);
    console.error("Error response:", error.response?.data);
    message.error(
      error.response?.data?.message ||
        "An error occurred while updating the member"
    );
    throw error.response ? error.response.data : error;
  }
};

export const deleteMember = async (
  electionId: number,
  memberIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    console.log("Member ids", memberIds);
    const params = new URLSearchParams();
    if (memberIds && memberIds.length > 0) {
      memberIds.forEach((id) => {
        params.append("memberIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/api/member/election/${electionId}`,
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
    const errorMessage = memberIds?.length
      ? "Error deleting Members"
      : "Error deleting all Members";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};