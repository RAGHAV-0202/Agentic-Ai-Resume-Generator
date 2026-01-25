import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/landing/Hero';
import TrustedBy from '../components/landing/TrustedBy';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Pricing from '../components/landing/Pricing';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import ClickSpark from '../components/ui/clickSpark';
import { isLoggedInAPI } from '../services/auth.api';

function LandingPage() {

  useEffect(() => {
    async function check() {
      try {
        const response = await isLoggedInAPI();
        console.log(response);
      } catch (err) {
        console.error(err);
      }
    }

    check();
  }, []); // 👈 runs once on page load

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 selection:bg-blue-500/30">
      <ClickSpark
        sparkColor="#fff"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <Navbar />
        <Hero />
        <TrustedBy />
        <Features />
        <HowItWorks />
        <Pricing />
        <CTA />
        <Footer />
      </ClickSpark>
    </div>
  );
}

export default LandingPage;
