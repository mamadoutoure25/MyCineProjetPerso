// profilUser.js

// Configuration API TMDB
const CONFIG = {
    URL_BASE: "https://api.themoviedb.org/3",
    CLE_API: "04c35731a5ee918f014970082a0088b1",
    URL_IMAGE: "https://image.tmdb.org/t/p/w500",
    AFFICHE_PAR_DEFAUT: "/placeholder.svg?height=750&width=500",
    IMAGE_SUBSTITUT: "/placeholder.svg?height=750&width=500",
};

// Cache local pour les détails des films
const cacheFilms = new Map();

// Éléments du DOM
const DOM = {
    userPseudo: document.getElementById("user-pseudo"),
    usernameDisplay: document.getElementById("username-display"),
    favoritesMovies: document.getElementById("favorites-movies"),
    watchlistMovies: document.getElementById("watchlist-movies"),
    watchedMovies: document.getElementById("watched-movies"),
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
        await chargerToutesLesListes();
        console.log("✅ Profil utilisateur initialisé avec succès");
    } catch (erreur) {
        console.error("❌ Erreur lors de l'initialisation du profil:", erreur);
        afficherErreurUtilisateur();
    }
}

function verifierAuthentification() {
    const donneesAuth = sessionStorage.getItem("auth");
    if (donneesAuth) {
        try {
            ETAT_PROFIL.authentification = JSON.parse(donneesAuth);
            return true;
        } catch (erreur) {
            console.error("Erreur lors de la lecture des données d'authentification:", erreur);
            sessionStorage.removeItem("auth");
        }
    }
    return false;
}

function mettreAJourInterfaceAuthentification() {
    const auth = ETAT_PROFIL.authentification;
    if (!auth) return;
    if (DOM.userPseudo) {
        DOM.userPseudo.textContent = auth.pseudo || "Utilisateur";
    }
    if (DOM.usernameDisplay) {
        DOM.usernameDisplay.textContent = auth.pseudo || "Utilisateur";
    }
    if (DOM.lienAdmin && auth.role === "admin") {
        DOM.lienAdmin.classList.remove("d-none");
    }
    console.log(`👋 Bienvenue ${auth.pseudo}!`);
}

function gererDeconnexion() {
    sessionStorage.removeItem("auth");
    ETAT_PROFIL.authentification = null;
    afficherNotification("Déconnexion réussie", "success");
    setTimeout(() => {
        window.location.href = "../../index.html";
    }, 1000);
}

async function chargerToutesLesListes() {
    console.log("📊 Chargement de toutes les listes...");
    const promesses = [chargerFavoris(), chargerWatchlist(), chargerFilmsVus(), chargerActeursFavoris()];
    await Promise.allSettled(promesses);
    await chargerNotesUtilisateur();
    afficherFilms(ETAT_PROFIL.favoris, DOM.favoritesMovies, "favorites");
    afficherFilms(ETAT_PROFIL.watchlist, DOM.watchlistMovies, "watchlist");
    afficherFilms(ETAT_PROFIL.filmsVus, DOM.watchedMovies, "watched");
    mettreAJourStatistiques();
    afficherFilms(ETAT_PROFIL.filmsVus, DOM.watchedMovies, "watched");
    mettreAJourStatistiques();
}

async function chargerNotesUtilisateur() {
    ETAT_PROFIL.notesParTmdb.clear();
    const userId = ETAT_PROFIL.authentification?.userId;
    if (!userId) return;

    try {
        const response = await fetch(`notes.php?user_id=${userId}`);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const donnees = await response.json();
        if (!donnees.success || !Array.isArray(donnees.notes)) return;

        donnees.notes.forEach((item) => {
            const tmdbId = Number(item.tmdb_id);
            const note = Number(item.note);
            if (tmdbId > 0 && note > 0) {
                ETAT_PROFIL.notesParTmdb.set(tmdbId, note);
            }
        });
    } catch (erreur) {
        console.warn("⚠️ Impossible de charger les notes locales:", erreur);
    }
}

async function chargerFavoris() {
    if (ETAT_PROFIL.enChargement.favoris) return;
    try {
        ETAT_PROFIL.enChargement.favoris = true;
        console.log("❤️ Chargement des favoris...");
        const response = await fetch(`favorites.php?user_id=${ETAT_PROFIL.authentification.userId}`);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("La réponse n'est pas un JSON valide");
        }
        const donnees = await response.json();
        if (donnees.success && donnees.favorites) {
            const filmsDetails = await Promise.all(
                donnees.favorites.map(async (favori) => {
                    const details = await recupererDetailsFilm(favori.tmdb_id);
                    return details ? { ...details, date_ajout: favori.date_ajout || new Date().toISOString() } : null;
                })
            );
            ETAT_PROFIL.favoris = filmsDetails.filter((film) => film !== null);
            trierListe("favorites", ETAT_PROFIL.triActuel.favoris);
            afficherFilms(ETAT_PROFIL.favoris, DOM.favoritesMovies, "favorites");
            // Synchroniser avec localStorage de projet.js
            synchroniserFavorisLocalStorage();
        } else {
            ETAT_PROFIL.favoris = [];
            afficherListeVide(DOM.favoritesMovies, "favorites", "heart");
        }
    } catch (erreur) {
        console.error("❌ Erreur lors du chargement des favoris:", erreur);
        afficherErreurChargement(DOM.favoritesMovies, "favoris");
    } finally {
        ETAT_PROFIL.enChargement.favoris = false;
    }
}

