import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import type {
  ImdbSuggestionItem,
  InstalledApp,
  RecommendationShelf,
  SeenHistoryItem,
} from '../types/launcher';
import { formatImdbTypeLabel, moveDpadFocus } from '../utils/launcherLogic';
import { AppsDockRow } from './AppsDockRow';
import { HeroSpotlight, type HeroFeatureItem } from './HeroSpotlight';
import { PosterCard } from './PosterCard';

interface HomeViewProps {
  apps: InstalledApp[];
  grantedHistory: SeenHistoryItem[];
  shelves: RecommendationShelf[];
  loadingRecommendations: boolean;
  recommendationsError: string | null;
  onRefreshRecommendations: () => void;
  onSelectHistoryItem: (item: SeenHistoryItem) => void;
  onSelectImdbItem: (item: ImdbSuggestionItem) => void;
  onLaunchOrResume: (item: HeroFeatureItem) => void;
  onOpenApp: (app: InstalledApp) => void;
  onOpenFind: () => void;
  isModalOpen: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  apps,
  grantedHistory,
  shelves,
  loadingRecommendations,
  recommendationsError,
  onRefreshRecommendations,
  onSelectHistoryItem,
  onSelectImdbItem,
  onLaunchOrResume,
  onOpenApp,
  onOpenFind,
  isModalOpen,
}) => {
  const [focusPos, setFocusPos] = useState<{ row: number; col: number }>({
    row: 1,
    col: 0,
  });

  const appNameMap = useMemo(
    () => new Map(apps.map((a) => [a.id, a.name])),
    [apps],
  );

  const rowLengths = useMemo(() => {
    const lengths = [apps.length, grantedHistory.length];
    for (const shelf of shelves) {
      lengths.push(shelf.items.length);
    }
    return lengths;
  }, [apps.length, grantedHistory.length, shelves]);

  useEffect(() => {
    setFocusPos((prev) => moveDpadFocus(prev, 'left', rowLengths));
  }, [rowLengths]);

  useEffect(() => {
    if (isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusPos((prev) => moveDpadFocus(prev, 'right', rowLengths));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusPos((prev) => moveDpadFocus(prev, 'left', rowLengths));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusPos((prev) => moveDpadFocus(prev, 'down', rowLengths));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusPos((prev) => moveDpadFocus(prev, 'up', rowLengths));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, rowLengths]);

  const heroItem: HeroFeatureItem | null = useMemo(() => {
    if (focusPos.row === 1 && grantedHistory[focusPos.col]) {
      const h = grantedHistory[focusPos.col];
      const appName = appNameMap.get(h.appId) || h.appId;
      return {
        id: h.id,
        title: h.title,
        year: h.year,
        typeLabel: formatImdbTypeLabel(h.type),
        cast: h.cast,
        imageUrl: h.imageUrl,
        sourceAppName: appName,
        kicker: `Continue Watching · ${appName}`,
        description: h.episodeLabel
          ? `${h.episodeLabel} · Starring ${h.cast}`
          : `Starring ${h.cast}`,
        formatLabel: h.videoFormat,
        progressPct: h.progressPct,
      };
    }

    if (focusPos.row >= 2) {
      const shelf = shelves[focusPos.row - 2];
      const item = shelf?.items[focusPos.col];
      if (item && shelf) {
        return {
          id: item.id,
          title: item.title,
          year: item.year,
          typeLabel: item.type,
          cast: item.cast,
          imageUrl: item.imageUrl,
          sourceAppName: shelf.sourceAppName,
          kicker: shelf.title,
          description: `Starring ${item.cast}`,
        };
      }
    }

    const firstSuggestion = shelves[0]?.items[0];
    if (firstSuggestion && shelves[0]) {
      return {
        id: firstSuggestion.id,
        title: firstSuggestion.title,
        year: firstSuggestion.year,
        typeLabel: firstSuggestion.type,
        cast: firstSuggestion.cast,
        imageUrl: firstSuggestion.imageUrl,
        sourceAppName: shelves[0].sourceAppName,
        kicker: shelves[0].title,
        description: `Starring ${firstSuggestion.cast}`,
      };
    }

    const firstHistory = grantedHistory[0];
    if (firstHistory) {
      const appName = appNameMap.get(firstHistory.appId) || firstHistory.appId;
      return {
        id: firstHistory.id,
        title: firstHistory.title,
        year: firstHistory.year,
        typeLabel: formatImdbTypeLabel(firstHistory.type),
        cast: firstHistory.cast,
        imageUrl: firstHistory.imageUrl,
        sourceAppName: appName,
        kicker: `Continue Watching · ${appName}`,
        description: firstHistory.episodeLabel
          ? `${firstHistory.episodeLabel} · Starring ${firstHistory.cast}`
          : `Starring ${firstHistory.cast}`,
        formatLabel: firstHistory.videoFormat,
        progressPct: firstHistory.progressPct,
      };
    }

    return null;
  }, [focusPos, grantedHistory, shelves, appNameMap]);

  const handleInspectHero = () => {
    if (!heroItem) return;
    const histMatch = grantedHistory.find((h) => h.id === heroItem.id);
    if (histMatch) {
      onSelectHistoryItem(histMatch);
      return;
    }
    for (const shelf of shelves) {
      const sugMatch = shelf.items.find((i) => i.id === heroItem.id);
      if (sugMatch) {
        onSelectImdbItem(sugMatch);
        return;
      }
    }
  };

  return (
    <div className="space-y-10 pb-12">
      <HeroSpotlight
        item={heroItem}
        onPrimaryAction={() => heroItem && onLaunchOrResume(heroItem)}
        onInspectDetails={handleInspectHero}
        onOpenFind={onOpenFind}
      />

      <AppsDockRow
        apps={apps}
        focusedCol={focusPos.row === 0 ? focusPos.col : null}
        onFocusCol={(col) => setFocusPos({ row: 0, col })}
        onOpenApp={onOpenApp}
      />

      {/* Continue Watching */}
      <section
        aria-label="Continue watching"
        className="space-y-4"
        data-testid="continue-watching-section"
      >
        <h2 className="font-display text-2xl font-semibold text-[#f3ede2]">
          Continue Watching
        </h2>

        {grantedHistory.length === 0 ? (
          <div className="rounded-2xl border border-[#2a262c] bg-[#161518] p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <ShieldAlert className="w-6 h-6 text-[#e06c53] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-display text-lg font-semibold text-[#f3ede2]">
                  Nothing in Continue Watching yet
                </h3>
                <p className="text-sm text-[#a89f91]">
                  Start a movie or series from Find to pick up where you left off.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenFind}
              className="px-5 py-2.5 rounded-full bg-[#ffb020] text-[#0b0b0c] font-display text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Browse Find
            </button>
          </div>
        ) : (
          <div className="flex items-stretch gap-7 overflow-x-auto no-scrollbar py-3 px-1">
            {grantedHistory.map((item, idx) => (
              <PosterCard
                key={`${item.appId}-${item.id}`}
                item={{
                  id: item.id,
                  title: item.title,
                  year: item.year,
                  typeLabel: formatImdbTypeLabel(item.type),
                  imageUrl: item.imageUrl,
                  cast: item.cast,
                  sourceAppName: appNameMap.get(item.appId) || item.appId,
                  progressPct: item.progressPct,
                  episodeLabel: item.episodeLabel,
                }}
                focused={focusPos.row === 1 && focusPos.col === idx}
                dimmed={focusPos.row === 1 && focusPos.col !== idx}
                onFocusCard={() => setFocusPos({ row: 1, col: idx })}
                onSelect={() => onSelectHistoryItem(item)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Personalized Shelves */}
      <section
        aria-label="Recommended for you"
        className="space-y-9"
        data-testid="imdb-suggestions-section"
      >
        {recommendationsError && (
          <div className="rounded-xl border border-[#93000a] bg-[#2a1215] px-5 py-4 text-sm text-[#ffdad6] flex items-center justify-between gap-4">
            <span>{recommendationsError}</span>
            <button
              type="button"
              onClick={onRefreshRecommendations}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#ffb020] text-[#0b0b0c] font-display font-semibold text-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {loadingRecommendations && shelves.length === 0 && (
          <div className="space-y-4">
            <div className="h-6 w-72 rounded bg-[#201f21] animate-pulse" />
            <div className="flex gap-7 overflow-hidden py-2">
              {[0, 1, 2, 3, 4].map((skeleton) => (
                <div
                  key={skeleton}
                  className="w-[200px] shrink-0 rounded-2xl border border-[#2a262c] bg-[#161518] overflow-hidden"
                >
                  <div className="aspect-[2/3] bg-[#201f21] animate-pulse" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-[#201f21] animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-[#201f21] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {shelves.map((shelf, shelfIdx) => {
          const rowIndex = shelfIdx + 2;
          return (
            <div key={shelf.id} className="space-y-3" data-testid="imdb-shelf">
              <h3 className="font-display text-xl font-semibold text-[#f3ede2]">
                {shelf.title}
              </h3>

              <div className="flex items-stretch gap-7 overflow-x-auto no-scrollbar py-3 px-1">
                {shelf.items.map((item, colIdx) => (
                  <PosterCard
                    key={`${shelf.id}-${item.id}`}
                    item={{
                      id: item.id,
                      title: item.title,
                      year: item.year,
                      typeLabel: item.type,
                      imageUrl: item.imageUrl,
                      cast: item.cast,
                    }}
                    focused={
                      focusPos.row === rowIndex && focusPos.col === colIdx
                    }
                    dimmed={
                      focusPos.row === rowIndex && focusPos.col !== colIdx
                    }
                    onFocusCard={() =>
                      setFocusPos({ row: rowIndex, col: colIdx })
                    }
                    onSelect={() => onSelectImdbItem(item)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
