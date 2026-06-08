// profilUser.js

const CONFIG = {
    URL_BASE: "https://api.themoviedb.org/3",
    CLE_API: "04c35731a5ee918f014970082a0088b1",
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
    acteursFavorisDetails: []
};

async function initialiserProfil() {
    const auth = JSON.parse(sessionStorage.getItem("auth") || "null");
    if (!auth) {
        window.location.href = "../connexion/connexion.html";
        return;
    }
    ETAT.user = auth;
    
    // UI Init
    DOM.userPseudo.textContent = (auth.pseudo || auth.username || "Utilisateur").toUpperCase();
    const avatar = document.getElementById("user-avatar");
    if (avatar) avatar.textContent = (auth.pseudo || auth.username || "U").charAt(0).toUpperCase();

    await chargerToutesLesListes();
}

async function chargerToutesLesListes() {
    const uid = ETAT.user.userId || ETAT.user.id;
    await Promise.all([
        chargerListe("favorites", uid),
        chargerListe("watchlist", uid),
        chargerListe("watched", uid),
        chargerActeurs(uid)
    ]);
    mettreAJourStats();
}

async function chargerListe(type, uid) {
    try {
        const res = await fetch(`${type}.php?user_id=${uid}`).then(r => r.json());
        if (res.success && res[type]) {
            const films = res[type].filter(i => i.media_type === 'movie' || !i.media_type);
            const series = res[type].filter(i => i.media_type === 'tv');

            const fDetails = await Promise.all(films.map(i => recupererDetails(i.tmdb_id, 'movie')));
            const sDetails = await Promise.all(series.map(i => recupererDetails(i.tmdb_id, 'tv')));

            renderItems(fDetails.filter(d => d), `#${type}-movies`, type, 'movie');
            renderItems(sDetails.filter(d => d), `#${type}-series`, type, 'tv');
        }
    } catch (e) { console.error(e); }
}

async function recupererDetails(id, type) {
    const key = `${type}_${id}`;
    if (cacheContenu.has(key)) return cacheContenu.get(key);
    try {
        const d = await fetch(`${CONFIG.URL_BASE}/${type}/${id}?api_key=${CONFIG.CLE_API}&language=fr-FR`).then(r => r.json());
        cacheContenu.set(key, d);
        return d;
    } catch (e) { return null; }
}

function renderItems(items, selector, typeListe, mediaType) {
    const container = document.querySelector(selector);
    if (!container) return;
    if (!items.length) {
        container.innerHTML = `<div class="p-4 opacity-50 small text-center w-100">Aucun contenu trouvé.</div>`;
        return;
    }

    container.innerHTML = items.map(item => {
        const title = item.title || item.name;
        const date = (item.release_date || item.first_air_date || "").substring(0, 4) || "N/A";
        const img = item.poster_path ? CONFIG.URL_IMAGE + item.poster_path : CONFIG.AFFICHE_PAR_DEFAUT;
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

async function chargerActeurs(uid) {
    try {
        const res = await fetch(`favorite-actors.php?user_id=${uid}`).then(r => r.json());
        if (res.success && res.favorite_actors) {
            ETAT.acteursFavorisDetails = await Promise.all(res.favorite_actors.map(a => 
                fetch(`${CONFIG.URL_BASE}/person/${a.tmdb_id}?api_key=${CONFIG.CLE_API}&language=fr-FR`).then(r => r.json())
            ));
            renderActeurs(ETAT.acteursFavorisDetails);
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

    // Filtre Sexe
    const sex = document.getElementById("filter-actor-sex").value;
    if (sex) results = results.filter(a => a.gender == sex);

    // Filtre Age
    const ageRange = document.getElementById("filter-actor-age").value;
    if (ageRange) {
        results = results.filter(a => {
            if (!a.birthday) return false;
            const age = calculerAge(a.birthday);
            if (ageRange === "0-30") return age < 30;
            if (ageRange === "30-50") return age >= 30 && age <= 50;
            if (ageRange === "50-100") return age > 50;
            return true;
        });
    }

    // Tri
    const sort = document.getElementById("sort-actor").value;
    results.sort((a, b) => {
        if (sort === "name-asc") return a.name.localeCompare(b.name);
        if (sort === "name-desc") return b.name.localeCompare(a.name);
        if (sort === "age-asc") {
            const ageA = a.birthday ? calculerAge(a.birthday) : 999;
            const ageB = b.birthday ? calculerAge(b.birthday) : 999;
            return ageA - ageB;
        }
        if (sort === "age-desc") {
            const ageA = a.birthday ? calculerAge(a.birthday) : -1;
            const ageB = b.birthday ? calculerAge(b.birthday) : -1;
            return ageB - ageA;
        }
        return 0;
    });

    renderActeurs(results);
}

async function supprimerItem(id, type, media) {
    if (!confirm("Retirer ce contenu de votre liste ?")) return;
    const uid = ETAT.user.userId || ETAT.user.id;
    try {
        await fetch(`${type}.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: uid, film_id: id, media_type: media })
        });
        await chargerListe(type, uid);
        mettreAJourStats();
        notify("Contenu retiré", "info");
    } catch (e) { console.error(e); }
}

async function supprimerActeur(id) {
    if (!confirm("Retirer cet acteur de vos favoris ?")) return;
    const uid = ETAT.user.userId || ETAT.user.id;
    try {
        await fetch('favorite-actors.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: uid, actor_id: id })
        });
        await chargerActeurs(uid);
        mettreAJourStats();
        notify("Acteur retiré", "info");
    } catch (e) { console.error(e); }
}

function mettreAJourStats() {
    const favs = document.querySelectorAll("#pills-fav .actor-credit-card").length;
    const watch = document.querySelectorAll("#pills-watch .actor-credit-card").length;
    const done = document.querySelectorAll("#pills-done .actor-credit-card").length;
    
    if (DOM.favoritesCount) DOM.favoritesCount.textContent = favs;
    if (DOM.watchlistCount) DOM.watchlistCount.textContent = watch;
    if (DOM.watchedCount) DOM.watchedCount.textContent = done;
}

function notify(msg, type) {
    const c = document.getElementById("toast-container");
    if (!c) return;
    const t = document.createElement("div");
    t.className = `toast show bg-${type} text-white p-3 mb-2 rounded-4 shadow-lg`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

window.appliquerFiltresActeurs = appliquerFiltresActeurs;
document.addEventListener("DOMContentLoaded", initialiserProfil);
