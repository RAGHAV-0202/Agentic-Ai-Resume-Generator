
import React, { useEffect, useState } from "react";
import {
    getAllUsersAPI,
    getAllResumesAPI,
    getResumeByIdForAdminAPI,
    getAdminProfileAPI,
    uploadTemplateAPI,
    adminLogoutAPI,
    deleteTemplateAPI,
    getAdminAnalyticsAPI
} from "../services/admin.api";
import { getAllTemplates } from "../services/template.api";
import { useNavigate } from "react-router-dom";
import { Loader2, Users, FileText, Upload, Trash2, LogOut, Shield, Search, Plus, X, Laptop, BarChart3, Zap, Target, MessageSquare, Activity } from "lucide-react";
import { baseURL } from "../services/http";

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("analytics"); // 'users' | 'resumes' | 'templates' | 'analytics'
    const [users, setUsers] = useState([]);
    const [resumes, setResumes] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [selectedResume, setSelectedResume] = useState(null);
    const [resumeDetailLoading, setResumeDetailLoading] = useState(false);
    const [adminAnalytics, setAdminAnalytics] = useState(null);
    const [authChecking, setAuthChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    // Template Form State
    const [newTemplate, setNewTemplate] = useState({
        name: "",
        slug: "",
        description: "",
        latexTemplate: "",
        requiredFields: "", // comma separated
        optionalFields: "", // comma separated
    });
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const verifyAdmin = async () => {
            try {
                await getAdminProfileAPI();
                setIsAuthenticated(true);
            } catch (error) {
                localStorage.removeItem('adminAccessToken');
                navigate('/admin/login');
            } finally {
                setAuthChecking(false);
            }
        };

        verifyAdmin();
    }, [navigate]);

    useEffect(() => {
        if (!authChecking && isAuthenticated) {
            fetchData();
        }
    }, [activeTab, authChecking, isAuthenticated]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === "users") {
                const res = await getAllUsersAPI();
                if (res.data?.data) setUsers(res.data.data);
            } else if (activeTab === "resumes") {
                const res = await getAllResumesAPI();
                if (res.data?.data) setResumes(res.data.data);
            } else if (activeTab === "analytics") {
                const res = await getAdminAnalyticsAPI();
                if (res.data?.data) setAdminAnalytics(res.data.data);
            } else {
                const res = await getAllTemplates();
                if (res.data?.data?.templates) setTemplates(res.data.data.templates);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            if (error.message?.includes("401") || error.response?.status === 401) {
                navigate("/admin/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await adminLogoutAPI();
            navigate("/admin/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setThumbnailFile(e.target.files[0]);
        }
    };

    const handleUploadTemplate = async (e) => {
        e.preventDefault();
        setUploading(true);

        const formData = new FormData();
        formData.append("name", newTemplate.name);
        formData.append("slug", newTemplate.slug);
        formData.append("description", newTemplate.description);
        formData.append("latexTemplate", newTemplate.latexTemplate);

        // Convert comma strings to arrays? Backend expects arrays for requiredFields?
        // Let's assume backend parsing or we send JSON string if needed.
        // Actually backend schema says [String]. FormData sends strings.
        // We might need to append multiple times or rely on backend handling.
        // Let's just send them as is for now and see, or better:
        // No, backend probably expects JSON body usually, but with multer it's formData.
        // Mongoose might not auto-split strings to array.
        // Let's rely on backend logic update later if needed, but standard FormData array handling:
        // formData.append("requiredFields", ...);
        // Simplest: just send basic fields first.

        if (thumbnailFile) {
            formData.append("thumbnail", thumbnailFile);
        }

        try {
            await uploadTemplateAPI(formData);
            setShowUploadModal(false);
            fetchData(); // Refresh list
            setNewTemplate({ name: "", slug: "", description: "", latexTemplate: "", requiredFields: "", optionalFields: "" });
            setThumbnailFile(null);
            alert("Template created successfully!");
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload template: " + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        try {
            await deleteTemplateAPI(id);
            fetchData();
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete template");
        }
    };

    const handleViewResume = async (resumeId) => {
        setResumeDetailLoading(true);
        setShowResumeModal(true);
        try {
            const res = await getResumeByIdForAdminAPI(resumeId);
            if (res.data?.data) {
                setSelectedResume(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch resume details:", error);
            alert("Unable to fetch resume details");
            setShowResumeModal(false);
        } finally {
            setResumeDetailLoading(false);
        }
    };

    return (
        authChecking ? (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        ) : (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Shield size={18} />
                    </div>
                    <span className="font-bold text-lg">Admin Panel</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab("analytics")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "analytics" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        <BarChart3 size={20} />
                        <span className="font-medium">Analytics</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("templates")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "templates" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        <FileText size={20} />
                        <span className="font-medium">Templates</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "users" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        <Users size={20} />
                        <span className="font-medium">Users</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("resumes")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "resumes" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        <Laptop size={20} />
                        <span className="font-medium">Resumes</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl transition-all"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            {activeTab === "users" ? "User Management" : activeTab === "resumes" ? "Resume Library" : activeTab === "analytics" ? "Platform Analytics" : "Template Library"}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {activeTab === "analytics" ? "Real-time platform usage metrics" : `Manage your application's ${activeTab}`}
                        </p>
                    </div>

                    {activeTab === "templates" && (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
                        >
                            <Upload size={18} />
                            Upload Template
                        </button>
                    )}
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <>
                        {activeTab === "analytics" && adminAnalytics && (() => {
                            const t = adminAnalytics.totals || {};
                            const dailyData = adminAnalytics.dailyActivity || [];
                            const maxCount = Math.max(...dailyData.map(d => d.count), 1);
                            const eventBreak = adminAnalytics.eventBreakdown || [];
                            const maxEvent = Math.max(...eventBreak.map(e => e.count), 1);
                            const EVENT_COLORS = { ai_chat: '#8b5cf6', ats_analyze: '#10b981', grammar_check: '#f59e0b', tts: '#ec4899', pdf_compile: '#3b82f6', resume_create: '#06b6d4' };
                            const EVENT_LABELS = { ai_chat: 'AI Chats', ats_analyze: 'ATS Analyses', grammar_check: 'Grammar Checks', tts: 'TTS Requests', pdf_compile: 'PDF Compiles', resume_create: 'Resumes Created' };

                            return (
                                <div className="space-y-6">
                                    {/* Stat Cards */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Total Users', value: adminAnalytics.totalUsers, icon: Users, color: 'bg-blue-500' },
                                            { label: 'Total Resumes', value: adminAnalytics.totalResumes, icon: FileText, color: 'bg-violet-500' },
                                            { label: 'Tokens Used', value: t.totalTokens || 0, icon: Zap, color: 'bg-amber-500' },
                                            { label: 'Active (7d)', value: adminAnalytics.activeUsers7d, icon: Activity, color: 'bg-emerald-500' },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                                        <stat.icon size={16} className="text-white" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{stat.label}</span>
                                                </div>
                                                <p className="text-3xl font-bold text-slate-900">{(stat.value || 0).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Usage Chart */}
                                    {dailyData.length > 0 && (
                                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Usage — Last 30 Days</h3>
                                            <div className="flex items-end gap-[3px] h-32">
                                                {dailyData.map((d, i) => (
                                                    <div key={i} className="flex-1 group relative">
                                                        <div
                                                            className="bg-blue-500 rounded-t hover:bg-blue-600 transition-colors w-full"
                                                            style={{ height: `${Math.max((d.count / maxCount) * 100, 3)}%` }}
                                                            title={`${d._id}: ${d.count} events`}
                                                        />
                                                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                                                            {d._id}: {d.count}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between mt-2">
                                                <span className="text-[10px] text-slate-400">{dailyData[0]?._id}</span>
                                                <span className="text-[10px] text-slate-400">{dailyData[dailyData.length - 1]?._id}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Event Breakdown */}
                                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Event Breakdown</h3>
                                            <div className="space-y-3">
                                                {eventBreak.map((e, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="font-medium text-slate-600">{EVENT_LABELS[e._id] || e._id}</span>
                                                            <span className="font-bold text-slate-800">{e.count.toLocaleString()}</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all"
                                                                style={{ width: `${(e.count / maxEvent) * 100}%`, backgroundColor: EVENT_COLORS[e._id] || '#94a3b8' }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Top Users */}
                                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Top Users by Activity</h3>
                                            <div className="space-y-2">
                                                {(adminAnalytics.topUsers || []).map((u, i) => (
                                                    <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                            {i + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-800 truncate">{u.name || 'Unknown'}</p>
                                                            <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-slate-800">{u.events}</p>
                                                            <p className="text-[10px] text-slate-400">{(u.tokens || 0).toLocaleString()} tokens</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Extra stats row */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
                                            <p className="text-2xl font-bold text-slate-900">{t.aiChats || 0}</p>
                                            <p className="text-xs text-slate-500 mt-1">AI Messages</p>
                                        </div>
                                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
                                            <p className="text-2xl font-bold text-slate-900">{t.ttsRequests || 0}</p>
                                            <p className="text-xs text-slate-500 mt-1">TTS Requests</p>
                                        </div>
                                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
                                            <p className="text-2xl font-bold text-slate-900">{(t.totalCharacters || 0).toLocaleString()}</p>
                                            <p className="text-xs text-slate-500 mt-1">TTS Characters</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {activeTab === "users" && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4">ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {users.map(user => (
                                            <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900">{user.fullName || "N/A"}</td>
                                                <td className="px-6 py-4">{user.email}</td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-400">{user._id}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === "resumes" && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">Resume</th>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Template</th>
                                            <th className="px-6 py-4">Public</th>
                                            <th className="px-6 py-4">Updated</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {resumes.map((resume) => (
                                            <tr key={resume._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{resume.resumeName || "Untitled Resume"}</div>
                                                    <div className="font-mono text-[11px] text-slate-400 mt-0.5">{resume._id}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-800">{resume.userId?.name || "Unknown"}</div>
                                                    <div className="text-xs text-slate-500">{resume.userId?.email || "No email"}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-700">{resume.templateId?.name || "No template"}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${resume.isPublic ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                                        {resume.isPublic ? "Public" : "Private"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">{new Date(resume.updatedAt).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleViewResume(resume._id)}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === "templates" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {templates.map(template => (
                                    <div key={template._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
                                        <div className="aspect-[3/4] relative bg-slate-100 border-b border-slate-100">
                                            <img
                                                src={template.thumbnailUrl || "https://placehold.co/400x600?text=No+Image"}
                                                alt={template.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleDeleteTemplate(template._id)}
                                                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-slate-800 truncate">{template.name}</h3>
                                            <p className="text-xs text-slate-500 mt-1 truncate">{template.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Resume Detail Modal */}
            {showResumeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Resume Detail</h2>
                                {selectedResume && <p className="text-xs text-slate-500 mt-1">{selectedResume.resumeName || "Untitled Resume"}</p>}
                            </div>
                            <button onClick={() => { setShowResumeModal(false); setSelectedResume(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {resumeDetailLoading ? (
                                <div className="h-48 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                </div>
                            ) : selectedResume ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Owner</p>
                                            <p className="text-sm font-semibold text-slate-800">{selectedResume.userId?.name || "Unknown"}</p>
                                            <p className="text-xs text-slate-500 mt-1">{selectedResume.userId?.email || "No email"}</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Template</p>
                                            <p className="text-sm font-semibold text-slate-800">{selectedResume.templateId?.name || "No template"}</p>
                                            <p className="text-xs text-slate-500 mt-1">{selectedResume.templateId?.slug || "-"}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                                            <p className="text-xs text-slate-500">Experience Entries</p>
                                            <p className="text-2xl font-bold text-slate-800">{selectedResume.data?.experience?.length || 0}</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                                            <p className="text-xs text-slate-500">Projects</p>
                                            <p className="text-2xl font-bold text-slate-800">{selectedResume.data?.projects?.length || 0}</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                                            <p className="text-xs text-slate-500">Skills (Languages)</p>
                                            <p className="text-2xl font-bold text-slate-800">{selectedResume.data?.skills?.languages?.length || 0}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Summary</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">{selectedResume.data?.summary || "No summary"}</p>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">PDF Preview</p>
                                            {selectedResume.pdfUrl && (
                                                <a
                                                    href={`${baseURL}${selectedResume.pdfUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                                >
                                                    Open PDF
                                                </a>
                                            )}
                                        </div>
                                        <div className="bg-slate-100">
                                            {selectedResume.pdfUrl ? (
                                                <iframe
                                                    src={`${baseURL}${selectedResume.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                                    title="Resume PDF Preview"
                                                    className="w-full h-[720px] border-0 bg-white"
                                                />
                                            ) : (
                                                <div className="h-40 flex items-center justify-center text-sm text-slate-500">
                                                    No PDF available for this resume yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {selectedResume.pdfUrl && (
                                            <a
                                                href={`${baseURL}${selectedResume.pdfUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                            >
                                                View PDF
                                            </a>
                                        )}
                                        <a
                                            href={`/resume/${selectedResume._id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition-colors"
                                        >
                                            Open Share Page
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500">No resume selected.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-800">New Template</h2>
                            <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUploadTemplate} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Template Name</label>
                                    <input
                                        type="text"
                                        value={newTemplate.name}
                                        onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="e.g. Modern Professional"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Slug (ID)</label>
                                    <input
                                        type="text"
                                        value={newTemplate.slug}
                                        onChange={e => setNewTemplate({ ...newTemplate, slug: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="e.g. modern-pro"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Description</label>
                                <textarea
                                    value={newTemplate.description}
                                    onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-24 resize-none"
                                    placeholder="Brief description of the template..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">LaTeX Code</label>
                                <textarea
                                    value={newTemplate.latexTemplate}
                                    onChange={e => setNewTemplate({ ...newTemplate, latexTemplate: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-64 font-mono text-xs"
                                    placeholder="\documentclass{article}..."
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Thumbnail Image</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        <Upload size={24} />
                                        <span className="text-sm font-medium">
                                            {thumbnailFile ? thumbnailFile.name : "Click to upload image"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {uploading && <Loader2 size={16} className="animate-spin" />}
                                    {uploading ? "Uploading..." : "Create Template"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        )
    );
};

export default AdminDashboard;
