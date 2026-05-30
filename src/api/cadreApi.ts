import axios, { AxiosResponse, AxiosProgressEvent } from "axios";

import { BASE_URL } from "../config";
import { message } from "antd";
import moment from "moment";

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

interface CadreApiParams {
  electionId: string;
  page: number;
  size: number;
}

// Base shape (legacy usage)
interface LegacyCadre {
  id?: string;
  name?: string;
  boothNumber?: string;
  contactNo?: string;
  [key: string]: any;
}

// Current Cadre representation
interface Cadre extends LegacyCadre {
  volunteerId: number | string;
  firstName: string;
  lastName: string;
  userId: number | string;
  email: string;
  mobileNumber: string;
  role: string;
  address: {
    // street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  locationDto: {
    latitude: number;
    longitude: number;
  };
  assignedBooths: [];
  assignedFamilies?: number[];
  status: string;
  photoUrl: string;
  remarks: string;
  currentLatitude: number;
  currentLongitude: number;
  currentRoute: string;
}

export const getCadresApi = async (
  electionId: number,
  userId: number,
  assignedBooths?: string[],
    roleName?: string,
  page: number = 0,
  size: number = 10,
  sortBy: string = "firstName",
  includeDeviceCount:boolean=true,

): Promise<any> => {
  try {
    console.log("electionId", electionId);
    let finalAssignedBooths = null;
    if (assignedBooths && assignedBooths.length > 0) {
      finalAssignedBooths = assignedBooths.join(",");
    }
    
    let params:any = {
      sortBy,
      includeDeviceCount,
      page,
      size,
      assignedBooths: finalAssignedBooths,
    };
    if (roleName) {
      // Let axios encode (space -> %20). Avoid pre-encoding to prevent %2520.
      params.roleName = roleName.trim();
    }
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/volunteers/election/${electionId}/by-booth-and-mobile-and-user`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching cadres:", error);
    throw error;
  }
};

export const getCadreSearchApi = async (
  electionId: number,
  searchTerm: string,
  page: number = 0,
  size: number = 10,
  sortBy: string = "firstName"
): Promise<any> => {
  try {
    let params = {
      sortBy,
      searchTerm,
      page,
      size,
    };
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/volunteers/election/${electionId}/by-booth-and-mobile-and-user/search`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error searching cadre:", error);
    throw error;
  }
};

// Helper to safely extract an array of cadres from varying backend shapes
export const extractCadreList = (apiResult: any): any[] => {
  if (!apiResult) return [];
  if (Array.isArray(apiResult)) return apiResult; // direct array
  if (Array.isArray(apiResult.data)) return apiResult.data; // { data: [] }
  if (Array.isArray(apiResult.data?.content)) return apiResult.data.content; // { data: { content: [] } }
  if (Array.isArray(apiResult.content)) return apiResult.content; // { content: [] }
  return [];
};

