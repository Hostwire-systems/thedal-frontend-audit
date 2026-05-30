import axios, { AxiosResponse } from "axios";
import { BASE_URL } from "../config";
import { message } from "antd";

interface FeedbackData {
  issueName: string;
}

const getJwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const getFeedbackApi = async (electionId: number) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(`${BASE_URL}/api/feedback/${electionId}`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching feedbacks:", error);
    throw error;
  }
};

export const getCpanelFeedbackApi = async () => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(`${BASE_URL}/api/cpanel/feedback`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cpanel feedbacks:", error);
    throw error;
  }
};

export const getCpanelFeedbacksApi = async () => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(`${BASE_URL}/api/cpanel/feedback`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching feedbacks:", error);
    throw error;
  }
};

export const addFeedbackApi = async (
  payload: FeedbackData,
  electionId: number
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/feedback/${electionId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error creating feedback:", error);
    throw error;
  }
};

export const updateFeedbackApi = async (
  payload: FeedbackData,
  electionId: number,
  issueId: number
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/feedback/${electionId}/${issueId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating feedback:", error);
    message.error(error.response?.data?.message || "Error updating feedback");
    throw error;
  }
};

export const updateFeedbackOrder = async (
  electionId: number,
  payload: { issueId: number; newOrderIndex: number }
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/feedback/${electionId}/reorder`,
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
      error.response?.data?.message || "Error updating Feedback order"
    );
    console.error("Error updating Feedback order", error);
    throw error;
  }
};

export const deleteFeedbackApi = async (
  electionId: number,
  issueIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    console.log("Issue ids", issueIds);
    const params = new URLSearchParams();
    if (issueIds && issueIds.length > 0) {
      issueIds.forEach((id) => {
        params.append("issueIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/api/feedback/${electionId}/issues`,
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
    const errorMessage = issueIds?.length
      ? "Error deleting Feedback"
      : "Error deleting all Feedback";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};
