// src/pages/Editor.jsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Download, Share2, Send, Bot, User, ArrowLeft, RefreshCw, Loader2, FileText, ChevronRight, Sparkles, MessageSquare, PenLine, ChevronDown, Target, Zap, Mic, MicOff, Volume2, VolumeX, CheckCircle, XCircle, AlertTriangle, Search } from 'lucide-react';
import { GetResumeById, RecompilePdf, DownloadPdf, ChangeTemplate, UpdateResumeData } from '../services/resume.api';
import { baseURL } from '../services/http';
import { StartAgentChat, MsgAgent, SkipAgentQuestion, AnalyzeATS, CheckGrammar } from '../services/agent.api';
import { toggleResumePublicStatus } from '../services/http';
import { getAllTemplates } from '../services/template.api';
import { GridScan } from '../components/ui/gridScan';
import DotGrid from '../components/ui/dotGrid';
import EditForm from '../components/EditForm';
import { useVoice } from '../hooks/useVoice';



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

    // ATS Analyzer state
    const [atsJobDescription, setAtsJobDescription] = useState('');
    const [atsAnalysis, setAtsAnalysis] = useState(null);
    const [atsLoading, setAtsLoading] = useState(false);

    // Grammar Checker state
    const [showGrammarPanel, setShowGrammarPanel] = useState(false);
    const [grammarAnalysis, setGrammarAnalysis] = useState(null);
    const [grammarLoading, setGrammarLoading] = useState(false);

    // Voice I/O
    const {
        isRecording, startRecording, stopRecording,
        speak, stopSpeaking, isSpeaking,
        speechSupported, voiceOutputEnabled, toggleVoiceOutput
    } = useVoice();


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

    // ── ATS Job Description Analyzer ────────────────────────────────
    const handleAtsAnalyze = async () => {
        if (!atsJobDescription.trim() || atsLoading) return;
        setAtsLoading(true);
        try {
            const res = await AnalyzeATS({ resumeId: id, jobDescription: atsJobDescription });
            if (res.data?.data?.analysis) {
                setAtsAnalysis(res.data.data.analysis);
            }
        } catch (err) {
            console.error("ATS analysis failed:", err);
        } finally {
            setAtsLoading(false);
        }
    };

    // ── Grammar & Tone Checker ──────────────────────────────────────
    const handleGrammarCheck = async () => {
        if (grammarLoading) return;
        setGrammarLoading(true);
        setShowGrammarPanel(true);
        try {
            const res = await CheckGrammar({ resumeId: id });
            if (res.data?.data?.analysis) {
                setGrammarAnalysis(res.data.data.analysis);
            }
        } catch (err) {
            console.error("Grammar check failed:", err);
        } finally {
            setGrammarLoading(false);
        }
    };

    const handleAcceptGrammarFix = async (issue) => {
        if (!resumeData) return;
        const newData = JSON.parse(JSON.stringify(resumeData));
        try {
            if (issue.section === 'achievements') {
                if (newData.achievements && newData.achievements[issue.arrayIndex]) {
                    newData.achievements[issue.arrayIndex] = issue.suggestion;
                }
            } else if (['experience', 'projects'].includes(issue.section)) {
                const entry = newData[issue.section]?.[issue.arrayIndex];
                if (entry?.highlights?.[issue.subIndex] !== undefined) {
                    entry.highlights[issue.subIndex] = issue.suggestion;
                }
            }
            await handleEditSave(newData);
            // Remove this issue from the list
            setGrammarAnalysis(prev => ({
                ...prev,
                issues: prev.issues.filter(i => i !== issue),
            }));
        } catch (err) {
            console.error("Failed to apply grammar fix:", err);
        }
    };

    // ── Voice handlers ──────────────────────────────────────────────
    const handleVoiceInput = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording((transcript) => {
                setInputMessage(transcript);
            });
        }
    }, [isRecording, startRecording, stopRecording]);

    // Auto-speak AI responses when voice output is enabled
    const lastMessageRef = useRef(null);
    useEffect(() => {
        if (!voiceOutputEnabled || messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'assistant' && lastMsg.content !== lastMessageRef.current) {
            lastMessageRef.current = lastMsg.content;
            speak(lastMsg.content);
        }
    }, [messages, voiceOutputEnabled, speak]);

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

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleGrammarCheck}
                        disabled={grammarLoading}
                        className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border border-transparent hover:border-amber-200"
                    >
                        {grammarLoading ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                        Grammar Check
                    </button>
                    <button
                        onClick={handleRecompile}
                        disabled={recompiling}
                        className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={recompiling ? 'animate-spin' : ''} />
                        {recompiling ? 'Recompiling...' : 'Recompile'}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Download size={16} /> Download
                    </button>
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Share2 size={16} /> Share
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
                    {showAtsPanel && (
                        <div className="bg-white border-b border-slate-200 p-4 animate-in slide-in-from-top duration-300 max-h-[60vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Target size={16} className="text-blue-600" /> ATS Score & Job Match
                                </h4>
                                <button onClick={() => setShowAtsPanel(false)} className="text-slate-400 hover:text-slate-600">
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            {/* Quality Score Breakdown */}
                            {qualityScore && (
                                <>
                                    <div className="space-y-2 mb-4">
                                        {qualityScore.breakdown?.map((cat, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-xs mb-0.5">
                                                    <span className="font-medium text-slate-600">{cat.category}</span>
                                                    <span className="text-slate-500">{cat.score}/{cat.maxScore}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${(cat.score / cat.maxScore) >= 0.8 ? 'bg-emerald-500' : (cat.score / cat.maxScore) >= 0.5 ? 'bg-amber-500' : 'bg-red-400'}`}
                                                        style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {qualityScore.tips?.length > 0 && (
                                        <div className="space-y-1.5 mb-4">
                                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                <Zap size={12} className="text-amber-500" /> Tips to Improve
                                            </h5>
                                            {qualityScore.tips.map((tip, i) => (
                                                <p key={i} className="text-xs text-slate-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">{tip}</p>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* JD Match Analyzer */}
                            <div className="border-t border-slate-100 pt-3 mt-2">
                                <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                                    <Search size={12} className="text-violet-500" /> Match Against Job Description
                                </h5>
                                <textarea
                                    value={atsJobDescription}
                                    onChange={(e) => setAtsJobDescription(e.target.value)}
                                    placeholder="Paste a job description here to see how well your resume matches..."
                                    className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:border-blue-300 focus:bg-white transition-all"
                                />
                                <button
                                    onClick={handleAtsAnalyze}
                                    disabled={!atsJobDescription.trim() || atsLoading}
                                    className="mt-2 w-full py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {atsLoading ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</> : <><Target size={14} /> Analyze Match</>}
                                </button>

                                {/* ATS Analysis Results */}
                                {atsAnalysis && (
                                    <div className="mt-3 space-y-3 animate-in fade-in duration-300">
                                        {/* Match Score */}
                                        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-black border-4 shrink-0 ${atsAnalysis.matchScore >= 75 ? 'border-emerald-400 text-emerald-700 bg-emerald-50' :
                                                    atsAnalysis.matchScore >= 50 ? 'border-amber-400 text-amber-700 bg-amber-50' :
                                                        'border-red-400 text-red-700 bg-red-50'
                                                }`}>
                                                {atsAnalysis.matchScore}%
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-700">JD Match Score</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{atsAnalysis.summary}</p>
                                            </div>
                                        </div>

                                        {/* Section Scores */}
                                        {atsAnalysis.sectionScores && (
                                            <div className="space-y-1.5">
                                                {Object.entries(atsAnalysis.sectionScores).map(([key, val]) => (
                                                    <div key={key}>
                                                        <div className="flex justify-between text-[11px] mb-0.5">
                                                            <span className="font-medium text-slate-600 capitalize">{key}</span>
                                                            <span className="text-slate-500">{val.score}%</span>
                                                        </div>
                                                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${val.score >= 75 ? 'bg-emerald-500' : val.score >= 50 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${val.score}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Keywords */}
                                        <div className="space-y-2">
                                            {atsAnalysis.matchedKeywords?.length > 0 && (
                                                <div>
                                                    <p className="text-[11px] font-bold text-emerald-700 mb-1 flex items-center gap-1"><CheckCircle size={11} /> Matched Keywords</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {atsAnalysis.matchedKeywords.map((kw, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded-full border border-emerald-200 font-medium">{kw}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {atsAnalysis.missingKeywords?.length > 0 && (
                                                <div>
                                                    <p className="text-[11px] font-bold text-red-600 mb-1 flex items-center gap-1"><XCircle size={11} /> Missing Keywords</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {atsAnalysis.missingKeywords.map((kw, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] rounded-full border border-red-200 font-medium">{kw}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Suggestions */}
                                        {atsAnalysis.suggestions?.length > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1"><Zap size={11} className="text-amber-500" /> Suggestions</p>
                                                {atsAnalysis.suggestions.map((s, i) => (
                                                    <p key={i} className="text-[11px] text-slate-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">{s}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Grammar & Tone Panel */}
                    {showGrammarPanel && (
                        <div className="bg-white border-b border-slate-200 p-4 animate-in slide-in-from-top duration-300 max-h-[50vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-amber-500" /> Grammar & Tone
                                </h4>
                                <button onClick={() => setShowGrammarPanel(false)} className="text-slate-400 hover:text-slate-600">
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            {grammarLoading ? (
                                <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-sm">
                                    <Loader2 size={18} className="animate-spin" /> Analyzing your writing...
                                </div>
                            ) : grammarAnalysis ? (
                                <div className="space-y-3">
                                    {/* Overall Score */}
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className={`px-3 py-1.5 rounded-lg text-sm font-black ${grammarAnalysis.overallScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                                grammarAnalysis.overallScore >= 60 ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {grammarAnalysis.overallScore}/100
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-700 capitalize">Tone: {grammarAnalysis.overallTone}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{grammarAnalysis.summary}</p>
                                        </div>
                                    </div>

                                    {/* Issues */}
                                    {grammarAnalysis.issues?.length === 0 ? (
                                        <div className="text-center py-4">
                                            <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
                                            <p className="text-xs font-bold text-emerald-700">No issues found! Your writing is clean.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-bold text-slate-500">{grammarAnalysis.issues.length} issue{grammarAnalysis.issues.length > 1 ? 's' : ''} found</p>
                                            {grammarAnalysis.issues.map((issue, i) => (
                                                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${issue.type === 'grammar' ? 'bg-red-100 text-red-700' :
                                                                issue.type === 'weak_verb' ? 'bg-orange-100 text-orange-700' :
                                                                    issue.type === 'tone' ? 'bg-purple-100 text-purple-700' :
                                                                        'bg-blue-100 text-blue-700'
                                                            }`}>{issue.type?.replace('_', ' ')}</span>
                                                        <span className="text-[10px] text-slate-400">{issue.context}</span>
                                                    </div>
                                                    <p className="text-[11px] text-red-600 line-through">{issue.original}</p>
                                                    <p className="text-[11px] text-emerald-700 font-medium">{issue.suggestion}</p>
                                                    {issue.explanation && <p className="text-[10px] text-slate-400 italic">{issue.explanation}</p>}
                                                    <div className="flex gap-2 pt-1">
                                                        <button
                                                            onClick={() => handleAcceptGrammarFix(issue)}
                                                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors"
                                                        >
                                                            Accept Fix
                                                        </button>
                                                        <button
                                                            onClick={() => setGrammarAnalysis(prev => ({ ...prev, issues: prev.issues.filter(is => is !== issue) }))}
                                                            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] font-bold rounded-lg transition-colors"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : null}
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
                            <div className="p-4 bg-white border-t border-slate-200 z-20">
                                {/* Voice Output Toggle */}
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <div className="flex items-center gap-2">
                                        {speechSupported && (
                                            <button
                                                onClick={toggleVoiceOutput}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${voiceOutputEnabled
                                                        ? 'bg-violet-50 text-violet-700 border-violet-200'
                                                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                                                    }`}
                                                title={voiceOutputEnabled ? 'Voice output ON' : 'Voice output OFF'}
                                            >
                                                {voiceOutputEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                                                {voiceOutputEnabled ? 'Voice On' : 'Voice Off'}
                                            </button>
                                        )}
                                    </div>
                                    {isSpeaking && (
                                        <div className="flex items-center gap-1 text-violet-500">
                                            <div className="flex gap-0.5 items-end h-3">
                                                <div className="w-0.5 bg-violet-400 rounded-full animate-pulse" style={{ height: '30%', animationDelay: '0ms' }}></div>
                                                <div className="w-0.5 bg-violet-400 rounded-full animate-pulse" style={{ height: '60%', animationDelay: '150ms' }}></div>
                                                <div className="w-0.5 bg-violet-400 rounded-full animate-pulse" style={{ height: '100%', animationDelay: '300ms' }}></div>
                                                <div className="w-0.5 bg-violet-400 rounded-full animate-pulse" style={{ height: '60%', animationDelay: '450ms' }}></div>
                                                <div className="w-0.5 bg-violet-400 rounded-full animate-pulse" style={{ height: '30%', animationDelay: '600ms' }}></div>
                                            </div>
                                            <span className="text-[10px] font-medium">Speaking...</span>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleSendMessage} className="relative group">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        placeholder={isRecording ? '🎤 Listening...' : 'Type or speak your answer...'}
                                        className={`w-full pl-5 pr-36 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400 text-slate-700 shadow-inner relative z-10 ${isRecording ? 'border-red-300 bg-red-50/50' : 'border-slate-200'
                                            }`}
                                    />
                                    <div className="absolute right-2 top-2 flex items-center gap-1 z-20">
                                        {/* Mic Button */}
                                        {speechSupported && (
                                            <button
                                                type="button"
                                                onClick={handleVoiceInput}
                                                disabled={chatLoading}
                                                className={`p-2 rounded-xl transition-all disabled:opacity-50 ${isRecording
                                                        ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                                                    }`}
                                                title={isRecording ? 'Stop recording' : 'Start recording'}
                                            >
                                                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                                            </button>
                                        )}
                                        {/* Skip Button */}
                                        <button
                                            type="button"
                                            onClick={handleSkip}
                                            disabled={chatLoading}
                                            className="p-2 px-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
                                        >
                                            Skip
                                        </button>
                                        {/* Send Button */}
                                        <button
                                            type="submit"
                                            disabled={!inputMessage.trim() || chatLoading}
                                            className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-sm"
                                        >
                                            <Send size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </form>
                                <p className="text-center text-[10px] text-slate-400 mt-2.5 font-medium">
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