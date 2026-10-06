import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Trash2,
  Edit2,
  RefreshCw,
} from 'lucide-react';
import type { Budget, TransactionCategory } from '../types';
import { Modal } from '../components/Modal';
import { useI18n } from '../i18n';

interface BudgetsPageProps {
  budgets: Budget[];
  isLoading?: boolean;
  error?: string | null;
  onAddBudget: (budget: Omit<Budget, 'id'>) => Promise<void> | void;
  onEditBudget?: (id: string, limit: number) => Promise<void> | void;
  onDeleteBudget?: (id: string) => Promise<void> | void;
  onRefresh?: () => void;
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
  isLoading = false,
  error = null,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
  onRefresh,
}) => {
  const { t, formatCurrency } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [category, setCategory] = useState<TransactionCategory>('Shopping');
  const [limit, setLimit] = useState<string>('5000');
  const [editLimit, setEditLimit] = useState<string>('5000');
  const [month, setMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limit);
    if (isNaN(numLimit) || numLimit <= 0) return;

    await onAddBudget({
      category,
      limit: numLimit,
      spent: 0,
      month,
    });
    setIsModalOpen(false);
    setLimit('5000');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget || !onEditBudget) return;
    const numLimit = parseFloat(editLimit);
    if (isNaN(numLimit) || numLimit <= 0) return;

    await onEditBudget(editingBudget.id, numLimit);
    setIsEditModalOpen(false);
    setEditingBudget(null);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setEditLimit(budget.limit.toString());
    setIsEditModalOpen(true);
  };

  const totalAllocated = budgets.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {t('budgets.title')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('budgets.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" /> {t('budgets.createBudgetBtn')}
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-cyan-400 hover:underline font-mono text-xs ml-3"
            >
              {t('common.refresh')}
            </button>
          )}
        </div>
      )}

      {/* High-level Summary Card */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shadow-md">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              {t('budgets.monthLabel', { month })}
            </span>
            <h3 className="text-2xl font-extrabold text-white">
              {formatCurrency(totalSpent)} / {formatCurrency(totalAllocated)}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            <span className="text-slate-300">{t('common.safeTitle')} (&lt;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-300">{t('common.warningTitle')} (80%-99%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300">{t('common.exceededTitle')} (&ge;100%)</span>
          </div>
        </div>
      </div>

      {/* Category Budget Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>{t('common.loading')}</span>
          </div>
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-12 text-center">
          <PieChart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">{t('budgets.emptyTitle')}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {t('budgets.emptySubtitle')}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 font-semibold text-xs"
          >
            {t('budgets.createBudgetBtn')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const percent = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
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
                  <div className="flex items-center gap-2">
                    {isExceeded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2.5 py-0.5 rounded-full">
                        <AlertOctagon className="w-3.5 h-3.5" /> {t('budgets.statusExceeded')}
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5" /> {t('budgets.statusWarning')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 bg-teal-950/60 border border-teal-800/80 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('budgets.statusSafe')}
                      </span>
                    )}

                    {onEditBudget && (
                      <button
                        onClick={() => openEditModal(b)}
                        className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                        title={t('common.edit')}
                        aria-label={t('common.edit')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteBudget && (
                      <button
                        onClick={() => {
                          if (confirm(t('budgets.deleteBudgetDesc', { category: b.category }))) {
                            onDeleteBudget(b.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Limit & Spent Figures */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white font-mono">
                      {formatCurrency(b.spent)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {t('budgets.cardLimit', { limit: formatCurrency(b.limit) })}
                    </span>
                  </div>
                  <div className="text-right text-[11px] font-mono">
                    {remaining >= 0 ? (
                      <span className="text-slate-400">
                        {t('budgets.cardRemaining', { remaining: formatCurrency(remaining) })}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold">
                        {t('budgets.cardExceededBy', { exceeded: formatCurrency(Math.abs(remaining)) })}
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
                  <span>{t('budgets.monthLabel', { month: b.month })}</span>
                  <span
                    className={
                      isExceeded
                        ? 'text-rose-400 font-bold'
                        : isWarning
                        ? 'text-amber-400 font-bold'
                        : 'text-slate-300'
                    }
                  >
                    {t('budgets.budgetUtilizationNotice', { category: b.category, percentage: percent })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('budgets.modalAddTitle')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('budgets.modalCategoryLabel')}
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
              {t('budgets.modalLimitLabel')}
            </label>
            <input
              type="number"
              step="100"
              min="100"
              required
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder={t('budgets.modalLimitPlaceholder')}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('budgets.modalMonthLabel')}
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
            >
              {t('budgets.saveBudgetBtn')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('budgets.modalEditTitle')}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('budgets.modalLimitLabel')}
            </label>
            <input
              type="number"
              step="100"
              min="100"
              required
              value={editLimit}
              onChange={(e) => setEditLimit(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
            >
              {t('budgets.saveBudgetBtn')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