async function chargerWatchlist() {
    if (ETAT_PROFIL.enChargement.watchlist) return;
    try {
        ETAT_PROFIL.enChargement.watchlist = true;
        console.log("⏰ Chargement de la watchlist...");
        const response = await fetch(`watchlist.php?user_id=${ETAT_PROFIL.authentification.userId}`);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("La réponse n'est pas un JSON valide");
        }
        const donnees = await response.json();
        if (donnees.success && donnees.watchlist) {
            const filmsDetails = await Promise.all(
                donnees.watchlist.map(async (item) => {
                    const details = await recupererDetailsFilm(item.tmdb_id);
                    return details ? { ...details, date_ajout: item.date_ajout || new Date().toISOString() } : null;
                })
            );
            ETAT_PROFIL.watchlist = filmsDetails.filter((film) => film !== null);
            trierListe("watchlist", ETAT_PROFIL.triActuel.watchlist);
            afficherFilms(ETAT_PROFIL.watchlist, DOM.watchlistMovies, "watchlist");
        } else {
            ETAT_PROFIL.watchlist = [];
            afficherListeVide(DOM.watchlistMovies, "watchlist", "clock");
        }
    } catch (erreur) {
        console.error("❌ Erreur lors du chargement de la watchlist:", erreur);
        afficherErreurChargement(DOM.watchlistMovies, "watchlist");
    } finally {
        ETAT_PROFIL.enChargement.watchlist = false;
    }
}

async function chargerFilmsVus() {
    if (ETAT_PROFIL.enChargement.filmsVus) return;
    try {
        ETAT_PROFIL.enChargement.filmsVus = true;
        console.log("✅ Chargement des films vus...");
        const response = await fetch(`watched.php?user_id=${ETAT_PROFIL.authentification.userId}`);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("La réponse n'est pas un JSON valide");
        }
        const donnees = await response.json();
        if (donnees.success && donnees.watched) {
            const filmsDetails = await Promise.all(
                donnees.watched.map(async (item) => {
                    const details = await recupererDetailsFilm(item.tmdb_id);
                    return details ? { ...details, date_ajout: item.date_ajout || new Date().toISOString() } : null;
                })
            );
            ETAT_PROFIL.filmsVus = filmsDetails.filter((film) => film !== null);
            trierListe("watched", ETAT_PROFIL.triActuel.filmsVus);
            afficherFilms(ETAT_PROFIL.filmsVus, DOM.watchedMovies, "watched");
        } else {
            ETAT_PROFIL.filmsVus = [];
            afficherListeVide(DOM.watchedMovies, "films vus", "check-circle");
        }
    } catch (erreur) {
        console.error("❌ Erreur lors du chargement des films vus:", erreur);
        afficherErreurChargement(DOM.watchedMovies, "films vus");
    } finally {
        ETAT_PROFIL.enChargement.filmsVus = false;
    }
}

async function recupererDetailsFilm(id) {
    if (cacheFilms.has(id)) {
        return cacheFilms.get(id);
    }
    const url = `${CONFIG.URL_BASE}/movie/${id}?api_key=${CONFIG.CLE_API}&language=fr-FR`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("La réponse n'est pas un JSON valide");
        }
        const details = await response.json();
        cacheFilms.set(id, details);
        return details;
    } catch (erreur) {
        console.error(`❌ Erreur API pour film ${id}:`, erreur);
        return null;
    }
}

function synchroniserFavorisLocalStorage() {
    // Synchroniser les favoris avec localStorage utilisé dans projet.js
    const favorisLocalStorage = JSON.parse(localStorage.getItem("favorites")) || [];
    const favorisServeur = ETAT_PROFIL.favoris.map(film => film.id);
    if (JSON.stringify(favorisLocalStorage) !== JSON.stringify(favorisServeur)) {
        localStorage.setItem("favorites", JSON.stringify(favorisServeur));
        window.dispatchEvent(new Event("listeMiseAJour"));
    }
}

function afficherFilms(films, conteneur, typeListe) {
    if (!conteneur || !films.length) {
        if (conteneur) {
            afficherListeVide(conteneur, typeListe, obtenirIconeType(typeListe));
        }
        return;
    }
    console.log(`🎬 Affichage de ${films.length} films pour ${typeListe}`);
    const html = films.map((film) => creerCarteFilmProfil(film, typeListe)).join("");
    conteneur.innerHTML = html;
    configurerEcouteursCartesFilms(conteneur, typeListe);
    conteneur.querySelectorAll(".profile-movie-card").forEach((carte, index) => {
        carte.style.animationDelay = `${index * 0.1}s`;
        carte.classList.add("animate-fadeInScale");
    });
}

