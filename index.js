const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const { getRecommendations } = require('./recommendations');

const manifest = {
  id: 'community.smart-recommendations',
  version: '1.0.0',
  name: '🎬 Smart Recommendations',
  description: 'Recommandations de films, séries et animés via TMDB.',
  resources: ['catalog'],
  types: ['movie', 'series'],
  idPrefixes: ['tt'],
  catalogs: [
    { type: 'movie', id: 'rec-movies-trending', name: '🔥 Films Tendance', extra: [{ name: 'skip', isRequired: false }] },
    { type: 'movie', id: 'rec-movies-top-rated', name: '⭐ Films Mieux Notés', extra: [{ name: 'skip', isRequired: false }] },
    { type: 'movie', id: 'rec-movies-action', name: '💥 Films Action', extra: [{ name: 'skip', isRequired: false }] },
    { type: 'movie', id: 'rec-movies-comedy', name: '😂 Films Comédie', extra: [{ name: 'skip', isRequired: false }] },
    { type: 'movie', id: 'rec-movies-scifi', name: '🚀 Films Sci-Fi', extra: [{ name: 'skip', isRequired: false }] },
    { type: 'movie', id: 'rec-movies-horror', name: '👻 Films Horreur', extra: [{ name: 'skip', isRequired: false }] },
    { type: 'series', id: 'rec-series-trending', name: '🔥 Séries Tendance', extra: [{ name: 'skip', isRequired: false }] },
    { type: 'series', id: 'rec-series-top-rated', name: '⭐ Séries Mieux Notées', extra: [{ name: 'skip', isRequired: false }] },
    { type: 'series', id: 'rec-series-drama', name: '🎭 Séries Drame', extra: [{ name: 'skip', isRequired: false }] },
    { type: 'series', id: 'rec-series-comedy', name: '😂 Séries Comédie', extra: [{ name: 'skip', isRequired: false }] },
    { type: 'series', id: 'rec-anime-trending', name: '🌸 Animés Tendance', extra: [{ name: 'skip', isRequired: false }] },
    { type: 'series', id: 'rec-anime-top-rated', name: '⭐ Animés Mieux Notés', extra: [{ name: 'skip', isRequired: false }] },
    { type: 'movie', id: 'rec-anime-movies', name: '🎌 Films Animés', extra: [{ name: 'skip', isRequired: false }] },
  ],
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  const skip = parseInt((extra && extra.skip) || 0, 10);
  try {
    const metas = await getRecommendations(type, id, skip);
    return { metas };
  } catch (err) {
    console.error('[Catalog] Erreur:', err.message);
    return { metas: [] };
  }
});

const PORT = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port: PORT });
console.log(`🎬 Addon lancé sur le port ${PORT}`);
