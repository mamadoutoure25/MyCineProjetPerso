/**
 * @file movie-details.js
 * @description Gère l'affichage des détails du film, y compris acteurs, plateformes et distributeurs, et les interactions avec les API personnalisées
 * @version 3.1
 * @update Ajout des bandes-annonces et images HD des acteurs
 */

// Configuration
const MOVIE_DETAILS_CONFIG = {
    CLE_API: "04c35731a5ee918f014970082a0088b1",
    URL_BASE: "https://api.themoviedb.org/3",
    URL_IMAGE: "https://image.tmdb.org/t/p/w500",
    URL_IMAGE_HD: "https://image.tmdb.org/t/p/w780", // Pour les arrière-plans
    URL_IMAGE_ORIGINAL: "https://image.tmdb.org/t/p/original", // Qualité maximale
    URL_IMAGE_ACTEUR: "https://image.tmdb.org/t/p/h632", // Haute qualité pour les acteurs
    IMAGE_SUBSTITUT: "https://via.placeholder.com/500x750?text=Image+indisponible",
    AFFICHE_PAR_DEFAUT: "https://via.placeholder.com/500x750?text=Aucune+affiche",
    IMAGE_ACTEUR_SUBSTITUT: "https://via.placeholder.com/300x450?text=Aucune+photo",
    ICONE_PLATEFORME_SUBSTITUT: "images/streaming-icon1.png",

    // URLs de vos API PHP - mêmes dossier que movie-details.js
    API_BASE_URL: '.', // Même dossier que le fichier HTML
}

// Correspondance des icônes des plateformes
const MOVIE_ICÔNES_PLATEFORMES = {
    "Netflix": "images/netflix.png",
    "Amazon Prime Video": "images/amazon_prime_video.png",
    "Amazon Video": "images/amazon_video.png",
    "Disney Plus": "images/disney_plus.png",
    "Apple TV Plus": "images/apple_tv_plus.png",
    "Apple TV": "images/apple_tv.png",
    "Canal+": "images/canal_plus.png",
    "OCS": "images/ocs.png",
    "Google Play Movies": "images/google_play_movies.png",
    "YouTube": "images/youtube.png",
    "FilmoTV": "images/filmotv.png",
    "Microsoft Store": "images/microsoft_store.png",
    "Skynet": "images/skynet.png",
    "Proximus Pickx": "images/proximus_pickx.png",
    "HBO Max": "images/max.png",
    "Max": "images/max.png",
    "Rakuten TV": "images/rakuten_tv.png",
    "Telenet": "images/telenet.png",
    "LaCinetek": "images/lacinetek.png",
}

// Vérification que nous sommes sur la bonne page
if (!window.location.pathname.includes('movie-details.html')) {
    console.log('Script movie-details.js chargé sur une page non concernée');
} else {
    // Éléments du DOM - fonction pour les récupérer en retard
    function getMOVIE_DOM() {
        return {
            addToFavorites: document.getElementById("add-to-favorites"),
            addToWatchlist: document.getElementById("add-to-watchlist"),
            markAsWatched: document.getElementById("mark-as-watched"),
            starRating: document.getElementById("star-rating"),
            stars: Array.from(document.querySelectorAll("#star-rating .star")),
            ratingFeedback: document.getElementById("rating-feedback"),
            btnClearRating: document.getElementById("btn-clear-rating"),
            toastContainer: document.getElementById("toast-container"),
            movieCast: document.getElementById("movie-cast"),
            movieProviders: document.getElementById("movie-providers"),
            noProviders: document.getElementById("noProviders"),
            movieBudget: document.getElementById("movie-budget"),
            movieRevenue: document.getElementById("movie-revenue"),
            movieBackdrops: document.getElementById("movie-backdrops"),
            movieCollection: document.getElementById("movie-collection"),
            movieTrailer: document.getElementById("movie-trailer"),
            watchTrailerBtn: document.getElementById("watch-trailer"),
        };
    }

    // Cache pour MOVIE_DOM
    let MOVIE_DOM = getMOVIE_DOM();

    // État
    let auth = null;
    let filmId = null;
    let userId = null;
    let bandeAnnonce = null;
    let noteCourante = 0;
    let envoiNoteEnCours = false;

    // Fonction pour rediriger vers la page de détails d'un acteur
    function voirActeur(acteurId) {
        if (acteurId) {
            try {
                window.location.href = `actor-details.html?id=${acteurId}`;
            } catch (error) {
                console.error("Erreur lors de la redirection vers actor-details:", error);
                afficherNotification("Erreur lors de la redirection vers les détails de l'acteur", "danger");
            }
        }
    }

    // Fonction pour voir plus de détails sur la collection
    function voirCollection(collectionId) {
        if (collectionId) {
            try {
                window.location.href = `collection.html?id=${collectionId}`;
            } catch (error) {
                console.error("Erreur lors de la redirection vers collection:", error);
                afficherNotification("Erreur lors de la redirection vers la collection", "danger");
            }
        }
    }

    // Attacher les fonctions au window object immédiatement
    window.voirActeur = voirActeur;
    window.voirCollection = voirCollection;

    /**
     * Récupérer les acteurs favoris du localStorage
     */
    function getActorFavorites() {
        try {
            const favorites = localStorage.getItem('actor_favorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('Erreur lors de la récupération des favoris:', error);
            return [];
        }
    }

    /**
     * Vérifier si un acteur est dans les favoris
     */
    function isActorFavorite(actorId) {
        return getActorFavorites().some(fav => fav.id === actorId);
    }

    /**
     * Ajouter/Retirer un acteur des favoris
     */
    function toggleActorFavorite(actorId, actorName) {
        try {
            let favorites = getActorFavorites();
            const index = favorites.findIndex(fav => fav.id === actorId);

            if (index > -1) {
                // Retirer des favoris
                favorites.splice(index, 1);
                afficherNotification(`${actorName} retiré des favoris`, "info");
            } else {
                // Ajouter aux favoris
                favorites.push({ id: actorId, name: actorName });
                afficherNotification(`${actorName} ajouté aux favoris`, "success");
            }

            localStorage.setItem('actor_favorites', JSON.stringify(favorites));
            updateActorFavoritesUI();
        } catch (error) {
            console.error('Erreur lors de la gestion des favoris:', error);
            afficherNotification('Erreur lors de la sauvegarde des favoris', 'danger');
        }
    }

    /**
     * Mettre à jour l'UI des boutons favoris
     */
    function updateActorFavoritesUI() {
        const favorites = getActorFavorites();

        document.querySelectorAll('.btn-actor-favorite').forEach(btn => {
            const actorId = parseInt(btn.dataset.actorId);
            const isFavorite = favorites.some(fav => fav.id === actorId);
            const icon = btn.querySelector('i');

            if (isFavorite) {
                icon.classList.remove('ph-heart');
                icon.classList.add('ph-heart-fill');
                btn.style.background = 'rgba(239, 68, 68, 0.8)';
                btn.style.color = '#fef2f2';
            } else {
                icon.classList.remove('ph-heart-fill');
                icon.classList.add('ph-heart');
                btn.style.background = 'rgba(0, 0, 0, 0.6)';
                btn.style.color = 'white';
            }
        });
    }

    window.toggleActorFavorite = toggleActorFavorite;
    window.voirCollection = voirCollection;

    // Fonction pour rediriger vers un autre film
    function voirFilm(filmId) {
        if (filmId) {
            try {
                window.location.href = `movie-details.html?id=${filmId}`;
            } catch (error) {
                console.error("Erreur lors de la redirection vers movie-details:", error);
                afficherNotification("Erreur lors de la redirection vers le film", "danger");
            }
        }
    }

    window.voirFilm = voirFilm;

    // Éléments du DOM pour l'authentification
    const AUTH_DOM = {
        lienConnexion: document.getElementById("login-link"),
        lienDeconnexion: document.getElementById("logout-link"),
        lienProfil: document.getElementById("profile-link"),
    }

    function mettreAJourInterfaceAuthentification() {
        const estConnecte = verifierAuthentification();
        const roleUtilisateur = auth?.role || "";

        if (AUTH_DOM.lienConnexion) AUTH_DOM.lienConnexion.classList.toggle("d-none", estConnecte);
        if (AUTH_DOM.lienProfil) AUTH_DOM.lienProfil.classList.toggle("d-none", !estConnecte);
        if (AUTH_DOM.lienDeconnexion) AUTH_DOM.lienDeconnexion.classList.toggle("d-none", !estConnecte);

        const lienProfilAncre = AUTH_DOM.lienProfil
            ? (AUTH_DOM.lienProfil.tagName === "A" ? AUTH_DOM.lienProfil : AUTH_DOM.lienProfil.querySelector("a"))
            : null;

        if (lienProfilAncre) {
            lienProfilAncre.setAttribute("href", "profilUser.html");
            if (estConnecte && auth?.pseudo) {
                lienProfilAncre.innerHTML = `<i class="ph ph-user me-2"></i> ${auth.pseudo}`;
            }
        }

        if (AUTH_DOM.lienDeconnexion) {
            // Supprimer les anciens écouteurs pour éviter les doublons
            const newDeconnexion = AUTH_DOM.lienDeconnexion.cloneNode(true);
            AUTH_DOM.lienDeconnexion.parentNode.replaceChild(newDeconnexion, AUTH_DOM.lienDeconnexion);
            
            newDeconnexion.addEventListener("click", (e) => {
                e.preventDefault();
                sessionStorage.removeItem("auth");
                localStorage.removeItem("lastAuth");
                window.location.reload();
            });
        }
    }

    // Vérification de l'authentification
    function verifierAuthentification() {
        // Essayer d'abord sessionStorage (prioritaire)
        let donneesAuth = sessionStorage.getItem("auth");
        console.log("Données auth dans sessionStorage:", donneesAuth);
        
        // Si pas dans sessionStorage, essayer localStorage (fallback)
        if (!donneesAuth) {
            donneesAuth = localStorage.getItem("lastAuth");
            console.log("Données auth dans localStorage:", donneesAuth);
            
            // Si on les récupère depuis localStorage, les remettre dans sessionStorage
            if (donneesAuth) {
                sessionStorage.setItem("auth", donneesAuth);
                console.log("Auth restaurée dans sessionStorage depuis localStorage");
            }
        }
        
        if (donneesAuth) {
            try {
                auth = JSON.parse(donneesAuth);
                console.log("Auth parsée:", auth);
                
                // Accepte les anciens et nouveaux formats de session auth.
                userId = auth.userId || auth.id || auth.utilisateurId || auth?.user?.id || auth?.user?.userId;
                
                console.log("userId trouvé:", userId);
                console.log("Utilisateur connecté:", userId);
                
                if (!userId) {
                    console.warn("Auth existe mais userId est vide");
                    return false;
                }
                return true;
            } catch (error) {
                console.error("Erreur lors du parsing des données d'authentification:", error);
                return false;
            }
        }
        console.log("Aucun utilisateur connecté - sessionStorage et localStorage vides");
        return false;
    }

    // Récupérer l'ID du film depuis l'URL
    function obtenirIdFilm() {
        const params = new URLSearchParams(window.location.search);
        return params.get("id");
    }

    // ==================== Notation locale (notes.php) ====================
    function setFeedbackNote(message = "", type = "info") {
        if (!MOVIE_DOM.ratingFeedback) return;
        MOVIE_DOM.ratingFeedback.textContent = message;
        MOVIE_DOM.ratingFeedback.className = `rating-feedback mb-0 text-${type}`;
    }

    function rendreEtoilesInteractives(activeValue) {
        if (!MOVIE_DOM.stars.length) return;
        const noteActive = Math.max(0, Math.min(10, Number(activeValue) || 0));

        MOVIE_DOM.stars.forEach((star) => {
            const value = Number(star.dataset.value || 0);
            const isActive = value <= noteActive;
            const icon = star.querySelector("i");

            star.classList.toggle("active", isActive);
            star.dataset.filled = isActive ? "true" : "false";
            star.setAttribute("aria-checked", String(value === noteActive));

            if (icon) {
                icon.classList.toggle("ph-star-fill", isActive);
                icon.classList.toggle("ph-star", !isActive);
            }
        });
    }

    async function recupererNoteLocale() {
        if (!userId || !filmId) return 0;
        const result = await appelAPI(`notes.php?user_id=${userId}&film_id=${filmId}`);
        return Number(result.note) || 0;
    }

    async function envoyerNoteLocale(value) {
        if (!userId) {
            throw new Error("Connectez-vous pour noter ce film.");
        }
        return await appelAPI("notes.php", "POST", {
            user_id: userId,
            film_id: parseInt(filmId, 10),
            note: value,
        });
    }

    async function soumettreNote(value) {
        if (!filmId || envoiNoteEnCours) return;

        try {
            envoiNoteEnCours = true;
            if (MOVIE_DOM.starRating) MOVIE_DOM.starRating.classList.add("is-loading");
            setFeedbackNote("Enregistrement de votre note locale...", "secondary");

            await envoyerNoteLocale(value);
            noteCourante = value;
            rendreEtoilesInteractives(noteCourante);
            setFeedbackNote(`Votre note locale: ${value}/10`, "success");
            afficherNotification(`Note locale ${value}/10 enregistrée.`, "success");

            // Afficher le bouton Annuler
            if (MOVIE_DOM.btnClearRating && value > 0) {
                MOVIE_DOM.btnClearRating.style.display = 'flex';
            }
        } catch (error) {
            console.error("Erreur de notation locale:", error);
            rendreEtoilesInteractives(noteCourante);
            setFeedbackNote(error.message || "Impossible d'enregistrer la note.", "danger");
            afficherNotification(error.message || "Erreur lors de l'enregistrement de la note.", "danger");
        } finally {
            envoiNoteEnCours = false;
            if (MOVIE_DOM.starRating) MOVIE_DOM.starRating.classList.remove("is-loading");
        }
    }

    /**
     * Annuler la note
     */
    async function annulerNote() {
        if (!filmId || envoiNoteEnCours) return;

        try {
            envoiNoteEnCours = true;
            if (MOVIE_DOM.starRating) MOVIE_DOM.starRating.classList.add("is-loading");
            setFeedbackNote("Annulation de votre note...", "secondary");

            // Utiliser la méthode DELETE pour supprimer la note
            await appelAPI("notes.php", "DELETE", {
                user_id: userId,
                film_id: parseInt(filmId, 10),
            });

            noteCourante = 0;
            rendreEtoilesInteractives(noteCourante);
            setFeedbackNote("Votre note a été supprimée. Cliquez sur une étoile pour noter ce film.", "secondary");
            afficherNotification("Note supprimée.", "info");

            // Masquer le bouton Annuler
            if (MOVIE_DOM.btnClearRating) {
                MOVIE_DOM.btnClearRating.style.display = 'none';
            }
        } catch (error) {
            console.error("Erreur lors de l'annulation:", error);
            rendreEtoilesInteractives(noteCourante);
            setFeedbackNote(error.message || "Impossible d'annuler la note.", "danger");
            afficherNotification(error.message || "Erreur lors de l'annulation.", "danger");
        } finally {
            envoiNoteEnCours = false;
            if (MOVIE_DOM.starRating) MOVIE_DOM.starRating.classList.remove("is-loading");
        }
    }

    function initialiserEvenementsNotation() {
        if (!MOVIE_DOM.starRating || !MOVIE_DOM.stars.length) return;
        if (MOVIE_DOM.starRating.dataset.bound === "true") return;

        MOVIE_DOM.starRating.dataset.bound = "true";
        MOVIE_DOM.starRating.setAttribute("role", "radiogroup");
        MOVIE_DOM.starRating.setAttribute("aria-label", "Noter ce film de 1 a 10");

        MOVIE_DOM.stars.forEach((star) => {
            const value = Number(star.dataset.value || 0);
            star.setAttribute("role", "radio");
            star.setAttribute("tabindex", "0");
            star.setAttribute("aria-label", `Noter ${value} sur 10`);

            star.addEventListener("mouseenter", () => rendreEtoilesInteractives(value));
            star.addEventListener("click", () => soumettreNote(value));
            star.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    soumettreNote(value);
                }
            });
        });

        // Restaure la note sauvegardee quand on sort du bloc des etoiles.
        MOVIE_DOM.starRating.addEventListener("mouseleave", () => rendreEtoilesInteractives(noteCourante));

        // Ajouter l'écouteur au bouton Annuler
        if (MOVIE_DOM.btnClearRating) {
            MOVIE_DOM.btnClearRating.addEventListener("click", annulerNote);
        }
    }

    async function initialiserNotationLocale() {
        if (!MOVIE_DOM.starRating || !MOVIE_DOM.stars.length || !filmId) return;

        initialiserEvenementsNotation();

        if (!userId) {
            setFeedbackNote("Connectez-vous pour ajouter votre note locale.", "secondary");
            rendreEtoilesInteractives(0);
            return;
        }

        try {
            setFeedbackNote("Chargement de votre note locale...", "secondary");
            noteCourante = await recupererNoteLocale();
            rendreEtoilesInteractives(noteCourante);

            if (noteCourante > 0) {
                setFeedbackNote(`Votre note locale actuelle: ${noteCourante}/10`, "success");
                if (MOVIE_DOM.btnClearRating) {
                    MOVIE_DOM.btnClearRating.style.display = 'flex';
                }
            } else {
                setFeedbackNote("Cliquez sur une étoile pour noter ce film.", "secondary");
                if (MOVIE_DOM.btnClearRating) {
                    MOVIE_DOM.btnClearRating.style.display = 'none';
                }
            }
        } catch (error) {
            console.error("Impossible de charger la note locale:", error);
            setFeedbackNote("Cliquez sur une étoile pour noter ce film.", "secondary");
        }
    }

    // Fonctions pour interagir avec vos API PHP
    async function appelAPI(endpoint, method = 'GET', data = null) {
        try {
            const url = `${MOVIE_DETAILS_CONFIG.API_BASE_URL}/${endpoint}`;
            console.log(`Appel API: ${method} ${url}`, data);

            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (data && (method === 'POST' || method === 'DELETE')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            const rawBody = await response.text();

            let result = {};
            if (rawBody) {
                try {
                    result = JSON.parse(rawBody);
                } catch (parseError) {
                    throw new Error(`Reponse JSON invalide (${endpoint})`);
                }
            }

            if (!response.ok) {
                const backendMessage = result?.message || `Erreur HTTP: ${response.status}`;
                const error = new Error(backendMessage);
                error.status = response.status;
                error.endpoint = endpoint;
                throw error;
            }

            console.log(`Reponse API ${endpoint}:`, result);

            if (!result.success) {
                throw new Error(result.message || 'Requete API echouee');
            }

            return result;
        } catch (error) {
            console.error(`Erreur API ${endpoint}:`, error);
            throw error;
        }
    }

    // Vérifier si un film est dans une liste
    async function verifierPresenceDansListe(liste) {
        if (!userId) return false;
        try {
            const result = await appelAPI(`${liste}.php?user_id=${userId}&film_id=${filmId}&media_type=movie`);
            // Gérer les différentes propriétés de réponse
            if (result.is_favorite !== undefined) return result.is_favorite;
            if (result.is_in_watchlist !== undefined) return result.is_in_watchlist;
            if (result.is_watched !== undefined) return result.is_watched;
            return false;
        } catch (error) {
            console.error(`Erreur vérification ${liste}:`, error);
            return false;
        }
    }

    // Ajouter un film à une liste
    async function ajouterAListe(liste) {
        if (!userId) {
            afficherNotification("Veuillez vous connecter pour gérer vos listes", "warning");
            return false;
        }

        try {
            const result = await appelAPI(`${liste}.php`, 'POST', {
                user_id: userId,
                film_id: parseInt(filmId),
                media_type: 'movie'
            });
            afficherNotification(result.message, "success");
            return true;
        } catch (error) {
            afficherNotification(`Erreur: ${error.message}`, "danger");
            return false;
        }
    }

    // Retirer un film d'une liste
    async function retirerDeListe(liste) {
        if (!userId) return false;

        try {
            const result = await appelAPI(`${liste}.php`, 'DELETE', {
                user_id: userId,
                film_id: parseInt(filmId),
                media_type: 'movie'
            });
            afficherNotification(result.message, "success");
            return true;
        } catch (error) {
            afficherNotification(`Erreur: ${error.message}`, "danger");
            return false;
        }
    }

    // Gérer le toggle d'une liste (ajouter/retirer)
    async function gererToggleListe(liste, estPresent) {
        if (estPresent) {
            return await retirerDeListe(liste);
        } else {
            return await ajouterAListe(liste);
        }
    }

    // Récupérer les détails du film via l'API TMDB avec les vidéos
    async function recupererDetailsFilm(id) {
        try {
            const url = `${MOVIE_DETAILS_CONFIG.URL_BASE}/movie/${id}?api_key=${MOVIE_DETAILS_CONFIG.CLE_API}&language=fr-FR&append_to_response=credits,release_dates,watch/providers,videos,images,external_ids`;
            console.log("URL API TMDB:", url);
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.text();
                console.error(`Erreur HTTP ${response.status}:`, errorData);
                throw new Error(`Erreur HTTP ${response.status}: ${errorData}`);
            }
            const data = await response.json();
            if (!data || !data.id) {
                throw new Error("Réponse API invalide: données manquantes");
            }
            return data;
        } catch (error) {
            console.error("Erreur lors de la récupération des détails du film:", error);
            const messageErreur = error.message || "Impossible de charger les détails du film";
            afficherNotification(messageErreur, "danger");
            return null;
        }
    }

    // Afficher une notification
    function afficherNotification(message, type = "info") {
        if (!MOVIE_DOM.toastContainer) {
            console.warn("Conteneur de notification introuvable");
            return;
        }
        const toast = document.createElement("div");
        toast.className = `toast show align-items-center text-white bg-${type} border-0`;
        toast.role = "alert";
        toast.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      `;
        MOVIE_DOM.toastContainer.appendChild(toast);
        if (window.bootstrap) {
            const bsToast = new window.bootstrap.Toast(toast);
            bsToast.show();
            toast.addEventListener("hidden.bs.toast", () => toast.remove());
        } else {
            setTimeout(() => toast.remove(), 3000);
        }
    }

    // Afficher les sociétés de production
    function afficherSocietesProduction(productionCompanies) {
        const container = document.getElementById("movie-production-companies");
        const section = document.getElementById("production-section");

        if (!container) {
            console.warn("Conteneur #movie-production-companies introuvable");
            return;
        }

        if (!productionCompanies || productionCompanies.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        container.innerHTML = `
            <div class="production-companies-grid">
                ${productionCompanies
            .map(company => `
                        <div class="production-company-card">
                            <div class="production-logo-container">
                                ${company.logo_path
                ? `<img src="${MOVIE_DETAILS_CONFIG.URL_IMAGE}${company.logo_path}" 
                                         class="production-logo" 
                                         alt="${company.name}"
                                         onerror="this.src='https://via.placeholder.com/300x200?text=${encodeURIComponent(company.name)}'">`
                : `<img src="https://via.placeholder.com/300x200?text=${encodeURIComponent(company.name)}" 
                                         class="production-logo" 
                                         alt="${company.name}">`
            }
                            </div>
                            <div class="production-info">
                                <div class="production-name">${company.name}</div>
                                ${company.origin_country ? `
                                    <div class="production-country">
                                        <i class="ph ph-globe"></i>
                                        <span>${company.origin_country}</span>
                                    </div>
                                ` : ''}
                                <a href="company-details.html?id=${company.id}" class="production-link-btn">
                                    <i class="ph ph-arrow-up-right"></i>
                                    <span>Voir détails</span>
                                </a>
                            </div>
                        </div>
                    `)
            .join('')}
            </div>
        `;
    }

    // Afficher les acteurs dans le DOM avec design moderne
    function afficherActeurs(acteurs) {
        if (!MOVIE_DOM.movieCast) {
            console.warn("Conteneur #movie-cast introuvable");
            return;
        }
        if (!acteurs || acteurs.length === 0) {
            MOVIE_DOM.movieCast.innerHTML = '<p class="text-muted text-center w-100">Aucune information sur la distribution.</p>';
            return;
        }

        MOVIE_DOM.movieCast.innerHTML = acteurs
            .slice(0, 18) // Afficher 18 acteurs
            .map(
                (acteur) => `
                <div class="movie-card" onclick="if(!event.target.closest('.btn-actor-favorite')) { voirActeur(${acteur.id}); }">
                    <div class="movie-card-inner">
                      <img src="${acteur.profile_path ? MOVIE_DETAILS_CONFIG.URL_IMAGE_ACTEUR + acteur.profile_path : MOVIE_DETAILS_CONFIG.IMAGE_ACTEUR_SUBSTITUT}"
                           class="movie-card-img"
                           alt="${acteur.name}"
                           loading="lazy"
                           onerror="this.src='${MOVIE_DETAILS_CONFIG.IMAGE_ACTEUR_SUBSTITUT}'">

                      <div class="movie-card-overlay">
                        <div class="text-white w-100">
                          <h6 class="mb-1 fw-bold movie-title" style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; font-size: 1rem; -webkit-text-fill-color: white;">${acteur.name}</h6>
                          <small class="d-block" style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; color: rgba(255, 255, 255, 0.8); font-size: 0.8rem;">${acteur.character || "Rôle inconnu"}</small>
                        </div>
                      </div>

                      <button class="btn-actor-favorite position-absolute top-2 end-2" 
                              data-actor-id="${acteur.id}"
                              data-actor-name="${acteur.name.replace(/'/g, "\\'")}"
                              onclick="event.stopPropagation(); toggleActorFavorite(${acteur.id}, '${acteur.name.replace(/'/g, "\\'")}');"
                              title="Ajouter aux favoris"
                              style="background: rgba(0, 0, 0, 0.6); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease; z-index: 10;">
                        <i class="ph ph-heart" style="font-size: 1.1rem;"></i>
                      </button>
                    </div>
                </div>
              `,
            )
            .join("")
;

        // Mettre à jour l'état des boutons favoris
        updateActorFavoritesUI();
    }

    // Afficher la bande-annonce
    function afficherBandeAnnonce(videos) {
        if (!MOVIE_DOM.movieTrailer) {
            console.warn("Conteneur #movie-trailer introuvable");
            return;
        }

        // Chercher une bande-annonce officielle en français
        const bandeAnnonce = videos?.results?.find(video =>
            video.type === 'Trailer' &&
            video.site === 'YouTube' &&
            (video.official === true || video.name.toLowerCase().includes('trailer'))
        );

        if (bandeAnnonce) {
            MOVIE_DOM.movieTrailer.innerHTML = `
                <div class="ratio ratio-16x9">
                    <iframe 
                        src="https://www.youtube.com/embed/${bandeAnnonce.key}" 
                        title="Bande-annonce: ${bandeAnnonce.name}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        class="rounded-3"
                    ></iframe>
                </div>
            `;

            // Afficher le bouton "Voir la bande-annonce" dans la section hero
            if (MOVIE_DOM.watchTrailerBtn) {
                MOVIE_DOM.watchTrailerBtn.style.display = 'flex';
                MOVIE_DOM.watchTrailerBtn.href = `https://www.youtube.com/watch?v=${bandeAnnonce.key}`;
                MOVIE_DOM.watchTrailerBtn.target = '_blank';
            }
        } else {
            MOVIE_DOM.movieTrailer.innerHTML = `
                <div class="no-trailer text-center py-5">
                    <i class="ph ph-film-slate display-1 text-muted mb-3"></i>
                    <p class="text-muted fs-5">Aucune bande-annonce disponible pour ce film</p>
                </div>
            `;
        }
    }

    // Afficher toutes les vidéos (trailers, teasers, clips, etc.)
    function afficherToutesLesVideos(videos) {
        const videosSection = document.getElementById("videos-section");
        const videosContainer = document.getElementById("movie-videos");

        if (!videosContainer) {
            console.warn("Conteneur #movie-videos introuvable");
            return;
        }

        // Récupérer toutes les vidéos YouTube
        const toutesLesVideos = videos?.results?.filter(video => video.site === 'YouTube') || [];

        if (toutesLesVideos.length === 0) {
            if (videosSection) {
                videosSection.style.display = "none";
            }
            return;
        }

        // Masquer la section si elle est affichée par défaut
        if (videosSection) {
            videosSection.style.display = "block";
        }

        // Grouper les vidéos par type
        const videosByType = {};
        toutesLesVideos.forEach(video => {
            if (!videosByType[video.type]) {
                videosByType[video.type] = [];
            }
            videosByType[video.type].push(video);
        });

        // Générer le HTML pour les vidéos
        let html = '';

        // Ordre de priorité des types de vidéo
        const ordreTypes = ['Trailer', 'Teaser', 'Featurette', 'Clip', 'Behind the Scenes', 'Bloopers', 'Opening Credits'];

        for (const type of ordreTypes) {
            if (videosByType[type]) {
                html += `<div class="videos-type-section mb-5">
                    <h3 class="videos-type-title mb-3">
                        <i class="ph ${getIconeVideos(type)}"></i> ${type}
                    </h3>
                    <div class="videos-type-grid">`;

                videosByType[type].forEach(video => {
                    const official = video.official ? 'officiel' : 'non-officiel';
                    const thumbnail = `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`;

                    html += `
                        <div class="video-card" data-video-id="${video.key}" data-video-title="${video.name}">
                            <div class="video-card-thumbnail">
                                <img src="${thumbnail}" 
                                     alt="${video.name}"
                                     onerror="this.src='https://img.youtube.com/vi/${video.key}/hqdefault.jpg'"
                                     loading="lazy">
                                <div class="video-card-overlay">
                                    <button class="play-button" onclick="ouvrirVideoModal('${video.key}', '${video.name.replace(/'/g, "\\'")}')">
                                        <i class="ph ph-play-circle"></i>
                                    </button>
                                </div>
                                ${video.official ? '<span class="badge-official">Officiel</span>' : ''}
                            </div>
                            <div class="video-card-info">
                                <p class="video-card-title">${video.name}</p>
                                <small class="video-card-meta">
                                    ${video.size}p • ${new Date(video.published_at).toLocaleDateString('fr-FR')}
                                </small>
                            </div>
                        </div>
                    `;
                });

                html += `</div></div>`;
            }
        }

        // Afficher les autres types non listés
        for (const type in videosByType) {
            if (!ordreTypes.includes(type)) {
                html += `<div class="videos-type-section mb-5">
                    <h3 class="videos-type-title mb-3">
                        <i class="ph ph-video"></i> ${type}
                    </h3>
                    <div class="videos-type-grid">`;

                videosByType[type].forEach(video => {
                    const thumbnail = `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`;

                    html += `
                        <div class="video-card" data-video-id="${video.key}" data-video-title="${video.name}">
                            <div class="video-card-thumbnail">
                                <img src="${thumbnail}" 
                                     alt="${video.name}"
                                     onerror="this.src='https://img.youtube.com/vi/${video.key}/hqdefault.jpg'"
                                     loading="lazy">
                                <div class="video-card-overlay">
                                    <button class="play-button" onclick="ouvrirVideoModal('${video.key}', '${video.name.replace(/'/g, "\\'")}')">
                                        <i class="ph ph-play-circle"></i>
                                    </button>
                                </div>
                                ${video.official ? '<span class="badge-official">Officiel</span>' : ''}
                            </div>
                            <div class="video-card-info">
                                <p class="video-card-title">${video.name}</p>
                                <small class="video-card-meta">
                                    ${video.size}p • ${new Date(video.published_at).toLocaleDateString('fr-FR')}
                                </small>
                            </div>
                        </div>
                    `;
                });

                html += `</div></div>`;
            }
        }

        videosContainer.innerHTML = html;
    }

    // Fonction helper pour obtenir l'icône appropriée selon le type de vidéo
    function getIconeVideos(type) {
        const icones = {
            'Trailer': 'ph-play-circle',
            'Teaser': 'ph-play',
            'Featurette': 'ph-film-strip',
            'Clip': 'ph-scissors',
            'Behind the Scenes': 'ph-camera',
            'Bloopers': 'ph-smiley-wink',
            'Opening Credits': 'ph-list'
        };
        return icones[type] || 'ph-video';
    }

    // Fonction pour ouvrir une vidéo dans un modal
    function ouvrirVideoModal(videoKey, videoTitle) {
        // Créer le modal s'il n'existe pas
        let modal = document.getElementById('videoModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'videoModal';
            modal.className = 'modal fade';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('data-bs-backdrop', 'static');
            modal.innerHTML = `
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content" style="background: var(--bg-card); border: 1px solid var(--border);">
                        <div class="modal-header" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border);">
                            <h5 class="modal-title" id="videoModalTitle" style="color: var(--text-primary); font-weight: 600;"></h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fermer"></button>
                        </div>
                        <div class="modal-body" style="background: var(--bg-card); padding: 2rem;">
                            <div class="ratio ratio-16x9">
                                <iframe id="videoModalFrame" 
                                    title="Vidéo YouTube"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen
                                    style="border-radius: 0.5rem;"></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Mettre à jour le contenu du modal
        document.getElementById('videoModalTitle').textContent = videoTitle;
        document.getElementById('videoModalFrame').src = `https://www.youtube.com/embed/${videoKey}?autoplay=1`;

        // Ouvrir le modal
        const bsModal = new window.bootstrap.Modal(modal);
        bsModal.show();
    }

    // Afficher les identifiants externes (IMDb, Facebook, Twitter, etc.)
    function afficherIdentifiantsExternes(film) {
        const container = document.getElementById("external-ids");
        if (!container || !film.external_ids) return;

        const externalIds = film.external_ids;
        let html = '<div class="external-links">';

        // IMDb
        if (externalIds.imdb_id) {
            html += `<a href="https://www.imdb.com/title/${externalIds.imdb_id}/" target="_blank" rel="noopener noreferrer" class="external-link" data-tooltip="IMDb" title="Voir sur IMDb"><i class="ph ph-imdb-logo"></i> IMDb</a>`;
        }

        // Wikidata
        if (externalIds.wikidata_id) {
            html += `<a href="https://www.wikidata.org/wiki/${externalIds.wikidata_id}" target="_blank" rel="noopener noreferrer" class="external-link" data-tooltip="Wikidata" title="Voir sur Wikidata"><i class="ph ph-globe"></i> Wikidata</a>`;
        }

        // Facebook
        if (externalIds.facebook_id) {
            html += `<a href="https://www.facebook.com/${externalIds.facebook_id}" target="_blank" rel="noopener noreferrer" class="external-link" data-tooltip="Facebook" title="Voir sur Facebook"><i class="ph ph-facebook-logo"></i> Facebook</a>`;
        }

        // Twitter
        if (externalIds.twitter_id) {
            html += `<a href="https://twitter.com/${externalIds.twitter_id}" target="_blank" rel="noopener noreferrer" class="external-link" data-tooltip="Twitter" title="Voir sur Twitter"><i class="ph ph-x-logo"></i> Twitter</a>`;
        }

        // Instagram
        if (externalIds.instagram_id) {
            html += `<a href="https://www.instagram.com/${externalIds.instagram_id}/" target="_blank" rel="noopener noreferrer" class="external-link" data-tooltip="Instagram" title="Voir sur Instagram"><i class="ph ph-instagram-logo"></i> Instagram</a>`;
        }

        html += '</div>';

        // Si aucun identifiant externe n'est disponible
        if (!externalIds.imdb_id && !externalIds.wikidata_id && !externalIds.facebook_id && !externalIds.twitter_id && !externalIds.instagram_id) {
            container.innerHTML = '<p class="text-muted">Aucun lien externe disponible pour ce film.</p>';
        } else {
            container.innerHTML = html;
        }
    }

    // Obtenir l'URL de la plateforme
    function obtenirUrlPlateforme(nomPlateforme, titreFilm, idFilm, typePlateforme) {
        const urlsPlateformes = {
            Netflix: `https://www.netflix.com/search?q=${encodeURIComponent(titreFilm)}`,
            "Amazon Prime Video": `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(titreFilm)}`,
            "Amazon Video": `https://www.amazon.com/s?k=${encodeURIComponent(titreFilm)}&i=instant-video`,
            "Disney Plus": `https://www.disneyplus.com/search?q=${encodeURIComponent(titreFilm)}`,
            "Apple TV Plus": `https://tv.apple.com/search?term=${encodeURIComponent(titreFilm)}`,
            "Apple TV": `https://tv.apple.com/search?term=${encodeURIComponent(titreFilm)}`,
            "Canal+": `https://www.canalplus.com/recherche/?q=${encodeURIComponent(titreFilm)}`,
            OCS: `https://www.ocs.fr/rechercher?q=${encodeURIComponent(titreFilm)}`,
            "Google Play Movies": `https://play.google.com/store/search?q=${encodeURIComponent(titreFilm)}&c=movies`,
            YouTube: `https://www.youtube.com/results?search_query=${encodeURIComponent(titreFilm + " movie")}`,
            FilmoTV: `https://www.filmotv.fr/fr/recherche?term=${encodeURIComponent(titreFilm)}`,
            "Microsoft Store": `https://www.microsoft.com/fr-be/store/movies-and-tv?query=${encodeURIComponent(titreFilm)}`,
            Skynet: `https://www.skynet.be/fr/recherche?term=${encodeURIComponent(titreFilm)}`,
            "Proximus Pickx": `https://www.proximus.be/fr/id_s_search?term=${encodeURIComponent(titreFilm)}`,
            "HBO Max": `https://play.hbomax.com/search/result?q=${encodeURIComponent(titreFilm).replace(/%20/g, "+")}`,
            Max: `https://play.hbomax.com/search/result?q=${encodeURIComponent(titreFilm).replace(/%20/g, "+")}`,
            "Rakuten TV": `https://www.rakuten.tv/fr/search?q=${encodeURIComponent(titreFilm)}`,
            Telenet: `https://www.telenet.be/fr/recherche?term=${encodeURIComponent(titreFilm)}`,
            LaCinetek: `https://www.lacinetek.com/fr/rechercher?term=${encodeURIComponent(titreFilm)}`,
        };
        return urlsPlateformes[nomPlateforme] || "#";
    }

    // Récupérer les plateformes et distributeurs
    async function recupererPlateformesEtDistributeurs(filmId, filmData = null) {
        try {
            const url = `${MOVIE_DETAILS_CONFIG.URL_BASE}/movie/${filmId}/watch/providers?api_key=${MOVIE_DETAILS_CONFIG.CLE_API}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
            const data = await response.json();
            const resultatsBE = data.results?.BE || {};
            const plateformes = resultatsBE.flatrate || [];
            const distributeurs = [...(resultatsBE.buy || []), ...(resultatsBE.rent || [])];
            // Utiliser les données passées en paramètre ou récupérer le titre du film
            const titreFilm = filmData?.title || (await recupererDetailsFilm(filmId))?.title || "";
            return { plateformes, distributeurs, titreFilm };
        } catch (error) {
            console.error("Erreur lors de la récupération des plateformes:", error);
            afficherNotification("Erreur lors du chargement des plateformes", "warning");
            return { plateformes: [], distributeurs: [], titreFilm: "" };
        }
    }

    // Afficher les plateformes et distributeurs
    function afficherPlateformesEtDistributeurs({ plateformes, distributeurs, titreFilm }) {
        if (!MOVIE_DOM.movieProviders || !MOVIE_DOM.noProviders) {
            console.warn("Conteneurs #movie-providers ou #noProviders introuvables");
            return;
        }

        if (!plateformes.length && !distributeurs.length) {
            MOVIE_DOM.noProviders.style.display = "block";
            MOVIE_DOM.movieProviders.style.display = "none";
            return;
        }

        MOVIE_DOM.noProviders.style.display = "none";
        MOVIE_DOM.movieProviders.style.display = "block";

        const htmlPlateformes = plateformes.length
            ? `
          <div class="provider-section mb-4">
            <h3 class="mb-3"><i class="ph ph-television"></i> Plateformes de streaming</h3>
            <div class="vod-providers-grid">
              ${plateformes
                .map(
                    (plateforme) => {
                        const logoUrl = plateforme.logo_path 
                            ? `${MOVIE_DETAILS_CONFIG.URL_IMAGE}${plateforme.logo_path}`
                            : (MOVIE_ICÔNES_PLATEFORMES[plateforme.provider_name] || MOVIE_DETAILS_CONFIG.ICONE_PLATEFORME_SUBSTITUT);
                        
                        return `
                  <a href="${obtenirUrlPlateforme(plateforme.provider_name, titreFilm, filmId, "flatrate")}"
                     target="_blank" rel="noopener" class="vod-provider-card text-decoration-none">
                    <img src="${logoUrl}"
                         alt="${plateforme.provider_name}" 
                         class="vod-provider-logo"
                         onerror="this.src='${MOVIE_DETAILS_CONFIG.ICONE_PLATEFORME_SUBSTITUT}'">
                    <div class="vod-provider-name">${plateforme.provider_name}</div>
                    <div class="vod-provider-type">Streaming</div>
                  </a>
                `;
                    }
                )
                .join("")}
            </div>
          </div>
        `
            : "";

        const htmlDistributeurs = distributeurs.length
            ? `
          <div class="provider-section">
            <h3 class="mb-3"><i class="ph ph-tag"></i> Achat & Location</h3>
            <div class="vod-providers-grid">
              ${distributeurs
                .map(
                    (distributeur) => {
                        const logoUrl = distributeur.logo_path 
                            ? `${MOVIE_DETAILS_CONFIG.URL_IMAGE}${distributeur.logo_path}`
                            : (MOVIE_ICÔNES_PLATEFORMES[distributeur.provider_name] || MOVIE_DETAILS_CONFIG.ICONE_PLATEFORME_SUBSTITUT);

                        return `
                  <a href="${obtenirUrlPlateforme(distributeur.provider_name, titreFilm, filmId, "buy")}"
                     target="_blank" rel="noopener" class="vod-provider-card text-decoration-none">
                    <img src="${logoUrl}"
                         alt="${distributeur.provider_name}" 
                         class="vod-provider-logo"
                         onerror="this.src='${MOVIE_DETAILS_CONFIG.ICONE_PLATEFORME_SUBSTITUT}'">
                    <div class="vod-provider-name">${distributeur.provider_name}</div>
                    <div class="vod-provider-type">Achat/Location</div>
                  </a>
                `;
                    }
                )
                .join("")}
            </div>
          </div>
        `
            : "";

        MOVIE_DOM.movieProviders.innerHTML = htmlPlateformes + htmlDistributeurs;
    }

    // Formater les montants en devise
    function formaterDevise(montant) {
        if (!montant || montant === 0) return "Non divulgué";
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(montant);
    }

    // Afficher les informations financières
    function afficherInformationsFinancieres(film) {
        const budgetElement = document.getElementById("movie-budget");
        const revenueElement = document.getElementById("movie-revenue");

        if (budgetElement) {
            budgetElement.textContent = formaterDevise(film.budget);
        }

        if (revenueElement) {
            revenueElement.textContent = formaterDevise(film.revenue);
        }
    }

    // Afficher les dates de sortie
    function afficherDatesDeSortie(releaseDatesData) {
        const container = document.getElementById("movie-release-dates");
        const section = document.getElementById("release-dates-section");

        if (!container || !section) {
            console.warn("Conteneur #movie-release-dates ou #release-dates-section introuvable");
            return;
        }

        // Les données de release_dates contiennent un objet avec les pays comme clés
        const results = releaseDatesData?.results || [];

        if (!results || results.length === 0) {
            section.style.display = 'none';
            return;
        }

        // Filtrer pour garder uniquement Belgique, France et USA
        const paysAutorises = ['BE', 'FR', 'US'];

        // Créer un tableau avec les pays et leurs dates
        const releaseTable = results.map(item => ({
            country: item.iso_3166_1,
            releases: item.release_dates || []
        }))
        .filter(item => paysAutorises.includes(item.country) && item.releases.length > 0)
        .sort((a, b) => {
            // Trier pour mettre la Belgique, France et USA en premier
            const order = { 'BE': 0, 'FR': 1, 'US': 2 };
            return (order[a.country] ?? 999) - (order[b.country] ?? 999);
        });

        if (releaseTable.length === 0) {
            section.style.display = 'none';
            return;
        }

        // Mapper les codes de pays vers les noms
        const countryNames = {
            'US': 'États-Unis',
            'FR': 'France',
            'BE': 'Belgique'
        };

        // Mapper les types de release vers les libellés
        const releaseTypeNames = {
            1: 'Première',
            2: 'Sortie cinéma limitée',
            3: 'Sortie cinéma',
            4: 'Sortie numérique',
            5: 'Sortie vidéo physique',
            6: 'Sortie TV'
        };

        const html = `
            <div class="release-dates-table-wrapper">
                <table class="release-dates-table">
                    <thead>
                        <tr>
                            <th>Pays</th>
                            <th>Date</th>
                            <th>Type de sortie</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${releaseTable.map(item => {
                            const countryName = countryNames[item.country] || item.country;
                            return item.releases.map((release, index) => {
                                const releaseDate = new Date(release.release_date);
                                const formattedDate = new Intl.DateTimeFormat('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }).format(releaseDate);

                                const releaseType = releaseTypeNames[release.type] || `Type ${release.type}`;
                                const certification = release.certification ? ` (${release.certification})` : '';

                                return `
                                    <tr class="release-row ${item.country === 'BE' || item.country === 'FR' ? 'highlight' : ''}">
                                        <td class="country-cell">
                                            <span class="country-flag">${item.country}</span>
                                            <span class="country-name">${countryName}</span>
                                        </td>
                                        <td class="date-cell">${formattedDate}</td>
                                        <td class="type-cell">
                                            <span class="release-type-badge">${releaseType}${certification}</span>
                                        </td>
                                    </tr>
                                `;
                            }).join('');
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    // Afficher les fonds d'écran en haute qualité
    function afficherFondsEcran(images) {
        const backdropsContainer = document.getElementById("movie-backdrops");

        if (!backdropsContainer) {
            console.warn("Conteneur #movie-backdrops introuvable");
            return;
        }

        const backdrops = images?.backdrops || [];
        const logos = images?.logos || [];
        const posters = images?.posters || [];

        // Si aucune image n'est disponible
        if (!backdrops.length && !logos.length && !posters.length) {
            backdropsContainer.innerHTML = '<p class="text-muted">Aucune image disponible pour ce film.</p>';
            return;
        }

        let html = `
            <ul class="nav nav-tabs mb-4" id="imagesTab" role="tablist">
        `;

        // Onglet Backdrops
        if (backdrops.length) {
            html += `
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="backdrops-tab" data-bs-toggle="tab" data-bs-target="#backdrops" type="button" role="tab">
                        <i class="ph ph-image me-2"></i>Backdrops (${backdrops.length})
                    </button>
                </li>
            `;
        }

        // Onglet Logos
        if (logos.length) {
            html += `
                <li class="nav-item" role="presentation">
                    <button class="nav-link${!backdrops.length ? ' active' : ''}" id="logos-tab" data-bs-toggle="tab" data-bs-target="#logos" type="button" role="tab">
                        <i class="ph ph-seal me-2"></i>Logos (${logos.length})
                    </button>
                </li>
            `;
        }

        // Onglet Posters
        if (posters.length) {
            html += `
                <li class="nav-item" role="presentation">
                    <button class="nav-link${!backdrops.length && !logos.length ? ' active' : ''}" id="posters-tab" data-bs-toggle="tab" data-bs-target="#posters" type="button" role="tab">
                        <i class="ph ph-film-strip me-2"></i>Posters (${posters.length})
                    </button>
                </li>
            `;
        }

        html += `</ul>`;

        // Contenu des onglets
        html += `<div class="tab-content" id="imagesTabContent">`;

        // Contenu Backdrops
        if (backdrops.length) {
            html += `
                <div class="tab-pane fade${backdrops.length ? ' show active' : ''}" id="backdrops" role="tabpanel">
                    <div class="images-grid">
                        ${backdrops.slice(0, 24).map((backdrop, index) => `
                            <div class="image-card" onclick="afficherImageModal('${MOVIE_DETAILS_CONFIG.URL_IMAGE_ORIGINAL}${backdrop.file_path}', 'Backdrop ${index + 1}')">
                                <div class="image-card-inner">
                                    <img src="${MOVIE_DETAILS_CONFIG.URL_IMAGE_HD}${backdrop.file_path}" 
                                         alt="Backdrop ${index + 1}"
                                         loading="lazy"
                                         class="image-card-img">
                                    <div class="image-card-overlay">
                                        <div class="image-card-info">
                                            <i class="ph ph-play-circle"></i>
                                            <small>${backdrop.width}x${backdrop.height}</small>
                                        </div>
                                    </div>
                                    ${backdrop.vote_average > 0 ? `<span class="badge-rating">${backdrop.vote_average.toFixed(1)}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Contenu Logos
        if (logos.length) {
            html += `
                <div class="tab-pane fade${!backdrops.length ? ' show active' : ''}" id="logos" role="tabpanel">
                    <div class="images-grid images-grid-logos">
                        ${logos.slice(0, 24).map((logo, index) => `
                            <div class="image-card" onclick="afficherImageModal('${MOVIE_DETAILS_CONFIG.URL_IMAGE_ORIGINAL}${logo.file_path}', 'Logo ${index + 1}')">
                                <div class="image-card-inner image-card-logo">
                                    <img src="${MOVIE_DETAILS_CONFIG.URL_IMAGE_ORIGINAL}${logo.file_path}" 
                                         alt="Logo ${index + 1}"
                                         loading="lazy"
                                         class="image-card-img">
                                    <div class="image-card-overlay">
                                        <div class="image-card-info">
                                            <i class="ph ph-play-circle"></i>
                                            <small>${logo.iso_639_1 || 'Unknown'}</small>
                                        </div>
                                    </div>
                                    ${logo.vote_average > 0 ? `<span class="badge-rating">${logo.vote_average.toFixed(1)}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Contenu Posters
        if (posters.length) {
            html += `
                <div class="tab-pane fade${!backdrops.length && !logos.length ? ' show active' : ''}" id="posters" role="tabpanel">
                    <div class="images-grid images-grid-posters">
                        ${posters.slice(0, 24).map((poster, index) => `
                            <div class="image-card" onclick="afficherImageModal('${MOVIE_DETAILS_CONFIG.URL_IMAGE_ORIGINAL}${poster.file_path}', 'Poster ${index + 1}')">
                                <div class="image-card-inner image-card-poster">
                                    <img src="${MOVIE_DETAILS_CONFIG.URL_IMAGE}${poster.file_path}" 
                                         alt="Poster ${index + 1}"
                                         loading="lazy"
                                         class="image-card-img">
                                    <div class="image-card-overlay">
                                        <div class="image-card-info">
                                            <i class="ph ph-play-circle"></i>
                                            <small>${poster.iso_639_1 || 'Unknown'}</small>
                                        </div>
                                    </div>
                                    ${poster.vote_average > 0 ? `<span class="badge-rating">${poster.vote_average.toFixed(1)}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        html += `</div>`;

        backdropsContainer.innerHTML = html;
    }

    // Fonction pour afficher une image en modal
    function afficherImageModal(imageSrc, imageTitle) {
        let modal = document.getElementById('imageModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'imageModal';
            modal.className = 'modal fade';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('data-bs-backdrop', 'static');
            modal.innerHTML = `
                <div class="modal-dialog modal-fullscreen">
                    <div class="modal-content" style="background: rgba(0, 0, 0, 0.95);">
                        <div class="modal-header" style="border-bottom: 1px solid var(--border);">
                            <h5 class="modal-title" id="imageModalTitle" style="color: var(--text-primary);"></h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fermer"></button>
                        </div>
                        <div class="modal-body d-flex align-items-center justify-content-center p-0">
                            <img id="imageModalImage" src="" class="img-fluid" alt="" style="max-height: 90vh; object-fit: contain;">
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('imageModalTitle').textContent = imageTitle;
        document.getElementById('imageModalImage').src = imageSrc;

        const bsModal = new window.bootstrap.Modal(modal);
        bsModal.show();
    }

    // Afficher la collection
    async function afficherCollection(film) {
        const collectionContainer = document.getElementById("movie-collection");
        const collectionSection = document.getElementById("collection-section");

        if (!collectionContainer || !film.belongs_to_collection) {
            if (collectionSection) {
                collectionSection.style.display = "none";
            }
            return;
        }

        // Afficher la section
        if (collectionSection) {
            collectionSection.style.display = "block";
        }

        let collection = film.belongs_to_collection;

        try {
            const response = await fetch(
                `${MOVIE_DETAILS_CONFIG.URL_BASE}/collection/${collection.id}?api_key=${MOVIE_DETAILS_CONFIG.CLE_API}&language=fr-FR`
            );
            if (response.ok) {
                collection = await response.json();
            }
        } catch (error) {
            console.error("Erreur lors de la récupération de la collection:", error);
        }

        // Créer un aperçu des films de la collection
        const moviesHTML = collection.parts ? collection.parts.slice(0, 5).map(movie => `
            <div class="collection-movie-preview" onclick="voirFilm(${movie.id})" style="cursor: pointer;">
                <img src="${movie.poster_path ? MOVIE_DETAILS_CONFIG.URL_IMAGE + movie.poster_path : MOVIE_DETAILS_CONFIG.AFFICHE_PAR_DEFAUT}" 
                     alt="${movie.title}"
                     style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">
                <div style="font-size: 0.9rem; color: var(--text); font-weight: 600;">${movie.title}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</div>
            </div>
        `).join('') : '';

        const totalMovies = collection.parts ? collection.parts.length : 0;

        collectionContainer.innerHTML = `
        <div class="collection-card" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(6, 182, 212, 0.05)); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
          <div class="row g-0">
            <div class="col-md-4">
              <img src="${collection.poster_path ? MOVIE_DETAILS_CONFIG.URL_IMAGE_HD + collection.poster_path : MOVIE_DETAILS_CONFIG.AFFICHE_PAR_DEFAUT}" 
                   class="img-fluid rounded-start h-100 object-fit-cover" 
                   alt="${collection.name}"
                   style="height: 300px; object-fit: cover;">
            </div>
            <div class="col-md-8">
              <div class="card-body d-flex flex-column h-100 p-4">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                  <h3 class="card-title mb-0" style="color: var(--primary); flex-grow: 1;">${collection.name}</h3>
                  <span class="badge rounded-pill" style="background: var(--primary); color: white;">${totalMovies} films</span>
                </div>
                <p class="card-text flex-grow-1" style="color: var(--text-secondary); font-size: 0.95rem;">${collection.overview || "Aucune description disponible pour cette collection."}</p>
                <div style="margin-top: 1rem;">
                  <div style="display: grid; grid-template-columns: repeat(${Math.min(5, totalMovies)}, 1fr); gap: 10px; margin-bottom: 1.5rem;">
                    ${moviesHTML}
                  </div>
                  ${totalMovies > 5 ? `<small style="color: var(--text-muted); display: block; margin-bottom: 1rem;">+${totalMovies - 5} autres films...</small>` : ''}
                  <button class="btn btn-lg" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; border: none; width: 100%;" onclick="voirCollection(${collection.id})">
                    <i class="ph ph-play-circle me-2"></i>Voir toute la collection (${totalMovies} films)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Mettre à jour l'état des boutons
    async function mettreAJourBoutons() {
        if (!userId) {
            // Utilisateur non connecté
            if (MOVIE_DOM.addToFavorites) {
                MOVIE_DOM.addToFavorites.disabled = true;
                MOVIE_DOM.addToFavorites.title = "Connectez-vous pour gérer vos favoris";
                MOVIE_DOM.addToFavorites.innerHTML = '<i class="ph ph-heart"></i> <span class="btn-text">Ajouter aux favoris</span>';
            }
            if (MOVIE_DOM.addToWatchlist) {
                MOVIE_DOM.addToWatchlist.disabled = true;
                MOVIE_DOM.addToWatchlist.title = "Connectez-vous pour gérer votre watchlist";
                MOVIE_DOM.addToWatchlist.innerHTML = '<i class="ph ph-clock"></i> <span class="btn-text">À regarder plus tard</span>';
            }
            if (MOVIE_DOM.markAsWatched) {
                MOVIE_DOM.markAsWatched.disabled = true;
                MOVIE_DOM.markAsWatched.title = "Connectez-vous pour marquer comme vu";
                MOVIE_DOM.markAsWatched.innerHTML = '<i class="ph ph-eye"></i> <span class="btn-text">Déjà vu</span>';
            }
            return;
        }

        try {
            // Vérifier l'état dans chaque liste
            const [estFavori, estDansWatchlist, estVu] = await Promise.all([
                verifierPresenceDansListe('favorites'),
                verifierPresenceDansListe('watchlist'),
                verifierPresenceDansListe('watched')
            ]);

            console.log("États des listes:", { estFavori, estDansWatchlist, estVu });

            // Mettre à jour le bouton favoris
            if (MOVIE_DOM.addToFavorites) {
                MOVIE_DOM.addToFavorites.disabled = false;
                MOVIE_DOM.addToFavorites.innerHTML = estFavori
                    ? '<i class="ph ph-heart-break"></i> <span class="btn-text">Retirer des favoris</span>'
                    : '<i class="ph ph-heart"></i> <span class="btn-text">Ajouter aux favoris</span>';
                MOVIE_DOM.addToFavorites.classList.toggle("btn-success", estFavori);
                MOVIE_DOM.addToFavorites.classList.toggle("btn-primary", !estFavori);
            }

            // Mettre à jour le bouton watchlist
            if (MOVIE_DOM.addToWatchlist) {
                MOVIE_DOM.addToWatchlist.disabled = false;
                MOVIE_DOM.addToWatchlist.innerHTML = estDansWatchlist
                    ? '<i class="ph ph-clock-counter-clockwise"></i> <span class="btn-text">Retirer de la liste</span>'
                    : '<i class="ph ph-clock"></i> <span class="btn-text">À regarder plus tard</span>';
                MOVIE_DOM.addToWatchlist.classList.toggle("btn-success", estDansWatchlist);
                MOVIE_DOM.addToWatchlist.classList.toggle("btn-warning", !estDansWatchlist);
            }

            // Mettre à jour le bouton déjà vu
            if (MOVIE_DOM.markAsWatched) {
                MOVIE_DOM.markAsWatched.disabled = false;
                MOVIE_DOM.markAsWatched.innerHTML = estVu
                    ? '<i class="ph ph-eye-closed"></i> <span class="btn-text">Marquer comme non vu</span>'
                    : '<i class="ph ph-eye"></i> <span class="btn-text">Déjà vu</span>';
                MOVIE_DOM.markAsWatched.classList.toggle("btn-success", estVu);
                MOVIE_DOM.markAsWatched.classList.toggle("btn-info", !estVu);
            }

        } catch (error) {
            console.error("Erreur lors de la mise à jour des boutons:", error);
            afficherNotification("Erreur lors du chargement des états des listes", "warning");
        }
    }

    // Attacher les fonctions modales au window object pour les rendre accessibles depuis les attributs onclick
    window.afficherImageModal = afficherImageModal;
    window.ouvrirVideoModal = ouvrirVideoModal;

    // ==================== Diagnostic d'authentification ====================
    window.debugAuth = function() {
        console.log("=== DIAGNOSTIC D'AUTHENTIFICATION ===");
        console.log("sessionStorage.auth:", sessionStorage.getItem("auth"));
        console.log("localStorage.lastAuth:", localStorage.getItem("lastAuth"));
        console.log("Variable auth globale:", window.auth);
        console.log("Variable userId globale:", window.userId);
        
        // Tenter de parser et afficher les détails
        const auth = sessionStorage.getItem("auth");
        if (auth) {
            try {
                const parsed = JSON.parse(auth);
                console.log("Auth parsée:", parsed);
                console.log("userId extrait:", parsed.userId || parsed.id);
            } catch(e) {
                console.error("Erreur parsing auth:", e);
            }
        }
    };
    
    // Appeler le diagnostic au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("Appel du diagnostic d'auth après DOMContentLoaded");
            setTimeout(() => window.debugAuth(), 100);
        });
    } else {
        setTimeout(() => window.debugAuth(), 100);
    }

    // Initialisation
    document.addEventListener("DOMContentLoaded", async () => {
        console.log("Initialisation de movie-details.js");

        // Actualiser MOVIE_DOM maintenant que le DOM est chargé
        MOVIE_DOM = getMOVIE_DOM();
        console.log("MOVIE_DOM étoiles:", MOVIE_DOM.stars.length);

        // Vérifier l'authentification et mettre à jour l'interface
        const isAuthenticated = verifierAuthentification();
        mettreAJourInterfaceAuthentification();
        
        console.log("Authentification vérifiée:", isAuthenticated, "UserId:", userId);
        
        if (!isAuthenticated) {
            afficherNotification("Veuillez vous connecter pour gérer vos listes", "warning");
        } else {
            console.log("Utilisateur authentifié avec userId:", userId);
        }

        // Récupérer l'ID du film
        filmId = obtenirIdFilm();
        if (!filmId) {
            afficherNotification("Aucun film spécifié", "danger");
            try {
                window.location.href = '../../index.html';
            } catch (error) {
                console.error("Erreur lors de la redirection:", error);
            }
            return;
        }

        await initialiserNotationLocale();

        console.log("Chargement du film ID:", filmId);

        try {
            // Charger les détails du film
            const film = await recupererDetailsFilm(filmId);
            if (!film) {
                console.error("Film null pour ID:", filmId);
                afficherNotification("Veuillez vérifier l'ID du film ou réessayer plus tard", "danger");
                setTimeout(() => {
                    try {
                        window.location.href = '../../index.html';
                    } catch (error) {
                        console.error("Erreur lors de la redirection:", error);
                    }
                }, 3000);
                return;
            }

            // Mettre à jour les éléments de la page avec les détails du film
            document.getElementById("movie-title").textContent = film.title;
            document.getElementById("movie-overview").textContent = film.overview;

            // Mettre à jour l'arrière-plan de la section hero
            if (film.backdrop_path) {
                const heroSection = document.getElementById("movie-hero-section");
                if (heroSection) {
                    heroSection.style.backgroundImage = `url('${MOVIE_DETAILS_CONFIG.URL_IMAGE_HD}${film.backdrop_path}')`;
                }
            }

            const moviePoster = document.getElementById("movie-poster");
            if (moviePoster) {
                moviePoster.src = film.poster_path ? MOVIE_DETAILS_CONFIG.URL_IMAGE + film.poster_path : MOVIE_DETAILS_CONFIG.AFFICHE_PAR_DEFAUT;
                moviePoster.alt = film.title;
            }

            // Mettre à jour les métadonnées
            const movieTags = document.getElementById("movie-tags");
            if (movieTags) {
                const releaseYear = film.release_date ? new Date(film.release_date).getFullYear() : '';
                const genres = film.genres ? film.genres.map(g => g.name).join(', ') : '';
                const runtime = film.runtime ? `${film.runtime} min` : '';

                movieTags.innerHTML = `
                    <span class="badge bg-primary me-2">${releaseYear}</span>
                    <span class="badge bg-secondary me-2">${genres}</span>
                    <span class="badge bg-info">${runtime}</span>
                `;
            }

            // Afficher les différentes sections
            afficherInformationsFinancieres(film);

            // Afficher les dates de sortie
            if (film.release_dates) {
                afficherDatesDeSortie(film.release_dates);
            }

            if (film.images) {
                afficherFondsEcran(film.images);
            }

            await afficherCollection(film);

            if (film.credits?.cast) {
                afficherActeurs(film.credits.cast);
            }

            // Afficher les sociétés de production
            if (film.production_companies) {
                afficherSocietesProduction(film.production_companies);
            }

            // Afficher la bande-annonce
            if (film.videos) {
                afficherBandeAnnonce(film.videos);
                // Afficher toutes les vidéos
                afficherToutesLesVideos(film.videos);
            }

            // Afficher les identifiants externes
            afficherIdentifiantsExternes(film);

            const { plateformes, distributeurs, titreFilm } = await recupererPlateformesEtDistributeurs(filmId);
            afficherPlateformesEtDistributeurs({ plateformes, distributeurs, titreFilm });

        } catch (error) {
            console.error("Erreur lors du chargement du film:", error);
            afficherNotification("Impossible de charger les détails du film", "danger");
            return;
        }

        // Mettre à jour les boutons
        await mettreAJourBoutons();

        // Configurer les écouteurs des boutons
        if (MOVIE_DOM.addToFavorites) {
            MOVIE_DOM.addToFavorites.addEventListener("click", async () => {
                const estFavori = await verifierPresenceDansListe('favorites');
                const succes = await gererToggleListe('favorites', estFavori);
                if (succes) {
                    await mettreAJourBoutons();
                }
            });
        }

        if (MOVIE_DOM.addToWatchlist) {
            MOVIE_DOM.addToWatchlist.addEventListener("click", async () => {
                const estDansWatchlist = await verifierPresenceDansListe('watchlist');
                const succes = await gererToggleListe('watchlist', estDansWatchlist);
                if (succes) {
                    await mettreAJourBoutons();
                }
            });
        }

        if (MOVIE_DOM.markAsWatched) {
            MOVIE_DOM.markAsWatched.addEventListener("click", async () => {
                const estVu = await verifierPresenceDansListe('watched');
                const succes = await gererToggleListe('watched', estVu);
                if (succes) {
                    await mettreAJourBoutons();
                }
            });
        }
    });
}