function creerCarteFilmProfil(film, typeListe) {
    const anneeSortie = film.release_date?.substring(0, 4) || "N/A";
    const note = film.vote_average?.toFixed(1) + "/10" || "0.0/10";
    const noteLocale = ETAT_PROFIL.notesParTmdb.get(Number(film.id)) || 0;
    const classeNote = obtenirClasseNote(film.vote_average);
    const imageUrl = film.poster_path ? `${CONFIG.URL_IMAGE}${film.poster_path}` : CONFIG.AFFICHE_PAR_DEFAUT;
    return `
        <div class="profile-movie-card" data-id="${film.id}" data-type="${typeListe}">
            <div class="card-img-container">
                <img src="${imageUrl}" 
                     class="card-img-top" 
                     alt="${film.title}"
                     loading="lazy"
                     onerror="this.src='${CONFIG.IMAGE_SUBSTITUT}'">
                <div class="movie-overlay">
                    <button class="play-btn" title="Voir les détails">
                        <i class="ph ph-play"></i>
                    </button>
                </div>
                <button class="remove-btn" data-movie-id="${film.id}" data-type="${typeListe}" title="Supprimer de la liste">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
            <div class="card-body">
                <h6 class="card-title">${film.title}</h6>
                <div class="movie-meta">
                    <span class="badge ${classeNote} movie-rating">
                        <i class="ph ph-star me-1"></i>${note}
                    </span>
                    <span class="badge user-rating-badge ${noteLocale > 0 ? 'bg-info' : 'bg-secondary'}">
                        <i class="ph ph-star-half me-1"></i>${noteLocale > 0 ? `Ma note: ${noteLocale}/10` : 'Non note'}
                    </span>
                    <span class="movie-year">${anneeSortie}</span>
                </div>
                ${film.date_ajout ? `<small class="text-muted">Ajouté le ${formaterDate(film.date_ajout)}</small>` : ""}
            </div>
        </div>
    `;
}

function afficherListeVide(conteneur, typeListe, icone) {
    const messages = {
        favorites: {
            titre: "Aucun film favori",
            description: "Commencez à ajouter des films à vos favoris pour les voir ici.",
            action: "Explorer les films",
        },
        watchlist: {
            titre: "Watchlist vide",
            description: "Ajoutez des films que vous souhaitez regarder plus tard.",
            action: "Découvrir des films",
        },
        watched: {
            titre: "Aucun film vu",
            description: "Marquez les films que vous avez déjà regardés.",
            action: "Parcourir le catalogue",
        },
    };
    const message = messages[typeListe] || messages.favorites;
    conteneur.innerHTML = `
        <div class="empty-state">
            <i class="ph ph-${icone}"></i>
            <h3>${message.titre}</h3>
            <p>${message.description}</p>
            <a href="../../index.html" class="btn btn-primary">
                <i class="ph ph-house me-2"></i>${message.action}
            </a>
        </div>
    `;
}

function afficherErreurChargement(conteneur, typeListe) {
    conteneur.innerHTML = `
        <div class="empty-state">
            <i class="ph ph-warning-circle text-danger"></i>
            <h3>Erreur de chargement</h3>
            <p>Impossible de charger ${typeListe}. Veuillez réessayer.</p>
            <button class="btn btn-outline-primary" onclick="chargerToutesLesListes()">
                <i class="ph ph-arrow-clockwise me-2"></i>Réessayer
            </button>
        </div>
    `;
}

function configurerEcouteursEvenements() {
    console.log("🎧 Configuration des écouteurs d'événements du profil...");
    if (DOM.lienDeconnexion) {
        DOM.lienDeconnexion.addEventListener("click", (e) => {
            e.preventDefault();
            gererDeconnexion();
        });
    }
    const boutonsTri = [
        { id: "sort-favorites", type: "favorites" },
        { id: "sort-watchlist", type: "watchlist" },
        { id: "sort-watched", type: "watched" },
    ];
    boutonsTri.forEach(({ id, type }) => {
        const bouton = document.getElementById(id);
        if (bouton) {
            bouton.addEventListener("click", () => {
                gererTri(type);
            });
        }
    });

    // Boutons de tri spécifiques pour les acteurs
    const boutonTriActeurs = [
        { id: "sort-actors-name-asc", ordre: "name_asc", label: "Nom (A-Z)" },
        { id: "sort-actors-name-desc", ordre: "name_desc", label: "Nom (Z-A)" },
        { id: "sort-actors-age-asc", ordre: "age_asc", label: "Âge (jeune)" },
        { id: "sort-actors-age-desc", ordre: "age_desc", label: "Âge (ancien)" },
    ];
    boutonTriActeurs.forEach(({ id, ordre, label }) => {
        const bouton = document.getElementById(id);
        if (bouton) {
            bouton.addEventListener("click", () => {
                trierActeurs(ordre);
                afficherNotification(`Tri par ${label}`, "info");
            });
        }
    });

    const boutonsSuppressionTotale = [
        { id: "clear-favorites", type: "favorites", nom: "favoris" },
        { id: "clear-watchlist", type: "watchlist", nom: "watchlist" },
        { id: "clear-watched", type: "watched", nom: "films vus" },
        { id: "clear-actors", type: "actors", nom: "acteurs favoris" },
    ];
    boutonsSuppressionTotale.forEach(({ id, type, nom }) => {
        const bouton = document.getElementById(id);
        if (bouton) {
            if (type === "actors") {
                bouton.addEventListener("click", supprimerTousLesActeurs);
            } else {
                bouton.addEventListener("click", () => confirmerSuppressionTotale(type, nom));
            }
        }
    });
    if (DOM.boutonConfirmation) {
        DOM.boutonConfirmation.addEventListener("click", () => {
            if (ETAT_PROFIL.actionEnCours) {
                ETAT_PROFIL.actionEnCours();
                ETAT_PROFIL.actionEnCours = null;
            }
            if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
                bootstrap.Modal.getInstance(DOM.modalConfirmation)?.hide();
            } else {
                console.warn("Bootstrap's JavaScript n'est pas chargé correctement.");
                DOM.modalConfirmation.style.display = "none";
            }
        });
    }
    
    // Écouter les mises à jour des acteurs favoris depuis actor-details.js
    window.addEventListener("actorFavoritesUpdated", () => {
        console.log("👥 Mise à jour des acteurs favoris détectée");
        chargerActeursFavoris();
    });
}

