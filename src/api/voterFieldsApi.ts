import axios, { AxiosResponse } from "axios";
import { BASE_URL } from "../config";
import { message } from "antd";

// Get JWT token
const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const FIELD_NAME_MAPPING_REQUIRED_STATUS: Record<string, string> = {
  mobileNo: "mobileNo",
  whatsapp_number: "whatsappNo",
  email: "eMail",
  date_of_birth: "dob",
  religion: "RELIGION",
  casteCategory: "CASTE_CATEGORY",
  caste: "CASTE",
  sub_caste: "SUB_CASTE",
  party_affiliation: "partyAffiliation",
  availability: "availability",
  scheme: "scheme",
  voterHistory: "VOTER_HISTORY",
  feedback: "FEEDBACK",
  languages: "LANGUAGE",
  aadhaarNumber: "aadhaarNumber",
  panNumber: "panNumber",
  remarks: "remarks",
  voterLati: "voterLati",
  voterLongi: "voterLongi",
  starNumber: "starNumber",
  partyRegistrationNumber: "partyRegistrationNumber",
  age: "age",
};
/**
 * Get API field code from frontend field name
 */
export const getApiFieldRequiredCode = (fieldName: string): string => {
  return (
    FIELD_NAME_MAPPING_REQUIRED_STATUS[fieldName] || fieldName.toUpperCase()
  );
};

/**
 * Interface for single field status in API response
 */
export interface StaticFieldStatus {
  fieldName: string;
  mandatory: boolean;
  status: boolean;
}

/**
 * Interface for API response containing field statuses
 */
export interface StaticFieldStatusResponse {
  success: boolean;
  message: string;
  data: StaticFieldStatus[];
}

/**
 * Interface for single field update response
 */
export interface SingleFieldUpdateResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Get field status for all static fields
 */
export const getFieldStatus = async (
  electionId: number
): Promise<StaticFieldStatusResponse> => {
  const jwtToken = await getjwtToken();
  const res = await axios.get(
    `${BASE_URL}/api/elections/${electionId}/static-fields`,
    {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    }
  );
  return res.data;
};

export const getEnabledFields = async (
  electionId: number
): Promise<StaticFieldStatusResponse> => {
  const jwtToken = await getjwtToken();
  const res = await axios.get(
    `${BASE_URL}/api/elections/${electionId}/static-fields/enabled`,
    {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    }
  );
  return res.data;
};

/**
 * Update single field status (enable/disable)
 */
export const updateFieldStatus = async (
  electionId: number,
  fieldName: string,
  status: boolean
): Promise<SingleFieldUpdateResponse> => {
  const jwtToken = await getjwtToken();
  const res = await axios.put(
    `${BASE_URL}/api/elections/${electionId}/static-fields/field/${fieldName}/status?status=${status}`,
    null,
    {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    }
  );
  return res.data;
};

//  Update single field required status (enable/disable)
export const updateFieldRequiredStatus = async (
  electionId: number,
  fieldName: string,
  status: boolean
): Promise<SingleFieldUpdateResponse> => {
  const jwtToken = await getjwtToken();
  const res = await axios.put(
    `${BASE_URL}/api/elections/${electionId}/static-fields/field/${fieldName}/mandatory?mandatory=${status}`,
    null,
    {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    }
  );
  return res.data;
};

/**
 * Map frontend field names to API field codes (based on actual API response)
 */
export const FIELD_NAME_MAPPING: Record<string, string> = {
  mobileNo: "mobileNo",
  whatsapp_number: "whatsappNo",
  email: "eMail",
  date_of_birth: "dob",
  religion: "RELIGION",
  casteCategory: "CASTE_CATEGORY",
  caste: "CASTE",
  sub_caste: "SUB_CASTE",
  party_affiliation: "partyAffiliation",
  availability: "availability",
  scheme: "scheme",
  voterHistory: "VOTER_HISTORY",
  feedback: "FEEDBACK",
  languages: "LANGUAGE",
  aadhaarNumber: "aadhaarNumber",
  panNumber: "panNumber",
  remarks: "remarks",
  voterLati: "voterLati",
  voterLongi: "voterLongi",
  starNumber: "starNumber",
  partyRegistrationNumber: "partyRegistrationNumber",
  age: "AGE",
};

/**
 * Get API field code from frontend field name
 */
export const getApiFieldCode = (fieldName: string): string => {
  return FIELD_NAME_MAPPING[fieldName] || fieldName.toUpperCase();
};

/**
 * Update static fields order
 */
export const updateStaticFieldsOrder = async (
  electionId: number,
  payload: { fields: { name: string; newOrderIndex: number }[] }
): Promise<any> => {
  try {
    console.log("Static fields reorder payload:", payload);
    const jwtToken = await getjwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/voter-field-order/election/${electionId}/reorder`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating static fields order:", error);
    throw error;
  }
};


//Update all fields show status
export const updateAllStaticFieldsStatus = async (
  electionId: number,
  payload: { status: boolean }
) => {
  try {
    const jwtToken = await getjwtToken();

    // Choose correct endpoint based on status
    const endpoint = payload.status
      ? `${BASE_URL}/api/elections/${electionId}/static-fields/enable-all`
      : `${BASE_URL}/api/elections/${electionId}/static-fields/disable-all`;

    const response = await axios.put(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    });

    // message.success(
    //   `Status ${
    //     payload.status ? "enabled" : "disabled"
    //   } for all the fields successfully`
    // );

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
export const updateAllStaticFieldsRequired = async (
  electionId: number,
  payload: { status: boolean }
) => {
  try {
    const jwtToken = await getjwtToken();

    // Choose correct endpoint based on status
    const endpoint = payload.status
      ? `${BASE_URL}/api/elections/${electionId}/static-fields/require-all`
      : `${BASE_URL}/api/elections/${electionId}/static-fields/optional-all`;

    const response = await axios.put(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    });

    // message.success(
    //   `Required status ${
    //     payload.status ? "enabled" : "disabled"
    //   } for all the fields successfully`
    // );

    return response;
  } catch (error: any) {
    // message.error(
    //   error?.response?.data?.message ||
    //     "Unable to update required status for all the fields"
    // );
    console.log(
      "Error updating field required status for all the fields:",
      error
    );
  }
};