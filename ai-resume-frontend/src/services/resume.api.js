import api from "./http";

export const CreateResumeSession = (data) => {
    return api.post("/api/resume", data) // template id
}

export const GetUserResume = () => {
    return api.get("/api/resume")
}

export const GetResumeById = (id) => {
    return api.get(`/api/resume/${id}`)
}

export const DeleteResume = (id) => { 
    return api.delete(`/api/resume/${id}`)
}

export const ChangeTemplate = (id) => {
    return api.put(`/api/resume/${id}/template`)
}

export const StartChat = (data) => {
    return api.post("/api/chat/start", data) // resumeId
}

export const ChatWithAgent = (data) => {
    return api.post("/api/chat", data) // resumeId , message
}

export const GeneratePdf = (data) => {
    return api.get(`/api/pdf/generate/${data}`) // resumeId
}

export const RecompilePdf = (resumeId) => { // ✅ NEW - for manual recompile
    return api.post(`/api/pdf/recompile/${resumeId}`)
}

export const DownloadPdf = (resumeId) => { // ✅ NEW - for download
    return api.get(`/api/pdf/download/${resumeId}`, {
        responseType: 'blob' // Important for file download
    })
}