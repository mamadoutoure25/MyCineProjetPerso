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
let currentMovieData = null;
let customMoviePoster = null;

function getAuthHeaders() {
    const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : null;
    const headers = { 'Content-Type': 'application/json' };
    if (auth && auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
    }
    return headers;
}

async function loadUserCustomPoster() {
    if (!id) return;
    const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : null;
    user = auth ? (auth.userId || auth.id) : null;

    if (user || (auth && auth.token)) {
        try {
            const res = await fetch(`./user_posters.php?user_id=${user || ''}&tmdb_id=${id}&media_type=movie`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.poster_path) {
                    customMoviePoster = data.poster_path;
                    localStorage.setItem(`custom_movie_poster_${id}`, customMoviePoster);
                } else if (data.success && data.poster_path === null) {
                    localStorage.removeItem(`custom_movie_poster_${id}`);
                    customMoviePoster = null;
                }
            }
        } catch (e) {
            console.warn("Erreur chargement affiche personnalisée API:", e);
        }
    } else {
        customMoviePoster = localStorage.getItem(`custom_movie_poster_${id}`);
    }
}

async function initPage() {
    const auth = JSON.parse(sessionStorage.getItem("auth") || localStorage.getItem("lastAuth") || "null");
    user = auth ? (auth.userId || auth.id) : null;
    
    renderAuth(auth);

    if (!id) return (window.location.href = "../../index.html");

    try {
        await loadUserCustomPoster();
        const movie = await fetchData(`/movie/${id}`, "append_to_response=credits,release_dates,watch/providers,videos,images,external_ids");
        if (!movie) throw new Error("Film introuvable");
        currentMovieData = movie;

        renderHero(movie);
        renderCast(movie.credits?.cast);
        renderSoundtrack(movie);
        renderVideos(movie.videos?.results);
        renderGallery(movie.images);
        renderProviders(movie["watch/providers"]?.results);
        renderTechnical(movie);
        loadAwardsData(movie.external_ids?.imdb_id, "awards-display-grid", movie.title);
        
        if (movie.belongs_to_collection) {
            renderCollection(movie.belongs_to_collection.id);
        }
        
        initLists();
        initRating();
        setupQuickSearch();

    } catch (e) {
        console.error(e);
        notify("Erreur de chargement du film", "danger");
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
} else {
    initPage();
}

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

    const defaultPoster = m.poster_path ? CONFIG.W500 + m.poster_path : CONFIG.EMPTY_POSTER;
    const activePoster = customMoviePoster || defaultPoster;
    if (el("movie-poster-img")) el("movie-poster-img").src = activePoster;
    if (el("side-poster-item")) el("side-poster-item").classList.remove("d-none");
    if (el("btn-reset-poster-side")) el("btn-reset-poster-side").style.display = customMoviePoster ? "inline-block" : "none";

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
        if (studio.logo_path) {
            studioTag.innerHTML = `<div class="studio-logo-badge" style="background:#ffffff; padding:6px 14px; border-radius:12px; display:inline-flex; align-items:center; max-height:48px; box-shadow:0 4px 15px rgba(0,0,0,0.3);"><img src="${CONFIG.W500}${studio.logo_path}" alt="${studio.name}" style="max-height:36px; max-width:180px; object-fit:contain; filter:none;"></div><span class="fw-bold text-white ms-2" style="letter-spacing:2px; font-size:0.85rem;">${studio.name.toUpperCase()}</span>`;
        } else {
            studioTag.innerHTML = `<span class="fw-bold text-accent" style="letter-spacing:2px; font-size:0.85rem;">${studio.name.toUpperCase()}</span>`;
        }
    }

    if (el("side-budget-item")) {
        if (m.budget && m.budget > 0) {
            el("movie-budget").textContent = m.budget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
            el("side-budget-item").classList.remove("d-none");
        } else {
            el("side-budget-item").classList.add("d-none");
        }
    }

    if (el("side-revenue-item")) {
        if (m.revenue && m.revenue > 0) {
            el("movie-revenue").textContent = m.revenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
            el("side-revenue-item").classList.remove("d-none");
        } else {
            el("side-revenue-item").classList.add("d-none");
        }
    }

    // Populate Glassmorphic Stats Section
    if (el("stats-movie-runtime")) {
        el("stats-movie-runtime").textContent = runtime || "N/A";
    }
    if (el("stats-movie-revenue")) {
        if (m.revenue && m.revenue > 0) {
            el("stats-movie-revenue").textContent = m.revenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
        } else if (m.budget && m.budget > 0) {
            el("stats-movie-revenue").textContent = m.budget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $ (Budget)";
        } else {
            el("stats-movie-revenue").textContent = "N/A";
        }
    }
    if (el("stats-movie-rating")) {
        el("stats-movie-rating").textContent = m.vote_average ? `${m.vote_average.toFixed(1)} / 10` : "N/A";
    }
    if (el("stats-movie-cert")) {
        el("stats-movie-cert").textContent = cert ? cert : "Tous publics";
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
    
    cont.innerHTML = cast.slice(0, 24).map(a => `
        <div class="actor-card small-actor-card" onclick="window.location.href='actor-details.html?id=${a.id}'">
            <img src="${a.profile_path ? CONFIG.ACTOR + a.profile_path : CONFIG.EMPTY_ACTOR}" loading="lazy" onerror="this.src='${CONFIG.EMPTY_POSTER}'">
            <div class="actor-hover-overlay actor-details">
                <div class="actor-name text-truncate" title="${a.name}">${a.name}</div>
                <div class="actor-role text-truncate" title="${a.character || 'N/A'}">${a.character || "N/A"}</div>
            </div>
        </div>
    `).join("");
}

