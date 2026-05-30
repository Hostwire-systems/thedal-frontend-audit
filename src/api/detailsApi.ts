import axios from "axios";
import { BASE_URL } from "../config";
import { message } from "antd";

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const getWhatsappDetailsAPI = async (electionId:number,accountId:number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(`${BASE_URL}/api/dashboard/whatsapp/details`, {
      params: {
        electionId: electionId,
        accountId:accountId
      },
        headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Unable to fetch whatsapp details");
    throw error.response ? error.response.data : error;
  }
};

export const getSmsDetailsAPI = async (electionId:number,accountId:number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(`${BASE_URL}/api/dashboard/sms/details`, {
      params: {
        electionId: electionId,
        accountId:accountId
      },
        headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Unable to fetch sms details");
    throw error.response ? error.response.data : error;
  }
};

export const getFamilySlipDetailsAPI = async (electionId:number,accountId:number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(`${BASE_URL}/api/dashboard/family-slip/details`, {
      params: {
        electionId: electionId,
        accountId:accountId
      },
        headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Unable to fetch family slip details");
    throw error.response ? error.response.data : error;
  }
};

export const getBenefitSlipDetailsAPI = async (electionId:number,accountId:number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(`${BASE_URL}/api/dashboard/benefit-slip/details`, {
      params: {
        electionId: electionId,
        accountId:accountId
      },
        headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Unable to fetch benefit slip details");
    throw error.response ? error.response.data : error;
  }
};
