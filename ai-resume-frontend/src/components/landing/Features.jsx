import React from 'react';

const Features = () => {
    return (
        <section id="features" className='py-24 bg-slate-950'>
            <div className='container mx-auto px-6'>
                <div className='text-center max-w-2xl mx-auto mb-16'>
                    <h2 className='text-3xl font-bold text-white mb-4'>Everything you need to stand out</h2>
                    <p className='text-slate-400'>Our AI-powered platform gives you the tools to create a resume that gets you noticed by recruiters and ATS systems alike.</p>
                </div>

                <div className='grid md:grid-cols-3 gap-8'>
                    {[
                        {
                            title: "ATS-Friendly LaTeX Formats",
                            desc: "Don't let bad formatting drop your application. Our templates are compiled in LaTeX to ensure perfect parsing.",
                            icon: (
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            )
                        },
                        {
                            title: "AI Content Writer",
                            desc: "Stuck on a bullet point? Our advanced AI generates strong, metric-driven content tailored to your specific role.",
                            icon: (
                                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            )
                        },
                        {
                            title: "Real-time Preview",
                            desc: "See your changes instantly. No more compiling and waiting. Edit your resume and view the PDF output side-by-side.",
                            icon: (
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )
                        }
                    ].map((feature, i) => (
                        <div key={i} className='p-8 rounded-2xl bg-slate-900 border border-white/5 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group'>
                            <div className='w-12 h-12 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform'>
                                {feature.icon}
                            </div>
                            <h3 className='text-xl font-semibold text-white mb-3'>{feature.title}</h3>
                            <p className='text-slate-400 leading-relaxed'>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
