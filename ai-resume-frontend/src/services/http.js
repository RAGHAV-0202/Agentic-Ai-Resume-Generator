import axios from "axios";
export const baseURL = "https://agentic-ai-resume-generator.onrender.com"

// export const baseURL = "http://localhost:8000"

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  timeout: 30000,
});


api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    const adminAccessToken = localStorage.getItem("adminAccessToken");

    // Simple logic: if request path starts with /api/admin or /api/template/ (for create/update), prioritize admin token
    // Actually, template fetch is public, but create is admin. 
    // Let's just say: if adminAccessToken exists, we can use it?
    // Wait, conflicts if user is also logged in.

    // Better: If we are on an admin page or calling admin API, we use admin token.
    // However, interceptor doesn't know the "page".
    // Let's check if the URL is an admin specific URL.

    if (config.url?.includes("/api/admin") || (config.method !== 'get' && config.url?.includes("/api/template"))) {
      if (adminAccessToken) {
        config.headers.Authorization = `Bearer ${adminAccessToken}`;
        return config;
      }
    }

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

export const toggleResumePublicStatus = async (id, isPublic) => {
  const response = await api.patch(`/api/resume/${id}/data`, { isPublic });
  return response.data;
};

export const getPublicResume = async (id) => {
  // Use a fresh axios instance without the auth interceptors
  const publicApi = axios.create({ baseURL });
  const response = await publicApi.get(`/api/public/resumes/${id}`);
  return response.data;
};