function configurerEcouteursCartesFilms(conteneur, typeListe) {
    conteneur.querySelectorAll(".profile-movie-card").forEach((carte) => {
        carte.addEventListener("click", (e) => {
            if (e.target.closest(".remove-btn")) return;
            const idFilm = carte.dataset.id;
            if (idFilm) {
                window.location.href = `movie-details.html?id=${idFilm}`;
            }
        });
    });
    conteneur.querySelectorAll(".remove-btn").forEach((bouton) => {
        bouton.addEventListener("click", async (e) => {
            e.stopPropagation();
            const idFilm = Number.parseInt(bouton.dataset.movieId);
            const type = bouton.dataset.type;
            if (idFilm && type) {
                await supprimerFilmDeListe(idFilm, type);
            }
        });
    });
}

// ==================== ACTEURS FAVORIS ====================


/**
 * Afficher les acteurs favoris sous forme de cartes (comme les films favoris)
 */
function afficherActeursFavoris() {
    if (!DOM.actorsFavorites) return;

    if (!ETAT_PROFIL.acteursFavoris || ETAT_PROFIL.acteursFavoris.length === 0) {
        afficherActeursVide();
        mettreAJourBadgeActeurs();
        return;
    }

    console.log(`🎬 Affichage de ${ETAT_PROFIL.acteursFavoris.length} acteurs favoris`);
    
    const html = ETAT_PROFIL.acteursFavoris.map((acteur) => creerCarteActeurCommeFilm(acteur)).join("");
    DOM.actorsFavorites.innerHTML = html;
    
    configurerEcouteursCartesActeurs();
    mettreAJourBadgeActeurs();
    
    // Animation des cartes
    DOM.actorsFavorites.querySelectorAll(".actor-favorite-card").forEach((carte, index) => {
        carte.style.animationDelay = `${index * 0.1}s`;
        carte.classList.add("animate-fadeInScale");
    });
}

/**
 * Créer une carte d'acteur comme les films favoris
 */
function creerCarteActeurCommeFilm(acteur) {
    const nomActeur = acteur.name || "Acteur inconnu";
    const photoUrl = acteur.profile_path 
        ? `${CONFIG.URL_IMAGE}${acteur.profile_path}` 
        : "https://via.placeholder.com/300x450?text=Pas+de+photo";
    const age = acteur.age !== null ? `${acteur.age} ans` : "Âge inconnu";
    const origine = acteur.place_of_birth || "Lieu inconnu";

    return `
        <div class="profile-movie-card actor-favorite-card" data-id="${acteur.id}" data-actor-name="${nomActeur}" draggable="true">
            <div class="card-img-container">
                <img src="${photoUrl}" 
                     class="card-img-top" 
                     alt="${nomActeur}"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x450?text=Pas+de+photo'">
                <div class="movie-overlay">
                    <button class="play-btn view-btn" data-actor-id="${acteur.id}" title="Voir le profil">
                        <i class="ph ph-arrow-up-right"></i>
                    </button>
                </div>
                <div class="actor-name-overlay">
                    <span class="actor-name-text">${nomActeur}</span>
                    <div class="actor-info-details">
                        <p class="actor-age"><i class="ph ph-cake me-1"></i>${age}</p>
                        <p class="actor-origin"><i class="ph ph-map-pin me-1"></i>${origine}</p>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <h6 class="card-title">${nomActeur}</h6>
            </div>
        </div>
    `;
}

/**
 * Afficher l'état vide des acteurs favoris
 */
function afficherActeursVide() {
    const messages = {
        titre: "Aucun acteur favori",
        description: "Commencez à ajouter des acteurs favoris pour les voir ici.",
        action: "Découvrir les films",
    };

    DOM.actorsFavorites.innerHTML = `
        <div class="empty-state">
            <i class="ph ph-user-circle"></i>
            <h3>${messages.titre}</h3>
            <p>${messages.description}</p>
            <p class="text-muted small">Consultez des films et ajoutez des acteurs à vos favoris !</p>
            <a href="projetBD.html" class="btn btn-primary">
                <i class="ph ph-film-strip me-2"></i>${messages.action}
            </a>
        </div>
    `;
}

/**
 * Configurer les écouteurs pour les cartes d'acteurs
 */
function configurerEcouteursCartesActeurs() {
    if (!DOM.actorsFavorites) return;

    let isDragging = false;

    // Boutons pour voir le profil
    DOM.actorsFavorites.querySelectorAll(".view-btn").forEach((bouton) => {
        bouton.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!isDragging) {
                const actorId = bouton.dataset.actorId;
                if (actorId) {
                    window.location.href = `actor-details.html?id=${actorId}`;
                }
            }
        });
    });

    // Clic sur la carte pour voir le profil
    DOM.actorsFavorites.querySelectorAll(".actor-favorite-card").forEach((carte) => {
        carte.addEventListener("mousedown", () => {
            isDragging = false;
        });

        carte.addEventListener("dragstart", () => {
            isDragging = true;
        });

        carte.addEventListener("dragend", () => {
            setTimeout(() => { isDragging = false; }, 100);
        });

        carte.addEventListener("click", (e) => {
            if (!isDragging) {
                const actorId = carte.dataset.id;
                if (actorId) {
                    window.location.href = `actor-details.html?id=${actorId}`;
                }
            }
        });
    });

    // Configuration du drag and drop
    configurerDragAndDropActeurs();
}

/**
 * Configurer le drag and drop pour les cartes d'acteurs
 */
