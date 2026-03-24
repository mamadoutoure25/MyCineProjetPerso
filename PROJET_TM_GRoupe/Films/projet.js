/**
 * MyCiné - Gestion de l'interface et interactions avec l'API TMDB
 */

// Configuration de l'application
const CONFIG = {
    CLE_API: "04c35731a5ee918f014970082a0088b1",
    URL_BASE: "https://api.themoviedb.org/3",
    URL_IMAGE: "https://image.tmdb.org/t/p/w500",
    URL_IMAGE_ACTEUR: "https://image.tmdb.org/t/p/w185",
    URL_BACKDROP: "https://image.tmdb.org/t/p/w780",
    URL_ARRIERE_PLAN: "https://image.tmdb.org/t/p/original",
    IMAGE_SUBSTITUT: "https://via.placeholder.com/500x750?text=Image+indisponible",
    AFFICHE_PAR_DEFAUT: "https://via.placeholder.com/500x750?text=Aucune+affiche",
    ICÔNE_PLATEFORME_SUBSTITUT: "images/streaming-icon1.png",
    FILMS_PAR_CHARGEMENT: 100, // Nombre de films à afficher lors du filtrage
};

// Correspondance des icônes des plateformes
const ICÔNES_PLATEFORMES = {
    Netflix: "./images/netflix.png",
    "Amazon Prime Video": "./images/amazon_prime_video.png",
    "Amazon Video": "./images/amazon_video.png",
    "Disney Plus": "./images/disney_plus.png",
    "Apple TV Plus": "./images/apple_tv_plus.png",
    "Apple TV": "./images/apple_tv.png",
    "Canal+": "./images/canal_plus.png",
    OCS: "./images/ocs.png",
    "Google Play Movies": "./images/google_play_movies.png",
    YouTube: "./images/youtube.png",
    FilmoTV: "./images/filmotv.png",
    "Microsoft Store": "./images/microsoft_store.png",
    Skynet: "./images/skynet.png",
    "Proximus Pickx": "./images/proximus_pickx.png",
    "HBO Max": "./images/max.png",
    Max: "./images/max.png",
    "Rakuten TV": "./images/rakuten_tv.png",
    Telenet: "./images/telenet.png",
    LaCinetek: "./images/lacinetek.png",
};

// Éléments du DOM
const DOM = {
    // Navigation et recherche
    barreNavigation: document.querySelector(".navbar"),
    conteneurGenres: document.getElementById("genres-container"),
    conteneurAnnees: document.getElementById("years-container"),
    conteneurSocietes: document.getElementById("companies-container"),
    formulaireRecherche: document.getElementById("search-form"),
    champRecherche: document.getElementById("search-input"),
    resultatsRecherche: document.getElementById("search-results"),

    // Sections principales
    sectionHero: document.getElementById("hero-section"),
    sectionGenres: document.getElementById("genre-browser-section"),
    sectionFiltres: document.getElementById("genre-section"),
    conteneurFiltresActifs: document.getElementById("filter-tags"),

    // Carrousels et grilles de films
    carrouselTendances: document.getElementById("trending-carousel"),
    carrouselLectureEnCours: document.getElementById("now-playing-carousel"),
    filmsPopulaires: document.getElementById("popular-movies"),
    filmsMieuxNotes: document.getElementById("top-rated-movies"),
    filmsAVenir: document.getElementById("upcoming-movies"),
    genreCarousel: document.getElementById("genre-carousel"),

    // Section films filtrés
    sectionFilmsFiltres: document.getElementById("filtered-movies-section"),
    titreFilmsFiltres: document.getElementById("filtered-movies-title"),
    conteneurFilmsFiltres: document.getElementById("filtered-movies"),
    boutonEffacerFiltres: document.getElementById("clear-filters-btn"),

    // Liens "Voir tout"
    lienVoirLectureEnCours: document.getElementById("view-now-playing"),
    lienVoirTendances: document.getElementById("view-trending"),
    lienVoirPopulaires: document.getElementById("view-popular"),
    lienVoirMieuxNotes: document.getElementById("view-top-rated"),
    lienVoirAVenir: document.getElementById("view-upcoming"),

    // Authentification
    lienConnexion: document.getElementById("login-link"),
    lienDeconnexion: document.getElementById("logout-link"),
    lienProfil: document.getElementById("profile-link"),
    lienAdmin: document.getElementById("admin-link"),
    affichageNomUtilisateur: document.getElementById("username-display"),
    lienFavoris: document.getElementById("favorites-link"),

    // Thème
    boutonTheme: document.getElementById("theme-toggle"),
    iconeTheme: document.getElementById("theme-icon")
};

// État de l'application
const ETAT_APPLICATION = {
    genres: [],
    societes: [],
    pageActuelle: 1,
    totalPages: 1,
    filtreActuel: "",
    genreActuel: "",
    anneeActuelle: "",
    societeActuelle: "",
    enChargement: false,
    requetesActives: new Set(),
    authentification: null,
    filtresActifs: new Map(),
    filmsFiltres: [],
    observateurIntersection: null
};

