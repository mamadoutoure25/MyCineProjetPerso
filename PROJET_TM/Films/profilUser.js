// profilUser.js

// Configuration API TMDB
const CONFIG = {
    URL_BASE: "https://api.themoviedb.org/3",
    CLE_API: "04c35731a5ee918f014970082a0088b1",
    URL_IMAGE: "https://image.tmdb.org/t/p/w500",
    AFFICHE_PAR_DEFAUT: "https://via.placeholder.com/500x750?text=Aucune+affiche",
    IMAGE_SUBSTITUT: "https://via.placeholder.com/500x750?text=Image+indisponible",
};

// Cache local pour les détails
const cacheContenu = new Map();

// Éléments du DOM
const DOM = {
    userPseudo: document.getElementById("user-pseudo"),
    usernameDisplay: document.getElementById("username-display"),
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
    favoritesBadge: document.getElementById("favorites-badge"),
    watchlistBadge: document.getElementById("watchlist-badge"),
    watchedBadge: document.getElementById("watched-badge"),
    actorsBadge: document.getElementById("actors-badge"),
    lienDeconnexion: document.getElementById("logout-link"),
    lienAdmin: document.getElementById("admin-link"),
    conteneurToasts: document.getElementById("toast-container"),
    modalConfirmation: document.getElementById("confirmModal"),
    modalBody: document.getElementById("confirmModalBody"),
    boutonConfirmation: document.getElementById("confirmAction"),
};

// État de l'application
const ETAT_PROFIL = {
    authentification: null,
    favoris: [],
    watchlist: [],
    filmsVus: [],
    favorisSeries: [],
    watchlistSeries: [],
    seriesVues: [],
    acteursFavoris: [],
    notesParTmdb: new Map(),
    enChargement: {
        favoris: false,
        watchlist: false,
        filmsVus: false,
        acteurs: false,
    },
    triActuel: {
        favoris: "date_desc",
        watchlist: "date_desc",
        filmsVus: "date_desc",
        acteurs: "name_asc",
    },
    filtreActeurs: "all",
    actionEnCours: null,
};

async function initialiserProfilUtilisateur() {
    try {
        console.log("👤 Initialisation du profil utilisateur...");
        if (!verifierAuthentification()) {
            afficherNotification("Connexion requise pour accéder au profil", "warning");
            setTimeout(() => {
                window.location.href = "../connexion/connexion.html";
            }, 2000);
            return;
        }
        mettreAJourInterfaceAuthentification();
        configurerEcouteursEvenements();
        
        await synchroniserActeursFavorisBD();
        await chargerToutesLesListes();
        console.log("✅ Profil utilisateur initialisé avec succès");
    } catch (erreur) {
        console.error("❌ Erreur lors de l'initialisation du profil:", erreur);
        afficherErreurUtilisateur();
    }
}

async function chargerToutesLesListes() {
    console.log("📊 Chargement de toutes les listes...");
    const promesses = [
        chargerListe("favorites"), 
        chargerListe("watchlist"), 
        chargerListe("watched"), 
        chargerActeursFavoris()
    ];
    await Promise.allSettled(promesses);
    await chargerNotesUtilisateur();
    mettreAJourStatistiques();
}