function configurerDragAndDropActeurs() {
    const cartes = DOM.actorsFavorites.querySelectorAll(".actor-favorite-card");
    let draggedElement = null;

    cartes.forEach(carte => {
        // Début du drag
        carte.addEventListener("dragstart", (e) => {
            draggedElement = carte;
            carte.style.opacity = "0.5";
            carte.style.cursor = "grabbing";
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/html", carte.innerHTML);
        });

        // Survol pendant le drag
        carte.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (carte !== draggedElement) {
                carte.style.opacity = "0.7";
                carte.style.transform = "scale(0.98)";
            }
        });

        // Sortie du drag
        carte.addEventListener("dragleave", (e) => {
            if (carte !== draggedElement) {
                carte.style.opacity = "1";
                carte.style.transform = "scale(1)";
            }
        });

        // Dépôt
        carte.addEventListener("drop", (e) => {
            e.preventDefault();
            if (carte !== draggedElement && draggedElement) {
                // Échanger les éléments
                const conteneur = DOM.actorsFavorites;
                const carteArray = Array.from(conteneur.querySelectorAll(".actor-favorite-card"));
                const indexDragged = carteArray.indexOf(draggedElement);
                const indexTarget = carteArray.indexOf(carte);

                if (indexDragged < indexTarget) {
                    carte.parentNode.insertBefore(draggedElement, carte.nextSibling);
                } else {
                    carte.parentNode.insertBefore(draggedElement, carte);
                }

                // Sauvegarder le nouvel ordre
                sauvegarderOrdreActeurs();
            }
        });

        // Fin du drag
        carte.addEventListener("dragend", (e) => {
            carte.style.opacity = "1";
            carte.style.transform = "scale(1)";
            carte.style.cursor = "grab";
            draggedElement = null;
        });
    });
}

/**
 * Sauvegarder l'ordre des acteurs dans localStorage
 */
function sauvegarderOrdreActeurs() {
    const cartes = DOM.actorsFavorites.querySelectorAll(".actor-favorite-card");
    const ordreActeurs = Array.from(cartes).map(carte => {
        return parseInt(carte.dataset.id);
    });

    // Récupérer les acteurs complets
    const actorFavorites = localStorage.getItem('actor_favorites');
    const actors = actorFavorites ? JSON.parse(actorFavorites) : [];

    // Réorganiser selon le nouvel ordre
    const actorsOrdonnes = ordreActeurs.map(id => 
        actors.find(a => a.id === id)
    ).filter(a => a !== undefined);

    localStorage.setItem('actor_favorites', JSON.stringify(actorsOrdonnes));
    console.log('✅ Ordre des acteurs sauvegardé');
    afficherNotification('Ordre réorganisé avec succès', 'success');
}

/**
 * Supprimer un acteur des favoris
 */
async function supprimerActeurDeFavoris(actorId) {
    try {
        console.log(`🗑️ Suppression de l'acteur ${actorId}`);
        
        let actorFavorites = localStorage.getItem('actor_favorites');
        let acteurs = actorFavorites ? JSON.parse(actorFavorites) : [];
        
        const index = acteurs.findIndex(a => a.id === parseInt(actorId));
        if (index !== -1) {
            acteurs.splice(index, 1);
            localStorage.setItem('actor_favorites', JSON.stringify(acteurs));
        }
        
        // Mettre à jour l'état
        const indexState = ETAT_PROFIL.acteursFavoris.findIndex(a => a.id === parseInt(actorId));
        if (indexState !== -1) {
            ETAT_PROFIL.acteursFavoris.splice(indexState, 1);
        }
        
        // Animation de suppression
        const carte = document.querySelector(`[data-id="${actorId}"]`);
        if (carte) {
            carte.style.animation = "fadeOut 0.3s ease-out";
            setTimeout(() => {
                carte.remove();
                if (!DOM.actorsFavorites.querySelector(".actor-favorite-card")) {
                    afficherActeursVide();
                }
                mettreAJourBadgeActeurs();
            }, 300);
        } else {
            afficherActeursFavoris();
        }
        
        afficherNotification("Acteur retiré des favoris", "success");
    } catch (erreur) {
        console.error("❌ Erreur lors de la suppression de l'acteur:", erreur);
        afficherNotification("Erreur lors de la suppression", "danger");
    }
}

/**
 * Mettre à jour le badge des acteurs favoris
 */
function mettreAJourBadgeActeurs() {
    const count = ETAT_PROFIL.acteursFavoris.length;
    if (DOM.actorsBadge) {
        DOM.actorsBadge.textContent = count;
    }
}

/**
 * Trier les acteurs
 */
function trierActeurs(ordre) {
    if (!Array.isArray(ETAT_PROFIL.acteursFavoris)) return;

    ETAT_PROFIL.triActuel.acteurs = ordre;

    switch (ordre) {
        case "name_asc":
            ETAT_PROFIL.acteursFavoris.sort((a, b) => 
                (a.name || "").localeCompare(b.name || "")
            );
            break;
        case "name_desc":
            ETAT_PROFIL.acteursFavoris.sort((a, b) => 
                (b.name || "").localeCompare(a.name || "")
            );
            break;
        case "age_asc":
            ETAT_PROFIL.acteursFavoris.sort((a, b) => {
                const ageA = a.age !== null ? a.age : Infinity;
                const ageB = b.age !== null ? b.age : Infinity;
                return ageA - ageB;
            });
            break;
        case "age_desc":
            ETAT_PROFIL.acteursFavoris.sort((a, b) => {
                const ageA = a.age !== null ? a.age : -Infinity;
                const ageB = b.age !== null ? b.age : -Infinity;
                return ageB - ageA;
            });
            break;
        case "popularity_asc":
            ETAT_PROFIL.acteursFavoris.sort((a, b) => 
                (a.popularity || 0) - (b.popularity || 0)
            );
            break;
        case "popularity_desc":
            ETAT_PROFIL.acteursFavoris.sort((a, b) => 
                (b.popularity || 0) - (a.popularity || 0)
            );
            break;
    }

    afficherActeursFavoris();
    console.log(`✅ Acteurs triés par: ${ordre}`);
}

