import React from 'react';

const TrustedBy = () => {
    return (
        <section className='py-12 border-y border-white/5 bg-slate-900/50'>
            <div className="container mx-auto px-6 text-center">
                <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-8">Helping candidates get hired at</p>
                <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
                    {['TechCorp', 'CloudSystems', 'FinTech', 'StarJump', 'HealthPlus'].map((name, i) => (
                        <div key={i} className="flex items-center gap-2 text-xl font-bold text-slate-400">
                            <span className="text-2xl">
                                {i === 0 && '❖'} {i === 1 && '☁'} {i === 2 && '回'} {i === 3 && '🚀'} {i === 4 && '🏥'}
                            </span>
                            {name}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustedBy;
