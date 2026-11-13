export type LauncherSection = 'home' | 'find' | 'apps';

export interface InstalledApp {
  id: string;
  name: string;
  shortCode: string;
  category: string;
  accentColor: string;
  grantedAccess: boolean;
  lastSyncedAt: string;
  permissionsNote: string;
}

export interface SeenHistoryItem {
  id: string; // IMDb title ID (e.g. tt11280740)
  title: string;
  year: number | null;
  type: 'movie' | 'tvSeries' | 'tvMiniSeries' | 'video';
  cast: string;
  imageUrl: string;
  appId: string;
  progressPct: number; // 0 - 100
  episodeLabel?: string;
  lastWatchedAt: string; // ISO timestamp
  genres: string[];
  videoFormat?: string;
}

export interface ImdbSuggestionRaw {
  id: string;
  l: string;
  q?: string;
  qid?: string;
  rank?: number;
  s?: string;
  y?: number;
  i?: {
    height?: number;
    imageUrl?: string;
    width?: number;
  };
}

export type FindAvailabilityScope = 'all' | 'installed' | 'uninstalled';

export interface StreamingProviderOffer {
  appId: string;
  name: string;
  shortCode: string;
  accentColor: string;
  monetizationType: 'Stream' | 'Free' | 'Ads' | 'Rent' | 'Buy';
  installed: boolean;
  webUrl?: string;
}

export interface ImdbSuggestionItem {
  id: string;
  title: string;
  year: number | null;
  type: string;
  cast: string;
  rank: number;
  imageUrl: string;
  imdbUrl: string;
  whySuggested?: string;
  sourceAppId?: string;
  sourceAppName?: string;
  seedTitle?: string;
  availableOn?: StreamingProviderOffer[];
}

export interface RecommendationSeed {
  id: string;
  query: string;
  queries: string[];
  reasonLabel: string;
  sourceAppId: string;
  sourceAppName: string;
  seedTitle: string;
  priority: number;
}

export interface RecommendationShelf {
  id: string;
  title: string;
  subtitle: string;
  sourceAppId: string;
  sourceAppName: string;
  seedTitle: string;
  queryUsed: string;
  items: ImdbSuggestionItem[];
}

export interface LauncherSettings {
  ambientDimmer: number; // 0 to 40
  autoRefreshImdb: boolean;
  showFormatTags: boolean;
  overscanSafeMode: boolean;
}