/**
 * Supprimer tous les acteurs favoris
 */
async function supprimerTousLesActeurs() {
    try {
        console.log("🗑️ Suppression de tous les acteurs favoris");
        localStorage.removeItem('actor_favorites');
        ETAT_PROFIL.acteursFavoris = [];
        afficherActeursVide();
        mettreAJourBadgeActeurs();
        afficherNotification("Tous les acteurs favoris ont été supprimés", "success");
    } catch (erreur) {
        console.error("❌ Erreur lors de la suppression des acteurs:", erreur);
        afficherNotification("Erreur lors de la suppression", "danger");
    }
}

function gererTri(typeListe) {
    const optionsTri = {
        date_desc: "Date (récent)",
        date_asc: "Date (ancien)",
        title_asc: "Titre (A-Z)",
        title_desc: "Titre (Z-A)",
        rating_desc: "Note (élevée)",
        rating_asc: "Note (faible)",
    };
    const options = Object.keys(optionsTri);
    const indexActuel = options.indexOf(ETAT_PROFIL.triActuel[typeListe]);
    const nouvelIndex = (indexActuel + 1) % options.length;
    const nouveauTri = options[nouvelIndex];
    ETAT_PROFIL.triActuel[typeListe] = nouveauTri;
    trierListe(typeListe, nouveauTri);
    afficherNotification(`Tri par ${optionsTri[nouveauTri]}`, "info");
}

function trierListe(typeListe, critere) {
    const listes = {
        favorites: ETAT_PROFIL.favoris,
        watchlist: ETAT_PROFIL.watchlist,
        watched: ETAT_PROFIL.filmsVus,
    };
    const conteneurs = {
        favorites: DOM.favoritesMovies,
        watchlist: DOM.watchlistMovies,
        watched: DOM.watchedMovies,
    };
    const liste = listes[typeListe];
    const conteneur = conteneurs[typeListe];
    if (!liste || !conteneur) return;
    const fonctionsTri = {
        date_desc: (a, b) => new Date(b.date_ajout || 0) - new Date(a.date_ajout || 0),
        date_asc: (a, b) => new Date(a.date_ajout || 0) - new Date(b.date_ajout || 0),
        title_asc: (a, b) => a.title.localeCompare(b.title),
        title_desc: (a, b) => b.title.localeCompare(a.title),
        rating_desc: (a, b) => (b.vote_average || 0) - (a.vote_average || 0),
        rating_asc: (a, b) => (a.vote_average || 0) - (b.vote_average || 0),
    };
    const fonctionTri = fonctionsTri[critere];
    if (fonctionTri) {
        liste.sort(fonctionTri);
        afficherFilms(liste, conteneur, typeListe);
    }
}

function confirmerSuppressionTotale(typeListe, nomListe) {
    const listes = {
        favorites: ETAT_PROFIL.favoris,
        watchlist: ETAT_PROFIL.watchlist,
        watched: ETAT_PROFIL.filmsVus,
    };
    const liste = listes[typeListe];
    if (!liste || !liste.length) {
        afficherNotification(`Aucun film dans ${nomListe}`, "info");
        return;
    }
    if (DOM.modalBody) {
        DOM.modalBody.innerHTML = `
            <div class="text-center">
                <i class="ph ph-warning-circle text-warning display-4 mb-3"></i>
                <p>Êtes-vous sûr de vouloir supprimer tous les films de <strong>${nomListe}</strong> ?</p>
                <p class="text-muted">Cette action supprimera <strong>${liste.length} film(s)</strong> et ne peut pas être annulée.</p>
            </div>
        `;
    }
    ETAT_PROFIL.actionEnCours = () => supprimerTouteLaListe(typeListe, nomListe);
    const modal = new bootstrap.Modal(DOM.modalConfirmation);
    modal.show();
}

async function supprimerTouteLaListe(typeListe, nomListe) {
    try {
        console.log(`🗑️ Suppression totale de ${typeListe}`);
        const endpoints = {
            favorites: "favorites.php",
            watchlist: "watchlist.php",
            watched: "watched.php",
        };
        const response = await fetch(`${endpoints[typeListe]}?action=clear`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: ETAT_PROFIL.authentification.userId,
            }),
        });
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("La réponse n'est pas un JSON valide");
        }
        const donnees = await response.json();
        if (donnees.success) {
            const listes = {
                favorites: ETAT_PROFIL.favoris,
                watchlist: ETAT_PROFIL.watchlist,
                watched: ETAT_PROFIL.filmsVus,
            };
            listes[typeListe].length = 0;
            const conteneurs = {
                favorites: DOM.favoritesMovies,
                watchlist: DOM.watchlistMovies,
                watched: DOM.watchedMovies,
            };
            const conteneur = conteneurs[typeListe];
            if (conteneur) {
                afficherListeVide(conteneur, typeListe, obtenirIconeType(typeListe));
            }
            mettreAJourStatistiques();
            afficherNotification(`Tous les films ont été supprimés de ${nomListe}`, "success");
            // Synchroniser avec localStorage pour les favoris
            if (typeListe === "favorites") {
                synchroniserFavorisLocalStorage();
            }
            window.dispatchEvent(new Event("listeMiseAJour"));
        } else {
            throw new Error(donnees.message || "Erreur lors de la suppression");
        }
    } catch (erreur) {
        console.error(`❌ Erreur lors de la suppression totale de ${typeListe}:`, erreur);
        afficherNotification(`Erreur lors de la suppression: ${erreur.message}`, "danger");
    }
}

