import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildImdbSeedQueries,
  buildJustWatchFilter,
  filterFindResultsByScope,
  filterSeenHistoryByGrantedApps,
  formatJustWatchPosterUrl,
  moveDpadFocus,
  normalizeImdbSuggestions,
  normalizeJustWatchOffers,
  recordWatchEvent,
  resizeImdbImageUrl,
  toggleAppAccess,
} from './launcherLogic';
import type { InstalledApp, SeenHistoryItem } from '../types/launcher';

const sampleApps: InstalledApp[] = [
  {
    id: 'apple',
    name: 'Apple TV+',
    shortCode: 'TV+',
    category: 'Originals',
    accentColor: '#ffb020',
    grantedAccess: true,
    lastSyncedAt: '2026-11-13T06:00:00.000Z',
    permissionsNote: 'Syncs recently watched episodes',
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    shortCode: 'CR',
    category: 'Anime',
    accentColor: '#e06c53',
    grantedAccess: false,
    lastSyncedAt: '2026-11-10T06:00:00.000Z',
    permissionsNote: 'Access locked',
  },
];

const sampleHistory: SeenHistoryItem[] = [
  {
    id: 'tt11280740',
    title: 'Severance',
    year: 2022,
    type: 'tvSeries',
    cast: 'Adam Scott, Britt Lower',
    imageUrl:
      'https://m.media-amazon.com/images/M/MV5BZDI5YzJhODQt._V1_.jpg',
    appId: 'apple',
    progressPct: 68,
    episodeLabel: 'S2 · E3',
    lastWatchedAt: '2026-11-13T05:00:00.000Z',
    genres: ['Sci-Fi', 'Thriller'],
  },
  {
    id: 'tt21209876',
    title: 'Solo Leveling',
    year: 2024,
    type: 'tvSeries',
    cast: 'Taito Ban, Aleks Le',
    imageUrl:
      'https://m.media-amazon.com/images/M/MV5BM2M4YzdkMTEt._V1_.jpg',
    appId: 'crunchyroll',
    progressPct: 45,
    episodeLabel: 'S1 · E6',
    lastWatchedAt: '2026-11-13T06:30:00.000Z',
    genres: ['Anime', 'Action'],
  },
];

test('filterSeenHistoryByGrantedApps excludes ungranted apps and sorts newest first', () => {
  const grantedOnly = filterSeenHistoryByGrantedApps(sampleHistory, sampleApps);
  assert.equal(grantedOnly.length, 1);
  assert.equal(grantedOnly[0].id, 'tt11280740');

  const afterGrant = toggleAppAccess(sampleApps, 'crunchyroll');
  const bothGranted = filterSeenHistoryByGrantedApps(sampleHistory, afterGrant);
  assert.equal(bothGranted.length, 2);
  assert.equal(bothGranted[0].id, 'tt21209876');
});

test('buildImdbSeedQueries derives attribution-linked IMDb queries only from granted history', () => {
  const grantedOnly = filterSeenHistoryByGrantedApps(sampleHistory, sampleApps);
  const seeds = buildImdbSeedQueries(grantedOnly, sampleApps, 4);
  assert.ok(seeds.length >= 1);
  assert.ok(seeds.every((s) => s.sourceAppId === 'apple'));
  assert.ok(seeds[0].queries.includes('Silo'));
});

test('buildImdbSeedQueries returns empty array when all apps are revoked', () => {
  const allRevoked = toggleAppAccess(sampleApps, 'apple');
  const granted = filterSeenHistoryByGrantedApps(sampleHistory, allRevoked);
  assert.equal(granted.length, 0);
  assert.deepEqual(buildImdbSeedQueries(granted, allRevoked), []);
});

