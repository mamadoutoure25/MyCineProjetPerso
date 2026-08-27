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

let currentActorData = null;

document.addEventListener("DOMContentLoaded", async () => {
    const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : null;
    user = auth ? (auth.userId || auth.id) : null;
    renderAuth(auth);

    if (!id) return (window.location.href = "../../index.html");

    try {
        const actor = await (await fetch(`${CONFIG.BASE}/person/${id}?api_key=${CONFIG.KEY}&language=fr-FR&append_to_response=movie_credits,tv_credits,external_ids`)).json();
        
        currentActorData = actor;
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
        await checkActorFavoriteStatus();
        document.getElementById("add-actor-to-favorites")?.addEventListener("click", () => toggleActorFavorite(actor.id, actor.name));

    } catch (e) {
        console.error("Erreur Profil:", e);
        notify("Erreur de chargement du profil", "danger");
    }
});

async function checkActorFavoriteStatus() {
    if (!id || !user) return;
    try {
        const auth = JSON.parse(sessionStorage.getItem("auth") || localStorage.getItem("lastAuth") || "null");
        const token = auth?.token;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`favorite-actors.php?actor_id=${id}&user_id=${user}`, { headers });
        if (res.ok) {
            const data = await res.json();
            if (data.success) {
                let favorites = getActorFavorites();
                const numId = parseInt(id);
                if (data.is_favorite) {
                    if (!favorites.some(f => f.id === numId)) {
                        favorites.push({ id: numId, name: actorName || "" });
                    }
                } else {
                    favorites = favorites.filter(f => f.id !== numId);
                }
                localStorage.setItem('actor_favorites', JSON.stringify(favorites));
                updateActorFavoritesUI();
            }
        }
    } catch (e) {
        console.warn("Erreur statut favori artiste:", e);
    }
}

function renderActorHero(a) {
    document.getElementById("actor-name").textContent = a.name;
    document.getElementById("actor-biography").textContent = a.biography || "Biographie non disponible.";
    
    let customPhoto = localStorage.getItem(`custom_actor_photo_${id}`);
    if (window.getCustomPoster) {
        customPhoto = window.getCustomPoster(id, customPhoto, 'person');
    }
    const defaultPhoto = a.profile_path ? CONFIG.HD + a.profile_path : CONFIG.EMPTY_ACTOR;
    const activePhoto = customPhoto || defaultPhoto;

    const photo = document.getElementById("actor-photo");
    const backdrop = document.getElementById("hero-backdrop");
    if (photo) photo.src = activePhoto;
    if (backdrop) backdrop.src = activePhoto;

    const resetBtn = document.getElementById("btn-reset-photo-side");
    if (resetBtn) resetBtn.style.display = customPhoto ? "inline-block" : "none";

    const bday = a.birthday ? new Date(a.birthday).toLocaleDateString('fr-FR') : "N/A";
    const place = a.place_of_birth || "N/A";
    const count = (a.movie_credits?.cast?.length || 0) + (a.tv_credits?.cast?.length || 0);

    let ageStr = "";
    if (a.birthday) {
        const birthDate = new Date(a.birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age > 0) ageStr = ` (${age} ans)`;
    }

    const tagsElem = document.getElementById("actor-tags");
    if (tagsElem) tagsElem.innerHTML = `<span><i class="ph ph-user me-1"></i> ARTISTE</span><div class="v-sep"></div><span><i class="ph ph-film-strip me-1"></i> ${count} PROJETS</span>`;

    const bdayElem = document.getElementById("actor-birthday");
    if (bdayElem) bdayElem.textContent = bday + ageStr;
    const placeElem = document.getElementById("actor-birthplace");
    if (placeElem) placeElem.textContent = place;
    const countElem = document.getElementById("movie-count");
    if (countElem) countElem.textContent = count;
    const popElem = document.getElementById("actor-popularity");
    if (popElem) popElem.textContent = a.popularity ? Math.round(a.popularity) + " pts" : "N/A";
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
        const defaultImg = m.poster_path ? CONFIG.W500 + m.poster_path : CONFIG.EMPTY_POSTER;
        const img = m.title ? (window.getCustomPoster ? window.getCustomPoster(m.id, defaultImg, 'movie') : (localStorage.getItem(`custom_movie_poster_${m.id}`) || defaultImg)) : defaultImg;
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
    if (ids.imdb_id) links.push(`<a href="https://imdb.com/name/${ids.imdb_id}" target="_blank" class="btn-circle" title="IMDb"><i class="ph ph-film-slate"></i></a>`);
    if (ids.instagram_id) links.push(`<a href="https://instagram.com/${ids.instagram_id}" target="_blank" class="btn-circle" title="Instagram"><i class="ph ph-instagram-logo"></i></a>`);
    if (ids.twitter_id) links.push(`<a href="https://twitter.com/${ids.twitter_id}" target="_blank" class="btn-circle" title="Twitter / X"><i class="ph ph-x-logo"></i></a>`);
    if (ids.facebook_id) links.push(`<a href="https://facebook.com/${ids.facebook_id}" target="_blank" class="btn-circle" title="Facebook"><i class="ph ph-facebook-logo"></i></a>`);
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
    const auth = typeof window.requireAuthForAction === 'function' ? window.requireAuthForAction("suivre cet artiste") : null;
    if (!auth) return;
    const currentUid = auth.userId || auth.id || user;
    let favorites = getActorFavorites();
    const numId = parseInt(actorId);
    const index = favorites.findIndex(fav => fav.id === numId);
    const token = auth?.token;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    if (index > -1) {
        favorites.splice(index, 1);
        try {
            await fetch('favorite-actors.php', {
                method: 'DELETE',
                headers,
                body: JSON.stringify({ user_id: user, actor_id: numId })
            });
        } catch (e) { console.error(e); }
        notify(`${name} retiré de vos artistes suivis`, "info");
    } else {
        favorites.push({ id: numId, name: name });
        try {
            await fetch('favorite-actors.php', {
                method: 'POST',
                headers,
                body: JSON.stringify({ user_id: user, actor_id: numId, actor_name: name })
            });
        } catch (e) { console.error(e); }
        notify(`${name} ajouté à vos artistes suivis !`, "success");
    }

    localStorage.setItem('actor_favorites', JSON.stringify(favorites));
    updateActorFavoritesUI();
}

