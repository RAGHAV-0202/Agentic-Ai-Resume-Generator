import React from 'react';
import Button from '../ui/Button';

const Pricing = () => {
    return (
        <section id="pricing" className='py-24 bg-slate-950'>
            <div className='container mx-auto px-6'>
                <div className='text-center max-w-2xl mx-auto mb-16'>
                    <h2 className='text-3xl font-bold text-white mb-4'>Pricing Plans</h2>
                    <p className='text-slate-400'>Choose the plan that's right for your career journey.</p>
                </div>

                <div className='grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center'>
                    {/* Free Tier */}
                    <div className='p-8 rounded-2xl border border-white/5 bg-slate-900/50 hover:bg-slate-900 transition-colors'>
                        <h3 className='text-lg font-semibold text-white mb-2'>Basic</h3>
                        <div className='flex items-baseline gap-1 mb-6'>
                            <span className='text-4xl font-bold text-white'>$0</span>
                            <span className='text-slate-500'>/ forever</span>
                        </div>
                        <ul className='space-y-4 mb-8'>
                            {['1 Resume Draft', 'Standard LaTeX Templates', 'PDF Downloads'].map(feat => (
                                <li key={feat} className='flex items-center gap-3 text-slate-300 text-sm'>
                                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {feat}
                                </li>
                            ))}
                            <li className='flex items-center gap-3 text-slate-600 text-sm'>
                                <svg className="w-5 h-5 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                AI Assistant
                            </li>
                        </ul>
                        <Button variant="outline" className="w-full">Get Started</Button>
                    </div>

                    {/* Pro Tier */}
                    <div className='p-8 rounded-2xl border border-blue-500/50 relative bg-slate-900 shadow-2xl shadow-blue-900/20 scale-105 z-10'>
                        <div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg shadow-blue-600/40'>
                            Most Popular
                        </div>
                        <h3 className='text-lg font-semibold text-white mb-2'>Professional</h3>
                        <div className='flex items-baseline gap-1 mb-6'>
                            <span className='text-4xl font-bold text-blue-400'>$12</span>
                            <span className='text-slate-500'>/ month</span>
                        </div>
                        <ul className='space-y-4 mb-8'>
                            {['Unlimited Resumes', 'Advanced AI Content Writer', 'LaTeX Source Export', 'Premium Designer Templates'].map(feat => (
                                <li key={feat} className='flex items-center gap-3 text-white text-sm font-medium'>
                                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {feat}
                                </li>
                            ))}
                        </ul>
                        <Button variant="primary" className="w-full">Go Pro</Button>
                    </div>

                    {/* Lifetime Tier */}
                    <div className='p-8 rounded-2xl border border-white/5 bg-slate-900/50 hover:bg-slate-900 transition-colors'>
                        <h3 className='text-lg font-semibold text-white mb-2'>Lifetime</h3>
                        <div className='flex items-baseline gap-1 mb-6'>
                            <span className='text-4xl font-bold text-white'>$49</span>
                            <span className='text-slate-500'>/ once</span>
                        </div>
                        <ul className='space-y-4 mb-8'>
                            {['Everything in Pro', 'Priority Support', 'Future Updates Included', 'Career Roadmap Tool'].map(feat => (
                                <li key={feat} className='flex items-center gap-3 text-slate-300 text-sm'>
                                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {feat}
                                </li>
                            ))}
                        </ul>
                        <Button variant="outline" className="w-full">Buy Once</Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
