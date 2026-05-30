// src/redux/slices/subscriptionSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SubscriptionModule {
  id: number;
  moduleKey: string;
  moduleName: string;
  moduleDescription?: string;
  parentModuleId?: number;
  displayOrder: number;
  isActive: boolean;
  iconName?: string;
  routePath?: string;
  submodules?: SubscriptionModule[];
}

interface SubscriptionState {
  accessibleModuleKeys: string[];
  accessibleModules: SubscriptionModule[];
  allModules: SubscriptionModule[];
  isLoaded: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  accessibleModuleKeys: [],
  accessibleModules: [],
  allModules: [],
  isLoaded: false,
  loading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setModuleAccess: (state, action: PayloadAction<{
      accessibleModuleKeys: string[];
      accessibleModules: SubscriptionModule[];
    }>) => {
      state.accessibleModuleKeys = action.payload.accessibleModuleKeys;
      state.accessibleModules = action.payload.accessibleModules;
      state.isLoaded = true;
      state.loading = false;
      state.error = null;
    },
    setAllModules: (state, action: PayloadAction<SubscriptionModule[]>) => {
      state.allModules = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
      state.isLoaded = true; // stop retry loops — even on error the load attempt is done
    },
    clearSubscriptionData: (state) => {
      state.accessibleModuleKeys = [];
      state.accessibleModules = [];
      state.allModules = [];
      state.isLoaded = false;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setModuleAccess,
  setAllModules,
  setLoading,
  setError,
  clearSubscriptionData,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;

// Selectors
export const selectAccessibleModuleKeys = (state: { subscription: SubscriptionState }) => 
  state.subscription.accessibleModuleKeys;

export const selectAccessibleModules = (state: { subscription: SubscriptionState }) => 
  state.subscription.accessibleModules;

export const selectAllModules = (state: { subscription: SubscriptionState }) => 
  state.subscription.allModules;

export const selectIsSubscriptionLoaded = (state: { subscription: SubscriptionState }) => 
  state.subscription.isLoaded;

export const selectHasModuleAccess = (moduleKey: string) => 
  (state: { subscription: SubscriptionState }) => 
    state.subscription.accessibleModuleKeys.includes(moduleKey);
