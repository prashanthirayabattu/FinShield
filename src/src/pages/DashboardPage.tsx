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
} from 'lucide-react';
import type { Transaction, Budget, AppView } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

interface DashboardPageProps {
  transactions: Transaction[];
  budgets: Budget[];
  onNavigate: (view: AppView) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  transactions,
  budgets,
  onNavigate,
}) => {
  // Compute financial totals
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalBalance / totalIncome) * 100).toFixed(1) : '0';

  // Spending by Category
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  // Flagged suspicious transactions
  const flaggedTransactions = transactions.filter((t) => t.isFlaggedSuspicious);

  // Total budget metrics
  const totalBudgetLimit = budgets.reduce((acc, b) => acc + b.limit, 0);
  const totalBudgetSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const totalBudgetPercent = Math.min(
    Math.round((totalBudgetSpent / totalBudgetLimit) * 100),
    100
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#0c1424] via-[#0e182c] to-[#0a1220] border border-cyan-900/40 rounded-3xl p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="cyan">PS-01 Personal Finance</Badge>
            <Badge variant="teal">ScamShield Active</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financial Health & Security Overview
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Live personal ledger protected by heuristic fraud detection and isolated AI intelligence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('transactions')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
          >
            + Add Transaction
          </button>
          <button
            onClick={() => onNavigate('scamshield')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-800/60 hover:border-cyan-400 text-cyan-300 font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Scan Scam
          </button>
        </div>
      </div>

      {/* Security Alerts Banner (if any flagged transactions exist) */}
      {flaggedTransactions.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-900/40 text-amber-400 border border-amber-700/50">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                Security Alert: {flaggedTransactions.length} Suspicious Ledger Entry Detected
              </h4>
              <p className="text-xs text-amber-300/80">
                Transaction with payee &quot;{flaggedTransactions[0].payee}&quot; triggered a ScamShield lottery lure pattern.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
          >
            Review in Ledger
          </button>
        </div>
      )}

      {/* 4 Core Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Balance"
          value={`₹${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Net liquid balance"
          accent="cyan"
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          title="Total Income"
          value={`₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          trend={{ value: '+12.4%', isPositive: true }}
          subtitle="Current month"
          accent="teal"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Total Expenses"
          value={`₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          trend={{ value: '-4.2%', isPositive: true }}
          subtitle="All categories"
          accent="purple"
          icon={<TrendingDown className="w-5 h-5" />}
        />
        <StatCard
          title="Monthly Savings"
          value={`${savingsRate}%`}
          subtitle="Income retained"
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
                Overall Budget Progress
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly limits across monitored categories
              </p>
            </div>
            <button
              onClick={() => onNavigate('budgets')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              All Budgets <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
              <span>Overall Utilization</span>
              <span className="font-mono text-cyan-300">
                ₹{totalBudgetSpent.toLocaleString('en-IN')} / ₹{totalBudgetLimit.toLocaleString('en-IN')} ({totalBudgetPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  totalBudgetPercent > 90
                    ? 'bg-rose-500'
                    : totalBudgetPercent > 75
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-cyan-500 to-teal-400'
                }`}
                style={{ width: `${totalBudgetPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Individual Category Budget Highlights */}
          <div className="space-y-4">
            {budgets.slice(0, 3).map((b) => {
              const pct = Math.round((b.spent / b.limit) * 100);
              const isExceeded = pct >= 100;
              const isWarning = pct >= 80 && !isExceeded;

              return (
                <div key={b.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-200">
                      {b.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ₹{b.spent.toLocaleString('en-IN')} of ₹{b.limit.toLocaleString('en-IN')}
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
                    <span className="text-slate-500 font-mono">{pct}% consumed</span>
                    {isExceeded && (
                      <span className="text-rose-400 font-medium">Over limit!</span>
                    )}
                    {isWarning && (
                      <span className="text-amber-400 font-medium">&gt;80% threshold reached</span>
                    )}
                    {!isExceeded && !isWarning && (
                      <span className="text-teal-400 font-medium">On track</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spending by Category Card */}
        <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Spending by Category
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Breakdown of active monthly expenditures
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {Object.keys(categoryTotals).length} Categories
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(categoryTotals).map(([cat, amount]) => {
              const share = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
              return (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{cat}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {share}% of total spend
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-100 font-mono">
                      ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
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
                Recent Transactions
              </h3>
              <p className="text-xs text-slate-400">
                Latest ledger mutations verified for fraud signals
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
          >
            View All Ledger <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium">Payee / Entity</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium text-right">Amount</th>
                <th className="pb-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 font-mono text-slate-400">{t.date}</td>
                  <td className="py-3 font-medium text-slate-200">{t.description}</td>
                  <td className="py-3 text-slate-400">{t.payee}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3 font-mono">
                    <span
                      className={`text-[11px] font-bold ${
                        t.type === 'INCOME' ? 'text-teal-400' : 'text-slate-400'
                      }`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-bold">
                    <span
                      className={
                        t.type === 'INCOME' ? 'text-teal-400' : 'text-slate-100'
                      }
                    >
                      {t.type === 'INCOME' ? '+' : '-'}₹
                      {t.amount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    {t.isFlaggedSuspicious ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Flagged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-teal-400 bg-teal-950/60 border border-teal-800 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
