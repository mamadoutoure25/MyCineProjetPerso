/**
 * @file actor-details.js
 * @description Cinematic Premium Version 5.4 - Unified Portrait Design
 */

const CONFIG = {
    KEY: "04c35731a5ee918f014970082a0088b1",
    BASE: "https://api.themoviedb.org/3",
    W500: "https://image.tmdb.org/t/p/w500",
    HD: "https://image.tmdb.org/t/p/w780",
    ORIG: "https://image.tmdb.org/t/p/original",
    ACTOR: "https://image.tmdb.org/t/p/h632",
    EMPTY_POSTER: "https://via.placeholder.com/500x750?text=No+Poster",
    EMPTY_ACTOR: "https://via.placeholder.com/500x750?text=No+Photo"
};

const id = new URLSearchParams(window.location.search).get("id");
let user = null;
let actorName = null;

document.addEventListener("DOMContentLoaded", async () => {
    const auth = JSON.parse(sessionStorage.getItem("auth") || "null");
    user = auth ? (auth.userId || auth.id) : null;
    renderAuth(auth);

    if (!id) return (window.location.href = "../../index.html");

    try {
        const actor = await (await fetch(`${CONFIG.BASE}/person/${id}?api_key=${CONFIG.KEY}&language=fr-FR&append_to_response=movie_credits,tv_credits,external_ids`)).json();
        
        actorName = actor.name;
        renderActorHero(actor);
        
        const allMovies = [...(actor.movie_credits?.cast || []), ...(actor.movie_credits?.crew || [])];
        const allTV = [...(actor.tv_credits?.cast || []), ...(actor.tv_credits?.crew || [])];

        const uniqueMovies = Array.from(new Map(allMovies.map(m => [m.id, m])).values());
        const uniqueTV = Array.from(new Map(allTV.map(m => [m.id, m])).values());

        renderKnownFor(uniqueMovies);
        renderFilmography(uniqueMovies, "actor-movies", "movie");
        renderFilmography(uniqueTV, "actor-tv", "tv");
        renderExternalLinks(actor.external_ids);
        
        updateActorFavoritesUI();
        document.getElementById("add-actor-to-favorites")?.addEventListener("click", () => toggleActorFavorite(actor.id, actor.name));

    } catch (e) {
        console.error("Erreur Profil:", e);
        notify("Erreur de chargement du profil", "danger");
    }
});

function renderActorHero(a) {
    document.getElementById("actor-name").textContent = a.name;
    document.getElementById("actor-biography").textContent = a.biography || "Biographie non disponible.";
    
    if (a.profile_path) {
        const photo = document.getElementById("actor-photo");
        const backdrop = document.getElementById("hero-backdrop");
        if (photo) photo.src = CONFIG.HD + a.profile_path;
        if (backdrop) backdrop.src = CONFIG.ORIG + a.profile_path;
    }

    const bday = a.birthday ? new Date(a.birthday).toLocaleDateString('fr-FR') : "N/A";
    const place = a.place_of_birth || "N/A";
    const count = (a.movie_credits?.cast?.length || 0) + (a.tv_credits?.cast?.length || 0);

    document.getElementById("actor-tags").innerHTML = `<span>Artiste</span><div class="v-sep"></div><span>${count} Projets</span>`;
    document.getElementById("actor-birthday").textContent = bday;
    document.getElementById("actor-birthplace").textContent = place;
    document.getElementById("movie-count").textContent = count;
}

function renderKnownFor(credits) {
    const cont = document.getElementById("known-for");
    if (!cont || !credits) return;
    
    const top = credits.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(0, 6);
    cont.innerHTML = generateCreditsHTML(top);
}

function renderFilmography(cast, elementId, type) {
    const cont = document.getElementById(elementId);
    if (!cont || !cast) return;

    const sorted = cast.sort((a, b) => {
        const dateA = new Date(a.release_date || a.first_air_date || "1900-01-01");
        const dateB = new Date(b.release_date || b.first_air_date || "1900-01-01");
        return dateB - dateA;
    });

    cont.innerHTML = generateCreditsHTML(sorted);
}

