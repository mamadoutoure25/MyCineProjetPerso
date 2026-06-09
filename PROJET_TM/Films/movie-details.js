/**
 * @file movie-details.js
 * @description Cinematic Premium Version 5.2 - Corrected & Stabilized
 */

const CONFIG = {
    KEY: "04c35731a5ee918f014970082a0088b1",
    BASE: "https://api.themoviedb.org/3",
    W500: "https://image.tmdb.org/t/p/w500",
    HD: "https://image.tmdb.org/t/p/w780",
    ORIG: "https://image.tmdb.org/t/p/original",
    ACTOR: "https://image.tmdb.org/t/p/h632",
    EMPTY_POSTER: "https://via.placeholder.com/500x750?text=No+Poster",
    EMPTY_ACTOR: "https://via.placeholder.com/300x300?text=No+Photo"
};

const id = new URLSearchParams(window.location.search).get("id");
let user = null;

// Initialisation
document.addEventListener("DOMContentLoaded", async () => {
    const auth = JSON.parse(sessionStorage.getItem("auth") || "null");
    user = auth ? (auth.userId || auth.id) : null;
    
    renderAuth(auth);

    if (!id) return (window.location.href = "../../index.html");

    try {
        const movie = await fetchData(`/movie/${id}`, "append_to_response=credits,release_dates,watch/providers,videos,images,external_ids");
        if (!movie) throw new Error("Film introuvable");

        renderHero(movie);
        renderCast(movie.credits?.cast);
        renderVideos(movie.videos?.results);
        renderGallery(movie.images);
        renderProviders(movie["watch/providers"]?.results);
        renderTechnical(movie);
        
        if (movie.belongs_to_collection) {
            renderCollection(movie.belongs_to_collection.id);
        }
        
        initLists();
        initRating();
        setupQuickSearch();

    } catch (e) {
        console.error(e);
        notify("Erreur de chargement des détails", "danger");
    }
});

/**
 * Helpers
 */
