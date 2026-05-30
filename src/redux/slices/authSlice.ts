// src/redux/slices/authSlice.ts

import { createSlice } from '@reduxjs/toolkit';
import { UserData } from '../../types';

// Define the initial state
interface AuthState {
  user: null | UserData;
  rolePermission: Record<string, string[]>;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: null | string;
}

const initialState: AuthState = {
    user: null,
    status: 'idle',
     rolePermission: {},
    error: null,
};

// Create the slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        updateUserData: (state, action) => {
          state.user = action.payload;
          state.rolePermission = action.payload.rolePermission || {}; // Ensure rolePermission is stored
        },
        // New action to update only the mobile number
        updateMobileNumber: (state, action) => {
            if (state.user) {
                state.user.mobileNumber = action.payload;
            } else {
                state.user = { mobileNumber: action.payload } as UserData;
            }
        },
    },
});

export const { updateUserData, updateMobileNumber } = authSlice.actions;
export default authSlice.reducer;
