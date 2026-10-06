import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Bot,
  ShieldAlert,
  Lock,
  FileSpreadsheet,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import type { AppView, UserProfile } from '../types';
import { useI18n } from '../i18n';
import { LanguageSelector } from '../components/LanguageSelector';

interface AppLayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  user: UserProfile;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  onNavigate,
  user,
  onLogout,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useI18n();

  const navItems: { view: AppView; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      view: 'dashboard',
      label: t('nav.dashboard'),
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      view: 'transactions',
      label: t('nav.transactions'),
      icon: <Receipt className="w-5 h-5" />,
    },
    {
      view: 'budgets',
      label: t('nav.budgets'),
      icon: <PieChart className="w-5 h-5" />,
    },
    {
      view: 'scamshield',
      label: t('nav.scamshield'),
      icon: <ShieldAlert className="w-5 h-5 text-cyan-400" />,
      badge: t('nav.protectedBadge'),
    },
    {
      view: 'ai-assistant',
      label: t('nav.aiAssistant'),
      icon: <Bot className="w-5 h-5 text-teal-400" />,
      badge: t('nav.betaBadge'),
    },
    {
      view: 'security',
      label: t('nav.securityCenter'),
      icon: <Lock className="w-5 h-5" />,
    },
    {
      view: 'reports',
      label: t('nav.reports'),
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    {
      view: 'profile',
      label: t('nav.profile'),
      icon: <User className="w-5 h-5" />,
    },
  ];

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const getPageTitle = (view: AppView) => {
    switch (view) {
      case 'dashboard': return t('nav.dashboard');
      case 'transactions': return t('nav.transactions');
      case 'budgets': return t('nav.budgets');
      case 'scamshield': return t('nav.scamshield');
      case 'ai-assistant': return t('nav.aiAssistant');
      case 'security': return t('nav.securityCenter');
      case 'reports': return t('nav.reports');
      case 'profile': return t('nav.profile');
      default: return view;
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0a101d] border-b border-slate-800/80 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center font-bold text-black shadow-lg shadow-cyan-500/20">
            FS
          </div>
          <span className="font-bold tracking-tight text-lg text-white">
            Fin<span className="text-cyan-400">Shield</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector variant="compact" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#090e1a] border-r border-slate-800/80 flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-cyan-300 flex items-center justify-center font-black text-slate-950 shadow-md shadow-cyan-500/20">
              FS
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight text-white flex items-center gap-1">
                Fin<span className="text-cyan-400">Shield</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
                {t('common.subtitle')}
              </p>
            </div>
          </div>
          {mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 text-slate-400"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Security Status Banner */}
        <div className="mx-4 my-3 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="text-xs">
            <span className="font-medium text-cyan-300">{t('nav.scamShieldActive')}</span>
            <p className="text-[10px] text-slate-400">{t('nav.zeroFraudReported')}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/70 to-teal-950/50 text-cyan-300 border border-cyan-700/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#070b14]/50">
          <div className="flex items-center justify-between">
            <div
              onClick={() => handleNavClick('profile')}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {user.role}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title={t('nav.logout')}
              aria-label={t('nav.logout')}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with language selector and quick navigation */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-800/60 bg-[#090e1a]/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-slate-200">
              {getPageTitle(currentView)}
            </h1>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">
              {t('common.buildSecureTrack')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />
            <div className="h-4 w-[1px] bg-slate-800"></div>
            <button
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50 rounded-lg border border-slate-800 transition-colors"
            >
              {t('nav.landingPage')} <ExternalLink className="w-3 h-3" />
            </button>
            <div className="h-4 w-[1px] bg-slate-800"></div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              {t('common.mainnetGuardActive')}
            </div>
          </div>
        </header>

        {/* Dynamic Page View */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
