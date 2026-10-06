import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Download,
} from 'lucide-react';
import type { Transaction, TransactionCategory, TransactionType } from '../types';
import { Modal } from '../components/Modal';
import { useI18n } from '../i18n';

interface TransactionsPageProps {
  transactions: Transaction[];
  isLoading?: boolean;
  error?: string | null;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
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

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  isLoading = false,
  error = null,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onRefresh,
}) => {
  const { t, formatCurrency, formatDate } = useI18n();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form Fields
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [payee, setPayee] = useState<string>('');
  const [category, setCategory] = useState<TransactionCategory>('Food');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/transactions/export', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to export CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finshield_transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setAmount('');
    setType('EXPENSE');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setPayee('');
    setCategory('Food');
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setDate(tx.date);
    setDescription(tx.description);
    setPayee(tx.payee);
    setCategory(tx.category);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (editingTransaction) {
      onEditTransaction({
        ...editingTransaction,
        amount: numAmount,
        type,
        date,
        description,
        payee,
        category,
      });
    } else {
      // Basic check for scam flag demonstration if payee or note has scam-like keyword
      const isSuspicious =
        payee.toLowerCase().includes('lottery') ||
        payee.toLowerCase().includes('refund-') ||
        description.toLowerCase().includes('prize');

      onAddTransaction({
        amount: numAmount,
        type,
        date,
        description,
        payee,
        category,
        isFlaggedSuspicious: isSuspicious,
        suspiciousReason: isSuspicious
          ? 'Automated ScamShield pattern alert: suspicious keyword in transaction detail'
          : undefined,
      });
    }
    setIsModalOpen(false);
  };

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.payee.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || tx.category === selectedCategory;
    const matchesType = selectedType === 'ALL' || tx.type === selectedType;
    const matchesDate = !dateFilter || tx.date === dateFilter;

    return matchesSearch && matchesCategory && matchesType && matchesDate;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {t('transactions.title')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('transactions.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 font-semibold text-xs transition-all disabled:opacity-50"
            title="Download CSV protected against formula injection"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            {isExporting ? t('reports.exporting') : t('transactions.exportCsv')}
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" /> {t('transactions.addTransactionBtn')}
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

      {/* Filter and Search Bar */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('transactions.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">{t('transactions.filterCategoryAll')}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">{t('transactions.filterTypeAll')}</option>
            <option value="INCOME">{t('transactions.filterTypeIncome')}</option>
            <option value="EXPENSE">{t('transactions.filterTypeExpense')}</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="relative">
          <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono bg-slate-950/40">
                <th className="py-3.5 px-4 font-medium">{t('transactions.tableDate')}</th>
                <th className="py-3.5 px-4 font-medium">{t('transactions.tableDescription')}</th>
                <th className="py-3.5 px-4 font-medium">{t('transactions.tablePayee')}</th>
                <th className="py-3.5 px-4 font-medium">{t('transactions.tableCategory')}</th>
                <th className="py-3.5 px-4 font-medium">{t('transactions.tableType')}</th>
                <th className="py-3.5 px-4 font-medium text-right">{t('transactions.tableAmount')}</th>
                <th className="py-3.5 px-4 font-medium text-center">{t('common.status')}</th>
                <th className="py-3.5 px-4 font-medium text-center">{t('transactions.tableActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    {t('transactions.emptyTitle')}
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-900/40 transition-colors ${
                      tx.isFlaggedSuspicious ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-200">
                        {tx.description}
                      </span>
                      {tx.suspiciousReason && (
                        <p className="text-[10px] text-amber-400 mt-0.5">
                          ⚠️ {tx.suspiciousReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {tx.payee}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`text-[11px] font-bold ${
                          tx.type === 'INCOME'
                            ? 'text-teal-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {tx.type === 'INCOME' ? t('transactions.incomeBadge') : t('transactions.expenseBadge')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      <span
                        className={
                          tx.type === 'INCOME'
                            ? 'text-teal-400'
                            : 'text-slate-100'
                        }
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {tx.isFlaggedSuspicious ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-full font-semibold">
                          <AlertTriangle className="w-3 h-3" /> {t('common.warningTitle')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-teal-400 bg-teal-950/60 border border-teal-800/80 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> {t('common.confirmed')}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(tx)}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                          title={t('common.edit')}
                          aria-label={t('common.edit')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title={t('common.delete')}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTransaction ? t('transactions.editModalTitle') : t('transactions.addModalTitle')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('transactions.modalTypeLabel')}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="EXPENSE">{t('transactions.expenseBadge')}</option>
                <option value="INCOME">{t('transactions.incomeBadge')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('transactions.modalAmountLabel')}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('transactions.modalAmountPlaceholder')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('transactions.modalDescLabel')}
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('transactions.modalDescPlaceholder')}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('transactions.modalPayeeLabel')}
              </label>
              <input
                type="text"
                required
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder={t('transactions.modalPayeePlaceholder')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('transactions.modalCategoryLabel')}
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
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('transactions.modalDateLabel')}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
              {editingTransaction ? t('transactions.saveBtn') : t('transactions.createBtn')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
