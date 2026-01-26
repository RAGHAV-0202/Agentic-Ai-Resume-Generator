import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import TemplateCard from '../components/TemplateCard';
import { getAllTemplates } from '../services/template.api';
import { LayoutTemplate, Menu, X } from 'lucide-react';

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await getAllTemplates();
                // Handle various response structures to be robust
                let templatesData = [];
                if (response.data?.data?.templates && Array.isArray(response.data.data.templates)) {
                    templatesData = response.data.data.templates;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    templatesData = response.data.data;
                } else if (response.data && Array.isArray(response.data)) {
                    templatesData = response.data;
                } else if (response.data?.templates && Array.isArray(response.data.templates)) {
                    templatesData = response.data.templates;
                }

                setTemplates(templatesData);
            } catch (err) {
                console.error("Failed to fetch templates", err);
                setError("Failed to load templates. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
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
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Templates Library</h1>
                                    <p className="text-slate-500 mt-1">Choose a professional design to start building your resume.</p>
                                </div>
                            </div>
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
                        ) : templates.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-slate-500">No templates found. Please check back later.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {templates.map((template) => (
                                    <TemplateCard key={template._id || Math.random()} template={template} />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Templates;
