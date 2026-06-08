/**
 * @file saison-details.js
 * @description Cinematic Premium for Seasons
 */

const CONFIG = {
    KEY: "04c35731a5ee918f014970082a0088b1",
    BASE: "https://api.themoviedb.org/3",
    W500: "https://image.tmdb.org/t/p/w500",
    HD: "https://image.tmdb.org/t/p/w780",
    ORIG: "https://image.tmdb.org/t/p/original",
    ACTOR: "https://image.tmdb.org/t/p/h632",
    EMPTY_POSTER: "https://via.placeholder.com/500x750?text=No+Poster"
};

const params = new URLSearchParams(window.location.search);
const serieId = params.get("serieId");
const seasonNum = params.get("season");

document.addEventListener("DOMContentLoaded", async () => {
    const auth = JSON.parse(sessionStorage.getItem("auth") || "null");
    renderAuth(auth);

    if (!serieId || !seasonNum) return (window.location.href = "../../series.html");

    try {
        const [serie, season, credits] = await Promise.all([
            fetch(`${CONFIG.BASE}/tv/${serieId}?api_key=${CONFIG.KEY}&language=fr-FR`).then(r => r.json()),
            fetch(`${CONFIG.BASE}/tv/${serieId}/season/${seasonNum}?api_key=${CONFIG.KEY}&language=fr-FR`).then(r => r.json()),
            fetch(`${CONFIG.BASE}/tv/${serieId}/season/${seasonNum}/credits?api_key=${CONFIG.KEY}&language=fr-FR`).then(r => r.json())
        ]);

        renderHeader(serie, season);
        renderEpisodes(season.episodes);
        renderCast(credits.cast);

    } catch (e) {
        console.error(e);
    }
});

function renderHeader(serie, s) {
    document.getElementById("season-title").textContent = `${serie.name.toUpperCase()} - SAISON ${s.season_number}`;
    document.getElementById("season-overview").textContent = s.overview || "Aucun synopsis pour cette saison.";
    document.getElementById("hero-backdrop").src = CONFIG.ORIG + (s.backdrop_path || serie.backdrop_path);
    document.getElementById("season-poster").src = s.poster_path ? CONFIG.W500 + s.poster_path : CONFIG.EMPTY_POSTER;
    
    document.getElementById("back-to-serie").href = `serie-details.html?id=${serieId}`;
    document.getElementById("season-tags").innerHTML = `<span>${s.air_date ? new Date(s.air_date).getFullYear() : 'N/A'}</span><div class="v-sep"></div><span>${s.episodes.length} Épisodes</span>`;
}

function renderEpisodes(eps) {
    const cont = document.getElementById("episodes-container");
    cont.innerHTML = eps.map(e => `
        <div class="ep-card-premium">
            <div class="ep-thumb-wrap">
                <img src="${e.still_path ? CONFIG.HD + e.still_path : 'https://via.placeholder.com/350x197?text=No+Image'}" loading="lazy">
            </div>
            <div class="ep-content">
                <div class="ep-meta-top">ÉPISODE ${e.episode_number}</div>
                <div class="ep-title-main">${e.name}</div>
                <p class="ep-desc-main">${e.overview || "Pas de description."}</p>
                <div class="ep-footer-meta">
                    <span><i class="ph ph-calendar-blank me-2"></i>${e.air_date ? new Date(e.air_date).toLocaleDateString() : '?'}</span>
                    <span><i class="ph ph-clock me-2"></i>${e.runtime || '?'} MIN</span>
                </div>
            </div>
        </div>
    `).join("");
}

function renderCast(cast) {
    const cont = document.getElementById("season-cast");
    if (!cast || cast.length === 0) {
        cont.innerHTML = "<p class='opacity-50'>Aucune distribution pour cette saison.</p>";
        return;
    }
    cont.innerHTML = cast.slice(0, 15).map(a => `
        <div class="actor-circ" onclick="window.location.href='actor-details.html?id=${a.id}'">
            <div class="actor-img-wrap">
                <img src="${a.profile_path ? CONFIG.ACTOR + a.profile_path : 'https://via.placeholder.com/300x300?text=No+Photo'}" loading="lazy">
            </div>
            <div class="actor-name text-truncate">${a.name}</div>
            <div class="actor-role text-truncate">${a.character || "N/A"}</div>
        </div>
    `).join("");
}

function renderAuth(a) {
    const c = document.getElementById("auth-section");
    if (a) {
        c.innerHTML = `<div class="d-flex align-items-center gap-3"><div class="text-end d-none d-md-block"><a href="profilUser.html" class="text-white text-decoration-none"><div class="fw-bold small">${a.username}</div><div class="x-small opacity-50">MON PROFIL</div></a></div><button onclick="sessionStorage.removeItem('auth'); window.location.reload();" class="btn btn-outline-danger rounded-pill px-4 btn-sm fw-bold">QUITTER</button></div>`;
    } else {
        c.innerHTML = `<a href="../connexion/connexion.html" class="btn btn-primary rounded-pill px-4 fw-bold">CONNEXION</a>`;
    }
}
