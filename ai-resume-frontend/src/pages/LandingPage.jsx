import React from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';

function LandingPage() {
  return (
    <div className='min-h-screen bg-slate-950 text-slate-300 selection:bg-blue-500/30'>
      <Navbar />

      {/* Hero Section */}
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

      {/* Trusted By Section */}
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

      {/* Features Section */}
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

      {/* How it Works */}
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

      {/* Pricing Section */}
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

      {/* CTA Section */}
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

      {/* Footer */}
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
    </div>
  );
}

export default LandingPage;