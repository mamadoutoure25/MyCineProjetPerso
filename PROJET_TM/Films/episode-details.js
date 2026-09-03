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
const episodeNum = params.get("episode");

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

    if (!serieId || !seasonNum || !episodeNum) return (window.location.href = "../../series.html");

    let serie = {};
    let episode = {};

    try {
        const res = await Promise.allSettled([
            fetch(`${CONFIG.BASE}/tv/${serieId}?api_key=${CONFIG.KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`).then(r => r.json()),
            fetch(`${CONFIG.BASE}/tv/${serieId}/season/${seasonNum}/episode/${episodeNum}?api_key=${CONFIG.KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&append_to_response=credits,images,videos`).then(r => r.json())
        ]);

        if (res[0].status === 'fulfilled') serie = res[0].value || {};
        if (res[1].status === 'fulfilled') episode = res[1].value || {};

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

    try { renderHeader(serie, episode); } catch (e) { console.error("renderHeader error:", e); }
    
    try { 
        if (episode.credits) {
            renderCast(episode.credits.guest_stars, 'episode-guest-stars', 'Aucun acteur invité répertorié.');
            renderCast(episode.credits.crew, 'episode-crew', 'Aucune équipe technique répertoriée.');
        }
        if (episode.images && episode.images.stills) {
            renderGallery(episode.images.stills);
        }
    } catch (e) { console.error("renderCast/Gallery error:", e); }
}

function renderGallery(images) {
    const cont = document.getElementById("episode-gallery");
    if (!cont) return;

    if (!images || !Array.isArray(images) || images.length === 0) {
        cont.innerHTML = "<p class='opacity-50 fs-6 py-4 w-100 text-center'>Aucune image répertoriée pour cet épisode.</p>";
        return;
    }

    try {
        cont.innerHTML = images.slice(0, 12).map(img => `
            <div class="ep-card-premium" style="max-height: 250px; overflow: hidden; cursor: pointer;" onclick="window.open('${CONFIG.ORIG + img.file_path}', '_blank')">
                <img src="${CONFIG.HD + img.file_path}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            </div>
        `).join("");
    } catch (err) {
        console.error("renderGallery error:", err);
        cont.innerHTML = "<p class='opacity-50 fs-6 py-4 w-100 text-center'>Erreur lors du rendu de la galerie.</p>";
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
} else {
    initPage();
}

function renderHeader(serie, ep) {
    const sNum = seasonNum;
    const eNum = episodeNum;
    const serieName = (serie && serie.name) ? serie.name.toUpperCase() : "SÉRIE";
    
    const titleEl = document.getElementById("season-title");
    if (titleEl) titleEl.textContent = `${serieName} - S${sNum}E${eNum}`;
    
    const overviewEl = document.getElementById("season-overview");
    if (overviewEl) overviewEl.textContent = ep.overview || "Aucun synopsis disponible pour cet épisode.";
    
    const backdropEl = document.getElementById("season-backdrop") || document.getElementById("hero-backdrop");
    const bg = ep.still_path || serie.backdrop_path;
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
        const p = ep.still_path || serie.poster_path;
        posterEl.src = p ? CONFIG.HD + p : CONFIG.EMPTY_THUMB;
    }
    
    const serieLinkEl = document.getElementById("serie-link") || document.getElementById("back-to-serie");
    if (serieLinkEl) {
        serieLinkEl.href = `serie-details.html?id=${serieId}`;
        serieLinkEl.textContent = serieName;
    }

    const backBtn = document.getElementById("back-to-serie-btn");
    if (backBtn) backBtn.href = `saison-details.html?serieId=${serieId}&season=${seasonNum}`;
    if (backBtn) backBtn.innerHTML = `<i class="ph ph-arrow-left me-2 fs-5"></i> RETOUR À LA SAISON ${sNum}`;

    const breadcrumbSeason = document.getElementById("breadcrumb-season");
    if (breadcrumbSeason) breadcrumbSeason.outerHTML = `<li class="breadcrumb-item"><a href="saison-details.html?serieId=${serieId}&season=${seasonNum}" class="text-theme text-decoration-none">SAISON ${sNum}</a></li><li class="breadcrumb-item active text-theme">ÉPISODE ${eNum}</li>`;
    
    const year = ep.air_date ? getYear(ep.air_date) : "N/A";
    
    const tagsEl = document.getElementById("season-tags");
    if (tagsEl) tagsEl.innerHTML = `<span><i class="ph ph-calendar-blank me-1"></i> ${year}</span><div class="v-sep"></div><span><i class="ph ph-clock me-1"></i> ${ep.runtime ? ep.runtime + " MIN" : "N/A"}</span>`;

    const statsDate = document.getElementById("stats-episode-date");
    if (statsDate) statsDate.textContent = formatDate(ep.air_date);
    
    const statsRuntime = document.getElementById("stats-episode-runtime");
    if (statsRuntime) statsRuntime.textContent = ep.runtime ? ep.runtime + ' MIN' : 'N/A';
    
    const statsRating = document.getElementById("stats-episode-rating");
    if (statsRating) {
        const rating = ep.vote_average ? ep.vote_average.toFixed(1) : 'N/A';
        statsRating.textContent = rating !== 'N/A' ? `${rating} / 10` : 'N/A';
    }
}



window.openEpisodeVideos = async function(epNum) {
    const targetEpNum = epNum || episodeNum;
    try {
        const url = `${CONFIG.BASE}/tv/${serieId}/season/${seasonNum}/episode/${targetEpNum}/videos?api_key=${CONFIG.KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`;
        let res = await fetch(url).then(r => r.json());
        
        let videos = res.results || [];
        if (videos.length === 0) {
            const urlEn = `${CONFIG.BASE}/tv/${serieId}/season/${seasonNum}/episode/${targetEpNum}/videos?api_key=${CONFIG.KEY}`;
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

function renderCast(cast, containerId, emptyMsg) {
    const cont = document.getElementById(containerId);
    if (!cont) return;

    if (!cast || !Array.isArray(cast) || cast.length === 0) {
        cont.innerHTML = `<p class='opacity-50 fs-6 py-4 w-100 text-center'>${emptyMsg}</p>`;
        return;
    }

    try {
        cont.innerHTML = cast.slice(0, 24).map(a => `
            <div class="actor-card small-actor-card" onclick="window.location.href='actor-details.html?id=${a.id}'">
                <img src="${a.profile_path ? CONFIG.W500 + a.profile_path : CONFIG.EMPTY_POSTER}" loading="lazy" onerror="this.src='${CONFIG.EMPTY_POSTER}'">
                <div class="actor-hover-overlay">
                    <div class="actor-name text-truncate">${a.name || 'Acteur'}</div>
                    <div class="actor-role text-truncate">${a.character || a.job || "N/A"}</div>
                </div>
            </div>
        `).join("");
    } catch (err) {
        console.error("renderCast error:", err);
        cont.innerHTML = "<p class='opacity-50 fs-6 py-4 w-100 text-center'>Erreur lors du rendu.</p>";
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
