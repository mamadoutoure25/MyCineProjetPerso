// profilUser.js

const CONFIG = {
    URL_BASE: "https://api.themoviedb.org/3",
    CLE_API: window.TMDB_CONFIG.API_KEY,
    URL_IMAGE: "https://image.tmdb.org/t/p/w500",
    URL_ORIG: "https://image.tmdb.org/t/p/original",
    AFFICHE_PAR_DEFAUT: "https://via.placeholder.com/500x750?text=Aucune+affiche",
};

const cacheContenu = new Map();

const DOM = {
    userPseudo: document.getElementById("user-pseudo"),
    favoritesMovies: document.getElementById("favorites-movies"),
    favoritesSeries: document.getElementById("favorites-series"),
    watchlistMovies: document.getElementById("watchlist-movies"),
    watchlistSeries: document.getElementById("watchlist-series"),
    watchedMovies: document.getElementById("watched-movies"),
    watchedSeries: document.getElementById("watched-series"),
    actorsFavorites: document.getElementById("actors-favorites"),
    favoritesCount: document.getElementById("favorites-count"),
    watchlistCount: document.getElementById("watchlist-count"),
    watchedCount: document.getElementById("watched-count"),
};

const ETAT = {
    user: null,
    favorites: [],
    watchlist: [],
    watched: [],
    acteursFavorisDetails: []
};

