import api from "./http";

export const CreateResumeSession = (data) => {
    return api.post("/api/resume", data) // template id
}

export const GetUserResume = () => {
    return api.get("/api/resume")
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