// Initialisation de l'application
async function initialiserApplication() {
    try {
        console.log("Initialisation de MyCiné...");

        // Configuration initiale
        verifierAuthentification();
        mettreAJourInterfaceAuthentification();
        configurerGestionTheme();

        // Chargement des données
        await Promise.all([
            recupererGenres(),
            recupererSocietes(),
            afficherAnnees(),
            chargerDonneesAccueil()
        ]);

        // Configuration des événements
        configurerEcouteursEvenements();

        // Initialiser l'observateur d'intersection pour le défilement infini
        initialiserObservateurIntersection();

        console.log("Application initialisée avec succès");
    } catch (erreur) {
        console.error("Erreur lors de l'initialisation:", erreur);
        afficherNotification("Erreur lors du chargement de l'application", "danger");
    }
}

// Gestion de l'authentification
function verifierAuthentification() {
    const donneesAuth = sessionStorage.getItem("auth");
    if (donneesAuth) {
        ETAT_APPLICATION.authentification = JSON.parse(donneesAuth);
        return true;
    }
    return false;
}

function mettreAJourInterfaceAuthentification() {
    const estConnecte = verifierAuthentification();
    const roleUtilisateur = ETAT_APPLICATION.authentification?.role || "";

    // Gestion de l'affichage des liens
    if (DOM.lienConnexion) DOM.lienConnexion.classList.toggle("d-none", estConnecte);
    if (DOM.lienProfil) DOM.lienProfil.classList.toggle("d-none", !estConnecte);
    if (DOM.lienFavoris) DOM.lienFavoris.classList.toggle("d-none", !estConnecte);
    if (DOM.lienDeconnexion) DOM.lienDeconnexion.classList.toggle("d-none", !estConnecte);
    if (DOM.lienAdmin) DOM.lienAdmin.classList.toggle("d-none", !estConnecte || roleUtilisateur !== "admin");

    // Cible le vrai lien <a>, meme si l'id est pose sur <li>.
    const lienProfilAncre = DOM.lienProfil
        ? (DOM.lienProfil.tagName === "A" ? DOM.lienProfil : DOM.lienProfil.querySelector("a"))
        : null;

    if (lienProfilAncre) {
        lienProfilAncre.setAttribute("href", "PROJET_TM_GRoupe/Films/profilUser.html");
    }

    // Mise a jour du nom d'utilisateur sans casser l'ancre
    if (estConnecte && ETAT_APPLICATION.authentification?.pseudo && lienProfilAncre) {
        lienProfilAncre.innerHTML = `<i class="ph ph-user me-2"></i> ${ETAT_APPLICATION.authentification.pseudo}`;
    }
}

function gererDeconnexion() {
    sessionStorage.removeItem("auth");
    ETAT_APPLICATION.authentification = null;
    mettreAJourInterfaceAuthentification();
    afficherNotification("Déconnexion réussie", "success");
    window.location.href = "index.html";
}

// Gestion du thème
function configurerGestionTheme() {
    if (!DOM.boutonTheme) return;

    // Récupérer le thème sauvegardé ou utiliser le thème du système
    const themeSauvegarde = localStorage.getItem('theme');
    const themeSysteme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const themeActuel = themeSauvegarde || themeSysteme;

    // Appliquer le thème
    document.documentElement.setAttribute('data-theme', themeActuel);
    mettreAJourIconeTheme(themeActuel);

    // Événement du bouton de thème
    DOM.boutonTheme.addEventListener('click', basculerTheme);
}

function basculerTheme() {
    const themeActuel = document.documentElement.getAttribute('data-theme');
    const nouveauTheme = themeActuel === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', nouveauTheme);
    localStorage.setItem('theme', nouveauTheme);
    mettreAJourIconeTheme(nouveauTheme);
}

function mettreAJourIconeTheme(theme) {
    if (!DOM.iconeTheme) return;

    if (theme === 'dark') {
        DOM.iconeTheme.className = 'ph ph-sun';
    } else {
        DOM.iconeTheme.className = 'ph ph-moon';
    }
}

// Requêtes API
async function recupererDonnees(url, idRequete = "") {
    if (ETAT_APPLICATION.requetesActives.has(idRequete)) return null;
    ETAT_APPLICATION.requetesActives.add(idRequete);

    try {
        const reponse = await fetch(url);
        if (!reponse.ok) throw new Error(`Erreur HTTP: ${reponse.status}`);
        return await reponse.json();
    } catch (erreur) {
        console.error(`Erreur API pour ${idRequete}:`, erreur);
        throw erreur;
    } finally {
        ETAT_APPLICATION.requetesActives.delete(idRequete);
    }
}

