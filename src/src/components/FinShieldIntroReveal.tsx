import React, { useState, useEffect } from 'react';
import { FinShieldLogo } from './FinShieldLogo';
import { ShieldCheck } from 'lucide-react';

interface FinShieldIntroRevealProps {
  onComplete: () => void;
}

export const INTRO_STORAGE_KEY = 'finshield_intro_seen';

export const FinShieldIntroReveal: React.FC<FinShieldIntroRevealProps> = ({
  onComplete,
}) => {
  // Animation phases:
  // 0: Initial dark stage (0 - 300ms)
  // 1: Logo opacity & scale 92% -> 100% (300 - 800ms)
  // 2: Glow blooms + Security scan sweep begins (800 - 1300ms)
  // 3: Wordmark reveals staggered (1200 - 1650ms)
  // 4: Brief hold (1650 - 2000ms)
  // 5: Smooth fade into application (2000 - 2350ms)
  const [phase, setPhase] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // Record session flag to ensure animation only executes once per session
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
    } catch {
      // Storage access resilience
    }

    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 700);
    const t3 = setTimeout(() => setPhase(3), 1150);
    const t4 = setTimeout(() => setPhase(4), 1600);
    const t5 = setTimeout(() => setIsFadingOut(true), 2000);
    const t6 = setTimeout(() => onComplete(), 2350);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        setIsFadingOut(true);
        setTimeout(onComplete, 200);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 200);
  };

  return (
    <aside
      aria-label="FinShield Startup Presentation"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050811] text-white transition-opacity duration-350 ease-out overflow-hidden select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Soft Ambient Radial Background Glow */}
      <div
        className={`absolute w-[450px] h-[450px] rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
          phase >= 2 ? 'opacity-40' : 'opacity-10'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.28) 0%, rgba(20, 184, 166, 0.12) 50%, transparent 75%)',
        }}
      />

      {/* Central Cinematic Logo Group */}
      <div className="relative flex flex-col items-center justify-center text-center px-6">
        {/* Step 2-6: Authentic Logo Badge with scale 92% -> 100%, soft glow, and scan sweep */}
        <div
          className={`relative transition-all duration-700 ease-out transform ${
            phase >= 1
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-[0.92]'
          }`}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Subtle Outer Glow Aura */}
          <div
            className={`absolute -inset-2.5 rounded-3xl bg-cyan-400/20 blur-xl transition-opacity duration-700 pointer-events-none ${
              phase >= 2 ? 'opacity-100 animate-pulse-glow' : 'opacity-0'
            }`}
          />

          <FinShieldLogo
            size="hero"
            showWordmark={false}
            withGlow={phase >= 2}
            isScanning={phase >= 2}
          />
        </div>

        {/* Step 7: Staggered FINSHIELD Wordmark Reveal */}
        <div
          className={`mt-6 flex flex-col items-center transition-all duration-500 ease-out ${
            phase >= 3
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="flex items-center text-3xl sm:text-5xl font-extrabold tracking-tight">
            <span className="text-white drop-shadow-sm">Fin</span>
            <span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.45)]">
              Shield
            </span>
          </div>

          {/* Enterprise Security Sub-label */}
          <div
            className={`mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/50 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-cyan-300 transition-all duration-500 delay-100 ${
              phase >= 3 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Secure Financial Intelligence</span>
          </div>
        </div>
      </div>

      {/* Discrete Skip Trigger */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute bottom-6 right-6 text-[11px] font-mono tracking-wider text-slate-500 hover:text-cyan-400 transition-colors uppercase px-3 py-1.5 rounded-lg border border-slate-800/80 hover:border-cyan-800/50 cursor-pointer"
      >
        Skip ➔
      </button>
    </aside>
  );
};
