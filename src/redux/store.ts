import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import electionReducer from "./slices/electionSlice";
import bulkUploadReducer from "./slices/bulkUploadSlice";
import subscriptionReducer from "./slices/subscriptionSlice";

const persistConfig = {
  key: "root",
  storage,
  blacklist: ["subscription"], // Don't persist subscription - always fetch fresh from API
};

const rootReducer = (state: any, action: any) => {
  if (action.type === "LOGOUT") {
    storage.removeItem("persist:root"); // Clears persisted state
    state = undefined; // Reset Redux state
  }
return combineReducers({
  auth: authReducer,
  userData: userReducer,
  election: electionReducer,
  bulkUpload: bulkUploadReducer,
  subscription: subscriptionReducer,
})(state, action);
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;