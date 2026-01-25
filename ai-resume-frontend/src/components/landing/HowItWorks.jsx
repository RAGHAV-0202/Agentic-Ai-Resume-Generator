import React from 'react';

const HowItWorks = () => {
    return (
        <section className='py-24 bg-slate-900/50'>
            <div className="container mx-auto px-6">
                <div className='text-center max-w-2xl mx-auto mb-16'>
                    <h2 className='text-3xl font-bold text-white mb-4'>How it Works</h2>
                    <p className='text-slate-400'>Three simple steps to a high-impact, professional resume that beats the bots.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 text-left">
                    {[
                        {
                            step: "1. Choose Template",
                            desc: "Select from a variety of industry-standard, ATS-friendly LaTeX designs.",
                            icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
                            bg: "bg-blue-500/10",
                            text: "text-blue-400"
                        },
                        {
                            step: "2. Chat with AI",
                            desc: "Describe your experience in plain English. Our AI drafts high-impact bullet points.",
                            icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
                            bg: "bg-blue-500/10",
                            text: "text-blue-400"
                        },
                        {
                            step: "3. Export LaTeX/PDF",
                            desc: "Download your polished resume as a high-resolution PDF or export the raw LaTeX.",
                            icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
                            bg: "bg-blue-500/10",
                            text: "text-blue-400"
                        }
                    ].map((item, i) => (
                        <div key={i} className="bg-slate-900 p-8 rounded-2xl shadow-sm border border-white/5 relative overflow-hidden group">
                            {/* Background Number */}
                            <span className="absolute -top-6 -right-6 text-9xl font-bold text-slate-800/50 select-none group-hover:text-blue-900/20 transition-colors">
                                {i + 1}
                            </span>
                            <div className={`w-12 h-12 rounded-lg ${item.bg} flex items-center justify-center mb-6 relative z-10`}>
                                <svg className={`w-6 h-6 ${item.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 relative z-10">{item.step}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed relative z-10">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
