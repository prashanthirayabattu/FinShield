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
import { useI18n } from '../i18n';

export const ScamShieldPage: React.FC = () => {
  const { t, formatCurrency, formatDate } = useI18n();
  const [activeTab, setActiveTab] = useState<'MESSAGE' | 'URL' | 'UPI'>('MESSAGE');
  const [inputValue, setInputValue] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScamAnalysisResponse | null>(null);

  const samplePresets = [
    {
      label: t('scamshield.presetKyc'),
      tab: 'MESSAGE' as const,
      text: 'Dear customer, your SBI bank account and KYC will be blocked within 24 hours immediately. Update PAN card now at http://sbi-kyc-verify-portal.xyz',
    },
    {
      label: t('scamshield.presetElectricity'),
      tab: 'MESSAGE' as const,
      text: 'Dear consumer, your electricity power bill was unpaid. Power will be disconnected tonight at 9:30 PM. Call power officer immediately.',
    },
    {
      label: t('scamshield.presetLottery'),
      tab: 'MESSAGE' as const,
      text: 'Congratulations! You won ₹25,00,000 in Kaun Banega Crorepati lucky draw lottery. Send processing fee immediately to claim prize.',
    },
    {
      label: t('scamshield.presetJob'),
      tab: 'MESSAGE' as const,
      text: 'Earn ₹5000 daily from home by liking YouTube videos. Deposit refundable security fee of ₹1500 to activate VIP task.',
    },
  ];

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError(t('errors.invalidInput'));
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

  const getLocalizedRiskBadge = (level: string) => {
    if (level === 'HIGH') return t('scamshield.riskHigh');
    if (level === 'MEDIUM') return t('scamshield.riskMedium');
    return t('scamshield.riskLow');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0c1626] via-[#091522] to-[#070e1c] border border-cyan-800/40 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="cyan">{t('nav.protectedBadge')}</Badge>
              <Badge variant="teal">{t('common.brand')}</Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('scamshield.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {t('scamshield.subtitle')}
            </p>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-cyan-400 shrink-0" />
            <div className="text-xs font-mono">
              <span className="text-cyan-300 font-bold">{t('scamshield.transactionLinkingTitle')}</span>
              <p className="text-slate-400 text-[10px]">
                {t('scamshield.heuristicNotice')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-xs font-semibold shrink-0">
          {t('scamshield.quickPresetsTitle')}
        </span>
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
              1. {t('common.description')}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              SMS, WhatsApp & Chat
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
              2. URL Link
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              SSRF-safe Web Links
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
              3. UPI VPA
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              UPI VPAs & Handles
            </p>
          </div>
        </button>
      </div>

      {/* Input Shell */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6">
        <form onSubmit={handleInspect} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {t('scamshield.inputLabel')}
            </label>
            <span className="text-[11px] font-mono text-cyan-400">
              {t('common.mainnetGuardActive')}
            </span>
          </div>

          {activeTab === 'MESSAGE' ? (
            <textarea
              rows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('scamshield.inputPlaceholder')}
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
              <span>{t('common.liveNeonPostgres')}</span>
            </p>

            <button
              type="submit"
              disabled={isInspecting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isInspecting ? t('scamshield.analyzing') : t('scamshield.analyzeBtn')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Risk Analysis Result */}
      {scanResult ? (
        <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  ID: {scanResult.analysisId.slice(0, 8)}...
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-cyan-300">
                  {scanResult.category}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {t('scamshield.title')}
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
                {getLocalizedRiskBadge(scanResult.riskLevel)} ({t('scamshield.riskScoreLabel', { score: scanResult.riskScore })})
              </span>
            </div>
          </div>

          {/* Extracted Artifacts Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                UPI ID
              </span>
              <p className="text-xs font-mono font-semibold text-cyan-300 truncate">
                {scanResult.extractedUpiId || '-'}
              </p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                {t('common.amount')}
              </span>
              <p className="text-xs font-mono font-semibold text-teal-300">
                {scanResult.extractedAmount !== null
                  ? formatCurrency(scanResult.extractedAmount)
                  : '-'}
              </p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                URL Links
              </span>
              <p className="text-xs font-mono font-semibold text-cyan-300 truncate">
                {scanResult.extractedUrls.length > 0
                  ? scanResult.extractedUrls.join(', ')
                  : '-'}
              </p>
            </div>
          </div>

          {/* Explainable Reasons */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              {t('scamshield.indicatorsTitle')}
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
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> {t('scamshield.recommendationTitle')}
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
                <Receipt className="w-4 h-4 text-cyan-400" /> {t('scamshield.transactionLinkingTitle')}:
              </span>
              <span
                className={`font-semibold ${
                  scanResult.matchedTransactions.length > 0
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {scanResult.matchedTransactions.length > 0
                  ? `⚠️ ${scanResult.matchedTransactions.length} ${t('common.warning')}`
                  : t('scamshield.noMatchedTransaction')}
              </span>
            </div>

            {scanResult.matchedTransactions.length > 0 && (
              <div className="bg-slate-900/80 border border-amber-800/50 rounded-2xl p-4 space-y-2">
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
                          <span>{formatDate(tx.transactionDate)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold ${
                            tx.type === 'EXPENSE' ? 'text-rose-400' : 'text-teal-400'
                          }`}
                        >
                          {tx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 text-xs bg-[#0c1322] border border-slate-800 rounded-3xl">
          {t('scamshield.emptyStateTitle')}
        </div>
      )}
    </div>
  );
};
