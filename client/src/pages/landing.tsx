import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { AuthModal } from "@/components/AuthModal";

function useScrollFadeIn(): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, isVisible];
}

export default function Landing() {
  const [heroRef, heroVisible] = useScrollFadeIn();
  const [featuresRef, featuresVisible] = useScrollFadeIn();
  const [designRef, designVisible] = useScrollFadeIn();
  const [ctaRef, ctaVisible] = useScrollFadeIn();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  return (
    <>
    <div className="bg-[var(--bg-primary)]">
      {/* Hero Section */}
      <section ref={heroRef} className={`relative py-20 md:py-32 px-5 md:px-10 overflow-hidden transition-opacity duration-700 ${heroVisible ? 'animate-fade-in opacity-100' : 'opacity-0'}`}>
        {/* Geometric Background Shapes */}
        <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
          <div className="absolute top-20 right-10 w-32 h-32 bg-[var(--accent-yellow)] opacity-20 transform rotate-45 rounded-2xl"></div>
          <div className="absolute bottom-32 left-16 w-24 h-24 bg-[var(--accent-blue)] opacity-15 rounded-full"></div>
          <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-[var(--accent-yellow)] opacity-10 transform rotate-12"></div>
          <svg className="absolute bottom-20 right-20 w-40 h-40 opacity-10" viewBox="0 0 100 100">
            <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="var(--accent-blue)" />
          </svg>
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-left">
              <h1 className="text-[clamp(48px,8vw,80px)] font-black tracking-[-2px] leading-[1.1] mb-8 text-[var(--text-primary)]">
                Transforming Insight<br />into Action
              </h1>
              <Button
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="bg-[var(--accent-blue)] text-[var(--bg-primary)] px-10 py-4 rounded-full font-semibold text-lg hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                Get Started
              </Button>
            </div>
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="bg-[var(--white)] p-12 rounded-2xl hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                <svg 
                  className="w-48 h-48 md:w-64 md:h-64" 
                  viewBox="0 0 200 200" 
                  fill="none"
                  alt="Structured learning illustration"
                >
                  {/* Simple 3D cube illustration */}
                  <g transform="translate(50, 30)">
                    {/* Back face */}
                    <path d="M20 40 L80 40 L100 20 L40 20 Z" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2"/>
                    {/* Left face */}
                    <path d="M20 40 L40 20 L40 80 L20 100 Z" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="2"/>
                    {/* Right face */}
                    <path d="M80 40 L100 20 L100 80 L80 100 Z" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="2"/>
                    {/* Top face */}
                    <path d="M20 40 L80 40 L80 100 L20 100 Z" fill="#FFFFFF" stroke="#9CA3AF" strokeWidth="2"/>
                  </g>
                  {/* Accent elements */}
                  <circle cx="160" cy="50" r="8" fill="var(--accent-yellow)" opacity="0.7"/>
                  <rect x="30" y="150" width="12" height="12" fill="var(--accent-blue)" opacity="0.6" rx="2"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section (Midsection) */}
      <section className="py-20 md:py-32 px-5 md:px-10 flex flex-col items-center text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-[clamp(32px,5vw,48px)] font-bold tracking-[-1px] mb-6 text-[var(--text-primary)]">
            No More <span className="italic">"What Was That Tool Again?"</span>
          </h1>
          <h2 className="text-[clamp(32px,5vw,48px)] font-bold mb-4 text-[var(--text-primary)]">
            You've done the program. Now it's time to use it.
          </h2>
          <h3 className="text-[clamp(32px,5vw,48px)] font-bold mb-3 text-[var(--accent-blue)]">
            Level Up helps you lead on purpose.
          </h3>
          <p className="text-lg font-normal leading-[1.7] text-[var(--text-secondary)] max-w-2xl mx-auto mt-2">
            Not just get through the day, but grow your team, coach through the hard stuff, and build habits that make you proud of how you manage—not just what you deliver.
          </p>
        </div>
      </section>

      {/* Simple by Design Section */}
      <section ref={designRef} className={`py-20 md:py-32 px-5 md:px-10 bg-[var(--bg-primary)] transition-opacity duration-700 ${designVisible ? 'animate-fade-in opacity-100' : 'opacity-0'}`}>
        <div className="max-w-6xl mx-auto">
          {/* Geometric shapes for visual interest */}
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-[var(--accent-yellow)] opacity-20 transform rotate-45 rounded-lg"></div>
            <h2 className="text-[clamp(32px,5vw,48px)] font-bold text-center mb-16 text-[var(--text-primary)]">
              Simple by Design
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 - Following design guide template */}
            <div className="bg-[var(--white)] p-12 rounded-2xl hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="text-6xl font-black text-[var(--accent-yellow)] mb-4">01</div>
              <h3 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Learn on the Go</h3>
              <p className="text-[var(--text-secondary)]">
                5-minute lessons with videos and podcasts for busy schedules.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[var(--white)] p-12 rounded-2xl hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="text-6xl font-black text-[var(--accent-yellow)] mb-4">02</div>
              <h3 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Personalized Guidance</h3>
              <p className="text-[var(--text-secondary)]">
                Chat with an AI mentor to tackle real situations.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[var(--white)] p-12 rounded-2xl hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="text-6xl font-black text-[var(--accent-yellow)] mb-4">03</div>
              <h3 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Dive Deep</h3>
              <p className="text-[var(--text-secondary)]">
                Long-form summaries of the greatest management books.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky CTA for mobile */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-center z-50 lg:hidden">
        <button
          onClick={() => {
            setAuthMode('signin');
            setShowAuthModal(true);
          }}
          className="bg-[var(--accent-blue)] text-[var(--white)] font-semibold px-8 py-3 rounded-full shadow-lg text-lg hover:bg-[var(--accent-yellow)] hover:text-[var(--text-primary)] transition-all duration-300 w-full max-w-sm"
        >
          Get Started
        </button>
      </div>
    </div>
    
    <AuthModal 
      isOpen={showAuthModal} 
      onClose={() => setShowAuthModal(false)} 
      mode={authMode}
    />
  </>
  );
}