const TMDB_API_KEY = process.env.TMDB_API_KEY || 'METS_TA_CLE_ICI';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const LANG = 'fr-FR';
const PAGE_SIZE = 20;

const GENRE_IDS = {
  action: 28, comedy: 35, scifi: 878,
  horror: 27, drama: 18, animation: 16,
};

async function tmdbFetch(path, params = {}) {
  const fetch = (await import('node-fetch')).default;
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', LANG);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
  return res.json();
}

function toMeta(item, type) {
  return {
    id: item.imdb_id || `tmdb:${item.id}`,
    type,
    name: item.title || item.name || 'Sans titre',
    poster: item.poster_path ? `${TMDB_IMG}${item.poster_path}` : null,
    background: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
    description: item.overview || '',
    releaseInfo: (item.release_date || item.first_air_date || '').substring(0, 4),
    imdbRating: item.vote_average ? item.vote_average.toFixed(1) : undefined,
  };
}

async function enrichWithImdbIds(items, mediaType) {
  const enriched = await Promise.allSettled(
    items.map(async (item) => {
      try {
        const detail = await tmdbFetch(`/${mediaType}/${item.id}/external_ids`);
        return { ...item, imdb_id: detail.imdb_id || `tmdb:${item.id}` };
      } catch {
        return { ...item, imdb_id: `tmdb:${item.id}` };
      }
    })
  );
  return enriched.filter(r => r.status === 'fulfilled').map(r => r.value);
}

async function fetchTrending(mediaType, skip) {
  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const data = await tmdbFetch(`/trending/${mediaType}/week`, { page });
  const items = await enrichWithImdbIds(data.results || [], mediaType);
  return items.map(i => toMeta(i, mediaType === 'movie' ? 'movie' : 'series'));
}

async function fetchTopRated(mediaType, skip) {
  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const data = await tmdbFetch(`/${mediaType}/top_rated`, { page });
  const items = await enrichWithImdbIds(data.results || [], mediaType);
  return items.map(i => toMeta(i, mediaType === 'movie' ? 'movie' : 'series'));
}

async function fetchByGenre(mediaType, genreId, skip) {
  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const data = await tmdbFetch(`/discover/${mediaType}`, {
    with_genres: genreId, sort_by: 'vote_average.desc',
    'vote_count.gte': 200, page,
  });
  const items = await enrichWithImdbIds(data.results || [], mediaType);
  return items.map(i => toMeta(i, mediaType === 'movie' ? 'movie' : 'series'));
}

async function fetchAnime(mediaType, sortBy, skip) {
  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const data = await tmdbFetch(`/discover/${mediaType}`, {
    with_genres: GENRE_IDS.animation, with_original_language: 'ja',
    sort_by: sortBy, 'vote_count.gte': 100, page,
  });
  const items = await enrichWithImdbIds(data.results || [], mediaType);
  return items.map(i => toMeta(i, mediaType === 'movie' ? 'movie' : 'series'));
}

async function getRecommendations(type, catalogId, skip = 0) {
  switch (catalogId) {
    case 'rec-movies-trending': return fetchTrending('movie', skip);
    case 'rec-movies-top-rated': return fetchTopRated('movie', skip);
    case 'rec-movies-action': return fetchByGenre('movie', GENRE_IDS.action, skip);
    case 'rec-movies-comedy': return fetchByGenre('movie', GENRE_IDS.comedy, skip);
    case 'rec-movies-scifi': return fetchByGenre('movie', GENRE_IDS.scifi, skip);
    case 'rec-movies-horror': return fetchByGenre('movie', GENRE_IDS.horror, skip);
    case 'rec-series-trending': return fetchTrending('tv', skip);
    case 'rec-series-top-rated': return fetchTopRated('tv', skip);
    case 'rec-series-drama': return fetchByGenre('tv', GENRE_IDS.drama, skip);
    case 'rec-series-comedy': return fetchByGenre('tv', GENRE_IDS.comedy, skip);
    case 'rec-anime-trending': return fetchAnime('tv', 'popularity.desc', skip);
    case 'rec-anime-top-rated': return fetchAnime('tv', 'vote_average.desc', skip);
    case 'rec-anime-movies': return fetchAnime('movie', 'vote_average.desc', skip);
    default: return [];
  }
}

module.exports = { getRecommendations };
