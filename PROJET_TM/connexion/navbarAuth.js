/**
 * MyCiné - Gestion de l'interface et interactions avec l'API TMDB
 */

// Configuration de l'application
const CONFIG = {
    CLE_API: '04c35731a5ee918f014970082a0088b1',
    URL_BASE: 'https://api.themoviedb.org/3',
    URL_IMAGE: 'https://image.tmdb.org/t/p/w500',
    URL_ARRIERE_PLAN: 'https://image.tmdb.org/t/p/original',
    IMAGE_SUBstitut: 'https://via.placeholder.com/500x750?text=Image+indisponible',
    AFFICHE_PAR_DEFAUT: 'https://via.placeholder.com/500x750?text=Aucune+affiche',
    ICONE_PLATEFORME_SUBstitut: 'images/streaming-icon1.png',
    FILMS_PAR_CHARGEMENT: 50 // Nombre de films à afficher lors du filtrage
};

// Correspondance des icônes des plateformes
const ICÔNES_PLATEFORMES = {
    'Netflix': './images/netflix.png',
    'Amazon Prime Video': './images/amazon_prime_video.png',
    'Amazon Video': './images/amazon_video.png',
    'Disney Plus': './images/disney_plus.png',
    'Apple TV Plus': './images/apple_tv_plus.png',
    'Apple TV': './images/apple_tv.png',
    'Canal+': './images/canal_plus.png',
    'OCS': './images/ocs.png',
    'Google Play Movies': './images/google_play_movies.png',
    'YouTube': './images/youtube.png',
    'FilmoTV': './images/filmotv.png',
    'Microsoft Store': './images/microsoft_store.png',
    'Skynet': './images/skynet.png',
    'Proximus Pickx': './images/proximus_pickx.png',
    'HBO Max': './images/max.png',
    'Max': './images/max.png',
    'Rakuten TV': './images/rakuten_tv.png',
    'Telenet': './images/telenet.png',
    'LaCinetek': './images/lacinetek.png'
};

// Éléments du DOM
const DOM = {
    barreNavigation: document.querySelector('.navbar'),
    conteneurGenres: document.getElementById('genres-container'),
    conteneurAnnees: document.getElementById('years-container'),
    conteneurSocietes: document.getElementById('companies-container'),
    formulaireRecherche: document.getElementById('search-form'),
    champRecherche: document.getElementById('search-input'),
    resultatsRecherche: document.getElementById('search-results'),
    sectionHero: document.getElementById('hero-section'),
    carrouselTendances: document.getElementById('trending-carousel'),
    filmsPopulaires: document.getElementById('popular-movies'),
    filmsMieuxNotes: document.getElementById('top-rated-movies'),
    filmsAVenir: document.getElementById('upcoming-movies'),
    sectionGenre: document.getElementById('genre-section'),
    sectionHeroFilm: document.getElementById('movie-hero-section'),
    titreFilm: document.getElementById('movie-title'),
    etiquettesFilm: document.getElementById('movie-tags'),
    resumeFilm: document.getElementById('movie-overview'),
    afficheFilm: document.getElementById('movie-poster'),
    distributionFilm: document.getElementById('movie-cast'),
    plateformesFilm: document.getElementById('movie-providers'),
    aucunePlateforme: document.getElementById('noProviders'),
    productionFilm: document.getElementById('movie-production'),
    bandeAnnonceFilm: document.getElementById('movie-trailer'),
    ajouterAuxFavoris: document.getElementById('add-to-favorites'),
    ajouterALaWatchlist: document.getElementById('add-to-watchlist'),
    marquerCommeVu: document.getElementById('mark-as-watched'),
    voirBandeAnnonce: document.getElementById('watch-trailer'),
    lienConnexion: document.getElementById('login-link'),
    lienDeconnexion: document.getElementById('logout-link'),
    lienFavoris: document.getElementById('favorites-link'),
    lienProfil: document.getElementById('profile-link'),
    lienAdmin: document.getElementById('admin-link'),
    affichageNomUtilisateur: document.getElementById('username-display')
};

// État de l'application
const ETAT_APPLICATION = {
    genres: [],
    companies: [],
    pageActuelle: 1,
    totalPages: 1,
    filtreActuel: '',
    genreActuel: '',
    anneeActuelle: '',
    companyActuelle: '',
    enChargement: false,
    idFilmActuel: null,
    estFavori: false,
    estDansWatchlist: false,
    estVu: false,
    favoris: new Set(),
    authentification: null,
    requetesActives: new Set()
};

/**
 * Initialisation de l'application
 */
async function initialiserApplication() {
    try {
        console.log('Initialisation de l\'application, chemin:', window.location.pathname);
        verifierAuthentification();
        mettreAJourInterfaceAuthentification();
        if (window.location.pathname.includes('PROJET_TM/Films/movie-details.html')) {
            const parametresUrl = new URLSearchParams(window.location.search);
            const idFilm = parametresUrl.get('id');
            console.log('ID du film depuis l\'URL:', idFilm);
            if (idFilm) {
                await chargerDetailsFilm(idFilm);
            } else {
                afficherNotification('Aucun film sélectionné', 'danger');
                window.location.href = '../../index.html';
            }
        } else {
            await Promise.all([
                recupererGenres(),
                recupererSocietes(),
                afficherAnnees(),
                chargerDonneesAccueil()
            ]);
            configurerEcouteursEvenements();
            configurerObservateurIntersection();
        }
    } catch (erreur) {
        console.error('Erreur lors de l\'initialisation:', erreur);
        afficherErreurUtilisateur();
    }
}

document.addEventListener('DOMContentLoaded', initialiserApplication);

/**
 * Gestion de l'authentification
 */
function verifierAuthentification() {
    const donneesAuth = sessionStorage.getItem('auth');
    if (donneesAuth) {
        ETAT_APPLICATION.authentification = JSON.parse(donneesAuth);
        return true;
    }
    return false;
}

function mettreAJourInterfaceAuthentification() {
    const estConnecte = verifierAuthentification();
    const roleUtilisateur = ETAT_APPLICATION.authentification?.role || '';

    if (DOM.lienConnexion) DOM.lienConnexion.classList.toggle('d-none', estConnecte);
    if (DOM.lienProfil) DOM.lienProfil.classList.toggle('d-none', !estConnecte);
    if (DOM.lienFavoris) DOM.lienFavoris.classList.toggle('d-none', !estConnecte);
    if (document.getElementById('divider')) document.getElementById('divider').classList.toggle('d-none', !estConnecte);
    if (DOM.lienDeconnexion) DOM.lienDeconnexion.classList.toggle('d-none', !estConnecte);
    if (DOM.lienAdmin) DOM.lienAdmin.classList.toggle('d-none', !estConnecte || roleUtilisateur !== 'admin');
    if (DOM.affichageNomUtilisateur) DOM.affichageNomUtilisateur.classList.toggle('d-none', !estConnecte);

    if (estConnecte && ETAT_APPLICATION.authentification?.pseudo) {
        if (DOM.lienProfil) {
            DOM.lienProfil.innerHTML = `<i class="ph ph-user me-2"></i> ${ETAT_APPLICATION.authentification.pseudo}`;
        }
        if (DOM.affichageNomUtilisateur) {
            DOM.affichageNomUtilisateur.textContent = ETAT_APPLICATION.authentification.pseudo;
        }
    } else {
        if (DOM.affichageNomUtilisateur) {
            DOM.affichageNomUtilisateur.textContent = '';
        }
    }
}

