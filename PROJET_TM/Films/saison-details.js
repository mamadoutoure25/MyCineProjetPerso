/**
 * @file saison-details.js
 * @description Cinematic Premium for Seasons
 */

const CONFIG = {
    KEY: window.TMDB_CONFIG.API_KEY,
    BASE: "https://api.themoviedb.org/3",
    W500: "https://image.tmdb.org/t/p/w500",
    HD: "https://image.tmdb.org/t/p/w780",
    ORIG: "https://image.tmdb.org/t/p/original",
    ACTOR: "https://image.tmdb.org/t/p/h632",
    EMPTY_POSTER: "https://via.placeholder.com/500x750?text=MYCINE",
    EMPTY_THUMB: "https://via.placeholder.com/500x281?text=EPISODE"
};

const params = new URLSearchParams(window.location.search);
const serieId = params.get("serieId");
const seasonNum = params.get("season");

function formatDate(dStr) {
    if (!dStr) return 'À venir';
    try {
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return dStr;
        return d.toLocaleDateString('fr-FR');
    } catch (e) {
        return dStr;
    }
}

function getYear(dStr) {
    if (!dStr) return 'N/A';
    try {
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return 'N/A';
        return d.getFullYear();
    } catch (e) {
        return 'N/A';
    }
}

async function initPage() {
    const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : null;
    renderAuth(auth);

    if (!serieId || !seasonNum) return (window.location.href = "../../series.html");

    let serie = {};
    let season = {};
    let credits = { cast: [] };

    try {
        const res = await Promise.allSettled([
            fetch(`${CONFIG.BASE}/tv/${serieId}?api_key=${CONFIG.KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&append_to_response=credits,aggregate_credits`).then(r => r.json()),
            fetch(`${CONFIG.BASE}/tv/${serieId}/season/${seasonNum}?api_key=${CONFIG.KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`).then(r => r.json()),
            fetch(`${CONFIG.BASE}/tv/${serieId}/season/${seasonNum}/credits?api_key=${CONFIG.KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`).then(r => r.json())
        ]);

        if (res[0].status === 'fulfilled') serie = res[0].value || {};
        if (res[1].status === 'fulfilled') season = res[1].value || {};
        if (res[2].status === 'fulfilled') credits = res[2].value || { cast: [] };

        const includeAdult = localStorage.getItem("include_adult") === "true";
        if (serie.adult && !includeAdult) {
            document.body.innerHTML = `
                <div class="d-flex flex-column align-items-center justify-content-center vh-100 bg-dark text-white text-center p-4">
                    <i class="ph ph-warning-circle text-danger mb-3" style="font-size: 4rem;"></i>
                    <h2 class="fw-bold mb-3">Contenu Adulte Masqué</h2>
                    <p class="opacity-75 mb-4">Ce contenu est restreint selon vos paramètres de profil.<br>Vous pouvez modifier cela dans vos paramètres.</p>
                    <button class="btn btn-primary rounded-pill px-4 fw-bold" onclick="history.back()">RETOUR</button>
                </div>
            `;
            return;
        }

    } catch (e) {
        console.error("Fetch error:", e);
    }

    try { renderHeader(serie, season); } catch (e) { console.error("renderHeader error:", e); }
    try { renderEpisodes(season ? season.episodes : []); } catch (e) { console.error("renderEpisodes error:", e); }

    const finalCast = (credits && Array.isArray(credits.cast) && credits.cast.length > 0)
        ? credits.cast
        : (serie.aggregate_credits?.cast || serie.credits?.cast || []);

    try { renderCast(finalCast); } catch (e) { console.error("renderCast error:", e); }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
} else {
    initPage();
}