// Gestion des genres
async function recupererGenres() {
    const url = `${CONFIG.URL_BASE}/genre/movie/list?api_key=${CONFIG.CLE_API}&language=fr-FR`;
    const donnees = await recupererDonnees(url, "recupererGenres");

    if (donnees?.genres) {
        ETAT_APPLICATION.genres = donnees.genres;
        afficherGenresDropdown();
        afficherCarrouselGenres();
    }
}

function afficherGenresDropdown() {
    if (!DOM.conteneurGenres) return;

    DOM.conteneurGenres.innerHTML = ETAT_APPLICATION.genres
        .map(genre => `
            <li><a class="dropdown-item genre-link" href="#" data-genre-id="${genre.id}">${genre.name}</a></li>
        `)
        .join('');
}

async function afficherCarrouselGenres() {
    if (!DOM.genreCarousel) return;

    try {
        const genresAvecImages = await Promise.all(
            ETAT_APPLICATION.genres.map(async genre => {
                const image = await getImageGenre(genre.id);
                return { ...genre, image };
            })
        );

        DOM.genreCarousel.innerHTML = genresAvecImages
            .map(genre => `
                <div class="genre-item me-3 rounded position-relative" 
                     data-genre-id="${genre.id}" 
                     style="min-width: 200px; height: 120px; cursor: pointer; background-image: url('${genre.image}'); background-size: cover; background-position: center;">
                    <div class="genre-overlay position-absolute top-0 start-0 w-100 h-100" 
                         style="background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.7)); border-radius: var(--border-radius);"></div>
                    <h5 class="genre-name position-absolute bottom-0 start-0 ms-3 mb-3 text-white fw-bold">${genre.name}</h5>
                </div>
            `)
            .join('');
    } catch (erreur) {
        console.error("Erreur lors du chargement des images de genres:", erreur);
        // Version de secours sans images
        DOM.genreCarousel.innerHTML = ETAT_APPLICATION.genres
            .map(genre => `
                <div class="genre-item me-3 bg-secondary rounded text-center d-flex align-items-center justify-content-center" 
                     data-genre-id="${genre.id}" 
                     style="min-width: 200px; height: 120px; cursor: pointer;">
                    <h5 class="text-white fw-bold">${genre.name}</h5>
                </div>
            `)
            .join('');
    }
}

async function getImageGenre(genreId) {
    const url = `${CONFIG.URL_BASE}/discover/movie?api_key=${CONFIG.CLE_API}&language=fr-FR&with_genres=${genreId}&sort_by=popularity.desc&page=1`;
    const data = await recupererDonnees(url, `imageGenre_${genreId}`);

    if (data?.results?.length > 0) {
        const film = data.results[0];
        return CONFIG.URL_BACKDROP + (film.backdrop_path || film.poster_path) || CONFIG.IMAGE_SUBSTITUT;
    }
    return CONFIG.IMAGE_SUBSTITUT;
}

// Gestion des sociétés de production
async function recupererSocietes() {
    // Liste des sociétés populaires
    const societesPopulaires = [
        {id: 174, name: 'Warner Bros Pictures'},
        {id: 923, name: 'Legendary Pictures'},
        {id: 12, name: 'New Line Cinema'},
        {id: 184898, name: 'Dc Studios'},
        {id: 9993, name: 'DC Entertainment'},
        {id: 2785, name: 'Warner Bros Animation'},
        // DISNEY
        {id: 2, name: 'Disney'},
        {id: 25, name: "20th Century Studios"},
        {id: 9383, name: 'Blue Sky Studios'},
        {id: 1, name: 'Lucasfilm Ltd.'},
        {id: 420, name: 'Marvel Studios'},
        {id: 7505, name: 'Marvel Entertainment'},
        // PARAMOUNT / SONY / UNIVERSAL / LIONSGATE
        {id: 4, name: 'Paramount'},
        {id: 5, name: 'Sony Pictures'},
        {id: 2251, name: 'Sony Pictures Animation'},
        {id: 11, name: 'Lionsgate'},
        {id: 14, name: 'Columbia Pictures'},
        {id: 33, name: 'Universal Pictures'},
        {id: 6704,name : 'Illumination'},
    ];

    ETAT_APPLICATION.societes = societesPopulaires;
    afficherSocietesDropdown();
}

function afficherSocietesDropdown() {
    if (!DOM.conteneurSocietes) return;

    DOM.conteneurSocietes.innerHTML = ETAT_APPLICATION.societes
        .map(societe => `
            <li><a class="dropdown-item societe-link" href="#" data-societe-id="${societe.id}" data-societe-name="${societe.name}">
                <span class="me-2">${societe.name}</span>
                <i class="ph ph-arrow-up-right ms-2" style="font-size: 0.8rem; opacity: 0.6;"></i>
            </a></li>
        `)
        .join('');

    // Ajouter les écouteurs d'événements
    document.querySelectorAll('.societe-link').forEach(link => {
        link.addEventListener('click', (e) => {
            // Vérifier si double-clic ou clic sur l'icône pour voir les détails
            if (e.ctrlKey || e.metaKey) {
                // Ctrl/Cmd + Clic = voir les détails
                e.preventDefault();
                const societeId = link.dataset.societeId;
                window.open(`PROJET_TM_GRoupe/Films/company-details.html?id=${societeId}`, '_blank');
            } else {
                // Simple clic = filtrer par société
                e.preventDefault();
                gererSelectionSociete(link.dataset.societeId);
            }
        });

        // Ajouter un tooltip
        link.title = 'Clic: Filtrer | Ctrl+Clic: Voir les détails';
    });
}

