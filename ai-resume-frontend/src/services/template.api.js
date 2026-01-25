import api from "./http.js";


export const getAllTemplates = ()=>{
    return api.get("/api/templates")
}