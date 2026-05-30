import axios from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";
const jwtToken = localStorage.getItem("jwtToken");


export const fetchElectionTypes = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/election-settings/election-types`,
     
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type":"application/json"
        },
      }
    );
    return response;
  } catch (error: any) {
    message.error(error.response.data.message || "Unable to fetch Election Types");
    console.log("Error fetching Election Types: ", error);
    throw error;
  }
};

export const addElectionType = async (electionType: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/election-settings/election-types`,
      {
        electionType,
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type":"application/json"
        },
      }
    );
    message.success("Added new Election Type successfully");
    return response;
  } catch (error: any) {
    message.error(error.response.data.message || "Unable to create a Election Type");
    console.log("Error adding Election Type: ", error);
    throw error;
  }
};

export const editElectionType = async (
  electionType: String,
  id: Number
) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/election-settings/election-types/${id}`,
      {
        electionType,
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    message.success("Edited Election Type successfully");
    return response;
  } catch (error: any) {
    message.error(error.response.data.message || "Unable to edit Election Type");
    console.log("Error editing Election Type: ", error);
  }
};

export const deleteElectionType = async (id: Number) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/election-settings/election-types/${id}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    message.success("Election Type deleted successfully");
    return response;
  } catch (error: any) {
    message.error(error.response.data.message || "Unable to delete Election Type");
    console.log("Error deleting Election Type: ", error);
  }
};