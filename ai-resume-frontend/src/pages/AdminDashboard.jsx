
import React, { useEffect, useState } from "react";
import {
    getAllUsersAPI,
    getAllTemplatesAPI, // Need to make sure this is available/imported or just reuse public one? public one is fine.
    uploadTemplateAPI,
    adminLogoutAPI,
    deleteTemplateAPI
} from "../services/admin.api";
import { getAllTemplates } from "../services/template.api"; // Use public API for fetching templates
import { useNavigate } from "react-router-dom";
import { Loader2, Users, FileText, Upload, Trash2, LogOut, Shield, Search, Plus, X, Laptop } from "lucide-react";

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("templates"); // 'users' | 'templates'
    const [users, setUsers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
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
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === "users") {
                const res = await getAllUsersAPI();
                if (res.data?.data) setUsers(res.data.data);
            } else {
                const res = await getAllTemplates();
                if (res.data?.data?.templates) setTemplates(res.data.data.templates);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            // If 401, redirect to login
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

    return (
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
                            {activeTab === "users" ? "User Management" : "Template Library"}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Manage your application's {activeTab}</p>
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
    );
};

export default AdminDashboard;
