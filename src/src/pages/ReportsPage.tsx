import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Shield,
  FileText,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import type { Transaction } from '../types';
import { Badge } from '../components/Badge';

interface ReportsPageProps {
  transactions: Transaction[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ transactions }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleSimulateExport = (type: string) => {
    setDownloadSuccess(type);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0c1626] via-[#091522] to-[#070e1c] border border-cyan-800/40 rounded-3xl p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="cyan">PS-01 Personal Data Export</Badge>
            <Badge variant="teal">CSV Injection Defense (ADR-007)</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financial Reports & Export Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Generate and export personal ledger summaries and security posture audits. In Phase 4, downloads will include single-quote prefix sanitization to defeat formula injection.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {downloadSuccess && (
        <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-800/60 flex items-center justify-between text-xs text-teal-300 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
            <span>
              Simulated export prepared for: <strong>{downloadSuccess}</strong> (Real streaming CSV generator connects in Phase 4).
            </span>
          </div>
          <span className="font-mono text-[10px] text-teal-400">Zero Formula Injection</span>
        </div>
      )}

      {/* 3 Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Export financial data */}
        <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              1. Personal Financial CSV
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Export all income and expense records formatted for spreadsheet software. Includes dates, categories, payees, and amounts.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Total Rows: {transactions.length} records</div>
              <div>Format: UTF-8 CSV</div>
              <div>Protection: DDE Prefix Sanitized</div>
            </div>
          </div>

          <button
            onClick={() => handleSimulateExport('Personal Financial CSV')}
            className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV Data
          </button>
        </div>

        {/* Card 2: Security Audit Report */}
        <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-teal-500/40 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-950/60 border border-teal-800/60 flex items-center justify-center text-teal-400 mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              2. Security & Scam Audit
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Comprehensive breakdown of ScamShield scans, flagged UPI transactions, and tenant security verification logs.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Flagged Scams: 1 Incident</div>
              <div>Heuristic Engine: Operational</div>
              <div>Audit Integrity: Tamper-Evident</div>
            </div>
          </div>

          <button
            onClick={() => handleSimulateExport('Security & Scam Audit Report')}
            className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 border border-teal-800/80 hover:border-teal-400 text-teal-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" /> Download Security Audit
          </button>
        </div>

        {/* Card 3: Monthly Transaction Summary */}
        <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              3. Monthly Financial Summary
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Aggregated monthly spending digest containing category breakdown, savings retention percentage, and budget performance.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Month: October 2026</div>
              <div>Income Tracked: ₹52,000.00</div>
              <div>Expense Tracked: ₹12,888.00</div>
            </div>
          </div>

          <button
            onClick={() => handleSimulateExport('Monthly Financial Summary')}
            className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" /> Generate Digest
          </button>
        </div>
      </div>

      {/* CSV Security Explainer */}
      <div className="p-5 rounded-2xl bg-[#0c1322] border border-slate-800 text-xs text-slate-400 space-y-2">
        <h4 className="font-bold text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" /> Secure File Handling Specification (ADR-007)
        </h4>
        <p className="leading-relaxed">
          Spreadsheet applications (Microsoft Excel, LibreOffice, Google Sheets) automatically execute dynamic formulas when cell values begin with <code>=</code>, <code>+</code>, <code>-</code>, or <code>@</code>. FinShield's backend export pipeline enforces automatic single-quote prefix escaping to completely eliminate Dynamic Data Exchange (DDE) command injection exploits.
        </p>
      </div>
    </div>
  );
};
