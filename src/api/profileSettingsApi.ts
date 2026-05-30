import axios from "axios";
import { message } from "antd";

import { BASE_URL } from "../config";
import { UserRoundIcon } from "lucide-react";
import Paragraph from "antd/es/skeleton/Paragraph";
import { useParams } from "react-router-dom";

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const updateProfileSettings = async (
  profileData: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    alternateEmailId: string;
    mobileNumber: string;
    alternateMobileNumber: string;
    organizationName?: string;
  },
  setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsUpdating(true);
  try {
    // Construct the fullName from firstName and lastName
    console.log("profileData", profileData);
    const payload = {
      fullName:
        profileData.fullName ||
        `${profileData?.firstName} ${profileData?.lastName}`.trim(),
      email: profileData.email || profileData.emailid,
      alternateEmailId:
        profileData.alternateEmailId || profileData.alternateEmail,
      mobileNumber: profileData.mobileNumber,
      alternateMobileNumber:
        profileData.alternateMobileNumber === ""
          ? undefined
          : profileData.alternateMobileNumber,
      organizationName: profileData.organizationName || "",
    };
    console.log("Payload for basic profile", payload);
    const response = await axios.post(
      `${BASE_URL}/api/profiles/settings/basic-profile`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      }
    );
    setIsUpdating(false);
    return response.data;
  } catch (error: any) {
    setIsUpdating(false);
    throw error.response ? error.response.data : error;
  }
};

export const uploadProfilePicture = async (
  file: File,
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsUploading(true);
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${BASE_URL}/users/profile-picture`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      }
    );
    setIsUploading(false);
    message.success("Profile picture uploaded successfully!");
    return response.data;
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Failed to upload profile picture"
    );
    setIsUploading(false);
    throw error.response ? error.response.data : error;
  }
};

export const updateFullProfile = async (
  payload,
  setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsUpdating(true);
  try {
    const response = await axios.post(
      `${BASE_URL}/api/profiles/settings/full-profile`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      }
    );
    setIsUpdating(false);
    message.success("Profile updated successfully!");
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Failed to update profile");
    setIsUpdating(false);
    throw error.response ? error.response.data : error;
  }
};

export const updateCampaignSettings = async (
  payload,
  setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsUpdating(true);
  try {
    const response = await axios.post(
      `${BASE_URL}/api/profiles/settings/campaign-settings`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      }
    );
    setIsUpdating(false);
    message.success("Profile updated successfully!");
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Failed to update profile");
    setIsUpdating(false);
    throw error.response ? error.response.data : error;
  }
};

export const fetchCampaignSettings = async () => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/profiles/settings/campaign-settings`,
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

export const verifyLicenseKeyApi = async (
  payload,
  setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsUpdating(true);
  try {
    await updateCampaignSettings(
      {
        smsMessagingService: payload.smsMessagingService,
        smsLicenseKey: payload.smsLicenseKey,
      },
      setIsUpdating
    );

    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/profiles/settings/campaign-settings/sms/verify-license-key`,
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
    //message.error(error.response?.data?.message || "Failed to update profile");
    setIsUpdating(false);
    throw error.response ? error.response.data : error;
  }
};

export const fetchProfileDetails = async () => {
  try {
    const userId = localStorage.getItem("userId");
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/profiles/settings/get-profile-details/${userId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // If profile not found, try the alternative API
      try {
        return await fetchUserDetails();
      } catch (innerError: any) {
        // If both APIs fail, return a default response
        console.error("Both API calls failed:", error, innerError);
        return {
          status: "error",
          data: {
            fullName: "User",
            email: "",
            mobileNumber: "",
            organizationName: "",
            billingAddress: "",
            state: "",
            pincode: "",
            countryCode: "",
            gst: "",
            subscription: "",
            profilePicture: "",
          },
        };
      }
    }
    throw error;
  }
};

export const fetchUserDetails = async () => {
  const jwtToken = await getjwtToken();
  const userId = localStorage.getItem("userId");
  const response = await axios.get(`${BASE_URL}/users/${userId}`, {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${jwtToken}`,
    },
  });
  console.log("User details fetched", response.data);
  return {
    status: "success",
    data: {
      firstName: response?.data?.data?.firstName,
      lastName: response?.data?.data?.lastName,
      email: response?.data?.data?.email,
      mobileNumber: response?.data?.data?.mobileNumber,
      organizationName: "",
      billingAddress: "",
      state: "",
      pincode: "",
      countryCode: "",
      gst: "",
      subscription: "",
      profilePicture: response?.data?.data?.profilePicture || "",
      isTwoFactorEnabled: response?.data?.data?.isTwoFactorEnabled,
      isOtpRequired: response?.data?.data?.isOtpRequired,
    },
  };
};

export const updateUserProfile = async (
  userId: string,
  profileData: {
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    role?: string;
  }
) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.put(
      `${BASE_URL}/users/${userId}`,
      profileData,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    // message.success("Profile updated successfully!");
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Failed to update profile");
    throw error.response ? error.response.data : error;
  }
};

export const updateUserOtpSetting = async (
  userId: number | string,
  enabled: boolean
) => {
  try {
    // Log the request for debugging
    console.log(
      "Sending PUT request to:",
      `${BASE_URL}/users/${userId}/two-factor`
    );
    console.log("Request body:", { enabled });

    const response = await axios.put(
      `${BASE_URL}/users/${userId}/two-factor`,
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
    console.error("Error updating user OTP setting:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
    }
    throw error;
  }
};

export const verifyElectionOtpAndEnable2FA = async (
  userId: number | string,
  otp: number | string
) => {
  try {
    console.log(
      "Sending PUT request to:",
      `${BASE_URL}/users/${userId}/verify-otp-required-otp`
    );
    console.log("OTP:", { otp });
    const params = {
      otp: otp.toString(),
    };

    const response = await axios.post(
      `${BASE_URL}/users/${userId}/verify-otp-required-otp`,
      {},
      {
        params: params,
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
      "Error verifying OTP while enabling/disabling 2FA for election:",
      error
    );
    if (axios.isAxiosError(error)) {
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
    }
    throw error;
  }
};

export const updateElectionOtpSetting = async (
  userId: number | string,
  isOtpRequired: boolean
) => {
  try {
    // Log the request for debugging
    console.log(
      "Sending PUT request to:",
      `${BASE_URL}/users/${userId}/otp-required`
    );
    console.log("Request body:", { isOtpRequired });

    const response = await axios.put(
      `${BASE_URL}/users/${userId}/otp-required`,
      { isOtpRequired },
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
    console.error("Error updating election OTP setting:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
    }
    throw error;
  }
};

export const verifyUsersOtpAndEnable2FA = async (
  userId: number | string,
  otp: number | string
) => {
  try {
    // Log the request for debugging
    console.log(
      "Sending PUT request to:",
      `${BASE_URL}/users/${userId}/verify-two-factor-otp`
    );
    console.log("OTP", { otp });
    const params = {
      otp: otp.toString(),
    };

    const response = await axios.post(
      `${BASE_URL}/users/${userId}/verify-two-factor-otp`,
      {},
      {
        params,
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
      "Error verifying OTP while enabling/disabling 2FA for user:",
      error
    );
    if (axios.isAxiosError(error)) {
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
    }
    throw error;
  }
};
