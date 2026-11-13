import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, Film, Play, X } from 'lucide-react';
import type {
  ImdbSuggestionItem,
  InstalledApp,
  StreamingProviderOffer,
} from '../types/launcher';
import { AppLogoMark } from './AppLogoMark';
import { PosterCard } from './PosterCard';

export interface ModalTitleContext {
  id: string;
  title: string;
  year: number | null;
  typeLabel: string;
  rawType: 'movie' | 'tvSeries' | 'tvMiniSeries' | 'video';
  cast: string;
  imageUrl: string;
  imdbUrl: string;
  defaultAppId?: string;
  progressPct?: number;
  episodeLabel?: string;
  whySuggested?: string;
  availableOn?: StreamingProviderOffer[];
}

interface TitleDetailModalProps {
  item: ModalTitleContext | null;
  apps: InstalledApp[];
  onClose: () => void;
  onWatchInApp: (item: ModalTitleContext, appId: string) => void;
  onInstallApp?: (offer: StreamingProviderOffer) => void;
  onSelectRelated: (item: ImdbSuggestionItem) => void;
}

export const TitleDetailModal: React.FC<TitleDetailModalProps> = ({
  item,
  apps,
  onClose,
  onWatchInApp,
  onInstallApp,
  onSelectRelated,
}) => {
  const installedIds = new Set(apps.map((a) => a.id));
  const installedOffers = (item?.availableOn || []).filter((o) =>
    installedIds.has(o.appId),
  );
  const uninstalledOffers = (item?.availableOn || []).filter(
    (o) => !installedIds.has(o.appId),
  );

  const fallbackAppId =
    installedOffers[0]?.appId ||
    (item?.defaultAppId && installedIds.has(item.defaultAppId)
      ? item.defaultAppId
      : apps[0]?.id || 'prime');

  const [selectedAppId, setSelectedAppId] = useState(fallbackAppId);
  const [related, setRelated] = useState<ImdbSuggestionItem[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (!item) return;
    const currentInstalledIds = new Set(apps.map((a) => a.id));
    const firstInstalledOffer = (item.availableOn || []).find((o) =>
      currentInstalledIds.has(o.appId),
    );
    setSelectedAppId(
      firstInstalledOffer?.appId ||
        (item.defaultAppId && currentInstalledIds.has(item.defaultAppId)
          ? item.defaultAppId
          : apps[0]?.id || 'prime'),
    );
    setImgFailed(false);

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);

    const titleSeed = item.title.replace(/[:\-–].*$/, '').trim();
    setLoadingRelated(true);
    fetch(`/api/imdb/suggestions?q=${encodeURIComponent(titleSeed)}`)
      .then((r) => r.json())
      .then((data: { items?: ImdbSuggestionItem[] }) => {
        const filtered = (data.items || [])
          .filter((x) => x.id !== item.id)
          .slice(0, 6);
        setRelated(filtered);
      })
      .catch(() => setRelated([]))
      .finally(() => setLoadingRelated(false));

    return () => window.removeEventListener('keydown', handleEsc);
  }, [item?.id, apps.length]);

  if (!item) return null;

  const selectedApp = apps.find((a) => a.id === selectedAppId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[#0b0b0c]/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#35303a] bg-[#161518] shadow-2xl p-6 md:p-8 space-y-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close title details"
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#221f26] border border-[#35303a] text-[#f3ede2] hover:border-[#ffb020] hover:text-[#ffb020] flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row gap-7">
          <div className="w-44 md:w-52 aspect-[2/3] rounded-2xl overflow-hidden border border-[#2a262c] bg-[#19171b] shrink-0">
            {!imgFailed && item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={`${item.title} poster`}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <Film className="w-8 h-8 text-[#a3704c] mb-2" />
                <span className="font-display text-sm text-[#f3ede2]">
                  {item.title}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4 pr-6">
            {item.whySuggested && (
              <p className="text-sm font-display font-semibold text-[#ffb020]">
                {item.whySuggested}
              </p>
            )}

            <h2
              id="detail-modal-title"
              className="font-display text-3xl font-bold text-[#f3ede2] leading-tight"
            >
              {item.title}
            </h2>

            <p className="text-sm text-[#d7c4ad] tabular-nums">
              {item.year ?? '—'} · {item.typeLabel} ·{' '}
              {item.id.startsWith('tt') ? `IMDb ${item.id}` : 'Streaming Title'}
              {item.episodeLabel ? ` · ${item.episodeLabel}` : ''}
            </p>

            <p className="text-base text-[#a89f91]">
              Cast: <span className="text-[#f3ede2]">{item.cast}</span>
            </p>

            {/* Launch & Watch */}
            <div className="rounded-xl border border-[#2a262c] bg-[#1c1b1d] p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label
                  htmlFor="launch-app-select"
                  className="block font-display text-sm font-semibold text-[#f3ede2]"
                >
                  Streaming App
                </label>
                <select
                  id="launch-app-select"
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="px-3.5 py-2 rounded-lg bg-[#141315] border border-[#35303a] text-sm text-[#f3ede2] focus:outline-none focus:border-[#ffb020]"
                >
                  {apps.map((app) => {
                    const matched = installedOffers.find(
                      (o) => o.appId === app.id,
                    );
                    return (
                      <option key={app.id} value={app.id}>
                        {app.name}
                        {matched ? ` (${matched.monetizationType})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {typeof item.progressPct === 'number' && item.progressPct > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#d7c4ad] tabular-nums">
                    <span>App-synced playback progress</span>
                    <span>{item.progressPct}% watched</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#2c2832] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#e06c53]"
                      style={{ width: `${Math.min(100, item.progressPct)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onWatchInApp(item, selectedAppId)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffb020] text-[#0b0b0c] font-display text-sm font-bold hover:bg-[#ffba4b] transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {typeof item.progressPct === 'number' &&
                    item.progressPct < 100
                      ? `Resume in ${selectedApp?.name || 'App'}`
                      : `Watch in ${selectedApp?.name || 'App'}`}
                  </span>
                </button>

                <a
                  href={item.imdbUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#221f26] border border-[#35303a] text-sm font-display font-semibold text-[#f3ede2] hover:border-[#ffb020] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open on IMDb</span>
                </a>
              </div>

              {uninstalledOffers.length > 0 && (
                <div className="pt-3 border-t border-[#2a262c] space-y-2.5">
                  <p className="text-xs font-display font-semibold text-[#a89f91]">
                    Available on Apps Not Installed
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {uninstalledOffers.slice(0, 4).map((offer) => (
                      <button
                        key={offer.appId}
                        type="button"
                        onClick={() => onInstallApp?.(offer)}
                        className="inline-flex items-center gap-2.5 pr-3.5 pl-1.5 py-1.5 rounded-xl bg-[#141315] border border-[#35303a] hover:border-[#ffb020] text-xs font-display font-semibold text-[#f3ede2] transition-colors cursor-pointer"
                      >
                        <span className="w-9 h-6 rounded-md overflow-hidden shrink-0">
                          <AppLogoMark
                            appId={offer.appId}
                            shortCode={offer.shortCode}
                            accentColor={offer.accentColor}
                          />
                        </span>
                        <span>Install {offer.name}</span>
                        <Download className="w-3.5 h-3.5 text-[#ffb020]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* More from IMDb Suggestions */}
        <div className="space-y-3 pt-4 border-t border-[#2a262c]">
          <h3 className="font-display text-lg font-semibold text-[#f3ede2]">
            More from IMDb Suggestions
          </h3>
          {loadingRelated ? (
            <p className="text-sm text-[#a89f91]">
              Fetching related IMDb suggestions...
            </p>
          ) : related.length === 0 ? (
            <p className="text-sm text-[#a89f91]">
              No additional IMDb titles found for this cast seed.
            </p>
          ) : (
            <div className="flex items-stretch gap-5 overflow-x-auto no-scrollbar py-2">
              {related.map((rel) => (
                <PosterCard
                  key={rel.id}
                  item={{
                    id: rel.id,
                    title: rel.title,
                    year: rel.year,
                    typeLabel: rel.type,
                    imageUrl: rel.imageUrl,
                    cast: rel.cast,
                    sourceAppName: `IMDb #${rel.rank.toLocaleString()}`,
                  }}
                  onSelect={() => onSelectRelated(rel)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
