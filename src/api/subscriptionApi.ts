import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080";

const getAuthHeader = () => {
  const token = localStorage.getItem("jwtToken");
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

// ===================== USER SUBSCRIPTION APIs =====================

export const getMyModuleAccess = async () => {
  const response = await axios.get(
    `${BASE_URL}/api/v1/subscription/my-modules`,
    getAuthHeader()
  );
  return response.data;
};

export const getUserModuleAccess = async (userId) => {
  const response = await axios.get(
    `${BASE_URL}/api/v1/subscription/users/${userId}/access`,
    getAuthHeader()
  );
  return response.data;
};

export const checkModuleAccess = async (userId, moduleKey) => {
  const response = await axios.get(
    `${BASE_URL}/api/v1/subscription/users/${userId}/has-access?moduleKey=${moduleKey}`,
    getAuthHeader()
  );
  return response.data;
};

export const getAllModules = async (hierarchy = true) => {
  const response = await axios.get(
    `${BASE_URL}/api/v1/subscription/modules?hierarchy=${hierarchy}`,
    getAuthHeader()
  );
  return response.data;
};