async function initialiserProfil() {
    const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : null;
    if (!auth) {
        if (window.clearAuth) window.clearAuth();
        window.location.href = "../connexion/connexion.html";
        return;
    }
    ETAT.user = auth;
    
    const pseudo = auth.pseudo || auth.username || auth.name || (auth.user && (auth.user.pseudo || auth.user.username)) || "Utilisateur";
    if (DOM.userPseudo) {
        DOM.userPseudo.textContent = pseudo.toUpperCase();
    }
    const avatar = document.getElementById("user-avatar");
    if (avatar) {
        avatar.textContent = pseudo.charAt(0).toUpperCase();
    }

    const authSection = document.getElementById("auth-section");
    if (authSection) {
        authSection.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <div class="text-end d-none d-md-block">
                    <a href="profilUser.html" class="text-decoration-none text-theme">
                        <div class="fw-bold small">${pseudo}</div>
                        <div class="x-small opacity-50">MON PROFIL</div>
                    </a>
                </div>
                <a href="../profil/settings.html" class="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center" title="Paramètres">
                    <i class="ph ph-gear fs-5"></i>
                </a>
                <button onclick="sessionStorage.removeItem('auth'); localStorage.removeItem('lastAuth'); window.location.href='../connexion/connexion.html';" class="btn btn-outline-danger rounded-pill px-3 btn-sm fw-bold">QUITTER</button>
            </div>`;
    }

    await chargerToutesLesListes();
}

async function chargerToutesLesListes() {
    const uid = ETAT.user.userId || ETAT.user.id;
    await Promise.all([
        chargerDonneesListe("favorites", uid),
        chargerDonneesListe("watchlist", uid),
        chargerDonneesListe("watched", uid),
        chargerActeurs(uid)
    ]);
    mettreAJourStats();
}

async function chargerDonneesListe(type, uid) {
    try {
        const res = await fetch(`${type}.php?user_id=${uid}&_t=${Date.now()}`, { cache: 'no-cache' }).then(r => r.json());
        if (res.success && res[type]) {
            ETAT[type] = await Promise.all(res[type].map(async (i, index) => {
                const details = await recupererDetails(i.tmdb_id, i.media_type || 'movie');
                if (!details) return null;
                return {
                    ...details,
                    _added_order: res[type].length - index,
                    _db_id: i.id || (res[type].length - index)
                };
            }));
            const valid = ETAT[type].filter(d => d);
            ETAT[type] = valid;
            appliquerFiltres(type);
        }
    } catch (e) { console.error(e); }
}

async function recupererDetails(id, type) {
    const key = `${type}_${id}`;
    if (cacheContenu.has(key)) return cacheContenu.get(key);
    try {
        const d = await fetch(`${CONFIG.URL_BASE}/${type}/${id}?api_key=${CONFIG.CLE_API}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`).then(r => r.json());
        d.media_type = type; // Inject type for filtering
        cacheContenu.set(key, d);
        return d;
    } catch (e) { return null; }
}

function renderListeType(type) {
    const data = ETAT[type].filter(d => d);
    const films = data.filter(i => i.media_type === 'movie');
    const series = data.filter(i => i.media_type === 'tv');

    renderItems(films, `#${type}-movies`, type, 'movie');
    renderItems(series, `#${type}-series`, type, 'tv');
}

function renderItems(items, selector, typeListe, mediaType) {
    const container = document.querySelector(selector);
    if (!container) return;

    const prefix = typeListe === 'favorites' ? 'fav' : (typeListe === 'watchlist' ? 'watch' : 'watched');
    const badgeId = `${prefix}-${mediaType === 'movie' ? 'movies' : 'series'}-count`;
    const countBadge = document.getElementById(badgeId);
    if (countBadge) {
        countBadge.textContent = items.length;
    }

    if (!items.length) {
        const label = mediaType === 'movie' ? 'film' : 'série';
        container.innerHTML = `<div class="p-3 opacity-50 x-small text-center border border-secondary border-opacity-25 rounded-4 bg-theme my-1" style="grid-column: 1 / -1;">Aucun ${label} dans cette liste.</div>`;
        return;
    }

    container.innerHTML = items.map(item => {
        const title = item.title || item.name;
        const date = (item.release_date || item.first_air_date || "").substring(0, 4) || "N/A";
        const customPoster = mediaType === 'movie' ? localStorage.getItem(`custom_movie_poster_${item.id}`) : null;
        const img = customPoster || (item.poster_path ? (item.poster_path.startsWith('http') ? item.poster_path : CONFIG.URL_IMAGE + item.poster_path) : CONFIG.AFFICHE_PAR_DEFAUT);
        const page = mediaType === 'movie' ? 'movie-details.html' : 'serie-details.html';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : '0.0';

        return `
            <div class="actor-credit-card">
                <img src="${img}" onclick="window.location.href='${page}?id=${item.id}'">
                <button class="remove-btn-premium" onclick="event.stopPropagation(); supprimerItem(${item.id}, '${typeListe}', '${mediaType}')">
                    <i class="ph ph-x"></i>
                </button>
                <div class="wide-credit-overlay" onclick="window.location.href='${page}?id=${item.id}'">
                    <div class="wide-title text-truncate">${title}</div>
                    <div class="character-badge"><i class="ph-fill ph-star"></i> ${rating}</div>
                </div>
                <div class="wide-year">${date}</div>
            </div>
        `;
    }).join("");
}

function appliquerFiltres(type) {
    const genre = document.getElementById(`filter-${type === 'favorites' ? 'fav' : (type === 'watchlist' ? 'watch' : 'watched')}-genre`).value;
    const sort = document.getElementById(`sort-${type === 'favorites' ? 'fav' : (type === 'watchlist' ? 'watch' : 'watched')}`).value;

    let filtered = [...ETAT[type]].filter(d => d);

    if (genre) {
        filtered = filtered.filter(i => i.genres?.some(g => g.id == genre));
    }

    filtered.sort((a, b) => {
        const titleA = (a.title || a.name || "").trim();
        const titleB = (b.title || b.name || "").trim();
        const parseDate = (item) => {
            const raw = item.release_date || item.first_air_date;
            if (!raw) return 0;
            const t = new Date(raw).getTime();
            return isNaN(t) ? 0 : t;
        };
        const dateA = parseDate(a);
        const dateB = parseDate(b);
        const ratingA = typeof a.vote_average === 'number' ? a.vote_average : 0;
        const ratingB = typeof b.vote_average === 'number' ? b.vote_average : 0;
        const popA = typeof a.popularity === 'number' ? a.popularity : 0;
        const popB = typeof b.popularity === 'number' ? b.popularity : 0;
        const votesA = typeof a.vote_count === 'number' ? a.vote_count : 0;
        const votesB = typeof b.vote_count === 'number' ? b.vote_count : 0;
        const getRuntime = (item) => {
            if (typeof item.runtime === 'number' && item.runtime > 0) return item.runtime;
            if (Array.isArray(item.episode_run_time) && item.episode_run_time.length > 0) return item.episode_run_time[0];
            return 0;
        };
        const orderA = typeof a._added_order === 'number' ? a._added_order : 0;
        const orderB = typeof b._added_order === 'number' ? b._added_order : 0;
        const runtimeA = getRuntime(a);
        const runtimeB = getRuntime(b);

        switch (sort) {
            case "added-desc":
                return orderB - orderA;
            case "added-asc":
                return orderA - orderB;
            case "date-desc":
                return dateB - dateA;
            case "date-asc":
                return dateA - dateB;
            case "rating-desc":
                return ratingB - ratingA;
            case "rating-asc":
                return ratingA - ratingB;
            case "popularity-desc":
                return popB - popA;
            case "votes-desc":
                return votesB - votesA;
            case "title-asc":
                return titleA.localeCompare(titleB, 'fr', { sensitivity: 'base' });
            case "title-desc":
                return titleB.localeCompare(titleA, 'fr', { sensitivity: 'base' });
            case "runtime-desc":
                return runtimeB - runtimeA;
            case "runtime-asc":
                return runtimeA - runtimeB;
            default:
                return 0;
        }
    });

    const films = filtered.filter(i => i.media_type === 'movie');
    const series = filtered.filter(i => i.media_type === 'tv');

    renderItems(films, `#${type}-movies`, type, 'movie');
    renderItems(series, `#${type}-series`, type, 'tv');
}

async function chargerActeurs(uid) {
    try {
        const res = await fetch(`favorite-actors.php?user_id=${uid}&_t=${Date.now()}`, { cache: 'no-cache' }).then(r => r.json());
        if (res.success && res.favorite_actors) {
            ETAT.acteursFavorisDetails = await Promise.all(res.favorite_actors.map(async (a, index) => {
                const details = await fetch(`${CONFIG.URL_BASE}/person/${a.tmdb_id}?api_key=${CONFIG.CLE_API}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`).then(r => r.json());
                return {
                    ...details,
                    _added_order: res.favorite_actors.length - index,
                    _db_id: a.favorite_id || a.id || (res.favorite_actors.length - index)
                };
            }));
            const valid = ETAT.acteursFavorisDetails.filter(d => d);
            ETAT.acteursFavorisDetails = valid;
            appliquerFiltresActeurs();
        }
    } catch (e) { console.error(e); }
}

function renderActeurs(data) {
    const cont = document.getElementById("actors-favorites");
    if (!cont) return;
    if (!data.length) {
        cont.innerHTML = `<div class="p-4 opacity-50 small text-center w-100">Aucun acteur trouvé.</div>`;
        return;
    }

    cont.innerHTML = data.map(a => {
        const age = a.birthday ? calculerAge(a.birthday) : "N/A";
        return `
            <div class="actor-credit-card">
                <img src="${a.profile_path ? CONFIG.URL_IMAGE + a.profile_path : 'https://via.placeholder.com/300x450'}" onclick="window.location.href='actor-details.html?id=${a.id}'">
                <button class="remove-btn-premium" onclick="event.stopPropagation(); supprimerActeur(${a.id})" title="Retirer">
                    <i class="ph ph-trash"></i>
                </button>
                <div class="wide-credit-overlay" onclick="window.location.href='actor-details.html?id=${a.id}'">
                    <div class="wide-title">${a.name}</div>
                    <div class="character-badge">${age !== "N/A" ? age + " ANS" : "ÂGE INCONNU"}</div>
                </div>
                <div class="wide-year">${a.gender === 1 ? 'FEMME' : (a.gender === 2 ? 'HOMME' : 'N/A')}</div>
            </div>
        `;
    }).join("");
}

function calculerAge(birthday) {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
}

function appliquerFiltresActeurs() {
    let results = [...ETAT.acteursFavorisDetails];
    const sex = document.getElementById("filter-actor-sex").value;
    if (sex) results = results.filter(a => a.gender == sex);
    const ageRange = document.getElementById("filter-actor-age").value;
    if (ageRange) {
        results = results.filter(a => {
            if (!a.birthday) return false;
            const age = calculerAge(a.birthday);
            if (ageRange === "0-20") return age <= 20;
            if (ageRange === "21-40") return age > 20 && age <= 40;
            if (ageRange === "41-60") return age > 40 && age <= 60;
            if (ageRange === "61-80") return age > 60 && age <= 80;
            if (ageRange === "81-120") return age > 80;
            return true;
        });
    }
    const sort = document.getElementById("sort-actor").value;
    results.sort((a, b) => {
        if (sort === "added-desc") return (b._added_order || 0) - (a._added_order || 0);
        if (sort === "added-asc") return (a._added_order || 0) - (b._added_order || 0);
        if (sort === "name-asc") return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
        if (sort === "name-desc") return b.name.localeCompare(a.name, 'fr', { sensitivity: 'base' });
        if (sort === "popularity-desc") return (b.popularity || 0) - (a.popularity || 0);
        if (sort === "age-asc") return (a.birthday ? calculerAge(a.birthday) : 999) - (b.birthday ? calculerAge(b.birthday) : 999);
        if (sort === "age-desc") return (b.birthday ? calculerAge(b.birthday) : -1) - (a.birthday ? calculerAge(a.birthday) : -1);
        return 0;
    });
    renderActeurs(results);
}

async function supprimerItem(id, type, media) {
    if (!confirm("Retirer ce contenu de votre liste ?")) return;
    const uid = ETAT.user.userId || ETAT.user.id;
    try {
        await fetch(`${type}.php`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid, film_id: id, media_type: media }) });
        await chargerDonneesListe(type, uid);
        mettreAJourStats();
        notify("Contenu retiré", "info");
    } catch (e) { console.error(e); }
}