// Gestion des années
async function afficherAnnees() {
    if (!DOM.conteneurAnnees) return;

    const anneeActuelle = new Date().getFullYear();
    const annees = Array.from({ length: 50 }, (_, i) => anneeActuelle - i);

    DOM.conteneurAnnees.innerHTML = annees
        .map(annee => `
            <li><a class="dropdown-item annee-link" href="#" data-annee="${annee}">${annee}</a></li>
        `)
        .join('');
}

// Configuration des écouteurs d'événements
function configurerEcouteursEvenements() {
    // Recherche
    if (DOM.formulaireRecherche) {
        DOM.formulaireRecherche.addEventListener("submit", gererRecherche);
    }

    if (DOM.champRecherche) {
        DOM.champRecherche.addEventListener("input", gererRechercheTempsReel);
        DOM.champRecherche.addEventListener("focus", afficherResultatsRecherche);
    }

    // Clic en dehors de la recherche pour fermer les résultats
    document.addEventListener("click", (e) => {
        if (!DOM.formulaireRecherche?.contains(e.target)) {
            cacherResultatsRecherche();
        }
    });

    // Filtres
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("genre-link")) {
            e.preventDefault();
            gererSelectionGenre(e.target.dataset.genreId);
        }
        if (e.target.classList.contains("annee-link")) {
            e.preventDefault();
            gererSelectionAnnee(e.target.dataset.annee);
        }
        if (e.target.classList.contains("societe-link")) {
            e.preventDefault();
            gererSelectionSociete(e.target.dataset.societeId);
        }
        if (e.target.closest(".genre-item")) {
            e.preventDefault();
            const item = e.target.closest(".genre-item");
            gererSelectionGenre(item.dataset.genreId);
        }
    });

    // Liens "Voir tout"
    if (DOM.lienVoirLectureEnCours) {
        DOM.lienVoirLectureEnCours.addEventListener("click", (e) => {
            e.preventDefault();
            chargerFilmsFiltres("now_playing");
        });
    }
    if (DOM.lienVoirTendances) {
        DOM.lienVoirTendances.addEventListener("click", (e) => {
            e.preventDefault();
            chargerFilmsFiltres("trending");
        });
    }
    if (DOM.lienVoirPopulaires) {
        DOM.lienVoirPopulaires.addEventListener("click", (e) => {
            e.preventDefault();
            chargerFilmsFiltres("popular");
        });
    }
    if (DOM.lienVoirMieuxNotes) {
        DOM.lienVoirMieuxNotes.addEventListener("click", (e) => {
            e.preventDefault();
            chargerFilmsFiltres("top_rated");
        });
    }
    if (DOM.lienVoirAVenir) {
        DOM.lienVoirAVenir.addEventListener("click", (e) => {
            e.preventDefault();
            chargerFilmsFiltres("upcoming");
        });
    }

    // Bouton effacer les filtres
    if (DOM.boutonEffacerFiltres) {
        DOM.boutonEffacerFiltres.addEventListener("click", effacerTousLesFiltres);
    }
}

// Gestion de la recherche
async function gererRecherche(e) {
    if (e) e.preventDefault();

    const requete = DOM.champRecherche.value.trim();
    if (!requete) return;

    try {
        const donnees = await rechercherFilms(requete);
        if (donnees?.results?.length) {
            afficherResultatsRecherche(donnees.results);
        } else {
            afficherAucunResultatRecherche();
        }
    } catch (erreur) {
        console.error("Erreur lors de la recherche:", erreur);
        afficherNotification("Erreur lors de la recherche", "danger");
    }
}

async function gererRechercheTempsReel(e) {
    const requete = e.target.value.trim();

    if (requete.length < 2) {
        cacherResultatsRecherche();
        return;
    }

    try {
        const donnees = await rechercherFilms(requete);
        if (donnees?.results?.length) {
            afficherResultatsRecherche(donnees.results);
        } else {
            afficherAucunResultatRecherche();
        }
    } catch (erreur) {
        console.error("Erreur lors de la recherche en temps réel:", erreur);
    }
}

async function rechercherFilms(requete) {
    const url = `${CONFIG.URL_BASE}/search/movie?api_key=${CONFIG.CLE_API}&language=fr-FR&query=${encodeURIComponent(requete)}&page=1`;
    return await recupererDonnees(url, "rechercheFilms");
}

