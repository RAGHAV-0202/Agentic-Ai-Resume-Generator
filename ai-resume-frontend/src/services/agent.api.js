import api from "./http";

export const StartAgentChat = (data) => api.post('/agent/start', data);

export const MsgAgent = (data) => api.post('/agent/message', data);

export const UpdateResumeData = (data) => api.post('/agent/update', data);

export const GetAgentStatus = (resumeId) => api.get(`/agent/status/${resumeId}`);

export const ResetAgentChat = (resumeId) => api.post(`/agent/reset/${resumeId}`);
