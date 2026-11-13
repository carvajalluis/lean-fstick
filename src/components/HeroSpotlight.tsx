import React, { useState } from 'react';
import { Info, Play, Sparkles } from 'lucide-react';

export interface HeroFeatureItem {
  id: string;
  title: string;
  year: number | null;
  typeLabel: string;
  cast: string;
  imageUrl: string;
  sourceAppName: string;
  kicker: string;
  description: string;
  formatLabel?: string;
  progressPct?: number;
}

interface HeroSpotlightProps {
  item: HeroFeatureItem | null;
  onPrimaryAction: () => void;
  onInspectDetails: () => void;
  onOpenFind: () => void;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  item,
  onPrimaryAction,
  onInspectDetails,
  onOpenFind,
}) => {
  const [backdropFailed, setBackdropFailed] = useState(false);

  if (!item) {
    return (
      <section
        aria-label="Discover titles"
        className="relative rounded-2xl border border-[#2a262c] bg-[#161518] p-8 md:p-12 overflow-hidden"
      >
        <div className="max-w-2xl space-y-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#f3ede2] text-balance">
            Ready for tonight’s watch
          </h1>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenFind}
              className="px-6 py-3 rounded-full bg-[#ffb020] text-[#0b0b0c] font-display text-base font-bold cursor-pointer hover:bg-[#ffba4b] transition-colors"
            >
              Browse Find
            </button>
          </div>
        </div>
      </section>
    );
  }

  const metaLine = [
    item.year ? String(item.year) : null,
    item.typeLabel,
    item.sourceAppName,
    item.formatLabel || null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section
      aria-label="Featured spotlight"
      className="relative rounded-2xl border border-[#2a262c] bg-[#141315] overflow-hidden min-h-[290px] md:min-h-[320px] flex items-end"
    >
      {/* Atmospheric Poster Backdrop */}
      {!backdropFailed && item.imageUrl ? (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            key={item.imageUrl}
            src={item.imageUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBackdropFailed(true)}
            className="w-full h-full object-cover object-center opacity-45 scale-105 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0c] via-[#0b0b0c]/85 to-[#0b0b0c]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-transparent to-[#0b0b0c]/40" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#232026] via-[#141315] to-[#0b0b0c]" />
      )}

      <div className="relative z-10 w-full p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl space-y-3.5">
          <div className="flex items-center gap-2 text-sm font-display font-semibold text-[#ffb020]">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{item.kicker}</span>
          </div>

          <h1 className="font-display text-3xl md:text-5xl font-bold text-[#f3ede2] tracking-tight text-balance leading-[1.12]">
            {item.title}
          </h1>

          <p className="text-sm md:text-base text-[#d7c4ad] tabular-nums">
            {metaLine}
          </p>

          <p className="text-base text-[#a89f91] leading-relaxed max-w-xl">
            {item.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onPrimaryAction}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#ffb020] text-[#0b0b0c] font-display text-base font-bold shadow-[0_8px_32px_rgba(245,158,11,0.25)] hover:bg-[#ffba4b] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd59b]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {typeof item.progressPct === 'number' && item.progressPct < 100
                  ? `Resume in ${item.sourceAppName}`
                  : `Watch via ${item.sourceAppName}`}
              </span>
            </button>

            <button
              type="button"
              onClick={onInspectDetails}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#221f26]/90 border border-[#35303a] text-[#f3ede2] font-display text-base font-semibold hover:border-[#ffb020] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb020]"
            >
              <Info className="w-4 h-4" />
              <span>Details & IMDb</span>
            </button>
          </div>
        </div>

        {/* Clean framed poster preview on right for desktop 10-foot clarity */}
        {!backdropFailed && item.imageUrl && (
          <div className="hidden lg:block w-40 aspect-[2/3] rounded-2xl overflow-hidden border border-[#35303a] shrink-0 shadow-2xl">
            <img
              src={item.imageUrl}
              alt={`${item.title} poster`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
};