function renderHeader(serie, s) {
    const sNum = (s && s.season_number !== undefined) ? s.season_number : seasonNum;
    const serieName = (serie && serie.name) ? serie.name.toUpperCase() : "SÉRIE";
    
    const titleEl = document.getElementById("season-title");
    if (titleEl) titleEl.textContent = `${serieName} - SAISON ${sNum}`;
    
    const overviewEl = document.getElementById("season-overview");
    if (overviewEl) overviewEl.textContent = (s && s.overview) || serie.overview || "Aucun synopsis disponible pour cette saison.";
    
    const backdropEl = document.getElementById("season-backdrop") || document.getElementById("hero-backdrop");
    const bg = (s && s.backdrop_path) || serie.backdrop_path;
    if (backdropEl) {
        if (bg) {
            backdropEl.src = CONFIG.ORIG + bg;
            backdropEl.style.display = "";
        } else {
            backdropEl.style.display = "none";
        }
    }
    
    const posterEl = document.getElementById("season-poster");
    if (posterEl) {
        const p = (s && s.poster_path) || serie.poster_path;
        posterEl.src = p ? CONFIG.W500 + p : CONFIG.EMPTY_POSTER;
    }
    
    const serieLinkEl = document.getElementById("serie-link") || document.getElementById("back-to-serie");
    if (serieLinkEl) {
        serieLinkEl.href = `serie-details.html?id=${serieId}`;
        serieLinkEl.textContent = serieName;
    }

    const backBtn = document.getElementById("back-to-serie-btn");
    if (backBtn) backBtn.href = `serie-details.html?id=${serieId}`;

    const breadcrumbSeason = document.getElementById("breadcrumb-season");
    if (breadcrumbSeason) breadcrumbSeason.textContent = `SAISON ${sNum}`;
    
    const epCount = (s && s.episodes && Array.isArray(s.episodes)) ? s.episodes.length : 0;
    const year = (s && s.air_date) ? getYear(s.air_date) : getYear(serie.first_air_date);
    
    const tagsEl = document.getElementById("season-tags");
    if (tagsEl) tagsEl.innerHTML = `<span><i class="ph ph-calendar-blank me-1"></i> ${year}</span><div class="v-sep"></div><span><i class="ph ph-film-strip me-1"></i> ${epCount} Épisode${epCount > 1 ? 's' : ''}</span>`;

    // Populate Glassmorphic Stats Section
    const statsEp = document.getElementById("stats-episodes-count");
    if (statsEp) statsEp.textContent = `${epCount} Épisode${epCount > 1 ? 's' : ''}`;
    const statsYear = document.getElementById("stats-season-year");
    if (statsYear) statsYear.textContent = year;
    const statsRating = document.getElementById("stats-season-rating");
    if (statsRating) {
        const rating = s && s.vote_average ? s.vote_average.toFixed(1) : (serie && serie.vote_average ? serie.vote_average.toFixed(1) : 'N/A');
        statsRating.textContent = rating !== 'N/A' ? `${rating} / 10` : 'N/A';
    }
}

