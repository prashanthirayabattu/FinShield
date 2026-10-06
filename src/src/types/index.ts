// FinShield Domain Type Definitions

export type TransactionType = 'INCOME' | 'EXPENSE';

export type TransactionCategory =
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Bills'
  | 'Education'
  | 'Healthcare'
  | 'Entertainment'
  | 'Housing'
  | 'Utilities'
  | 'Salary'
  | 'Freelance'
  | 'Investment'
  | 'Other';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: string;
  description: string;
  payee: string;
  category: TransactionCategory;
  isFlaggedSuspicious?: boolean;
  suspiciousReason?: string;
}

export interface Budget {
  id: string;
  category: TransactionCategory;
  limit: number;
  spent: number;
  month: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ScamCheckResult {
  id: string;
  type: 'MESSAGE' | 'URL' | 'UPI';
  inputTarget: string;
  riskLevel: RiskLevel;
  riskScore: number;
  explainableReasons: string[];
  recommendedAction: string;
  analyzedAt: string;
}

export type UserRole = 'USER' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joinedDate: string;
  securityStatus: 'SECURE' | 'ACTION_RECOMMENDED';
}

export type AppView =
  | 'landing'
  | 'auth-login'
  | 'auth-register'
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'scamshield'
  | 'ai-assistant'
  | 'security'
  | 'reports'
  | 'profile';

export interface SecurityControlStatus {
  id: string;
  name: string;
  category: 'AUTHENTICATION' | 'AUTHORIZATION' | 'INPUT_VALIDATION' | 'API_SECURITY' | 'DATA_PROTECTION' | 'SECURITY_TESTING';
  status: 'PLANNED' | 'IN_DEVELOPMENT' | 'IMPLEMENTED';
  description: string;
  targetMechanism: string;
}