async function gererDeconnexion() {
    try {
        // Appeler le script PHP de déconnexion
        const response = await fetch('../connexion/logout.php', {
            method: 'POST',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
            sessionStorage.removeItem('auth');
            ETAT_APPLICATION.authentification = null;
            ETAT_APPLICATION.favoris.clear();
            mettreAJourInterfaceAuthentification();
            afficherNotification('Déconnexion réussie', 'success');
            window.location.href = '../../index.html';
        } else {
            throw new Error(data.message || 'Erreur lors de la déconnexion');
        }
    } catch (erreur) {
        console.error('Erreur lors de la déconnexion:', erreur);
        afficherNotification('Erreur lors de la déconnexion, redirection en cours...', 'warning');
        window.location.href = '../../index.html';
    }
}

/**
 * Requêtes vers l'API TMDB
 */
async function recupererDonnees(url, idRequete = '') {
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

async function recupererGenres() {
    const url = `${CONFIG.URL_BASE}/genre/movie/list?api_key=${CONFIG.CLE_API}&language=fr-FR`;
    const donnees = await recupererDonnees(url, 'recupererGenres');
    if (donnees) {
        ETAT_APPLICATION.genres = donnees.genres;
        afficherGenres();
    }
}

async function recupererSocietes() {
    const societesPopulaires = [
        { id: 174, name: "Warner Bros." },
        { id: 12, name: "New Line Cinema" },
        { id: 429, name: "DC Films" },
        { id: 9993, name: "DC Comics" },
        { id: 923, name: "Legendary Pictures" },
        { id: 2, name: "Walt Disney Studio" },
        { id: 3, name: "Walt Disney Pixar" },
        { id: 7505, name: "Marvel" },
        { id: 420, name: "Marvel Studios" },
        { id: 25, name: "20th Century Studios" },
        { id: 4, name: "Paramount Pictures" },
        { id: 33, name: "Universal Pictures" },
        { id: 5, name: "Columbia Pictures" },
        { id: 1632, name: "Lionsgate" },
        { id: 7, name: "DreamWorks Pictures" },
        { id: 1, name: "Lucasfilm Ltd." },
        { id: 34, name: "Sony Pictures" },
        { id: 21, name: "MGM" },
        { id: 278, name: "Focus Features" },
        { id: 8265, name: "A24" },
        { id: 11084, name: "Neon" },
        { id: 3607, name: "Magnolia Pictures" }
    ];
    ETAT_APPLICATION.companies = societesPopulaires;
    afficherSocietes();
}

async function recupererFilms(type, page = 1) {
    const url = `${CONFIG.URL_BASE}/movie/${type}?api_key=${CONFIG.CLE_API}&language=fr-FR&page=${page}`;
    console.log(`Requête API pour ${type}: ${url}`);
    return await recupererDonnees(url, `recupererFilms-${type}-${page}`);
}

async function recupererTendances(page = 1) {
    const url = `${CONFIG.URL_BASE}/trending/movie/week?api_key=${CONFIG.CLE_API}&language=fr-FR&page=${page}`;
    console.log(`Requête API pour tendances: ${url}`);
    return await recupererDonnees(url, `recupererTendances-${page}`);
}

async function recupererFilmsAVenir(page = 1) {
    const url = `${CONFIG.URL_BASE}/movie/upcoming?api_key=${CONFIG.CLE_API}&language=fr-FR&page=${page}`;
    console.log(`Requête API pour à venir: ${url}`);
    const donnees = await recupererDonnees(url, `recupererFilmsAVenir-${page}`);
    const dateActuelle = new Date();
    const filmsFuturs = donnees?.results?.filter(film => {
        const dateSortie = new Date(film.release_date);
        return dateSortie > dateActuelle;
    }) || [];
    return { ...donnees, results: filmsFuturs };
}

async function recupererFilmsFiltresCombines(idGenre, annee, idSociete, page = 1) {
    let url = `${CONFIG.URL_BASE}/discover/movie?api_key=${CONFIG.CLE_API}&language=fr-FR&page=${page}`;
    if (idGenre) url += `&with_genres=${idGenre}`;
    if (annee) {
        if (annee.includes('-')) {
            const [anneeDebut, anneeFin] = annee.split('-');
            url += `&primary_release_date.gte=${anneeDebut}-01-01&primary_release_date.lte=${anneeFin}-12-31`;
        } else {
            url += `&primary_release_year=${annee}`;
        }
    }
    if (idSociete) url += `&with_companies=${idSociete}`;
    return await recupererDonnees(url, `recupererFilmsFiltresCombines-${idGenre || 'no-genre'}-${annee || 'no-year'}-${idSociete || 'no-company'}-${page}`);
}

async function recupererDetailsFilm(id) {
    const url = `${CONFIG.URL_BASE}/movie/${id}?api_key=${CONFIG.CLE_API}&language=fr-FR&append_to_response=videos,credits,release_dates,watch/providers`;
    return await recupererDonnees(url, `recupererDetailsFilm-${id}`);
}

async function rechercherFilms(requete, page = 1) {
    const url = `${CONFIG.URL_BASE}/search/movie?api_key=${CONFIG.CLE_API}&language=fr-FR&query=${encodeURIComponent(requete)}&page=${page}`;
    return await recupererDonnees(url, `rechercherFilms-${requete}-${page}`);
}

/**
 * Gestion des favoris, watchlist et films vus
 */
async function verifierFavori(idFilm) {
    if (!ETAT_APPLICATION.authentification) return false;
    try {
        const reponse = await fetch(`favorites.php?film_id=${idFilm}&user_id=${ETAT_APPLICATION.authentification.userId}`);
        const donnees = await reponse.json();
        return donnees.is_favorite;
    } catch (erreur) {
        console.error('Erreur lors de la vérification du favori:', erreur);
        return false;
    }
}

async function verifierWatchlist(idFilm) {
    if (!ETAT_APPLICATION.authentification) return false;
    try {
        const reponse = await fetch(`watchlist.php?film_id=${idFilm}&user_id=${ETAT_APPLICATION.authentification.userId}`);
        const donnees = await reponse.json();
        return donnees.is_in_watchlist;
    } catch (erreur) {
        console.error('Erreur lors de la vérification de la watchlist:', erreur);
        return false;
    }
}

async function verifierVu(idFilm) {
    if (!ETAT_APPLICATION.authentification) return false;
    try {
        const reponse = await fetch(`watched.php?film_id=${idFilm}&user_id=${ETAT_APPLICATION.authentification.userId}`);
        const donnees = await reponse.json();
        return donnees.is_watched;
    } catch (erreur) {
        console.error('Erreur lors de la vérification des films vus:', erreur);
        return false;
    }
}

async function basculerFavori(idFilm, estFavori) {
    if (!ETAT_APPLICATION.authentification) {
        afficherNotification('Connexion requise pour les favoris', 'warning');
        return false;
    }
    try {
        const methode = estFavori ? 'DELETE' : 'POST';
        const reponse = await fetch('favorites.php', {
            method: methode,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ETAT_APPLICATION.authentification.token}` },
            body: JSON.stringify({ film_id: idFilm, user_id: ETAT_APPLICATION.authentification.userId })
        });
        const donnees = await reponse.json();
        if (donnees.success) {
            if (estFavori) {
                ETAT_APPLICATION.favoris.delete(idFilm);
            } else {
                ETAT_APPLICATION.favoris.add(idFilm);
            }
            document.dispatchEvent(new Event('listeMiseAJour'));
            return true;
        }
        throw new Error(donnees.message || 'Échec de l\'action');
    } catch (erreur) {
        console.error('Erreur lors de la mise à jour du favori:', erreur);
        throw erreur;
    }
}

async function basculerWatchlist(idFilm, estDansWatchlist) {
    if (!ETAT_APPLICATION.authentification) {
        afficherNotification('Connexion requise pour la watchlist', 'warning');
        return false;
    }
    try {
        const methode = estDansWatchlist ? 'DELETE' : 'POST';
        const reponse = await fetch('watchlist.php', {
            method: methode,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ETAT_APPLICATION.authentification.token}` },
            body: JSON.stringify({ film_id: idFilm, user_id: ETAT_APPLICATION.authentification.userId })
        });
        const donnees = await reponse.json();
        if (donnees.success) {
            document.dispatchEvent(new Event('listeMiseAJour'));
            return true;
        }
        throw new Error(donnees.message || 'Échec de l\'action');
    } catch (erreur) {
        console.error('Erreur lors de la mise à jour de la watchlist:', erreur);
        throw erreur;
    }
}

