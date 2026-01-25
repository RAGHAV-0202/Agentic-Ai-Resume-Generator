import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ResumeCard from '../components/ResumeCard';
import { GetUserResume } from '../services/resume.api';
import { Plus, LayoutDashboard, Settings, FileText, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Sidebar({ mobileOpen, setMobileOpen }) {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', active: true },
        { icon: FileText, label: 'My Resumes', active: false },
        { icon: Settings, label: 'Settings', active: false },
    ];

    return (
        <React.Fragment>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Content */}
            <aside className={`
                fixed md:sticky top-[64px] left-0 h-[calc(100vh-64px)] w-64 bg-white border-r border-slate-200 
                flex flex-col transition-transform duration-300 ease-in-out z-40
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6">
                    <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">Main Menu</h2>
                    <div className="space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.label}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group font-medium text-sm
                                    ${item.active
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                <item.icon size={20} className={item.active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto p-6 border-t border-slate-100">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                        <p className="text-xs font-medium text-blue-100 mb-1">Pro Plan</p>
                        <h4 className="text-sm font-bold mb-3">Upgrade to Premium</h4>
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors">
                            View Plans
                        </button>
                    </div>
                </div>
            </aside>
        </React.Fragment>
    )
}

function Dashboard() {
    const navigate = useNavigate();
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const response = await GetUserResume();
                // Handle various response structures to be robust
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
            } catch (err) {
                console.error("Failed to fetch resumes", err);
                setError("Failed to load your resumes.");
            } finally {
                setLoading(false);
            }
        };

        fetchResumes();
    }, []);

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
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                                    <p className="text-slate-500 mt-1">Manage your professional resumes and templates.</p>
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
                            <div className="flex items-center justify-center h-64">
                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <X size={20} />
                                </div>
                                {error}
                            </div>
                        ) : resumes.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm">
                                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No resumes found</h3>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">It looks like you haven't created any resumes yet. Start with one of our professional templates.</p>
                                <button
                                    onClick={() => navigate('/templates')}
                                    className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
                                >
                                    Browse Templates &rarr;
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {resumes.map((resume) => (
                                    <ResumeCard key={resume._id || Math.random()} resume={resume} />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Dashboard