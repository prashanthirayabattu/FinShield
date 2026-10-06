import React from 'react';
import { Mic } from 'lucide-react';
import { useI18n } from '../i18n';

interface VoiceModeButtonProps {
  onClick: () => void;
  className?: string;
  isListening?: boolean;
}

export const VoiceModeButton: React.FC<VoiceModeButtonProps> = ({
  onClick,
  className = '',
  isListening = false,
}) => {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      title={t('voice.voiceMode')}
      aria-label={t('voice.voiceMode')}
      className={`group relative inline-flex items-center gap-2 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
        isListening
          ? 'bg-rose-950/70 text-rose-300 border border-rose-600/70 shadow-lg shadow-rose-950/40 animate-pulse'
          : 'bg-[#090f1d]/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/50 shadow-sm'
      } ${className}`}
    >
      <div className="relative">
        <Mic
          className={`w-4 h-4 transition-transform group-hover:scale-110 ${
            isListening ? 'text-rose-400' : 'text-cyan-400'
          }`}
        />
        {isListening ? (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        ) : (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-teal-400 opacity-75" />
        )}
      </div>

      <span className="hidden sm:inline font-mono tracking-wide">
        {t('voice.voiceMode')}
      </span>
    </button>
  );
};
