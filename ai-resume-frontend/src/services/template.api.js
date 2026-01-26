import api from "./http.js";


export const getAllTemplates = ()=>{
    return api.get("/api/template")
}

export const getTemplateById = (id) => {
    return api.get(`/api/templates/${id}`)
}