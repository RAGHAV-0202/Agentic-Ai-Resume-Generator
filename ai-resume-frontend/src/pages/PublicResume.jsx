import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicResume } from '../services/http';
import { Loader2, AlertCircle, MapPin, Mail, Phone, ExternalLink, Calendar, Link as LinkIcon } from 'lucide-react';

const PublicResume = () => {
    const { id } = useParams();
    const [resumeData, setResumeData] = useState(null);
    const [userContext, setUserContext] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResume = async () => {
            try {
                const res = await getPublicResume(id);
                if (res?.data?.resume) {
                    setResumeData(res.data.resume.data);
                    setUserContext(res.data.resume.userId); // This contains fullName/email populated from backend
                }
            } catch (err) {
                console.error("Failed to load public resume:", err);
                setError(err.message || "Failed to load resume");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchResume();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading resume...</p>
            </div>
        );
    }

    if (error || !resumeData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Resume Unavailable</h2>
                    <p className="text-slate-500 mb-6 border-b border-slate-100 pb-6">
                        {error || "This resume either doesn't exist or has been set to private by the owner."}
                    </p>
                    <Link to="/" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm">
                        Create Your Own Resume
                    </Link>
                </div>
            </div>
        );
    }

    const { personal, education, experience, projects, skills, achievements, publications } = resumeData;

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
            {/* Top Bar for context */}
            <div className="bg-slate-900 text-slate-300 py-3 px-6 text-sm flex justify-between items-center sticky top-0 z-50">
                <p>Public Resume Portal</p>
                <Link to="/" className="text-white hover:text-blue-400 font-medium flex items-center gap-2 transition-colors">
                    Build yours with AI <ExternalLink size={14} />
                </Link>
            </div>

            <main className="max-w-4xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header Section */}
                <header className="px-10 py-12 bg-slate-900 text-white">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        {personal?.name || userContext?.fullName || "Anonymous"}
                    </h1>

                    <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6 text-slate-300">
                        {personal?.email && (
                            <a href={`mailto:${personal.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                                <Mail size={16} /> {personal.email}
                            </a>
                        )}
                        {personal?.phone && (
                            <a href={`tel:${personal.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                                <Phone size={16} /> {personal.phone}
                            </a>
                        )}
                        {personal?.location && (
                            <span className="flex items-center gap-2">
                                <MapPin size={16} /> {personal.location}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-6">
                        {personal?.linkedin && (
                            <a href={personal.linkedin} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                <LinkIcon size={14} /> LinkedIn
                            </a>
                        )}
                        {personal?.github && (
                            <a href={personal.github} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                <LinkIcon size={14} /> GitHub
                            </a>
                        )}
                        {personal?.website && (
                            <a href={personal.website} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                <ExternalLink size={14} /> Portfolio
                            </a>
                        )}
                    </div>
                </header>

                <div className="p-10 space-y-12">

                    {/* Experience Section */}
                    {experience?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">💼</span>
                                Work Experience
                            </h2>
                            <div className="space-y-8 relative">
                                <div className="absolute left-[15px] top-2 bottom-0 w-px bg-slate-200"></div>
                                {experience.map((exp, idx) => (
                                    <div key={idx} className="relative pl-10">
                                        <div className="absolute left-[11px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white bg-blue-500"></div>
                                        <div className="flex flex-wrap justify-between items-baseline gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-slate-800">{exp.position}</h3>
                                            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                                <Calendar size={14} />
                                                {exp.startDate} – {exp.endDate}
                                            </span>
                                        </div>
                                        <div className="text-blue-600 font-medium mb-3">{exp.company} {exp.location && <span className="text-slate-400 font-normal ml-1">· {exp.location}</span>}</div>
                                        {exp.highlights?.length > 0 && (
                                            <ul className="space-y-2 mt-4 text-slate-600 leading-relaxed max-w-3xl">
                                                {exp.highlights.map((point, i) => (
                                                    <li key={i} className="flex gap-3">
                                                        <span className="text-slate-300 mt-1.5">•</span>
                                                        <span>{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Education Section */}
                    {education?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">🎓</span>
                                Education
                            </h2>
                            <div className="grid gap-6 sm:grid-cols-2">
                                {education.map((edu, idx) => (
                                    <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-slate-200 transition-colors">
                                        <h3 className="font-bold text-slate-800 text-lg mb-1">{edu.degree}</h3>
                                        <p className="text-emerald-700 font-medium mb-3">{edu.institution}</p>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {edu.startDate} – {edu.endDate}</span>
                                            {edu.gpa && <span>GPA: {edu.gpa}</span>}
                                        </div>
                                        {edu.coursework?.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Relevant Coursework</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {edu.coursework.map((course, i) => (
                                                        <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded-md">
                                                            {course}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Projects Section */}
                    {projects?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm">🚀</span>
                                Projects
                            </h2>
                            <div className="grid gap-6">
                                {projects.map((proj, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                        <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                    {proj.name}
                                                    {proj.link && (
                                                        <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1 rounded-md transition-colors">
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-slate-500 mt-1">{proj.date}</p>
                                            </div>
                                        </div>

                                        {proj.highlights?.length > 0 && (
                                            <ul className="space-y-2 mb-4 text-slate-600 leading-relaxed max-w-3xl">
                                                {proj.highlights.map((point, i) => (
                                                    <li key={i} className="flex gap-3">
                                                        <span className="text-slate-300 mt-1.5">•</span>
                                                        <span>{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {proj.technologies?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                                                {proj.technologies.map((tech, i) => (
                                                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Skills Section */}
                    {skills && (skills.languages?.length > 0 || skills.frameworks?.length > 0 || skills.developerTools?.length > 0 || skills.technologies?.length > 0) && (
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm">⚡</span>
                                Technical Skills
                            </h2>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 grid gap-6 sm:grid-cols-2">
                                {skills.languages?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Languages</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.languages.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg text-sm text-slate-700 font-medium">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {skills.frameworks?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Frameworks & Libraries</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.frameworks.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg text-sm text-slate-700 font-medium">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {skills.developerTools?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Developer Tools</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.developerTools.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg text-sm text-slate-700 font-medium">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {skills.technologies?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Other Technologies</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.technologies.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg text-sm text-slate-700 font-medium">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Achievements Section */}
                    {achievements?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm">🏆</span>
                                Achievements
                            </h2>
                            <ul className="space-y-3">
                                {achievements.map((ach, i) => (
                                    <li key={i} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 shrink-0"></div>
                                        <span className="text-slate-700 leading-relaxed">{ach}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                </div>
            </main>
        </div>
    );
};

export default PublicResume;
