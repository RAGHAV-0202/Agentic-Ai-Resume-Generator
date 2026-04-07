import React, { useState } from 'react';
import { User, GraduationCap, Briefcase, FolderOpen, Code, Trophy, Layers, Plus, Trash2, Save, ChevronDown, ChevronRight, Sparkles, Loader2, Undo2, GripVertical } from 'lucide-react';

const TABS = [
    { key: 'personal', label: 'Personal', icon: User },
    { key: 'education', label: 'Education', icon: GraduationCap },
    { key: 'experience', label: 'Experience', icon: Briefcase },
    { key: 'projects', label: 'Projects', icon: FolderOpen },
    { key: 'skills', label: 'Skills', icon: Code },
    { key: 'achievements', label: 'Achievements', icon: Trophy },
    { key: 'custom', label: 'Custom', icon: Layers },
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

const ArrayField = ({ label, items = [], onChange, placeholder, context }) => {
    const [enhancing, setEnhancing] = useState(null); // index being enhanced
    const [original, setOriginal] = useState(null); // { index, text } for revert
    const addItem = () => onChange([...items, '']);
    const removeItem = (i) => { onChange(items.filter((_, idx) => idx !== i)); if (original?.index === i) setOriginal(null); };
    const updateItem = (i, val) => onChange(items.map((item, idx) => idx === i ? val : item));

    const handleEnhance = async (i) => {
        if (!items[i]?.trim()) return;
        setEnhancing(i);
        setOriginal({ index: i, text: items[i] });
        try {
            const res = await import('../services/agent.api').then(m => m.EnhanceBullet({ text: items[i], context }));
            const enhanced = res.data?.data?.enhanced;
            if (enhanced) updateItem(i, enhanced);
        } catch (err) {
            console.error('Enhance failed:', err);
        } finally {
            setEnhancing(null);
        }
    };

    const handleRevert = () => {
        if (original) {
            updateItem(original.index, original.text);
            setOriginal(null);
        }
    };

    return (
        <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</label>
            {items.map((item, i) => (
                <div key={i} className="flex gap-1.5 mb-1.5 items-start">
                    <input
                        type="text"
                        value={item || ''}
                        onChange={(e) => updateItem(i, e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 transition-all"
                    />
                    {/* Enhance button */}
                    <button
                        onClick={() => handleEnhance(i)}
                        disabled={enhancing !== null || !item?.trim()}
                        title="AI Enhance"
                        className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {enhancing === i ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    </button>
                    {/* Revert button (shows after enhance) */}
                    {original?.index === i && enhancing === null && (
                        <button onClick={handleRevert} title="Revert to original" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            <Undo2 size={14} />
                        </button>
                    )}
                    <button onClick={() => removeItem(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
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
                    <ArrayField label="Highlights" items={exp.highlights} onChange={(v) => update(i, { ...exp, highlights: v })} placeholder="e.g., Improved API latency by 40%" context={`${exp.position || ''} at ${exp.company || ''}`} />
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
                    <ArrayField label="Highlights" items={proj.highlights} onChange={(v) => update(i, { ...proj, highlights: v })} placeholder="e.g., Built ML pipeline processing 10K+ records" context={`project: ${proj.name || ''}`} />
                    <ArrayField label="Technologies" items={proj.technologies} onChange={(v) => update(i, { ...proj, technologies: v })} placeholder="e.g., React" />
                </EntryCard>
            ))}
            <button onClick={add} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center font-medium">
                <Plus size={16} /> Add Project
            </button>
        </div>
    );
};

const SkillsSection = ({ data = {}, onChange }) => {
    const customSkills = data.customSkills || [];

    const updateCustomLabel = (idx, label) => {
        const updated = [...customSkills];
        updated[idx] = { ...updated[idx], label };
        onChange({ ...data, customSkills: updated });
    };

    const updateCustomItems = (idx, items) => {
        const updated = [...customSkills];
        updated[idx] = { ...updated[idx], items };
        onChange({ ...data, customSkills: updated });
    };

    const addCustomCategory = () => {
        onChange({ ...data, customSkills: [...customSkills, { label: '', items: [] }] });
    };

    const removeCustomCategory = (idx) => {
        onChange({ ...data, customSkills: customSkills.filter((_, i) => i !== idx) });
    };

    return (
        <div className="space-y-1">
            <ArrayField label="Languages" items={data.languages} onChange={(v) => onChange({ ...data, languages: v })} placeholder="e.g., Python" />
            <ArrayField label="Frameworks & Databases" items={data.frameworks} onChange={(v) => onChange({ ...data, frameworks: v })} placeholder="e.g., React" />
            <ArrayField label="Developer Tools" items={data.developerTools} onChange={(v) => onChange({ ...data, developerTools: v })} placeholder="e.g., Git" />
            <ArrayField label="Libraries" items={data.libraries} onChange={(v) => onChange({ ...data, libraries: v })} placeholder="e.g., Pandas" />
            <ArrayField label="Technologies" items={data.technologies} onChange={(v) => onChange({ ...data, technologies: v })} placeholder="e.g., Redis" />

            {/* Custom Skill Categories */}
            {customSkills.map((cs, idx) => (
                <div key={idx} className="border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-3 mb-2 bg-slate-50/50 dark:bg-slate-800/50 relative">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Category {idx + 1}</span>
                        <button onClick={() => removeCustomCategory(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Remove category">
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <Field label="Category Name" value={cs.label} onChange={(v) => updateCustomLabel(idx, v)} placeholder="e.g., Hardware, ML, Cloud Platforms" />
                    <ArrayField label={cs.label || 'Items'} items={cs.items} onChange={(items) => updateCustomItems(idx, items)} placeholder={`e.g., ${cs.label ? cs.label + ' item' : 'item'}`} />
                </div>
            ))}

            <button onClick={addCustomCategory} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl text-sm text-blue-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors w-full justify-center font-medium mt-3">
                <Plus size={16} /> Add Custom Category
            </button>
        </div>
    );
};

const AchievementsSection = ({ data = [], onChange }) => (
    <ArrayField label="Achievements" items={data} onChange={onChange} placeholder="e.g., Winner of HackMIT 2023" />
);

const CustomSectionsSection = ({ data = [], onChange }) => {
    const addSection = () => onChange([...data, { title: '', type: 'list', items: [{ text: '' }], entries: [] }]);
    const removeSection = (i) => onChange(data.filter((_, idx) => idx !== i));
    const updateSection = (i, updated) => onChange(data.map((s, idx) => idx === i ? updated : s));

    return (
        <div>
            {data.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                    <Layers size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No custom sections yet</p>
                    <p className="text-xs mt-1">Add sections like Certifications, Volunteering, Awards, etc.</p>
                </div>
            )}
            {data.map((section, sIdx) => (
                <EntryCard key={sIdx} title={section.title || 'Untitled Section'} onDelete={() => removeSection(sIdx)}>
                    <Field label="Section Title" value={section.title} onChange={(v) => updateSection(sIdx, { ...section, title: v })} placeholder="e.g., Certifications" />
                    <div className="mb-3">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Type</label>
                        <div className="flex gap-2">
                            {['list', 'entries'].map(t => (
                                <button key={t} onClick={() => updateSection(sIdx, { ...section, type: t })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${section.type === t ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                                >{t === 'list' ? '• Bullet List' : '📋 Structured Entries'}</button>
                            ))}
                        </div>
                    </div>

                    {section.type === 'list' ? (
                        <div>
                            {(section.items || []).map((item, iIdx) => (
                                <div key={iIdx} className="flex gap-2 mb-1.5">
                                    <input type="text" value={item.text || ''}
                                        onChange={(e) => {
                                            const newItems = [...(section.items || [])];
                                            newItems[iIdx] = { text: e.target.value };
                                            updateSection(sIdx, { ...section, items: newItems });
                                        }}
                                        placeholder="Item text"
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                                    />
                                    <button onClick={() => updateSection(sIdx, { ...section, items: section.items.filter((_, idx) => idx !== iIdx) })}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    ><Trash2 size={14} /></button>
                                </div>
                            ))}
                            <button onClick={() => updateSection(sIdx, { ...section, items: [...(section.items || []), { text: '' }] })}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                            ><Plus size={12} /> Add item</button>
                        </div>
                    ) : (
                        <div>
                            {(section.entries || []).map((entry, eIdx) => (
                                <div key={eIdx} className="border border-slate-100 rounded-lg p-3 mb-2 bg-slate-50/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Entry {eIdx + 1}</span>
                                        <button onClick={() => updateSection(sIdx, { ...section, entries: section.entries.filter((_, idx) => idx !== eIdx) })}
                                            className="p-1 text-red-400 hover:text-red-600 rounded transition-colors"
                                        ><Trash2 size={12} /></button>
                                    </div>
                                    <Field label="Title" value={entry.title} onChange={(v) => {
                                        const newEntries = [...(section.entries || [])];
                                        newEntries[eIdx] = { ...entry, title: v };
                                        updateSection(sIdx, { ...section, entries: newEntries });
                                    }} placeholder="e.g., AWS Solutions Architect" />
                                    <Field label="Subtitle" value={entry.subtitle} onChange={(v) => {
                                        const newEntries = [...(section.entries || [])];
                                        newEntries[eIdx] = { ...entry, subtitle: v };
                                        updateSection(sIdx, { ...section, entries: newEntries });
                                    }} placeholder="e.g., Amazon Web Services" optional />
                                    <Field label="Date" value={entry.date} onChange={(v) => {
                                        const newEntries = [...(section.entries || [])];
                                        newEntries[eIdx] = { ...entry, date: v };
                                        updateSection(sIdx, { ...section, entries: newEntries });
                                    }} placeholder="e.g., Dec 2023" optional />
                                    <ArrayField label="Highlights" items={entry.highlights || []} onChange={(v) => {
                                        const newEntries = [...(section.entries || [])];
                                        newEntries[eIdx] = { ...entry, highlights: v };
                                        updateSection(sIdx, { ...section, entries: newEntries });
                                    }} placeholder="Details..." />
                                </div>
                            ))}
                            <button onClick={() => updateSection(sIdx, { ...section, entries: [...(section.entries || []), { title: '', subtitle: '', date: '', highlights: [] }] })}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                            ><Plus size={12} /> Add entry</button>
                        </div>
                    )}
                </EntryCard>
            ))}
            <button onClick={addSection} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center font-medium">
                <Plus size={16} /> Add Custom Section
            </button>
        </div>
    );
};

const EditForm = ({ resumeData, onSave, saving }) => {
    const [activeTab, setActiveTab] = useState('personal');
    const [localData, setLocalData] = useState(JSON.parse(JSON.stringify(resumeData || {})));
    const [tabOrder, setTabOrder] = useState(() => {
        const saved = resumeData?.sectionOrder;
        return saved?.length ? saved : TABS.map(t => t.key);
    });
    const [dragIdx, setDragIdx] = useState(null);

    const updateSection = (section, value) => {
        setLocalData(prev => ({ ...prev, [section]: value }));
    };

    const handleSave = () => {
        onSave({ ...localData, sectionOrder: tabOrder });
    };

    // Drag handlers for tab reordering
    const onDragStart = (e, idx) => {
        setDragIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
    };
    const onDragOver = (e, idx) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx) return;
        const newOrder = [...tabOrder];
        const [moved] = newOrder.splice(dragIdx, 1);
        newOrder.splice(idx, 0, moved);
        setTabOrder(newOrder);
        setDragIdx(idx);
    };
    const onDragEnd = () => setDragIdx(null);

    const renderSection = () => {
        switch (activeTab) {
            case 'personal': return <PersonalSection data={localData.personal} onChange={(v) => updateSection('personal', v)} />;
            case 'education': return <EducationSection data={localData.education} onChange={(v) => updateSection('education', v)} />;
            case 'experience': return <ExperienceSection data={localData.experience} onChange={(v) => updateSection('experience', v)} />;
            case 'projects': return <ProjectsSection data={localData.projects} onChange={(v) => updateSection('projects', v)} />;
            case 'skills': return <SkillsSection data={localData.skills} onChange={(v) => updateSection('skills', v)} />;
            case 'achievements': return <AchievementsSection data={localData.achievements} onChange={(v) => updateSection('achievements', v)} />;
            case 'custom': return <CustomSectionsSection data={localData.customSections} onChange={(v) => updateSection('customSections', v)} />;
            default: return null;
        }
    };

    // Ordered tabs for rendering
    const orderedTabs = tabOrder.map(key => TABS.find(t => t.key === key)).filter(Boolean);

    return (
        <div className="flex flex-col h-full">
            {/* Draggable Tabs */}
            <div className="flex gap-1 p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                {orderedTabs.map((tab, idx) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            draggable
                            onDragStart={(e) => onDragStart(e, idx)}
                            onDragOver={(e) => onDragOver(e, idx)}
                            onDragEnd={onDragEnd}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-grab active:cursor-grabbing ${activeTab === tab.key
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                                } ${dragIdx === idx ? 'opacity-50 scale-95' : ''}`}
                        >
                            <GripVertical size={10} className="text-slate-300 dark:text-slate-600 -ml-1" />
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 dark:bg-slate-900">
                {renderSection()}
            </div>

            {/* Save */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
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
