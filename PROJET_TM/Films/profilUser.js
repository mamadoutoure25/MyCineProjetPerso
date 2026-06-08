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
    enChargement: false
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
        container.innerHTML = `<div class="p-4 opacity-50 small">Aucun contenu trouvé.</div>`;
        return;
    }

    container.innerHTML = items.map(item => {
        const title = item.title || item.name;
        const date = (item.release_date || item.first_air_date || "").substring(0, 4);
        const img = item.poster_path ? CONFIG.URL_IMAGE + item.poster_path : CONFIG.AFFICHE_PAR_DEFAUT;
        const page = mediaType === 'movie' ? 'movie-details.html' : 'serie-details.html';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : '0.0';

        return `
            <div class="small-actor-card" onclick="window.location.href='${page}?id=${item.id}'">
                <img src="${img}" loading="lazy">
                <button class="remove-btn-premium" onclick="event.stopPropagation(); supprimerItem(${item.id}, '${typeListe}', '${mediaType}')">
                    <i class="ph ph-x"></i>
                </button>
                <div class="actor-hover-overlay">
                    <div class="actor-name">${title}</div>
                    <div class="actor-role"><i class="ph-fill ph-star"></i> ${rating} • ${date}</div>
                </div>
            </div>
        `;
    }).join("");
}

async function chargerActeurs(uid) {
    try {
        const res = await fetch(`favorite-actors.php?user_id=${uid}`).then(r => r.json());
        if (res.success && res.favorite_actors) {
            const details = await Promise.all(res.favorite_actors.map(a => 
                fetch(`${CONFIG.URL_BASE}/person/${a.tmdb_id}?api_key=${CONFIG.CLE_API}&language=fr-FR`).then(r => r.json())
            ));
            
            const cont = document.getElementById("actors-favorites");
            cont.innerHTML = details.map(a => `
                <div class="small-actor-card" onclick="window.location.href='actor-details.html?id=${a.id}'">
                    <img src="${a.profile_path ? CONFIG.URL_IMAGE + a.profile_path : 'https://via.placeholder.com/300x450'}" loading="lazy">
                    <button class="remove-btn-premium" onclick="event.stopPropagation(); supprimerActeur(${a.id})" title="Retirer">
                        <i class="ph ph-trash"></i>
                    </button>
                    <div class="actor-hover-overlay">
                        <div class="actor-name">${a.name}</div>
                        <div class="actor-role">CÉLÉBRITÉ</div>
                    </div>
                </div>
            `).join("");
        }
    } catch (e) { console.error(e); }
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
    const favs = document.querySelectorAll("#favorites-movies .small-actor-card, #favorites-series .small-actor-card").length;
    const watch = document.querySelectorAll("#watchlist-movies .small-actor-card, #watchlist-series .small-actor-card").length;
    const done = document.querySelectorAll("#watched-movies .small-actor-card, #watched-series .small-actor-card").length;
    
    if (DOM.favoritesCount) DOM.favoritesCount.textContent = favs;
    if (DOM.watchlistCount) DOM.watchlistCount.textContent = watch;
    if (DOM.watchedCount) DOM.watchedCount.textContent = done;
}

function notify(msg, type) {
    const c = document.getElementById("toast-container");
    const t = document.createElement("div");
    t.className = `toast show bg-${type} text-white p-3 mb-2 rounded-4 shadow-lg`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

document.addEventListener("DOMContentLoaded", initialiserProfil);