test('normalizeImdbSuggestions excludes already seen titles, non-title records, and formats posters', () => {
  const raw = [
    {
      id: 'nm0000123',
      l: 'Adam Scott',
      s: 'Actor',
      i: { imageUrl: 'https://m.media-amazon.com/images/M/actor._V1_.jpg' },
    },
    {
      id: 'tt11280740',
      l: 'Severance',
      y: 2022,
      qid: 'tvSeries',
      rank: 10,
      i: { imageUrl: 'https://m.media-amazon.com/images/M/sev._V1_.jpg' },
    },
    {
      id: 'tt0499549',
      l: 'Parks and Recreation',
      y: 2009,
      qid: 'tvSeries',
      rank: 210,
      s: 'Amy Poehler, Adam Scott',
      i: { imageUrl: 'https://m.media-amazon.com/images/M/parks._V1_.jpg' },
    },
  ];
  const seenIds = new Set(['tt11280740']);
  const results = normalizeImdbSuggestions(raw, seenIds, {
    reasonLabel: 'Starring Adam Scott',
    sourceAppId: 'apple',
    sourceAppName: 'Apple TV+',
    seedTitle: 'Severance',
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'tt0499549');
  assert.equal(results[0].type, 'TV Series');
  assert.equal(
    results[0].imageUrl,
    'https://m.media-amazon.com/images/M/parks._V1_SX600.jpg',
  );
  assert.equal(results[0].sourceAppName, 'Apple TV+');
});

test('recordWatchEvent adds new watch entry and updates existing progress', () => {
  const added = recordWatchEvent(
    sampleHistory,
    {
      id: 'tt0816692',
      title: 'Interstellar',
      year: 2014,
      type: 'movie',
      cast: 'Matthew McConaughey',
      imageUrl: 'https://m.media-amazon.com/images/M/inter._V1_.jpg',
    },
    'apple',
    32,
    '2026-11-13T07:00:00.000Z',
  );
  assert.equal(added.length, 3);
  assert.equal(added[0].id, 'tt0816692');
  assert.equal(added[0].progressPct, 32);

  const updated = recordWatchEvent(
    added,
    {
      id: 'tt0816692',
      title: 'Interstellar',
      year: 2014,
      type: 'movie',
      cast: 'Matthew McConaughey',
      imageUrl: 'https://m.media-amazon.com/images/M/inter._V1_.jpg',
    },
    'apple',
    88,
    '2026-11-13T07:30:00.000Z',
  );
  assert.equal(updated.length, 3);
  assert.equal(updated[0].progressPct, 88);
});

test('moveDpadFocus clamps across uneven shelf row lengths', () => {
  const rows = [6, 3, 5];
  assert.deepEqual(moveDpadFocus({ row: 0, col: 5 }, 'down', rows), {
    row: 1,
    col: 2,
  });
  assert.deepEqual(moveDpadFocus({ row: 1, col: 2 }, 'right', rows), {
    row: 1,
    col: 2,
  });
  assert.deepEqual(moveDpadFocus({ row: 1, col: 2 }, 'down', rows), {
    row: 2,
    col: 2,
  });
});

test('resizeImdbImageUrl rewrites _V1_.jpg suffix cleanly', () => {
  assert.equal(
    resizeImdbImageUrl(
      'https://m.media-amazon.com/images/M/ABC123._V1_.jpg',
      500,
    ),
    'https://m.media-amazon.com/images/M/ABC123._V1_SX500.jpg',
  );
});

test('buildJustWatchFilter resolves genre topics, streaming apps, and free-text queries', () => {
  assert.deepEqual(buildJustWatchFilter('Sci-Fi Thriller'), {
    genres: ['scf', 'trl'],
  });
  assert.deepEqual(buildJustWatchFilter('Paramount+'), {
    packages: ['ppp', 'ppe', 'ppa', 'app'],
  });
  assert.deepEqual(buildJustWatchFilter('Dune'), {
    searchQuery: 'Dune',
  });
});

test('normalizeJustWatchOffers separates installed and uninstalled apps and deduplicates', () => {
  const offers = normalizeJustWatchOffers(
    [
      {
        monetizationType: 'RENT',
        package: { shortName: 'amp', clearName: 'Amazon Video' },
      },
      {
        monetizationType: 'FLATRATE',
        package: { shortName: 'ppp', clearName: 'Paramount Plus Premium' },
      },
      {
        monetizationType: 'FLATRATE',
        package: { shortName: 'amp', clearName: 'Amazon Prime Video' },
      },
    ],
    new Set(['prime']),
  );

  assert.equal(offers.length, 2);
  assert.equal(offers[0].appId, 'prime');
  assert.equal(offers[0].installed, true);
  assert.equal(offers[0].monetizationType, 'Stream');
  assert.equal(offers[1].appId, 'paramount');
  assert.equal(offers[1].installed, false);
});

test('filterFindResultsByScope filters installed vs uninstalled titles cleanly', () => {
  const mockItems = [
    { id: '1', availableOn: [{ installed: true }, { installed: false }] },
    { id: '2', availableOn: [{ installed: false }] },
    { id: '3', availableOn: [{ installed: true }] },
  ];

  assert.equal(filterFindResultsByScope(mockItems, 'all').length, 3);
  assert.deepEqual(
    filterFindResultsByScope(mockItems, 'installed').map((x) => x.id),
    ['1', '3'],
  );
  assert.deepEqual(
    filterFindResultsByScope(mockItems, 'uninstalled').map((x) => x.id),
    ['2', '1'],
  );
  assert.equal(
    formatJustWatchPosterUrl('/poster/123/{profile}/slug.{format}'),
    'https://images.justwatch.com/poster/123/s592/slug.jpg',
  );
});