async function supprimerActeur(id) {
    if (!confirm("Retirer cet acteur de vos favoris ?")) return;
    const uid = ETAT.user.userId || ETAT.user.id;
    try {
        await fetch('favorite-actors.php', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid, actor_id: id }) });
        await chargerActeurs(uid);
        mettreAJourStats();
        notify("Acteur retiré", "info");
    } catch (e) { console.error(e); }
}

function mettreAJourStats() {
    const favs = ETAT.favorites.length;
    const watch = ETAT.watchlist.length;
    const done = ETAT.watched.length;
    if (DOM.favoritesCount) DOM.favoritesCount.textContent = favs;
    if (DOM.watchlistCount) DOM.watchlistCount.textContent = watch;
    if (DOM.watchedCount) DOM.watchedCount.textContent = done;
}

function notify(msg, type) {
    const c = document.getElementById("toast-container");
    if (!c) return;
    const t = document.createElement("div");
    t.className = `toast show bg-${type} text-theme p-3 mb-2 rounded-4 shadow-lg`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

function filtrerMediaType(type, media, btn) {
    const parentGroup = btn.parentElement;
    if (parentGroup) {
        parentGroup.querySelectorAll('button').forEach(b => {
            b.classList.remove('btn-accent', 'active');
            b.classList.add('btn-outline-secondary', 'text-theme');
        });
        btn.classList.remove('btn-outline-secondary', 'text-theme');
        btn.classList.add('btn-accent', 'active');
    }

    const prefix = type === 'favorites' ? 'favorites' : (type === 'watchlist' ? 'watchlist' : 'watched');
    const moviesWrapper = document.getElementById(`${prefix}-movies-wrapper`);
    const seriesWrapper = document.getElementById(`${prefix}-series-wrapper`);

    if (moviesWrapper) {
        moviesWrapper.classList.toggle('d-none', media === 'tv');
    }
    if (seriesWrapper) {
        seriesWrapper.classList.toggle('d-none', media === 'movie');
    }
}

window.filtrerMediaType = filtrerMediaType;
window.appliquerFiltresActeurs = appliquerFiltresActeurs;
window.appliquerFiltres = appliquerFiltres;

document.addEventListener("DOMContentLoaded", initialiserProfil);

// Auto-rafraîchissement lors du retour sur la page (Back/Forward cache & changement d'onglet)
window.addEventListener("pageshow", (event) => {
    cacheContenu.clear();
    initialiserProfil();
});

window.addEventListener("focus", () => {
    cacheContenu.clear();
    if (ETAT.user) chargerToutesLesListes();
});

document.addEventListener("authChange", () => {
    cacheContenu.clear();
    initialiserProfil();
});
