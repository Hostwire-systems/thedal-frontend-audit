import axios, { AxiosResponse } from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

// Get JWT token
const getJwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

//fetch aadhaar verified users
export const getAadhaarDetails = async (electionId: number) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/aadhaar/election/${electionId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetch aadhaar details: ", error);
    throw error;
  }
};

// delete a record
export const deleteAadhaar = async (
  electionId: number,
  id: number
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    console.log({electionId,id});
    const response = await axios.delete(
      `${BASE_URL}/api/aadhaar/${id}/election/${electionId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Error deleting Aadhaar record"
    );
    console.error("Error deleting Aadhaar record", error);
    throw error;
  }
};
