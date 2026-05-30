import axios, { AxiosResponse } from "axios";
import { BASE_URL } from "../config";
import { message } from "antd";
import { RcFile } from "antd/es/upload";

interface BenefitSchemeData {
  schemeName: string;
  schemeBy: string;
  schemeValue:string|number;
  // Note: imageUrl is not provided by the user via the form.
  // It will be automatically set (empty string by default) in the payload.
}

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

// Fetch benefit schemes from cpanel
export const getCpanelBenefitSchemesApi = async () => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/cpanel/benefit-schemes`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching cpanel benefit schemes:", error);
    message.error(error.response?.data?.message || "Error fetching cpanel benefit schemes");
    throw error;
  }
};

export const getBenefitSchemesApi = async (electionId: number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/user/benefit-schemes/${electionId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching benefit schemes:", error);
    throw error;
  }
};

export const getSchemesPartWiseCount = async (electionId: number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/elections/${electionId}/schemes/part-wise-count`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data?.data;
  } catch (error: any) {
    console.error("Error fetching schemes part-wise count:", error);
    throw error;
  }
};

export interface PollDaySchemePartData {
  partNo: number;
  votedCount: number;
}

export interface PollDaySchemePartWiseCountResponse {
  schemeId: string;
  schemeName: string;
  parts: PollDaySchemePartData[];
}

export const getPollDayVotedSchemePartWiseCount = async (
  electionId: number,
  schemeId: number
): Promise<PollDaySchemePartWiseCountResponse> => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/elections/${electionId}/schemes/${schemeId}/poll-day-voted-part-wise-count`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data?.data;
  } catch (error: any) {
    console.error("Error fetching poll day voted scheme part-wise count:", error);
    throw error;
  }
};

export const addBenefitSchemeApi = async (
  payload: BenefitSchemeData,
  file: RcFile,
  electionId: number
): Promise<AxiosResponse> => {
  try {
    const formData = new FormData();

    // Using Blob like in availability API
    formData.append(
      "benefit",
      new Blob([JSON.stringify({ ...payload, imageUrl: "" })], {
        type: "application/json",
      })
    );
    formData.append("file", file);
    console.log("file", file);
    console.log("payload", payload);
    console.log("formData", formData);

    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/user/benefit-schemes/${electionId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
        // Remove Content-Type header to let browser set it with boundary
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
    console.error("Error creating Benefit-scheme", error);
    message.error(
      error.response?.data?.message || "Error creating Benefit-scheme"
    );
    throw error;
  }
};

// Place this interceptor setup early in your app initialization code.
axios.interceptors.request.use((config) => {
  if (
    config.method === "put" &&
    config.data instanceof FormData &&
    config.headers &&
    typeof config.headers["Content-Type"] === "string"
  ) {
    // Remove any charset info from the Content-Type header.
    config.headers["Content-Type"] =
      config.headers["Content-Type"].split(";")[0];
  }
  return config;
});

export const updateBenefitSchemeApi = async (
  payload: BenefitSchemeData,
  electionId: number,
  benefitSchemeId: number,
  file?: RcFile
): Promise<any> => {
  try {
    const jwtToken = await getjwtToken();
    let response: Response;

    if (!file) {
      // No image change: send a JSON payload.
      console.log("payload", payload);
      const formData = new FormData();

      const benefit = { imageUrl: "", ...payload };
      formData.append(
        "benefit",
        new Blob([JSON.stringify(benefit)], { type: "application/json" })
      );
      response = await fetch(
        `${BASE_URL}/user/benefit-schemes/${electionId}/${benefitSchemeId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            accept: "*/*",
          },
          body: formData,
        }
      );
    } else {
      // If an image is provided, make sure it's a proper File instance.
      let imageFile: File;
      if (file instanceof File) {
        imageFile = file;
      } else {
        imageFile = new File([file as any], file.name, { type: file.type });
      }

      const formData = new FormData();

      // Create a File object for the JSON data.
      // This should mimic the cURL request: a field named "benefit" with filename "blob" and type "application/json"
      const benefitFile = new File(
        [JSON.stringify({ ...payload, imageUrl: "" })],
        "blob", // filename as in your cURL request
        { type: "application/json" }
      );

      formData.append("benefit", benefitFile);
      formData.append("file", imageFile);

      // IMPORTANT:
      // Do NOT set the Content-Type header manually.
      // Let the browser generate it, including the boundary.
      response = await fetch(
        `${BASE_URL}/user/benefit-schemes/${electionId}/${benefitSchemeId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            accept: "*/*",
          },
          body: formData,
        }
      );
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Error updating benefit scheme");
    }
    return data;
  } catch (error) {
    console.error("Error updating benefit scheme:", error);
    throw error;
  }
};

export const updateOrder = async (
  electionId: number,
  payload: { schemeId: number; newOrderIndex: number }[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    console.log("payload", payload);
    const response = await axios.put(
      `${BASE_URL}/user/benefit-schemes/${electionId}/reorder`,
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
    message.error(
      error.response?.data?.message || "Error updating Benefit-scheme order"
    );
    console.error("Error updating Benefit-scheme order", error);
    throw error;
  }
};

export const deleteBenefitSchemesApi = async (
  electionId: number,
  benefitSchemeIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    console.log("Benefit Scheme ids", benefitSchemeIds);
    const params = new URLSearchParams();
    if (benefitSchemeIds && benefitSchemeIds.length > 0) {
      benefitSchemeIds.forEach((id) => {
        params.append("benefitSchemeIds", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/user/benefit-schemes/${electionId}`,
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
    const errorMessage = benefitSchemeIds?.length
      ? "Error deleting Schemes"
      : "Error deleting all Schemes";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};
