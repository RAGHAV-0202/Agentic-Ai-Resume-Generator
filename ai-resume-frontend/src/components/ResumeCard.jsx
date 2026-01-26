// src/components/ResumeCard.jsx

import React from 'react';
import { FileText, Calendar, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DeleteResume } from '../services/resume.api';

const ResumeCard = ({ resume, onDelete }) => {
    const navigate = useNavigate();

    const handleEdit = () => {
        navigate(`/editor/${resume._id}`);
    };

    const handleDelete = async (e) => {
        e.stopPropagation(); // Prevent card click
        
        if (!window.confirm('Are you sure you want to delete this resume?')) {
            return;
        }

        try {
            await DeleteResume(resume._id);
            if (onDelete) onDelete(resume._id);
            window.location.reload(); // Refresh page
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete resume');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    return (
        <div 
            onClick={handleEdit}
            className="group bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
        >
            {/* Preview Image */}
            <div className="aspect-[3/4] bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200 flex items-center justify-center relative overflow-hidden">
                <FileText size={48} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {resume.resumeName || resume.data?.personal?.name || 'Untitled Resume'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Calendar size={12} />
                        <span>Modified {formatDate(resume.updatedAt)}</span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        resume.conversationState?.isComplete 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                    }`}>
                        {resume.conversationState?.isComplete ? 'Complete' : 'Draft'}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                        <button
                            onClick={handleEdit}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Edit Resume"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Delete Resume"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeCard;