import React from 'react';

interface AppLogoMarkProps {
  appId: string;
  shortCode: string;
  accentColor: string;
  className?: string;
}

interface BrandTheme {
  background: string;
  fg: string;
}

const BRAND_THEMES: Record<string, BrandTheme> = {
  prime: {
    background: 'linear-gradient(135deg, #0077B6 0%, #00A8E1 100%)',
    fg: '#FFFFFF',
  },
  apple: {
    background: 'linear-gradient(135deg, #2C2C30 0%, #161618 100%)',
    fg: '#F3EDE2',
  },
  max: {
    background: 'linear-gradient(135deg, #001B94 0%, #0038FF 100%)',
    fg: '#FFFFFF',
  },
  disney: {
    background: 'linear-gradient(135deg, #071952 0%, #113CCF 100%)',
    fg: '#FFFFFF',
  },
  netflix: {
    background: 'linear-gradient(135deg, #B20710 0%, #E50914 100%)',
    fg: '#FFFFFF',
  },
  hulu: {
    background: 'linear-gradient(135deg, #12B76A 0%, #1CE783 100%)',
    fg: '#071B12',
  },
  crunchyroll: {
    background: 'linear-gradient(135deg, #D95B0E 0%, #F47521 100%)',
    fg: '#FFFFFF',
  },
  peacock: {
    background: 'linear-gradient(135deg, #D97706 0%, #FBBF24 100%)',
    fg: '#141315',
  },
  plex: {
    background: 'linear-gradient(135deg, #282A2D 0%, #1B1C1E 100%)',
    fg: '#E5A00D',
  },
  paramount: {
    background: 'linear-gradient(135deg, #0038A8 0%, #0064FF 100%)',
    fg: '#FFFFFF',
  },
  mgm: {
    background: 'linear-gradient(135deg, #2B2111 0%, #9E7328 100%)',
    fg: '#F7E7C4',
  },
  amc: {
    background: 'linear-gradient(135deg, #094D63 0%, #117B9E 100%)',
    fg: '#FFFFFF',
  },
  starz: {
    background: 'linear-gradient(135deg, #091826 0%, #102B44 100%)',
    fg: '#FFFFFF',
  },
  mubi: {
    background: 'linear-gradient(135deg, #001166 0%, #0023CC 100%)',
    fg: '#FFFFFF',
  },
  tubi: {
    background: 'linear-gradient(135deg, #B91C1C 0%, #FA382F 100%)',
    fg: '#FFFFFF',
  },
  roku: {
    background: 'linear-gradient(135deg, #4C1D95 0%, #6C3C97 100%)',
    fg: '#FFFFFF',
  },
  pluto: {
    background: 'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
    fg: '#FFF200',
  },
  fubo: {
    background: 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)',
    fg: '#FFFFFF',
  },
};

export const AppLogoMark: React.FC<AppLogoMarkProps> = ({
  appId,
  shortCode,
  accentColor,
  className = 'w-full h-full',
}) => {
  const theme = BRAND_THEMES[appId] || {
    background: accentColor,
    fg: '#FFFFFF',
  };

  return (
    <div
      className={`flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{ background: theme.background, color: theme.fg }}
      aria-hidden="true"
    >
      {appId === 'prime' && (
        <svg viewBox="0 0 120 60" className="w-3/4 h-3/4" fill="none">
          <text
            x="60"
            y="30"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="Outfit, sans-serif"
            fontWeight="700"
            fontSize="24"
            letterSpacing="-0.5"
          >
            prime
          </text>
          <path
            d="M32 39 C48 49, 72 49, 88 39"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M83 36 L90 39 L86 45"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {appId === 'apple' && (
        <span className="font-display font-bold text-xl tracking-tight">
          tv+
        </span>
      )}

      {appId === 'max' && (
        <span className="font-display font-extrabold text-2xl tracking-tighter lowercase">
          max
        </span>
      )}

      {appId === 'disney' && (
        <svg viewBox="0 0 120 60" className="w-3/4 h-3/4" fill="none">
          <path
            d="M24 24 C45 10, 82 12, 98 28"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          />
          <text
            x="58"
            y="43"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="Outfit, sans-serif"
            fontWeight="700"
            fontSize="21"
          >
            Disney+
          </text>
        </svg>
      )}

      {appId === 'netflix' && (
        <svg viewBox="0 0 60 60" className="w-1/2 h-3/5" fill="currentColor">
          <path d="M16 8h8l12 29V8h8v44h-8L24 23v29h-8V8z" />
        </svg>
      )}

      {appId === 'hulu' && (
        <span className="font-display font-extrabold text-2xl tracking-tight lowercase">
          hulu
        </span>
      )}

      {appId === 'crunchyroll' && (
        <svg viewBox="0 0 60 60" className="w-1/2 h-3/5" fill="currentColor">
          <path d="M30 10a20 20 0 1 0 18.8 26.8A15 15 0 1 1 35 15.2 20 20 0 0 0 30 10z" />
          <circle cx="38" cy="24" r="5" />
        </svg>
      )}

      {appId === 'peacock' && (
        <svg viewBox="0 0 100 60" className="w-3/4 h-3/4" fill="currentColor">
          <circle cx="28" cy="18" r="3" />
          <circle cx="37" cy="13" r="3" />
          <circle cx="48" cy="11" r="3" />
          <circle cx="59" cy="13" r="3" />
          <circle cx="68" cy="18" r="3" />
          <text
            x="50"
            y="43"
            textAnchor="middle"
            fontFamily="Outfit, sans-serif"
            fontWeight="700"
            fontSize="17"
            letterSpacing="-0.4"
          >
            peacock
          </text>
        </svg>
      )}

      {appId === 'plex' && (
        <svg viewBox="0 0 110 60" className="w-3/4 h-3/4" fill="currentColor">
          <text
            x="44"
            y="38"
            textAnchor="middle"
            fill="#F3EDE2"
            fontFamily="Outfit, sans-serif"
            fontWeight="700"
            fontSize="22"
          >
            plex
          </text>
          <path d="M74 18h10l10 12-10 12H74l10-12-10-12z" fill="#E5A00D" />
        </svg>
      )}

      {appId === 'paramount' && (
        <svg viewBox="0 0 120 60" className="w-4/5 h-4/5" fill="currentColor">
          <path
            d="M42 26 L60 11 L78 26 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <text
            x="60"
            y="45"
            textAnchor="middle"
            fontFamily="Outfit, sans-serif"
            fontWeight="700"
            fontSize="15"
            letterSpacing="-0.3"
          >
            Paramount+
          </text>
        </svg>
      )}

      {![
        'prime',
        'apple',
        'max',
        'disney',
        'netflix',
        'hulu',
        'crunchyroll',
        'peacock',
        'plex',
        'paramount',
      ].includes(appId) && (
        <svg viewBox="0 0 120 60" className="w-4/5 h-4/5" fill="currentColor">
          <text
            x="60"
            y="38"
            textAnchor="middle"
            fontFamily="Outfit, sans-serif"
            fontWeight="800"
            fontSize="22"
            letterSpacing="-0.4"
          >
            {shortCode}
          </text>
        </svg>
      )}
    </div>
  );
};