function mettreAJourStatistiques() {
    const stats = {
        favorites: ETAT_PROFIL.favoris.length,
        watchlist: ETAT_PROFIL.watchlist.length,
        watched: ETAT_PROFIL.filmsVus.length,
    };
    if (DOM.favoritesCount) DOM.favoritesCount.textContent = stats.favorites;
    if (DOM.watchlistCount) DOM.watchlistCount.textContent = stats.watchlist;
    if (DOM.watchedCount) DOM.watchedCount.textContent = stats.watched;
    if (DOM.favoritesBadge) DOM.favoritesBadge.textContent = stats.favorites;
    if (DOM.watchlistBadge) DOM.watchlistBadge.textContent = stats.watchlist;
    if (DOM.watchedBadge) DOM.watchedBadge.textContent = stats.watched;
    console.log("📊 Statistiques mises à jour:", stats);
}

function obtenirClasseNote(note) {
    if (note >= 8) return "bg-success";
    if (note >= 6) return "bg-warning";
    return "bg-danger";
}

function obtenirIconeType(type) {
    const icones = {
        favorites: "heart",
        watchlist: "clock",
        watched: "check-circle",
    };
    return icones[type] || "film-strip";
}

function formaterDate(dateString) {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch (erreur) {
        console.error("Erreur lors du formatage de la date:", erreur);
        return "";
    }
}

function afficherNotification(message, type = "info") {
    if (!DOM.conteneurToasts) return;
    const id = `toast-${Date.now()}`;
    const icones = {
        success: "ph-check-circle",
        danger: "ph-x-circle",
        warning: "ph-warning",
        info: "ph-info",
    };
    const toast = document.createElement("div");
    toast.id = id;
    toast.className = `toast show align-items-center text-white bg-${type} border-0`;
    toast.role = "alert";
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="ph ${icones[type]} me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                    onclick="document.getElementById('${id}').remove()"></button>
        </div>
    `;
    DOM.conteneurToasts.appendChild(toast);
    setTimeout(() => {
        if (document.getElementById(id)) {
            document.getElementById(id).remove();
        }
    }, 5000);
}

function afficherErreurUtilisateur() {
    const principal = document.querySelector("main");
    if (!principal) return;
    principal.innerHTML = `
        <div class="container py-5">
            <div class="row justify-content-center">
                <div class="col-md-6 text-center">
                    <i class="ph ph-warning-circle display-1 text-warning mb-4"></i>
                    <h2 class="mb-3">Erreur</h2>
                    <p class="text-muted mb-4">
                        Une erreur s'est produite lors du chargement de votre profil.
                    </p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        <i class="ph ph-arrow-clockwise me-2"></i>Réessayer
                    </button>
                    <a href="../../index.html" class="btn btn-outline-secondary ms-2">
                        <i class="ph ph-house me-2"></i>Retour à l'accueil
                    </a>
                </div>
            </div>
        </div>
    `;
}

const styleAnimations = document.createElement("style");
styleAnimations.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.9); }
    }
    .animate-fadeInScale {
        animation: fadeInScale 0.3s ease-out forwards;
    }
    @keyframes fadeInScale {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
`;
document.head.appendChild(styleAnimations);

document.addEventListener("DOMContentLoaded", initialiserProfilUtilisateur);

// Charger et afficher les acteurs favoris
async function chargerActeursFavoris() {
    try {
        console.log('📺 Chargement des acteurs favoris...');

        const actorFavorites = localStorage.getItem('actor_favorites');
        const actors = actorFavorites ? JSON.parse(actorFavorites) : [];

        console.log('✅ Acteurs trouvés:', actors.length);
        ETAT_PROFIL.acteursFavoris = actors;
        
        if (actors.length === 0) {
            console.log('ℹ️ Aucun acteur favori');
            afficherActeursVide();
            mettreAJourBadgeActeurs();
            return;
        }

        console.log('🔄 Récupération des images pour', actors.length, 'acteurs...');

        // Charger les détails et images des acteurs
        const actorsWithImages = await Promise.all(
            actors.map(async (actor) => {
                try {
                    const response = await fetch(
                        `${CONFIG.URL_BASE}/person/${actor.id}?api_key=${CONFIG.CLE_API}&language=fr-FR`,
                        { timeout: 5000 }
                    );
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`✓ Image chargée pour ${actor.name}`);
                        
                        // Calculer l'âge depuis la date de naissance
                        let age = null;
                        if (data.birthday) {
                            const birthDate = new Date(data.birthday);
                            const today = new Date();
                            age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                age--;
                            }
                        }
                        
                        return {
                            ...actor,
                            profile_path: data.profile_path || null,
                            popularity: data.popularity || actor.popularity || 0,
                            birthday: data.birthday || null,
                            age: age,
                            place_of_birth: data.place_of_birth || null
                        };
                    }
                    console.warn(`⚠️ Pas d'image pour ${actor.name} (${response.status})`);
                    return actor;
                } catch (err) {
                    console.warn(`⚠️ Erreur API pour ${actor.name}:`, err);
                    return actor;
                }
            })
        );

        ETAT_PROFIL.acteursFavoris = actorsWithImages;
        afficherActeursFavoris();
        
        console.log('✨ Acteurs affichés avec succès');
    } catch (error) {
        console.error('❌ Erreur critique lors du chargement des acteurs favoris:', error);
        afficherErreurChargement(DOM.actorsFavorites, "acteurs favoris");
    }
}