function afficherResultatsRecherche(films) {
    if (!DOM.resultatsRecherche) return;

    DOM.resultatsRecherche.style.display = "block";
    DOM.resultatsRecherche.innerHTML = films
        .slice(0, 8)
        .map(film => `
            <div class="search-result-item d-flex align-items-center p-2" data-id="${film.id}" style="cursor: pointer; border-bottom: 1px solid var(--border);">
                <img src="${film.poster_path ? CONFIG.URL_IMAGE + film.poster_path : CONFIG.AFFICHE_PAR_DEFAUT}" 
                     alt="${film.title}" 
                     style="width: 50px; height: 75px; object-fit: cover; border-radius: 4px;"
                     onerror="this.src='${CONFIG.AFFICHE_PAR_DEFAUT}'">
                <div class="ms-3">
                    <h6 class="mb-0 text-dark">${film.title}</h6>
                    <small class="text-muted">${film.release_date ? film.release_date.split("-")[0] : "Date inconnue"}</small>
                </div>
            </div>
        `)
        .join("");

    // Ajouter les écouteurs d'événements
    DOM.resultatsRecherche.querySelectorAll(".search-result-item").forEach(item => {
        item.addEventListener("click", () => {
            const idFilm = item.dataset.id;
            afficherDetailsFilm(idFilm);
        });
    });
}

function afficherAucunResultatRecherche() {
    if (!DOM.resultatsRecherche) return;

    DOM.resultatsRecherche.style.display = "block";
    DOM.resultatsRecherche.innerHTML = '<p class="text-muted p-3 text-center">Aucun résultat trouvé</p>';
}

function cacherResultatsRecherche() {
    if (DOM.resultatsRecherche) {
        DOM.resultatsRecherche.style.display = "none";
    }
}

// Affichage des films
function afficherFilms(conteneur, films, avecNumeros = false) {
    if (!conteneur) return;

    conteneur.innerHTML = films
        .map((film, index) => `
            <div class="movie-card position-relative rounded overflow-hidden" data-id="${film.id}">
                ${avecNumeros ? `<div class="trend-number">${index + 1}</div>` : ''}
                <div class="movie-card-inner position-relative" style="height: 300px; cursor: pointer;">
                    <img src="${film.poster_path ? CONFIG.URL_IMAGE + film.poster_path : CONFIG.AFFICHE_PAR_DEFAUT}" 
                         alt="${film.title}" 
                         class="movie-card-img img-fluid w-100 h-100 object-fit-cover"
                         onerror="this.src='${CONFIG.AFFICHE_PAR_DEFAUT}'">
                    
                    <!-- Note au survol -->
                    <div class="movie-rating position-absolute top-0 end-0 m-2 bg-dark bg-opacity-75 text-white rounded-pill px-2 py-1 d-flex align-items-center"
                         style="opacity: 0; transform: translateY(10px); transition: all 0.3s ease;">
                        <i class="ph ph-star-fill text-warning me-1 small"></i>
                        <small class="fw-bold">${film.vote_average ? film.vote_average.toFixed(1) + '/10' : 'N/A'}</small>
                    </div>
                    
                    <div class="movie-card-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end p-3">
                        <div class="text-white w-100">
                            <h6 class="mb-1 fw-bold movie-title">${film.title}</h6>
                            <small class="d-flex align-items-center justify-content-between w-100">
                                <span class="d-flex align-items-center">
                                    <i class="ph ph-star-fill text-warning me-1"></i>
                                    ${film.vote_average ? film.vote_average.toFixed(1) + '/10' : 'N/A'}
                                </span>
                                ${film.release_date ? `<span>${film.release_date.split("-")[0]}</span>` : ''}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `)
        .join('');

    configurerEcouteursCartesFilms();
}

function configurerEcouteursCartesFilms() {
    document.querySelectorAll(".movie-card").forEach(carte => {
        // Clic pour voir les détails
        carte.addEventListener("click", () => {
            const idFilm = carte.dataset.id;
            afficherDetailsFilm(idFilm);
        });

        // Animation de la note au survol
        carte.addEventListener("mouseenter", () => {
            const note = carte.querySelector('.movie-rating');
            if (note) {
                note.style.opacity = '1';
                note.style.transform = 'translateY(0)';
            }
        });

        carte.addEventListener("mouseleave", () => {
            const note = carte.querySelector('.movie-rating');
            if (note) {
                note.style.opacity = '0';
                note.style.transform = 'translateY(10px)';
            }
        });
    });
}