async function fetchData(endpoint, params = "") {
    const url = `${CONFIG.BASE}${endpoint}?api_key=${CONFIG.KEY}&language=fr-FR&${params}`;
    const res = await fetch(url);
    return res.ok ? res.json() : null;
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

/**
 * Rendu Hero
 */
function renderHero(m) {
    const el = (id) => document.getElementById(id);
    
    if (el("movie-title")) el("movie-title").textContent = m.title;
    if (el("breadcrumb-title")) el("breadcrumb-title").textContent = m.title;
    if (el("movie-overview")) el("movie-overview").textContent = m.overview || "Pas de synopsis.";
    if (el("hero-backdrop") && m.backdrop_path) el("hero-backdrop").src = CONFIG.ORIG + m.backdrop_path;

    const year = m.release_date ? new Date(m.release_date).getFullYear() : "";
    const runtime = m.runtime ? `${m.runtime} min` : "";
    const genres = m.genres?.slice(0,3).map(g => g.name).join(", ") || "";

    let cert = "";
    if (m.release_dates && m.release_dates.results) {
        const fr = m.release_dates.results.find(r => r.iso_3166_1 === 'FR');
        const us = m.release_dates.results.find(r => r.iso_3166_1 === 'US');
        const target = fr || us || m.release_dates.results[0];
        
        if (target && target.release_dates && target.release_dates.length > 0) {
            const validCert = target.release_dates.find(d => d.certification !== "");
            if (validCert) cert = validCert.certification;
        }
    }
    
    const certBadge = cert ? `<span style="border: 1px solid rgba(255,255,255,0.3); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800;">${cert}</span><div class="v-sep"></div>` : "";

    if (el("movie-tags")) {
        el("movie-tags").innerHTML = `${certBadge}<span>${year}</span><div class="v-sep"></div><span>${genres}</span><div class="v-sep"></div><span>${runtime}</span>`;
    }

    const studioTag = el("studio-tag");
    const studio = m.production_companies?.[0];
    if (studioTag && studio) {
        studioTag.innerHTML = `<div class="studio-icon">${studio.logo_path ? `<img src="${CONFIG.W500}${studio.logo_path}">` : `<span>${studio.name[0]}</span>`}</div><span class="fw-bold">${studio.name.toUpperCase()}</span>`;
    }

    const trailer = m.videos?.results?.find(v => v.type === "Trailer");
    if (trailer && el("watch-trailer")) {
        el("watch-trailer").onclick = (e) => {
            e.preventDefault();
            openModal("video", trailer.key, m.title);
        };
    } else if (el("watch-trailer")) {
        el("watch-trailer").style.display = "none";
    }
}

/**
 * Rendu Sections
 */
function renderCast(cast) {
    const cont = document.getElementById("movie-cast");
    if (!cont || !cast) return;
    
    // On affiche plus d'acteurs car ils sont plus petits (24 au lieu de 15)
    cont.innerHTML = cast.slice(0, 24).map(a => `
        <div class="actor-card small-actor-card" onclick="window.location.href='actor-details.html?id=${a.id}'">
            <img src="${a.profile_path ? CONFIG.ACTOR + a.profile_path : CONFIG.EMPTY_ACTOR}" loading="lazy">
            <div class="actor-hover-overlay">
                <div class="actor-name">${a.name}</div>
                <div class="actor-role">${a.character || "N/A"}</div>
            </div>
        </div>
    `).join("");
}

function renderVideos(vids) {
    const cont = document.getElementById("movie-videos");
    if (!cont) return;
    const yt = vids?.filter(v => v.site === "YouTube").slice(0, 8) || [];
    cont.innerHTML = yt.map(v => `
        <div class="premium-card collection-card" onclick="openModal('video', '${v.key}', '${v.name.replace(/'/g, "\\'")}')">
            <img src="https://img.youtube.com/vi/${v.key}/maxresdefault.jpg" loading="lazy">
            <div class="play-overlay"><i class="ph-fill ph-play-circle"></i></div>
            <div class="card-details">
                <div class="card-title">${v.name}</div>
                <div class="card-meta">VIDÉO OFFICIELLE</div>
            </div>
        </div>
    `).join("");
}

function renderGallery(imgs) {
    const renderGrid = (items, gridId, isPost = false) => {
        const c = document.getElementById(gridId);
        if (!c) return;
        if (!items?.length) return (c.innerHTML = "<p class='p-5 opacity-50 text-center w-100'>Aucun média disponible.</p>");
        c.innerHTML = items.slice(0, 12).map((im, i) => `
            <div class="premium-card ${isPost ? '' : 'collection-card'}">
                <img src="${CONFIG.HD}${im.file_path}" loading="lazy">
                <div class="card-details">
                     <div class="d-flex gap-3 justify-content-center w-100 mb-3">
                        <button class="btn-circle" onclick="openModal('img', '${CONFIG.ORIG}${im.file_path}', 'Aperçu')"><i class="ph ph-magnifying-glass-plus"></i></button>
                        <button class="btn-circle" onclick="downloadImg('${CONFIG.ORIG}${im.file_path}', 'img-${i}.jpg')"><i class="ph ph-download-simple"></i></button>
                    </div>
                </div>
            </div>
        `).join("");
    };
    renderGrid(imgs?.backdrops, "grid-backdrops");
    renderGrid(imgs?.posters, "grid-posters", true);
}

function renderProviders(providerResults) {
    const cont = document.getElementById("movie-providers");
    const noProv = document.getElementById("noProviders");
    if (!cont) return;

    // Find the best region match
    let be = null;
    if (providerResults) {
        be = providerResults.BE || providerResults.FR || providerResults.US || Object.values(providerResults)[0];
    }
    
    const stream = be?.flatrate || be?.rent || be?.buy || [];
    const movieTitle = document.getElementById("movie-title")?.textContent || "";

    if (!stream.length) {
        if (noProv) noProv.classList.remove("d-none");
        return;
    }
    
    if (noProv) noProv.classList.add("d-none");
// Provider ID Mapping to their search URLs
const searchQuery = encodeURIComponent(movieTitle).replace(/%20/g, '+');
const providerLinks = {
    8: `https://www.netflix.com/search?q=${searchQuery}`, // Netflix
    119: `https://www.amazon.com/s?k=${searchQuery}&i=instant-video`, // Amazon Prime
    337: `https://www.disneyplus.com/search?q=${searchQuery}`, // Disney+
    384: `https://play.hbomax.com/search/result?q=${searchQuery}`, // HBO Max
    1889: `https://play.hbomax.com/search/result?q=${searchQuery}`, // Max (New ID)
    1899: `https://play.hbomax.com/search/result?q=${searchQuery}`, // HBO Max BE
    1825: `https://play.hbomax.com/search/result?q=${searchQuery}`, // HBO Max Amazon Channel
    10: `https://www.amazon.com/s?k=${searchQuery}&i=instant-video`, // Amazon Video (Rent)
    350: `https://tv.apple.com/search?term=${searchQuery}`, // Apple TV+
    2: `https://tv.apple.com/search?term=${searchQuery}`, // Apple iTunes
    3: `https://play.google.com/store/search?q=${searchQuery}&c=movies`, // Google Play Movies
};
    
    cont.innerHTML = stream.map(p => {
        // Use smart link if mapped, otherwise fallback to TMDB specific link or generic watch link
        let href = providerLinks[p.provider_id];
        if (!href) {
            href = be?.link ? be.link : `https://www.themoviedb.org/movie/${id}/watch`;
        }

        return `
            <a href="${href}" target="_blank" title="Rechercher sur ${p.provider_name}" class="provider-link" style="transition: 0.3s; display: inline-block;">
                <img src="${CONFIG.W500}${p.logo_path}" alt="${p.provider_name}" style="width:45px; border-radius:10px; border: 1px solid rgba(255,255,255,0.1);">
            </a>
        `;
    }).join("");
}

function renderTechnical(m) {
    const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    const budgetEl = document.getElementById("movie-budget");
    const revenueEl = document.getElementById("movie-revenue");
    if (budgetEl) budgetEl.textContent = m.budget > 0 ? fmt.format(m.budget) : "N/A";
    if (revenueEl) revenueEl.textContent = m.revenue > 0 ? fmt.format(m.revenue) : "N/A";

    const studioCont = document.getElementById("movie-production-companies");
    if (studioCont) {
        studioCont.innerHTML = m.production_companies.slice(0, 3).map(c => `
            <div class="d-flex align-items-center gap-3">
                <div style="background:#fff; width:30px; height:30px; border-radius:6px; padding:5px; display:flex; align-items:center; justify-content:center;">
                    ${c.logo_path ? `<img src="${CONFIG.W500}${c.logo_path}" style="max-width:100%; max-height:100%;">` : `<span class="text-dark fw-bold" style="font-size:0.7rem;">${c.name[0]}</span>`}
                </div>
                <span class="small fw-bold">${c.name}</span>
            </div>
        `).join("");
    }

    const releaseCont = document.getElementById("movie-release-dates");
    if (releaseCont) {
        const target = ["BE", "FR", "US"];
        releaseCont.innerHTML = (m.release_dates?.results || [])
            .filter(r => target.includes(r.iso_3166_1))
            .slice(0, 3)
            .map(r => `
                <div class="d-flex justify-content-between align-items-center">
                    <span class="opacity-50 small fw-bold">${r.iso_3166_1}</span>
                    <span class="fw-bold small text-primary">${new Date(r.release_dates[0].release_date).toLocaleDateString()}</span>
                </div>
            `).join("");
    }

    const idsCont = document.getElementById("external-links");
    if (idsCont && m.external_ids) {
        const ids = m.external_ids;
        let html = "";
        if (ids.imdb_id) html += `<a href="https://imdb.com/title/${ids.imdb_id}" target="_blank" class="text-white opacity-50"><i class="ph ph-imdb-logo fs-2"></i></a>`;
        if (ids.facebook_id) html += `<a href="https://facebook.com/${ids.facebook_id}" target="_blank" class="text-white opacity-50"><i class="ph ph-facebook-logo fs-2"></i></a>`;
        idsCont.innerHTML = html;
    }
}

async function renderCollection(collectionId) {
    const wrapper = document.getElementById("collection-wrapper");
    const container = document.getElementById("movie-collection");
    const titleEl = document.getElementById("collection-name");

    try {
        const collection = await fetchData(`/collection/${collectionId}`);
        if (!collection || !collection.parts) return;

        if (titleEl) titleEl.textContent = collection.name.toUpperCase();
        if (wrapper) wrapper.style.display = "block";

        if (container) {
            container.innerHTML = collection.parts
                .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
                .map(m => `
                    <div class="premium-card" onclick="window.location.href='movie-details.html?id=${m.id}'">
                        <img src="${m.poster_path ? CONFIG.W500 + m.poster_path : CONFIG.EMPTY_POSTER}" loading="lazy">
                        <div class="card-details">
                            <div class="card-title text-truncate">${m.title}</div>
                            <div class="card-meta">
                                <span class="rating-badge">
                                    <i class="ph-fill ph-star"></i> ${m.vote_average ? m.vote_average.toFixed(1) : '0.0'}
                                </span>
                                <span class="opacity-75">${m.release_date ? new Date(m.release_date).getFullYear() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                `).join("");
        }
    } catch (e) { console.error(e); }
}

/**
 * Interactions
 */
function openModal(type, src, title) {
    const cont = document.getElementById("mediaModalContent");
    const titleEl = document.getElementById("mediaModalTitle");
    if (titleEl) titleEl.textContent = title;
    if (cont) {
        cont.innerHTML = type === "video" ? `<div class="ratio ratio-16x9"><iframe src="https://www.youtube.com/embed/${src}?autoplay=1" allowfullscreen></iframe></div>` : `<img src="${src}" class="img-fluid rounded-4 shadow-lg">`;
    }
    const modal = new bootstrap.Modal(document.getElementById('mediaModal'));
    modal.show();
}

async function downloadImg(url, name) {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = name;
        link.click();
        notify("Téléchargement réussi", "success");
    } catch (e) { window.open(url, '_blank'); }
}

