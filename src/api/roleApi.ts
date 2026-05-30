import { message } from "antd";
import axios from "axios";
import { BASE_URL } from "../config";

export const addRoleApi = async (payload: any) => {
  console.log(payload);
  try {
    const response = await axios.post(`${BASE_URL}/role`, payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
      },
    });
    // message.success("Role added successfully!");
    return response.data;
  } catch (error: any) {
    //message.error(error.response?.data?.message || "Failed to add role");
    throw error.response ? error.response.data : error;
  }
};

export const fetchRolesApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/role`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
      },
    });
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Failed to fetch roles");
    throw error.response ? error.response.data : error;
  }
};

export const updateRoleApi = async (roleId: number, payload: any) => {
  try {
    const response = await axios.put(`${BASE_URL}/role/${roleId}`, payload, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
      },
    });
    // message.success("Role updated successfully!");
    return response.data;
  } catch (error: any) {
    console.log("Error updating role", error);
    message.error(error.response?.data?.message || "Failed to update role");
    throw error.response ? error.response.data : error;
  }
};

export const deleteRoleApi = async (roleId: number) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await axios.delete(`${BASE_URL}/role/${roleId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        accept: "*/*",
      },
    });
    // message.success("Role deleted successfully!");
    return response.data;
  } catch (error: any) {
    message.error(error.response.data.message || "Unable to delete role");
    console.error("Error deleting role: ", error);
    throw error;
  }
};