// Chargement des données d'accueil
async function chargerDonneesAccueil() {
    try {
        // Films en lecture actuellement
        const urlLectureEnCours = `${CONFIG.URL_BASE}/movie/now_playing?api_key=${CONFIG.CLE_API}&language=fr-FR&region=FR`;
        const donneesLectureEnCours = await recupererDonnees(urlLectureEnCours, "now_playing");
        if (donneesLectureEnCours?.results) {
            afficherFilms(DOM.carrouselLectureEnCours, donneesLectureEnCours.results.slice(0, 150));
        }

        // Films tendances
        const urlTendances = `${CONFIG.URL_BASE}/trending/movie/day?api_key=${CONFIG.CLE_API}&language=fr-FR`;
        const donneesTendances = await recupererDonnees(urlTendances, "tendances");
        if (donneesTendances?.results) {
            afficherFilms(DOM.carrouselTendances, donneesTendances.results.slice(0, 150), true);
        }

        // Films populaires
        const urlPopulaires = `${CONFIG.URL_BASE}/movie/popular?api_key=${CONFIG.CLE_API}&language=fr-FR`;
        const donneesPopulaires = await recupererDonnees(urlPopulaires, "populaires");
        if (donneesPopulaires?.results) {
            afficherFilms(DOM.filmsPopulaires, donneesPopulaires.results.slice(0, 150));
        }

        // Films mieux notés
        const urlMieuxNotes = `${CONFIG.URL_BASE}/movie/top_rated?api_key=${CONFIG.CLE_API}&language=fr-FR`;
        const donneesMieuxNotes = await recupererDonnees(urlMieuxNotes, "mieux_notes");
        if (donneesMieuxNotes?.results) {
            afficherFilms(DOM.filmsMieuxNotes, donneesMieuxNotes.results.slice(0, 150));
        }

        // Films à venir
        const urlAVenir = `${CONFIG.URL_BASE}/movie/upcoming?api_key=${CONFIG.CLE_API}&language=fr-FR`;
        const donneesAVenir = await recupererDonnees(urlAVenir, "a_venir");
        if (donneesAVenir?.results) {
            afficherFilms(DOM.filmsAVenir, donneesAVenir.results.slice(0, 150));
        }

    } catch (erreur) {
        console.error("Erreur lors du chargement des données d'accueil:", erreur);
        afficherNotification("Erreur lors du chargement des films", "danger");
    }
}

// Gestion des filtres
async function gererSelectionGenre(idGenre) {
    const genre = ETAT_APPLICATION.genres.find(g => g.id == idGenre);
    if (genre) {
        ETAT_APPLICATION.filtresActifs.set('genre', {
            type: 'genre',
            id: idGenre,
            nom: genre.name
        });
    }
    ETAT_APPLICATION.genreActuel = idGenre;
    ETAT_APPLICATION.filtreActuel = "discover";
    ETAT_APPLICATION.pageActuelle = 1;

    afficherFiltresActifs();
    await chargerFilmsFiltres("discover");
}

async function gererSelectionAnnee(annee) {
    ETAT_APPLICATION.filtresActifs.set('annee', {
        type: 'annee',
        id: annee,
        nom: annee
    });
    ETAT_APPLICATION.anneeActuelle = annee;
    ETAT_APPLICATION.filtreActuel = "discover";
    ETAT_APPLICATION.pageActuelle = 1;

    afficherFiltresActifs();
    await chargerFilmsFiltres("discover");
}

async function gererSelectionSociete(idSociete) {
    const societe = ETAT_APPLICATION.societes.find(s => s.id == idSociete);
    if (societe) {
        ETAT_APPLICATION.filtresActifs.set('societe', {
            type: 'societe',
            id: idSociete,
            nom: societe.name
        });
    }
    ETAT_APPLICATION.societeActuelle = idSociete;
    ETAT_APPLICATION.filtreActuel = "discover";
    ETAT_APPLICATION.pageActuelle = 1;

    afficherFiltresActifs();
    await chargerFilmsFiltres("discover");
}

// Affichage des filtres actifs
function afficherFiltresActifs() {
    if (!DOM.conteneurFiltresActifs) return;

    // Afficher la section des filtres si elle est cachée
    if (DOM.sectionFiltres) {
        DOM.sectionFiltres.style.display = ETAT_APPLICATION.filtresActifs.size > 0 ? 'block' : 'none';
    }

    DOM.conteneurFiltresActifs.innerHTML = '';

    // Afficher chaque filtre actif
    ETAT_APPLICATION.filtresActifs.forEach((filtre, cle) => {
        const badgeFiltre = document.createElement('span');
        badgeFiltre.className = 'filter-tag bg-primary text-white px-3 py-2 rounded-pill d-flex align-items-center me-2 mb-2';
        badgeFiltre.innerHTML = `
            ${getLabelTypeFiltre(filtre.type)}: ${filtre.nom}
            <span class="remove-filter ms-2 cursor-pointer" data-type="${filtre.type}" style="cursor: pointer;">×</span>
        `;

        DOM.conteneurFiltresActifs.appendChild(badgeFiltre);
    });

    // Ajouter les écouteurs d'événements pour supprimer les filtres
    DOM.conteneurFiltresActifs.querySelectorAll(".remove-filter").forEach(bouton => {
        bouton.addEventListener("click", (e) => {
            e.stopPropagation();
            const typeFiltre = bouton.dataset.type;
            supprimerFiltre(typeFiltre);
        });
    });
}

