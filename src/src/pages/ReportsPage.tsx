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
import { useI18n } from '../i18n';

interface ReportsPageProps {
  transactions: Transaction[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ transactions }) => {
  const { t } = useI18n();
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleDownloadCsv = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const res = await fetch('/api/transactions/export', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(t('errors.authRequired'));
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `finshield_transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(link);
      setDownloadSuccess('CSV');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('common.error');
      setExportError(msg);
      setTimeout(() => setExportError(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSimulateExport = (name: string) => {
    setDownloadSuccess(name);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-[#090f1d]/75 backdrop-blur-md border border-cyan-800/50 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="cyan">{t('dashboard.trackBadge')}</Badge>
            <Badge variant="teal">CWE-1236</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('reports.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t('reports.subtitle')}
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {downloadSuccess && (
        <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-800/60 flex items-center justify-between text-xs text-teal-300 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
            <span>
              {t('common.success')}: <strong>{downloadSuccess}</strong>
            </span>
          </div>
          <span className="font-mono text-[10px] text-teal-400">{t('dashboard.formulaSanitized')}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {exportError && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-between text-xs text-red-300 animate-fade-in">
          <span>{exportError}</span>
        </div>
      )}

      {/* 3 Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Export financial data */}
        <div className="bg-[#090f1d]/75 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-cyan-500/50 hover:-translate-y-1 hover:shadow-cyan-500/10 transition-all duration-200 shadow-xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              1. {t('reports.exportBtn')}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {t('reports.subtitle')}
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>{t('common.actions')}: {transactions.length} {t('common.all')}</div>
              <div>Format: UTF-8 CSV</div>
              <div>Protection: CWE-1236</div>
            </div>
          </div>

          <button
            onClick={handleDownloadCsv}
            disabled={isExporting}
            className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {isExporting ? t('reports.exporting') : t('reports.exportBtn')}
          </button>
        </div>

        {/* Card 2: Security Audit Report */}
        <div className="bg-[#090f1d]/75 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-teal-500/50 hover:-translate-y-1 hover:shadow-teal-500/10 transition-all duration-200 shadow-xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-950/60 border border-teal-800/60 flex items-center justify-center text-teal-400 mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              2. {t('security.auditScore')}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {t('security.testSummary')}
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>{t('nav.scamShieldActive')}</div>
              <div>{t('common.mainnetGuardActive')}</div>
              <div>{t('common.liveNeonPostgres')}</div>
            </div>
          </div>

          <button
            onClick={() => handleSimulateExport(t('security.auditScore'))}
            className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 border border-teal-800/80 hover:border-teal-400 text-teal-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" /> {t('security.auditScore')}
          </button>
        </div>

        {/* Card 3: Monthly Transaction Summary */}
        <div className="bg-[#090f1d]/75 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-cyan-500/50 hover:-translate-y-1 hover:shadow-cyan-500/10 transition-all duration-200 shadow-xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              3. {t('reports.summaryTitle')}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {t('dashboard.subtitle')}
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>{t('budgets.monthLabel', { month: '2026-10' })}</div>
              <div>{t('dashboard.totalIncome')}</div>
              <div>{t('dashboard.totalExpenses')}</div>
            </div>
          </div>

          <button
            onClick={() => handleSimulateExport(t('reports.summaryTitle'))}
            className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" /> {t('reports.summaryTitle')}
          </button>
        </div>
      </div>

      {/* CSV Security Explainer */}
      <div className="p-5 rounded-2xl bg-[#090f1d]/75 backdrop-blur-md border border-slate-800/80 text-xs text-slate-400 space-y-2 shadow-xl">
        <h4 className="font-bold text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" /> {t('reports.formulaDefenseTitle')}
        </h4>
        <p className="leading-relaxed">
          {t('reports.formulaDefenseDesc')}
        </p>
      </div>
    </div>
  );
};
