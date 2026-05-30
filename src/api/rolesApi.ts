import axios from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";
interface Role {
  key: string;
  roleName: string;
  permission: string[];
  description: string;
}
interface FormData {
  roleName: string;
  permission: string[];
  description: string;
}

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const fetchRoles = async () => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(`${BASE_URL}/role`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching roles: ", error);
    throw error;
  }
};

export const addRole = async (formData: FormData) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(`${BASE_URL}/role`, formData, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        accept: "*/*",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error adding role: ", error);
    message.error(error.response.data.message || "Unable to add role");
    throw error;
  }
};

export const deleteRoleApi = async (roleId:number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.delete(`${BASE_URL}/role/${roleId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        accept: "*/*",
      },
    });
    message.success("Role deleted successfully!");
    return response.data;
  } catch (error: any) {
    message.error(error.response.data.message || "Unable to delete role");
    console.error("Error deleting role: ", error);
    throw error;
  }
};
