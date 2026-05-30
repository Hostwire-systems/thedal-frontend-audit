import { message } from "antd";
import axios, { AxiosResponse } from "axios";
import { BASE_URL } from "../config";
import { Election } from "../types";
import moment from "moment";

// Interface for the booth data structure
interface Booth {
  electionId: number;
  boothId: number;
  boothNumber: number;
}

interface BoothData {
  boothNumber: number;
  boothVulnerability: string | null;
}

// Interface for the paginated response
interface BoothResponse {
  status: string;
  code: number;
  message: string;
  data: {
    content: Booth[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
      };
      offset: number;
      paged: boolean;
      unpaged: boolean;
    };
    last: boolean;
    totalElements: number;
    totalPages: number;
    first: boolean;
    size: number;
    number: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    numberOfElements: number;
    empty: boolean;
  };
}

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const updateElectionImageApi = async (
  formData: FormData,
  electionId: number
) => {
  try {
    console.log("formData", formData);
    const jwtToken = await getjwtToken();
    const response = await axios.put(
      `${BASE_URL}/elections/${electionId}/election-image`,
      formData,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    message.error("Error uploading the image");
    throw error.response ? error.response.data : error;
  }
};

export const uploadElectionImageApi = async (formData: FormData) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/elections/election-image`,
      formData,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    message.error("Error uploading the image");
    throw error.response ? error.response.data : error;
  }
};

export const uploadElectionApi = async (data, electionId) => {
  try {
    const jwtToken = await getjwtToken();
    const formattedData = {
      ...data,
    };
    console.log("formattedData", formattedData);
    const response = await axios.put(
      `${BASE_URL}/elections/${electionId}`,
      formattedData,
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
    message.error("Error updating election");
    throw error.response ? error.response.data : error;
  }
};

export const reorderElectionsApi = async (payload) => {
  try {
    const jwtToken = await getjwtToken();
    console.log("electionId", payload.electionId);
    console.log("newIndex", payload.newIndex);
    const response = await axios.put(`${BASE_URL}/elections/reorder`, payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to reorder elections", error);
    throw error;
  }
};

export const getAllElectionsApi = async () => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(`${BASE_URL}/elections`, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "An error occurred");
    throw error.response ? error.response.data : error;
  }
};

export const deleteElectionApi = async (electionId: string) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.delete(`${BASE_URL}/elections/${electionId}`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "An error occurred");
    throw error.response ? error.response.data : error;
  }
};

export const confirmElectionDeleteApi = async (userId: number, otp: string) => {
  try {
    const jwtToken = await getjwtToken();
    let format_otp=otp.toString();

    const response = await axios.post(
      `${BASE_URL}/elections/verify-otp?userId=${userId}&otp=${format_otp}`,
      {},
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error: any) {
    message.error(error.response?.data?.message || "An error occurred");
    throw error.response ? error.response.data : error;
  }
};

export const getElectionBanners = async (electionId: number) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const response = await axios.get(
      `${BASE_URL}/elections/banner-image/${electionId}`,
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
    message.error(error.response?.data?.message || "An error occurred");
    throw error.response ? error.response.data : error;
  }
};

export const getWhatsappFooter = async (electionId: number) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const response = await axios.get(
      `${BASE_URL}/elections/whatsapp-footer/${electionId}`,
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
    throw error.response ? error.response.data : error;
  }
};

export const deleteElectionBanner = async (
  electionId: number,
  fileIds?: string[] | number[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    console.log("Banner file ids", fileIds);
    const params = new URLSearchParams();
    if (fileIds && fileIds.length > 0) {
      fileIds.forEach((id) => {
        params.append("fileIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/elections/banner-image/${electionId}`,
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
    const errorMessage = fileIds?.length
      ? "Error deleting Election Banners"
      : "Error deleting all Election Banners";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};