async function chargerListe(type) {
    if (ETAT_PROFIL.enChargement[type]) return;
    try {
        ETAT_PROFIL.enChargement[type] = true;
        const response = await fetch(`${type}.php?user_id=${ETAT_PROFIL.authentification.userId}`);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const donnees = await response.json();
        
        if (donnees.success && donnees[type]) {
            const items = donnees[type];
            
            const filmsRaw = items.filter(i => i.media_type === 'movie' || !i.media_type);
            const seriesRaw = items.filter(i => i.media_type === 'tv');

            const filmsDetails = await Promise.all(
                filmsRaw.map(async (item) => {
                    const details = await recupererDetailsContenu(item.tmdb_id, 'movie');
                    return details ? { ...details, media_type: 'movie', date_ajout: item.date_ajout || new Date().toISOString() } : null;
                })
            );

            const seriesDetails = await Promise.all(
                seriesRaw.map(async (item) => {
                    const details = await recupererDetailsContenu(item.tmdb_id, 'tv');
                    return details ? { ...details, media_type: 'tv', date_ajout: item.date_ajout || new Date().toISOString() } : null;
                })
            );

            const filmsClean = filmsDetails.filter(f => f !== null);
            const seriesClean = seriesDetails.filter(s => s !== null);

            if (type === 'favorites') {
                ETAT_PROFIL.favoris = filmsClean;
                ETAT_PROFIL.favorisSeries = seriesClean;
                afficherContenu(ETAT_PROFIL.favoris, DOM.favoritesMovies, 'favorites', 'movie');
                afficherContenu(ETAT_PROFIL.favorisSeries, DOM.favoritesSeries, 'favorites', 'tv');
                synchroniserFavorisLocalStorage();
            } else if (type === 'watchlist') {
                ETAT_PROFIL.watchlist = filmsClean;
                ETAT_PROFIL.watchlistSeries = seriesClean;
                afficherContenu(ETAT_PROFIL.watchlist, DOM.watchlistMovies, 'watchlist', 'movie');
                afficherContenu(ETAT_PROFIL.watchlistSeries, DOM.watchlistSeries, 'watchlist', 'tv');
            } else if (type === 'watched') {
                ETAT_PROFIL.filmsVus = filmsClean;
                ETAT_PROFIL.seriesVues = seriesClean;
                afficherContenu(ETAT_PROFIL.filmsVus, DOM.watchedMovies, 'watched', 'movie');
                afficherContenu(ETAT_PROFIL.seriesVues, DOM.watchedSeries, 'watched', 'tv');
            }
        }
    } catch (erreur) {
        console.error(`❌ Erreur lors du chargement de ${type}:`, erreur);
    } finally {
        ETAT_PROFIL.enChargement[type] = false;
    }
}

function verifierAuthentification() {
    const donneesAuth = sessionStorage.getItem("auth");
    if (donneesAuth) {
        try {
            ETAT_PROFIL.authentification = JSON.parse(donneesAuth);
            return true;
        } catch (erreur) {
            console.error("Erreur auth:", erreur);
            sessionStorage.removeItem("auth");
        }
    }
    return false;
}

function mettreAJourInterfaceAuthentification() {
    const auth = ETAT_PROFIL.authentification;
    if (!auth) return;
    if (DOM.userPseudo) DOM.userPseudo.textContent = auth.pseudo || "Utilisateur";
    if (DOM.usernameDisplay) DOM.usernameDisplay.textContent = auth.pseudo || "Utilisateur";
    if (DOM.lienAdmin && auth.role === "admin") DOM.lienAdmin.classList.remove("d-none");
}

function configurerEcouteursEvenements() {
    if (DOM.lienDeconnexion) {
        DOM.lienDeconnexion.addEventListener("click", (e) => {
            e.preventDefault();
            sessionStorage.removeItem("auth");
            window.location.href = "../../index.html";
        });
    }

    document.getElementById("sort-actors-name-asc")?.addEventListener("click", () => trierActeurs("name_asc"));
    document.getElementById("sort-actors-name-desc")?.addEventListener("click", () => trierActeurs("name_desc"));
    document.getElementById("sort-actors-age-asc")?.addEventListener("click", () => trierActeurs("age_asc"));
    document.getElementById("sort-actors-age-desc")?.addEventListener("click", () => trierActeurs("age_desc"));
    
    document.getElementById("clear-actors")?.addEventListener("click", () => {
        if (confirm("Voulez-vous vraiment supprimer TOUS vos acteurs favoris ?")) {
            supprimerTousLesActeurs();
        }
    });
}

async function synchroniserActeursFavorisBD() {
    const userId = ETAT_PROFIL.authentification?.userId;
    if (!userId) return;

    try {
        const acteursFavorisStored = localStorage.getItem('actor_favorites');
        if (!acteursFavorisStored) return;

        const acteursList = JSON.parse(acteursFavorisStored);
        if (!Array.isArray(acteursList) || acteursList.length === 0) return;

        for (const acteur of acteursList) {
            try {
                const checkResponse = await fetch(`favorite-actors.php?user_id=${userId}&actor_id=${acteur.id}`);
                if (checkResponse.ok) {
                    const checkData = await checkResponse.json();
                    if (!checkData.is_favorite) {
                        await fetch('favorite-actors.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                user_id: userId,
                                actor_id: acteur.id,
                                actor_name: acteur.name || 'Acteur Inconnu'
                            })
                        });
                    }
                }
            } catch (erreur) {
                console.warn(`⚠️ Erreur traitement ${acteur.name}:`, erreur);
            }
        }
    } catch (erreur) {
        console.error("❌ Erreur synchronisation acteurs:", erreur);
    }
}

