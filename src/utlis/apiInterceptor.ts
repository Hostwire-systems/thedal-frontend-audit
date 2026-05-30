import axios from "axios";
import { message } from "antd";

let responseInterceptorId = null;

export const setupApiInterceptor = () => {
  if (responseInterceptorId !== null) {
    return;
  }

  responseInterceptorId = axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const errorMessage = error.response?.data?.message;
      const errorCode = error.response?.data?.code;

      // Handle election freeze errors
      if (errorCode === 70247) {
        message.error('Election is frozen. No modifications allowed.');
        return Promise.reject(error);
      }

      // Any 401 → clear session and redirect to login
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );
};