export const addElectionBanner = async (
  electionId: number,
  formData: FormData
) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const response = await axios.post(
      `${BASE_URL}/elections/banner-image/${electionId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "An error occurred");
    throw error.response ? error.response.data : error;
  }
};

export const reorderElectionBanner = async (
  electionId: number,
  payload: { fileId: number; newOrderIndex: number }
) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const response = await axios.put(
      `${BASE_URL}/elections/${electionId}/files/reorder`,
      payload,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "An error occurred");
    throw error.response ? error.response.data : error;
  }
};

export const updateWhatsappStatus = async (
  electionId: number | string,
  fileId: string | number,
  whatsappForward: boolean
) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }
    console.log("whatsappForward", whatsappForward);
    console.log("fileId", fileId);
    const updateData = {
      fileId,
      whatsappForward,
    };
    const response = await axios.put<TemplateResponse>(
      `${BASE_URL}/elections/banner-image/whatsapp-forward/${electionId}`,
      updateData,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.data.status !== "success") {
      throw new Error(
        response.data.message || "Error updating whatsapp forward status"
      );
    }

    return response.data.data?.[0] || null;
  } catch (error: any) {
    console.error("Error updating whatsapp forward status:", error);
    message.error(
      error.response?.data?.message || "Error updating whatsapp forward status"
    );
    return null;
  }
};

export const updateImageStatus = async (
  electionId: number | string,
  payload: { fileId: string | number; isActive: boolean }
) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }
    console.log("Image status payload", payload);

    const response = await axios.put<TemplateResponse>(
      `${BASE_URL}/elections/banner-image/active-status/${electionId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.data.status !== "success") {
      throw new Error(
        response.data.message || "Error updating app banner status"
      );
    }

    return response.data.data?.[0] || null;
  } catch (error: any) {
    console.error("Error updating whatsapp forward status:", error);
    message.error(
      error.response?.data?.message || "Error updating whatsapp forward status"
    );
    return null;
  }
};

export const updateWhatsappFooter = async (
  electionId: number | string,
  whatsappFooter: string | null
) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }
    console.log("whatsappFooter", whatsappFooter);

    const response = await axios.put<TemplateResponse>(
      `${BASE_URL}/elections/whatsapp-footer/${electionId}`,
      { whatsappFooter },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.data.status !== "success") {
      throw new Error(
        response.data.message || "Error updating whatsapp footer"
      );
    }

    return response.data.data?.[0] || null;
  } catch (error: any) {
    console.error("Error updating whatsapp footer", error);
    message.error(
      error.response?.data?.message || "Error updating whatsapp footer"
    );
    return null;
  }
};

/**
 * Fetches the list of booths for a specific election
 * @param electionId - The ID of the election to fetch booths for
 * @returns Promise with the booth data
 */
export const getBoothsByElectionId = async (
  electionId: string
): Promise<BoothResponse> => {
  try {
    const jwtToken = await localStorage.getItem("jwtToken");

    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const response = await axios.get<BoothResponse>(
      `${BASE_URL}/booths/${electionId}?size=1200`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.data.status !== "success") {
      throw new Error(response.data.message || "Failed to fetch booths");
    }

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Error fetching booths";
    // message.error(errorMessage);
    throw error;
  }
};

// create booth
export const createBoothByElectionId = async (
  boothData: BoothData,
  electionId: string
): Promise<BoothResponse> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");

    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const response = await axios.post<BoothResponse>(
      `${BASE_URL}/booths/${electionId}`,
      boothData,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.data.status !== "success") {
      throw new Error(response.data.message || "Failed to create booth");
    }

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Error creating booth";
    // message.error(errorMessage);
    throw error;
  }
};

// Helper function to extract just the booth data from the response
export const getBoothsContent = async (
  electionId: string
): Promise<Booth[]> => {
  const response = await getBoothsByElectionId(electionId);
  return response.data.content;
};

// Interface for the template data structure
export interface TemplateData {
  templateId: number;
  templateName: string;
  isActive: boolean;
  imageStatus: boolean;
  imageUrl?: string | null;
  newOrderIndex: number | null;
  candidateInfoImageFooter: string | null;
  voterSlipHeader: string | null;
}

// Interface for the API response
export interface TemplateResponse {
  status: string;
  code: number;
  message: string;
  data: TemplateData[];
}

/**
 * Fetch templates for a specific election
 * @param electionId - The ID of the election to fetch templates for
 * @returns Promise with an array of templates
 */
