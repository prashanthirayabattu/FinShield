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
  AlertCircle,
  Receipt,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { scamApi, type ScamAnalysisResponse } from '../services/scamApi';

export const ScamShieldPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MESSAGE' | 'URL' | 'UPI'>('MESSAGE');
  const [inputValue, setInputValue] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScamAnalysisResponse | null>(null);

  const samplePresets = [
    {
      label: 'KYC Suspension Scam',
      tab: 'MESSAGE' as const,
      text: 'Dear customer, your SBI bank account and KYC will be blocked within 24 hours immediately. Update PAN card now at http://sbi-kyc-verify-portal.xyz',
    },
    {
      label: 'OTP Phishing Lure',
      tab: 'MESSAGE' as const,
      text: 'Please share your 6-digit OTP and UPI PIN immediately to verify your transaction refund.',
    },
    {
      label: 'Utility Disconnection Threat',
      tab: 'MESSAGE' as const,
      text: 'Dear consumer, your electricity power bill was unpaid. Power will be disconnected tonight at 9:30 PM. Call power officer immediately.',
    },
    {
      label: 'Phishing URL Check',
      tab: 'URL' as const,
      text: 'http://sbi-kyc-verify-portal.xyz/login',
    },
    {
      label: 'Fraudulent Support UPI',
      tab: 'UPI' as const,
      text: 'refund.support@oksbi',
    },
    {
      label: 'Routine Split Bill (Safe)',
      tab: 'MESSAGE' as const,
      text: 'Hey Rohit, please send the restaurant dinner bill split of ₹500 when you get home.',
    },
  ];

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError('Please enter a message, URL, or UPI ID to inspect.');
      return;
    }

    setError(null);
    setIsInspecting(true);

    try {
      let payload: { text?: string; url?: string; upiId?: string } = {};
      if (activeTab === 'MESSAGE') {
        payload = { text: inputValue.trim() };
      } else if (activeTab === 'URL') {
        payload = { url: inputValue.trim() };
      } else {
        payload = { upiId: inputValue.trim() };
      }

      const result = await scamApi.analyze(payload);
      setScanResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleSelectPreset = (preset: (typeof samplePresets)[0]) => {
    setActiveTab(preset.tab);
    setInputValue(preset.text);
    setError(null);
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
                Matches scam queries to personal ledger transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-xs font-semibold shrink-0">Quick Presets:</span>
        {samplePresets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectPreset(preset)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 shrink-0 text-xs transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Tabs for Message, URL, UPI Check */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => {
            setActiveTab('MESSAGE');
            setInputValue('');
            setError(null);
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
            setError(null);
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
              SSRF-safe lexical inspection of links
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('UPI');
            setInputValue('');
            setError(null);
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
        <form onSubmit={handleInspect} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {activeTab === 'MESSAGE'
                ? 'Paste SMS, Email or Chat Text'
                : activeTab === 'URL'
                ? 'Enter Suspicious Website Link'
                : 'Enter Virtual Payment Address (e.g. handle@bank)'}
            </label>
            <span className="text-[11px] font-mono text-cyan-400">
              Zod Validated & SSRF Guarded
            </span>
          </div>

          {activeTab === 'MESSAGE' ? (
            <textarea
              rows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. URGENT: Your bank account will be deactivated today due to incomplete KYC. Update at http://..."
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
                  : 'refund-desk-support@oksbi'
              }
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real heuristic rule engine running live on Neon PostgreSQL.</span>
            </p>

            <button
              type="submit"
              disabled={isInspecting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isInspecting ? 'Running Inspection...' : 'Inspect with ScamShield'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Risk Analysis Result */}
      {scanResult && (
        <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Audit ID: {scanResult.analysisId.slice(0, 8)}...
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-cyan-300">
                  {scanResult.category}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Explainable Risk Assessment Report
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />{' '}
                {new Date(scanResult.analyzedAt).toLocaleTimeString()}
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

          {/* Extracted Artifacts Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                Extracted UPI ID
              </span>
              <p className="text-xs font-mono font-semibold text-cyan-300 truncate">
                {scanResult.extractedUpiId || 'None detected'}
              </p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                Extracted Amount
              </span>
              <p className="text-xs font-mono font-semibold text-teal-300">
                {scanResult.extractedAmount !== null
                  ? `₹${scanResult.extractedAmount.toLocaleString()}`
                  : 'None detected'}
              </p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                Extracted URLs
              </span>
              <p className="text-xs font-mono font-semibold text-cyan-300 truncate">
                {scanResult.extractedUrls.length > 0
                  ? scanResult.extractedUrls.join(', ')
                  : 'None detected'}
              </p>
            </div>
          </div>

          {/* Explainable Reasons */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Explainable Risk Indicators:
            </h4>
            <div className="space-y-2">
              {scanResult.reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-200"
                >
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      scanResult.riskLevel === 'HIGH'
                        ? 'text-rose-400'
                        : scanResult.riskLevel === 'MEDIUM'
                        ? 'text-amber-400'
                        : 'text-teal-400'
                    }`}
                  />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Action */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40">
            <h4 className="text-xs font-bold text-cyan-300 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> Protective Recommendations:
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {scanResult.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Scam-to-Ledger Link Indicator */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-cyan-400" /> Personal Ledger Cross-Check:
              </span>
              <span
                className={`font-semibold ${
                  scanResult.matchedTransactions.length > 0
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {scanResult.matchedTransactions.length > 0
                  ? `⚠️ ${scanResult.matchedTransactions.length} MATCHING TRANSACTION(S) FOUND`
                  : 'No matching transactions in your ledger'}
              </span>
            </div>

            {scanResult.matchedTransactions.length > 0 && (
              <div className="bg-slate-900/80 border border-amber-800/50 rounded-2xl p-4 space-y-2">
                <p className="text-xs text-amber-300 font-medium">
                  We found transactions in your personal financial records matching the analyzed entity or amount:
                </p>
                <div className="space-y-2 mt-2">
                  {scanResult.matchedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">
                          {tx.payee || tx.description || 'Unknown Payee'}
                        </span>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{tx.category}</span>
                          <span>•</span>
                          <span>{new Date(tx.transactionDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold ${
                            tx.type === 'EXPENSE' ? 'text-rose-400' : 'text-teal-400'
                          }`}
                        >
                          {tx.type === 'EXPENSE' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
