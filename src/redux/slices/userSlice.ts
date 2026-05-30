import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { UserState, ProfileDetails, Role, CampaignSettings } from "../../types";
import {
  updateProfileSettings,
  uploadProfilePicture,
  fetchProfileDetails,
  updateUserProfile,
} from "../../api/profileSettingsApi";
import { RootState } from "../../redux/store";

// Add this function to handle localStorage
const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

const initialState: UserState = {
  profileDetails: {
    profilePic: "",
    firstName: "",
    lastName: "",
    emailid: "",
    mobile: "",
    organizationName: "",
    billingAddress: "",
    country: "",
    state: "",
    pincode: "",
    gst: "",
    subscription: "",
  },
  roles: [],
  campaignSettings: {
    smsKey: "",
    rcs: "",
    whatsapp: "",
    voiceCall: "",
  },
  status: "idle",
  error: null,
};

export const fetchProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const authUser = state.auth.user;
      console.log("authUser", authUser);

      const response = await fetchProfileDetails();
      console.log("fetchProfile API Response:", response);

      // Get current profile pic from state to preserve it if no new one is provided
      const currentState = getState() as RootState;
      const currentProfilePic = currentState.userData.profileDetails.profilePic;

      const combinedData = {
        firstName:
          response.data?.firstName || authUser.fullName.split(" ")[0] || "",
        lastName:
          response.data?.lastName || authUser.fullName.split(" ")[1] || "",
        emailid: response.data?.email || authUser.email || "",
        alternateEmailId: response.data?.alternateEmailId,
        alternateMobileNumber: response.data?.alternateMobileNumber,
        mobile: response.data?.mobileNumber || authUser.mobileNumber || "",
        // profilePic: currentProfilePic || response.data?.profilePicture || "", // Preserve current profile pic
        profilePic: response.data?.profilePicture || "",
        organizationName: response.data?.organizationName || "",
        billingAddress: response.data?.billingAddress || "",
        country: response.data?.country || "",
        state: response.data?.state || "",
        pincode: response.data?.pincode || "",
        gst: response.data?.gst || "",
        subscription: response.data?.subscription || "",
      };
      console.log("combinedData", combinedData);
      saveToLocalStorage("userProfile", combinedData);
      return combinedData;
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      return rejectWithValue(
        "Failed to fetch profile. Please try again later."
      );
    }
  }
);

export const updateUserProfileDetails = createAsyncThunk(
  "user/updateUserProfile",
  async (
    profileData: Partial<ProfileDetails>,
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const userId = localStorage.getItem("userId");

      if (!userId) {
        throw new Error("User ID not found");
      }

      // Map the data to match the API expectations
      const apiData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.emailid,
        mobileNumber: profileData.mobile,
        role: profileData.role,
      };

      const response = await updateUserProfile(userId, apiData);

      return {
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        emailid: response.data.email,
        mobile: response.data.mobileNumber,
        role: response.data.role,
        ...response.data,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async (
    profileData: Partial<ProfileDetails>,
    { getState, rejectWithValue }
  ) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found");
      }

      const state = getState() as RootState;
      const currentProfile = state.userData.profileDetails;

      // First update the user profile via PUT endpoint
      const userProfileData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.emailid,
        mobileNumber: profileData.mobile,
      };

      // Update user profile
      await updateUserProfile(userId, userProfileData);

      // Then update profile settings
      const profileSettingsData = {
        fullName: `${profileData.firstName} ${profileData.lastName}`.trim(),
        email: profileData.emailid,
        mobileNumber: profileData.mobile,
        organizationName:
          profileData.organizationName ||
          currentProfile.organizationName ||
          "Default Organization", // Ensure organizationName is always provided
      };

      // Use a dummy setter function since we don't need state updates here
      const setIsUpdating = (value: boolean) => {};

      const response = await updateProfileSettings(
        profileSettingsData,
        setIsUpdating
      );

      return {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        emailid: profileData.emailid,
        mobile: profileData.mobile,
        organizationName:
          profileData.organizationName ||
          currentProfile.organizationName ||
          "Default Organization",
        ...response,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update profile");
    }
  }
);

export const uploadProfilePic = createAsyncThunk(
  "user/uploadProfilePic",
  async (file: File, { rejectWithValue }) => {
    try {
      const response = await uploadProfilePicture(file, () => {});
      return response.data.url;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const userSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    updateProfileDetails(
      state,
      action: PayloadAction<Partial<ProfileDetails>>
    ) {
      state.profileDetails = { ...state.profileDetails, ...action.payload };
    },
    addRole(state, action: PayloadAction<Role>) {
      state.roles.push(action.payload);
    },
    updateRole(
      state,
      action: PayloadAction<{ index: number; roleData: Partial<Role> }>
    ) {
      const { index, roleData } = action.payload;
      if (state.roles[index]) {
        state.roles[index] = { ...state.roles[index], ...roleData };
      }
    },
    removeRole(state, action: PayloadAction<number>) {
      state.roles.splice(action.payload, 1);
    },
    updateCampaignSettings(
      state,
      action: PayloadAction<Partial<CampaignSettings>>
    ) {
      state.campaignSettings = { ...state.campaignSettings, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.profileDetails = action.payload;
        state.error = action.payload.isDefaultData
          ? "Unable to fetch user data"
          : null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.profileDetails = { ...state.profileDetails, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(uploadProfilePic.pending, (state) => {
        state.status = "loading";
      })
      .addCase(uploadProfilePic.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.profileDetails.profilePic = action.payload;
      })
      .addCase(uploadProfilePic.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const {
  updateProfileDetails,
  addRole,
  updateRole,
  removeRole,
  updateCampaignSettings,
} = userSlice.actions;

export default userSlice.reducer;
