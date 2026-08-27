/**
 * @file serie-details.js
 * @description Cinematic Premium for Series
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

async function initPage() {
    const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : null;
    user = auth ? (auth.userId || auth.id) : null;
    renderAuth(auth);

    if (!id) return (window.location.href = "../../series.html");

    try {
        const [serie, contentRatings] = await Promise.all([
            fetch(`${CONFIG.BASE}/tv/${id}?api_key=${CONFIG.KEY}&language=fr-FR&append_to_response=credits,watch/providers,videos,images,external_ids`).then(r => r.json()),
            fetch(`${CONFIG.BASE}/tv/${id}/content_ratings?api_key=${CONFIG.KEY}`).then(r => r.json())
        ]);
        
        serie.content_ratings = contentRatings;
        
        renderHero(serie);
        renderSeasons(serie.seasons);
        renderCast(serie.credits?.cast);
        renderSoundtrack(serie);
        renderVideos(serie.videos?.results);
        renderGallery(serie.images);
        renderProviders(serie["watch/providers"]?.results?.BE);
        renderTechnical(serie);
        
        initLists();
        initRating();

    } catch (e) {
        console.error(e);
        notify("Erreur de chargement de la série", "danger");
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
} else {
    initPage();
}

function renderHero(s) {
    document.getElementById("serie-title").textContent = s.name;
    document.getElementById("breadcrumb-title").textContent = s.name;
    document.getElementById("serie-overview").textContent = s.overview || "Synopsis non disponible.";
    document.getElementById("hero-backdrop").src = CONFIG.ORIG + s.backdrop_path;

    const year = s.first_air_date ? new Date(s.first_air_date).getFullYear() : "";
    const seasons = s.number_of_seasons ? `${s.number_of_seasons} Saisons` : "";
    const genres = s.genres?.slice(0,3).map(g => g.name).join(", ") || "";

    // Extract Certification
    let cert = "";
    if (s.content_ratings && s.content_ratings.results) {
        const fr = s.content_ratings.results.find(r => r.iso_3166_1 === 'FR');
        const us = s.content_ratings.results.find(r => r.iso_3166_1 === 'US');
        const target = fr || us || s.content_ratings.results[0];
        
        if (target && target.rating) cert = target.rating;
    }
    
    const certBadge = cert ? `<span style="border: 1px solid rgba(255,255,255,0.3); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800;">${cert}</span><div class="v-sep"></div>` : "";

    document.getElementById("serie-tags").innerHTML = `${certBadge}<span><i class="ph ph-calendar-blank me-1"></i> ${year}</span><div class="v-sep"></div><span><i class="ph ph-film-strip me-1"></i> ${genres}</span><div class="v-sep"></div><span><i class="ph ph-stack me-1"></i> ${seasons}</span>`;
    document.getElementById("serie-status").textContent = s.status === "Returning Series" ? "En cours" : "Terminée";

    // Populate Glassmorphic Stats Section
    const statsSeasonsEp = document.getElementById("stats-seasons-episodes");
    if (statsSeasonsEp) {
        statsSeasonsEp.textContent = `${s.number_of_seasons || 0} Saisons (${s.number_of_episodes || 0} Éps)`;
    }
    const statsRuntime = document.getElementById("stats-episode-runtime");
    if (statsRuntime) {
        const avgRuntime = s.episode_run_time && s.episode_run_time.length ? s.episode_run_time[0] : (s.episode_run_time || null);
        statsRuntime.textContent = avgRuntime ? `${avgRuntime} min / ép.` : "N/A";
    }
    const statsVote = document.getElementById("stats-vote-average");
    if (statsVote) {
        statsVote.textContent = s.vote_average ? `${s.vote_average.toFixed(1)} / 10` : "N/A";
    }
    const statsCert = document.getElementById("stats-certification");
    if (statsCert) {
        statsCert.textContent = cert ? cert : "Tous publics";
    }

    const studio = s.production_companies?.[0];
    if (studio) {
        document.getElementById("studio-tag").innerHTML = `<div class="studio-icon">${studio.logo_path ? `<img src="${CONFIG.W500}${studio.logo_path}" style="max-width:100%; max-height:100%; object-fit:contain;">` : `<span>${studio.name[0]}</span>`}</div><span class="fw-bold">${studio.name.toUpperCase()}</span>`;
    }

    const trailer = s.videos?.results?.find(v => v.type === "Trailer");
    if (trailer) {
        document.getElementById("watch-trailer").onclick = (e) => {
            e.preventDefault();
            openModal("video", trailer.key, s.name);
        };
    } else {
        document.getElementById("watch-trailer").style.display = "none";
    }
}

function renderSeasons(seasons) {
    const cont = document.getElementById("serie-seasons");
    if (!cont || !seasons) return;
    cont.innerHTML = seasons.filter(s => s.season_number > 0).map(s => `
        <div class="season-card-premium" onclick="window.location.href='saison-details.html?serieId=${id}&season=${s.season_number}'">
            <img src="${s.poster_path ? CONFIG.W500 + s.poster_path : CONFIG.EMPTY_POSTER}" loading="lazy">
            <div class="season-overlay">
                <div class="season-title">SAISON ${s.season_number}</div>
                <div class="season-episodes-pill">${s.episode_count} ÉPISODES</div>
            </div>
        </div>
    `).join("");
}

function renderCast(cast) {
    const cont = document.getElementById("serie-cast");
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

function renderSoundtrack(s) {
    const wrapper = document.getElementById("soundtrack-wrapper");
    const composersCont = document.getElementById("serie-composers");
    const platformsCont = document.getElementById("music-platforms");

    if (!wrapper || !s) return;

    const crew = s.credits?.crew || [];
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
                    <div class="x-small text-accent fw-bold"><i class="ph-fill ph-music-notes me-1"></i> ${c.job || 'Musique Originale'}</div>
                </div>
            </div>
        `).join("");
    } else if (composersCont) {
        if (s.created_by && s.created_by.length > 0) {
            composersCont.innerHTML = s.created_by.map(c => `
                <div class="composer-card" onclick="window.location.href='actor-details.html?id=${c.id}'">
                    <img class="composer-avatar" src="${c.profile_path ? CONFIG.W500 + c.profile_path : CONFIG.EMPTY_ACTOR}" alt="${c.name}">
                    <div>
                        <div class="fw-bold text-theme">${c.name}</div>
                        <div class="x-small text-accent fw-bold"><i class="ph-fill ph-user me-1"></i> Créateur / Musique</div>
                    </div>
                </div>
            `).join("");
        } else {
            composersCont.innerHTML = `<div class="x-small opacity-50 p-2">Non renseigné</div>`;
        }
    }

    if (platformsCont) {
        const searchTitle = encodeURIComponent((s.name || s.original_name) + " Soundtrack");
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

    wrapper.style.display = "block";
}

function renderVideos(vids) {
    const cont = document.getElementById("serie-videos");
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
    const cont = document.getElementById("serie-providers");
    const noProv = document.getElementById("noProviders");
    if (!cont) return;

    // Find the best region match
    let be = null;
    if (providerResults) {
        be = providerResults.BE || providerResults.FR || providerResults.US || Object.values(providerResults)[0];
    }
    
    const stream = be?.flatrate || be?.rent || be?.buy || [];
    const serieTitle = document.getElementById("serie-title")?.textContent || "";

    if (!stream.length) {
        if (noProv) noProv.classList.remove("d-none");
        return;
    }
    
    if (noProv) noProv.classList.add("d-none");

    // Provider ID Mapping to their search URLs
    const searchQuery = encodeURIComponent(serieTitle).replace(/%20/g, '+');
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
        let href = providerLinks[p.provider_id];
        if (!href) {
            href = be?.link ? be.link : `https://www.themoviedb.org/tv/${id}/watch`;
        }

        return `
            <a href="${href}" target="_blank" title="Rechercher sur ${p.provider_name}" class="provider-link" style="transition: 0.3s; display: inline-block;">
                <img src="${CONFIG.W500}${p.logo_path}" alt="${p.provider_name}" style="width:45px; border-radius:10px; border: 1px solid rgba(255,255,255,0.1);">
            </a>
        `;
    }).join("");
}

function renderTechnical(s) {
    const firstAirEl = document.getElementById("serie-first-air");
    const lastAirEl = document.getElementById("serie-last-air");

    if (firstAirEl) {
        firstAirEl.textContent = s.first_air_date ? new Date(s.first_air_date).toLocaleDateString() : "Non communiquée";
    }
    if (lastAirEl) {
        const lastDate = s.last_air_date ? new Date(s.last_air_date).toLocaleDateString() : "En cours";
        const statusStr = s.status ? ` (${s.status})` : "";
        lastAirEl.textContent = lastDate + statusStr;
    }

    const studioCont = document.getElementById("serie-production-companies");
    if (studioCont) {
        if (s.production_companies && s.production_companies.length > 0) {
            studioCont.innerHTML = s.production_companies.slice(0, 4).map(c => `
                <a href="company-details.html?id=${c.id}" class="studio-item-card" title="Voir les productions de ${c.name}">
                    <div class="studio-logo-box">
                        ${c.logo_path ? `<img src="${CONFIG.W500}${c.logo_path}" alt="${c.name}">` : `<span class="text-dark fw-black" style="font-size:0.8rem;">${c.name.charAt(0)}</span>`}
                    </div>
                    <span class="studio-name">${c.name}</span>
                </a>
            `).join("");
        } else {
            studioCont.innerHTML = `<div class="x-small text-muted p-2">Non communiquée</div>`;
        }
    }

    const ids = s.external_ids;
    if (ids) {
        const cont = document.getElementById("external-links");
        if (cont) {
            let html = "";
            if (ids.imdb_id) html += `<a href="https://imdb.com/title/${ids.imdb_id}" target="_blank" class="social-link-btn" title="Fiche IMDb"><i class="ph-fill ph-film-strip"></i></a>`;
            if (ids.facebook_id) html += `<a href="https://facebook.com/${ids.facebook_id}" target="_blank" class="social-link-btn" title="Facebook"><i class="ph-fill ph-facebook-logo"></i></a>`;
            if (ids.instagram_id) html += `<a href="https://instagram.com/${ids.instagram_id}" target="_blank" class="social-link-btn" title="Instagram"><i class="ph-fill ph-instagram-logo"></i></a>`;
            if (ids.twitter_id) html += `<a href="https://twitter.com/${ids.twitter_id}" target="_blank" class="social-link-btn" title="Twitter / X"><i class="ph-fill ph-twitter-logo"></i></a>`;
            if (s.homepage) html += `<a href="${s.homepage}" target="_blank" class="social-link-btn" title="Site Officiel"><i class="ph-fill ph-globe"></i></a>`;
            cont.innerHTML = html;
        }
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
    } catch (e) { window.open(url, '_blank'); }
}

function openModal(type, src, title) {
    const cont = document.getElementById("mediaModalContent");
    if (cont) {
        cont.innerHTML = type === "video" ? `<div class="ratio ratio-16x9"><iframe src="https://www.youtube.com/embed/${src}?autoplay=1" allowfullscreen></iframe></div>` : `<img src="${src}" class="img-fluid rounded-4 shadow-lg">`;
    }
    const modal = new bootstrap.Modal(document.getElementById('mediaModal'));
    modal.show();
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
        { id: "add-to-watchlist", api: "watchlist.php", key: "is_in_watchlist", label: "ajouter cette série à votre Watchlist" },
        { id: "mark-as-watched", api: "watched.php", key: "is_watched", label: "marquer cette série comme vue" }
    ];
    for (const t of types) {
        const btn = document.getElementById(t.id);
        if (!btn) continue;
        let act = false;
        if (user) {
            try {
                const res = await (await fetch(`./${t.api}?user_id=${user}&film_id=${id}&media_type=tv`)).json();
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
                const response = await fetch(`./${t.api}`, {
                    method,
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({user_id: currentUid, film_id: parseInt(id), media_type:'tv'})
                });
                if (response.status === 401) {
                    if (window.clearAuth) window.clearAuth();
                    alert("Votre session a expiré. Veuillez vous connecter.");
                    window.location.href = "../connexion/connexion.html";
                    return;
                }
                const r = await response.json();
                if (r.success) { act = !act; btn.classList.toggle("active", act); notify(r.message, "success"); }
            } catch(e) { console.error(e); }
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
        fetch(`./notes.php?user_id=${user}&film_id=${id}&media_type=tv`).then(r => r.json()).then(r => {
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
            const auth = typeof window.requireAuthForAction === 'function' ? window.requireAuthForAction("noter cette série") : null;
            if (!auth) return;
            const currentUid = auth.userId || auth.id || user;
            const v = parseInt(s.getAttribute("data-value") || s.dataset.value, 10);
            try {
                const response = await fetch('./notes.php', { method: "POST", headers: {'Content-Type':'application/json'}, body: JSON.stringify({user_id: currentUid, film_id: id, media_type:'tv', note: v}) });
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
                const response = await fetch('./notes.php', { method: "DELETE", headers: {'Content-Type':'application/json'}, body: JSON.stringify({user_id: currentUid, film_id: id, media_type:'tv'}) });
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

window.downloadImg = downloadImg;
window.openModal = openModal;
