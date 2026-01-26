// src/pages/Editor.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Download, Share2, Send, Bot, User, ArrowLeft, RefreshCw, Loader2, FileText, ChevronRight, Sparkles } from 'lucide-react';
import { GetResumeById, RecompilePdf, DownloadPdf, ChangeTemplate } from '../services/resume.api';
import { StartAgentChat, MsgAgent } from '../services/agent.api';
import { getAllTemplates } from '../services/template.api';
import { GridScan } from '../components/ui/gridScan';
import DotGrid from '../components/ui/dotGrid';



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


    // Fetch Resume & Templates on Mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Resume Detail
                const resumeRes = await GetResumeById(id);


                if (resumeRes.data?.data?.resume) {
                    const resume = resumeRes.data.data.resume;
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

    // Start conversation if not started
    useEffect(() => {
        const initChat = async () => {
            console.log(messages.length, conversationStarted)
            if (!loading && messages.length === 0) {
                try {
                    const startRes = await StartAgentChat({ resumeId: id });
                    if (startRes.data?.data?.aiMessage) {
                        setMessages([{
                            role: 'assistant',
                            content: startRes.data.data.aiMessage
                        }]);
                        setConversationStarted(true);
                    }
                } catch (error) {
                    console.error("Error starting chat:", error);
                }
            }
        };
        initChat();
    }, [loading, conversationStarted, messages.length, id]);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || chatLoading) return;

        const userMsg = inputMessage;
        setInputMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatLoading(true);

        try {
            const response = await MsgAgent({ resumeId: id, message: userMsg });

            if (response.data?.data) {
                const { aiMessage, resumeData: updatedResumeData, pdfRecompiled } = response.data.data;

                setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);

                // Update resume preview
                if (updatedResumeData) {
                    setResumeData(updatedResumeData);
                }

                // If PDF was auto-recompiled, update timestamp
                if (pdfRecompiled) {
                    setPdfTimestamp(Date.now());
                    console.log("✅ PDF auto-updated!");
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I encountered an error. Please try again."
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleRecompile = async () => {
        setPdfLoading(true);

        try {
            const res = await DownloadPdf(id);
            if (res) {
                setPdfUrl(res);
                setPdfTimestamp(Date.now()); // triggers reload
            }
        } catch (error) {
            console.error("Recompile error:", error);
            alert("❌ Failed to recompile PDF");
        }
    };

    const handleDownload = async () => {
        try {
            const pdfUrl = await DownloadPdf(id);

            console.log("PDF URL:", pdfUrl);

            // Open PDF in new tab
            window.open(pdfUrl, "_blank", "noopener,noreferrer");

        } catch (error) {
            console.error("Open PDF error:", error);
            alert("Failed to open PDF");
        }
    };


    const changeTemp = async (templateId) => {
        console.log(templateId)
        await ChangeTemplate({ id, templateId })
        handleRecompile()
    }

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
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                        <Share2 size={18} /> Share
                    </button>
                </div>
            </header>

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


                {/* RIGHT PANEL: Chat */}
                <aside className="w-[450px] bg-slate-50 border-l border-slate-200 flex flex-col shadow-xl z-20 relative overflow-hidden">

                    {/* Chat Header */}
                    <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center z-10 sticky top-0">
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
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 transform rotate-3">
                                    <Bot size={32} className="text-slate-400" />
                                </div>
                                <p className="text-slate-500 font-medium">Start the conversation to build your resume.</p>
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
                </aside>
            </div>
        </div>
    );
};

export default Editor;