import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import type {
  FindAvailabilityScope,
  ImdbSuggestionItem,
  InstalledApp,
} from '../types/launcher';
import { filterFindResultsByScope } from '../utils/launcherLogic';
import { PosterCard } from './PosterCard';

interface FindViewProps {
  apps: InstalledApp[];
  onSelectImdbItem: (item: ImdbSuggestionItem) => void;
}

const QUICK_TOPICS = [
  'Dune',
  'Sci-Fi Thriller',
  'Christopher Nolan',
  'Yellowstone',
  'Mystery Series',
  'Anime',
  'Paramount+',
  'Netflix',
];

export const FindView: React.FC<FindViewProps> = ({
  apps,
  onSelectImdbItem,
}) => {
  const [query, setQuery] = useState('Dune');
  const [scope, setScope] = useState<FindAvailabilityScope>('all');
  const [results, setResults] = useState<ImdbSuggestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const installedIdsParam = useMemo(
    () => apps.map((a) => a.id).join(','),
    [apps],
  );

  const runSearch = useCallback(
    async (searchTerm: string, installedIdsCsv: string) => {
      const trimmed = searchTerm.trim();
      const currentReqId = ++requestIdRef.current;

      if (!trimmed) {
        setResults([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(
          `/api/find?q=${encodeURIComponent(trimmed)}&installed=${encodeURIComponent(installedIdsCsv)}`,
        );
        if (!resp.ok) {
          throw new Error(`Search failed (${resp.status})`);
        }
        const data = (await resp.json()) as { items?: ImdbSuggestionItem[] };
        if (currentReqId !== requestIdRef.current) return;
        setResults(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        if (currentReqId !== requestIdRef.current) return;
        setError(
          err instanceof Error ? err.message : 'Unable to load search results',
        );
        setResults([]);
      } finally {
        if (currentReqId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void runSearch(query, installedIdsParam);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, installedIdsParam, runSearch]);

  const installedCount = useMemo(
    () => filterFindResultsByScope(results, 'installed').length,
    [results],
  );
  const uninstalledCount = useMemo(
    () => filterFindResultsByScope(results, 'uninstalled').length,
    [results],
  );

  const visibleResults = useMemo(
    () => filterFindResultsByScope(results, scope),
    [results, scope],
  );

  const getAvailabilityLabel = (item: ImdbSuggestionItem): string | undefined => {
    const offers = item.availableOn;
    if (!offers || offers.length === 0) return item.sourceAppName;

    if (scope === 'uninstalled') {
      const missing = offers.filter((o) => !o.installed);
      if (missing.length > 0) {
        return missing[0].name;
      }
    }

    const installed = offers.filter((o) => o.installed);
    if (installed.length > 0) {
      return installed.length > 1
        ? `${installed[0].name} +${installed.length - 1}`
        : installed[0].name;
    }

    return offers[0].name;
  };

  return (
    <div className="space-y-7 pb-12">
      <h1 className="font-display text-3xl md:text-4xl font-bold text-[#f3ede2]">
        Find
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch(query, installedIdsParam);
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <label htmlFor="imdb-find-input" className="sr-only">
          Search titles, actors, genres, or streaming apps
        </label>
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-[#a89f91] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="imdb-find-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, actors, genres, or apps..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#161518] border border-[#2a262c] text-base text-[#f3ede2] placeholder-[#a89f91]/70 focus:outline-none focus:border-[#ffb020]"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3.5 rounded-xl bg-[#ffb020] text-[#0b0b0c] font-display font-bold text-base hover:bg-[#ffba4b] transition-colors cursor-pointer shrink-0"
        >
          Search
        </button>
      </form>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setQuery(topic)}
              className={`px-3.5 py-2 rounded-lg text-sm font-display font-semibold border transition-colors cursor-pointer ${
                query.toLowerCase() === topic.toLowerCase()
                  ? 'bg-[#ffb020] text-[#0b0b0c] border-[#ffb020]'
                  : 'bg-[#19171b] text-[#d7c4ad] border-[#2a262c] hover:border-[#ffb020]'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Availability Scope Filter */}
        <div
          className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#161518] border border-[#2a262c] self-start"
          role="tablist"
          aria-label="Filter by app installation"
        >
          {(
            [
              { id: 'all', label: `All (${results.length})` },
              { id: 'installed', label: `Installed Apps (${installedCount})` },
              { id: 'uninstalled', label: `Other Apps (${uninstalledCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={scope === tab.id}
              onClick={() => setScope(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                scope === tab.id
                  ? 'bg-[#ffb020] text-[#0b0b0c]'
                  : 'text-[#a89f91] hover:text-[#f3ede2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#93000a] bg-[#2a1215] px-5 py-4 text-sm text-[#ffdad6]">
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="flex flex-wrap gap-7"
          data-testid="find-loading-skeleton"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-[184px] sm:w-[200px] rounded-2xl border border-[#2a262c] bg-[#161518] overflow-hidden"
            >
              <div className="aspect-[2/3] bg-[#201f21] animate-pulse" />
              <div className="p-3.5 space-y-2">
                <div className="h-4 w-3/4 bg-[#201f21] rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-[#201f21] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleResults.length === 0 ? (
        <div className="rounded-2xl border border-[#2a262c] bg-[#161518] p-10 text-center space-y-2">
          <p className="font-display text-lg font-semibold text-[#f3ede2]">
            {results.length > 0 && scope !== 'all'
              ? `No matches in ${scope === 'installed' ? 'Installed Apps' : 'Other Apps'} for “${query}”`
              : `No matches for “${query}”`}
          </p>
          <p className="text-sm text-[#a89f91]">
            {results.length > 0 && scope !== 'all'
              ? 'Switch to All to see results across every streaming app.'
              : 'Try a title, actor, genre, or streaming app name.'}
          </p>
        </div>
      ) : (
        <div
          className="flex flex-wrap gap-7"
          data-testid="imdb-search-results"
        >
          {visibleResults.map((item) => {
            const sourceAppName = getAvailabilityLabel(item);
            return (
              <PosterCard
                key={item.id}
                item={{
                  id: item.id,
                  title: item.title,
                  year: item.year,
                  typeLabel: item.type,
                  imageUrl: item.imageUrl,
                  cast: item.cast,
                  sourceAppName,
                }}
                onSelect={() => onSelectImdbItem(item)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
