import type {
  ImdbSuggestionItem,
  ImdbSuggestionRaw,
  InstalledApp,
  RecommendationSeed,
  SeenHistoryItem,
} from '../types/launcher';

/**
 * Resize an m.media-amazon.com IMDb poster URL cleanly for 10-foot UI cards
 * while preserving non-IMDb or unrecognized URLs intact.
 */
export function resizeImdbImageUrl(url: string, width = 600): string {
  if (!url) return '';
  if (!url.includes('m.media-amazon.com/images/')) return url;
  return url.replace(/\._V1_[^.]*\.jpg$/i, `._V1_SX${width}.jpg`);
}

/**
 * Filter seen history strictly to apps where the user has granted access.
 * Sorted by most recently watched descending.
 */
export function filterSeenHistoryByGrantedApps(
  history: SeenHistoryItem[],
  apps: InstalledApp[],
): SeenHistoryItem[] {
  const grantedIds = new Set(
    apps.filter((app) => app.grantedAccess).map((app) => app.id),
  );
  return history
    .filter((item) => grantedIds.has(item.appId))
    .slice()
    .sort(
      (a, b) =>
        new Date(b.lastWatchedAt).getTime() -
        new Date(a.lastWatchedAt).getTime(),
    );
}

/**
 * Toggle grantedAccess for a given app immutably and update sync timestamp when granted.
 */
export function toggleAppAccess(
  apps: InstalledApp[],
  appId: string,
  nowIso = new Date().toISOString(),
): InstalledApp[] {
  return apps.map((app) =>
    app.id === appId
      ? {
          ...app,
          grantedAccess: !app.grantedAccess,
          lastSyncedAt: !app.grantedAccess ? nowIso : app.lastSyncedAt,
        }
      : app,
  );
}

const TITLE_SIMILARITY_QUERIES: Record<string, string[]> = {
  tt11280740: ['Silo', 'Black Mirror', 'Mr. Robot', 'Dark', 'Devs', 'Counterpart'],
  tt15239678: ['Blade Runner 2049', 'Arrival', 'Foundation', 'The Expanse', 'Ex Machina', 'Dune: Prophecy'],
  tt12637874: ['Silo', 'Mad Max: Fury Road', 'Station Eleven', 'Snowpiercer', 'The 100', 'Twisted Metal'],
  tt9253284: ['Rogue One', 'The Mandalorian', 'Ahsoka', 'The Americans', 'Foundation', 'Battlestar Galactica'],
  tt11126994: ['Blue Eye Samurai', 'Castlevania', 'Cyberpunk: Edgerunners', 'Invincible', 'Love, Death & Robots', 'Into the Spider-Verse'],
  tt2788316: ['Blue Eye Samurai', 'The Last Samurai', 'Kingdom', 'Rome', 'Vikings', 'Marco Polo'],
  tt3581920: ['Chernobyl', 'Station Eleven', 'The Walking Dead', '28 Days Later', 'Children of Men', 'The Road'],
  tt0816692: ['Inception', 'Arrival', 'The Martian', 'Gravity', 'Ad Astra', 'Contact'],
  tt14452776: ['Succession', 'Boiling Point', 'Chef', 'Atlanta', 'Barry', 'Ted Lasso'],
  tt21209876: ['Jujutsu Kaisen', 'Demon Slayer', 'Chainsaw Man', 'Attack on Titan', 'Kaiju No. 8', 'One-Punch Man'],
  tt15398776: ['Chernobyl', 'The Imitation Game', 'Dunkirk', 'Tenet', 'Zodiac', 'Apollo 13'],
  tt9362722: ['Into the Spider-Verse', 'The Mitchells vs. the Machines', 'Puss in Boots: The Last Wish', 'Nimona', 'Big Hero 6', 'Teenage Mutant Ninja Turtles: Mutant Mayhem'],
};