export const deleteCadresApi = async (
  electionId: number,
  userIds?: number[] | string[]
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getjwtToken();
    console.log("userId of volunteers about to be deleted", userIds);
    // Only include userIds params when array has items
    // When userIds is empty/undefined, backend deletes all volunteers
    const params: any = {};
    if (userIds && userIds.length > 0) {
      params.userIds = userIds.map((id: number | string) => id.toString());
    }
    const response = await axios.delete(
      `${BASE_URL}/volunteers/election/${electionId}`,
      {
        params: params,
        paramsSerializer: {
          serialize: (p: any) => {
            const searchParams = new URLSearchParams();
            if (p.userIds && Array.isArray(p.userIds)) {
              p.userIds.forEach((id: string) => {
                searchParams.append("userIds", id);
              });
            }
            return searchParams.toString();
          },
        },
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          Accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    const errorMessage = userIds?.length
      ? "Error deleting Cadres"
      : "Error deleting all Cadres";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};

export const cadresBulkUploadApi = async (
  formData: FormData,
  electionId: number
) => {
  try {
    const jwtToken = await getjwtToken();
    console.log("electionId", electionId);
    console.log("formData", formData);
    const response = await axios.post(
      `${BASE_URL}/volunteers/election/${electionId}/upload?electionId=${electionId}`,
      formData,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "multipart/form-data",
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000,
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const total = progressEvent.total ?? 0;
          const percentCompleted = total
            ? Math.round((progressEvent.loaded * 100) / total)
            : 0;
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      }
    );
    const responseData = response.data;

    // Return response data with both success and failure information
    // The component will handle displaying appropriate messages
    return responseData;
  } catch (error: any) {
    console.error("error", error);
    if (error.response?.status === 413) {
      throw {
        status: "error",
        code: 413,
        message:
          "File size exceeds server limits. Please reduce the file size and try again.",
      };
    }
    const errorMessage =
      error.response?.data?.message || "An error occurred during bulk upload";
    throw {
      status: "error",
      code: error.response?.status || 500,
      message: errorMessage,
    };
  }
};

export const updateCadreBoothApi = async (
  electionId: number,
  userId: number,
  boothData: { booths: number[]; overwrite: boolean }
): Promise<AxiosResponse> => {
  try {
    console.log("electionId", electionId);
    console.log("userId", userId);
    console.log("boothData", boothData);
    const jwtToken = await getjwtToken();
    const response = await axios.put(
      `${BASE_URL}/volunteers/volunteer/${electionId}/${userId}/booths`,
      boothData,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating cadres booth:", error);
    throw error;
  }
};

export const updateCadreApi = async (
  userId: string | number,
  updatedData: Partial<Cadre>,
  electionId: number
): Promise<AxiosResponse> => {
  const defaultData: Cadre = {
    volunteerId: "dummy-volunteer-id",
    userId: "dummy-user-id",
    firstName: "dummy-first-name",
    lastName: "dummy-last-name",
    email: "dummy-email@example.com",
    mobileNumber: "0000000000",
    whatsAppNumber: "0000000000",
    role: "dummy-role",
    address: {
      // street: "dummy-street",
      city: "dummy-city",
      state: "dummy-state",
      postalCode: "000000",
      country: "dummy-country",
    },
    locationDto: {
      latitude: 0,
      longitude: 0,
    },
    assignedBooths: [],
    assignedFamilies: [],
    status: "dummy-status",
    photoUrl: "dummy-photo-url",
    remarks: "dummy-remarks",
    currentLatitude: 0,
    currentLongitude: 0,
    currentRoute: "dummy-route",
  };

  const finalData: any = {
    ...defaultData,
    ...updatedData,
    locationDto: {
      ...defaultData.locationDto,
      ...updatedData.locationDto,
    },
    address: {
      ...defaultData.address,
      ...updatedData.address,
    },
    currentLatitude: updatedData.currentLatitude ?? defaultData.currentLatitude,
    currentLongitude:
      updatedData.currentLongitude ?? defaultData.currentLongitude,
  };

  // Only include assignedFamilies if it exists in updatedData
  if (updatedData.assignedFamilies !== undefined) {
    finalData.assignedFamilies = updatedData.assignedFamilies;
  }

  // Only include assignedBoothSections if it exists in updatedData
  if (updatedData.assignedBoothSections !== undefined) {
    finalData.assignedBoothSections = updatedData.assignedBoothSections;
  }

  console.log("finalData: ", finalData);
  try {
    console.log("userId", userId);
    console.log("electionId", electionId);
    const jwtToken = await getjwtToken();
    const response = await axios.put(
      `${BASE_URL}/volunteers/election/${electionId}/user/${userId}`,
      finalData,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    console.log("Updated data from api:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating cadre:", error);
    throw error;
  }
};

const mapToCadreFormData = (data: any) => {
  // Split full name into first and last name
  // const nameParts = (data.fullName || "").split(" ");
  // const firstName = nameParts[0] || "string";
  // const lastName = nameParts.slice(1).join(" ") || "";

  const formData: any = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.emailId || "",
    mobileNumber: data.mobileNumber,
    whatsAppNumber: data.whatsAppNumber,
    password: data.password,
    address: {
      // street: data.street || "string",
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: "India", // Fixed: Set default to "string"
    },
    assignedBooths: data.assignedBooths || data.assignedBooth,
    assignedBooth: data.assignedBooth,
    gender: data.gender,
    roleName: data.roleName,
    // status: "Active", // Fixed: Capital A
    status: data.status,
    remarks: data.remarks, // Fixed: Set default to "string"
  };

  // Add assignedBoothSections if present (for section-level assignments)
  if (data.assignedBoothSections && data.assignedBoothSections.length > 0) {
    formData.assignedBoothSections = data.assignedBoothSections;
  }

  // Add assignedFamilies only if present (for Family Captain role)
  if (data.assignedFamilies && data.assignedFamilies.length > 0) {
    formData.assignedFamilies = data.assignedFamilies;
  }

  return formData;
};

export const addCadreFormApi = async (data: any) => {
  console.log("data", data);
  const { electionId } = data;
  const mappedData = mapToCadreFormData(data);
  console.log("Mapped Data:", mappedData);

  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await axios({
      method: "post",
      url: `${BASE_URL}/volunteers/${electionId}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
      data: mappedData,
      // Disable preflight request
      // proxy: {
      //   protocol: 'https',
      //   host: 'thedal-api.hostwire.cloud',
      //   port: 443
      // }
    });

    console.log("API Response:", response);
    return response.data;
  } catch (error: any) {
    console.error("Full API Error:", error);
    console.error("API Error Response:", error.response);
    message.error(error.response?.data?.message);
    throw error.response ? error.response.data : error;
  }
};

export const getVolunteerLiveActivity = async (
  userId: number | undefined,
  electionId: number | undefined,
  startDate: string = moment().format("YYYY-MM-DD"),
  endDate: string = moment().format("YYYY-MM-DD")
) => {
  if (!userId) {
    message.error("Invalid Cadre  User Id");
    return;
  }
  try {
    console.log(
      "Fetching activity data for date range:",
      startDate,
      "to",
      endDate
    ); // Debug log
    const jwtToken = await getjwtToken();
    console.log(userId);
    const response = await axios.get(
      `${BASE_URL}/volunteers/activity/${userId}/${electionId}?startDate=${startDate}&endDate=${endDate}&page=0&size=100`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    console.log("Activity data response:", response.data.data.content); // Debug log
    return response.data.data.content;
  } catch (error: any) {
    message.error(error.response?.data?.message || "An error occurred");
    throw error.response ? error.response.data : error;
  }
};

export const getCadreTopPerformersApi = async (
  electionId: number
): Promise<AxiosResponse> => {
  try {
    console.log("electionId", electionId);
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/cadre/performance/top/${electionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching top performer cadres:", error);
    throw error;
  }
};

export const getCadreLowPerformersApi = async (
  electionId: number
): Promise<AxiosResponse> => {
  try {
    console.log("electionId", electionId);
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/cadre/performance/least/${electionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching least performer cadres:", error);
    throw error;
  }
};

export const saveCadreDashboardReportApi = async (
  electionId: number,
  reportData: any
) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/cadre/save/${electionId}`,
      reportData,
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

export const getCadreDashboardReportApi = async (electionId: number) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/cadre/reports/${electionId}`,
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
