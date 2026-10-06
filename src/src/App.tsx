import { useState } from 'react';
import type {
  AppView,
  Transaction,
  Budget,
  UserProfile,
  UserRole,
} from './types';
import {
  INITIAL_USER,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
} from './data/demoData';
import { AppLayout } from './layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { ScamShieldPage } from './pages/ScamShieldPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { SecurityPage } from './pages/SecurityPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { authApi } from './services/authApi';
import { transactionApi } from './services/transactionApi';
import { budgetApi, mapBackendBudgetToFrontend } from './services/budgetApi';
import { dashboardApi, type DashboardSummaryResponse } from './services/dashboardApi';
import { useI18n } from './i18n';
import { GlobalNetworkBackground } from './components/GlobalNetworkBackground';
import { FinShieldIntroReveal, INTRO_STORAGE_KEY } from './components/FinShieldIntroReveal';

export function App() {
  const { getLocalizedError } = useI18n();
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryResponse | null>(null);

  // Intro Reveal State: only executes once per browser session
  const [isIntroActive, setIsIntroActive] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(INTRO_STORAGE_KEY) !== 'true';
    } catch {
      return false;
    }
  });

  const handleIntroComplete = () => {
    setIsIntroActive(false);
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
    } catch {
      // Storage access resilience
    }
  };

  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const [isLoadingBudgets, setIsLoadingBudgets] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const loadTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      setTransactionError(null);
      const res = await transactionApi.list();
      if (res.transactions.length > 0) {
        setTransactions(res.transactions);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to synchronize transactions';
      setTransactionError(getLocalizedError(msg));
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const loadBudgets = async () => {
    try {
      setIsLoadingBudgets(true);
      setBudgetError(null);
      const res = await budgetApi.list();
      if (res.budgets.length > 0) {
        setBudgets(res.budgets.map(mapBackendBudgetToFrontend));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to synchronize budgets';
      setBudgetError(getLocalizedError(msg));
    } finally {
      setIsLoadingBudgets(false);
    }
  };

  const loadDashboardSummary = async () => {
    try {
      setIsLoadingDashboard(true);
      const sum = await dashboardApi.getSummary();
      setDashboardSummary(sum);
    } catch {
      // Keep existing state or local calculation
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    if (view === 'dashboard') {
      void loadDashboardSummary();
      void loadBudgets();
      void loadTransactions();
    } else if (view === 'budgets') {
      void loadBudgets();
    } else if (view === 'transactions') {
      void loadTransactions();
    }
  };

  // Transaction Handlers
  const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    try {
      const created = await transactionApi.create({
        type: newTx.type,
        amount: newTx.amount,
        category: newTx.category,
        description: newTx.description,
        payee: newTx.payee,
        transactionDate: new Date(newTx.date).toISOString(),
      });
      setTransactions((prev) => [created, ...prev]);
      loadBudgets();
      loadDashboardSummary();
    } catch {
      // Local fallback for offline/demo resilience
      const created: Transaction = {
        ...newTx,
        id: `tx_${Date.now()}`,
      };
      setTransactions((prev) => [created, ...prev]);
    }

    // If it's an expense, update corresponding budget if exists
    if (newTx.type === 'EXPENSE') {
      setBudgets((prev) =>
        prev.map((b) =>
          b.category === newTx.category
            ? { ...b, spent: b.spent + newTx.amount }
            : b
        )
      );
    }
  };

  const handleEditTransaction = async (updatedTx: Transaction) => {
    try {
      const updated = await transactionApi.update(updatedTx.id, {
        type: updatedTx.type,
        amount: updatedTx.amount,
        category: updatedTx.category,
        description: updatedTx.description,
        payee: updatedTx.payee,
        transactionDate: new Date(updatedTx.date).toISOString(),
      });
      setTransactions((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      loadBudgets();
      loadDashboardSummary();
    } catch {
      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
      );
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionApi.delete(id);
      loadBudgets();
      loadDashboardSummary();
    } catch {
      // ignore
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Budget Handlers
  const handleAddBudget = async (newBudget: Omit<Budget, 'id'>) => {
    try {
      const created = await budgetApi.create({
        category: newBudget.category,
        limitAmount: newBudget.limit,
        month: newBudget.month,
      });
      setBudgets((prev) => [...prev, mapBackendBudgetToFrontend(created)]);
      loadDashboardSummary();
    } catch {
      const created: Budget = {
        ...newBudget,
        id: `bg_${Date.now()}`,
      };
      setBudgets((prev) => [...prev, created]);
    }
  };

  const handleEditBudget = async (id: string, limit: number) => {
    try {
      const updated = await budgetApi.update(id, { limitAmount: limit });
      setBudgets((prev) =>
        prev.map((b) => (b.id === id ? mapBackendBudgetToFrontend(updated) : b))
      );
      loadDashboardSummary();
    } catch {
      setBudgets((prev) =>
        prev.map((b) => (b.id === id ? { ...b, limit } : b))
      );
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await budgetApi.delete(id);
      loadDashboardSummary();
    } catch {
      // ignore
    }
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  // Role Handler
  const handleUpdateRole = (newRole: UserRole) => {
    setUser((prev) => ({ ...prev, role: newRole }));
  };

  // Auth Handlers
  const handleAuthSuccess = (authUser: UserProfile) => {
    setUser(authUser);
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentView('landing');
  };

  // Unified Application Shell
  return (
    <div className="relative min-h-screen bg-[#070b14] text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Global Animated Financial Data Intelligence Network */}
      <GlobalNetworkBackground isIntroActive={isIntroActive} />

      {/* Cinematic Logo Animation (executes once per browser session) */}
      {isIntroActive && (
        <FinShieldIntroReveal onComplete={handleIntroComplete} />
      )}

      {/* Active View Router */}
      {currentView === 'landing' && (
        <LandingPage
          onGetStarted={() => setCurrentView('auth-register')}
          onLogin={() => setCurrentView('auth-login')}
        />
      )}

      {(currentView === 'auth-login' || currentView === 'auth-register') && (
        <AuthPage
          initialMode={currentView === 'auth-login' ? 'login' : 'register'}
          onSuccess={handleAuthSuccess}
          onBackToLanding={() => setCurrentView('landing')}
        />
      )}

      {currentView !== 'landing' &&
        currentView !== 'auth-login' &&
        currentView !== 'auth-register' && (
          <AppLayout
            currentView={currentView}
            onNavigate={handleNavigate}
            user={user}
            onLogout={handleLogout}
            transactions={transactions}
            budgets={budgets}
            onAddTransaction={handleAddTransaction}
            onAddBudget={handleAddBudget}
          >
            {currentView === 'dashboard' && (
              <DashboardPage
                transactions={transactions}
                budgets={budgets}
                summary={dashboardSummary}
                isLoading={isLoadingDashboard}
                onNavigate={handleNavigate}
                onRefresh={loadDashboardSummary}
              />
            )}
            {currentView === 'transactions' && (
              <TransactionsPage
                transactions={transactions}
                isLoading={isLoadingTransactions}
                error={transactionError}
                onAddTransaction={handleAddTransaction}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onRefresh={loadTransactions}
              />
            )}
            {currentView === 'budgets' && (
              <BudgetsPage
                budgets={budgets}
                isLoading={isLoadingBudgets}
                error={budgetError}
                onAddBudget={handleAddBudget}
                onEditBudget={handleEditBudget}
                onDeleteBudget={handleDeleteBudget}
                onRefresh={loadBudgets}
              />
            )}
            {currentView === 'scamshield' && <ScamShieldPage />}
            {currentView === 'ai-assistant' && <AIAssistantPage />}
            {currentView === 'security' && <SecurityPage />}
            {currentView === 'reports' && (
              <ReportsPage transactions={transactions} />
            )}
            {currentView === 'profile' && (
              <ProfilePage
                user={user}
                onUpdateRole={handleUpdateRole}
                onLogout={handleLogout}
              />
            )}
          </AppLayout>
        )}
    </div>
  );
}

export default App;