async function basculerVu(idFilm, estVu) {
    if (!ETAT_APPLICATION.authentification) {
        afficherNotification('Connexion requise pour marquer comme vu', 'warning');
        return false;
    }
    try {
        const methode = estVu ? 'DELETE' : 'POST';
        const reponse = await fetch('watched.php', {
            method: methode,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ETAT_APPLICATION.authentification.token}` },
            body: JSON.stringify({ film_id: idFilm, user_id: ETAT_APPLICATION.authentification.userId })
        });
        const donnees = await reponse.json();
        if (donnees.success) {
            document.dispatchEvent(new Event('listeMiseAJour'));
            return true;
        }
        throw new Error(donnees.message || 'Échec de l\'action');
    } catch (erreur) {
        console.error('Erreur lors de la mise à jour des films vus:', erreur);
        throw erreur;
    }
}

function mettreAJourBoutonFavori() {
    if (!DOM.ajouterAuxFavoris) return;
    DOM.ajouterAuxFavoris.innerHTML = ETAT_APPLICATION.estFavori
        ? '<i class="ph ph-heart-fill"></i> Retirer des favoris'
        : '<i class="ph ph-heart"></i> Ajouter aux favoris';
    DOM.ajouterAuxFavoris.classList.toggle('btn-primary', !ETAT_APPLICATION.estFavori);
    DOM.ajouterAuxFavoris.classList.toggle('btn-outline-primary', ETAT_APPLICATION.estFavori);
}

function mettreAJourBoutonWatchlist() {
    if (!DOM.ajouterALaWatchlist) return;
    DOM.ajouterALaWatchlist.innerHTML = ETAT_APPLICATION.estDansWatchlist
        ? '<i class="ph ph-clock"></i> Retirer de la watchlist'
        : '<i class="ph ph-clock"></i> À regarder plus tard';
    DOM.ajouterALaWatchlist.classList.toggle('btn-warning', !ETAT_APPLICATION.estDansWatchlist);
    DOM.ajouterALaWatchlist.classList.toggle('btn-outline-warning', ETAT_APPLICATION.estDansWatchlist);
}

function mettreAJourBoutonVu() {
    if (!DOM.marquerCommeVu) return;
    DOM.marquerCommeVu.innerHTML = ETAT_APPLICATION.estVu
        ? '<i class="ph ph-check-circle"></i> Retirer des vus'
        : '<i class="ph ph-check-circle"></i> Déjà vu';
    DOM.marquerCommeVu.classList.toggle('btn-success', !ETAT_APPLICATION.estVu);
    DOM.marquerCommeVu.classList.toggle('btn-outline-success', ETAT_APPLICATION.estVu);
}

/**
 * Affichage des éléments
 */
function afficherGenres() {
    if (!ETAT_APPLICATION.genres.length || !DOM.conteneurGenres) return;
    const colonnes = 3;
    const tailleGroupe = Math.ceil(ETAT_APPLICATION.genres.length / colonnes);
    DOM.conteneurGenres.innerHTML = Array.from({ length: colonnes }).map((_, i) => {
        const debut = i * tailleGroupe;
        const fin = debut + tailleGroupe;
        const genresColonne = ETAT_APPLICATION.genres.slice(debut, fin);
        return `
      <div class="col-md-4 genre-column">
        <h5>Catégories ${i + 1}</h5>
        <ul class="genre-list">
          ${genresColonne.map(genre => `
            <li>
              <a href="#" data-genre-id="${genre.id}" class="genre-link">
                ${genre.name}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    }).join('');
}

function afficherSocietes() {
    if (!ETAT_APPLICATION.companies.length || !DOM.conteneurSocietes) return;
    const colonnes = 3;
    const tailleGroupe = Math.ceil(ETAT_APPLICATION.companies.length / colonnes);
    DOM.conteneurSocietes.innerHTML = Array.from({ length: colonnes }).map((_, i) => {
        const debut = i * tailleGroupe;
        const fin = debut + tailleGroupe;
        const societesColonne = ETAT_APPLICATION.companies.slice(debut, fin);
        return `
      <div class="col-md-4 company-column">
        <h5>Sociétés ${i + 1}</h5>
        <ul class="company-list">
          ${societesColonne.map(societe => `
            <li>
              <a href="#" data-company-id="${societe.id}" class="company-link">
                ${societe.name}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    }).join('');
}

function afficherAnnees() {
    if (!DOM.conteneurAnnees) return;
    const annees = [
        [2031, 2030, 2029, 2028, 2027, 2026],
        [2025, 2024, 2023, 2022, 2021, 2020],
        [2019, 2018, 2017, 2016, 2015, 2014],
        ['2010-2013', '2000-2009', '1990-1999', '1980-1989', '1970-1979', '1960-1969']
    ];
    DOM.conteneurAnnees.innerHTML = annees.map((anneesColonne, i) => `
    <div class="col-md-4 year-column">
      <h5>${i === 0 ? 'Futures' : i === 1 ? 'Présentes' : 'Décennies'}</h5>
      <ul class="year-list">
        ${anneesColonne.map(annee => `
          <li>
            <a href="#" data-year="${annee}" class="year-link">
              ${annee}
              ${[2025, 2024].includes(annee) ? '<span class="badge bg-primary ms-2">Nouveau</span>' : ''}
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');
}

function creerCarteFilm(film, texteBadge = null) {
    const estFavori = ETAT_APPLICATION.favoris.has(film.id);
    const anneeSortie = film.release_date?.substring(0, 4) || 'N/A';
    const note = film.vote_average?.toFixed(1) || '0.0';
    return `
    <div class="col">
      <div class="card h-100 movie-card" data-id="${film.id}" style="border: 1px solid var(--border); background: var(--bg-card); box-shadow: var(--shadow);">
        <div class="position-relative" style="height: 300px; overflow: hidden;">
          <img src="${obtenirImageFilm(film.poster_path)}" 
               class="card-img-top h-100 object-fit-cover" 
               alt="${film.title}"
               loading="lazy"
               onerror="this.src='${CONFIG.IMAGE_SUBstitut}'">
          <button class="favorite-btn ${estFavori ? 'active' : ''}" data-movie-id="${film.id}">
            <i class="ph ${estFavori ? 'ph-heart-fill' : 'ph-heart'}"></i>
          </button>
          ${texteBadge ? `
            <span class="position-absolute top-0 end-0 m-2 badge" style="background: var(--primary);">
              ${typeof texteBadge === 'string' ? texteBadge.substring(0, 7) + (texteBadge.length > 7 ? '...' : '') : texteBadge}
            </span>
          ` : ''}
        </div>
        <div class="card-body" style="background: var(--bg-card); color: var(--text-primary);">
          <h5 class="card-title text-truncate" style="color: var(--text-primary);">${film.title}</h5>
          <div class="d-flex justify-content-between align-items-center">
            <span class="badge ${obtenirClasseNote(film.vote_average)}">
              <i class="ph ph-star"></i> ${note}
            </span>
            <small style="color: var(--text-muted);">${anneeSortie}</small>
          </div>
        </div>
      </div>
    </div>
  `;
}

function afficherListeFilms(films, idConteneur, texteBadge = null) {
    const conteneur = document.getElementById(idConteneur);
    if (!conteneur || !films?.length) {
        console.log(`Conteneur ${idConteneur} introuvable ou films vides`);
        return;
    }
    console.log(`Affichage de ${films.length} films dans ${idConteneur}`);
    conteneur.innerHTML = films.map(film => creerCarteFilm(film, texteBadge)).join('');
    configurerEcouteursCartesFilms();
}

function afficherFilmsTendances(films) {
    if (!films?.length || !DOM.carrouselTendances) return;
    DOM.carrouselTendances.innerHTML = films.map(film => `
    <div class="col" style="min-width: 200px;">
      <div class="card h-100 movie-card" data-id="${film.id}" style="border: 1px solid var(--border); background: var(--bg-card); box-shadow: var(--shadow);">
        <div class="position-relative" style="height: 300px; overflow: hidden;">
          <img src="${obtenirImageFilm(film.poster_path)}" 
               class="card-img-top h-100 object-fit-cover" 
               alt="${film.title}"
               loading="lazy"
               onerror="this.src='${CONFIG.IMAGE_SUBstitut}'">
          <button class="btn position-absolute top-50 start-50 translate-middle play-btn" style="background: var(--primary); color: white; border: none;">
            <i class="ph ph-play"></i>
          </button>
          <button class="favorite-btn ${ETAT_APPLICATION.favoris.has(film.id) ? 'active' : ''}" data-movie-id="${film.id}">
            <i class="ph ${ETAT_APPLICATION.favoris.has(film.id) ? 'ph-heart-fill' : 'ph-heart'}"></i>
          </button>
        </div>
        <div class="card-body" style="background: var(--bg-card); color: var(--text-primary);">
          <h5 class="card-title text-truncate" style="color: var(--text-primary);">${film.title}</h5>
          <div class="d-flex justify-content-between align-items-center">
            <span class="badge ${obtenirClasseNote(film.vote_average)}">
              <i class="ph ph-star"></i> ${film.vote_average.toFixed(1)}
            </span>
            <small style="color: var(--text-muted);">${film.release_date?.substring(0, 4) || 'N/A'}</small>
          </div>
        </div>
      </div>
    </div>
  `).join('');
    configurerEcouteursCartesFilms();
}

function afficherResultatsRecherche(films) {
    if (!DOM.resultatsRecherche) return;
    DOM.resultatsRecherche.innerHTML = `
    <div class="list-group shadow-sm" style="max-width: 500px; margin: 0 auto;">
      ${films.slice(0, 8).map(film => {
        const imageUrl = film.poster_path
            ? `https://image.tmdb.org/t/p/w154${film.poster_path}`
            : 'https://via.placeholder.com/77x115?text=Aucune+image';
        console.log(`Image URL pour ${film.title}: ${imageUrl}`);
        return `
          <a href="#" class="list-group-item list-group-item-action search-result-item border-0 rounded mb-2" 
             data-id="${film.id}" 
             style="display: flex; align-items: center; padding: 10px; background-color: #fff;">
            <img src="${imageUrl}" 
                 width="77" 
                 height="115" 
                 alt="Affiche de ${film.title}" 
                 loading="lazy" 
                 style="border-radius: 4px; margin-right: 15px;"
                 onerror="this.src='https://via.placeholder.com/77x115?text=Aucune+image'; console.log('Erreur de chargement de l\'image pour ${film.title}');">
            <div style="flex: 1;">
              <h6 class="mb-1" style="font-size: 1rem; color: #333;">${film.title}</h6>
              <div style="display: flex; align-items: center; gap: 10px;">
                <small class="text-muted" style="font-size: 0.85rem;">${film.release_date?.substring(0, 4) || 'N/A'}</small>
                <span class="badge ${obtenirClasseNote(film.vote_average)}" 
                      style="font-size: 0.8rem; padding: 4px 8px;">
                  <i class="ph ph-star me-1"></i>${film.vote_average.toFixed(1)}
                </span>
              </div>
            </div>
          </a>
        `;
    }).join('')}
    </div>
  `;
    DOM.resultatsRecherche.style.cssText = `
    display: block;
    position: absolute;
    z-index: 1000;
    width: 100%;
    max-width: 500px;
    left: 50%;
    transform: translateX(-50%);
    top: calc(100% + 5px);
    background: transparent;
  `;
    document.querySelectorAll('.search-result-item').forEach(element => {
        element.addEventListener('mouseover', () => {
            element.style.backgroundColor = '#f8f9fa';
        });
        element.addEventListener('mouseout', () => {
            element.style.backgroundColor = '#fff';
        });
        element.addEventListener('click', async (e) => {
            e.preventDefault();
            if (DOM.resultatsRecherche) DOM.resultatsRecherche.style.display = 'none';
            await afficherDetailsFilm(element.dataset.id);
        });
    });
}

/**
 * Gestion des détails du film
 */
async function afficherDetailsFilm(id) {
    const url = `PROJET_TM_GRoupe/Films/movie-details.html?id=${id}`;
    window.location.href = url;
}

async function chargerDetailsFilm(id) {
    try {
        ETAT_APPLICATION.idFilmActuel = id;
        const film = await recupererDetailsFilm(id);
        if (!film) throw new Error('Aucune donnée pour ce film');

        ETAT_APPLICATION.estFavori = await verifierFavori(id);
        ETAT_APPLICATION.estDansWatchlist = await verifierWatchlist(id);
        ETAT_APPLICATION.estVu = await verifierVu(id);

        const genrePrincipal = film.genres?.[0]?.name || 'Inconnu';
        const bandeAnnonce = film.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer');
        const sortieBelge = film.release_dates?.results?.find(r => r.iso_3166_1 === 'BE')?.release_dates?.[0]?.release_date || film.release_date;
        const plateformes = film['watch/providers']?.results?.BE || {};

        const obtenirUrlPlateforme = (nomPlateforme, titreFilm, idFilm, typePlateforme) => {
            const titreSlug = encodeURIComponent(titreFilm.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
            const urlsPlateformes = {
                'Netflix': `https://www.netflix.com/search?q=${encodeURIComponent(titreFilm)}`,
                'Amazon Prime Video': `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(titreFilm)}`,
                'Amazon Video': `https://www.amazon.com/s?k=${encodeURIComponent(titreFilm)}&i=instant-video`,
                'Disney Plus': `https://www.disneyplus.com/search?q=${encodeURIComponent(titreFilm)}`,
                'Apple TV Plus': `https://tv.apple.com/search?term=${encodeURIComponent(titreFilm)}`,
                'Apple TV': `https://tv.apple.com/search?term=${encodeURIComponent(titreFilm)}`,
                'Canal+': `https://www.canalplus.com/recherche/?q=${encodeURIComponent(titreFilm)}`,
                'OCS': `https://www.ocs.fr/rechercher?q=${encodeURIComponent(titreFilm)}`,
                'Google Play Movies': `https://play.google.com/store/search?q=${encodeURIComponent(titreFilm)}&c=movies`,
                'YouTube': `https://www.youtube.com/results?search_query=${encodeURIComponent(titreFilm + ' movie')}`,
                'FilmoTV': `https://www.filmotv.fr/fr/recherche?term=${encodeURIComponent(titreFilm)}`,
                'Microsoft Store': `https://www.microsoft.com/fr-be/store/search/movies?q=${encodeURIComponent(titreFilm)}`,
                'Skynet': `https://www.skynet.be/fr/recherche?query=${encodeURIComponent(titreFilm)}`,
                'Proximus Pickx': `https://pickx.be/fr/recherche?search=${encodeURIComponent(titreFilm)}`,
                'HBO Max': `https://play.max.com/`,
                'Max': `https://play.max.com/`,
                'Rakuten TV': `https://rakuten.tv/be/search?query=${encodeURIComponent(titreFilm)}`,
                'Telenet': `https://www.telenet.be/fr/recherche?query=${encodeURIComponent(titreFilm)}`,
                'LaCinetek': `https://www.lacinetek.com/fr/rechercher?query=${encodeURIComponent(titreFilm)}`
            };
            return urlsPlateformes[nomPlateforme] || `https://www.themoviedb.org/movie/${idFilm}/watch`;
        };

        const typesPlateformes = {
            'Streaming': plateformes.flatrate || [],
            'Location': plateformes.rent || [],
            'Achat': plateformes.buy || []
        };

        if (DOM.sectionHeroFilm) {
            DOM.sectionHeroFilm.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${film.backdrop_path ? CONFIG.URL_ARRIERE_PLAN + film.backdrop_path : CONFIG.IMAGE_SUBstitut})`;
        }
        if (DOM.titreFilm) DOM.titreFilm.textContent = `${film.title} (${sortieBelge?.substring(0, 4) || 'N/A'})`;
        if (DOM.etiquettesFilm) {
            DOM.etiquettesFilm.innerHTML = `
        <span class="badge bg-primary">${genrePrincipal}</span>
        ${film.runtime ? `<span class="badge bg-secondary">${film.runtime} min</span>` : ''}
        <span class="badge ${obtenirClasseNote(film.vote_average)}">
          <i class="ph ph-star"></i> ${film.vote_average.toFixed(1)}
        </span>
        ${sortieBelge ? `<span class="badge bg-info">Sortie BE: ${new Date(sortieBelge).toLocaleDateString('fr-BE')}</span>` : ''}
      `;
        }
        if (DOM.resumeFilm) DOM.resumeFilm.textContent = film.overview || 'Aucun synopsis disponible.';
        if (DOM.afficheFilm) {
            DOM.afficheFilm.src = obtenirImageFilm(film.poster_path);
            DOM.afficheFilm.alt = film.title;
            DOM.afficheFilm.onerror = () => { DOM.afficheFilm.src = CONFIG.IMAGE_SUBstitut; };
        }

        if (DOM.distributionFilm) {
            DOM.distributionFilm.innerHTML = film.credits?.cast?.length > 0
                ? film.credits.cast.slice(0, 10).map(acteur => `
          <div class="text-center" style="min-width: 100px;">
            <img src="${acteur.profile_path ? `${CONFIG.URL_IMAGE}${acteur.profile_path}` : 'https://via.placeholder.com/100x150?text=Acteur'}" 
                 class="rounded-circle object-fit-cover mb-2" 
                 width="80" height="80"
                 alt="${acteur.name}"
                 onerror="this.src='https://via.placeholder.com/100x150?text=Acteur'">
            <h6 class="mb-0">${acteur.name}</h6>
            <small class="text-muted">${acteur.character}</small>
          </div>
        `).join('')
                : '<p>Aucune information sur la distribution.</p>';
        }

        if (DOM.plateformesFilm) {
            DOM.plateformesFilm.innerHTML = Object.entries(typesPlateformes).map(([type, plateformes]) => `
        ${plateformes.length > 0 ? `
          <h5 class="mt-3 mb-2">${type}</h5>
          <div class="vod-providers-grid">
            ${plateformes.map(plateforme => `
              <a href="${obtenirUrlPlateforme(plateforme.provider_name, film.title, id, type)}" 
                 class="vod-provider-card" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 title="${plateforme.provider_name} (${type})">
                <img src="${ICÔNES_PLATEFORMES[plateforme.provider_name] || CONFIG.ICÔNE_PLATEFORME_SUBstitut}" 
                     class="vod-provider-logo" 
                     alt="${plateforme.provider_name}"
                     onerror="this.src='${CONFIG.ICÔNE_PLATEFORME_SUBstitut}'">
                <div class="vod-provider-name">${plateforme.provider_name}</div>
                <span class="vod-provider-type">${type}</span>
              </a>
            `).join('')}
          </div>
        ` : ''}
      `).join('');
            if (Object.values(typesPlateformes).flat().length === 0 && DOM.aucunePlateforme) {
                DOM.aucunePlateforme.classList.remove('d-none');
            }
        }

        if (DOM.productionFilm) {
            DOM.productionFilm.innerHTML = film.production_companies?.length > 0
                ? film.production_companies.slice(0, 3).map(societe => `
          <span class="badge bg-dark me-2">${societe.name}</span>
        `).join('')
                : '<p>Aucune information sur la production.</p>';
        }

        if (DOM.bandeAnnonceFilm) {
            DOM.bandeAnnonceFilm.innerHTML = bandeAnnonce
                ? `
          <iframe src="https://www.youtube.com/embed/${bandeAnnonce.key}" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen
                  class="rounded shadow"></iframe>
        `
                : `
          <div class="alert alert-info">
            <i class="ph ph-info"></i> Aucune bande-annonce disponible.
          </div>
        `;
            if (DOM.voirBandeAnnonce && bandeAnnonce) {
                DOM.voirBandeAnnonce.href = `https://www.youtube.com/watch?v=${bandeAnnonce.key}`;
                DOM.voirBandeAnnonce.style.display = 'inline-flex';
            }
        }

        mettreAJourBoutonFavori();
        mettreAJourBoutonWatchlist();
        mettreAJourBoutonVu();

        if (DOM.ajouterAuxFavoris) {
            DOM.ajouterAuxFavoris.addEventListener('click', async () => {
                try {
                    const succes = await basculerFavori(id, ETAT_APPLICATION.estFavori);
                    if (succes) {
                        ETAT_APPLICATION.estFavori = !ETAT_APPLICATION.estFavori;
                        mettreAJourBoutonFavori();
                        afficherNotification(ETAT_APPLICATION.estFavori ? 'Ajouté aux favoris' : 'Retiré des favoris', ETAT_APPLICATION.estFavori ? 'success' : 'warning');
                    }
                } catch (erreur) {
                    afficherNotification('Erreur avec les favoris', 'danger');
                }
            });
        }

        if (DOM.ajouterALaWatchlist) {
            DOM.ajouterALaWatchlist.addEventListener('click', async () => {
                try {
                    const succes = await basculerWatchlist(id, ETAT_APPLICATION.estDansWatchlist);
                    if (succes) {
                        ETAT_APPLICATION.estDansWatchlist = !ETAT_APPLICATION.estDansWatchlist;
                        mettreAJourBoutonWatchlist();
                        afficherNotification(ETAT_APPLICATION.estDansWatchlist ? 'Ajouté à la watchlist' : 'Retiré de la watchlist', ETAT_APPLICATION.estDansWatchlist ? 'success' : 'warning');
                    }
                } catch (erreur) {
                    afficherNotification('Erreur avec la watchlist', 'danger');
                }
            });
        }

        if (DOM.marquerCommeVu) {
            DOM.marquerCommeVu.addEventListener('click', async () => {
                try {
                    const succes = await basculerVu(id, ETAT_APPLICATION.estVu);
                    if (succes) {
                        ETAT_APPLICATION.estVu = !ETAT_APPLICATION.estVu;
                        mettreAJourBoutonVu();
                        afficherNotification(ETAT_APPLICATION.estVu ? 'Marqué comme vu' : 'Retiré des vus', ETAT_APPLICATION.estVu ? 'success' : 'warning');
                    }
                } catch (erreur) {
                    afficherNotification('Erreur avec les films vus', 'danger');
                }
            });
        }
    } catch (erreur) {
        console.error('Erreur lors du chargement des détails:', erreur);
        afficherNotification('Impossible de charger les détails', 'danger');
        window.location.href = '../../index.html';
    }
}

/**
 * Gestion des interactions
 */
async function gererSelectionGenre(idGenre) {
    ETAT_APPLICATION.genreActuel = idGenre;
    ETAT_APPLICATION.pageActuelle = 1;
    await chargerFilmsFiltresCombines();
    fermerMenuMobile();
}

async function gererSelectionAnnee(annee) {
    ETAT_APPLICATION.anneeActuelle = annee;
    ETAT_APPLICATION.pageActuelle = 1;
    await chargerFilmsFiltresCombines();
    fermerMenuMobile();
}

async function gererSelectionSociete(idSociete) {
    ETAT_APPLICATION.companyActuelle = idSociete;
    ETAT_APPLICATION.pageActuelle = 1;
    await chargerFilmsFiltresCombines();
    fermerMenuMobile();
}

async function gererRecherche(requete) {
    try {
        const donnees = await rechercherFilms(requete);
        if (donnees?.results?.length) {
            afficherResultatsRecherche(donnees.results);
        } else {
            afficherNotification('Aucun résultat', 'warning');
        }
    } catch (erreur) {
        console.error('Erreur lors de la recherche:', erreur);
        afficherNotification('Erreur lors de la recherche', 'danger');
    }
}

async function chargerFilmsFiltresCombines() {
    if (!DOM.sectionGenre) return;
    const titreSection = obtenirTitreSectionFiltre();
    DOM.sectionGenre.scrollIntoView({ behavior: 'smooth' });
    DOM.sectionGenre.innerHTML = `
    <div class="filter-tags mb-3" id="filter-tags"></div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="section-title">${titreSection}</h2>
    </div>
    <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-4" id="filtered-movies"></div>
    <div class="text-center mt-4">
      <div class="spinner-border text-primary" id="filter-spinner"></div>
    </div>
  `;
    try {
        let filmsAccumules = [];
        const pagesToLoad = Math.ceil(CONFIG.FILMS_PAR_CHARGEMENT / 20);
        let totalPagesFromAPI = 1;

        for (let page = 1; page <= pagesToLoad; page++) {
            const donnees = await recupererFilmsFiltresCombines(
                ETAT_APPLICATION.genreActuel,
                ETAT_APPLICATION.anneeActuelle,
                ETAT_APPLICATION.companyActuelle,
                page
            );
            if (donnees?.results) {
                filmsAccumules = [...filmsAccumules, ...donnees.results];
                if (page === 1) totalPagesFromAPI = donnees.total_pages;
            }
        }

        if (filmsAccumules?.length) {
            console.log(`Affichage des films filtrés combinés (${titreSection}):`, filmsAccumules);
            ETAT_APPLICATION.totalPages = totalPagesFromAPI; // Garder la valeur de l'API
            const filmsAfficher = filmsAccumules.slice(0, CONFIG.FILMS_PAR_CHARGEMENT);
            afficherListeFilms(filmsAfficher, 'filtered-movies');
            afficherFiltresActifs();
        } else {
            console.log(`Aucun film pour ${titreSection}`);
            afficherNotification('Aucun film correspondant aux critères', 'warning');
        }
    } catch (erreur) {
        console.error('Erreur lors du filtrage combiné:', erreur);
        afficherNotification('Erreur lors du chargement des films', 'danger');
    } finally {
        document.getElementById('filter-spinner')?.remove();
    }
}

async function chargerDonneesAccueil() {
    try {
        const [tendances, populaires, mieuxNotes, aVenir] = await Promise.all([
            recupererTendances(),
            recupererFilms('popular'),
            recupererFilms('top_rated'),
            recupererFilmsAVenir()
        ]);
        if (ETAT_APPLICATION.authentification) {
            try {
                const reponse = await fetch(`PROJET_TM_GRoupe/Films/favorites.php?user_id=${ETAT_APPLICATION.authentification.userId}`);
                const donnees = await reponse.json();
                if (donnees.favorites) {
                    ETAT_APPLICATION.favoris = new Set(donnees.favorites.map(f => f.tmdb_id));
                }
            } catch (erreur) {
                console.error('Erreur lors du chargement des favoris:', erreur);
            }
        }
        if (tendances?.results?.length) {
            afficherFilmsTendances(tendances.results.slice(0, 10));
            mettreAJourSectionHero(tendances.results[0]);
        }
        if (populaires?.results?.length) afficherListeFilms(populaires.results.slice(0, 12), 'popular-movies');
        if (mieuxNotes?.results?.length) afficherListeFilms(mieuxNotes.results.slice(0, 12), 'top-rated-movies', 'Top');
        if (aVenir?.results?.length) afficherListeFilms(aVenir.results.slice(0, 12), 'upcoming-movies');
    } catch (erreur) {
        console.error('Erreur lors du chargement des données:', erreur);
        afficherErreurUtilisateur();
    }
}

async function chargerFilmsFiltres(filtre) {
    console.log(`Chargement des films pour le filtre: ${filtre}`);
    ETAT_APPLICATION.filtreActuel = filtre;
    ETAT_APPLICATION.genreActuel = '';
    ETAT_APPLICATION.anneeActuelle = '';
    ETAT_APPLICATION.companyActuelle = '';
    ETAT_APPLICATION.pageActuelle = 1;
    if (!DOM.sectionGenre) {
        console.error('Section genre introuvable');
        return;
    }
    DOM.sectionGenre.scrollIntoView({ behavior: 'smooth' });
    DOM.sectionGenre.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="section-title">${obtenirTitreFiltre(filtre)}</h2>
    </div>
    <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-4" id="filtered-movies"></div>
    <div class="text-center mt-4">
      <div class="spinner-border text-primary" id="filter-spinner"></div>
    </div>
  `;
    try {
        let filmsAccumules = [];
        const pagesToLoad = Math.ceil(CONFIG.FILMS_PAR_CHARGEMENT / 20);
        let totalPagesFromAPI = 1;

        switch (filtre) {
            case 'trending':
                for (let page = 1; page <= pagesToLoad; page++) {
                    const donnees = await recupererTendances(page);
                    if (donnees?.results) {
                        filmsAccumules = [...filmsAccumules, ...donnees.results];
                        if (page === 1) totalPagesFromAPI = donnees.total_pages;
                    }
                }
                break;
            case 'upcoming':
                for (let page = 1; page <= pagesToLoad; page++) {
                    const donnees = await recupererFilmsAVenir(page);
                    if (donnees?.results) {
                        filmsAccumules = [...filmsAccumules, ...donnees.results];
                        if (page === 1) totalPagesFromAPI = donnees.total_pages;
                    }
                }
                break;
            case 'popular':
            case 'top_rated':
                for (let page = 1; page <= pagesToLoad; page++) {
                    const donnees = await recupererFilms(filtre, page);
                    if (donnees?.results) {
                        filmsAccumules = [...filmsAccumules, ...donnees.results];
                        if (page === 1) totalPagesFromAPI = donnees.total_pages;
                    }
                }
                break;
            default:
                console.error(`Filtre inconnu: ${filtre}`);
                afficherNotification('Filtre non pris en charge', 'danger');
                return;
        }

        if (filmsAccumules?.length) {
            console.log(`Affichage des films pour ${filtre}:`, filmsAccumules);
            ETAT_APPLICATION.totalPages = totalPagesFromAPI; // Garder la valeur de l'API
            const filmsAfficher = filmsAccumules.slice(0, CONFIG.FILMS_PAR_CHARGEMENT);
            afficherListeFilms(filmsAfficher, 'filtered-movies');
        } else {
            console.log(`Aucun film pour ${filtre}`);
            afficherNotification(`Aucun film pour ${obtenirTitreFiltre(filtre)}`, 'warning');
        }
    } catch (erreur) {
        console.error(`Erreur lors du filtrage pour ${filtre}:`, erreur);
        afficherNotification('Erreur lors du chargement des films', 'danger');
    } finally {
        document.getElementById('filter-spinner')?.remove();
    }
}

async function chargerPlusFilms() {
    if (ETAT_APPLICATION.enChargement || ETAT_APPLICATION.pageActuelle >= ETAT_APPLICATION.totalPages) return;
    ETAT_APPLICATION.enChargement = true;
    try {
        let donnees;
        if (ETAT_APPLICATION.genreActuel || ETAT_APPLICATION.anneeActuelle || ETAT_APPLICATION.companyActuelle) {
            donnees = await recupererFilmsFiltresCombines(
                ETAT_APPLICATION.genreActuel,
                ETAT_APPLICATION.anneeActuelle,
                ETAT_APPLICATION.companyActuelle,
                ++ETAT_APPLICATION.pageActuelle
            );
        } else if (ETAT_APPLICATION.filtreActuel) {
            switch (ETAT_APPLICATION.filtreActuel) {
                case 'trending':
                    donnees = await recupererTendances(++ETAT_APPLICATION.pageActuelle);
                    break;
                case 'upcoming':
                    donnees = await recupererFilmsAVenir(++ETAT_APPLICATION.pageActuelle);
                    break;
                case 'popular':
                case 'top_rated':
                    donnees = await recupererFilms(ETAT_APPLICATION.filtreActuel, ++ETAT_APPLICATION.pageActuelle);
                    break;
            }
        }
        if (donnees?.results?.length) {
            const idConteneur = 'filtered-movies';
            const conteneur = document.getElementById(idConteneur);
            conteneur.innerHTML += donnees.results.map(film => creerCarteFilm(film)).join('');
            configurerEcouteursCartesFilms();
        }
    } catch (erreur) {
        console.error('Erreur lors du chargement supplémentaire:', erreur);
    } finally {
        ETAT_APPLICATION.enChargement = false;
    }
}

function mettreAJourSectionHero(film) {
    if (!film || !DOM.sectionHero) return;
    DOM.sectionHero.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${film.backdrop_path ? CONFIG.URL_ARRIERE_PLAN + film.backdrop_path : CONFIG.IMAGE_SUBstitut})`;
    const titre = DOM.sectionHero.querySelector('h1');
    if (titre) titre.textContent = film.title;
    const description = DOM.sectionHero.querySelector('p');
    if (description) {
        description.textContent = film.overview?.substring(0, 150) + (film.overview?.length > 150 ? '...' : '') || 'Découvrez ce film';
    }
    const boutonDecouvrir = DOM.sectionHero.querySelector('#discover-btn');
    if (boutonDecouvrir) boutonDecouvrir.dataset.id = film.id;
}

/**
 * Fonctions utilitaires
 */
function obtenirImageFilm(cheminAffiche) {
    return cheminAffiche ? `${CONFIG.URL_IMAGE}${cheminAffiche}` : CONFIG.AFFICHE_PAR_DEFAUT;
}

function obtenirClasseNote(note) {
    if (note >= 8) return 'bg-success';
    if (note >= 5) return 'bg-warning';
    return 'bg-danger';
}

function obtenirTitreFiltre(filtre) {
    const titres = {
        'popular': 'Films populaires',
        'top_rated': 'Top Films',
        'now_playing': 'Au cinéma',
        'upcoming': 'Prochaines sorties',
        'trending': 'Tendances'
    };
    return titres[filtre] || 'Films';
}

function obtenirTitreSectionFiltre() {
    const genre = ETAT_APPLICATION.genres.find(g => g.id == ETAT_APPLICATION.genreActuel)?.name || '';
    const annee = ETAT_APPLICATION.anneeActuelle || '';
    const societe = ETAT_APPLICATION.companies.find(c => c.id == ETAT_APPLICATION.companyActuelle)?.name || '';
    const filtres = [genre, societe, annee].filter(f => f).join(' - ');
    return filtres || 'Films';
}

function afficherNotification(message, type = 'info') {
    const conteneurNotifications = document.getElementById('toast-container');
    if (!conteneurNotifications) return;
    const notification = document.createElement('div');
    notification.className = `toast show align-items-center text-white bg-${type} border-0`;
    notification.role = 'alert';
    notification.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
    conteneurNotifications.appendChild(notification);
    const bsNotification = bootstrap.Toast.getOrCreateInstance(notification, { delay: 5000 });
    bsNotification.show();
    notification.addEventListener('hidden.bs.toast', () => notification.remove());
}

function afficherFiltresActifs() {
    const conteneurFiltres = document.getElementById('filter-tags');
    if (!conteneurFiltres) return;
    conteneurFiltres.innerHTML = '';
    if (ETAT_APPLICATION.genreActuel) {
        const genre = ETAT_APPLICATION.genres.find(g => g.id == ETAT_APPLICATION.genreActuel)?.name || 'Genre';
        conteneurFiltres.innerHTML += `
      <span class="filter-tag">
        ${genre}
        <i class="ph ph-x remove-filter" data-type="genre" aria-label="Supprimer le filtre ${genre}"></i>
      </span>
    `;
    }
    if (ETAT_APPLICATION.anneeActuelle) {
        conteneurFiltres.innerHTML += `
      <span class="filter-tag">
        ${ETAT_APPLICATION.anneeActuelle}
        <i class="ph ph-x remove-filter" data-type="year" aria-label="Supprimer le filtre ${ETAT_APPLICATION.anneeActuelle}"></i>
      </span>
    `;
    }
    if (ETAT_APPLICATION.companyActuelle) {
        const societe = ETAT_APPLICATION.companies.find(c => c.id == ETAT_APPLICATION.companyActuelle)?.name || 'Société';
        conteneurFiltres.innerHTML += `
      <span class="filter-tag">
        ${societe}
        <i class="ph ph-x remove-filter" data-type="company" aria-label="Supprimer le filtre ${societe}"></i>
      </span>
    `;
    }
    document.querySelectorAll('.remove-filter').forEach(bouton => {
        bouton.addEventListener('click', async (e) => {
            const type = e.target.dataset.type;
            if (type === 'genre') ETAT_APPLICATION.genreActuelphysics;//www.physicsforums.com/threads/why-is-emf-called-electromotive-force.151779/ ETAT_APPLICATION.genreActuel = '';
        else if (type === 'year') ETAT_APPLICATION.anneeActuelle = '';
            else if (type === 'company') ETAT_APPLICATION.companyActuelle = '';
            await chargerFilmsFiltresCombines();
        });
    });
}

function afficherErreurUtilisateur() {
    const principal = document.querySelector('main');
    if (!principal) return;
    principal.innerHTML = `
    <div class="alert alert-danger m-4">
      <h4 class="alert-heading">Erreur</h4>
      <p>Impossible de charger les données. Vérifiez votre connexion.</p>
      <button class="btn btn-danger" onclick="window.location.reload()">Réessayer</button>
    </div>
  `;
}

function fermerMenuMobile() {
    const boutonMenu = document.querySelector('.navbar-toggler');
    if (boutonMenu && window.getComputedStyle(boutonMenu).display !== 'none') {
        const collapse = document.querySelector('.navbar-collapse');
        if (collapse) {
            const bsCollapse = bootstrap.Collapse.getInstance(collapse);
            if (bsCollapse) bsCollapse.hide();
        }
    }
}

/**
 * Configuration des écouteurs d'événements
 */
function configurerEcouteursEvenements() {
    console.log('Configuration des écouteurs d\'événements');

    if (!DOM.barreNavigation) console.error('Barre de navigation (.navbar) introuvable');

    const lienAccueil = DOM.barreNavigation?.querySelector('#nav-home');
    if (lienAccueil) {
        lienAccueil.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Clic sur Accueil');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    } else {
        console.error('Lien #nav-home introuvable');
    }

    if (DOM.lienProfil) {
        DOM.lienProfil.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Clic sur Profil');
            if (!ETAT_APPLICATION.authentification) {
                afficherNotification('Connexion requise', 'warning');
                return;
            }
            if (ETAT_APPLICATION.authentification.role === 'admin') {
                window.location.href = '../GestionFilmsBD/ajouterFilms.html';
            } else if (ETAT_APPLICATION.authentification.role === 'user') {
                window.location.href = 'PROJET_TM_GRoupe/Films/profilUser.html';
            } else {
                afficherNotification('Rôle non reconnu', 'danger');
            }
        });
    }

    if (DOM.lienFavoris) {
        DOM.lienFavoris.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Clic sur Favoris');
            if (ETAT_APPLICATION.authentification) {
                window.location.href = 'PROJET_TM_GRoupe/Films/profilUser.html';
            } else {
                afficherNotification('Connexion requise pour les favoris', 'warning');
            }
        });
    }

    if (DOM.lienDeconnexion) {
        DOM.lienDeconnexion.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Clic sur Déconnexion');
            gererDeconnexion();
        });
    }

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('genre-link')) {
            e.preventDefault();
            console.log('Clic sur genre:', e.target.dataset.genreId);
            await gererSelectionGenre(e.target.dataset.genreId);
        }
        if (e.target.classList.contains('year-link')) {
            e.preventDefault();
            console.log('Clic sur année:', e.target.dataset.year);
            await gererSelectionAnnee(e.target.dataset.year);
        }
        if (e.target.classList.contains('company-link')) {
            e.preventDefault();
            console.log('Clic sur société:', e.target.dataset.companyId);
            await gererSelectionSociete(e.target.dataset.companyId);
        }
    });

    const filtres = [
        { id: 'view-trending', filtre: 'trending' },
        { id: 'view-popular', filtre: 'popular' },
        { id: 'view-top-rated', filtre: 'top_rated' },
        { id: 'view-upcoming', filtre: 'upcoming' }
    ];
    filtres.forEach(({ id, filtre }) => {
        const bouton = document.getElementById(id);
        console.log(`Vérification du bouton ${id}:`, !!bouton);
        if (bouton) {
            bouton.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log(`Clic sur ${id} (filtre: ${filtre})`);
                await chargerFilmsFiltres(filtre);
            });
        } else {
            console.error(`Bouton ${id} introuvable`);
        }
    });

    if (DOM.formulaireRecherche) {
        DOM.formulaireRecherche.addEventListener('submit', async (e) => {
            e.preventDefault();
            const requete = DOM.champRecherche.value.trim();
            if (requete) {
                console.log('Recherche soumise:', requete);
                await gererRecherche(requete);
            }
        });
    }

    if (DOM.champRecherche) {
        DOM.champRecherche.addEventListener('focus', () => {
            console.log('Focus sur le champ de recherche');
            if (DOM.champRecherche.value && DOM.resultatsRecherche?.children.length) {
                DOM.resultatsRecherche.style.display = 'block';
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (DOM.formulaireRecherche && !DOM.formulaireRecherche.contains(e.target)) {
            if (DOM.resultatsRecherche) {
                console.log('Clic hors du formulaire de recherche');
                DOM.resultatsRecherche.style.display = 'none';
            }
        }
    });

    const boutonDecouvrir = DOM.sectionHero?.querySelector('#discover-btn');
    if (boutonDecouvrir) {
        boutonDecouvrir.addEventListener('click', async (e) => {
            const idFilm = e.currentTarget.dataset.id;
            if (idFilm) {
                console.log('Clic sur Découvrir, ID film:', idFilm);
                await afficherDetailsFilm(idFilm);
            }
        });
    }
}

function configurerEcouteursCartesFilms() {
    document.querySelectorAll('.movie-card').forEach(carte => {
        carte.addEventListener('click', async () => {
            const idFilm = carte.dataset.id;
            console.log('Clic sur carte film, ID:', idFilm);
            await afficherDetailsFilm(idFilm);
        });
    });
    document.querySelectorAll('.favorite-btn').forEach(bouton => {
        bouton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const idFilm = bouton.dataset.movieId;
            const estFavori = bouton.classList.contains('active');
            console.log('Clic sur Favori, ID:', idFilm, 'Favori:', estFavori);
            try {
                const succes = await basculerFavori(idFilm, estFavori);
                if (succes) {
                    bouton.classList.toggle('active');
                    const icone = bouton.querySelector('i');
                    icone.classList.toggle('ph-heart', !bouton.classList.contains('active'));
                    icone.classList.toggle('ph-heart-fill', bouton.classList.contains('active'));
                    afficherNotification(bouton.classList.contains('active') ? 'Ajouté aux favoris' : 'Retiré des favoris', bouton.classList.contains('active') ? 'success' : 'warning');
                }
            } catch (erreur) {
                afficherNotification('Erreur avec les favoris', 'danger');
            }
        });
    });
}

function configurerObservateurIntersection() {
    const piedDePage = document.querySelector('.footer');
    if (!piedDePage) {
        console.error('Pied de page (.footer) introuvable');
        return;
    }
    const observateur = new IntersectionObserver((entrees) => {
        if (entrees[0].isIntersecting && !ETAT_APPLICATION.enChargement && ETAT_APPLICATION.pageActuelle < ETAT_APPLICATION.totalPages) {
            console.log('Pied de page visible, chargement de plus de films');
            chargerPlusFilms();
        }
    }, { threshold: 0.1 });
    observateur.observe(piedDePage);
}

document.addEventListener('authChange', () => {
    console.log('Événement authChange déclenché');
    verifierAuthentification();
    mettreAJourInterfaceAuthentification();
    chargerDonneesAccueil();
});