function renderSoundtrack(m) {
    const wrapper = document.getElementById("soundtrack-wrapper");
    const composersCont = document.getElementById("movie-composers");
    const platformsCont = document.getElementById("music-platforms");
    const videosCont = document.getElementById("soundtrack-videos");
    const videosWrapper = document.getElementById("soundtrack-videos-container");

    if (!wrapper || !m) return;

    // Détection des compositeurs de la musique originale dans crew
    const crew = m.credits?.crew || [];
    let composers = crew.filter(c => c.job === "Original Music Composer" || c.job === "Music");
    
    if (composers.length === 0) {
        composers = crew.filter(c => c.department === "Sound" && (c.job.includes("Composer") || c.job.includes("Music")));
    }

    const uniqueComposers = [];
    const seenIds = new Set();
    composers.forEach(c => {
        if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            uniqueComposers.push(c);
        }
    });

    if (uniqueComposers.length > 0 && composersCont) {
        composersCont.innerHTML = uniqueComposers.map(c => `
            <div class="composer-card" onclick="window.location.href='actor-details.html?id=${c.id}'">
                <img class="composer-avatar" src="${c.profile_path ? CONFIG.W500 + c.profile_path : CONFIG.EMPTY_ACTOR}" alt="${c.name}">
                <div>
                    <div class="fw-bold text-theme">${c.name}</div>
                    <div class="x-small text-accent fw-bold"><i class="ph-fill ph-music-notes me-1"></i> ${c.job || 'Compositeur Musique Originale'}</div>
                </div>
            </div>
        `).join("");
    } else if (composersCont) {
        composersCont.innerHTML = `<div class="x-small opacity-50 p-2">Non renseigné</div>`;
    }

    // Raccourcis de recherche sur les plateformes de streaming musical
    if (platformsCont) {
        const searchTitle = encodeURIComponent((m.title || m.original_title) + " Original Soundtrack");
        platformsCont.innerHTML = `
            <a href="https://open.spotify.com/search/${searchTitle}" target="_blank" class="music-btn music-btn-spotify">
                <i class="ph-fill ph-spotify-logo fs-4"></i> Spotify
            </a>
            <a href="https://music.youtube.com/search?q=${searchTitle}" target="_blank" class="music-btn music-btn-youtube">
                <i class="ph-fill ph-youtube-logo fs-4"></i> YouTube Music
            </a>
            <a href="https://music.apple.com/fr/search?term=${searchTitle}" target="_blank" class="music-btn music-btn-apple">
                <i class="ph-fill ph-apple-logo fs-4"></i> Apple Music
            </a>
            <a href="https://www.deezer.com/search/${searchTitle}" target="_blank" class="music-btn music-btn-deezer">
                <i class="ph-fill ph-music-note fs-4"></i> Deezer
            </a>
        `;
    }

    // Extraits et clips vidéo musicaux
    const musicVids = (m.videos?.results || []).filter(v => 
        v.site === "YouTube" && (
            v.type === "Music Video" || 
            v.name.toLowerCase().includes("music") || 
            v.name.toLowerCase().includes("soundtrack") || 
            v.name.toLowerCase().includes("theme") ||
            v.name.toLowerCase().includes("b.o")
        )
    );

    if (musicVids.length > 0 && videosCont && videosWrapper) {
        videosWrapper.style.display = "block";
        videosCont.innerHTML = musicVids.map(v => `
            <div class="premium-card collection-card" onclick="openModal('video', '${v.key}', '${v.name.replace(/'/g, "\\'")}')">
                <img src="https://img.youtube.com/vi/${v.key}/maxresdefault.jpg" loading="lazy">
                <div class="play-overlay"><i class="ph-fill ph-play-circle"></i></div>
                <div class="card-details">
                    <div class="card-title">${v.name}</div>
                    <div class="card-meta">BANDE ORIGINALE</div>
                </div>
            </div>
        `).join("");
    } else if (videosWrapper) {
        videosWrapper.style.display = "none";
    }

    wrapper.style.display = "block";
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

        const currentActivePoster = customMoviePoster || (currentMovieData?.poster_path ? CONFIG.W500 + currentMovieData.poster_path : '');

        c.innerHTML = items.slice(0, 18).map((im, i) => {
            const fullUrl = `${CONFIG.HD}${im.file_path}`;
            const originalUrl = `${CONFIG.ORIG}${im.file_path}`;
            const isSelected = isPost && currentActivePoster && im.file_path && currentActivePoster.includes(im.file_path);

            return `
                <div class="premium-card ${isSelected ? 'border-primary' : ''} ${isPost ? '' : 'collection-card'}" style="position: relative;">
                    <img src="${fullUrl}" loading="lazy" style="border-radius: 16px; width: 100%; aspect-ratio: ${isPost ? '2/3' : '16/9'}; object-fit: cover;">
                    ${isSelected ? `<div class="position-absolute top-0 start-0 m-2 badge bg-primary rounded-pill px-3 py-1.5 fw-bold shadow"><i class="ph-fill ph-check-circle me-1"></i> Actuelle</div>` : ''}
                    <div class="card-details">
                        <div class="d-flex flex-column gap-2 justify-content-center align-items-center w-100 mt-auto">
                            ${isPost ? (
                                isSelected 
                                    ? `<span class="badge bg-primary rounded-pill px-3 py-1.5 fw-bold mb-1"><i class="ph-fill ph-check-circle me-1"></i> Affiche Sélectionnée</span>`
                                    : `<button class="btn btn-sm btn-primary rounded-pill px-3 py-1.5 x-small fw-bold shadow-sm mb-1" onclick="changerAfficheFilm('${originalUrl}')" title="Définir comme affiche principale"><i class="ph ph-check me-1"></i> Choisir cette affiche</button>`
                            ) : ''}
                            <div class="d-flex gap-2 justify-content-center align-items-center mt-1">
                                <button class="btn btn-sm btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;" onclick="openModal('img', '${originalUrl}', 'Aperçu HD')" title="Aperçu / Zoomer"><i class="ph ph-eye fs-5 text-dark"></i></button>
                                <button class="btn btn-sm btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;" onclick="downloadImg('${originalUrl}', 'film-media-${i + 1}.jpg')" title="Télécharger HD"><i class="ph ph-download-simple fs-5 text-dark"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
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
    if (budgetEl) budgetEl.textContent = m.budget > 0 ? fmt.format(m.budget) : "Non communiqué";
    if (revenueEl) revenueEl.textContent = m.revenue > 0 ? fmt.format(m.revenue) : "Non communiqué";

    const studioCont = document.getElementById("movie-production-companies");
    if (studioCont) {
        if (m.production_companies && m.production_companies.length > 0) {
            studioCont.innerHTML = m.production_companies.slice(0, 4).map(c => `
                <a href="company-details.html?id=${c.id}" class="studio-item-card" title="Voir les films de ${c.name}">
                    <div class="studio-logo-box">
                        ${c.logo_path ? `<img src="${CONFIG.W500}${c.logo_path}" alt="${c.name}">` : `<span class="text-dark fw-black" style="font-size:0.8rem;">${c.name.charAt(0)}</span>`}
                    </div>
                    <span class="studio-name">${c.name}</span>
                </a>
            `).join("");
        } else {
            studioCont.innerHTML = `<div class="x-small text-muted p-2">Non communiqué</div>`;
        }
    }

    const releaseCont = document.getElementById("movie-release-dates");
    if (releaseCont) {
        const target = ["BE", "FR", "US"];
        releaseCont.innerHTML = (m.release_dates?.results || [])
            .filter(r => target.includes(r.iso_3166_1))
            .slice(0, 3)
            .map(r => `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="tech-label">${r.iso_3166_1}</span>
                    <span class="fw-bold small text-accent">${new Date(r.release_dates[0].release_date).toLocaleDateString()}</span>
                </div>
            `).join("");
    }

    const idsCont = document.getElementById("external-links");
    if (idsCont && m.external_ids) {
        const ids = m.external_ids;
        let html = "";
        if (ids.imdb_id) html += `<a href="https://imdb.com/title/${ids.imdb_id}" target="_blank" class="social-link-btn" title="Fiche IMDb"><i class="ph-fill ph-film-strip"></i></a>`;
        if (ids.facebook_id) html += `<a href="https://facebook.com/${ids.facebook_id}" target="_blank" class="social-link-btn" title="Facebook"><i class="ph-fill ph-facebook-logo"></i></a>`;
        if (ids.instagram_id) html += `<a href="https://instagram.com/${ids.instagram_id}" target="_blank" class="social-link-btn" title="Instagram"><i class="ph-fill ph-instagram-logo"></i></a>`;
        if (ids.twitter_id) html += `<a href="https://twitter.com/${ids.twitter_id}" target="_blank" class="social-link-btn" title="Twitter / X"><i class="ph-fill ph-twitter-logo"></i></a>`;
        if (m.homepage) html += `<a href="${m.homepage}" target="_blank" class="social-link-btn" title="Site Officiel"><i class="ph-fill ph-globe"></i></a>`;
        idsCont.innerHTML = html;
    }

    const crew = m.credits?.crew || [];
    const comp = crew.find(c => c.job === "Original Music Composer" || c.job === "Music");
    const origTitleEl = document.getElementById("movie-original-title");
    if (origTitleEl) {
        origTitleEl.innerHTML = `
            <div class="tech-value">${m.original_title || m.title}</div>
            ${comp ? `<div class="mt-2 text-accent fw-bold small"><i class="ph-fill ph-music-notes me-1"></i> Musique : <a href="actor-details.html?id=${comp.id}" class="text-accent text-decoration-none border-bottom border-accent">${comp.name}</a></div>` : ''}
        `;
    }
}

async function renderCollection(collectionId) {
    const wrapper = document.getElementById("collection-wrapper");
    const container = document.getElementById("movie-collection");
    const titleEl = document.getElementById("collection-name");
    const collectionLink = document.getElementById("collection-link");
    const sideItem = document.getElementById("side-collection-item");
    const sideLink = document.getElementById("side-collection-link");

    try {
        const collection = await fetchData(`/collection/${collectionId}`);
        if (!collection || !collection.parts) return;

        const targetUrl = `collection.html?id=${collectionId}`;

        if (titleEl) {
            titleEl.innerHTML = `<a href="${targetUrl}" class="text-white text-decoration-none">${collection.name.toUpperCase()}</a>`;
        }
        if (collectionLink) {
            collectionLink.href = targetUrl;
            collectionLink.style.display = "inline-flex";
        }
        if (sideItem && sideLink) {
            sideLink.href = targetUrl;
            sideLink.textContent = collection.name;
            sideItem.classList.remove("d-none");
        }
        if (wrapper) wrapper.style.display = "block";

        if (container) {
            const customPoster = localStorage.getItem(`custom_collection_poster_${collectionId}`);
            const collectionPosterSrc = customPoster || (collection.poster_path ? CONFIG.W500 + collection.poster_path : CONFIG.EMPTY_POSTER);
            const collectionCard = `
                <div class="premium-card" style="border: 2px solid var(--accent);" onclick="window.location.href='${targetUrl}'">
                    <img src="${collectionPosterSrc}" loading="lazy">
                    <div class="card-details">
                        <div class="card-title text-truncate text-accent fw-bold">${collection.name}</div>
                        <div class="card-meta">
                            <span class="rating-badge bg-primary text-white"><i class="ph-fill ph-stack"></i> SAGA (${collection.parts.length})</span>
                            <span class="text-accent fw-bold small">VOIR <i class="ph ph-arrow-right"></i></span>
                        </div>
                    </div>
                </div>
            `;

            const moviesCards = collection.parts
                .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
                .map(m => {
                    const defaultPoster = m.poster_path ? CONFIG.W500 + m.poster_path : CONFIG.EMPTY_POSTER;
                    const posterSrc = window.getCustomPoster ? window.getCustomPoster(m.id, defaultPoster, 'movie') : (localStorage.getItem(`custom_movie_poster_${m.id}`) || defaultPoster);
                    return `
                        <div class="premium-card" onclick="window.location.href='movie-details.html?id=${m.id}'">
                            <img data-movie-id="${m.id}" src="${posterSrc}" loading="lazy">
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
                    `;
                }).join("");

            container.innerHTML = collectionCard + moviesCards;
        }
    } catch (e) { console.error(e); }
}

/**
 * Interactions
 */
function openModal(type, src, title) {
    const cont = document.getElementById("mediaModalContent");
    const titleEl = document.getElementById("mediaModalTitle");
    const modalEl = document.getElementById('mediaModal');
    if (titleEl) titleEl.textContent = title;
    if (cont) {
        cont.innerHTML = type === "video" ? `<div class="ratio ratio-16x9"><iframe src="https://www.youtube.com/embed/${src}?autoplay=1" allowfullscreen></iframe></div>` : `<img src="${src}" class="img-fluid rounded-4 shadow-lg">`;
    }
    if (modalEl && !modalEl.dataset.listenerAdded) {
        modalEl.addEventListener('hidden.bs.modal', () => {
            if (cont) cont.innerHTML = '';
        });
        modalEl.dataset.listenerAdded = 'true';
    }
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }
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
        const pseudo = a.pseudo || a.username || a.name || (a.user && (a.user.pseudo || a.user.username)) || "Utilisateur";
        c.innerHTML = `<div class="d-flex align-items-center gap-3"><div class="text-end d-none d-md-block"><a href="profilUser.html" class="text-theme text-decoration-none"><div class="fw-bold small">${pseudo}</div><div class="x-small opacity-50">MON PROFIL</div></a></div><button onclick="sessionStorage.removeItem('auth'); localStorage.removeItem('lastAuth'); window.location.reload();" class="btn btn-outline-danger rounded-pill px-4 btn-sm fw-bold">QUITTER</button></div>`;
    } else {
        c.innerHTML = `<a href="../connexion/connexion.html" class="btn btn-primary rounded-pill px-4 fw-bold">CONNEXION</a>`;
    }
}

async function initLists() {
    if (!id) return;
    const types = [
        { id: "add-to-favorites", api: "favorites.php", key: "is_favorite", label: "gérer vos favoris" },
        { id: "add-to-watchlist", api: "watchlist.php", key: "is_in_watchlist", label: "ajouter ce film à votre Watchlist" },
        { id: "mark-as-watched", api: "watched.php", key: "is_watched", label: "marquer ce film comme vu" }
    ];
    for (const t of types) {
        const btn = document.getElementById(t.id);
        if (!btn) continue;
        let act = false;
        if (user) {
            try {
                const res = await (await fetch(`./${t.api}?user_id=${user}&film_id=${id}&media_type=movie`)).json();
                act = !!res[t.key];
                if (act) btn.classList.add("active");
            } catch(e) {}
        }
        btn.onclick = async () => {
            const auth = typeof window.requireAuthForAction === 'function' ? window.requireAuthForAction(t.label) : null;
            if (!auth) return;
            const currentUid = auth.userId || auth.id || user;
            const method = act ? "DELETE" : "POST";
            try {
                const res = await fetch(`./${t.api}`, {
                    method,
                    headers: getAuthHeaders(),
                    body: JSON.stringify({user_id: currentUid, film_id: parseInt(id), media_type:'movie'})
                });
                if (res.status === 401) {
                    if (window.clearAuth) window.clearAuth();
                    alert("Votre session a expiré. Veuillez vous connecter.");
                    window.location.href = "../connexion/connexion.html";
                    return;
                }
                const r = await res.json();
                if (r.success) {
                    act = !act;
                    btn.classList.toggle("active", act);
                    notify(r.message, "success");
                }
            } catch(e) {
                console.error(e);
            }
        };
    }
}

function initRating() {
    const ratingContainer = document.getElementById("star-rating");
    if (!ratingContainer) return;

    if (ratingContainer.querySelectorAll(".star").length === 0) {
        let starsHtml = "";
        for (let i = 1; i <= 10; i++) {
            starsHtml += `<span class="star" data-value="${i}" title="${i}/10" style="cursor: pointer;"><i class="ph ph-star"></i></span>`;
        }
        ratingContainer.innerHTML = starsHtml;
    }

    const stars = ratingContainer.querySelectorAll(".star");
    const clear = document.getElementById("btn-clear-rating");
    const fb = document.getElementById("rating-feedback");
    let currentRating = 0;

    const update = (v) => {
        currentRating = parseInt(v, 10) || 0;
        stars.forEach(s => {
            const icon = s.querySelector("i");
            const val = parseInt(s.getAttribute("data-value") || s.dataset.value, 10);
            if (icon) {
                if (val <= currentRating) {
                    icon.className = "ph-fill ph-star text-warning";
                } else {
                    icon.className = "ph ph-star star-empty";
                }
            }
        });
        if (clear) clear.classList.toggle("d-none", currentRating === 0);
    };

    if (user && id) {
        fetch(`./notes.php?user_id=${user}&film_id=${id}&media_type=movie`).then(r => r.json()).then(r => {
            if (r.success && r.note) { update(r.note); if (fb) fb.textContent = `Votre note: ${r.note}/10`; }
        }).catch(()=>{});
    }

    stars.forEach(s => {
        s.addEventListener("mouseenter", () => {
            const hoverVal = parseInt(s.getAttribute("data-value") || s.dataset.value, 10);
            stars.forEach(star => {
                const icon = star.querySelector("i");
                const starVal = parseInt(star.getAttribute("data-value") || star.dataset.value, 10);
                if (icon) {
                    if (starVal <= hoverVal) {
                        icon.className = "ph-fill ph-star text-warning";
                    } else {
                        icon.className = "ph ph-star star-empty";
                    }
                }
            });
        });

        s.addEventListener("mouseleave", () => {
            update(currentRating);
        });

        s.onclick = async () => {
            const auth = typeof window.requireAuthForAction === 'function' ? window.requireAuthForAction("noter ce film") : null;
            if (!auth) return;
            const currentUid = auth.userId || auth.id || user;
            const v = parseInt(s.getAttribute("data-value") || s.dataset.value, 10);
            try {
                const response = await fetch('./notes.php', {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({user_id: currentUid, film_id: id, media_type:'movie', note: v})
                });
                if (response.status === 401) {
                    if (window.clearAuth) window.clearAuth();
                    alert("Votre session a expiré. Veuillez vous connecter.");
                    window.location.href = "../connexion/connexion.html";
                    return;
                }
                const r = await response.json();
                if (r.success) { update(v); if (fb) fb.textContent = `Note: ${v}/10`; notify("Note enregistrée", "success"); }
            } catch(e) { console.error(e); }
        };
    });

    if (clear) {
        clear.onclick = async () => {
            const auth = typeof window.requireAuthForAction === 'function' ? window.requireAuthForAction("supprimer votre note") : null;
            if (!auth) return;
            const currentUid = auth.userId || auth.id || user;
            try {
                const response = await fetch('./notes.php', {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({user_id: currentUid, film_id: id, media_type:'movie'})
                });
                if (response.status === 401) {
                    if (window.clearAuth) window.clearAuth();
                    alert("Votre session a expiré. Veuillez vous connecter.");
                    window.location.href = "../connexion/connexion.html";
                    return;
                }
                const r = await response.json();
                if (r.success) { update(0); if (fb) fb.textContent = ""; notify("Note supprimée", "info"); }
            } catch(e) { console.error(e); }
        };
    }
}

/**
 * Fonctions de gestion de l'affiche du film
 */
function ouvrirModalPoster() {
    const modalEl = document.getElementById("posterModal");
    if (!modalEl) return;

    const grid = document.getElementById("modal-posters-grid");
    if (grid && currentMovieData && currentMovieData.images?.posters?.length > 0) {
        grid.innerHTML = currentMovieData.images.posters.slice(0, 18).map(p => {
            const url = CONFIG.W500 + p.file_path;
            const fullUrl = CONFIG.ORIG + p.file_path;
            const isSelected = (customMoviePoster === fullUrl || customMoviePoster === url);
            return `
                <div class="premium-card position-relative p-1" style="cursor: pointer; border: ${isSelected ? '3px solid var(--accent)' : '1px solid var(--border)'}; border-radius: 16px;" onclick="changerAfficheFilm('${fullUrl}')">
                    <img src="${url}" loading="lazy" style="aspect-ratio: 2/3; object-fit: cover; border-radius: 12px; width: 100%;">
                    ${isSelected ? `<span class="badge bg-primary position-absolute top-0 end-0 m-2 shadow"><i class="ph ph-check"></i> Actuelle</span>` : ''}
                </div>
            `;
        }).join("");
    } else if (grid) {
        grid.innerHTML = "<p class='text-center opacity-50 py-4 w-100'>Aucune affiche alternative trouvée dans la galerie.</p>";
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

function ouvrirModalSelectAffiche() {
  const postTabBtn = document.querySelector('button[data-bs-target="#tab-post"]');
  if (postTabBtn) {
    const tab = new bootstrap.Tab(postTabBtn);
    tab.show();
  }
  const tabSection = document.getElementById("tab-post") || document.querySelector('.tab-content');
  if (tabSection) {
    tabSection.scrollIntoView({ behavior: "smooth" });
  }
  notify("Sélectionnez 'Choisir cette affiche' sur l'affiche de votre choix ci-dessous", "info");
}

async function changerAfficheFilm(posterUrl) {
    if (!id || !posterUrl) return;
    customMoviePoster = posterUrl;
    localStorage.setItem(`custom_movie_poster_${id}`, posterUrl);

    const imgEl = document.getElementById("movie-poster-img");
    if (imgEl) imgEl.src = posterUrl;

    const resetBtn = document.getElementById("btn-reset-poster-side");
    if (resetBtn) resetBtn.style.display = "inline-block";

    // Fermer la modale si ouverte
    const modalEl = document.getElementById("posterModal");
    if (modalEl) {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
    }

    notify("Affiche du film mise à jour avec succès !", "success");

    // Sauvegarde en base de données si l'utilisateur est authentifié
    const auth = JSON.parse(sessionStorage.getItem("auth") || localStorage.getItem("lastAuth") || "null");
    const uid = auth ? (auth.userId || auth.id) : user;
    if (uid || (auth && auth.token)) {
        try {
            await fetch('./user_posters.php', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    user_id: uid,
                    tmdb_id: parseInt(id),
                    media_type: 'movie',
                    poster_path: posterUrl
                })
            });
        } catch (e) {
            console.error("Erreur d'enregistrement de l'affiche:", e);
        }
    }

    if (currentMovieData?.images) {
        renderGallery(currentMovieData.images);
    }

    // Remonter en douceur vers le haut de la page
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function resetAfficheFilm() {
    if (!id) return;
    customMoviePoster = null;
    localStorage.removeItem(`custom_movie_poster_${id}`);

    const defaultPoster = currentMovieData?.poster_path ? CONFIG.W500 + currentMovieData.poster_path : CONFIG.EMPTY_POSTER;
    const imgEl = document.getElementById("movie-poster-img");
    if (imgEl) imgEl.src = defaultPoster;

    const resetBtn = document.getElementById("btn-reset-poster-side");
    if (resetBtn) resetBtn.style.display = "none";

    const modalEl = document.getElementById("posterModal");
    if (modalEl) {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
    }

    notify("Affiche réinitialisée à l'originale", "info");

    const auth = JSON.parse(sessionStorage.getItem("auth") || localStorage.getItem("lastAuth") || "null");
    const uid = auth ? (auth.userId || auth.id) : user;
    if (uid || (auth && auth.token)) {
        try {
            await fetch(`./user_posters.php?user_id=${uid || ''}&tmdb_id=${id}&media_type=movie`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
        } catch (e) {
            console.error("Erreur de réinitialisation:", e);
        }
    }

    if (currentMovieData?.images) {
        renderGallery(currentMovieData.images);
    }
}

function soumettreAfficheCustomUrl() {
    const input = document.getElementById("custom-poster-input");
    if (!input || !input.value.trim()) {
        return notify("Veuillez saisir une URL valide", "warning");
    }
    changerAfficheFilm(input.value.trim());
    input.value = "";
}

window.downloadImg = downloadImg;
window.openModal = openModal;
window.ouvrirModalPoster = ouvrirModalPoster;
window.ouvrirModalSelectAffiche = ouvrirModalSelectAffiche;
window.changerAfficheFilm = changerAfficheFilm;
window.resetAfficheFilm = resetAfficheFilm;
window.soumettreAfficheCustomUrl = soumettreAfficheCustomUrl;

async function loadAwardsData(imdbId, containerId, title) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    if (!imdbId) {
        grid.innerHTML = `
            <div class="glass-award-card w-100 py-4 text-center">
                <i class="ph ph-trophy opacity-40 fs-2 mb-2 text-warning"></i>
                <div class="award-main-value fs-6 opacity-75">Aucun palmarès officiel répertorié pour ${title || 'cet élément'}.</div>
            </div>
        `;
        return;
    }

    try {
        const apiKeys = ['b793318f', 'trilogy', '9810ef8a'];
        let awardsStr = "";
        
        for (const key of apiKeys) {
            try {
                const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${key}`);
                const data = await res.json();
                if (data.Response === "True" && data.Awards && data.Awards !== "N/A") {
                    awardsStr = data.Awards;
                    break;
                }
            } catch (err) {
                // try next
            }
        }

        if (!awardsStr) {
            grid.innerHTML = `
                <div class="glass-award-card w-100 py-4 text-center">
                    <i class="ph ph-trophy opacity-40 fs-2 mb-2 text-warning"></i>
                    <div class="award-main-value fs-6 opacity-75">Aucune distinction majeure enregistrée dans la base officielle.</div>
                </div>
            `;
            return;
        }

        const cards = [];

        // 1. Oscars
        const oscarMatch = awardsStr.match(/(Won|Nominated for)\s+(\d+)\s+Oscar[s]?/i);
        if (oscarMatch) {
            const isWon = oscarMatch[1].toLowerCase() === 'won';
            const count = oscarMatch[2];
            cards.push(`
                <div class="glass-award-card">
                    <div class="award-img-wrapper">
                        <img src="assets/awards/oscar.png" alt="Oscar Statuette">
                    </div>
                    <div>
                        <div class="award-badge-pill"><i class="ph-fill ph-trophy"></i> ACADEMY AWARDS</div>
                        <div class="award-main-title">${isWon ? `🏆 ${count} Oscar${count > 1 ? 's' : ''} Remporté${count > 1 ? 's' : ''}` : `⭐ ${count} Nomination${count > 1 ? 's' : ''} aux Oscars`}</div>
                        <div class="award-sub-desc">Récompense suprême du cinéma mondial</div>
                    </div>
                </div>
            `);
        }

        // 2. Golden Globes
        const globeMatch = awardsStr.match(/(Won|Nominated for)\s+(\d+)\s+Golden Globe[s]?/i);
        if (globeMatch) {
            const isWon = globeMatch[1].toLowerCase() === 'won';
            const count = globeMatch[2];
            cards.push(`
                <div class="glass-award-card">
                    <div class="award-img-wrapper">
                        <img src="assets/awards/golden_globe.png" alt="Golden Globe Trophy">
                    </div>
                    <div>
                        <div class="award-badge-pill"><i class="ph-fill ph-star"></i> GOLDEN GLOBES</div>
                        <div class="award-main-title">${isWon ? `🌟 ${count} Golden Globe${count > 1 ? 's' : ''}` : `🎬 ${count} Nomination${count > 1 ? 's' : ''} aux Golden Globes`}</div>
                        <div class="award-sub-desc">Hollywood Foreign Press Association</div>
                    </div>
                </div>
            `);
        }

        // 3. Emmys
        const emmyMatch = awardsStr.match(/(Won|Nominated for)\s+(\d+)\s+Emmy[s]?/i);
        if (emmyMatch) {
            const isWon = emmyMatch[1].toLowerCase() === 'won';
            const count = emmyMatch[2];
            cards.push(`
                <div class="glass-award-card">
                    <div class="award-img-wrapper">
                        <img src="assets/awards/emmy.png" alt="Emmy Statuette">
                    </div>
                    <div>
                        <div class="award-badge-pill"><i class="ph-fill ph-television"></i> PRIMETIME EMMY AWARDS</div>
                        <div class="award-main-title">${isWon ? `📺 ${count} Emmy Award${count > 1 ? 's' : ''}` : `📺 ${count} Nomination${count > 1 ? 's' : ''} aux Emmys`}</div>
                        <div class="award-sub-desc">Prix d'excellence de la télévision</div>
                    </div>
                </div>
            `);
        }

        // 4. Total Wins
        const winsMatch = awardsStr.match(/(\d+)\s+win[s]?/i);
        if (winsMatch) {
            const count = winsMatch[1];
            cards.push(`
                <div class="glass-award-card">
                    <div class="award-img-wrapper">
                        <img src="assets/awards/laurel.png" alt="Gold Laurel Wreath">
                    </div>
                    <div>
                        <div class="award-badge-pill"><i class="ph-fill ph-medal"></i> TOTAL VICTOIRES</div>
                        <div class="award-main-title">🥇 ${count} Victoire${count > 1 ? 's' : ''} en Festivals</div>
                        <div class="award-sub-desc">Cumul de tous les prix remportés</div>
                    </div>
                </div>
            `);
        }

        // 5. Total Nominations
        const nomMatch = awardsStr.match(/(\d+)\s+nomination[s]?/i);
        if (nomMatch) {
            const count = nomMatch[1];
            cards.push(`
                <div class="glass-award-card">
                    <div class="award-img-wrapper">
                        <img src="assets/awards/laurel.png" alt="Certificate Badge">
                    </div>
                    <div>
                        <div class="award-badge-pill"><i class="ph-fill ph-certificate"></i> NOMINATIONS GLOBALES</div>
                        <div class="award-main-title">📜 ${count} Nomination${count > 1 ? 's' : ''} Officielles</div>
                        <div class="award-sub-desc">Sélections dans les académies & festivals</div>
                    </div>
                </div>
            `);
        }

        if (cards.length === 0) {
            cards.push(`
                <div class="glass-award-card w-100">
                    <div class="award-img-wrapper">
                        <img src="assets/awards/oscar.png" alt="Trophy">
                    </div>
                    <div>
                        <div class="award-badge-pill"><i class="ph-fill ph-trophy"></i> PALMARÈS OFFICIEL</div>
                        <div class="award-main-title">${awardsStr}</div>
                    </div>
                </div>
            `);
        }

        grid.innerHTML = cards.join('');

    } catch (e) {
        console.error("Erreur chargement palmarès:", e);
        grid.innerHTML = `
            <div class="glass-award-card w-100 py-3 text-center">
                <span class="x-small text-danger opacity-75">Impossible de charger le palmarès pour le moment.</span>
            </div>
        `;
    }
}
