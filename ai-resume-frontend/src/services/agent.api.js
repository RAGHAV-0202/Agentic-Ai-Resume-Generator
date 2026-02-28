import api from "./http";

export const StartAgentChat = (data) => api.post('api/agent/start', data);

export const MsgAgent = (data) => api.post('api/agent/message', data);

export const UpdateResumeData = (data) => api.post('/agent/update', data);

export const GetAgentStatus = (resumeId) => api.get(`api/agent/status/${resumeId}`);

export const ResetAgentChat = (resumeId) => api.post(`api/agent/reset/${resumeId}`);

export const SkipAgentQuestion = (data) => api.post('api/agent/skip', data);

export const AnalyzeATS = (data) => api.post('api/agent/ats-analyze', data);

export const CheckGrammar = (data) => api.post('api/agent/grammar-check', data);

export const GetUserAnalytics = () => api.get('api/agent/analytics/me');

export const EnhanceBullet = (data) => api.post('api/agent/enhance-bullet', data);