function getLabelTypeFiltre(type) {
    const labels = {
        'genre': 'Genre',
        'annee': 'Année',
        'societe': 'Société',
        'categorie': 'Catégorie'
    };
    return labels[type] || type;
}

function supprimerFiltre(typeFiltre) {
    ETAT_APPLICATION.filtresActifs.delete(typeFiltre);

    // Mettre à jour l'état de l'application
    switch (typeFiltre) {
        case 'genre':
            ETAT_APPLICATION.genreActuel = "";
            break;
        case 'annee':
            ETAT_APPLICATION.anneeActuelle = "";
            break;
        case 'societe':
            ETAT_APPLICATION.societeActuelle = "";
            break;
        case 'categorie':
            ETAT_APPLICATION.filtreActuel = "";
            break;
    }

    // Recharger les films si d'autres filtres sont actifs
    if (ETAT_APPLICATION.filtresActifs.size > 0) {
        ETAT_APPLICATION.pageActuelle = 1;
        chargerFilmsFiltres("discover");
    } else {
        // Masquer la section des filtres et des films filtrés si aucun filtre n'est actif
        if (DOM.sectionFiltres) {
            DOM.sectionFiltres.style.display = 'none';
        }
        if (DOM.sectionFilmsFiltres) {
            DOM.sectionFilmsFiltres.style.display = 'none';
        }
        // Recharger les données d'accueil
        chargerDonneesAccueil();
    }

    afficherFiltresActifs();
}

function effacerTousLesFiltres() {
    ETAT_APPLICATION.filtresActifs.clear();
    ETAT_APPLICATION.genreActuel = "";
    ETAT_APPLICATION.anneeActuelle = "";
    ETAT_APPLICATION.societeActuelle = "";
    ETAT_APPLICATION.filtreActuel = "";
    ETAT_APPLICATION.pageActuelle = 1;

    // Masquer les sections
    if (DOM.sectionFiltres) {
        DOM.sectionFiltres.style.display = 'none';
    }
    if (DOM.sectionFilmsFiltres) {
        DOM.sectionFilmsFiltres.style.display = 'none';
    }

    // Recharger les données d'accueil
    chargerDonneesAccueil();
    afficherFiltresActifs();
}

