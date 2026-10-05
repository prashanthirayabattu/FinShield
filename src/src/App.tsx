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

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

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
      setTransactionError(msg);
    } finally {
      setIsLoadingTransactions(false);
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
    } catch {
      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
      );
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionApi.delete(id);
    } catch {
      // ignore
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Budget Handlers
  const handleAddBudget = (newBudget: Omit<Budget, 'id'>) => {
    const created: Budget = {
      ...newBudget,
      id: `bg_${Date.now()}`,
    };
    setBudgets((prev) => [...prev, created]);
  };

  // Role Handler
  const handleUpdateRole = (newRole: UserRole) => {
    setUser((prev) => ({ ...prev, role: newRole }));
  };

  // Auth Handlers
  const handleAuthSuccess = (authUser: UserProfile) => {
    setUser(authUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentView('landing');
  };

  // View Render Switch
  if (currentView === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setCurrentView('auth-register')}
        onLogin={() => setCurrentView('auth-login')}
      />
    );
  }

  if (currentView === 'auth-login' || currentView === 'auth-register') {
    return (
      <AuthPage
        initialMode={currentView === 'auth-login' ? 'login' : 'register'}
        onSuccess={handleAuthSuccess}
        onBackToLanding={() => setCurrentView('landing')}
      />
    );
  }

  return (
    <AppLayout
      currentView={currentView}
      onNavigate={setCurrentView}
      user={user}
      onLogout={handleLogout}
    >
      {currentView === 'dashboard' && (
        <DashboardPage
          transactions={transactions}
          budgets={budgets}
          onNavigate={setCurrentView}
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
          onAddBudget={handleAddBudget}
        />
      )}
      {currentView === 'scamshield' && <ScamShieldPage />}
      {currentView === 'ai-assistant' && <AIAssistantPage />}
      {currentView === 'security' && <SecurityPage />}
      {currentView === 'reports' && <ReportsPage transactions={transactions} />}
      {currentView === 'profile' && (
        <ProfilePage
          user={user}
          onUpdateRole={handleUpdateRole}
          onLogout={handleLogout}
        />
      )}
    </AppLayout>
  );
}

export default App;
