import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

function Navbar() {

    const currentUrl = window.location.pathname;
    
    return (
        <nav className='fixed top-0 left-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5'>
            <div className='container mx-auto px-6 h-16 flex items-center justify-between'>
                {/* Logo */}
                <Link to="/" className='flex items-center gap-2'>
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span className='font-bold text-xl text-white tracking-tight'>ResumeAI</span>
                </Link>

                {/* Desktop Navigation */}
                { currentUrl == "/" && 
                <div className='hidden md:flex items-center gap-8'>
                    <a href="#features" className='text-sm font-medium text-slate-300 hover:text-white transition-colors'>Features</a>
                    <a href="#pricing" className='text-sm font-medium text-slate-300 hover:text-white transition-colors'>Pricing</a>
                    <a href="#templates" className='text-sm font-medium text-slate-300 hover:text-white transition-colors'>Templates</a>
                </div>
                }   

                {/* Auth Buttons */}
                <div className='flex items-center gap-4'>
                    <Link to={'/login'} className='text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block'>
                        Login
                    </Link>
                    <Button to={'/signup'} variant="primary" size="sm">
                        Get Started
                    </Button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;