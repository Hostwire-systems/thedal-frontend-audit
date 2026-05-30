import axios, { AxiosResponse } from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

// Fetch caste categories from cpanel
export const getCpanelCasteCategoriesApi = async () => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await axios.get(
      `${BASE_URL}/api/v1/cpanel/caste-categories`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cpanel caste categories:", error);
    // message.error(
    //   error.response?.data?.message || "Error fetching cpanel caste categories"
    // );
    throw error;
  }
};

// Fetch all castes categories by electionId
export const fetchCasteCategories = async (electionId: number) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const url = `${BASE_URL}/api/v1/election-settings/caste-categories/${electionId}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        accept: "*/*",
      },
    });
    return response.data;
  } catch (error: any) {
    console.log("Error fetching Caste categories: ", error);
    throw error;
  }
};

// Add a new caste category
export const addCasteCategory = async (
  casteCategoryName: string,
  electionId: number
) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    console.log(
      "caste category name" + casteCategoryName,
      "election id" + electionId
    );
    const response = await axios.post(
      `${BASE_URL}/api/v1/election-settings/caste-categories/${electionId}`,
      { casteCategoryName },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    message.success("Added new caste category successfully");
    return response;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Unable to create a caste category");
    console.log("Error adding Caste category:", error);
  }
};
  // Edit caste category
export const editCasteCategory = async (
  casteCategoryId: number,
  payload: { casteCategoryName: string },
  electionId: number
) => {
  const jwtToken = localStorage.getItem("jwtToken");
  try {
    const response = await axios.put(
      `${BASE_URL}/api/v1/election-settings/caste-categories/${electionId}/${casteCategoryId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    message.success("Edited caste category successfully");
    return response;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Unable to edit caste category");
    console.error("Error edit Caste category: ", error);
  }
};

//Update caste category order
export const updateCasteCategoryOrder = async (
  electionId: number,
  payload: { casteCategoryId: number; newOrderIndex: number }[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await axios.put(
      `${BASE_URL}/api/v1/election-settings/caste-categories/reorder/${electionId}`,
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
      error.response?.data?.message || "Error updating Caste categories order"
    );
    console.error("Error updating Caste categories order", error);
    throw error;
  }
};

// Delete caste categories
export const deleteCasteCategory = async (
  electionId: number,
  casteCategoryIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    console.log("caste ids", casteCategoryIds);
    const params = new URLSearchParams();
    if (casteCategoryIds && casteCategoryIds.length > 0) {
      casteCategoryIds.forEach((id) => {
        params.append("casteCategoryIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/api/v1/election-settings/caste-categories/${electionId}`,
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
    const errorMessage = casteCategoryIds?.length
      ? "Error deleting caste categories"
      : "Error deleting all caste categories";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};
