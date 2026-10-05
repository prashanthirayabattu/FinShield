import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';
import type { Budget, TransactionCategory } from '../types';
import { Modal } from '../components/Modal';

interface BudgetsPageProps {
  budgets: Budget[];
  onAddBudget: (budget: Omit<Budget, 'id'>) => void;
}

const CATEGORIES: TransactionCategory[] = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Education',
  'Healthcare',
  'Entertainment',
  'Other',
];

export const BudgetsPage: React.FC<BudgetsPageProps> = ({
  budgets,
  onAddBudget,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<TransactionCategory>('Shopping');
  const [limit, setLimit] = useState<string>('5000');
  const [month, setMonth] = useState<string>('2026-10');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limit);
    if (isNaN(numLimit) || numLimit <= 0) return;

    onAddBudget({
      category,
      limit: numLimit,
      spent: 0,
      month,
    });
    setIsModalOpen(false);
    setLimit('5000');
  };

  const totalAllocated = budgets.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Category Budgets
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Establish spending caps with proactive 80% and 100% threshold alerts
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" /> Create Category Budget
        </button>
      </div>

      {/* High-level Summary Card */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shadow-md">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Monthly Ceiling (October 2026)
            </span>
            <h3 className="text-2xl font-extrabold text-white">
              ₹{totalSpent.toLocaleString('en-IN')} / ₹{totalAllocated.toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            <span className="text-slate-300">Normal (&lt;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-300">Warning (&ge;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300">Exceeded (&ge;100%)</span>
          </div>
        </div>
      </div>

      {/* Category Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgets.map((b) => {
          const percent = Math.round((b.spent / b.limit) * 100);
          const isExceeded = percent >= 100;
          const isWarning = percent >= 80 && !isExceeded;
          const remaining = b.limit - b.spent;

          return (
            <div
              key={b.id}
              className={`relative bg-[#0c1322] border rounded-3xl p-6 transition-all duration-200 hover:shadow-xl ${
                isExceeded
                  ? 'border-rose-900/60 shadow-rose-950/20'
                  : isWarning
                  ? 'border-amber-900/60 shadow-amber-950/20'
                  : 'border-slate-800 hover:border-cyan-500/40 shadow-cyan-950/10'
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-slate-100">
                  {b.category}
                </span>
                {isExceeded ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2.5 py-0.5 rounded-full">
                    <AlertOctagon className="w-3.5 h-3.5" /> Exceeded (100%+)
                  </span>
                ) : isWarning ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" /> 80% Warning
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 bg-teal-950/60 border border-teal-800/80 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                  </span>
                )}
              </div>

              {/* Limit & Spent Figures */}
              <div className="space-y-1 mb-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white font-mono">
                    ₹{b.spent.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    of ₹{b.limit.toLocaleString('en-IN')} limit
                  </span>
                </div>
                <div className="text-right text-[11px] font-mono">
                  {remaining >= 0 ? (
                    <span className="text-slate-400">
                      ₹{remaining.toLocaleString('en-IN')} left
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold">
                      ₹{Math.abs(remaining).toLocaleString('en-IN')} over budget
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isExceeded
                      ? 'bg-rose-500'
                      : isWarning
                      ? 'bg-amber-400'
                      : 'bg-gradient-to-r from-cyan-500 to-teal-400'
                  }`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                ></div>
              </div>

              {/* Footer percentage */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Month: {b.month}</span>
                <span
                  className={
                    isExceeded
                      ? 'text-rose-400 font-bold'
                      : isWarning
                      ? 'text-amber-400 font-bold'
                      : 'text-slate-300'
                  }
                >
                  {percent}% Consumed
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Category Budget"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Budget Limit (₹)
            </label>
            <input
              type="number"
              step="100"
              min="100"
              required
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Month
            </label>
            <input
              type="month"
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
            >
              Create Budget Cap
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
