import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/landing/Hero';
import TrustedBy from '../components/landing/TrustedBy';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Pricing from '../components/landing/Pricing';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

import { loginAPI } from '../services/auth.api';

function LandingPage() {

    async function login(){
        try{
            const response = await loginAPI({email : 'raghav.test@example.com' , password : 'password123'})
        }catch(err){
            console.log(err)
        }
    }

    login()
    
  return (
    <div className='min-h-screen bg-slate-950 text-slate-300 selection:bg-blue-500/30'>
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

export default LandingPage;
