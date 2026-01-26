import axios from "axios";
export const baseURL = "https://agentic-ai-resume-generator.onrender.com"

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  timeout: 15000,
});


api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Something went wrong";

    return Promise.reject(new Error(message));
  }
);

export default api;
