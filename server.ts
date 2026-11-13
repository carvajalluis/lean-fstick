import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildImdbSeedQueries,
  buildJustWatchFilter,
  filterSeenHistoryByGrantedApps,
  formatJustWatchPosterUrl,
  normalizeImdbSuggestions,
  normalizeJustWatchOffers,
} from './src/utils/launcherLogic.ts';
import type {
  ImdbSuggestionItem,
  ImdbSuggestionRaw,
  InstalledApp,
  RecommendationShelf,
  SeenHistoryItem,
} from './src/types/launcher.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

interface CacheEntry<T> {
  expiresAt: number;
  data: T;
}

interface JustWatchEdgeRaw {
  node?: {
    id?: string;
    objectType?: string;
    content?: {
      title?: string;
      originalReleaseYear?: number;
      posterUrl?: string;
      externalIds?: { imdbId?: string | null };
      credits?: Array<{ name?: string }>;
    };
    offers?: Array<{
      monetizationType?: string;
      standardWebURL?: string;
      package?: {
        shortName?: string;
        clearName?: string;
        technicalName?: string;
      };
    }>;
  };
}

const suggestionCache = new Map<string, CacheEntry<ImdbSuggestionRaw[]>>();
const findCache = new Map<string, CacheEntry<JustWatchEdgeRaw[]>>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getImdbBucket(query: string): string {
  const first = query.trim().toLowerCase().charAt(0);
  return /^[a-z0-9]$/.test(first) ? first : 'x';
}

