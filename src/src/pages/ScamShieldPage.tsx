import React, { useState } from 'react';
import {
  MessageSquare,
  Globe,
  QrCode,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { INITIAL_SCAM_DEMOS } from '../data/demoData';
import { Badge } from '../components/Badge';

export const ScamShieldPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MESSAGE' | 'URL' | 'UPI'>('MESSAGE');
  const [inputValue, setInputValue] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [scanResult, setScanResult] = useState<(typeof INITIAL_SCAM_DEMOS)[0] | null>(
    INITIAL_SCAM_DEMOS[0]
  );

  const handleSimulateInspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsInspecting(true);
    setTimeout(() => {
      setIsInspecting(false);
      // Display matching or realistic placeholder demonstration
      if (activeTab === 'UPI') {
        setScanResult(INITIAL_SCAM_DEMOS[1]);
      } else if (activeTab === 'URL') {
        setScanResult(INITIAL_SCAM_DEMOS[2]);
      } else {
        setScanResult(INITIAL_SCAM_DEMOS[0]);
      }
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0c1626] via-[#091522] to-[#070e1c] border border-cyan-800/40 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="cyan">Integrated Fraud Protection Layer</Badge>
              <Badge variant="teal">FinShield Exclusive</Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ScamShield Fraud Inspection Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time heuristic evaluation of suspicious payment requests, phishing URLs, and fraudulent UPI addresses before you authorize ledger transfers.
            </p>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-cyan-400 shrink-0" />
            <div className="text-xs font-mono">
              <span className="text-cyan-300 font-bold">Ledger Cross-Check</span>
              <p className="text-slate-400 text-[10px]">
                Matches scam queries to pending transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Message, URL, UPI Check */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => {
            setActiveTab('MESSAGE');
            setInputValue('');
          }}
          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
            activeTab === 'MESSAGE'
              ? 'bg-[#0d172a] border-cyan-500/70 shadow-lg shadow-cyan-950/25'
              : 'bg-[#0c1322] border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              activeTab === 'MESSAGE'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                : 'bg-slate-900 text-slate-500'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4
              className={`text-sm font-bold ${
                activeTab === 'MESSAGE' ? 'text-white' : 'text-slate-300'
              }`}
            >
              1. Suspicious Message Check
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Inspect SMS, WhatsApp & lottery lures
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('URL');
            setInputValue('');
          }}
          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
            activeTab === 'URL'
              ? 'bg-[#0d172a] border-cyan-500/70 shadow-lg shadow-cyan-950/25'
              : 'bg-[#0c1322] border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              activeTab === 'URL'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                : 'bg-slate-900 text-slate-500'
            }`}
          >
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h4
              className={`text-sm font-bold ${
                activeTab === 'URL' ? 'text-white' : 'text-slate-300'
              }`}
            >
              2. Phishing URL Check
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Detect deceptive TLDs & lookalike links
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('UPI');
            setInputValue('');
          }}
          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
            activeTab === 'UPI'
              ? 'bg-[#0d172a] border-cyan-500/70 shadow-lg shadow-cyan-950/25'
              : 'bg-[#0c1322] border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              activeTab === 'UPI'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                : 'bg-slate-900 text-slate-500'
            }`}
          >
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4
              className={`text-sm font-bold ${
                activeTab === 'UPI' ? 'text-white' : 'text-slate-300'
              }`}
            >
              3. UPI ID / VPA Check
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Detect fake support & deceptive handles
            </p>
          </div>
        </button>
      </div>

      {/* Input Shell */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6">
        <form onSubmit={handleSimulateInspect} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {activeTab === 'MESSAGE'
                ? 'Paste SMS, Email or Chat Text'
                : activeTab === 'URL'
                ? 'Enter Suspicious Website Link'
                : 'Enter Virtual Payment Address (e.g. handle@bank)'}
            </label>
            <span className="text-[11px] font-mono text-cyan-400">
              Input Validation: Zod Protected
            </span>
          </div>

          {activeTab === 'MESSAGE' ? (
            <textarea
              rows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. URGENT: Your bank account will be deactivated today due to incomplete KYC..."
              className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          ) : (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                activeTab === 'URL'
                  ? 'https://example-scam-domain.xyz/verify'
                  : 'refund-desk-support@ybl'
              }
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full ReDoS-safe rule analyzer will connect in Phase 3.</span>
            </p>

            <button
              type="submit"
              disabled={isInspecting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all"
            >
              {isInspecting ? 'Running Inspection...' : 'Inspect with ScamShield'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Risk Analysis Result Placeholder */}
      {scanResult && (
        <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Evaluation Output • Demo Sample
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Explainable Risk Assessment Report
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {scanResult.analyzedAt}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border font-mono ${
                  scanResult.riskLevel === 'HIGH'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                    : scanResult.riskLevel === 'MEDIUM'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                    : 'bg-teal-950/80 text-teal-300 border-teal-800'
                }`}
              >
                {scanResult.riskLevel} RISK ({scanResult.riskScore}/100)
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">
              Target Analyzed:
            </span>
            <code className="text-xs text-cyan-300 font-mono break-all">
              {scanResult.inputTarget}
            </code>
          </div>

          {/* Explainable Reasons */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Explainable Risk Indicators:
            </h4>
            <div className="space-y-2">
              {scanResult.explainableReasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-200"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Action */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40">
            <h4 className="text-xs font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> Protective Recommendation:
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {scanResult.recommendedAction}
            </p>
          </div>

          {/* Scam-to-Ledger Link Indicator */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 font-mono">
            <span>Ledger Integration: Ready</span>
            <span className="text-cyan-400">
              Matches will display warning badges in your Transaction Ledger
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
