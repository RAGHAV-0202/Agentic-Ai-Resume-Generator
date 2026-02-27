import api, { baseURL } from "./http";

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

export const ChangeTemplate = ({ id, templateId }) => {
    return api.put(`/api/resume/${id}/template`, { templateId })
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
    console.log("recompile called")
    return api.post(`/api/pdf/recompile/${resumeId}`)
}

export const DownloadPdf = async (resumeId) => { // ✅ NEW - for download
    const response = await api.post(`/api/pdf/recompile/${resumeId}`, {
    })
    return baseURL + response.data.data.pdfUrl
}

export const UpdateResumeData = (id, data) => {
    return api.patch(`/api/resume/${id}/data`, { data })
}