import React from 'react';
import { FileText, MoreVertical, Edit, Download, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ResumeCard = ({ resume }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/editor/${resume._id}`)}
            className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[320px]"
        >
            {/* Preview Area (Placeholder for now) */}
            <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100 group-hover:bg-blue-50/50 transition-colors">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                    <FileText size={80} className="text-blue-600" />
                </div>
                {/* Mock lines for document look */}
                <div className="w-24 h-32 bg-white shadow-sm rounded border border-slate-200 p-3 flex flex-col gap-2 transform group-hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-2 bg-slate-200 rounded-full"></div>
                    <div className="w-2/3 h-2 bg-slate-200 rounded-full"></div>
                    <div className="w-full h-16 bg-slate-100 rounded mt-1"></div>
                </div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <button className="p-2 bg-white rounded-lg shadow-sm hover:text-blue-600 transition-colors">
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 truncate pr-2 group-hover:text-blue-600 transition-colors">
                        {resume.resumeTitle || resume.title || 'Untitled Resume'}
                    </h3>
                    {resume.isFavorite && <Star size={16} className="text-amber-400 fill-amber-400" />}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-medium">
                    <Clock size={12} />
                    <span>Edited {new Date(resume.updatedAt || Date.now()).toLocaleDateString()}</span>
                </div>

                <div className="mt-auto flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/editor/${resume._id}`)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-slate-900 group-hover:bg-blue-600 py-2.5 rounded-xl transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-blue-500/20"
                    >
                        <Edit size={16} />
                        Edit
                    </button>
                    <button
                        className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                        title="Download PDF"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Add download handler
                        }}
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResumeCard;