const GENRE_SIMILARITY_QUERIES: Record<string, string[]> = {
  'Sci-Fi': ['Ex Machina', 'Arrival', 'Blade Runner 2049', 'Dark', 'Silo', 'Foundation'],
  Mystery: ['True Detective', 'Severance', 'Dark', 'Twin Peaks', 'Mindhunter', 'Zodiac'],
  Thriller: ['Sicario', 'Prisoners', 'Mr. Robot', 'The Americans', 'Nightcrawler', 'No Country for Old Men'],
  Drama: ['Succession', 'Chernobyl', 'Better Call Saul', 'The Sopranos', 'Mad Men', 'Fargo'],
  Action: ['John Wick', 'Mad Max: Fury Road', 'Top Gun: Maverick', 'The Raid', 'Nobody', 'Mission: Impossible'],
  Animation: ['Blue Eye Samurai', 'Into the Spider-Verse', 'Princess Mononoke', 'Spirited Away', 'Invincible', 'Pluto'],
  Anime: ['Jujutsu Kaisen', 'Attack on Titan', 'Frieren', 'Cyberpunk: Edgerunners', 'Vinland Saga', 'Chainsaw Man'],
  History: ['Chernobyl', 'Gladiator', 'Master and Commander', 'Rome', 'Kingdom of Heaven', '1917'],
  Adventure: ['The Lord of the Rings', 'Mad Max: Fury Road', 'Pirates of the Caribbean', 'Indiana Jones', 'The Revenant', 'Life of Pi'],
  Comedy: ['Ted Lasso', 'Fleabag', 'The Grand Budapest Hotel', 'What We Do in the Shadows', 'Barry', 'Atlanta'],
};

/**
 * Build deterministic IMDb suggestion search seeds strictly from granted seen history.
 * Maps watched titles and genres to high-signal IMDb title queries so IMDb's suggestion API
 * returns acclaimed films and series with verified posters.
 */
export function buildImdbSeedQueries(
  grantedHistory: SeenHistoryItem[],
  apps: InstalledApp[],
  maxSeeds = 6,
): RecommendationSeed[] {
  if (grantedHistory.length === 0) return [];

  const appMap = new Map(apps.map((app) => [app.id, app]));
  const seeds: RecommendationSeed[] = [];

  for (let i = 0; i < grantedHistory.length && seeds.length < maxSeeds; i++) {
    const item = grantedHistory[i];
    const app = appMap.get(item.appId);
    const sourceAppName = app ? app.name : item.appId;

    const curated = TITLE_SIMILARITY_QUERIES[item.id];
    const genreFallback = item.genres.flatMap(
      (g) => GENRE_SIMILARITY_QUERIES[g] || [],
    );
    const queries = Array.from(
      new Set(
        curated && curated.length > 0
          ? curated
          : genreFallback.length > 0
            ? genreFallback
            : [item.title.replace(/[:\-–].*$/, '').trim()],
      ),
    ).slice(0, 6);

    seeds.push({
      id: `seed-${item.appId}-${item.id}`,
      query: queries[0] || item.title,
      queries,
      reasonLabel: `Because you watched ${item.title} on ${sourceAppName}`,
      sourceAppId: item.appId,
      sourceAppName,
      seedTitle: item.title,
      priority: 100 - i * 8,
    });
  }

  return seeds.sort((a, b) => b.priority - a.priority).slice(0, maxSeeds);
}

const ALLOWED_IMDB_QIDS = new Set([
  'movie',
  'feature',
  'tvSeries',
  'TV series',
  'tvMiniSeries',
  'TV mini series',
]);

/**
 * Normalize raw IMDb suggestion records into clean Launcher items,
 * filtering out non-titles (nm*, in*), commercials/videos, and entries without valid posters.
 */