function generateCreditsHTML(data) {
    return data.map(m => {
        const title = m.title || m.name;
        const date = (m.release_date || m.first_air_date || "").substring(0, 4) || "N/A";
        const img = m.poster_path ? CONFIG.W500 + m.poster_path : CONFIG.EMPTY_POSTER;
        const page = m.title ? "movie-details.html" : "serie-details.html";
        
        // Use character name if cast, or job title if crew
        const roleText = m.character || m.job || "Équipe";

        return `
            <div class="actor-credit-card" onclick="window.location.href='${page}?id=${m.id}'">
                <img src="${img}" loading="lazy">
                <div class="wide-credit-overlay">
                    <div class="wide-title text-truncate">${title}</div>
                    <div class="character-badge">${roleText}</div>
                </div>
                <div class="wide-year">${date}</div>
            </div>
        `;
    }).join("");
}

function renderExternalLinks(ids) {
    const cont = document.getElementById("external-ids");
    if (!cont || !ids) return;
    const links = [];
    if (ids.imdb_id) links.push(`<a href="https://imdb.com/name/${ids.imdb_id}" target="_blank" class="btn-circle"><i class="ph ph-imdb-logo"></i></a>`);
    if (ids.instagram_id) links.push(`<a href="https://instagram.com/${ids.instagram_id}" target="_blank" class="btn-circle"><i class="ph ph-instagram-logo"></i></a>`);
    if (ids.twitter_id) links.push(`<a href="https://twitter.com/${ids.twitter_id}" target="_blank" class="btn-circle"><i class="ph ph-x-logo"></i></a>`);
    cont.innerHTML = links.join("");
}

function getActorFavorites() {
    const favorites = localStorage.getItem('actor_favorites');
    return favorites ? JSON.parse(favorites) : [];
}

function isActorFavorite(actorId) {
    return getActorFavorites().some(fav => fav.id === parseInt(actorId));
}

async function toggleActorFavorite(actorId, name) {
    let favorites = getActorFavorites();
    const index = favorites.findIndex(fav => fav.id === parseInt(actorId));

    if (index > -1) {
        favorites.splice(index, 1);
        if (user) await fetch('favorite-actors.php', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ user_id: user, actor_id: actorId }) });
        notify(`${name} retiré`, "info");
    } else {
        favorites.push({ id: parseInt(actorId), name: name });
        if (user) await fetch('favorite-actors.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ user_id: user, actor_id: actorId, actor_name: name }) });
        notify(`${name} ajouté`, "success");
    }

    localStorage.setItem('actor_favorites', JSON.stringify(favorites));
    updateActorFavoritesUI();
}

function updateActorFavoritesUI() {
    const btn = document.getElementById("add-actor-to-favorites");
    if (!btn) return;
    const active = isActorFavorite(id);
    const icon = btn.querySelector("i");
    if (active) {
        btn.classList.replace("btn-light", "btn-primary");
        if (icon) icon.className = "ph-fill ph-heart me-2";
    } else {
        btn.classList.replace("btn-primary", "btn-light");
        if (icon) icon.className = "ph ph-heart me-2";
    }
}

function renderAuth(a) {
    const c = document.getElementById("auth-section");
    if (!c) return;
    if (a) {
        c.innerHTML = `<div class="d-flex align-items-center gap-3"><div class="text-end d-none d-md-block"><a href="profilUser.html" class="text-white text-decoration-none"><div class="fw-bold small">${a.username}</div><div class="x-small opacity-50">MON PROFIL</div></a></div><button onclick="sessionStorage.removeItem('auth'); window.location.reload();" class="btn btn-outline-danger rounded-pill px-4 btn-sm fw-bold">QUITTER</button></div>`;
    } else {
        c.innerHTML = `<a href="../connexion/connexion.html" class="btn btn-primary rounded-pill px-4 fw-bold btn-sm">CONNEXION</a>`;
    }
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
