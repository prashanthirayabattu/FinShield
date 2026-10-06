import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  RefreshCw,
  AlertOctagon,
} from 'lucide-react';
import type { Transaction, Budget, AppView, TransactionCategory } from '../types';
import type { DashboardSummaryResponse } from '../services/dashboardApi';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { useI18n } from '../i18n';

interface DashboardPageProps {
  transactions: Transaction[];
  budgets: Budget[];
  summary?: DashboardSummaryResponse | null;
  isLoading?: boolean;
  onNavigate: (view: AppView) => void;
  onRefresh?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  transactions,
  budgets: localBudgets,
  summary,
  isLoading = false,
  onNavigate,
  onRefresh,
}) => {
  const { t, formatCurrency, formatDate } = useI18n();

  // Use live PostgreSQL summary data if available, otherwise compute from local state
  const totalIncome = summary ? summary.totalIncome : transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = summary ? summary.totalExpenses : transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalBalance = summary ? summary.currentBalance : totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalBalance / totalIncome) * 100).toFixed(1) : '0';

  // Category breakdown
  const categoryBreakdownList = summary
    ? summary.categoryBreakdown
    : Object.entries(
        transactions
          .filter((t) => t.type === 'EXPENSE')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>)
      ).map(([category, total]) => ({
        category: category as TransactionCategory,
        total,
        percentage: totalExpenses > 0 ? Number(((total / totalExpenses) * 100).toFixed(1)) : 0,
        count: transactions.filter((t) => t.category === category && t.type === 'EXPENSE').length,
      }));

  // Budget summaries & alerts
  const budgetAlerts = summary?.budgetAlerts ?? [];
  const activeBudgets = summary
    ? summary.budgets.map((b) => ({
        id: b.id,
        category: b.category,
        limit: b.limitAmount,
        spent: b.spentAmount,
        month: b.month,
        status: b.status,
      }))
    : localBudgets.map((b) => ({
        ...b,
        status: b.spent >= b.limit ? 'EXCEEDED' : b.spent >= b.limit * 0.8 ? 'WARNING' : 'SAFE',
      }));

  const totalBudgetLimit = activeBudgets.reduce((acc, b) => acc + b.limit, 0);
  const totalBudgetSpent = activeBudgets.reduce((acc, b) => acc + b.spent, 0);
  const totalBudgetPercent = totalBudgetLimit > 0
    ? Math.min(Math.round((totalBudgetSpent / totalBudgetLimit) * 100), 100)
    : 0;

  // Recent transactions list
  const recentList = summary
    ? summary.recentTransactions.map((tx) => ({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        payee: tx.payee,
        category: tx.category,
        type: tx.type,
        amount: tx.amount,
        isFlaggedSuspicious: false,
      }))
    : transactions.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#0c1424] via-[#0e182c] to-[#0a1220] border border-cyan-900/40 rounded-3xl p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="cyan">{t('dashboard.trackBadge')}</Badge>
            <Badge variant="teal">{t('common.liveNeonPostgres')}</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('dashboard.title')}
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              title={t('common.refresh')}
              aria-label={t('common.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}
          <button
            onClick={() => onNavigate('transactions')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
          >
            {t('dashboard.addTransaction')}
          </button>
          <button
            onClick={() => onNavigate('scamshield')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-800/60 hover:border-cyan-400 text-cyan-300 font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> {t('dashboard.scanScam')}
          </button>
        </div>
      </div>

      {/* Budget Alerts Banner */}
      {budgetAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-900/60 text-amber-400 border border-amber-700/60">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                {t('dashboard.budgetAlertTitle', { count: budgetAlerts.length })}
              </h4>
              <p className="text-xs text-amber-300/80">
                {budgetAlerts.map((a) => `${a.category} (${a.status}: ${a.percentageUsed}%)`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('budgets')}
            className="text-xs font-semibold text-amber-300 hover:text-white underline font-mono"
          >
            {t('dashboard.viewBudgets')}
          </button>
        </div>
      )}

      {/* 4 Core Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={t('dashboard.currentBalance')}
          value={formatCurrency(totalBalance)}
          subtitle={t('dashboard.activeLedger')}
          accent="cyan"
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          title={t('dashboard.totalIncome')}
          value={formatCurrency(totalIncome)}
          subtitle={t('dashboard.cashFlow')}
          accent="teal"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title={t('dashboard.totalExpenses')}
          value={formatCurrency(totalExpenses)}
          subtitle={t('dashboard.spentThisMonth')}
          accent="purple"
          icon={<TrendingDown className="w-5 h-5" />}
        />
        <StatCard
          title={t('dashboard.savingsRate')}
          value={`${savingsRate}%`}
          subtitle={t('dashboard.ofIncomeSaved', { rate: savingsRate })}
          accent="teal"
          icon={<PiggyBank className="w-5 h-5" />}
        />
      </div>

      {/* Two Column Layout: Budget Progress & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Progress Card */}
        <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {t('dashboard.budgetUtilization')}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('dashboard.totalBudgetCap', {
                  limit: formatCurrency(totalBudgetLimit),
                  spent: formatCurrency(totalBudgetSpent),
                })}
              </p>
            </div>
            <button
              onClick={() => onNavigate('budgets')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              {t('dashboard.viewBudgets')} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
              <span>{t('budgets.overallUtilization')}</span>
              <span className="font-mono text-cyan-300">
                {formatCurrency(totalBudgetSpent)} / {formatCurrency(totalBudgetLimit)} ({totalBudgetPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  totalBudgetPercent >= 100
                    ? 'bg-rose-500'
                    : totalBudgetPercent >= 80
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-cyan-500 to-teal-400'
                }`}
                style={{ width: `${totalBudgetPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Individual Category Budget Highlights */}
          <div className="space-y-4">
            {activeBudgets.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                {t('budgets.emptySubtitle')}
              </div>
            ) : (
              activeBudgets.slice(0, 3).map((b) => {
                const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
                const isExceeded = pct >= 100;
                const isWarning = pct >= 80 && !isExceeded;

                return (
                  <div key={b.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-200">
                        {b.category}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">
                        {t('budgets.budgetUtilizationNotice', { category: b.category, percentage: pct })}
                      </span>
                      {isExceeded && (
                        <span className="text-rose-400 font-medium inline-flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" /> {t('common.exceededTitle')}
                        </span>
                      )}
                      {isWarning && (
                        <span className="text-amber-400 font-medium inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {t('common.warningTitle')}
                        </span>
                      )}
                      {!isExceeded && !isWarning && (
                        <span className="text-teal-400 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {t('common.safeTitle')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Spending by Category Card */}
        <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {t('dashboard.spendingByCategory')}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('dashboard.subtitle')}
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {categoryBreakdownList.length} {t('common.all')}
            </span>
          </div>

          <div className="space-y-3">
            {categoryBreakdownList.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                {t('dashboard.noExpensesRecorded')}
              </div>
            ) : (
              categoryBreakdownList.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{item.category}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.percentage}% ({item.count} items)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-100 font-mono">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {t('dashboard.recentTransactions')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('dashboard.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
          >
            {t('dashboard.viewAllTransactions')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="pb-3 font-medium">{t('common.date')}</th>
                <th className="pb-3 font-medium">{t('common.description')}</th>
                <th className="pb-3 font-medium">{t('common.payee')}</th>
                <th className="pb-3 font-medium">{t('common.category')}</th>
                <th className="pb-3 font-medium">{t('common.type')}</th>
                <th className="pb-3 font-medium text-right">{t('common.amount')}</th>
                <th className="pb-3 font-medium text-center">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    {t('dashboard.noTransactionsFound')}
                  </td>
                </tr>
              ) : (
                recentList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 font-mono text-slate-400">{formatDate(item.date)}</td>
                    <td className="py-3 font-medium text-slate-200">{item.description}</td>
                    <td className="py-3 text-slate-400">{item.payee}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 font-mono">
                      <span
                        className={`text-[11px] font-bold ${
                          item.type === 'INCOME' ? 'text-teal-400' : 'text-slate-400'
                        }`}
                      >
                        {item.type === 'INCOME' ? t('transactions.incomeBadge') : t('transactions.expenseBadge')}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-bold">
                      <span
                        className={
                          item.type === 'INCOME' ? 'text-teal-400' : 'text-slate-100'
                        }
                      >
                        {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] text-teal-400 bg-teal-950/60 border border-teal-800 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> {t('common.confirmed')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
