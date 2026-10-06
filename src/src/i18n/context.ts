import { createContext } from 'react';
import type { SupportedLanguage } from './types';

export interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | Date) => string;
  getLocalizedError: (errorCodeOrMessage: string) => string;
}

export const I18nContext = createContext<I18nContextType | null>(null);