export function normalizeImdbSuggestions(
  rawItems: ImdbSuggestionRaw[],
  excludeImdbIds: Set<string>,
  seedMeta?: Pick<
    RecommendationSeed,
    'reasonLabel' | 'sourceAppId' | 'sourceAppName' | 'seedTitle'
  >,
): ImdbSuggestionItem[] {
  const seen = new Set<string>();
  const normalized: ImdbSuggestionItem[] = [];

  for (const raw of rawItems) {
    if (!raw || !raw.id || !raw.id.startsWith('tt')) continue;
    if (excludeImdbIds.has(raw.id) || seen.has(raw.id)) continue;
    const rawImage = raw.i?.imageUrl;
    if (!rawImage) continue;

    const qid = raw.qid || raw.q || 'movie';
    if (!ALLOWED_IMDB_QIDS.has(qid)) continue;

    const rank = typeof raw.rank === 'number' ? raw.rank : 99999;
    if (rank > 30000) continue;

    seen.add(raw.id);
    normalized.push({
      id: raw.id,
      title: raw.l,
      year: typeof raw.y === 'number' ? raw.y : null,
      type: formatImdbTypeLabel(qid),
      cast: raw.s || 'IMDb Featured Cast',
      rank,
      imageUrl: resizeImdbImageUrl(rawImage, 600),
      imdbUrl: `https://www.imdb.com/title/${raw.id}/`,
      whySuggested: seedMeta?.reasonLabel,
      sourceAppId: seedMeta?.sourceAppId,
      sourceAppName: seedMeta?.sourceAppName,
      seedTitle: seedMeta?.seedTitle,
    });
  }

  return normalized.sort((a, b) => a.rank - b.rank);
}

export function formatImdbTypeLabel(qid: string): string {
  switch (qid) {
    case 'tvSeries':
    case 'TV series':
      return 'TV Series';
    case 'tvMiniSeries':
    case 'TV mini series':
      return 'Limited Series';
    case 'tvSpecial':
      return 'TV Special';
    case 'short':
      return 'Short';
    case 'movie':
    case 'feature':
    default:
      return 'Movie';
  }
}

/**
 * Add or update a title in the user's seen history for a given app.
 */
export function recordWatchEvent(
  history: SeenHistoryItem[],
  entry: {
    id: string;
    title: string;
    year: number | null;
    type: SeenHistoryItem['type'];
    cast: string;
    imageUrl: string;
    genres?: string[];
    videoFormat?: string;
    episodeLabel?: string;
  },
  appId: string,
  progressPct: number,
  nowIso = new Date().toISOString(),
): SeenHistoryItem[] {
  const clamped = Math.max(5, Math.min(100, Math.round(progressPct)));
  const existingIdx = history.findIndex(
    (item) => item.id === entry.id && item.appId === appId,
  );

  if (existingIdx >= 0) {
    const updated = history.slice();
    updated[existingIdx] = {
      ...updated[existingIdx],
      progressPct: clamped,
      episodeLabel: entry.episodeLabel ?? updated[existingIdx].episodeLabel,
      lastWatchedAt: nowIso,
    };
    return updated;
  }

  const newItem: SeenHistoryItem = {
    id: entry.id,
    title: entry.title,
    year: entry.year,
    type: entry.type,
    cast: entry.cast,
    imageUrl: resizeImdbImageUrl(entry.imageUrl, 600),
    appId,
    progressPct: clamped,
    episodeLabel: entry.episodeLabel,
    lastWatchedAt: nowIso,
    genres: entry.genres && entry.genres.length > 0 ? entry.genres : ['Drama'],
    videoFormat: entry.videoFormat ?? '4K HDR',
  };

  return [newItem, ...history];
}

/**
 * Deterministic 2D D-Pad focus navigation across horizontal shelves.
 */
