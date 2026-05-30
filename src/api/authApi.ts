// src/api/authApi.ts

import axios from "axios";
import { message, Modal } from "antd";
import { BASE_URL } from "../config";

// API for user signup
export const signupUser = async (
  userData: {
    firstName: string;
    lastName: string;
    mobile: string;
    roleID: number;
    email: string;
    password: string;
  },
  setIsRegistering: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsRegistering(true);
  try {
    userData.firstName = userData.firstName.trim();
    userData.lastName = userData.lastName.trim();
    userData.roleID = 2;
    console.log("userData", userData);
    const response = await axios.post(`${BASE_URL}/auth/signup`, userData, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    setIsRegistering(false);
    message.success("OTP sent successfully!");
    return response.data;
  } catch (error: any) {
    message.error(error.response.data.message);
    setIsRegistering(false);
    throw error.response ? error.response.data : error;
  }
};

// API for OTP verification
export const verifyMobileOtp = async (
  mobileNumber: string,
  otp: string,
  setIsVerifying: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsVerifying(true);
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/two-factor/otp/verify`,
      {
        mobileNumber,
        otp,
      },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      }
    );
    setIsVerifying(false);
    message.success("OTP verified successfully!");
    return response.data;
  } catch (error: any) {
    setIsVerifying(false);
    message.error(error.response.data.message || "OTP verification failed");
    throw error.response ? error.response.data : error;
  }
};

export const googleAuth = async () => {
  try {
    const response = axios.get(`${BASE_URL}/oauth2/authorization/google`, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    console.log("response", response);
  } catch (error) {
    console.log("Error while google authentication", error);
  }
};

// API for OTP login request
export const sendLoginOtp = async (
  mobileNumber: string,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsLoading(true);
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/two-factor/otp/invoke`,
      { mobileNumber },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      }
    );
    setIsLoading(false);
    message.success(response.data.message || "OTP sent successfully!");
    return response.data;
  } catch (error: any) {
    setIsLoading(false);
    message.error(error.response?.data?.message || "Failed to send OTP");
    throw error.response ? error.response.data : error;
  }
};

// API function for OTP verification
export const verifyOtpLogin = async (
  mobileNumber: string,
  otp: string,
  setIsVerifying: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsVerifying(true);
  try {
    // Use the OTP verification API
    const response = await axios.post(
      `${BASE_URL}/auth/two-factor/otp/verify`,
      {
        mobileNumber,
        otp,
      },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      }
    );

    setIsVerifying(false);

    // Success block
    if (response.data.success) {
      message.success("OTP verified successfully!");
      return response.data;
    }
  } catch (error: any) {
    setIsVerifying(false);

    // Handle both network issues and invalid OTPs here
    if (error.response) {
      // Server responded but with a non-2xx status (e.g., 400 for invalid OTP)
      message.error(
        error.response.data.message || "Invalid OTP or Mobile number."
      );
    } else {
      // Network error or no response from the server
      message.error("Network error. Please check your connection.");
    }

    // Rethrow the error so that it's handled where the function is called
    throw error.response ? error.response.data : error;
  }
};

