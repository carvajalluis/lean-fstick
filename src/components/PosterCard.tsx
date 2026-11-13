import React, { useState } from 'react';
import { Film, Play } from 'lucide-react';

export interface PosterCardData {
  id: string;
  title: string;
  year: number | null;
  typeLabel: string;
  imageUrl: string;
  cast: string;
  sourceAppName?: string;
  progressPct?: number;
  episodeLabel?: string;
  whySuggested?: string;
}

interface PosterCardProps {
  item: PosterCardData;
  focused?: boolean;
  dimmed?: boolean;
  onSelect: () => void;
  onFocusCard?: () => void;
}

export const PosterCard: React.FC<PosterCardProps> = ({
  item,
  focused = false,
  dimmed = false,
  onSelect,
  onFocusCard,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const metaParts = [
    item.year ? String(item.year) : null,
    item.typeLabel,
    item.sourceAppName || null,
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onFocusCard}
      onFocus={onFocusCard}
      data-focused={focused ? 'true' : 'false'}
      aria-label={`${item.title}${item.sourceAppName ? ` on ${item.sourceAppName}` : ''}`}
      className={`nc-focus-card group relative text-left w-[184px] sm:w-[200px] shrink-0 rounded-2xl border border-[#2a262c] bg-[#161518] overflow-hidden cursor-pointer focus-visible:outline-none ${
        dimmed ? 'opacity-70 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <div className="relative aspect-[2/3] w-full bg-[#19171b] overflow-hidden">
        {!imgFailed && item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={`${item.title} poster`}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#232026] to-[#121113]">
            <Film className="w-9 h-9 text-[#a3704c] mb-3" strokeWidth={1.5} />
            <span className="font-display text-base font-semibold text-[#f3ede2] line-clamp-3">
              {item.title}
            </span>
          </div>
        )}

        {/* Measured bottom scrim for clean legibility */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/60 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Focus play indicator */}
        <div
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-opacity duration-200 ${
            focused
              ? 'opacity-100 bg-[#ffb020] text-[#0b0b0c]'
              : 'opacity-0 group-hover:opacity-100 bg-[#0b0b0c]/80 text-[#f3ede2] border border-[#35303a]'
          }`}
          aria-hidden="true"
        >
          <Play className="w-4 h-4 fill-current ml-0.5" />
        </div>

        {/* Resume progress bar in muted coral crimson */}
        {typeof item.progressPct === 'number' && item.progressPct > 0 && (
          <div className="absolute inset-x-3 bottom-3">
            <div className="h-1.5 w-full rounded-full bg-[#2c2832] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#e06c53]"
                style={{ width: `${Math.min(100, item.progressPct)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-3.5 space-y-1">
        <h3 className="font-display text-base font-semibold text-[#f3ede2] truncate leading-snug">
          {item.title}
        </h3>
        <p className="text-[13px] text-[#a89f91] truncate tabular-nums">
          {metaParts.join(' · ')}
        </p>
        {item.episodeLabel && (
          <p className="text-[13px] text-[#d7c4ad] truncate">
            {item.episodeLabel}
          </p>
        )}
      </div>
    </button>
  );
};
