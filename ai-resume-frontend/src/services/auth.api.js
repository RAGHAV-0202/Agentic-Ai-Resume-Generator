import api from "./http.js";


export const signupAPI = async(data) => {
    const response = await api.post("/api/auth/register", data)
    const at = response.data.data.accessToken
    localStorage.setItem('accessToken' , at)
    return response
}

export const loginAPI = async(data) => {
    const response = await api.post("/api/auth/login", data)
    const at = response.data.data.accessToken
    localStorage.setItem('accessToken' , at)
    return response
}

export const googleLoginAPI = async(data) => {
    const response = await api.post("/api/auth/google", data)
    const at = response.data.data.accessToken
    localStorage.setItem('accessToken', at)
    return response
}

export const logoutAPI = () => {
    localStorage.removeItem('accessToken')
    return api.post("/api/auth/logout")
}

export const isLoggedInAPI = () => {
    return api.get("/api/auth/isLoggedIn")
}   