export function moveDpadFocus(
  current: { row: number; col: number },
  direction: 'up' | 'down' | 'left' | 'right',
  rowLengths: number[],
): { row: number; col: number } {
  if (rowLengths.length === 0) return current;
  let { row, col } = current;
  row = Math.max(0, Math.min(rowLengths.length - 1, row));
  const currentLen = Math.max(1, rowLengths[row] || 1);
  col = Math.max(0, Math.min(currentLen - 1, col));

  if (direction === 'left') {
    return { row, col: Math.max(0, col - 1) };
  }
  if (direction === 'right') {
    return { row, col: Math.min(currentLen - 1, col + 1) };
  }
  if (direction === 'up') {
    for (let r = row - 1; r >= 0; r--) {
      if (rowLengths[r] > 0) {
        return { row: r, col: Math.min(col, rowLengths[r] - 1) };
      }
    }
    return { row, col };
  }
  if (direction === 'down') {
    for (let r = row + 1; r < rowLengths.length; r++) {
      if (rowLengths[r] > 0) {
        return { row: r, col: Math.min(col, rowLengths[r] - 1) };
      }
    }
    return { row, col };
  }
  return { row, col };
}

export interface CanonicalStreamingProvider {
  appId: string;
  name: string;
  shortCode: string;
  category: string;
  accentColor: string;
  jwShortNames: string[];
}

export const STREAMING_PROVIDER_CATALOG: CanonicalStreamingProvider[] = [
  {
    appId: 'prime',
    name: 'Prime Video',
    shortCode: 'PRIME',
    category: 'Movies & Originals',
    accentColor: '#00A8E1',
    jwShortNames: ['amp', 'pva', 'aim'],
  },
  {
    appId: 'apple',
    name: 'Apple TV+',
    shortCode: 'TV+',
    category: 'Prestige Drama',
    accentColor: '#D7C4AD',
    jwShortNames: ['atp'],
  },
  {
    appId: 'max',
    name: 'Max',
    shortCode: 'MAX',
    category: 'HBO & Cinema',
    accentColor: '#0038FF',
    jwShortNames: ['mxx', 'aho'],
  },
  {
    appId: 'disney',
    name: 'Disney+',
    shortCode: 'D+',
    category: 'Sci-Fi & Studio',
    accentColor: '#113CCF',
    jwShortNames: ['dnp'],
  },
  {
    appId: 'netflix',
    name: 'Netflix',
    shortCode: 'NFX',
    category: 'Series & Animation',
    accentColor: '#E50914',
    jwShortNames: ['nfx', 'nfa', 'nfk'],
  },
  {
    appId: 'hulu',
    name: 'Hulu',
    shortCode: 'HULU',
    category: 'FX & Live TV',
    accentColor: '#1CE783',
    jwShortNames: ['hlu'],
  },
  {
    appId: 'crunchyroll',
    name: 'Crunchyroll',
    shortCode: 'CR',
    category: 'Anime',
    accentColor: '#F47521',
    jwShortNames: ['cru'],
  },
  {
    appId: 'peacock',
    name: 'Peacock',
    shortCode: 'PCK',
    category: 'Cinema & Sports',
    accentColor: '#F59E0B',
    jwShortNames: ['pct', 'pcp', 'ptf'],
  },
  {
    appId: 'plex',
    name: 'Plex',
    shortCode: 'PLEX',
    category: 'Home Library',
    accentColor: '#E5A00D',
    jwShortNames: ['plx', 'plf'],
  },
  {
    appId: 'paramount',
    name: 'Paramount+',
    shortCode: 'P+',
    category: 'Cinema & Series',
    accentColor: '#0064FF',
    jwShortNames: ['ppp', 'ppe', 'ppa', 'app'],
  },
  {
    appId: 'mgm',
    name: 'MGM+',
    shortCode: 'MGM+',
    category: 'Originals & Film',
    accentColor: '#C6933E',
    jwShortNames: ['epx', 'aep', 'erk'],
  },
  {
    appId: 'amc',
    name: 'AMC+',
    shortCode: 'AMC+',
    category: 'Drama & Horror',
    accentColor: '#117B9E',
    jwShortNames: ['acp', 'aat', 'amc'],
  },
  {
    appId: 'starz',
    name: 'STARZ',
    shortCode: 'STRZ',
    category: 'Originals',
    accentColor: '#0E2439',
    jwShortNames: ['stz', 'szt'],
  },
  {
    appId: 'mubi',
    name: 'MUBI',
    shortCode: 'MUBI',
    category: 'Curated Cinema',
    accentColor: '#001B99',
    jwShortNames: ['mbi'],
  },
  {
    appId: 'tubi',
    name: 'Tubi',
    shortCode: 'TUBI',
    category: 'Free Streaming',
    accentColor: '#FA382F',
    jwShortNames: ['tbv'],
  },
  {
    appId: 'roku',
    name: 'The Roku Channel',
    shortCode: 'ROKU',
    category: 'Free Streaming',
    accentColor: '#6C3C97',
    jwShortNames: ['rkc', 'rcf'],
  },
  {
    appId: 'pluto',
    name: 'Pluto TV',
    shortCode: 'PLUTO',
    category: 'Free Live & VOD',
    accentColor: '#25252B',
    jwShortNames: ['ptv', 'ptl'],
  },
  {
    appId: 'fubo',
    name: 'fuboTV',
    shortCode: 'FUBO',
    category: 'Live & Entertainment',
    accentColor: '#E65100',
    jwShortNames: ['fuv'],
  },
];

