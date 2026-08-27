/**
 * Sync global des affiches personnalisées — MyCiné
 * Charge, fournit et met à jour automatiquement les affiches personnalisées sur toutes les pages.
 */
(function() {
    const userPostersCache = {};

    function getAuthData() {
        if (typeof window.getValidAuth === 'function') {
            return window.getValidAuth();
        }
        const raw = sessionStorage.getItem("auth") || localStorage.getItem("lastAuth");
        if (!raw) return null;
        try {
            const auth = JSON.parse(raw);
            if (auth && auth.token && typeof window.isTokenExpired === 'function' && window.isTokenExpired(auth.token)) {
                if (typeof window.clearAuth === 'function') window.clearAuth();
                else {
                    sessionStorage.removeItem('auth');
                    localStorage.removeItem('lastAuth');
                }
                return null;
            }
            return auth;
        } catch(e) { return null; }
    }

    function getAuthHeaders() {
        const auth = getAuthData();
        const headers = { 'Content-Type': 'application/json' };
        if (auth && auth.token) {
            headers['Authorization'] = `Bearer ${auth.token}`;
        }
        return headers;
    }

    function shouldUpdateImgSrc(img, customUrl) {
        if (!customUrl || !img) return false;
        const currentAttr = img.getAttribute('src');
        if (currentAttr === customUrl) return false;
        if (img.src === customUrl) return false;
        return true;
    }

    function updateAllDomPosters() {
        // 1. Mise à jour via attribut data-movie-id
        document.querySelectorAll('img[data-movie-id]').forEach(img => {
            const id = img.getAttribute('data-movie-id');
            const custom = getCustomPoster(id, null, 'movie');
            if (shouldUpdateImgSrc(img, custom)) img.src = custom;
        });

        // 2. Mise à jour via attribut data-collection-id
        document.querySelectorAll('img[data-collection-id]').forEach(img => {
            const id = img.getAttribute('data-collection-id');
            const custom = getCustomPoster(id, null, 'collection');
            if (shouldUpdateImgSrc(img, custom)) img.src = custom;
        });

        // 3. Fallback universel : détection par href / onclick
        const candidates = document.querySelectorAll('.premium-card, .actor-credit-card, .collection-card, a[href*="movie-details.html"], a[href*="collection.html"], [onclick*="movie-details.html"], [onclick*="collection.html"]');
        candidates.forEach(el => {
            const str = (el.getAttribute('onclick') || '') + ' ' + (el.getAttribute('href') || '');
            
            // Recherche de movie-details.html?id=123
            const movieMatch = str.match(/movie-details\.html\?id=(\d+)/);
            if (movieMatch) {
                const movieId = movieMatch[1];
                const custom = getCustomPoster(movieId, null, 'movie');
                if (custom) {
                    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
                    if (img && shouldUpdateImgSrc(img, custom)) img.src = custom;
                }
            }

            // Recherche de collection.html?id=123
            const colMatch = str.match(/collection\.html\?id=(\d+)/);
            if (colMatch) {
                const colId = colMatch[1];
                const custom = getCustomPoster(colId, null, 'collection');
                if (custom) {
                    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
                    if (img && shouldUpdateImgSrc(img, custom)) img.src = custom;
                }
            }
        });
    }

    async function syncAllUserPosters() {
        const auth = getAuthData();
        const uid = auth ? (auth.userId || auth.id) : null;
        const token = auth?.token;

        if (uid || token) {
            try {
                let apiPath = './user_posters.php';
                if (window.location.pathname.includes('/connexion/')) {
                    apiPath = '../Films/user_posters.php';
                } else if (!window.location.pathname.includes('/Films/') && !window.location.pathname.includes('/GestionFilmsBD/')) {
                    apiPath = './PROJET_TM/Films/user_posters.php';
                }

                const res = await fetch(`${apiPath}?user_id=${uid || ''}`, { headers: getAuthHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.posters)) {
                        data.posters.forEach(p => {
                            const key = p.media_type === 'collection' ? `custom_collection_poster_${p.tmdb_id}` : `custom_movie_poster_${p.tmdb_id}`;
                            userPostersCache[key] = p.poster_path;
                            localStorage.setItem(key, p.poster_path);
                        });
                        document.dispatchEvent(new CustomEvent('userPostersLoaded', { detail: userPostersCache }));
                        updateAllDomPosters();
                    }
                }
            } catch (e) {
                console.warn("Erreur de synchronisation globale des affiches:", e);
            }
        }
        updateAllDomPosters();
    }

    function getCustomPoster(tmdbId, defaultUrl, mediaType = 'movie') {
        if (!tmdbId) return defaultUrl;
        const key = mediaType === 'collection' ? `custom_collection_poster_${tmdbId}` : `custom_movie_poster_${tmdbId}`;
        const cached = userPostersCache[key] || localStorage.getItem(key);
        return cached || defaultUrl;
    }

    // Exposer globalement
    window.getCustomPoster = getCustomPoster;
    window.syncAllUserPosters = syncAllUserPosters;
    window.updateAllDomPosters = updateAllDomPosters;

    // MutationObserver pour intercepter les éléments ajoutés dynamiquement
    let observer = null;
    function startObserver() {
        if (observer || !document.body) return;
        observer = new MutationObserver(() => {
            updateAllDomPosters();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            syncAllUserPosters();
            startObserver();
        });
    } else {
        syncAllUserPosters();
        startObserver();
    }
})();
