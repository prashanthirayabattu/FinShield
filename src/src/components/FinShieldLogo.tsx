import React from 'react';

export interface FinShieldLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showWordmark?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  withGlow?: boolean;
  isScanning?: boolean;
  className?: string;
  badgeClassName?: string;
  textClassName?: string;
}

export const FinShieldLogo: React.FC<FinShieldLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showSubtitle = false,
  subtitle,
  withGlow = false,
  isScanning = false,
  className = '',
  badgeClassName = '',
  textClassName = '',
}) => {
  // Dimension configurations corresponding exactly to authentic app usage
  const sizeConfig = {
    sm: {
      badge: 'w-8 h-8 rounded-lg text-xs font-black shadow-cyan-500/15',
      text: 'text-base',
      subtitle: 'text-[9px]',
      gap: 'gap-2',
    },
    md: {
      badge: 'w-9 h-9 rounded-xl text-sm font-black shadow-md shadow-cyan-500/20',
      text: 'text-lg',
      subtitle: 'text-[10px]',
      gap: 'gap-2.5',
    },
    lg: {
      badge: 'w-12 h-12 rounded-2xl text-xl font-black shadow-lg shadow-cyan-500/25',
      text: 'text-2xl',
      subtitle: 'text-xs',
      gap: 'gap-3',
    },
    xl: {
      badge: 'w-20 h-20 rounded-3xl text-3xl font-black shadow-xl shadow-cyan-500/30',
      text: 'text-3xl sm:text-4xl',
      subtitle: 'text-xs sm:text-sm',
      gap: 'gap-4',
    },
    hero: {
      badge: 'w-24 h-24 sm:w-28 sm:h-28 rounded-3xl text-4xl sm:text-5xl font-black shadow-2xl shadow-cyan-500/35',
      text: 'text-4xl sm:text-5xl',
      subtitle: 'text-xs sm:text-sm',
      gap: 'gap-5',
    },
  }[size];

  return (
    <div className={`inline-flex items-center ${sizeConfig.gap} ${className}`}>
      {/* Authentic FinShield Badge */}
      <div
        className={`relative flex items-center justify-center select-none bg-gradient-to-tr from-cyan-500 via-teal-400 to-cyan-300 text-slate-950 font-black tracking-tight shrink-0 overflow-hidden transition-all duration-300 ${
          sizeConfig.badge
        } ${withGlow ? 'ring-2 ring-cyan-400/30 shadow-[0_0_35px_rgba(6,182,212,0.45)]' : ''} ${badgeClassName}`}
        aria-hidden="true"
      >
        <span>FS</span>

        {/* Security Scanning Beam Sweep */}
        {isScanning && (
          <div
            className="absolute inset-0 pointer-events-none animate-scan-sweep"
            style={{
              background:
                'linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.65) 50%, transparent 100%)',
              mixBlendMode: 'overlay',
            }}
          />
        )}
      </div>

      {/* FinShield Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-extrabold tracking-tight text-white flex items-center ${sizeConfig.text} ${textClassName}`}
          >
            Fin<span className="text-cyan-400">Shield</span>
          </span>
          {showSubtitle && subtitle && (
            <span
              className={`mt-1 font-mono uppercase tracking-widest text-slate-400 ${sizeConfig.subtitle}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
