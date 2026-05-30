// export const BASE_URL = "https://thedal-api.hostwire.cloud";

// export const BASE_URL = "https://thedal-app.1q3ff9z04yrb.us-south.codeengine.appdomain.cloud";
// export const BASE_URL = "https://thedal-backend-production.up.railway.app";
// export const BASE_URL = "http://localhost:8080";

// export const BASE_URL = "https://api.thedal.co.in";

export const MAIN_BACKEND_URL = import.meta.env.VITE_MAIN_BACKEND_URL || "https://api.thedal.co.in";
export const SECONDARY_BACKEND_URL = import.meta.env.VITE_SECONDARY_BACKEND_URL || "https://api.thedal.co.in";

// Phone numbers that should use secondary backend
const SECONDARY_PHONE_NUMBERS = [
  "7092505054",
  "7092505056",
  "7092505053",
  "7092505057"
];

export const getBackendUrl = (phoneNumber: string): string => {
  const cleanPhone = phoneNumber?.replace(/[\s\-\+]/g, '');
  return SECONDARY_PHONE_NUMBERS.includes(cleanPhone) ? SECONDARY_BACKEND_URL : MAIN_BACKEND_URL;
};

const BACKEND_URL_STORAGE_KEY = "activeBackendUrl";
const _stored = localStorage.getItem(BACKEND_URL_STORAGE_KEY);
const _validStored = (_stored && !_stored.includes("localhost")) ? _stored : null;
let activeBackendUrl =
  _validStored ||
  import.meta.env.VITE_BASE_URL ||
  MAIN_BACKEND_URL;

export const setActiveBackendUrl = (url: string): void => {
  activeBackendUrl = url || MAIN_BACKEND_URL;
  localStorage.setItem(BACKEND_URL_STORAGE_KEY, activeBackendUrl);
};

export const getActiveBackendUrl = (): string => {
  const stored = localStorage.getItem(BACKEND_URL_STORAGE_KEY);
  if (stored && !stored.includes("localhost")) {
    activeBackendUrl = stored;
  }
  return activeBackendUrl || MAIN_BACKEND_URL;
};

export const clearActiveBackendUrl = (): void => {
  activeBackendUrl = MAIN_BACKEND_URL;
  localStorage.removeItem(BACKEND_URL_STORAGE_KEY);
};

// Default BASE_URL for backward compatibility (dynamic)
const baseUrlRef = {
  toString: () => getActiveBackendUrl(),
  valueOf: () => getActiveBackendUrl()
};

export const BASE_URL = baseUrlRef as unknown as string;