export const verifyVolunteer = async ({
  volunteerUserId,
  otp,
}: {
  volunteerUserId: number;
  otp: string;
}) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/verify-volunteer-otp`,
      {
        volunteerUserId,
        otp,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      message.success("OTP verified successfully!");
      return response.data; // same structure as loginWithPassword
    } else {
      message.error(response.data.message || "OTP verification failed");
      return response.data;
    }
  } catch (error: any) {
    console.error("Error in verifyVolunteer:", error);
    message.error(
      error?.response?.data?.message ||
        "Something went wrong while verifying OTP."
    );
    throw error.response ? error.response.data : error;
  }
};

// API for login with password
export const loginWithPassword = async (
  mobileNumber: string,
  password: string,
  setIsVerifying: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsVerifying(true);
  try {
    console.log("mobileNumber: ", mobileNumber);
    console.log("password: ", password);
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      {
        user: mobileNumber,
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      }
    );
    setIsVerifying(false);

    if (response.data.success) {
      localStorage.setItem("jwtToken", response.data.accessToken);
      message.success("Login successful!");
      return response.data;
    } else {
      message.error(response.data.message || "Login failed");
      return response.data;
    }
  } catch (error: any) {
    setIsVerifying(false);
     const errorMessage =
       error?.response?.data?.message ||
       "Login failed. Please check your credentials and try again.";

  if (
  errorMessage ===
  "Your account is in inactive status. Please contact support."
) {
  return {
    success: false,
    message: errorMessage,
    data: null,
  };
}

message.error(errorMessage);

throw error.response ? error.response.data : error; }
};
//  Modal.warning({
//    title: "Account Inactive",
//    content:
//      "Your Account is deactivated or expired. Please contact customer support.",
//    okText: "OK",
//  });

// API to invoke OTP again
export const resendOtp = async (mobileNumber: string | undefined) => {
  try {
    if (!mobileNumber) {
      console.error("Invalid mobile number");
      return;
    }
    const response = await axios.post(
      `${BASE_URL}/auth/two-factor/otp/invoke`,
      {
        mobileNumber,
      },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      }
    );
    message.success("OTP sent successfully!");
    return response.data;
  } catch (error: any) {
    message.error(error.response.data.message || "OTP resend failed");
    throw error.response ? error.response.data : error;
  }
};

// google profile update api
export const googleProfileUpdate = async (payload: {
  password: string;
  mobile: string;
  email: string;
}) => {
  try {
    console.log("payload", payload);
    const response = await axios.put(`${BASE_URL}/auth/oauth/signup`, payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    message.success("Google account setup successful!");
    return response.data;
  } catch (error: any) {
    message.error(error.response.data.message);
    throw error.response ? error.response.data : error;
  }
};

// ── Session Management ──────────────────────────────────────────────────────

export interface SessionDto {
  id: number;
  deviceId: string;
  deviceName: string | null;
  platform: string | null;
  browser: string | null;
  ipAddressMasked: string | null;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
}

export interface AdminVolunteerSessionDto {
  sessionId: number;
  deviceId: string;
  deviceName: string | null;
  platform: string | null;
  browser: string | null;
  ipAddressMasked: string | null;
  createdAt: string;
  lastActiveAt: string;
  volunteerUserId: number;
  volunteerName: string;
  volunteerMobileNumber: string | null;
}

const authHeaders = () => ({
  "Content-Type": "application/json",
  accept: "*/*",
  Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
});

/** List all active sessions for the current user */
export const getActiveSessionsApi = async (): Promise<SessionDto[]> => {
  const response = await axios.get(`${BASE_URL}/api/auth/sessions`, {
    headers: authHeaders(),
  });
  return response.data?.data ?? [];
};

/** List all active sessions for volunteers mapped to the current admin */
export const getAdminVolunteerSessionsApi = async (): Promise<
  AdminVolunteerSessionDto[]
> => {
  const response = await axios.get(`${BASE_URL}/api/auth/sessions/volunteers`, {
    headers: authHeaders(),
  });
  return response.data?.data ?? [];
};

/** Revoke a single session by its DB id */
export const revokeSessionApi = async (sessionId: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/api/auth/sessions/${sessionId}`, {
    headers: authHeaders(),
  });
};

/** Revoke all OTHER sessions (keeps the current session alive) */
export const revokeOtherSessionsApi = async (): Promise<void> => {
  await axios.delete(`${BASE_URL}/api/auth/sessions`, {
    headers: authHeaders(),
  });
};

/** Full logout from all devices — also invalidates current session */
export const logoutFromAllDevicesApi = async (): Promise<void> => {
  await axios.post(`${BASE_URL}/auth/logout-all`, null, {
    headers: authHeaders(),
  });
};

/** Logout all active volunteer sessions mapped to the current admin */
export const revokeAdminVolunteerSessionsApi = async (): Promise<void> => {
  await axios.delete(`${BASE_URL}/api/auth/sessions/volunteers`, {
    headers: authHeaders(),
  });
};