function setupQuickSearch() {
    const input = document.getElementById("quick-search");
    if (!input) return;
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            window.location.href = `films.html?search=${encodeURIComponent(input.value)}`;
        }
    });
}

function renderAuth(a) {
    const c = document.getElementById("auth-section");
    if (!c) return;
    if (a) {
        c.innerHTML = `<div class="d-flex align-items-center gap-3"><div class="text-end d-none d-md-block"><a href="profilUser.html" class="text-white text-decoration-none"><div class="fw-bold small">${a.username}</div><div class="x-small opacity-50">MON PROFIL</div></a></div><button onclick="sessionStorage.removeItem('auth'); window.location.reload();" class="btn btn-outline-danger rounded-pill px-4 btn-sm fw-bold">QUITTER</button></div>`;
    } else {
        c.innerHTML = `<a href="../connexion/connexion.html" class="btn btn-primary rounded-pill px-4 fw-bold">CONNEXION</a>`;
    }
}

async function initLists() {
    if (!user || !id) return;
    const types = [
        { id: "add-to-favorites", api: "favorites.php", key: "is_favorite" },
        { id: "add-to-watchlist", api: "watchlist.php", key: "is_in_watchlist" },
        { id: "mark-as-watched", api: "watched.php", key: "is_watched" }
    ];
    for (const t of types) {
        const btn = document.getElementById(t.id);
        if (!btn) continue;
        try {
            const res = await (await fetch(`./${t.api}?user_id=${user}&film_id=${id}&media_type=movie`)).json();
            let act = res[t.key];
            if (act) btn.classList.add("active");
            btn.onclick = async () => {
                const method = act ? "DELETE" : "POST";
                const r = await (await fetch(`./${t.api}`, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify({user_id:user, film_id:parseInt(id), media_type:'movie'}) })).json();
                if (r.success) { act = !act; btn.classList.toggle("active", act); notify(r.message, "success"); }
            };
        } catch(e) {}
    }
}

