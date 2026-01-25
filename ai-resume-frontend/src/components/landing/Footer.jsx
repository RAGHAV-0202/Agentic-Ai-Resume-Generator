import React from 'react';

const Footer = () => {
    return (
        <footer className='bg-slate-950 text-white py-12 border-t border-white/5'>
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <span className="font-bold text-xl">ResumeAI</span>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Empowering candidates with the perfect blend of professional LaTeX formatting and cutting-edge AI content generation.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6 text-white uppercase text-xs tracking-wider">Product</h4>
                        <ul className="space-y-4 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Templates</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">AI Writing</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">LaTeX Editor</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6 text-white uppercase text-xs tracking-wider">Company</h4>
                        <ul className="space-y-4 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Contact Support</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/5 pt-8 text-center text-slate-600 text-xs">
                    <p>© 2024 ResumeAI Inc. All rights reserved. LaTeX is a registered trademark of the LaTeX Project.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
