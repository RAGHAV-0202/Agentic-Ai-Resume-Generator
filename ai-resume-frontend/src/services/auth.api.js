import api from "./http.js";


export const signupAPI = (data) => {
    return api.post("/api/auth/signup", data)
}

export const loginAPI = async(data) => {
    const response = await api.post("/api/auth/login", data)
    console.log(response.cookies)
    return response
}

export const logoutAPI = () => {
    return api.post("/api/auth/logout")
}

export const isLoggedInAPI = () => {
    return api.get("/api/auth/isLoggedIn")
}   