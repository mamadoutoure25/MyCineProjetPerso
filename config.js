// Fichier de configuration global TMDB
window.TMDB_CONFIG = {
    API_KEY: "04c35731a5ee918f014970082a0088b1",
    BASE_URL: "https://api.themoviedb.org/3",
    IMG_BASE: "https://image.tmdb.org/t/p/w500",
    ORIGINAL: "https://image.tmdb.org/t/p/original",
    EMPTY_THUMB: "https://via.placeholder.com/380x214/121215/ffffff?text=Image+Indisponible",
    EMPTY_POSTER: "https://via.placeholder.com/300x450/1a1a24/ffffff?text=Affiche+Indisponible"
};

// Retro-compatibilité pour les scripts existants qui s'attendent à API_KEY ou CONFIG en global
window.API_KEY = window.TMDB_CONFIG.API_KEY;
window.API_BASE_URL = window.TMDB_CONFIG.BASE_URL;
