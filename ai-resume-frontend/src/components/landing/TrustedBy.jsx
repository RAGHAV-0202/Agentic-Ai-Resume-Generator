import React from 'react';
import LogoLoop from '../ui/logoLoop';
import {
  SiGoogle,
  SiAmazon,
  SiApple,
  SiMeta,
  SiNetflix,
  SiTesla,
  SiIntel,
  SiNvidia,
  SiOracle,
  SiAdobe,
} from "react-icons/si";

const techLogos = [
  { node: <SiGoogle />, title: "Google", href: "https://www.google.com" },
  { node: <SiAmazon />, title: "Amazon", href: "https://www.amazon.com" },
  { node: <SiApple />, title: "Apple", href: "https://www.apple.com" },
  { node: <SiMeta />, title: "Meta", href: "https://about.meta.com" },
  { node: <SiNetflix />, title: "Netflix", href: "https://www.netflix.com" },
  { node: <SiTesla />, title: "Tesla", href: "https://www.tesla.com" },
  { node: <SiIntel />, title: "Intel", href: "https://www.intel.com" },
  { node: <SiNvidia />, title: "NVIDIA", href: "https://www.nvidia.com" },
  { node: <SiOracle />, title: "Oracle", href: "https://www.oracle.com" },
  { node: <SiAdobe />, title: "Adobe", href: "https://www.adobe.com" },
];
const TrustedBy = () => {
    return (
        <section className='py-12 border-y border-white/5 bg-slate-900/50'>
            <div className="container mx-auto px-6 text-center">
                <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-8">Helping candidates get hired at</p>
                {/* <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
                    {['TechCorp', 'CloudSystems', 'FinTech', 'StarJump', 'HealthPlus'].map((name, i) => (
                        <div key={i} className="flex items-center gap-2 text-xl font-bold text-slate-400">
                            <span className="text-2xl">
                                {i === 0 && '❖'} {i === 1 && '☁'} {i === 2 && '回'} {i === 3 && '🚀'} {i === 4 && '🏥'}
                            </span>
                            {name}
                        </div>
                    ))}
                </div> */}

                <LogoLoop
                    logos={techLogos}
                    speed={35}
                    direction="left"
                    logoHeight={60}
                    gap={60}
                    hoverSpeed={0}
                    scaleOnHover
                    fadeOut
                    fadeOutColor="#0a0e2080"
                    ariaLabel="Technology partners"
                />
            </div>
        </section>
    );
};

export default TrustedBy;