// Chargement des films filtrés
async function chargerFilmsFiltres(type) {
    try {
        ETAT_APPLICATION.enChargement = true;

        let url;
        let titre = "Films filtrés";
        let filmsAccumules = [];
        let totalPagesFromAPI = 1;

        if (type === "discover") {
            // Filtres combinés - charger 3 pages pour obtenir ~50 films
            const urlBase = `${CONFIG.URL_BASE}/discover/movie?api_key=${CONFIG.CLE_API}&language=fr-FR&sort_by=popularity.desc`;

            if (ETAT_APPLICATION.genreActuel) {
                url = urlBase + `&with_genres=${ETAT_APPLICATION.genreActuel}`;
                titre = `Films ${ETAT_APPLICATION.genres.find(g => g.id == ETAT_APPLICATION.genreActuel)?.name || ''}`;
            } else {
                url = urlBase;
            }
            if (ETAT_APPLICATION.anneeActuelle) {
                url += `&primary_release_year=${ETAT_APPLICATION.anneeActuelle}`;
                titre += titre === "Films filtrés" ? `Films ${ETAT_APPLICATION.anneeActuelle}` : ` ${ETAT_APPLICATION.anneeActuelle}`;
            }
            if (ETAT_APPLICATION.societeActuelle) {
                url += `&with_companies=${ETAT_APPLICATION.societeActuelle}`;
            }

            // Charger 3 pages pour avoir ~50-60 films à afficher
            const pagesToLoad = Math.ceil(CONFIG.FILMS_PAR_CHARGEMENT / 20);
            for (let page = 1; page <= pagesToLoad; page++) {
                const urlPage = url + `&page=${page}`;
                const donnees = await recupererDonnees(urlPage, `films_${type}_page_${page}`);
                if (donnees?.results) {
                    filmsAccumules = [...filmsAccumules, ...donnees.results];
                    if (page === 1) totalPagesFromAPI = donnees.total_pages;
                }
            }
        } else {
            // Filtres prédéfinis
            const labelsFiltres = {
                'trending': { nom: 'Tendances', urlBase: `${CONFIG.URL_BASE}/trending/movie/day?api_key=${CONFIG.CLE_API}&language=fr-FR` },
                'now_playing': { nom: 'Lecture en cours', urlBase: `${CONFIG.URL_BASE}/movie/now_playing?api_key=${CONFIG.CLE_API}&language=fr-FR&region=FR` },
                'popular': { nom: 'Populaires', urlBase: `${CONFIG.URL_BASE}/movie/popular?api_key=${CONFIG.CLE_API}&language=fr-FR` },
                'top_rated': { nom: 'Mieux notés', urlBase: `${CONFIG.URL_BASE}/movie/top_rated?api_key=${CONFIG.CLE_API}&language=fr-FR` },
                'upcoming': { nom: 'À venir', urlBase: `${CONFIG.URL_BASE}/movie/upcoming?api_key=${CONFIG.CLE_API}&language=fr-FR` }
            };

            if (labelsFiltres[type]) {
                titre = `Films ${labelsFiltres[type].nom.toLowerCase()}`;

                // Ajouter le filtre aux filtres actifs
                ETAT_APPLICATION.filtresActifs.set('categorie', {
                    type: 'categorie',
                    id: type,
                    nom: labelsFiltres[type].nom
                });

                // Charger 3 pages pour avoir ~50-60 films à afficher
                const pagesToLoad = Math.ceil(CONFIG.FILMS_PAR_CHARGEMENT / 20);
                for (let page = 1; page <= pagesToLoad; page++) {
                    const urlPage = labelsFiltres[type].urlBase + `&page=${page}`;
                    const donnees = await recupererDonnees(urlPage, `films_${type}_page_${page}`);
                    if (donnees?.results) {
                        filmsAccumules = [...filmsAccumules, ...donnees.results];
                        if (page === 1) totalPagesFromAPI = donnees.total_pages;
                    }
                }
            }
        }

        if (filmsAccumules?.length) {
            // Afficher la section des films filtrés
            if (DOM.sectionFilmsFiltres) {
                DOM.sectionFilmsFiltres.style.display = 'block';

                // Mettre à jour le titre
                if (DOM.titreFilmsFiltres) {
                    DOM.titreFilmsFiltres.textContent = titre;
                }

                // Mettre à jour totalPages depuis l'API
                ETAT_APPLICATION.totalPages = totalPagesFromAPI;

                // Afficher les films (limiter à 50)
                ETAT_APPLICATION.filmsFiltres = filmsAccumules.slice(0, CONFIG.FILMS_PAR_CHARGEMENT);
                afficherFilms(DOM.conteneurFilmsFiltres, ETAT_APPLICATION.filmsFiltres);

                // Faire défiler jusqu'à la section
                DOM.sectionFilmsFiltres.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            afficherFiltresActifs();
        } else {
            if (DOM.sectionFilmsFiltres) {
                DOM.sectionFilmsFiltres.style.display = 'block';
                DOM.conteneurFilmsFiltres.innerHTML = '<p class="text-muted text-center">Aucun film trouvé pour ces critères.</p>';
            }
            afficherNotification("Aucun film trouvé pour ces critères", "warning");
        }
    } catch (erreur) {
        console.error("Erreur lors du chargement des films filtrés:", erreur);
        afficherNotification("Erreur lors du filtrage des films", "danger");
    } finally {
        ETAT_APPLICATION.enChargement = false;
    }
}

// Défilement infini automatique (désactivé - charge 50 films d'un coup)
function initialiserObservateurIntersection() {
    const options = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    };

    ETAT_APPLICATION.observateurIntersection = new IntersectionObserver((entries) => {
        // Système de défilement infini désactivé
        // Les 50 films sont chargés d'un coup au lieu de charger page par page
    }, options);

    // Observer le dernier élément de la grille de films filtrés
    observerDernierElement();
}

function observerDernierElement() {
    if (ETAT_APPLICATION.observateurIntersection && DOM.conteneurFilmsFiltres) {
        const derniersElements = DOM.conteneurFilmsFiltres.querySelectorAll('.movie-card');
        if (derniersElements.length > 0) {
            const dernierElement = derniersElements[derniersElements.length - 1];
            ETAT_APPLICATION.observateurIntersection.observe(dernierElement);
        }
    }
}

// Navigation
function afficherDetailsFilm(idFilm) {
    // Vérifier si on est dans le dossier Films ou à la racine
    const estDansDossierFilms = window.location.pathname.includes('/Films/');
    if (estDansDossierFilms) {
        window.location.href = `movie-details.html?id=${idFilm}`;
    } else {
        window.location.href = `PROJET_TM_GRoupe/Films/movie-details.html?id=${idFilm}`;
    }
}

// Utilitaires
function afficherNotification(message, type) {
    // Création d'un toast Bootstrap
    const toastElement = document.createElement("div");
    toastElement.className = `toast align-items-center text-bg-${type} border-0`;
    toastElement.setAttribute("role", "alert");
    toastElement.setAttribute("aria-live", "assertive");
    toastElement.setAttribute("aria-atomic", "true");
    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    const conteneurToast = document.querySelector(".toast-container");
    if (conteneurToast) {
        conteneurToast.appendChild(toastElement);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Supprimer l'élément après l'animation
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Initialisation au chargement du DOM
document.addEventListener("DOMContentLoaded", initialiserApplication);

// Export des fonctions globales
window.gererDeconnexion = gererDeconnexion;
window.afficherDetailsFilm = afficherDetailsFilm;