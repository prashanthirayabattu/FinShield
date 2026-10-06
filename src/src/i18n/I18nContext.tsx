import React, { useState, useEffect, useMemo } from 'react';
import type { SupportedLanguage, TranslationDictionary } from './types';
import { en } from './en';
import { te } from './te';
import { hi } from './hi';
import { I18nContext } from './context';

const DICTIONARIES: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  te,
  hi,
};

const STORAGE_KEY = 'finshield_lang';

function resolveKeyPath(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'te' || stored === 'hi') {
        return stored;
      }
    } catch {
      // localStorage may fail in restricted sandbox
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    if (lang === 'en' || lang === 'te' || lang === 'hi') {
      setLanguageState(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    // Update HTML lang attribute for accessibility and screen readers
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const dict = DICTIONARIES[language] || en;

    const t = (keyPath: string, params?: Record<string, string | number>): string => {
      const translation = resolveKeyPath(dict, keyPath) ?? resolveKeyPath(en, keyPath) ?? keyPath;
      return interpolate(translation, params);
    };

    const formatCurrency = (amount: number): string => {
      return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
    };

    const formatDate = (date: string | Date): string => {
      try {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return String(date);
        const locale = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        return d.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return String(date);
      }
    };

    const getLocalizedError = (errorCodeOrMessage: string): string => {
      const normalized = (errorCodeOrMessage || '').trim();
      if (!normalized) return t('errors.serverError');

      // Check stable error codes first
      if (normalized === 'AUTH_REQUIRED' || normalized.includes('Authentication required') || normalized.includes('Unauthorized')) {
        return t('errors.authRequired');
      }
      if (normalized === 'INVALID_INPUT' || normalized.includes('Validation failed') || normalized.includes('Invalid input')) {
        return t('errors.invalidInput');
      }
      if (normalized === 'FORBIDDEN' || normalized.includes('Forbidden') || normalized.includes('permission')) {
        return t('errors.forbidden');
      }
      if (normalized === 'NOT_FOUND' || normalized.includes('not found') || normalized.includes('404')) {
        return t('errors.notFound');
      }
      if (normalized === 'RATE_LIMITED' || normalized.includes('Too many requests') || normalized.includes('Rate limit')) {
        return t('errors.rateLimited');
      }
      if (normalized === 'DUPLICATE_EMAIL' || normalized.includes('email already exists') || normalized.includes('409')) {
        return t('errors.duplicateEmail');
      }
      if (normalized === 'INVALID_CREDENTIALS' || normalized.includes('Invalid email or password') || normalized.includes('Invalid credentials')) {
        return t('errors.invalidCredentials');
      }
      if (normalized === 'BUDGET_EXCEEDED' || normalized.includes('Budget exceeded')) {
        return t('errors.budgetExceeded');
      }
      if (normalized === 'SCAM_HIGH_RISK' || normalized.includes('High risk')) {
        return t('errors.scamHighRisk');
      }
      if (normalized === 'AI_UNAVAILABLE' || normalized.includes('AI Assistant query failed')) {
        return t('errors.aiUnavailable');
      }
      if (normalized.includes('NetworkError') || normalized.includes('Failed to fetch')) {
        return t('errors.networkError');
      }

      return normalized;
    };

    return {
      language,
      setLanguage,
      t,
      formatCurrency,
      formatDate,
      getLocalizedError,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
