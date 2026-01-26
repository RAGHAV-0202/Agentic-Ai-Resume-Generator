// src/pages/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ResumeCard from '../components/ResumeCard';
import { GetUserResume } from '../services/resume.api';
import { Plus, FileText, Menu, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const navigate = useNavigate();
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        fetchResumes();
    }, []);

    const fetchResumes = async () => {
        try {
            setLoading(true);
            const response = await GetUserResume();
            
            // Handle various response structures
            let resumesData = [];
            if (response.data?.data?.resumes && Array.isArray(response.data.data.resumes)) {
                resumesData = response.data.data.resumes;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                resumesData = response.data.data;
            } else if (response.data && Array.isArray(response.data)) {
                resumesData = response.data;
            } else if (response.data?.resumes && Array.isArray(response.data.resumes)) {
                resumesData = response.data.resumes;
            }

            setResumes(resumesData);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch resumes", err);
            setError("Failed to load your resumes. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResume = (deletedId) => {
        setResumes(prev => prev.filter(r => r._id !== deletedId));
    };

    return (
        <div className='min-h-screen bg-slate-50 flex flex-col font-sans'>
            <Navbar />

            <div className='flex flex-1 pt-16 relative'>
                <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

                <main className='flex-1 p-6 md:p-10 overflow-y-auto w-full'>
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <button
                                    className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900"
                                    onClick={() => setMobileMenuOpen(true)}
                                >
                                    <Menu size={24} />
                                </button>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                                        Dashboard
                                    </h1>
                                    <p className="text-slate-500 mt-1">
                                        Manage your professional resumes
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/templates')}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Plus size={20} />
                                <span>Create New Resume</span>
                            </button>
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                <p className="text-slate-500">Loading your resumes...</p>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 flex items-start gap-4">
                                <div className="p-2 bg-red-100 rounded-lg shrink-0">
                                    <AlertCircle size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-1">Error Loading Resumes</h3>
                                    <p className="text-sm">{error}</p>
                                    <button 
                                        onClick={fetchResumes}
                                        className="mt-3 text-sm font-medium hover:underline"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        ) : resumes.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border-2 border-slate-200 border-dashed shadow-sm">
                                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    No resumes yet
                                </h3>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                    Get started by creating your first professional resume with our AI-powered builder.
                                </p>
                                <button
                                    onClick={() => navigate('/templates')}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-sm"
                                >
                                    <Plus size={20} />
                                    Create Your First Resume
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-600">
                                        {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'} found
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {resumes.map((resume) => (
                                        <ResumeCard 
                                            key={resume._id} 
                                            resume={resume}
                                            onDelete={handleDeleteResume}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Dashboard;