async function fetchImdbSuggestionsRaw(
  query: string,
): Promise<ImdbSuggestionRaw[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];

  const cacheKey = cleaned.toLowerCase();
  const cached = suggestionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const bucket = getImdbBucket(cleaned);
  const encoded = encodeURIComponent(cleaned.toLowerCase());
  const url = `https://v3.sg.media-imdb.com/suggestion/${bucket}/${encoded}.json`;

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`IMDb suggestion API returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { d?: ImdbSuggestionRaw[] };
  const items = Array.isArray(payload?.d) ? payload.d : [];
  suggestionCache.set(cacheKey, {
    data: items,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return items;
}

async function fetchJustWatchEdges(
  query: string,
): Promise<JustWatchEdgeRaw[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];

  const cacheKey = cleaned.toLowerCase();
  const cached = findCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const filter = buildJustWatchFilter(cleaned);
  const response = await fetch('https://apis.justwatch.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({
      query: `query FindTitles($filter: TitleFilter) {
        popularTitles(country: "US", first: 24, filter: $filter) {
          edges {
            node {
              id
              objectType
              content(country: "US", language: "en") {
                title
                originalReleaseYear
                posterUrl
                externalIds { imdbId }
                credits(role: ACTOR) { name }
              }
              offers(country: "US", platform: WEB) {
                monetizationType
                standardWebURL
                package { shortName clearName technicalName }
              }
            }
          }
        }
      }`,
      variables: { filter },
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`JustWatch API returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: { popularTitles?: { edges?: JustWatchEdgeRaw[] } };
  };
  const edges = payload?.data?.popularTitles?.edges || [];
  findCache.set(cacheKey, {
    data: edges,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return edges;
}

/**
 * Extract hotlinkable m.media-amazon.com image URLs from IMDb HTML when accessible,
 * falling back cleanly to IMDb suggestion JSON if WAF challenges the HTML fetch.
 */
async function extractHotlinkedImdbImages(queryOrUrl: string): Promise<{
  source: 'html' | 'suggestions';
  images: string[];
}> {
  const isUrl = /^https?:\/\/(www\.|m\.)?imdb\.com\//i.test(queryOrUrl);
  if (isUrl) {
    try {
      const resp = await fetch(queryOrUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html',
        },
        signal: AbortSignal.timeout(5000),
      });
      if (resp.ok) {
        const html = await resp.text();
        const matches = html.match(
          /https:\/\/m\.media-amazon\.com\/images\/M\/[A-Za-z0-9@._,-]+\.(?:jpg|jpeg|png)/gi,
        );
        if (matches && matches.length > 0) {
          return {
            source: 'html',
            images: Array.from(new Set(matches)).slice(0, 12),
          };
        }
      }
    } catch {
      // Fall through to IMDb suggestions API
    }
  }

  const raw = await fetchImdbSuggestionsRaw(
    isUrl ? queryOrUrl.replace(/^.*\/title\/(tt\d+).*$/, '$1') : queryOrUrl,
  );
  const images = raw
    .map((item) => item.i?.imageUrl)
    .filter((u): u is string => Boolean(u));
  return {
    source: 'suggestions',
    images: Array.from(new Set(images)),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'nocturne-fire-launcher' });
  });

  app.get('/api/find', async (req, res) => {
    const query = String(req.query.q || '').trim();
    const installedParam = String(req.query.installed || '').trim();
    const installedIds = new Set(
      installedParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );

    if (!query) {
      return res.json({ query: '', items: [] });
    }

    try {
      const edges = await fetchJustWatchEdges(query);
      const seenIds = new Set<string>();
      const items: ImdbSuggestionItem[] = [];

      for (let i = 0; i < edges.length; i++) {
        const node = edges[i]?.node;
        const content = node?.content;
        if (!node || !content?.title) continue;

        const posterUrl = formatJustWatchPosterUrl(content.posterUrl);
        if (!posterUrl) continue;

        const availableOn = normalizeJustWatchOffers(
          node.offers || [],
          installedIds,
        );
        if (availableOn.length === 0) continue;

        const imdbId = content.externalIds?.imdbId || node.id || `jw-${i}`;
        if (seenIds.has(imdbId)) continue;
        seenIds.add(imdbId);

        const cast = (content.credits || [])
          .map((c) => c.name)
          .filter((n): n is string => Boolean(n))
          .slice(0, 3)
          .join(', ');

        const installedOffers = availableOn.filter((o) => o.installed);
        const primaryOffer = installedOffers[0] || availableOn[0];

        items.push({
          id: imdbId,
          title: content.title,
          year:
            typeof content.originalReleaseYear === 'number'
              ? content.originalReleaseYear
              : null,
          type: node.objectType === 'SHOW' ? 'TV Series' : 'Movie',
          cast: cast || 'Featured Cast',
          rank: i + 1,
          imageUrl: posterUrl,
          imdbUrl: imdbId.startsWith('tt')
            ? `https://www.imdb.com/title/${imdbId}/`
            : `https://www.imdb.com/find/?q=${encodeURIComponent(content.title)}`,
          sourceAppId: primaryOffer?.appId,
          sourceAppName: primaryOffer?.name,
          availableOn,
        });
      }

      if (items.length > 0) {
        return res.json({ query, items });
      }

      // Fallback to IMDb suggestion endpoint when JustWatch yields no matches
      const raw = await fetchImdbSuggestionsRaw(query);
      const imdbItems = normalizeImdbSuggestions(raw, new Set());
      return res.json({ query, items: imdbItems });
    } catch (err) {
      try {
        const raw = await fetchImdbSuggestionsRaw(query);
        const imdbItems = normalizeImdbSuggestions(raw, new Set());
        return res.json({ query, items: imdbItems });
      } catch {
        const message =
          err instanceof Error ? err.message : 'Failed to search titles';
        return res.status(502).json({ error: message, query, items: [] });
      }
    }
  });

  app.get('/api/imdb/suggestions', async (req, res) => {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.json({ query: '', items: [] });
    }

    try {
      const raw = await fetchImdbSuggestionsRaw(query);
      const items = normalizeImdbSuggestions(raw, new Set());
      return res.json({ query, items });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to reach IMDb suggestions';
      return res.status(502).json({ error: message, query, items: [] });
    }
  });

  app.get('/api/imdb/html-images', async (req, res) => {
    const target = String(req.query.url || req.query.q || '').trim();
    if (!target) {
      return res.status(400).json({ error: 'Missing url or q parameter' });
    }
    try {
      const result = await extractHotlinkedImdbImages(target);
      return res.json(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to extract IMDb images';
      return res.status(502).json({ error: message, images: [] });
    }
  });

  app.post('/api/imdb/recommendations', async (req, res) => {
    const body = req.body as {
      seenHistory?: SeenHistoryItem[];
      apps?: InstalledApp[];
      maxShelves?: number;
    };

    const allHistory = Array.isArray(body?.seenHistory) ? body.seenHistory : [];
    const apps = Array.isArray(body?.apps) ? body.apps : [];
    const maxShelves = Math.min(8, Math.max(1, Number(body?.maxShelves) || 5));

    // Strictly enforce app access grant filter before touching IMDb
    const grantedHistory = filterSeenHistoryByGrantedApps(allHistory, apps);
    if (grantedHistory.length === 0) {
      return res.json({
        shelves: [],
        seedsUsed: [],
        grantedHistoryCount: 0,
        reason: 'NO_GRANTED_HISTORY',
      });
    }

    const seenIds = new Set(allHistory.map((item) => item.id));
    const seeds = buildImdbSeedQueries(grantedHistory, apps, maxShelves);

    try {
      const shelfResults = await Promise.all(
        seeds.map(async (seed) => {
          const queryList =
            Array.isArray(seed.queries) && seed.queries.length > 0
              ? seed.queries
              : [seed.query];
          const perQueryRaw = await Promise.all(
            queryList.map((q) => fetchImdbSuggestionsRaw(q).catch(() => [])),
          );
          // Pick top 1-2 highest-ranked matches per query so the shelf spans diverse titles
          const collected: ImdbSuggestionRaw[] = [];
          for (const rawList of perQueryRaw) {
            const topHits = normalizeImdbSuggestions(rawList, seenIds, seed);
            for (const hit of topHits.slice(0, 2)) {
              const rawMatch = rawList.find((r) => r.id === hit.id);
              if (rawMatch) collected.push(rawMatch);
            }
          }
          const normalized = normalizeImdbSuggestions(collected, seenIds, seed);
          return { seed, items: normalized };
        }),
      );

      const usedAcrossShelves = new Set<string>();
      const shelves: RecommendationShelf[] = [];

      for (const { seed, items } of shelfResults) {
        const uniqueItems: ImdbSuggestionItem[] = [];
        for (const item of items) {
          if (!usedAcrossShelves.has(item.id)) {
            usedAcrossShelves.add(item.id);
            uniqueItems.push(item);
          }
          if (uniqueItems.length >= 10) break;
        }

        if (uniqueItems.length > 0) {
          shelves.push({
            id: seed.id,
            title: seed.reasonLabel,
            subtitle: `Live IMDb suggestions seeded from ${seed.sourceAppName}`,
            sourceAppId: seed.sourceAppId,
            sourceAppName: seed.sourceAppName,
            seedTitle: seed.seedTitle,
            queryUsed: seed.query,
            items: uniqueItems,
          });
        }
      }

      return res.json({
        shelves,
        seedsUsed: seeds,
        grantedHistoryCount: grantedHistory.length,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate IMDb recommendations';
      return res.status(502).json({
        error: message,
        shelves: [],
        seedsUsed: seeds,
        grantedHistoryCount: grantedHistory.length,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nocturne Fire Launcher running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