const JW_SHORT_TO_PROVIDER = new Map<string, CanonicalStreamingProvider>();
for (const provider of STREAMING_PROVIDER_CATALOG) {
  for (const short of provider.jwShortNames) {
    JW_SHORT_TO_PROVIDER.set(short, provider);
  }
}

export function canonicalizeJustWatchPackage(
  shortName?: string,
  clearName?: string,
): CanonicalStreamingProvider | null {
  if (shortName && JW_SHORT_TO_PROVIDER.has(shortName)) {
    return JW_SHORT_TO_PROVIDER.get(shortName)!;
  }
  const lower = (clearName || '').toLowerCase();
  if (!lower) return null;
  if (lower.includes('prime video') || lower === 'amazon') {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'prime')!;
  }
  if (lower.includes('apple tv+')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'apple')!;
  }
  if (lower === 'apple tv') {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'apple')!;
  }
  if (lower.includes('hbo max') || lower === 'max') {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'max')!;
  }
  if (lower.includes('disney')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'disney')!;
  }
  if (lower.includes('netflix')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'netflix')!;
  }
  if (lower.includes('hulu')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'hulu')!;
  }
  if (lower.includes('crunchyroll')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'crunchyroll')!;
  }
  if (lower.includes('peacock')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'peacock')!;
  }
  if (lower.includes('plex')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'plex')!;
  }
  if (lower.includes('paramount')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'paramount')!;
  }
  if (lower.includes('mgm')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'mgm')!;
  }
  if (lower.includes('amc')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'amc')!;
  }
  if (lower.includes('starz')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'starz')!;
  }
  if (lower.includes('mubi')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'mubi')!;
  }
  if (lower.includes('tubi')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'tubi')!;
  }
  if (lower.includes('roku')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'roku')!;
  }
  if (lower.includes('pluto')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'pluto')!;
  }
  if (lower.includes('fubo')) {
    return STREAMING_PROVIDER_CATALOG.find((p) => p.appId === 'fubo')!;
  }
  return null;
}

export function formatJustWatchPosterUrl(posterUrl?: string | null): string {
  if (!posterUrl) return '';
  if (posterUrl.startsWith('http')) return posterUrl;
  const resolved = posterUrl
    .replace('{profile}', 's592')
    .replace('{format}', 'jpg');
  return `https://images.justwatch.com${resolved}`;
}

export interface JustWatchFilterSpec {
  searchQuery?: string;
  genres?: string[];
  objectTypes?: string[];
  packages?: string[];
}