function removeActorFavorite(actorId, actorName) {
    try {
        const actorFavorites = localStorage.getItem('actor_favorites');
        const actors = actorFavorites ? JSON.parse(actorFavorites) : [];
        const filtered = actors.filter(a => a.id !== actorId);

        localStorage.setItem('actor_favorites', JSON.stringify(filtered));
        afficherNotification(`${actorName} retiré des favoris`, 'info');
        chargerActeursFavoris();
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        afficherNotification('Erreur lors de la suppression', 'danger');
    }
}

/**
 * Initialiser le drag-and-drop pour les cartes d'acteurs
 */
function initializeActorsDragAndDrop(container, actorsWithImages) {
    const actorCards = container.querySelectorAll('.actor-card-col');
    let draggedElement = null;
    let draggedActorId = null;

    actorCards.forEach(card => {
        // Événement: début du drag
        card.addEventListener('dragstart', (e) => {
            draggedElement = card;
            draggedActorId = card.dataset.actorId;
            card.style.opacity = '0.5';
            card.style.transform = 'scale(0.95)';
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', card.innerHTML);
        });

        // Événement: fin du drag
        card.addEventListener('dragend', (e) => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
            draggedElement = null;
            draggedActorId = null;

            // Retirer la classe de survol de tous les éléments
            actorCards.forEach(c => {
                c.style.borderLeft = 'none';
                c.style.paddingLeft = '0';
            });
        });

        // Événement: survol pendant le drag
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            if (card !== draggedElement) {
                card.style.borderLeft = '3px solid rgba(59, 130, 246, 0.8)';
                card.style.paddingLeft = '0.5rem';
            }
        });

        // Événement: quitter pendant le drag
        card.addEventListener('dragleave', (e) => {
            card.style.borderLeft = 'none';
            card.style.paddingLeft = '0';
        });

        // Événement: déposer
        card.addEventListener('drop', (e) => {
            e.preventDefault();

            if (card !== draggedElement && draggedActorId) {
                // Récupérer les acteurs du localStorage
                const actorFavorites = localStorage.getItem('actor_favorites');
                let actors = actorFavorites ? JSON.parse(actorFavorites) : [];

                // Trouver les indices
                const draggedIndex = actors.findIndex(a => a.id == draggedActorId);
                const targetIndex = actors.findIndex(a => a.id == card.dataset.actorId);

                if (draggedIndex !== -1 && targetIndex !== -1) {
                    // Inverser les positions
                    [actors[draggedIndex], actors[targetIndex]] = [actors[targetIndex], actors[draggedIndex]];

                    // Sauvegarder dans localStorage
                    localStorage.setItem('actor_favorites', JSON.stringify(actors));

                    console.log('✅ Ordre des acteurs mis à jour');
                    afficherNotification('Ordre réorganisé avec succès', 'success');

                    // Recharger l'affichage
                    chargerActeursFavoris();
                }
            }

            card.style.borderLeft = 'none';
            card.style.paddingLeft = '0';
        });
    });

    // Configurer les animations de survol des cartes
    container.querySelectorAll('.movie-card').forEach((carte) => {
        const img = carte.querySelector('.movie-card-img');
        const overlay = carte.querySelector('.movie-card-overlay');

        carte.addEventListener('mouseenter', () => {
            carte.style.transform = 'translateY(-8px)';
            carte.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)';
            if (img) img.style.transform = 'scale(1.05)';
            if (overlay) overlay.style.opacity = '1';
        });

        carte.addEventListener('mouseleave', () => {
            carte.style.transform = 'translateY(0)';
            carte.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            if (img) img.style.transform = 'scale(1)';
            if (overlay) overlay.style.opacity = '0';
        });
    });
}

// Bouton pour supprimer tous les acteurs favoris
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les écouteurs des acteurs favoris
    const btnClearActors = document.getElementById('clear-actors');
    if (btnClearActors) {
        btnClearActors.addEventListener('click', () => {
            if (!ETAT_PROFIL.favoris || !ETAT_PROFIL.favoris.length) {
                // Vérifier aussi les acteurs favoris
                const actorFavorites = localStorage.getItem('actor_favorites');
                const actors = actorFavorites ? JSON.parse(actorFavorites) : [];

                if (!actors.length) {
                    afficherNotification('Aucun acteur favori à supprimer', 'info');
                    return;
                }
            }

            ETAT_PROFIL.actionEnCours = (prev) => {
                localStorage.removeItem('actor_favorites');
                afficherNotification('Tous les acteurs favoris ont été supprimés', 'info');
                chargerActeursFavoris();
                return prev;
            };
            ETAT_PROFIL.actionEnCours(null);
        });
    }

    // Charger les acteurs favoris au démarrage (avec un léger délai pour s'assurer que le DOM est prêt)
    setTimeout(() => {
        chargerActeursFavoris();
    }, 100);
});

document.addEventListener("listeMiseAJour", () => {
    console.log("🔄 Mise à jour des listes détectée");
    chargerToutesLesListes();
});

window.ProfilUtilisateur = {
    ETAT_PROFIL,
    chargerToutesLesListes,
    chargerActeursFavoris,
    removeActorFavorite,
    afficherNotification,
    supprimerFilmDeListe,
};

