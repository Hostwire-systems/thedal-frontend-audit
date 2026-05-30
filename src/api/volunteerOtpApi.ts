import axios from "axios";
import { BASE_URL } from "../config";

// Interface for volunteer OTP setting
export interface VolunteerOtpSetting {
  enabled: boolean;
  description?: string;
}

// Interface for API response
export interface VolunteerOtpResponse {
  message: string;
  success: boolean;
  data: VolunteerOtpSetting;
}

/**
 * Get volunteer OTP setting
 */
export const getVolunteerOtpSetting =
  async (): Promise<VolunteerOtpResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/system/settings/volunteer-otp`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching volunteer OTP setting:", error);
      throw error;
    }
  };

export const getVolunteerOtpStatus =
  async (): Promise<VolunteerOtpResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/system/settings/volunteer-otp/status`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching volunteer OTP setting:", error);
      throw error;
    }
  };

/**
 * Get volunteer OTP setting with description
 */
export const getVolunteerOtpSettingWithDescription =
  async (): Promise<VolunteerOtpResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/system/settings/volunteer-otp/setting`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching volunteer OTP setting with description:",
        error
      );
      throw error;
    }
  };

/**
 * Update volunteer OTP setting
 */
export const updateVolunteerOtpSetting = async (
  enabled: boolean
): Promise<VolunteerOtpResponse> => {
  try {
    // Log the request for debugging
    console.log(
      "Sending PUT request to:",
      `${BASE_URL}/api/system/settings/volunteer-otp`
    );
    console.log("Request body:", { enabled });

    const response = await axios.put(
      `${BASE_URL}/api/system/settings/volunteer-otp/user`,
      { enabled },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating volunteer OTP setting:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
    }
    throw error;
  }
};

export const verifyCadreOtpAndEnable2FA = async (
  userId: number,
  otp: number | string
): Promise<VolunteerOtpResponse> => {
  try {
    // Log the request for debugging
    console.log(
      "Sending POST request to:",
      `${BASE_URL}/api/system/settings/volunteer-otp/verify-otp`
    );
    console.log("OTP", otp);

    const response = await axios.post(
      `${BASE_URL}/api/system/settings/volunteer-otp/verify-otp`,
      {},
      {
        params: {
          userId: userId,
          otp: otp.toString(),
        },

        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error verifying OTP while enabling/disabling 2FA for volunteer:",
      error
    );
    if (axios.isAxiosError(error)) {
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
    }
    throw error;
  }
};

/**
 * Alternative update function - try different request body formats
 */
export const updateVolunteerOtpSettingAlt = async (
  enabled: boolean
): Promise<VolunteerOtpResponse> => {
  // Try different possible formats the backend might expect
  const requestBodies = [
    { enabled }, // Original format
    { value: enabled }, // Maybe it expects 'value'
    { setting: { enabled } }, // Maybe it expects nested object
    { otpEnabled: enabled }, // Maybe different field name
    { volunteerOtp: { enabled } }, // Maybe specific naming
  ];

  for (const [index, body] of requestBodies.entries()) {
    try {
      console.log(`Attempt ${index + 1} - Request body:`, body);

      const response = await axios.put(
        `${BASE_URL}/api/system/settings/volunteer-otp`,
        body,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`Success with format ${index + 1}:`, response.data);
      return response.data;
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data || error.message
        : String(error);
      console.log(`Attempt ${index + 1} failed:`, errorMessage);

      if (index === requestBodies.length - 1) {
        // If this was the last attempt, throw the error
        throw error;
      }
    }
  }

  throw new Error("All request formats failed");
};
