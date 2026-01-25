import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Silk from '../components/ui/silk';
import { isLoggedInAPI, loginAPI } from '../services/auth.api';
import Button from '../components/ui/Button';
import { useEffect } from 'react';

function Login() {
    const navigate = useNavigate();
    const emailRef = useRef(null);
    const passRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    const signIn = async () => {
        try {
            setIsLoading(true);
            const email = emailRef.current.value;
            const password = passRef.current.value;
            const response = await loginAPI({ email, password });
            if (response.data.statusCode === 200) navigate("/dashboard");
        } catch (err) {
            console.log("error while logging in", err);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(()=>{
        const check = async()=>{
            try{
                const response = await isLoggedInAPI()
                if(response.data.statusCode == 200) navigate("/dashboard")
            }catch(err){
                console.log(err)
            }
        }
        check()
    } , [])




    return (
        <div className='h-screen w-full flex bg-slate-950 text-white selection:bg-blue-500/30 overflow-hidden'>
            {/* Left Side - Visual/Art */}
            <div className='hidden lg:flex w-1/2 relative flex-col justify-center px-12 bg-slate-900 border-r border-white/5 h-full overflow-hidden'>
                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="relative z-10 w-full max-w-lg mx-auto">
                    {/* Logo area */}
                    <div className="flex items-center gap-2 mb-12">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <span className="font-bold text-xl text-white">ResumeAI</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                        Master your career with <span className="text-blue-500">AI-precision.</span>
                    </h1>
                    <p className="text-slate-400 text-lg mb-12 leading-relaxed">
                        Generate LaTeX-perfect resumes in seconds. Our AI ensures your skills stand out to recruiters and ATS systems alike.
                    </p>

                    {/* Resume Graphic Container */}
                    <div className="relative w-full aspect-[4/3] bg-slate-800 rounded-2xl p-8 border border-white/5 shadow-2xl flex items-center justify-center overflow-hidden group">
                        {/* Circle Decor */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5"></div>
                        <div className="absolute w-64 h-64 bg-amber-100/10 rounded-full blur-3xl -top-10 -right-10 pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>

                        {/* The Resume Paper */}
                        <div className="relative w-48 bg-white rounded shadow-xl transform rotate-[-5deg] transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105 p-4 flex flex-col gap-2 opacity-90">
                            {/* Header */}
                            <div className="h-4 w-20 bg-slate-800 rounded-sm mb-2"></div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-sm"></div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-sm mb-2"></div>
                            {/* Content Blocks */}
                            <div className="flex gap-2">
                                <div className="w-1/3 space-y-1">
                                    <div className="h-1.5 w-full bg-slate-200 rounded-sm"></div>
                                    <div className="h-1.5 w-3/4 bg-slate-200 rounded-sm"></div>
                                    <div className="h-1.5 w-full bg-slate-200 rounded-sm"></div>
                                </div>
                                <div className="w-2/3 space-y-1">
                                    <div className="h-2 w-full bg-blue-100 rounded-sm"></div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-sm"></div>
                                    <div className="h-1.5 w-5/6 bg-slate-100 rounded-sm"></div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-sm"></div>
                                    <div className="mt-2 h-2 w-3/4 bg-blue-100 rounded-sm"></div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-sm"></div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur border border-white/10 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-mono text-slate-300">ATS Score: 98</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className='w-full lg:w-1/2 flex items-center justify-center p-8 relative h-full'>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-violet-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

                <div className='w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10'>
                    <div className='mb-8 text-center lg:text-left'>
                        <h1 className='text-3xl font-bold text-white mb-2'>Sign In</h1>
                        <p className='text-slate-400 text-sm'>
                            Enter your credentials to access your account.
                        </p>
                    </div>

                    <div className='space-y-6'>
                        <div className='space-y-2'>
                            <label className='text-sm font-medium text-slate-300 ml-1'>Email Address</label>
                            <input
                                ref={emailRef}
                                type="email"
                                placeholder='name@example.com'
                                className='w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all'
                            />
                        </div>

                        <div className='space-y-2'>
                            <div className="flex items-center justify-between">
                                <label className='text-sm font-medium text-slate-300 ml-1'>Password</label>
                                <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</a>
                            </div>
                            <input
                                ref={passRef}
                                type="password"
                                placeholder='••••••••'
                                className='w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all'
                            />
                        </div>

                        <Button
                            onClick={signIn}
                            isLoading={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 py-3 text-base"
                        >
                            Sign In
                        </Button>


                        <p className='text-center text-slate-400 text-sm mt-8'>
                            Don't have an account? <Link to='/register' className='text-blue-400 hover:text-blue-300 font-medium transition-colors'>Sign up</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;