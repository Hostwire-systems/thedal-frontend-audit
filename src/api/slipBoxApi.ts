import axios from "axios";
import { BASE_URL } from "../config";
import { message } from "antd";

const getJwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const getSlipBoxApi = async () => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(`${BASE_URL}/api/slip-boxes`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching slip boxes:", error);
    message.error(error.response?.data?.message || "Error fetching slip boxes");
    throw error;
  }
};

export const getCpanelSlipBoxApi = async () => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(`${BASE_URL}/api/cpanel/slip-box`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cpanel slip boxes:", error);
    message.error(
      error.response?.data?.message || "Error fetching cpanel slip boxes"
    );
    throw error;
  }
};

export const addSlipBoxApi = async (payload: any) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.post(`${BASE_URL}/api/slip-boxes`, payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error creating slip box:", error);
    message.error(error.response?.data?.message || "Error creating slip box");
    throw error;
  }
};

export const deleteSlipBoxApi = async (slipBoxId) => {
  try {
    const jwtToken = await getJwtToken();
    console.log("slip box ids", slipBoxId);
    const params = new URLSearchParams();
    if (slipBoxId && slipBoxId.length > 0) {
      slipBoxId.forEach((id) => {
        params.append("slipBoxIds", id);
      });
    }
    console.log("params", params);
    const response = await axios.delete(`${BASE_URL}/api/slip-boxes`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
      params,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error deleting slip boxes:", error);
    message.error(error.response?.data?.message || "Error deleting slip boxes");
    throw error;
  }
};
