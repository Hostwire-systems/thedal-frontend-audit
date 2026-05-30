import axios, { AxiosResponse } from "axios";
import { BASE_URL } from "../config";
import { message } from "antd";

interface LanguageData {
  languageName: string;
}

const getJwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const getLanguagesApi = async (electionId: number) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(`${BASE_URL}/api/language/${electionId}`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching languages:", error);
    //message.error(error.response?.data?.message || "Error fetching languages");
    throw error;
  }
};

export const getCpanelLanguagesApi = async () => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(`${BASE_URL}/api/cpanel/language`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching languages:", error);
    //message.error(error.response?.data?.message || "Error fetching languages");
    throw error;
  }
};

export const addLanguageApi = async (
  payload: LanguageData,
  electionId: number
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/language/${electionId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    //message.success("Language created successfully");
    return response.data;
  } catch (error: any) {
    console.error("Error creating language:", error);
    message.error(error.response?.data?.message || "Error creating language");
    throw error;
  }
};

export const updateLanguageApi = async (
  payload: LanguageData,
  electionId: number,
  languageId: number
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/language/${electionId}/${languageId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    //message.success("Language updated successfully");
    return response.data;
  } catch (error: any) {
    console.error("Error updating language:", error);
    message.error(error.response?.data?.message || "Error updating language");
    throw error;
  }
};

export const updateLanguageOrder = async (
  electionId: number,
  payload: { languageId: number; newOrderIndex: number }
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/language/${electionId}/reorder`,
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
      error.response?.data?.message || "Error updating Language order"
    );
    console.error("Error updating Language order", error);
    throw error;
  }
};

export const deleteLanguageApi = async (
  electionId: number,
  languageIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    console.log("Language ids", languageIds);
    const params = new URLSearchParams();
    if (languageIds && languageIds.length > 0) {
      languageIds.forEach((id) => {
        params.append("languageIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/api/language/${electionId}/languages`,
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
    const errorMessage = languageIds?.length
      ? "Error deleting Languages"
      : "Error deleting all Languages";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};