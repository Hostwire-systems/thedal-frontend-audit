import axios, { AxiosResponse } from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

interface CustomFormPayload {
  formName: string;
  customFields: Record<string, any>[]; // Array of objects with dynamic keys
  isActive: boolean;
}

// Get JWT token
const getJwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

//fetch custom forms
export const getForms = async (electionId: number) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/survey-forms/election/${electionId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.log("Error fetching custom forms: ", error);
    throw error;
  }
};

// fetch submissions for a specific form
export const getFormSubmissions = async (
  electionId: number,
  formId: string | number,
  options?: {
    page?: number;
    size?: number;
    sortBy?: string;
    order?: "asc" | "desc";
  }
) => {
  try {
    const jwtToken = await getJwtToken();

    const {
      page = 0,
      size = 10,
      sortBy = "submittedAt",
      order = "desc",
    } = options || {};

    const response = await axios.get(
      `${BASE_URL}/api/survey-forms/election/${electionId}/form/${formId}/submissions`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
        params: {
          page,
          size,
          sortBy,
          order,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.log("Error fetching form data: ", error);
    throw error;
  }
};

//add custom forms
export const addForm = async (electionId: number, payload: any) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/survey-forms/election/${electionId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    message.error(
      error.response.data.message || "Unable to create a custom from"
    );
    console.error("Error adding custom from: ", error);
  }
};

//edit custom form
export const editForm = async (
  electionId: number,
  formId: number | string,
  formData: any
) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/survey-forms/election/${electionId}/form/${formId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );
    message.success("Form updated successfully");
    return response.data;
  } catch (error: any) {
    message.error(error.response.data.message || "Unable to edit religion");
    console.error("Error editing form: ", error);
  }
};

// toggle status
export const toggleFormStatus = async (
  electionId: number,
  formId: number | string,
  formData: any
) => {
  try {
    const jwtToken = await getJwtToken();
    console.log("Form status", formData);
    console.log("Form id", typeof(formId));
    
    const response = await axios.put(
      `${BASE_URL}/api/survey-forms/election/${electionId}/form/${formId}/status`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    // message.error(error.response.data.message || "Unable to edit religion");
    console.log("Error updating form status: ", error);
  }
};

//update forms order
export const updateFormOrder = async (
  electionId: number,
  payload: { formId: number; newOrderIndex: number }
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/survey-forms/${electionId}/reorder`,
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
      error.response?.data?.message || "Error updating Forms order"
    );
    console.error("Error updating Forms order", error);
    throw error;
  }
};

export const updateCustomFieldOrderApi = async (
  electionId: number,
  formId: string,
  payload: Array<{ fieldLabel: string; newOrderIndex: number }>
) => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/survey-forms/election/${electionId}/form/${formId}/fields/reorder`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// delete form
export const deleteForm = async (
  electionId: number,
  formIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    console.log("form ids", formIds);
    const params = new URLSearchParams();
    if (formIds && formIds.length > 0) {
      formIds.forEach((id) => {
        params.append("formIds", id.toString());
      });
    }

    const response = await axios.delete(
      `${BASE_URL}/api/survey-forms/election/${electionId}/forms`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params: params,
      }
    );
    return response.data;
  } catch (error: any) {
    const errorMessage = formIds?.length
      ? "Error deleting forms"
      : "Error deleting all forms";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};
