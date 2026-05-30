import axios, { AxiosResponse } from "axios";
import { message } from "antd";
import { RcFile } from "antd/es/upload";
import { BASE_URL } from "../config";

interface AvailabilityData {
  description: string;
  categoryName: string;
}

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

// Fetch availability from cpanel
export const getCpanelAvailabilityApi = async () => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/cpanel/availability`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cpanel availability:", error);
    message.error(error.response?.data?.message || "Error fetching cpanel availability");
    throw error;
  }
};

export const addAvailabilityApi = async (
  DTO: AvailabilityData,
  file: RcFile,
  electionId: number
) => {
  try {
    const formData = new FormData();
    formData.append(
      "DTO",
      new Blob([JSON.stringify(DTO)], { type: "application/json" })
    );
    formData.append("file", file);
    console.log("DTO",DTO);

    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/availability/${electionId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
        transformRequest: [
          (data, headers) => {
            delete headers["Content-Type"];
            return data;
          },
        ],
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error creating Availability:", {
      message: error.message,
      response: error.response?.data,
    });
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

export const getAvailabilityApi = async (electionId: number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/availability/${electionId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching Availabilities:", error);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};
export const updateAvailabilityApi = async (
  DTO: AvailabilityData,
  electionId: number,
  availabilityId: number,
  file?: RcFile
) => {
  try {
    console.log("Update Availability Request Details:", {
      url: `${BASE_URL}/api/availability/${electionId}/${availabilityId}`,
      method: "PUT",
      DTO,
      electionId,
      availabilityId,
    });

    const jwtToken = await getjwtToken();
    console.log("Headers being sent:", {
      Authorization: `Bearer ${jwtToken?.substring(0, 20)}...`, // truncated for security
      // 'Content-Type': 'application/json',
      accept: "*/*",
    });
    console.log("AvailabilityId",availabilityId);
    const formData = new FormData();
    formData.append(
      "DTO",
      new Blob([JSON.stringify(DTO)], { type: "application/json" })
    );
    if (file) {
      // Ensure file is in the correct format
      const fileToUpload =
        file instanceof File
          ? file
          : new File([file as any], file.name, { type: file.type });
      formData.append("file", fileToUpload);
    }
    const response = await axios.put(
      `${BASE_URL}/api/availability/${electionId}/${availabilityId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );

    console.log("API Response:", {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error: any) {
    console.error("Error updating Availability:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
      },
    });

    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

export const updateAvailabilityOrder = async (
  electionId: number,
  payload: { availabilityId: string | number; newOrderIndex: number }[]
): Promise<AxiosResponse> => {
  try {
    console.log("payload",payload);
    const jwtToken = await getjwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/availability/${electionId}/reorder`,
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
      error.response?.data?.message || "Error updating Availability order"
    );
    console.error("Error updating Availability order", error);
    throw error;
  }
};

export const deleteAvailabilityApi = async (
  electionId: number,
  availabilityIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    console.log("Availability ids", availabilityIds);
    const params = new URLSearchParams();
    if (availabilityIds && availabilityIds.length > 0) {
      availabilityIds.forEach((id) => {
        params.append("availabilityIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/api/availability/${electionId}/availabilities`,
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
    const errorMessage = availabilityIds?.length
      ? "Error deleting Availabilities"
      : "Error deleting all Availabilities";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};