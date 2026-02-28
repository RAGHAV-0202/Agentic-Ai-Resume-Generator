// src/pages/Editor.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Download, Share2, Send, Bot, User, ArrowLeft, RefreshCw, Loader2, FileText, ChevronRight, Sparkles, MessageSquare, PenLine, ChevronDown, Target, Zap } from 'lucide-react';
import { GetResumeById, RecompilePdf, DownloadPdf, ChangeTemplate, UpdateResumeData } from '../services/resume.api';
import { baseURL } from '../services/http';
import { StartAgentChat, MsgAgent, SkipAgentQuestion } from '../services/agent.api';
import { toggleResumePublicStatus } from '../services/http';
import { getAllTemplates } from '../services/template.api';
import { GridScan } from '../components/ui/gridScan';
import DotGrid from '../components/ui/dotGrid';
import EditForm from '../components/EditForm';



const Editor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    // State
    const [resumeData, setResumeData] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfTimestamp, setPdfTimestamp] = useState(Date.now());
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [recompiling, setRecompiling] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [conversationStarted, setConversationStarted] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [qualityScore, setQualityScore] = useState(null);
    const [editorMode, setEditorMode] = useState('chat'); // 'chat' or 'edit'
    const [showAtsPanel, setShowAtsPanel] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);


    // Fetch Resume & Templates on Mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Resume Detail
                const resumeRes = await GetResumeById(id);


                if (resumeRes.data?.data?.resume) {
                    const resume = resumeRes.data.data.resume;
                    setResumeData(resume.data);
                    setIsPublic(resume.isPublic || false);
                    handleRecompile()

                    // Restore chat history
                    if (resume.chatHistory && Array.isArray(resume.chatHistory)) {
                        const formattedMessages = resume.chatHistory.map(msg => ({
                            role: msg.role,
                            content: msg.content
                        }));
                        setMessages(formattedMessages);
                        setConversationStarted(true);
                    }
                }

                // 2. Fetch Templates
                const templatesRes = await getAllTemplates();
                if (templatesRes.data?.data?.templates) {
                    setTemplates(templatesRes.data.data.templates);
                } else if (Array.isArray(templatesRes.data?.data)) {
                    setTemplates(templatesRes.data.data);
                }
            } catch (error) {
                console.error("Error loading editor:", error);
                // alert("Failed to load resume. Redirecting to dashboard.");
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, navigate]);

    // Check for existing conversation on load
    useEffect(() => {
        if (messages.length > 0) {
            setConversationStarted(true);
        } else if (!loading) {
            // New session: don't start chat automatically.
            // Just ensure we have resumeData (which might be mock data from createResume)
            setConversationStarted(false);
        }
    }, [messages.length, loading]);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleStartChat = async () => {
        if (chatLoading) return;
        setChatLoading(true);
        try {
            const startRes = await StartAgentChat({ resumeId: id });
            if (startRes.data?.data?.aiMessage) {
                setMessages([{
                    role: 'assistant',
                    content: startRes.data.data.aiMessage
                }]);
                setConversationStarted(true);
                if (startRes.data?.data?.resumeData) {
                    setResumeData(startRes.data.data.resumeData);
                }
            }
        } catch (error) {
            console.error("Error starting chat:", error);
        } finally {
            setChatLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        const trimmed = inputMessage.trim();
        if (!trimmed || chatLoading) return;
        setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
        setInputMessage('');
        setChatLoading(true);
        try {
            const res = await MsgAgent({ resumeId: id, message: trimmed });
            const data = res?.data?.data;
            if (data) {
                if (data.aiMessage) {
                    setMessages(prev => [...prev, { role: 'assistant', content: data.aiMessage }]);
                }
                if (data.resumeData) setResumeData(data.resumeData);
                if (data.qualityScore) setQualityScore(data.qualityScore);
                if (data.pdfRecompiled) {
                    setPdfTimestamp(Date.now());
                    setPdfLoading(true);
                }
                if (data.isComplete) {
                    setConversationStarted(true);
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Oops! Something went wrong. Please try again."
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleSkip = async () => {
        if (chatLoading) return;
        setMessages(prev => [...prev, { role: 'user', content: 'skip' }]);
        setChatLoading(true);
        try {
            const res = await SkipAgentQuestion({ resumeId: id });
            const data = res?.data?.data;
            if (data) {
                if (data.aiMessage) {
                    setMessages(prev => [...prev, { role: 'assistant', content: data.aiMessage }]);
                }
                if (data.resumeData) setResumeData(data.resumeData);
                if (data.qualityScore) setQualityScore(data.qualityScore);
                if (data.pdfRecompiled) {
                    setPdfTimestamp(Date.now());
                    setPdfLoading(true);
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Oops! Something went wrong. Please try again."
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleRecompile = async () => {
        setRecompiling(true);
        setPdfLoading(true);
        try {
            const res = await RecompilePdf(id);
            if (res.data?.data?.pdfUrl) {
                setPdfUrl(baseURL + res.data.data.pdfUrl);
                setPdfTimestamp(Date.now());
            }
        } catch (error) {
            console.error("Recompile failed:", error);
        } finally {
            setRecompiling(false);
        }
    };

    const handleDownload = async () => {
        try {
            const url = await DownloadPdf(id);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Download failed:", error);
        }
    };


    const changeTemp = async (templateId) => {
        setPdfLoading(true);
        try {
            const res = await ChangeTemplate({ id, templateId });
            console.log("Template change response:", res.data);
            if (res.data?.data?.resume?.pdfUrl) {
                setPdfUrl(baseURL + res.data.data.resume.pdfUrl);
                setPdfTimestamp(Date.now());
            } else {
                // Fallback: trigger a recompile if template change didn't return pdfUrl
                await handleRecompile();
            }
        } catch (error) {
            console.error("Template change failed:", error);
            // Still try to recompile with whatever template was set
            await handleRecompile();
        }
    };

    const handleEditSave = async (newData) => {
        setEditSaving(true);
        try {
            const res = await UpdateResumeData(id, newData);
            const data = res?.data?.data;
            if (data) {
                if (data.resume?.data) setResumeData(data.resume.data);
                if (data.qualityScore) setQualityScore(data.qualityScore);
                if (data.pdfUrl) {
                    setPdfUrl(baseURL + data.pdfUrl);
                    setPdfTimestamp(Date.now());
                    setPdfLoading(true);
                }
            }
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setEditSaving(false);
        }
    };

    const handleTogglePublic = async () => {
        try {
            const newStatus = !isPublic;
            await toggleResumePublicStatus(id, newStatus);
            setIsPublic(newStatus);
        } catch (error) {
            console.error("Failed to toggle public status", error);
            alert("Failed to update share settings");
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
            {/* Top Bar */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                            <FileText size={18} />
                        </div>
                        <h1 className="font-semibold text-slate-800">
                            {resumeData?.personal?.name || "Untitled Resume"}
                        </h1>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                            Draft
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRecompile}
                        disabled={recompiling}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={recompiling ? 'animate-spin' : ''} />
                        {recompiling ? 'Recompiling...' : 'Recompile PDF'}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Download size={18} /> Download PDF
                    </button>
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Share2 size={18} /> Share
                    </button>
                </div>
            </header>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Share Resume</h3>
                            <p className="text-slate-500 text-sm mb-6">Allow anyone with the link to view a beautiful web version of your resume.</p>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-4 border border-slate-200">
                                <div>
                                    <p className="font-semibold text-slate-800">Public Link</p>
                                    <p className="text-xs text-slate-500">{isPublic ? 'Anyone with link can view' : 'Currently private'}</p>
                                </div>
                                <button
                                    onClick={handleTogglePublic}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-blue-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {isPublic && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2 mb-2 p-3 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                                        <div className="flex-1 truncate select-all">{window.location.origin}/resume/{id}</div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/resume/${id}`);
                                                alert("Link copied!");
                                            }}
                                            className="px-3 py-1.5 bg-white text-blue-600 rounded-md shadow-sm border border-blue-200 hover:bg-blue-50 transition-colors shrink-0"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <a href={`/resume/${id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                        Open in new tab &rarr;
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setShowShareModal(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT PANEL: Templates */}
                <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col">
                    <div className="p-5 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Templates</h3>
                        <p className="text-xs text-slate-500 mt-1">Switch designs instantly</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {templates.map(template => (
                            <div key={template._id} onClick={() => changeTemp(template._id)} className="group cursor-pointer">
                                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 relative">
                                    <img
                                        src={template.thumbnailUrl || "https://placehold.co/300x400/e2e8f0/94a3b8?text=Template"}
                                        alt={template.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </div>
                                <p className="text-sm font-medium text-slate-700 mt-2 text-center">{template.name}</p>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* CENTER PANEL: PDF Preview */}
                <main className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
                    {pdfUrl && (
                        <div className="relative bg-white shadow-xl w-[794px] h-[1123px] overflow-hidden">

                            {/* PDF Iframe */}
                            <iframe
                                // ADDED: #toolbar=0&navpanes=0&scrollbar=0&view=FitH
                                src={`${pdfUrl}?t=${pdfTimestamp}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                className={`w-full h-full border-none transition-opacity duration-300 ${pdfLoading ? 'opacity-0' : 'opacity-100'
                                    }`}
                                onLoad={() => setPdfLoading(false)}
                                title="Resume Preview"
                                // ADDED: scroll attribute for older browsers
                                scrolling="no"
                            />

                            {/* Overlay Loader */}
                            {pdfLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-10">
                                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                        <DotGrid
                                            dotSize={5}
                                            gap={15}
                                            baseColor="#271E37"
                                            activeColor="#d3d3d3"
                                            proximity={120}
                                            shockRadius={250}
                                            shockStrength={5}
                                            resistance={750}
                                            returnDuration={1.5}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>


                {/* RIGHT PANEL: Chat / Edit */}
                <aside className="w-[450px] bg-slate-50 border-l border-slate-200 flex flex-col shadow-xl z-20 relative overflow-hidden">

                    {/* Panel Header with Mode Toggle */}
                    <div className="p-4 border-b border-slate-200 bg-white z-10 sticky top-0">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 shadow-sm border border-slate-200">
                                    <Sparkles size={18} className="text-slate-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Resume Assistant</h3>
                                    <p className="text-[11px] text-green-600 flex items-center gap-1.5 font-medium bg-green-50 px-2 py-0.5 rounded-full w-fit mt-0.5">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        Online & Ready
                                    </p>
                                </div>
                            </div>
                            {qualityScore && (
                                <button
                                    onClick={() => setShowAtsPanel(!showAtsPanel)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border cursor-pointer transition-all hover:scale-105 ${qualityScore.percentage >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        qualityScore.percentage >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                    {qualityScore.percentage}% · {qualityScore.grade}
                                </button>
                            )}
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex bg-slate-100 rounded-xl p-1">
                            <button
                                onClick={() => setEditorMode('chat')}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${editorMode === 'chat'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <MessageSquare size={14} /> AI Chat
                            </button>
                            <button
                                onClick={() => setEditorMode('edit')}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${editorMode === 'edit'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <PenLine size={14} /> Direct Edit
                            </button>
                        </div>
                    </div>

                    {/* ATS Score Panel (collapsible) */}
                    {showAtsPanel && qualityScore && (
                        <div className="bg-white border-b border-slate-200 p-4 animate-in slide-in-from-top duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Target size={16} className="text-blue-600" /> ATS Score Breakdown
                                </h4>
                                <button onClick={() => setShowAtsPanel(false)} className="text-slate-400 hover:text-slate-600">
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            {/* Category Bars */}
                            <div className="space-y-2 mb-4">
                                {qualityScore.breakdown?.map((cat, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-0.5">
                                            <span className="font-medium text-slate-600">{cat.category}</span>
                                            <span className="text-slate-500">{cat.score}/{cat.maxScore}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${(cat.score / cat.maxScore) >= 0.8 ? 'bg-emerald-500' :
                                                    (cat.score / cat.maxScore) >= 0.5 ? 'bg-amber-500' : 'bg-red-400'
                                                    }`}
                                                style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Tips */}
                            {qualityScore.tips?.length > 0 && (
                                <div className="space-y-1.5">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        <Zap size={12} className="text-amber-500" /> Tips to Improve
                                    </h5>
                                    {qualityScore.tips.map((tip, i) => (
                                        <p key={i} className="text-xs text-slate-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                                            {tip}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mode Content */}
                    {editorMode === 'edit' ? (
                        <EditForm resumeData={resumeData} onSave={handleEditSave} saving={editSaving} />
                    ) : (
                        <>
                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                {messages.length === 0 && !conversationStarted && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 transform rotate-3">
                                            <Bot size={32} className="text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Resume Preview</h3>
                                        <p className="text-slate-500 font-medium mb-8 max-w-[260px]">
                                            This is a preview with sample data. Ready to build your own?
                                        </p>
                                        <button
                                            onClick={handleStartChat}
                                            disabled={chatLoading}
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
                                        >
                                            {chatLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                            Start Building
                                        </button>
                                    </div>
                                )}

                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${msg.role === 'user'
                                            ? 'bg-white border-slate-100'
                                            : 'bg-gradient-to-br from-blue-600 to-violet-600 border-transparent text-white'
                                            }`}>
                                            {msg.role === 'user' ? (
                                                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                                                    <User size={18} />
                                                </div>
                                            ) : (
                                                <Bot size={18} />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm relative group-hover:shadow-md transition-shadow ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-tr-sm shadow-blue-500/10'
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                                            }`}>
                                            {msg.content.split('\n').map((line, i) => (
                                                <p key={i} className={`mb-1.5 last:mb-0 ${msg.role === 'user' ? 'text-blue-50' : 'text-slate-600'}`}>
                                                    {line}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {chatLoading && (
                                    <div className="flex gap-4 animate-in fade-in zoom-in duration-300">
                                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-md text-white">
                                            <Bot size={18} />
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-1.5 w-fit">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} className="h-2" />
                            </div>

                            {/* Input Area */}
                            <div className="p-5 bg-white border-t border-slate-200 z-20">
                                <form onSubmit={handleSendMessage} className="relative group">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        placeholder="Type your answer..."
                                        className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400 text-slate-700 shadow-inner relative z-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSkip}
                                        disabled={chatLoading}
                                        className="absolute right-12 top-2 p-2 px-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium z-20 shadow-sm mr-2"
                                    >
                                        Skip
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!inputMessage.trim() || chatLoading}
                                        className="absolute right-2 top-2 p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 z-20 shadow-sm"
                                    >
                                        <Send size={18} strokeWidth={2.5} />
                                    </button>
                                </form>
                                <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
                                    AI-generated content may be inaccurate. Check important details.
                                </p>
                            </div>
                        </>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default Editor;