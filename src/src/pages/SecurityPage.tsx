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
import { PLANNED_SECURITY_CONTROLS } from '../data/demoData';
import { Badge } from '../components/Badge';

export const SecurityPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { key: 'ALL', label: 'All 6 Posture Areas', icon: <ShieldCheck className="w-4 h-4" /> },
    { key: 'AUTHENTICATION', label: '1. Authentication', icon: <KeyRound className="w-4 h-4" /> },
    { key: 'AUTHORIZATION', label: '2. Authorization / RBAC', icon: <Lock className="w-4 h-4" /> },
    { key: 'INPUT_VALIDATION', label: '3. Input Validation', icon: <FileCheck2 className="w-4 h-4" /> },
    { key: 'API_SECURITY', label: '4. API Security', icon: <Server className="w-4 h-4" /> },
    { key: 'DATA_PROTECTION', label: '5. Data Protection', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { key: 'SECURITY_TESTING', label: '6. Security Testing', icon: <TestTube2 className="w-4 h-4" /> },
  ];

  const filtered = PLANNED_SECURITY_CONTROLS.filter(
    (c) => selectedCategory === 'ALL' || c.category === selectedCategory
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Security Header Banner */}
      <div className="bg-gradient-to-r from-[#0c1626] via-[#091522] to-[#070e1c] border border-cyan-800/40 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="cyan">Build Secure 24 Security Architecture</Badge>
              <Badge variant="teal">STRIDE & OWASP Aligned</Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              FinShield Security Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Transparent posture of defense-in-depth security controls across the 6 Build Secure core requirements.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/60 text-xs font-mono">
            <span className="text-cyan-300 font-bold">11 Planned Security Controls</span>
            <p className="text-slate-400 text-[10px] mt-0.5">
              Targeted across 24-hour hackathon milestones
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
                : 'bg-[#0c1322] border border-slate-800 text-slate-400 hover:text-slate-200'
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
            className="bg-[#0c1322] border border-slate-800 rounded-3xl p-5 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  {ctrl.category}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                  Status: {ctrl.status}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1.5">{ctrl.name}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {ctrl.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Target: {ctrl.targetMechanism}</span>
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
            Detailed Threat Model, STRIDE matrix & Architecture Decision Records recorded in docs/APPROACH.md
          </span>
        </div>
        <span className="font-mono text-cyan-400 flex items-center gap-1">
          Team 50 Reference <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
