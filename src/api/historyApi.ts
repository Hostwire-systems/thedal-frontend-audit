import axios, { AxiosResponse } from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

// Get JWT token
const getJwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

//fetch history
export const fetchHistory = async (electionId: number) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/voter-history/${electionId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    return response;
  } catch (error: any) {
    console.log("Error fetching voter history: ", error);
    throw error;
  }
};

//add history
export const addHistory = async (formData: FormData, electionId: number) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/voter-history/${electionId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    message.success("Added new voting history successfully");
    return response;
  } catch (error: any) {
    // message.error(error.response.data.message || "Unable to create a voting history");
    console.log("Error adding voting history: ", error);
    throw error;

  }
};

//edit history
export const editHistory = async (
  formData: FormData,
  voterHistoryId: number,
  electionId: number
) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/voter-history/${electionId}/${voterHistoryId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    message.success("Edited voting history successfully");
    return response;
  } catch (error: any) {
    // message.error(error.response.data.message || "Unable to edit voter history");
    console.log("Error editing voting history: ", error);
  }
};

//update history order
export const updateHistoryOrder = async (
  electionId: number,
  payload: { voterHistoryId: number; newOrderIndex: number }
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/voter-history/${electionId}/reorder`,
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
      error.response?.data?.message || "Error updating voting history order"
    );
    console.error("Error updating voting history order", error);
    throw error;
  }
};

// delete history
export const deleteHistory = async (
  electionId: number,
  voterHistoryIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    console.log("Voter history ids", voterHistoryIds);
    const params = new URLSearchParams();
    if (voterHistoryIds && voterHistoryIds.length > 0) {
      voterHistoryIds.forEach((id) => {
        params.append("voterHistoryIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/api/voter-history/${electionId}`,
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
    const errorMessage = voterHistoryIds?.length
      ? "Error deleting Voting History"
      : "Error deleting all Voting History";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};

// Fetch cpanel history
export const getCpanelHistoriesApi = async () => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/cpanel/voter-history`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cpanel voting histories:", error);
    message.error(error.response?.data?.message || "Error fetching cpanel voting histories");
    throw error;
  }
};