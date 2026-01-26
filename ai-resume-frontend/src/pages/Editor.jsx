// src/pages/Editor.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Download, Share2, Send, Bot, User, ArrowLeft, RefreshCw, Loader2, FileText, ChevronRight } from 'lucide-react';
import { GetResumeById, StartChat, ChatWithAgent, RecompilePdf, DownloadPdf, ChangeTemplate } from '../services/resume.api';
import { getAllTemplates } from '../services/template.api';

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
                alert("Failed to load resume. Redirecting to dashboard.");
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
                    const startRes = await StartChat({ resumeId: id });
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
            const response = await ChatWithAgent({ resumeId: id, message: userMsg });

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
        setRecompiling(true);
        try {
            const res = await DownloadPdf(id);
            if (res) {
                setPdfUrl(res);
                setPdfTimestamp(Date.now()); // 👈 important
            }
        } catch (error) {
            console.error("Recompile error:", error);
            alert("❌ Failed to recompile PDF");
        } finally {
            setRecompiling(false);
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
                    {pdfUrl ? (
                        <div className="bg-white shadow-xl w-[794px] h-fit">
                            <iframe
                            key={pdfTimestamp}
                            src={`${pdfUrl}?t=${pdfTimestamp}`}
                            className="w-full h-[1123px]"
                            title="Resume Preview"
                            />
                        </div>
                    ) : (
                        // Loading state for PDF generation
                        <div className="bg-white shadow-xl w-[794px] h-[1123px] flex flex-col items-center justify-center p-12 text-slate-400">
                            <div className="animate-spin mb-4">
                                <Loader2 size={48} className="text-blue-500" />
                            </div>
                            <p className="text-lg font-medium text-slate-600">Generating your resume PDF...</p>
                            <p className="text-sm mt-2">This usually takes a few seconds.</p>
                        </div>
                    )}
                </main>

                {/* RIGHT PANEL: Chat */}
                <aside className="w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">AI Assistant</h3>
                                <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-md'
                                    }`}>
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                    }`}>
                                    {msg.content.split('\n').map((line, i) => (
                                        <p key={i} className="mb-1 last:mb-0">{line}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                    <Bot size={16} />
                                </div>
                                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200">
                        <form onSubmit={handleSendMessage} className="relative">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Type your answer..."
                                className="w-full pl-5 pr-14 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium placeholder:text-slate-400"
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || chatLoading}
                                className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Editor;