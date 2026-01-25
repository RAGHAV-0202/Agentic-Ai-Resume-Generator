import axios from "axios";

const api = axios.create({
    baseURL: "https://agentic-ai-resume-generator.onrender.com",
    withCredentials: true,
    timeout: 15000,
});

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
