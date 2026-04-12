import api from "./http.js";

// Login Admin
export const adminLoginAPI = async (data) => {
    const response = await api.post("/api/admin/login", data);
    const at = response.data.data.AdminAccessToken;
    localStorage.setItem('adminAccessToken', at);
    return response;
};

export const adminLogoutAPI = () => {
    localStorage.removeItem('adminAccessToken');
    return api.post("/api/admin/logout");
};

// Get Admin Profile
export const getAdminProfileAPI = () => {
    return api.get("/api/admin/me");
};

// Get All Users
export const getAllUsersAPI = () => {
    return api.get("/api/admin/users");
};

export const getAllResumesAPI = () => {
    return api.get("/api/admin/resumes");
};

export const getResumeByIdForAdminAPI = (resumeId) => {
    return api.get(`/api/admin/resumes/${resumeId}`);
};

export const generateResumePdfForAdminAPI = (resumeId) => {
    return api.post(`/api/admin/resumes/${resumeId}/pdf`);
};

export const uploadTemplateAPI = (formData) => {
    // formData should contain 'thumbnail' and other fields
    return api.post("/api/template", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const updateTemplateAPI = (id, formData) => {
    return api.put(`/api/template/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const deleteTemplateAPI = (id) => {
    return api.delete(`/api/template/${id}`);
};

export const getAdminAnalyticsAPI = () => {
    return api.get("/api/admin/analytics");
};
