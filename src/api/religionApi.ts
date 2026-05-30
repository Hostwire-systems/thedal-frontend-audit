import axios, { AxiosResponse } from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

interface Religion {
  key: string;
  religionName: string;
  religionColor: string;
}

// Get JWT token
const getJwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

// Fetch cpanel religions
export const getCpanelReligionsApi = async () => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/cpanel/religions`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cpanel religions:", error);
    message.error(error.response?.data?.message || "Error fetching cpanel religions");
    throw error;
  }
};

//fetch religion
export const fetchReligion = async (electionId: number) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(
      `${BASE_URL}/election-settings/religions/${electionId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    return response;
  } catch (error: any) {
    console.log("Error fetch Religion: ", error);
    throw error;
  }
};

//add religion
export const addReligion = async (formData: FormData, electionId: number) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.post(
      `${BASE_URL}/election-settings/religions/${electionId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    message.success("Added new religion successfully");
    return response;
  } catch (error: any) {
    message.error(error.response.data.message || "Unable to create a religion");
    console.log("Error add Religion: ", error);
  }
};

//edit religion
export const editReligion = async (
  formData: FormData,
  religionId: number,
  electionId: number
) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/election-settings/religions/${electionId}/${religionId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    message.success("Edited religion successfully");
    return response;
  } catch (error: any) {
    // message.error(error.response.data.message || "Unable to edit religion");
    console.log("Error edit Religion: ", error);
  }
};

//update religion order
export const updateReligionOrder = async (
  electionId: number,
  payload: { religionId: number; newOrderIndex: number }
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/election-settings/reorder/${electionId}`,
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
      error.response?.data?.message || "Error updating Religion order"
    );
    console.error("Error updating Religion order", error);
    throw error;
  }
};

// delete religion order
export const deleteReligion = async (
  electionId: number,
  religionIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    console.log("Religion ids", religionIds);
    const params = new URLSearchParams();
    if (religionIds && religionIds.length > 0) {
      religionIds.forEach((id) => {
        params.append("religionIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/election-settings/religions/${electionId}`,
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
    const errorMessage = religionIds?.length
      ? "Error deleting Religions"
      : "Error deleting all Religions";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};