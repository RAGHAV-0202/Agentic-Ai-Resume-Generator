import api from "./http.js";

// Login Admin
export const adminLoginAPI = async (data) => {
    // data: { email, password }
    const response = await api.post("/api/admin/login", data);
    const at = response.data.data.AdminAccessToken;
    // Store admin token separately to avoid conflict with user token?
    // Let's store it as 'adminAccessToken'
    localStorage.setItem('adminAccessToken', at);
    return response;
};

// Logout Admin
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

// Template Operations
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
