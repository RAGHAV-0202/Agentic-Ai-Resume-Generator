import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { CreateResumeSession } from '../services/resume.api';
import { useNavigate } from 'react-router-dom';

const TemplateCard = ({ template }) => {
    console.log(template)
    const navigate = useNavigate();

    const handleUseTemplate = async () => {
        try {
            // Assuming CreateResumeSession takes a templateId
            // This logic might need adjustment based on exact API requirements verified later, 
            // relying on current understanding of resume.api.js
            const response = await CreateResumeSession({ templateId: template._id });
            if (response.data && response.data.data) {
                // Navigate to editor with new resume ID
                navigate(`/editor/${response.data.data._id}`);
            }
        } catch (error) {
            console.error("Failed to create resume from template", error);
            // Optionally show error toast here
        }
    };

    return (
        <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col h-full">
            {/* Thumbnail */}
            <div className="relative h-64 bg-slate-100 overflow-hidden">
                <img
                    src={template.thumbnailUrl || "https://placehold.co/400x600/e2e8f0/94a3b8?text=Template+Preview"}
                    alt={template.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors" />

                {/* Overlay Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleUseTemplate}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-lg flex items-center gap-2"
                    >
                        Use Template <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{template.name}</h3>
                    {template.isPro && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded uppercase tracking-wider">
                            Pro
                        </span>
                    )}
                </div>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{template.description || "A professional template suitable for all industries."}</p>

                <div className="mt-auto pt-4 border-t border-slate-100">
                    <button
                        onClick={handleUseTemplate}
                        className="w-full py-2 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        Select Template
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplateCard;