async function chargerActeursFavoris() {
    if (ETAT_PROFIL.enChargement.acteurs) return;
    try {
        ETAT_PROFIL.enChargement.acteurs = true;
        const userId = ETAT_PROFIL.authentification?.userId;
        let acteursList = [];
        
        if (userId) {
            try {
                const response = await fetch(`favorite-actors.php?user_id=${userId}`);
                if (response.ok) {
                    const donnees = await response.json();
                    if (donnees.success && donnees.favorite_actors) {
                        acteursList = donnees.favorite_actors.map(actor => ({
                            id: actor.tmdb_id,
                            name: actor.nom
                        }));
                    }
                }
            } catch (erreur) {
                console.warn("⚠️ Erreur chargement BD acteurs:", erreur);
            }
        }
        
        if (acteursList.length === 0) {
            const stored = localStorage.getItem('actor_favorites');
            acteursList = stored ? JSON.parse(stored) : [];
        }
        
        if (acteursList.length === 0) {
            ETAT_PROFIL.acteursFavoris = [];
            afficherActeursVide();
            return;
        }
        
        const acteursDetails = await Promise.all(
            acteursList.map(async (acteur) => {
                const details = await recupererDetailsActeur(acteur.id);
                return details ? { ...details, date_ajout: new Date().toISOString() } : null;
            })
        );
        
        ETAT_PROFIL.acteursFavoris = acteursDetails.filter((acteur) => acteur !== null);
        trierActeurs(ETAT_PROFIL.triActuel.acteurs, false);
        afficherActeursFavoris();
        
    } catch (erreur) {
        console.error("❌ Erreur chargement acteurs:", erreur);
        afficherActeursVide();
    } finally {
        ETAT_PROFIL.enChargement.acteurs = false;
    }
}

async function recupererDetailsActeur(id) {
    const url = `${CONFIG.URL_BASE}/person/${id}?api_key=${CONFIG.CLE_API}&language=fr-FR`;
    try {
        const response = await fetch(url);
        return response.ok ? await response.json() : null;
    } catch (erreur) {
        return null;
    }
}

function afficherActeursFavoris() {
    if (!DOM.actorsFavorites) return;
    if (!ETAT_PROFIL.acteursFavoris || ETAT_PROFIL.acteursFavoris.length === 0) {
        afficherActeursVide();
        return;
    }
    DOM.actorsFavorites.innerHTML = ETAT_PROFIL.acteursFavoris.map(creerCarteActeurCommeFilm).join("");
    configurerEcouteursCartesActeurs();
}