export function buildJustWatchFilter(query: string): JustWatchFilterSpec {
  const cleaned = query.trim();
  const lower = cleaned.toLowerCase();

  // App-specific search shortcuts (installed & uninstalled apps)
  const matchingApp = STREAMING_PROVIDER_CATALOG.find(
    (p) =>
      lower === p.name.toLowerCase() ||
      lower === p.appId.toLowerCase() ||
      lower === p.shortCode.toLowerCase(),
  );
  if (matchingApp) {
    return { packages: matchingApp.jwShortNames };
  }

  // Genre & curated topic mappings so topic pills always load real titles
  if (lower === 'sci-fi thriller' || lower === 'sci-fi') {
    return { genres: ['scf', 'trl'] };
  }
  if (lower === 'mystery series' || lower === 'mystery') {
    return { genres: ['trl'], objectTypes: ['SHOW'] };
  }
  if (lower === 'anime') {
    return { packages: ['cru'] };
  }
  if (lower === 'action') {
    return { genres: ['act'] };
  }
  if (lower === 'drama') {
    return { genres: ['drm'] };
  }
  if (lower === 'comedy') {
    return { genres: ['cmy'] };
  }

  return { searchQuery: cleaned };
}

export function normalizeJustWatchOffers(
  rawOffers: Array<{
    monetizationType?: string;
    standardWebURL?: string;
    package?: { shortName?: string; clearName?: string; technicalName?: string };
  }>,
  installedAppIds: Set<string>,
) {
  const priorityMap: Record<string, number> = {
    FLATRATE: 1,
    FREE: 2,
    ADS: 3,
    RENT: 4,
    BUY: 5,
  };
  const labelMap: Record<string, 'Stream' | 'Free' | 'Ads' | 'Rent' | 'Buy'> = {
    FLATRATE: 'Stream',
    FREE: 'Free',
    ADS: 'Ads',
    RENT: 'Rent',
    BUY: 'Buy',
  };

  const byApp = new Map<
    string,
    {
      appId: string;
      name: string;
      shortCode: string;
      accentColor: string;
      monetizationType: 'Stream' | 'Free' | 'Ads' | 'Rent' | 'Buy';
      installed: boolean;
      webUrl?: string;
      priority: number;
    }
  >();

  for (const offer of rawOffers) {
    const type = offer.monetizationType || '';
    const priority = priorityMap[type];
    if (!priority) continue;

    const provider = canonicalizeJustWatchPackage(
      offer.package?.shortName,
      offer.package?.clearName,
    );
    if (!provider) continue;

    const existing = byApp.get(provider.appId);
    if (!existing || priority < existing.priority) {
      byApp.set(provider.appId, {
        appId: provider.appId,
        name: provider.name,
        shortCode: provider.shortCode,
        accentColor: provider.accentColor,
        monetizationType: labelMap[type] || 'Stream',
        installed: installedAppIds.has(provider.appId),
        webUrl: offer.standardWebURL,
        priority,
      });
    }
  }

  return Array.from(byApp.values())
    .sort((a, b) => {
      if (a.installed !== b.installed) return a.installed ? -1 : 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.name.localeCompare(b.name);
    })
    .map(({ priority: _p, ...rest }) => rest);
}

export function filterFindResultsByScope<
  T extends { availableOn?: Array<{ installed: boolean }> },
>(items: T[], scope: 'all' | 'installed' | 'uninstalled'): T[] {
  if (scope === 'all') return items;
  if (scope === 'installed') {
    return items.filter((item) =>
      item.availableOn?.some(
        (offer) =>
          offer.installed &&
          (offer as { monetizationType?: string }).monetizationType !== 'Rent' &&
          (offer as { monetizationType?: string }).monetizationType !== 'Buy',
      ) || item.availableOn?.some((offer) => offer.installed),
    );
  }
  return items
    .filter((item) => item.availableOn?.some((offer) => !offer.installed))
    .slice()
    .sort((a, b) => {
      const aHasInstalled = a.availableOn?.some((o) => o.installed) ? 1 : 0;
      const bHasInstalled = b.availableOn?.some((o) => o.installed) ? 1 : 0;
      return aHasInstalled - bHasInstalled;
    });
}

