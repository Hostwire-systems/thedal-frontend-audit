import axios, { AxiosResponse } from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

// Get JWT token
const getJwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

//fetch dynamic fields
export const getDynamicFieldsApi = async (
  electionId: number,
  page = 0,
  size = 10
) => {
  try {
    const jwtToken = await getJwtToken();
    const params = {
      page,
      size,
    };
    const response = await axios.get(
      `${BASE_URL}/api/dynamic-fields/election/${electionId}`,
      {
        params,
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.log("Error fetching dynamic fields: ", error);
    throw error;
  }
};

//add dynamic field
export const addDynamicFieldApi = async (payload: any, electionId: number) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/dynamic-fields/election/${electionId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );
    message.success("Added new dynamic field successfully");
    return response;
  } catch (error: any) {
    message.error(
      error.response.data.message || "Unable to create a new dynamic field"
    );
    console.log("Error adding new dynamic field: ", error);
  }
};

//edit dynamic fields
export const editDynamicFieldApi = async (
  formData: any,
  fieldId: number,
  electionId: number
) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/dynamic-fields/election/${electionId}/field/${fieldId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );
    return response;
  } catch (error: any) {
    // message.error(error.response.data.message || "Unable to edit dynamic field");
    console.log("Error editing dynamic field: ", error);
  }
};

//Update dynamic field status
export const updateDynamicFieldStatus = async (
  electionId: number,
  fieldId: number,
  payload: { status: boolean }
) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/dynamic-fields/election/${electionId}/field/${fieldId}/status`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );
    message.success("Field status updated successfully");
    return response;
  } catch (error: any) {
    // message.error(error.response.data.message || "Unable to update status");
    console.log("Error editing dynamic field status: ", error);
  }
};

//Update all fields show status
export const updateAllDynamicFieldsStatus = async (
  electionId: number,
  payload: { status: boolean }
) => {
  try {
    const jwtToken = await getJwtToken();

    // Choose correct endpoint based on status
    const endpoint = payload.status
      ? `${BASE_URL}/api/dynamic-fields/election/${electionId}/enable-all`
      : `${BASE_URL}/api/dynamic-fields/election/${electionId}/disable-all`;

    const response = await axios.put(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    });

    message.success(
      `Status ${
        payload.status ? "enabled" : "disabled"
      } for all the fields successfully`
    );

    return response;
  } catch (error: any) {
    // message.error(
    //   error?.response?.data?.message ||
    //     "Unable to update status for all the fields"
    // );
    console.log("Error updating field status for all the fields:", error);
  }
};

//  Update all fields required status
export const updateAllDynamicFieldsRequired = async (
  electionId: number,
  payload: { status: boolean }
) => {
  try {
    const jwtToken = await getJwtToken();

    // Choose correct endpoint based on status
    const endpoint = payload.status
      ? `${BASE_URL}/api/dynamic-fields/election/${electionId}/require-all`
      : `${BASE_URL}/api/dynamic-fields/election/${electionId}/optional-all`;

    const response = await axios.put(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    });

    message.success(
      `Required status ${
        payload.status ? "enabled" : "disabled"
      } for all the fields successfully`
    );

    return response;
  } catch (error: any) {
    message.error(
      error?.response?.data?.message ||
        "Unable to update required status for all the fields"
    );
    console.log(
      "Error updating field required status for all the fields:",
      error
    );
  }
};

//update dynamic field order
export const updateDynamicFieldOrder = async (
  electionId: number,
  payload: { fieldId: number; newOrderIndex: number }[]
): Promise<AxiosResponse> => {
  try {
    console.log("Payload");
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/dynamic-fields/${electionId}/reorder`,
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
    return response;
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Error updating Dynamic fields order"
    );
    console.error("Error updating Dynamic fields order", error);
    throw error;
  }
};

// delete dynamic field
export const deleteDynamicFieldApi = async (
  electionId: number,
  fieldId: number | string
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();

    const response = await axios.delete(
      `${BASE_URL}/api/dynamic-fields/election/${electionId}/field/${fieldId}`,
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
      error.response?.data?.message || "Error deleting dynamic field"
    );
    console.error("Error deleting dynamic field", error);
    throw error;
  }
};

//fetch saved fields
export const getSavedFieldsApi = async (electionId: number) => {
  try {
    const jwtToken = await getJwtToken();

    const response = await axios.get(
      `${BASE_URL}/api/voter-field-order/election/${electionId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.log("Error fetching saved fields: ", error);
    throw error;
  }
};

//update dynamic field order
export const updateFieldsOrderApi = async (
  electionId: number,
  payload: { fields: { name: number; newOrderIndex: number }[] }
): Promise<AxiosResponse> => {
  try {
    console.log("Payload before updating order", payload);

    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/voter-field-order/election/${electionId}/reorder`,
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
    return response;
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Error updating fields order"
    );
    console.error("Error updating fields order", error);
    throw error;
  }
};
