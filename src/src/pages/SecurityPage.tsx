import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck2,
  Server,
  FileSpreadsheet,
  TestTube2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { useI18n } from '../i18n';

export const SecurityPage: React.FC = () => {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { key: 'ALL', label: t('common.all'), icon: <ShieldCheck className="w-4 h-4" /> },
    { key: 'AUTH', label: t('security.pillar1Title'), icon: <KeyRound className="w-4 h-4" /> },
    { key: 'RBAC', label: t('security.pillar2Title'), icon: <Lock className="w-4 h-4" /> },
    { key: 'IDOR', label: t('security.pillar3Title'), icon: <FileCheck2 className="w-4 h-4" /> },
    { key: 'VALIDATION', label: t('security.pillar4Title'), icon: <Server className="w-4 h-4" /> },
    { key: 'DATA', label: t('security.pillar5Title'), icon: <FileSpreadsheet className="w-4 h-4" /> },
    { key: 'TESTING', label: t('security.pillar6Title'), icon: <TestTube2 className="w-4 h-4" /> },
  ];

  const securityPillars = [
    {
      id: 'sec_1',
      category: 'AUTH',
      title: t('security.pillar1Title'),
      desc: t('security.pillar1Desc'),
      mechanism: 'Bcrypt + HttpOnly Cookie',
    },
    {
      id: 'sec_2',
      category: 'RBAC',
      title: t('security.pillar2Title'),
      desc: t('security.pillar2Desc'),
      mechanism: 'JWT Claims + Role Guard',
    },
    {
      id: 'sec_3',
      category: 'IDOR',
      title: t('security.pillar3Title'),
      desc: t('security.pillar3Desc'),
      mechanism: 'req.user.id Scoped WHERE',
    },
    {
      id: 'sec_4',
      category: 'VALIDATION',
      title: t('security.pillar4Title'),
      desc: t('security.pillar4Desc'),
      mechanism: 'Zod .strict() Schema',
    },
    {
      id: 'sec_5',
      category: 'DATA',
      title: t('security.pillar5Title'),
      desc: t('security.pillar5Desc'),
      mechanism: 'Prisma Parameterized SQL',
    },
    {
      id: 'sec_6',
      category: 'DATA',
      title: t('security.pillar6Title'),
      desc: t('security.pillar6Desc'),
      mechanism: 'DDE Prefix Escaping',
    },
    {
      id: 'sec_7',
      category: 'TESTING',
      title: t('security.pillar7Title'),
      desc: t('security.pillar7Desc'),
      mechanism: 'In-Memory Lexical Lexer',
    },
    {
      id: 'sec_8',
      category: 'TESTING',
      title: t('security.pillar8Title'),
      desc: t('security.pillar8Desc'),
      mechanism: 'Pre-LLM Safety Filter',
    },
  ];

  const filtered = securityPillars.filter(
    (c) => selectedCategory === 'ALL' || c.category === selectedCategory
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Security Header Banner */}
      <div className="bg-[#090f1d]/75 backdrop-blur-md border border-cyan-800/50 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="cyan">{t('dashboard.trackBadge')}</Badge>
              <Badge variant="teal">{t('common.mainnetGuardActive')}</Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('security.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {t('security.subtitle')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/80 text-xs font-mono space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span className="text-teal-300 font-bold">{t('security.auditScore')}</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              {t('security.testSummary')}
            </p>
            <p className="text-slate-400 text-[10px]">
              {t('common.liveNeonPostgres')}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedCategory === cat.key
                ? 'bg-gradient-to-r from-cyan-950 to-teal-950 text-cyan-300 border border-cyan-700/60 shadow'
                : 'bg-[#090f1d]/75 backdrop-blur-md border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:-translate-y-0.5'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((ctrl) => (
          <div
            key={ctrl.id}
            className="bg-[#090f1d]/75 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 hover:border-cyan-500/50 hover:-translate-y-1 hover:shadow-cyan-500/10 transition-all duration-200 flex flex-col justify-between shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  {ctrl.category}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-teal-300">
                  {t('common.safeTitle')}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1.5">{ctrl.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {ctrl.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Mechanism: {ctrl.mechanism}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>
        ))}
      </div>

      {/* APPROACH.md Reference Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>
            {t('common.copyright')}
          </span>
        </div>
        <span className="font-mono text-cyan-400 flex items-center gap-1">
          docs/APPROACH.md <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
