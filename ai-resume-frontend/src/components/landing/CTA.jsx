import React from 'react';
import Button from '../ui/Button';

const CTA = () => {
    return (
        <section className='py-20 bg-slate-900/30'>
            <div className="container mx-auto px-6">
                <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-12 text-center text-white relative overflow-hidden border border-white/10 shadow-2xl">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to land your next role?</h2>
                        <p className="text-blue-100 mb-10 text-lg">
                            Join thousands of job seekers using AI to build better resumes in record time. No credit card required to start.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button to="/signup" className="bg-white text-blue-600 hover:bg-blue-50">Get Started Now</Button>
                            <Button className="bg-transparent text-white border border-white/30 hover:bg-white/10">Talk to Sales</Button>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-50 mix-blend-overlay"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-violet-500 rounded-full blur-3xl opacity-50 mix-blend-overlay"></div>
                </div>
            </div>
        </section>
    );
};

export default CTA;