export const getTemplatesByElectionId = async (
  electionId: number | string
): Promise<TemplateData[]> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const response = await axios.get<TemplateResponse>(
      `${BASE_URL}/elections/templates/election/${electionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    return response.data.data || [];
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    // message.error(error.response?.data?.message || "Failed to fetch templates");
    return [];
  }
};

/**
 * Create a new template for an election
 * @param electionId - The ID of the election to create template for
 * @param templateData - Template details
 * @param file - Optional image file
 * @returns Promise with the created template data
 */
export const createTemplateApi = async (
  electionId: number | string,
  templateData: {
    templateId: number;
    templateName: string;
    candidateInfoImageFooter: string;
    voterSlipHeader: string;
    isActive: boolean;
    imageStatus: boolean;
    imageUrl?: string;
  },
  file?: File
): Promise<TemplateData | null> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    // Create FormData for multipart upload
    const formData = new FormData();

    // Append file if exists with correct content type
    if (file) {
      // Ensure file has a valid name and type
      const namedFile = new File([file], file.name || "template-image.png", {
        type: file.type || "image/png",
      });
      formData.append("file", namedFile, namedFile.name);
    }

    // Prepare template data
    const templatePayload = {
      templateId: templateData.templateId,
      templateName: templateData.templateName,
      isActive: templateData.isActive,
      candidateInfoImageFooter: templateData.candidateInfoImageFooter,
      voterSlipHeader: templateData.voterSlipHeader,
      imageStatus: templateData.imageStatus,
      imageUrl: templateData.imageUrl || "",
    };
    console.log("templatePayload", templatePayload);
    // Convert template data to JSON Blob
    const templateBlob = new Blob([JSON.stringify(templatePayload)], {
      type: "application/json",
    });
    formData.append("template", templateBlob, "template.json");

    // Make the API call
    const response = await axios.post<TemplateResponse>(
      `${BASE_URL}/elections/templates/${electionId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );

    // Validate response
    if (response.data.status !== "success") {
      throw new Error(response.data.message || "Error creating template");
    }

    // Return the template data from the response
    return response.data.data || response.data;
  } catch (error: any) {
    console.error("Template creation error:", error);

    // Detailed error handling
    if (error.response) {
      // Server responded with an error
      console.log("error.response", error.response);
      console.log("error.response.data", error.response.data);
      if (
        error.response.data?.message?.includes(
          "Required part 'file' is not present"
        )
      ) {
        message.error("Please upload a valid image file.");
      } else {
        const errorMessage =
          error.response.data?.message ||
          `Error ${error.response.status}: ${error.response.statusText}`;
        message.error(errorMessage);
      }
    } else if (error.request) {
      // Request was made but no response received
      message.error("No response received from server");
    } else {
      // Error in request setup
      message.error(error.message || "Unexpected error creating template");
    }

    return null;
  }
};

/**
 * Update an existing template
 * @param electionId - The ID of the election the template belongs to
 * @param templateId - The ID of the template to update
 * @param updateData - The updated template data
 * @returns Promise with the updated template data
 */
export const updateTemplateApi = async (
  electionId: number | string,
  templateName: string,
  updateData: Partial<TemplateData>
): Promise<TemplateData | null> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }
    console.log("updateData", updateData);
    const response = await axios.put<TemplateResponse>(
      `${BASE_URL}/elections/templates/${electionId}/name/${templateName}`,
      updateData,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.data.status !== "success") {
      throw new Error(response.data.message || "Error updating template");
    }
    message.success("Template status updated successfully");
    return response.data.data?.[0] || null;
  } catch (error: any) {
    console.error("Error updating template:", error);
    message.error(error.response?.data?.message || "Error updating template");
    return null;
  }
};

export const updateTemplateDetailsApi = async (
  electionId: number | string,
  templateName: string,
  updateData: Partial<TemplateData>
): Promise<TemplateData | null> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }
    console.log("updateData", updateData);
    const response = await axios.put<TemplateResponse>(
      `${BASE_URL}/elections/templates/${electionId}/templates/${templateName}/details`,
      updateData,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.data.status !== "success") {
      throw new Error(
        response.data.message || "Error updating template details"
      );
    }

    return response.data.data?.[0] || null;
  } catch (error: any) {
    console.error("Error updating template details:", error);
    message.error(
      error.response?.data?.message || "Error updating template details"
    );
    return null;
  }
};

export const updateImageApi = async (
  electionId: number | string,
  templateName: string,
  updateData
) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }
    console.log("updateData", updateData);
    console.log("template name", templateName);
    const response = await axios.put<TemplateResponse>(
      `${BASE_URL}/elections/templates/${electionId}/name/${templateName}/image/status`,
      updateData,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.data.status !== "success") {
      throw new Error(response.data.message || "Error updating image status");
    }
    message.success("Image status updated successfully");

    return response.data.data?.[0] || null;
  } catch (error: any) {
    console.error("Error updating image status:", error);
    message.error(
      error.response?.data?.message || "Error updating image status"
    );
    return null;
  }
};

export const updateTemplateOrder = async (
  electionId: number,
  payload: { newOrderIndex: number; templateName: string }
): Promise<AxiosResponse> => {
  try {
    console.log("payload", payload);
    console.log("electionId", electionId);
    const jwtToken = await getjwtToken();
    const response = await axios.put(
      `${BASE_URL}/elections/templates/${electionId}/templates/reorder`,
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
      error.response?.data?.message || "Error updating Voter-slips order"
    );
    console.error("Error updating Voter-slips order", error);
    throw error;
  }
};