function creerCarteActeurCommeFilm(acteur) {
    const photoUrl = acteur.profile_path ? `${CONFIG.URL_IMAGE}${acteur.profile_path}` : "https://via.placeholder.com/450x600?text=Pas+de+photo";
    const age = acteur.birthday ? Math.floor((new Date() - new Date(acteur.birthday)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    const origine = (acteur.place_of_birth || "Lieu inconnu").substring(0, 32);

    return `
        <div class="actor-card-new profile-movie-card" data-id="${acteur.id}">
            <div class="actor-card-inner">
                <div class="actor-image-container card-img-container">
                    <img src="${photoUrl}" class="actor-image card-img-top" alt="${acteur.name}">
                    <button class="remove-btn remove-actor-btn" onclick="event.stopPropagation(); supprimerActeurDesFavoris(${acteur.id})">
                        <i class="ph ph-trash"></i>
                    </button>
                    <div class="actor-hover-overlay movie-overlay">
                        <div class="overlay-content">
                            <h4 class="overlay-name">${acteur.name}</h4>
                            <div class="overlay-details">
                                ${age ? `<p><i class="ph ph-cake"></i> ${age} ans</p>` : ''}
                                <p><i class="ph ph-map-pin"></i> ${origine}</p>
                                <p><i class="ph ph-fire"></i> Pop: ${Math.round(acteur.popularity)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <h6 class="card-title text-truncate">${acteur.name}</h6>
                </div>
            </div>
        </div>
    `;
}

function configurerEcouteursCartesActeurs() {
    DOM.actorsFavorites.querySelectorAll(".actor-card-new").forEach((carte) => {
        carte.addEventListener("click", () => {
            window.location.href = `actor-details.html?id=${carte.dataset.id}`;
        });
    });
}

async function supprimerActeurDesFavoris(idActeur) {
    const userId = ETAT_PROFIL.authentification?.userId;
    try {
        if (userId) {
            await fetch('favorite-actors.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, actor_id: idActeur })
            });
        }
        let stored = JSON.parse(localStorage.getItem('actor_favorites') || '[]');
        localStorage.setItem('actor_favorites', JSON.stringify(stored.filter(a => a.id !== idActeur)));
        afficherNotification("Acteur retiré", "success");
        await chargerActeursFavoris();
        mettreAJourStatistiques();
    } catch (e) {}
}

function trierActeurs(ordre, notifier = true) {
    if (!ETAT_PROFIL.acteursFavoris.length) return;
    ETAT_PROFIL.triActuel.acteurs = ordre;
    let label = "";
    if (ordre === "name_asc") { ETAT_PROFIL.acteursFavoris.sort((a,b)=>a.name.localeCompare(b.name)); label="Nom A-Z"; }
    else if (ordre === "name_desc") { ETAT_PROFIL.acteursFavoris.sort((a,b)=>b.name.localeCompare(a.name)); label="Nom Z-A"; }
    else if (ordre === "age_asc") { ETAT_PROFIL.acteursFavoris.sort((a,b)=> (a.birthday||0) < (b.birthday||0) ? 1 : -1); label="Âge croissant"; }
    else if (ordre === "age_desc") { ETAT_PROFIL.acteursFavoris.sort((a,b)=> (a.birthday||0) > (b.birthday||0) ? 1 : -1); label="Âge décroissant"; }
    afficherActeursFavoris();
    if (notifier) afficherNotification(`Trié par ${label}`, "info");
}

async function supprimerTousLesActeurs() {
    localStorage.removeItem('actor_favorites');
    ETAT_PROFIL.acteursFavoris = [];
    afficherActeursFavoris();
    mettreAJourStatistiques();
    afficherNotification("Liste vidée", "success");
}

function afficherActeursVide() {
    DOM.actorsFavorites.innerHTML = '<div class="empty-state py-4 text-center"><i class="ph ph-user-circle opacity-50 mb-2" style="font-size: 2.5rem;"></i><p class="text-muted mb-0">Aucun acteur favori.</p></div>';
}

async function chargerNotesUtilisateur() {
    const userId = ETAT_PROFIL.authentification?.userId;
    if (!userId) return;
    try {
        const response = await fetch(`notes.php?user_id=${userId}`);
        const donnees = await response.json();
        if (donnees.success && donnees.notes) {
            donnees.notes.forEach(n => ETAT_PROFIL.notesParTmdb.set(Number(n.tmdb_id), Number(n.note)));
        }
    } catch (e) {}
}

function synchroniserFavorisLocalStorage() {
    localStorage.setItem("favorites", JSON.stringify(ETAT_PROFIL.favoris.map(f => f.id)));
}

function obtenirClasseNote(note) {
    if (note >= 8) return "bg-success";
    if (note >= 6) return "bg-warning";
    return "bg-danger";
}

function obtenirIconeType(type) {
    const icones = { favorites: "heart", watchlist: "clock", watched: "check-circle" };
    return icones[type] || "film-strip";
}

function formaterDate(dateString) {
    return dateString ? new Date(dateString).toLocaleDateString("fr-FR") : "";
}

function afficherNotification(message, type = "info") {
    if (!DOM.conteneurToasts) return;
    const toast = document.createElement("div");
    toast.className = `toast show align-items-center text-white bg-${type} border-0 mb-2`;
    toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div></div>`;
    DOM.conteneurToasts.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function afficherErreurUtilisateur() {
    document.querySelector("main").innerHTML = '<div class="container py-5 text-center"><h2>Une erreur est survenue</h2></div>';
}

document.addEventListener("DOMContentLoaded", initialiserProfilUtilisateur);

async function recupererDetailsContenu(id, type = 'movie') {
    const cacheKey = `${type}_${id}`;
    if (cacheContenu.has(cacheKey)) return cacheContenu.get(cacheKey);
    const endpoint = type === 'tv' ? 'tv' : 'movie';
    try {
        const response = await fetch(`${CONFIG.URL_BASE}/${endpoint}/${id}?api_key=${CONFIG.CLE_API}&language=fr-FR`);
        if (!response.ok) return null;
        const details = await response.json();
        cacheContenu.set(cacheKey, details);
        return details;
    } catch (e) { return null; }
}

function afficherContenu(items, conteneur, typeListe, mediaType) {
    if (!conteneur) return;
    if (!items || !items.length) {
        afficherListeVide(conteneur, typeListe, mediaType === 'tv' ? 'television' : obtenirIconeType(typeListe), mediaType);
        return;
    }
    conteneur.innerHTML = items.map((item) => creerCarteProfil(item, typeListe, mediaType)).join("");
    configurerEcouteursCartes(conteneur, typeListe, mediaType);
}

function creerCarteProfil(item, typeListe, mediaType) {
    const titre = item.title || item.name;
    const annee = (item.release_date || item.first_air_date || "").substring(0, 4) || "N/A";
    const imageUrl = item.poster_path ? `${CONFIG.URL_IMAGE}${item.poster_path}` : CONFIG.AFFICHE_PAR_DEFAUT;
    return `
        <div class="profile-movie-card" data-id="${item.id}" data-type="${typeListe}" data-media="${mediaType}">
            <div class="card-img-container">
                <img src="${imageUrl}" class="card-img-top" alt="${titre}" loading="lazy">
                <div class="movie-overlay"><button class="play-btn"><i class="ph ph-play"></i></button></div>
                <button class="remove-btn" onclick="event.stopPropagation(); supprimerFilmDeListe(${item.id}, '${typeListe}', '${mediaType}')"><i class="ph ph-trash"></i></button>
            </div>
            <div class="card-body">
                <h6 class="card-title text-truncate">${titre}</h6>
                <div class="movie-meta">
                    <span class="badge ${obtenirClasseNote(item.vote_average)} movie-rating"><i class="ph ph-star me-1"></i>${item.vote_average?.toFixed(1)}</span>
                    <span class="movie-year">${annee}</span>
                </div>
            </div>
        </div>
    `;
}

function configurerEcouteursCartes(conteneur, typeListe, mediaType) {
    conteneur.querySelectorAll(".profile-movie-card").forEach((carte) => {
        carte.addEventListener("click", (e) => {
            if (e.target.closest(".remove-btn")) return;
            window.location.href = mediaType === 'tv' ? `serie-details.html?id=${carte.dataset.id}` : `movie-details.html?id=${carte.dataset.id}`;
        });
    });
}

async function supprimerFilmDeListe(id, type, media) {
    try {
        await fetch(`${type}.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: ETAT_PROFIL.authentification.userId, film_id: parseInt(id), media_type: media })
        });
        afficherNotification("Retiré de la liste", "success");
        await chargerListe(type);
        mettreAJourStatistiques();
    } catch (e) {}
}

