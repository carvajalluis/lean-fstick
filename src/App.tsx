import { useCallback, useEffect, useMemo, useState } from 'react';
import { INITIAL_APPS, INITIAL_SEEN_HISTORY } from './data/seedCatalog';
import type {
  ImdbSuggestionItem,
  InstalledApp,
  LauncherSection,
  RecommendationShelf,
  SeenHistoryItem,
  StreamingProviderOffer,
} from './types/launcher';
import {
  filterSeenHistoryByGrantedApps,
  formatImdbTypeLabel,
  recordWatchEvent,
} from './utils/launcherLogic';
import { LeftNavRail } from './components/LeftNavRail';
import { HomeView } from './components/HomeView';
import { FindView } from './components/FindView';
import { AppsGridView } from './components/AppsGridView';
import {
  TitleDetailModal,
  type ModalTitleContext,
} from './components/TitleDetailModal';
import type { HeroFeatureItem } from './components/HeroSpotlight';

const STORAGE_KEYS = {
  apps: 'nocturne_fire_apps_v2',
  history: 'nocturne_fire_history_v1',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState<LauncherSection>('home');
  const [apps, setApps] = useState<InstalledApp[]>(() =>
    loadStored(STORAGE_KEYS.apps, INITIAL_APPS),
  );
  const [allHistory, setAllHistory] = useState<SeenHistoryItem[]>(() =>
    loadStored(STORAGE_KEYS.history, INITIAL_SEEN_HISTORY),
  );

  const [shelves, setShelves] = useState<RecommendationShelf[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<
    string | null
  >(null);

  const [modalItem, setModalItem] = useState<ModalTitleContext | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.apps, JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(allHistory));
  }, [allHistory]);

  const grantedHistory = useMemo(
    () => filterSeenHistoryByGrantedApps(allHistory, apps),
    [allHistory, apps],
  );

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const fetchRecommendations = useCallback(
    async (currentHistory: SeenHistoryItem[], currentApps: InstalledApp[]) => {
      const granted = filterSeenHistoryByGrantedApps(
        currentHistory,
        currentApps,
      );
      if (granted.length === 0) {
        setShelves([]);
        setRecommendationsError(null);
        return;
      }

      setLoadingRecommendations(true);
      setRecommendationsError(null);
      try {
        const resp = await fetch('/api/imdb/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seenHistory: currentHistory,
            apps: currentApps,
            maxShelves: 5,
          }),
        });
        const data = (await resp.json()) as {
          shelves?: RecommendationShelf[];
          error?: string;
        };
        if (!resp.ok) {
          throw new Error(data.error || `IMDb request failed (${resp.status})`);
        }
        setShelves(Array.isArray(data.shelves) ? data.shelves : []);
      } catch (err) {
        setRecommendationsError(
          err instanceof Error
            ? err.message
            : 'Unable to fetch IMDb suggestions',
        );
      } finally {
        setLoadingRecommendations(false);
      }
    },
    [],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeSection]);

  useEffect(() => {
    void fetchRecommendations(allHistory, apps);
  }, [allHistory, apps, fetchRecommendations]);

  const openHistoryModal = (item: SeenHistoryItem) => {
    setModalItem({
      id: item.id,
      title: item.title,
      year: item.year,
      typeLabel: formatImdbTypeLabel(item.type),
      rawType: item.type,
      cast: item.cast,
      imageUrl: item.imageUrl,
      imdbUrl: `https://www.imdb.com/title/${item.id}/`,
      defaultAppId: item.appId,
      progressPct: item.progressPct,
      episodeLabel: item.episodeLabel,
      whySuggested: `In your ${
        apps.find((a) => a.id === item.appId)?.name || item.appId
      } seen history`,
    });
  };

  const openImdbModal = (item: ImdbSuggestionItem) => {
    const rawType: ModalTitleContext['rawType'] =
      item.type === 'TV Series'
        ? 'tvSeries'
        : item.type === 'Limited Series'
          ? 'tvMiniSeries'
          : 'movie';
    setModalItem({
      id: item.id,
      title: item.title,
      year: item.year,
      typeLabel: item.type,
      rawType,
      cast: item.cast,
      imageUrl: item.imageUrl,
      imdbUrl: item.imdbUrl,
      defaultAppId: item.sourceAppId,
      whySuggested: item.whySuggested,
      availableOn: item.availableOn,
    });
  };

  const handleWatchInApp = (item: ModalTitleContext, appId: string) => {
    const targetApp = apps.find((a) => a.id === appId);
    const existing = allHistory.find(
      (h) => h.id === item.id && h.appId === appId,
    );
    const appReportedProgress = existing
      ? existing.progressPct < 100
        ? Math.min(100, existing.progressPct + 18)
        : 100
      : 25;

    const updatedHistory = recordWatchEvent(
      allHistory,
      {
        id: item.id,
        title: item.title,
        year: item.year,
        type: item.rawType,
        cast: item.cast,
        imageUrl: item.imageUrl,
        episodeLabel:
          appReportedProgress >= 100
            ? 'Watched in Full'
            : `${appReportedProgress}% watched in ${targetApp?.name || appId}`,
      },
      appId,
      appReportedProgress,
    );
    setAllHistory(updatedHistory);
    setModalItem(null);

    showNotice(
      `Launched "${item.title}" in ${targetApp?.name || appId} · ${appReportedProgress}% watched`,
    );
  };

  const handleLaunchOrResumeHero = (hero: HeroFeatureItem) => {
    const histMatch = grantedHistory.find((h) => h.id === hero.id);
    if (histMatch) {
      openHistoryModal(histMatch);
      return;
    }
    for (const shelf of shelves) {
      const sug = shelf.items.find((i) => i.id === hero.id);
      if (sug) {
        openImdbModal(sug);
        return;
      }
    }
  };

  const handleOpenApp = (app: InstalledApp) => {
    showNotice(`Launching ${app.name}`);
  };

  const handleInstallApp = (offer: StreamingProviderOffer) => {
    setApps((prev) => {
      if (prev.some((a) => a.id === offer.appId)) return prev;
      return [
        ...prev,
        {
          id: offer.appId,
          name: offer.name,
          shortCode: offer.shortCode,
          category: offer.monetizationType,
          accentColor: offer.accentColor,
          grantedAccess: true,
          lastSyncedAt: new Date().toISOString(),
          permissionsNote: 'Watch history synced',
        },
      ];
    });
    setModalItem((prev) =>
      prev
        ? {
            ...prev,
            defaultAppId: offer.appId,
            availableOn: prev.availableOn?.map((o) =>
              o.appId === offer.appId ? { ...o, installed: true } : o,
            ),
          }
        : null,
    );
    showNotice(`Installed ${offer.name} to your launcher`);
  };

  const handleOpenSystemSettings = () => {
    if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
      window.location.href =
        'intent:#Intent;action=android.settings.SETTINGS;package=com.amazon.tv.settings;end';
    }
    showNotice('Launching Fire TV Settings (android.settings.SETTINGS)');
  };

  return (
    <div
      className="flex min-h-screen bg-[#0b0b0c] text-[#f3ede2] relative"
      data-testid="firestick-launcher-root"
    >
      <LeftNavRail
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onOpenSystemSettings={handleOpenSystemSettings}
      />

      <div className="flex-1 min-w-0 px-6 md:px-10 lg:px-14 py-6 md:py-8">
        <div className="max-w-[1440px] mx-auto space-y-8">
          {notice && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-[#524533] bg-[#211e24] px-5 py-3 text-sm font-display font-semibold text-[#ffd59b]"
            >
              {notice}
            </div>
          )}

          <main id="launcher-main">
            {activeSection === 'home' && (
              <HomeView
                apps={apps}
                grantedHistory={grantedHistory}
                shelves={shelves}
                loadingRecommendations={loadingRecommendations}
                recommendationsError={recommendationsError}
                onRefreshRecommendations={() =>
                  void fetchRecommendations(allHistory, apps)
                }
                onSelectHistoryItem={openHistoryModal}
                onSelectImdbItem={openImdbModal}
                onLaunchOrResume={handleLaunchOrResumeHero}
                onOpenApp={handleOpenApp}
                onOpenFind={() => setActiveSection('find')}
                isModalOpen={Boolean(modalItem)}
              />
            )}

            {activeSection === 'find' && (
              <FindView apps={apps} onSelectImdbItem={openImdbModal} />
            )}

            {activeSection === 'apps' && (
              <AppsGridView apps={apps} onLaunchApp={handleOpenApp} />
            )}
          </main>
        </div>
      </div>

      <TitleDetailModal
        item={modalItem}
        apps={apps}
        onClose={() => setModalItem(null)}
        onWatchInApp={handleWatchInApp}
        onInstallApp={handleInstallApp}
        onSelectRelated={openImdbModal}
      />
    </div>
  );
}
