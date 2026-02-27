import React, { useState } from 'react';
import { User, GraduationCap, Briefcase, FolderOpen, Code, Trophy, Plus, Trash2, Save, ChevronDown, ChevronRight } from 'lucide-react';

const TABS = [
    { key: 'personal', label: 'Personal', icon: User },
    { key: 'education', label: 'Education', icon: GraduationCap },
    { key: 'experience', label: 'Experience', icon: Briefcase },
    { key: 'projects', label: 'Projects', icon: FolderOpen },
    { key: 'skills', label: 'Skills', icon: Code },
    { key: 'achievements', label: 'Achievements', icon: Trophy },
];

const Field = ({ label, value, onChange, placeholder, optional }) => (
    <div className="mb-3">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            {label} {optional && <span className="text-slate-400 font-normal normal-case">(optional)</span>}
        </label>
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || label}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
        />
    </div>
);

const ArrayField = ({ label, items = [], onChange, placeholder }) => {
    const addItem = () => onChange([...items, '']);
    const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));
    const updateItem = (i, val) => onChange(items.map((item, idx) => idx === i ? val : item));

    return (
        <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
            {items.map((item, i) => (
                <div key={i} className="flex gap-2 mb-1.5">
                    <input
                        type="text"
                        value={item || ''}
                        onChange={(e) => updateItem(i, e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                    />
                    <button onClick={() => removeItem(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1">
                <Plus size={12} /> Add {label.toLowerCase()}
            </button>
        </div>
    );
};

const PersonalSection = ({ data = {}, onChange }) => (
    <div className="space-y-1">
        <Field label="Full Name" value={data.name} onChange={(v) => onChange({ ...data, name: v })} />
        <Field label="Email" value={data.email} onChange={(v) => onChange({ ...data, email: v })} />
        <Field label="Phone" value={data.phone} onChange={(v) => onChange({ ...data, phone: v })} />
        <Field label="Location" value={data.location} onChange={(v) => onChange({ ...data, location: v })} />
        <Field label="LinkedIn" value={data.linkedin} onChange={(v) => onChange({ ...data, linkedin: v })} optional />
        <Field label="GitHub" value={data.github} onChange={(v) => onChange({ ...data, github: v })} optional />
        <Field label="Website" value={data.website} onChange={(v) => onChange({ ...data, website: v })} optional />
    </div>
);

const EntryCard = ({ title, children, onDelete }) => {
    const [open, setOpen] = useState(true);
    return (
        <div className="border border-slate-200 rounded-xl mb-3 overflow-hidden bg-white">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer" onClick={() => setOpen(!open)}>
                <div className="flex items-center gap-2">
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="text-sm font-semibold text-slate-700">{title || 'New Entry'}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-red-400 hover:text-red-600 rounded transition-colors">
                    <Trash2 size={14} />
                </button>
            </div>
            {open && <div className="p-4">{children}</div>}
        </div>
    );
};

const EducationSection = ({ data = [], onChange }) => {
    const update = (i, entry) => onChange(data.map((e, idx) => idx === i ? entry : e));
    const add = () => onChange([...data, { institution: '', degree: '', startDate: '', endDate: '', gpa: '', coursework: [] }]);
    const remove = (i) => onChange(data.filter((_, idx) => idx !== i));

    return (
        <div>
            {data.map((edu, i) => (
                <EntryCard key={i} title={edu.institution || edu.degree} onDelete={() => remove(i)}>
                    <Field label="Institution" value={edu.institution} onChange={(v) => update(i, { ...edu, institution: v })} />
                    <Field label="Degree" value={edu.degree} onChange={(v) => update(i, { ...edu, degree: v })} />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Start Date" value={edu.startDate} onChange={(v) => update(i, { ...edu, startDate: v })} placeholder="Aug 2020" />
                        <Field label="End Date" value={edu.endDate} onChange={(v) => update(i, { ...edu, endDate: v })} placeholder="May 2024" />
                    </div>
                    <Field label="GPA" value={edu.gpa} onChange={(v) => update(i, { ...edu, gpa: v })} optional />
                    <ArrayField label="Coursework" items={edu.coursework} onChange={(v) => update(i, { ...edu, coursework: v })} placeholder="e.g., Data Structures" />
                </EntryCard>
            ))}
            <button onClick={add} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center font-medium">
                <Plus size={16} /> Add Education
            </button>
        </div>
    );
};

const ExperienceSection = ({ data = [], onChange }) => {
    const update = (i, entry) => onChange(data.map((e, idx) => idx === i ? entry : e));
    const add = () => onChange([...data, { company: '', position: '', location: '', startDate: '', endDate: '', highlights: [] }]);
    const remove = (i) => onChange(data.filter((_, idx) => idx !== i));

    return (
        <div>
            {data.map((exp, i) => (
                <EntryCard key={i} title={`${exp.position || ''} @ ${exp.company || ''}`} onDelete={() => remove(i)}>
                    <Field label="Company" value={exp.company} onChange={(v) => update(i, { ...exp, company: v })} />
                    <Field label="Position" value={exp.position} onChange={(v) => update(i, { ...exp, position: v })} />
                    <Field label="Location" value={exp.location} onChange={(v) => update(i, { ...exp, location: v })} optional />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Start Date" value={exp.startDate} onChange={(v) => update(i, { ...exp, startDate: v })} />
                        <Field label="End Date" value={exp.endDate} onChange={(v) => update(i, { ...exp, endDate: v })} />
                    </div>
                    <ArrayField label="Highlights" items={exp.highlights} onChange={(v) => update(i, { ...exp, highlights: v })} placeholder="e.g., Improved API latency by 40%" />
                </EntryCard>
            ))}
            <button onClick={add} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center font-medium">
                <Plus size={16} /> Add Experience
            </button>
        </div>
    );
};

const ProjectsSection = ({ data = [], onChange }) => {
    const update = (i, entry) => onChange(data.map((e, idx) => idx === i ? entry : e));
    const add = () => onChange([...data, { name: '', link: '', date: '', highlights: [], technologies: [] }]);
    const remove = (i) => onChange(data.filter((_, idx) => idx !== i));

    return (
        <div>
            {data.map((proj, i) => (
                <EntryCard key={i} title={proj.name} onDelete={() => remove(i)}>
                    <Field label="Name" value={proj.name} onChange={(v) => update(i, { ...proj, name: v })} />
                    <Field label="Link" value={proj.link} onChange={(v) => update(i, { ...proj, link: v })} optional />
                    <Field label="Date" value={proj.date} onChange={(v) => update(i, { ...proj, date: v })} placeholder="Jan 2024 – Jun 2024" />
                    <ArrayField label="Highlights" items={proj.highlights} onChange={(v) => update(i, { ...proj, highlights: v })} placeholder="e.g., Built ML pipeline processing 10K+ records" />
                    <ArrayField label="Technologies" items={proj.technologies} onChange={(v) => update(i, { ...proj, technologies: v })} placeholder="e.g., React" />
                </EntryCard>
            ))}
            <button onClick={add} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center font-medium">
                <Plus size={16} /> Add Project
            </button>
        </div>
    );
};

const SkillsSection = ({ data = {}, onChange }) => (
    <div className="space-y-1">
        <ArrayField label="Languages" items={data.languages} onChange={(v) => onChange({ ...data, languages: v })} placeholder="e.g., Python" />
        <ArrayField label="Frameworks & Databases" items={data.frameworks} onChange={(v) => onChange({ ...data, frameworks: v })} placeholder="e.g., React" />
        <ArrayField label="Developer Tools" items={data.developerTools} onChange={(v) => onChange({ ...data, developerTools: v })} placeholder="e.g., Git" />
        <ArrayField label="Libraries" items={data.libraries} onChange={(v) => onChange({ ...data, libraries: v })} placeholder="e.g., Pandas" />
        <ArrayField label="Technologies" items={data.technologies} onChange={(v) => onChange({ ...data, technologies: v })} placeholder="e.g., Redis" />
    </div>
);

const AchievementsSection = ({ data = [], onChange }) => (
    <ArrayField label="Achievements" items={data} onChange={onChange} placeholder="e.g., Winner of HackMIT 2023" />
);

const EditForm = ({ resumeData, onSave, saving }) => {
    const [activeTab, setActiveTab] = useState('personal');
    const [localData, setLocalData] = useState(JSON.parse(JSON.stringify(resumeData || {})));

    const updateSection = (section, value) => {
        setLocalData(prev => ({ ...prev, [section]: value }));
    };

    const handleSave = () => {
        onSave(localData);
    };

    const renderSection = () => {
        switch (activeTab) {
            case 'personal': return <PersonalSection data={localData.personal} onChange={(v) => updateSection('personal', v)} />;
            case 'education': return <EducationSection data={localData.education} onChange={(v) => updateSection('education', v)} />;
            case 'experience': return <ExperienceSection data={localData.experience} onChange={(v) => updateSection('experience', v)} />;
            case 'projects': return <ProjectsSection data={localData.projects} onChange={(v) => updateSection('projects', v)} />;
            case 'skills': return <SkillsSection data={localData.skills} onChange={(v) => updateSection('skills', v)} />;
            case 'achievements': return <AchievementsSection data={localData.achievements} onChange={(v) => updateSection('achievements', v)} />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex gap-1 p-3 bg-white border-b border-slate-200 overflow-x-auto">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab.key
                                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                }`}
                        >
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {renderSection()}
            </div>

            {/* Save */}
            <div className="p-4 bg-white border-t border-slate-200">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                    <Save size={16} />
                    {saving ? 'Saving & Recompiling...' : 'Save & Recompile PDF'}
                </button>
            </div>
        </div>
    );
};

export default EditForm;
