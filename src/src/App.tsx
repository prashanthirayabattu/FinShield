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

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);

  // Transaction Handlers
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const created: Transaction = {
      ...newTx,
      id: `tx_${Date.now()}`,
    };
    setTransactions((prev) => [created, ...prev]);

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

  const handleEditTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
  };

  const handleDeleteTransaction = (id: string) => {
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
          onAddTransaction={handleAddTransaction}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
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
