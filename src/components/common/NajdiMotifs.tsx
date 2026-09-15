import React from 'react';

/**
 * Premium Najdi Architectural Tower Emblem & Wordmark
 */
export const AlabdullatifLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'cream';
  showSubtitle?: boolean;
}> = ({ size = 'md', variant = 'light', showSubtitle = true }) => {
  const isDark = variant === 'dark';
  const isCream = variant === 'cream';

  const iconSizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' };
  const titleSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
  const subSizes = { sm: 'text-[9px]', md: 'text-[10px]', lg: 'text-xs' };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Official Circular Logo Emblem */}
      <div
        className={`relative ${iconSizes[size]} shrink-0 rounded-full overflow-hidden shadow-md border border-sand-400/40 bg-sand-900/20`}
      >
        <img
          src="/logo.png"
          alt="مركز العبداللطيف"
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      {/* Wordmark Typography */}
      <div className="leading-tight">
        <div
          className={`font-serif font-bold tracking-tight ${titleSizes[size]} ${
            isDark ? 'text-najdi-900 dark:text-cream-50'
            : isCream ? 'text-najdi-900'
            : 'text-cream-50'
          }`}
        >
          <span>مركز العبداللطيف</span>
        </div>
        {showSubtitle && (
          <div
            className={`font-sans tracking-widest uppercase font-semibold ${subSizes[size]} ${
              isDark ? 'text-brand-600' : 'text-sand-300'
            }`}
          >
            Alabdullatif Center
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Traditional Najdi Geometric Frieze Pattern — Triangular Sharafat Row
 * Used as section dividers in sidebar and page transitions.
 */
export const NajdiPatternDivider: React.FC<{ className?: string; opacity?: string }> = ({
  className = '',
  opacity = 'opacity-25',
}) => {
  return (
    <div className={`w-full overflow-hidden flex items-center justify-center py-1 select-none pointer-events-none ${opacity} ${className}`}>
      <svg width="100%" height="12" viewBox="0 0 240 12" preserveAspectRatio="repeat-x" xmlns="http://www.w3.org/2000/svg">
        <pattern id="najdi-sharafat" width="24" height="12" patternUnits="userSpaceOnUse">
          <polygon points="12,1 21,11 3,11" fill="currentColor" />
          <circle cx="12" cy="7" r="1.5" fill="#faf7f2" />
        </pattern>
        <rect width="100%" height="12" fill="url(#najdi-sharafat)" />
      </svg>
    </div>
  );
};

/**
 * Wider Najdi geometric band — Diamond/square rotated grid
 * Used under page section headers on light cream backgrounds.
 */
export const NajdiGeometricBand: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full overflow-hidden select-none pointer-events-none ${className}`}>
      <svg width="100%" height="20" viewBox="0 0 240 20" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <pattern id="najdi-diamond" width="20" height="20" patternUnits="userSpaceOnUse">
          {/* Rotated square / diamond */}
          <polygon points="10,1 19,10 10,19 1,10" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.18" />
          <circle cx="10" cy="10" r="1.2" fill="currentColor" opacity="0.12" />
        </pattern>
        <rect width="100%" height="20" fill="url(#najdi-diamond)" />
      </svg>
    </div>
  );
};

/**
 * Najdi Architectural Skyline / Geometric Backdrop for Dashboard Header
 */
export const NajdiSkylineBackdrop: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none opacity-10 dark:opacity-15 ${className}`}>
      <svg
        viewBox="0 0 1200 240"
        preserveAspectRatio="none"
        className="w-full h-full text-najdi-800 dark:text-cream-100 fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Abstract Najdi Mud-brick Tower crenellations & commercial tower lines */}
        <path d="M0,240 L0,180 L40,180 L50,165 L60,180 L100,180 L110,165 L120,180 L160,180 L160,130 L175,110 L190,130 L220,130 L235,110 L250,130 L280,130 L280,160 L320,160 L330,145 L340,160 L380,160 L400,90 L420,60 L440,90 L460,90 L480,240 Z" opacity="0.4" />
        <path d="M450,240 L450,140 L470,110 L490,140 L520,140 L540,110 L560,140 L600,140 L600,80 L625,40 L650,80 L680,80 L705,40 L730,80 L760,80 L760,160 L800,160 L850,240 Z" opacity="0.6" />
        <path d="M780,240 L800,170 L820,145 L840,170 L880,170 L900,145 L920,170 L960,170 L960,110 L980,85 L1000,110 L1040,110 L1060,85 L1080,110 L1120,110 L1140,150 L1200,150 L1200,240 Z" opacity="0.4" />

        {/* Riyadh Kingdom/Faisaliah subtle triangular spire accents */}
        <polygon points="637,10 645,45 630,45" opacity="0.8" />
        <circle cx="637.5" cy="22" r="3" opacity="0.9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

/**
 * Full-bleed Najdi geometric tile background.
 * Subtle repeating diamond/triangle pattern for login page and empty-state areas.
 * Low opacity — purely decorative, does not interfere with overlaid content.
 */
export const NajdiGeometricBackground: React.FC<{ className?: string; dark?: boolean }> = ({
  className = '',
  dark = false,
}) => {
  const patternColor = dark ? '%23C9A66B' : '%234A3426'; // URL-encoded hex
  const patternOpacity = dark ? '0.05' : '0.06';

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <pattern id={`najdi-geo-${dark ? 'dark' : 'light'}`} width="40" height="40" patternUnits="userSpaceOnUse">
            {/* Diamond grid */}
            <polygon
              points="20,2 38,20 20,38 2,20"
              fill="none"
              stroke={dark ? '#C9A66B' : '#4A3426'}
              strokeWidth="0.8"
              opacity={patternOpacity}
            />
            {/* Inner accent square */}
            <polygon
              points="20,10 30,20 20,30 10,20"
              fill={dark ? '#C9A66B' : '#4A3426'}
              opacity={dark ? '0.04' : '0.05'}
            />
            {/* Corner dots */}
            <circle cx="20" cy="2"  r="1" fill={dark ? '#C9A66B' : '#4A3426'} opacity={patternOpacity} />
            <circle cx="38" cy="20" r="1" fill={dark ? '#C9A66B' : '#4A3426'} opacity={patternOpacity} />
            <circle cx="20" cy="38" r="1" fill={dark ? '#C9A66B' : '#4A3426'} opacity={patternOpacity} />
            <circle cx="2"  cy="20" r="1" fill={dark ? '#C9A66B' : '#4A3426'} opacity={patternOpacity} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#najdi-geo-${dark ? 'dark' : 'light'})`} />
      </svg>

      {/* Subtle crenellation strip at top */}
      <svg
        width="100%"
        height="32"
        viewBox="0 0 480 32"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
      >
        <pattern id={`sharafat-top-${dark ? 'dark' : 'light'}`} width="32" height="32" patternUnits="userSpaceOnUse">
          <polygon
            points="16,2 28,16 4,16"
            fill={dark ? '#C9A66B' : '#4A3426'}
            opacity={dark ? '0.07' : '0.07'}
          />
        </pattern>
        <rect width="100%" height="100%" fill={`url(#sharafat-top-${dark ? 'dark' : 'light'})`} />
      </svg>
    </div>
  );
};

/**
 * Najdi Page Header Pattern Strip
 * A light horizontal geometric accent for the top of page content sections.
 * Renders below page heading text, above data/tables.
 */
export const NajdiPageHeaderPattern: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full h-px bg-gradient-to-r from-transparent via-sand-400/40 to-transparent my-3 ${className}`} />
  );
};
