import React from 'react';
import {
  Shield,
  ArrowRight,
  Wallet,
  TrendingUp,
  ShieldAlert,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { LanguageSelector } from '../components/LanguageSelector';
import { FinShieldLogo } from '../components/FinShieldLogo';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
}) => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-transparent relative z-10 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#090e1a]/80 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FinShieldLogo size="md" showWordmark={true} />
          <span className="hidden sm:inline-block text-xs font-mono text-slate-400 border border-slate-800 px-2.5 py-1 rounded-full bg-slate-900/40">
            PS-01 • {t('common.subtitle')}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSelector variant="compact" />
          <button
            onClick={onLogin}
            className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors px-3 py-2"
          >
            {t('landing.login')}
          </button>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-sm font-bold px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:scale-105"
          >
            {t('landing.getStarted')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 pt-20 pb-24 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Glow backdrop effect */}
        <div className="absolute top-1/4 -z-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 -z-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Security badge pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono mb-8 animate-pulse">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          {t('landing.heroBadge')}
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          {t('landing.heroTitlePrefix')}{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-200 bg-clip-text text-transparent">
            {t('landing.heroTitleHighlight')}
          </span>
        </h1>

        {/* Supporting text */}
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          {t('landing.heroSubtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-base shadow-xl shadow-cyan-500/25 hover:from-cyan-400 hover:to-teal-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            {t('landing.getStarted')} <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={onLogin}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 text-slate-200 font-semibold text-base hover:bg-slate-800/80 transition-all duration-200"
          >
            {t('landing.login')}
          </button>
        </div>

        {/* Quick architecture banner */}
        <div className="mt-14 inline-flex flex-wrap items-center justify-center gap-4 sm:gap-6 px-6 py-3 rounded-2xl bg-[#0c1322] border border-slate-800 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" /> {t('landing.zeroPlaintextStorage')}
          </span>
          <span className="hidden sm:inline text-slate-700">•</span>
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-teal-400" /> {t('landing.integratedScamShield')}
          </span>
          <span className="hidden md:inline text-slate-700">•</span>
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> {t('landing.serverSideAiGuardrails')}
          </span>
        </div>
      </section>

      {/* 3 Compact Benefit Blocks */}
      <section className="px-6 lg:px-12 py-16 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Block 1: Manage finances */}
          <div className="relative group bg-[#0c1322] border border-slate-800 rounded-2xl p-7 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/20">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('landing.card1Title')}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('landing.card1Desc')}
            </p>
          </div>

          {/* Block 2: Understand spending */}
          <div className="relative group bg-[#0c1322] border border-slate-800 rounded-2xl p-7 hover:border-teal-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-teal-950/20">
            <div className="w-12 h-12 rounded-xl bg-teal-950/60 border border-teal-800/60 flex items-center justify-center text-teal-400 mb-5 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('landing.card2Title')}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('landing.card2Desc')}
            </p>
          </div>

          {/* Block 3: Protect money */}
          <div className="relative group bg-[#0c1322] border border-slate-800 rounded-2xl p-7 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/20">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('landing.card3Title')}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('landing.card3Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#090e1a] px-6 lg:px-12 py-8 text-center text-xs text-slate-500 font-mono">
        <p>
          {t('common.copyright')}
        </p>
        <p className="mt-1 text-slate-600">
          {t('common.liveWindowBadge')}
        </p>
      </footer>
    </div>
  );
};