function afficherListeVide(conteneur, typeListe, icone, mediaType) {
    conteneur.innerHTML = `<div class="empty-state py-4 text-center"><i class="ph ph-${icone} opacity-50 mb-2" style="font-size: 2.5rem;"></i><p class="text-muted mb-0">Aucun ${mediaType === 'tv' ? 'série' : 'film'} ici.</p></div>`;
}

function mettreAJourStatistiques() {
    const movieCount = ETAT_PROFIL.favoris.length + ETAT_PROFIL.watchlist.length + ETAT_PROFIL.filmsVus.length;
    const tvCount = ETAT_PROFIL.favorisSeries.length + ETAT_PROFIL.watchlistSeries.length + ETAT_PROFIL.seriesVues.length;
    const totalFav = ETAT_PROFIL.favoris.length + ETAT_PROFIL.favorisSeries.length;
    const totalWL = ETAT_PROFIL.watchlist.length + ETAT_PROFIL.watchlistSeries.length;
    const totalVus = ETAT_PROFIL.filmsVus.length + ETAT_PROFIL.seriesVues.length;
    
    if (DOM.favoritesCount) DOM.favoritesCount.textContent = totalFav;
    if (DOM.watchlistCount) DOM.watchlistCount.textContent = totalWL;
    if (DOM.watchedCount) DOM.watchedCount.textContent = totalVus;
    if (DOM.favoritesBadge) DOM.favoritesBadge.textContent = totalFav;
    if (DOM.watchlistBadge) DOM.watchlistBadge.textContent = totalWL;
    if (DOM.watchedBadge) DOM.watchedBadge.textContent = totalVus;
    if (DOM.actorsBadge) DOM.actorsBadge.textContent = ETAT_PROFIL.acteursFavoris.length;
}
