import axios, { AxiosResponse } from "axios";
import { RcFile } from "antd/es/upload";
import { message } from "antd";
import { BASE_URL } from "../config";

interface Party {
  key: number;
    allianceName: string;
  partyName: string;
  partyShortName: string;
  partyColor: string;
  partyImage: string;
}

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const fetchParties = async (electionId: number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/election-settings/parties/election/${electionId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching parties: ", error);
    // message.error(error.response.data.message || "Unable to fetch Parties");
    throw error;
  }
};

// New function to fetch parties from cpanel
export const getCpanelPartiesApi = async () => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(`${BASE_URL}/api/cpanel/parties`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cpanel parties:", error);
    message.error(
      error.response?.data?.message || "Error fetching cpanel parties"
    );
    throw error;
  }
};

export const addParty = async (
  electionId: number,
  allianceName: string,
  partyName: string,
  partyShortName: string,
  partyColor: string,
  partyImage: RcFile
) => {
  const formData = new FormData();
  formData.append("allianceName", allianceName);
  formData.append("partyName", partyName);
  formData.append("partyShortName", partyShortName);
  formData.append("partyColor", partyColor);
  formData.append("partyImage", partyImage); // Append the image file
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/election-settings/parties/${electionId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error adding party: ", error);
    let errorMessage = error.response?.data?.message || "Unable to add party";

    if (errorMessage === "Duplicate party name is found") {
      errorMessage = "Party with same name already exists";
    }

    message.error(errorMessage);
    throw error;
  }
};

export const editParty = async (
  partyId: number,
  allianceName: string,
  partyName: string,
  partyShortName: string,
  partyColor: string,
  partyImage: RcFile | null,
  electionId: number
) => {
  const formData = new FormData();
  
  formData.append("allianceName", allianceName);
  formData.append("partyName", partyName);
  formData.append("partyShortName", partyShortName);
  formData.append("partyColor", partyColor);
  if (partyImage) formData.append("partyImage", partyImage); // Append the new image if present

  try {
    const jwtToken = await getjwtToken();

    const response = await axios.put(
      `${BASE_URL}/election-settings/parties/${partyId}/elections/${electionId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error editing party: ", error);
    message.error(error.response.data.message || "Unable to edit party");
    throw error;
  }
};

export const deleteParty = async (
  electionId: number,
  partyIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    console.log("Party ids", partyIds);
    const params = new URLSearchParams();
    if (partyIds && partyIds.length > 0) {
      partyIds.forEach((id) => {
        params.append("partyIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/election-settings/parties/elections/${electionId}`,
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
    const errorMessage = partyIds?.length
      ? "Error deleting Parties"
      : "Error deleting all Parties";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};

//update party order
export const updatePartyOrder = async (
  electionId: number,
  payload: {
    partyID: number;
    newOrderIndex: number;
  }
): Promise<AxiosResponse> => {
  try {
    console.log("payload for party reorder", payload);
    const jwtToken = await getjwtToken();
    const response = await axios.put(
      `${BASE_URL}/election-settings/${electionId}/reorder`,
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
      error.response?.data?.message || "Error updating Party order"
    );
    console.error("Error updating Party order", error);
    throw error;
  }
};

// Set default party for an election
export const setDefaultParty = async (
  electionId: number,
  partyId: number
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/elections/${electionId}/default-party`,
      { partyId },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    message.success("Default party set successfully!");
    return response.data;
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Error setting default party"
    );
    console.error("Error setting default party", error);
    throw error;
  }
};

// Get default party for an election
export const getDefaultParty = async (
  electionId: number
): Promise<{ partyId: number | null }> => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/elections/${electionId}/default-party`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    // Map the API response structure to expected format
    return { partyId: response.data.data?.defaultPartyId || null };
  } catch (error: any) {
    if (error.response?.status === 404) {
      // No default party set yet
      return { partyId: null };
    }
    console.error("Error fetching default party", error);
    throw error;
  }
};