function initRating() {
    const stars = document.querySelectorAll("#star-rating .star");
    const clear = document.getElementById("btn-clear-rating");
    const fb = document.getElementById("rating-feedback");

    const update = (v) => {
        stars.forEach(s => {
            const icon = s.querySelector("i");
            if (icon) icon.className = s.dataset.value <= v ? "ph-fill ph-star text-warning" : "ph ph-star text-muted";
        });
        if (clear) clear.classList.toggle("d-none", v === 0);
    };

    if (user && id) {
        fetch(`./notes.php?user_id=${user}&film_id=${id}&media_type=movie`).then(r => r.json()).then(r => {
            if (r.success && r.note) { update(r.note); if (fb) fb.textContent = `Votre note: ${r.note}/10`; }
        }).catch(()=>{});
    }

    stars.forEach(s => s.onclick = async () => {
        if (!user) return notify("Connectez-vous pour noter", "warning");
        const v = s.dataset.value;
        const r = await (await fetch('./notes.php', { method: "POST", headers: {'Content-Type':'application/json'}, body: JSON.stringify({user_id:user, film_id:id, media_type:'movie', note:v}) })).json();
        if (r.success) { update(v); if (fb) fb.textContent = `Note: ${v}/10`; notify("Note enregistrée", "success"); }
    });

    if (clear) {
        clear.onclick = async () => {
            const r = await (await fetch('./notes.php', { method: "DELETE", headers: {'Content-Type':'application/json'}, body: JSON.stringify({user_id:user, film_id:id, media_type:'movie'}) })).json();
            if (r.success) { update(0); if (fb) fb.textContent = ""; notify("Note supprimée", "info"); }
        };
    }
}

window.downloadImg = downloadImg;
window.openModal = openModal;