/**
 * Delete a template
 * @param electionId - The ID of the election the template belongs to
 * @param templateId - The ID of the template to delete
 * @returns Promise with the deleted template data
 */

export const deleteTemplateApi = async (
  electionId: number,
  templateNames?: string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    console.log("Template names", templateNames);
    const params = new URLSearchParams();
    if (templateNames && templateNames.length > 0) {
      templateNames.forEach((id) => {
        params.append("templateNames", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/elections/templates/${electionId}`,
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
    const errorMessage = templateNames?.length
      ? "Error deleting Templates"
      : "Error deleting all Templates";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};

/**
 * Fetch a single template by its ID
 * @param templateId - The ID of the template to fetch
 * @returns Promise with template details
 */
export const getTemplateById = async (
  electionId: number | string,
  templateName: string
): Promise<TemplateData | null> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const response = await axios.get<TemplateResponse>(
      `${BASE_URL}/elections/templates/${electionId}/${templateName}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    // Check for successful response
    if (response.data.status !== "success") {
      throw new Error(response.data.message || "Failed to fetch template");
    }

    // Return the first template or null
    return response.data.data?.[0] || null;
  } catch (error: any) {
    console.error("Error fetching template:", error);

    // Detailed error handling
    if (error.response) {
      message.error(error.response.data.message || "Error fetching template");
    } else if (error.request) {
      message.error("No response received from server");
    } else {
      message.error(error.message || "Unexpected error fetching template");
    }

    return null;
  }
};

export const updateTemplateImageApi = async (
  electionId: number | string,
  templateId: number | string,
  file: File
): Promise<TemplateData | null> => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.put(
      `${BASE_URL}/elections/templates/${electionId}/name/${templateId}/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );

    if (response.data.status !== "success") {
      throw new Error(response.data.message || "Error updating template image");
    }

    return response.data.data || null;
  } catch (error: any) {
    console.error("Error updating template image:", error);
    message.error(
      error.response?.data?.message || "Error updating template image"
    );
    return null;
  }
};

// Add these to your election API file
export const saveElectionReportsData = async (
  electionId: string,
  payload: any
) => {
  try {
    console.log("Payload for saving election reports data", payload);
    const response = await axios.put(
      `${BASE_URL}/dashboard/save/${electionId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getElectionReportsData = async (
  electionId: string,
  boothNumber?: string
) => {
  try {
    let params = boothNumber ? { boothNumber } : {};
    params = { ...params, userId: 54 };
    const response = await axios.get(
      `${BASE_URL}/dashboard/reports/${electionId}`,
      {
        params,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      }
    );
    console.log("Response", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== FREEZE/UNFREEZE ELECTION APIs ====================

export const requestElectionFreezeOtp = async (electionId: number) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const response = await axios.post(
      `${BASE_URL}/elections/${electionId}/freeze/request-otp`,
      {},
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    message.success(response.data.message || "OTP sent successfully");
    return response.data;
  } catch (error: any) {
    console.error("Error requesting freeze OTP:", error);
    message.error(
      error.response?.data?.message || "Failed to send OTP. Please try again."
    );
    throw error;
  }
};

export const verifyFreezeOtpAndFreezeElection = async (
  electionId: number,
  otp: string
) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const response = await axios.post(
      `${BASE_URL}/elections/${electionId}/freeze/verify-otp?otp=${otp}`,
      {},
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    message.success(response.data.message || "Election frozen successfully");
    return response.data;
  } catch (error: any) {
    console.error("Error freezing election:", error);
    message.error(
      error.response?.data?.message || "Failed to freeze election. Please try again."
    );
    throw error;
  }
};

export const requestElectionUnfreezeOtp = async (electionId: number) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const response = await axios.post(
      `${BASE_URL}/elections/${electionId}/unfreeze/request-otp`,
      {},
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    message.success(response.data.message || "OTP sent successfully");
    return response.data;
  } catch (error: any) {
    console.error("Error requesting unfreeze OTP:", error);
    message.error(
      error.response?.data?.message || "Failed to send OTP. Please try again."
    );
    throw error;
  }
};

export const verifyUnfreezeOtpAndUnfreezeElection = async (
  electionId: number,
  otp: string
) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      throw new Error("No authentication token found");
    }

    const response = await axios.post(
      `${BASE_URL}/elections/${electionId}/unfreeze/verify-otp?otp=${otp}`,
      {},
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    message.success(response.data.message || "Election unfrozen successfully");
    return response.data;
  } catch (error: any) {
    console.error("Error unfreezing election:", error);
    message.error(
      error.response?.data?.message || "Failed to unfreeze election. Please try again."
    );
    throw error;
  }
};