function renderEpisodes(eps) {
    const cont = document.getElementById("episodes-container");
    if (!cont) return;

    if (!eps || !Array.isArray(eps) || eps.length === 0) {
        cont.innerHTML = "<p class='opacity-50 fs-6 py-4'>Aucun épisode répertorié pour cette saison pour le moment.</p>";
        return;
    }

    try {
        cont.innerHTML = eps.map(e => `
            <div class="ep-card-premium" style="cursor: pointer;" onclick="window.location.href='episode-details.html?serieId=${serieId}&season=${seasonNum}&episode=${e.episode_number}'">
                <div class="ep-thumb-wrap">
                    <img src="${e.still_path ? CONFIG.HD + e.still_path : CONFIG.EMPTY_THUMB}" loading="lazy" onerror="this.src='${CONFIG.EMPTY_THUMB}'">
                    <div class="ep-badge-chip">ÉPISODE ${e.episode_number}</div>
                </div>
                <div class="ep-content">
                    <div class="ep-meta-top"><i class="ph ph-film-strip me-1"></i> ÉPISODE ${e.episode_number}</div>
                    <div class="ep-title-main">${e.name || ('Épisode ' + e.episode_number)}</div>
                    <p class="ep-desc-main">${e.overview || "Pas de description disponible pour cet épisode."}</p>
                    <div class="ep-footer-meta">
                        <span><i class="ph ph-calendar-blank me-2"></i>${formatDate(e.air_date)}</span>
                        <span><i class="ph ph-clock me-2"></i>${e.runtime ? e.runtime + ' MIN' : 'N/A'}</span>
                        ${e.vote_average ? `<span class="text-accent"><i class="ph-fill ph-star me-1"></i>${e.vote_average.toFixed(1)}</span>` : ''}
                    </div>
                    <div class="mt-4">
                        <button class="btn btn-sm rounded-pill px-4 py-2 ep-btn-watch" onclick="event.stopPropagation(); openEpisodeVideos(${e.episode_number})">
                            <i class="ph ph-play-circle me-1 fs-6"></i> VIDÉOS
                        </button>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (err) {
        console.error("renderEpisodes error:", err);
        cont.innerHTML = "<p class='opacity-50 fs-6 py-4'>Erreur lors du rendu des épisodes.</p>";
    }
}

window.openEpisodeVideos = async function(episodeNum) {
    try {
        const url = `${CONFIG.BASE}/tv/${serieId}/season/${seasonNum}/episode/${episodeNum}/videos?api_key=${CONFIG.KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`;
        let res = await fetch(url).then(r => r.json());
        
        let videos = res.results || [];
        if (videos.length === 0) {
            const urlEn = `${CONFIG.BASE}/tv/${serieId}/season/${seasonNum}/episode/${episodeNum}/videos?api_key=${CONFIG.KEY}`;
            const resEn = await fetch(urlEn).then(r => r.json());
            videos = resEn.results || [];
        }

        if (videos.length === 0) {
            customAlert("Aucune vidéo disponible pour cet épisode.");
            return;
        }

        const video = videos.find(v => v.type === "Trailer" || v.type === "Teaser" || v.type === "Recap") || videos[0];
        
        if (video.site === "YouTube") {
            const modalContent = document.getElementById("episodeMediaModalContent");
            if (modalContent) {
                modalContent.innerHTML = `<div class="ratio ratio-16x9"><iframe src="https://www.youtube.com/embed/${video.key}?autoplay=1&controls=1&modestbranding=1" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe></div><div class="text-start mt-3"><h5 class="fw-bold">${video.name}</h5><p class="opacity-50 small mb-0">${video.type}</p></div>`;
                const modal = new bootstrap.Modal(document.getElementById('episodeMediaModal'));
                modal.show();
                
                document.getElementById('episodeMediaModal').addEventListener('hidden.bs.modal', function () {
                    modalContent.innerHTML = '';
                }, { once: true });
            }
        } else {
            customAlert("Format vidéo non supporté.", "danger");
        }
    } catch (e) {
        console.error("Erreur vidéos:", e);
        customAlert("Erreur lors de la récupération des vidéos.", "danger");
    }
};

function renderCast(cast) {
    const cont = document.getElementById("season-cast");
    if (!cont) return;

    if (!cast || !Array.isArray(cast) || cast.length === 0) {
        cont.innerHTML = "<p class='opacity-50 fs-6 py-4 w-100 text-center'>Aucun membre de la distribution répertorié pour cette saison.</p>";
        return;
    }

    const statsCast = document.getElementById("stats-cast-count");
    if (statsCast) statsCast.textContent = `${cast.length} Acteurs`;

    try {
        cont.innerHTML = cast.slice(0, 24).map(a => `
            <div class="actor-card small-actor-card" onclick="window.location.href='actor-details.html?id=${a.id}'">
                <img src="${a.profile_path ? CONFIG.W500 + a.profile_path : CONFIG.EMPTY_POSTER}" loading="lazy" onerror="this.src='${CONFIG.EMPTY_POSTER}'">
                <div class="actor-hover-overlay">
                    <div class="actor-name text-truncate">${a.name || 'Acteur'}</div>
                    <div class="actor-role text-truncate">${a.character || "N/A"}</div>
                </div>
            </div>
        `).join("");
    } catch (err) {
        console.error("renderCast error:", err);
        cont.innerHTML = "<p class='opacity-50 fs-6 py-4 w-100 text-center'>Erreur lors du rendu de la distribution.</p>";
    }
}

function renderAuth(a) {
    const c = document.getElementById("auth-section");
    if (!c) return;
    if (a) {
        const pseudo = a.pseudo || a.username || a.name || (a.user && (a.user.pseudo || a.user.username)) || "Utilisateur";
        c.innerHTML = `<div class="d-flex align-items-center gap-3"><div class="text-end d-none d-md-block"><a href="profilUser.html" class="text-theme text-decoration-none"><div class="fw-bold small">${pseudo}</div><div class="x-small opacity-50">MON PROFIL</div></a></div><a href="../profil/settings.html" class="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center" title="Paramètres"><i class="ph ph-gear fs-5"></i></a><button onclick="sessionStorage.removeItem('auth'); localStorage.removeItem('lastAuth'); window.location.reload();" class="btn btn-outline-danger rounded-pill px-4 btn-sm fw-bold">QUITTER</button></div>`;
    } else {
        c.innerHTML = `<a href="../connexion/connexion.html" class="btn btn-primary rounded-pill px-4 fw-bold">CONNEXION</a>`;
    }
}
