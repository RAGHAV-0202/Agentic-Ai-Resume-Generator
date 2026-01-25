import React from 'react';
import Button from '../ui/Button';

const Hero = () => {
    return (
        <section className='pt-32 pb-20 px-6 relative overflow-hidden'>
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-screen opacity-30 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px] mix-blend-screen animate-pulse"></div>
                <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-violet-500 rounded-full blur-[100px] mix-blend-screen animation-delay-2000"></div>
            </div>

            <div className='container mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10'>
                <div className='flex-1 space-y-8 text-center md:text-left'>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        NEW: AI Bullet Point Optimizer
                    </div>
                    <h1 className='text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight'>
                        Your Dream Job, <br />
                        Built with <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500'>AI</span>
                    </h1>
                    <p className='text-lg text-slate-400 max-w-xl mx-auto md:mx-0 leading-relaxed'>
                        Generate a professional, ATS-optimized LaTeX resume in minutes. No coding required. Experience the gold standard of document formatting powered by modern AI.
                    </p>
                    <div className='flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start'>
                        <Button size="lg" to="/signup" className="w-full sm:w-auto shadow-blue-500/20 shadow-lg">
                            Build Your Resume for Free
                        </Button>
                        <Button variant="secondary" size="lg" to="#templates" className="w-full sm:w-auto">
                            View Templates
                        </Button>
                    </div>
                    <div className='flex items-center gap-4 justify-center md:justify-start pt-4'>
                        <div className="flex -space-x-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-${600 + i * 100}`}></div>
                            ))}
                        </div>
                        <p className="text-sm text-slate-500">Joined by 10,000+ professionals this month</p>
                    </div>
                </div>

                <div className='flex-1 w-full relative'>
                    <div className="relative rounded-xl bg-slate-900 p-4 shadow-2xl ring-1 ring-white/10">
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                            <div className="ml-4 text-xs text-slate-500 font-mono">editor.resumeai.com</div>
                        </div>
                        <div className="bg-slate-950 rounded-lg shadow-inner border border-white/5 aspect-[4/3] flex overflow-hidden">
                            <div className="w-1/3 border-r border-white/5 p-4 space-y-3 bg-slate-900/50">
                                <div className="h-4 w-3/4 bg-blue-500/20 rounded-md"></div>
                                <div className="space-y-2 pt-2">
                                    <div className="h-2 w-full bg-slate-800 rounded"></div>
                                    <div className="h-2 w-5/6 bg-slate-800 rounded"></div>
                                    <div className="h-2 w-4/6 bg-slate-800 rounded"></div>
                                </div>
                                <div className="p-3 bg-blue-600 rounded-lg mt-4 shadow-md transform translate-y-2 translate-x-1 border border-blue-500/20">
                                    <p className="text-[10px] text-white leading-relaxed">
                                        AI: "I've optimized your bullet points for the Software Engineer role at Google. Would you like to apply these changes?"
                                    </p>
                                </div>
                            </div>
                            <div className="w-2/3 p-6 space-y-4">
                                <div className="h-6 w-1/3 bg-slate-800 rounded self-center mx-auto mb-6"></div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-slate-800 rounded"></div>
                                    <div className="h-2 w-full bg-slate-800 rounded"></div>
                                    <div className="h-2 w-3/4 bg-slate-800 rounded"></div>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <div className="h-2 w-full bg-slate-800 rounded"></div>
                                    <div className="h-2 w-full bg-slate-800 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Glow effect */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl blur-3xl opacity-20 -z-10"></div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
