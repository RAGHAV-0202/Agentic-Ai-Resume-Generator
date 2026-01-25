import api from "./http.js";


export const signupAPI = (data) => {
    return api.post("/api/auth/signup", data)
}

export const loginAPI = (data) => {
    return api.post("/api/auth/login", data)
}

export const logoutAPI = () => {
    return api.post("/api/auth/logout")
}

export const isLoggedInAPI = () => {
    return api.get("/api/auth/isLoggedIn")
}   