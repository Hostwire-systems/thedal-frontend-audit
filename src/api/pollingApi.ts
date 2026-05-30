import axios, { AxiosResponse } from "axios";

import { BASE_URL } from "../config";
import { message } from "antd";

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const getPollDayDataAgeWise = async (
  electionId: number
): Promise<AxiosResponse> => {
  try {
    console.log("electionId", electionId);
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/poll-day/election/polling-age-graph/${electionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    console.log("getPollDayDataAgeWise", response);

    return response.data;
  } catch (error) {
    console.error("Error fetching poll-day age wise data:", error);
    throw error;
  }
};

export const getPollingDataInEachBooth = async (
  electionId: number
): Promise<AxiosResponse> => {
  try {
    console.log("electionId", electionId);
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/poll-day/election/polling-each-booth/${electionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    console.log("getPollingDataInEachBooth", response);
    return response.data;
  } catch (error) {
    console.error("Error fetching poll-day booth wise data:", error);
    throw error;
  }
};

export const getPollingDataAgeWise = async (
  electionId: number
): Promise<AxiosResponse> => {
  try {
    console.log("electionId", electionId);
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/poll-day/election/polling-age-graph/${electionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    console.log("getPollingDataAgeWise", response);

    return response.data;
  } catch (error) {
    console.error("Error fetching poll-day age wise data:", error);
    throw error;
  }
};

export const pollingDataTimeWise = async (
  electionId: number,
  booth: number | string
): Promise<AxiosResponse> => {
  try {
    console.log("electionId", electionId);
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/poll-day/election/${electionId}/booth-wise-timing/${booth}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    console.log("pollingDataTimeWise", response);

    return response.data;
  } catch (error) {
    console.error("Error fetching poll-day timing wise data:", error);
    throw error;
  }
};
