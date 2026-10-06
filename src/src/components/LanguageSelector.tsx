import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '../i18n';
import { LANGUAGE_OPTIONS, type SupportedLanguage } from '../i18n/types';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'pill' | 'compact';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const { language, setLanguage } = useI18n();

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 ${className}`}>
        <Globe className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-0.5 shrink-0" aria-hidden="true" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          aria-label="Select interface language"
          className="bg-transparent text-xs text-slate-200 font-medium py-1 pr-2 pl-1 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code} className="bg-slate-900 text-slate-100">
              {opt.nativeName}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center gap-1 bg-[#0c1424] border border-slate-800/90 rounded-xl p-1 shadow-inner ${className}`}
    >
      <Globe className="w-4 h-4 text-cyan-400 ml-1 mr-0.5 shrink-0" aria-hidden="true" />
      {LANGUAGE_OPTIONS.map((opt) => {
        const isSelected = language === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLanguage(opt.code)}
            aria-pressed={isSelected}
            aria-label={`Change language to ${opt.name}`}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-150 ${
              isSelected
                ? 'bg-gradient-to-r from-cyan-950 to-teal-950 text-cyan-300 border border-cyan-600/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {opt.nativeName}
          </button>
        );
      })}
    </div>
  );
};