function updateActorFavoritesUI() {
    const btn = document.getElementById("add-actor-to-favorites");
    if (!btn) return;
    const active = isActorFavorite(id);
    if (active) {
        btn.classList.remove("btn-light");
        btn.classList.add("btn-primary");
        btn.innerHTML = `<i class="ph-fill ph-heart me-2"></i> ARTISTE SUIVI`;
    } else {
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-light");
        btn.innerHTML = `<i class="ph ph-heart me-2"></i> SUIVRE CET ARTISTE`;
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

async function ouvrirModalSelectPhoto() {
    const modalEl = document.getElementById("photoModal");
    if (!modalEl) return;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    const grid = document.getElementById("photo-gallery-grid");
    if (!grid) return;

    grid.innerHTML = `<div class="text-center py-5 w-100"><div class="spinner-border text-accent" role="status"></div></div>`;

    try {
        const res = await fetch(`${CONFIG.BASE}/person/${id}/images?api_key=${CONFIG.KEY}`);
        const data = await res.json();
        const profiles = data.profiles || [];

        if (profiles.length === 0 && currentActorData?.profile_path) {
            profiles.push({ file_path: currentActorData.profile_path });
        }

        if (profiles.length === 0) {
            grid.innerHTML = `<div class="text-center py-4 opacity-50 w-100">Aucune photo officielle trouvée. Utilisez une URL ci-dessus.</div>`;
            return;
        }

        const activeCustom = localStorage.getItem(`custom_actor_photo_${id}`);

        grid.innerHTML = profiles.map(p => {
            const url = CONFIG.HD + p.file_path;
            const isSelected = activeCustom === url || (!activeCustom && currentActorData?.profile_path && url.includes(currentActorData.profile_path));
            return `
                <div class="position-relative rounded-4 overflow-hidden shadow-sm border ${isSelected ? 'border-primary border-3' : 'border-secondary'}" style="aspect-ratio: 2/3; background: #000;">
                    <img src="${url}" class="w-100 h-100 object-fit-cover" loading="lazy">
                    <div class="position-absolute bottom-0 inset-x-0 p-2 text-center" style="background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);">
                        <button class="btn btn-sm ${isSelected ? 'btn-success' : 'btn-light'} rounded-pill px-3 fw-bold x-small shadow-sm" onclick="changerPhotoActeur('${url}')">
                            ${isSelected ? '<i class="ph ph-check me-1"></i> Active' : 'Choisir'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Erreur galerie photos:", e);
        grid.innerHTML = `<div class="text-center py-4 text-danger w-100">Erreur lors du chargement des photos.</div>`;
    }
}

async function changerPhotoActeur(photoUrl) {
    if (!id || !photoUrl) return;
    localStorage.setItem(`custom_actor_photo_${id}`, photoUrl);

    const photo = document.getElementById("actor-photo");
    const backdrop = document.getElementById("hero-backdrop");
    if (photo) photo.src = photoUrl;
    if (backdrop) backdrop.src = photoUrl;

    const resetBtn = document.getElementById("btn-reset-photo-side");
    if (resetBtn) resetBtn.style.display = "inline-block";

    const modalEl = document.getElementById("photoModal");
    if (modalEl) {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
    }

    notify("Photo d'artiste mise à jour !", "success");

    // Sync BDD
    const auth = JSON.parse(sessionStorage.getItem("auth") || localStorage.getItem("lastAuth") || "null");
    const uid = auth ? (auth.userId || auth.id) : user;
    if (uid || (auth && auth.token)) {
        try {
            await fetch('./user_posters.php', {
                method: 'POST',
                headers: typeof getAuthHeaders === 'function' ? getAuthHeaders() : { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: uid,
                    tmdb_id: parseInt(id),
                    media_type: 'person',
                    poster_path: photoUrl
                })
            });
        } catch (e) {
            console.error("Erreur d'enregistrement photo BDD:", e);
        }
    }

    if (window.updateAllDomPosters) {
        window.updateAllDomPosters();
    }
}

function appliquerUrlCustomPhoto() {
    const input = document.getElementById("custom-photo-url");
    if (!input || !input.value.trim()) return;
    changerPhotoActeur(input.value.trim());
    input.value = "";
}

async function resetPhotoActeur() {
    if (!id) return;
    localStorage.removeItem(`custom_actor_photo_${id}`);

    const defaultPhoto = currentActorData?.profile_path ? CONFIG.HD + currentActorData.profile_path : CONFIG.EMPTY_ACTOR;
    const photo = document.getElementById("actor-photo");
    const backdrop = document.getElementById("hero-backdrop");
    if (photo) photo.src = defaultPhoto;
    if (backdrop) backdrop.src = defaultPhoto;

    const resetBtn = document.getElementById("btn-reset-photo-side");
    if (resetBtn) resetBtn.style.display = "none";

    const modalEl = document.getElementById("photoModal");
    if (modalEl) {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
    }

    notify("Photo réinitialisée à l'originale", "info");

    const auth = JSON.parse(sessionStorage.getItem("auth") || localStorage.getItem("lastAuth") || "null");
    const uid = auth ? (auth.userId || auth.id) : user;
    if (uid || (auth && auth.token)) {
        try {
            await fetch('./user_posters.php', {
                method: 'DELETE',
                headers: typeof getAuthHeaders === 'function' ? getAuthHeaders() : { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: uid,
                    tmdb_id: parseInt(id),
                    media_type: 'person'
                })
            });
        } catch (e) {
            console.error("Erreur suppression photo BDD:", e);
        }
    }

    if (window.updateAllDomPosters) {
        window.updateAllDomPosters();
    }
}

window.ouvrirModalSelectPhoto = ouvrirModalSelectPhoto;
window.changerPhotoActeur = changerPhotoActeur;
window.appliquerUrlCustomPhoto = appliquerUrlCustomPhoto;
window.resetPhotoActeur = resetPhotoActeur;
