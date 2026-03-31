/**
 * MyCiné - Gestion des séries TV avec l'API TMDB
 * Version complète avec filtres avancés basée sur projet.js
 */

// Configuration de l'application
const CONFIG = {
  CLE_API: "04c35731a5ee918f014970082a0088b1",
  URL_BASE: "https://api.themoviedb.org/3",
  URL_IMAGE: "https://image.tmdb.org/t/p/w500",
  URL_IMAGE_ACTEUR: "https://image.tmdb.org/t/p/w185",
  URL_ARRIERE_PLAN: "https://image.tmdb.org/t/p/original",
  IMAGE_SUBSTITUT: "https://via.placeholder.com/500x750?text=Image+indisponible",
  AFFICHE_PAR_DEFAUT: "https://via.placeholder.com/500x750?text=Aucune+affiche",
  ICÔNE_PLATEFORME_SUBSTITUT: "https://via.placeholder.com/40x40?text=Plateforme",
}

// Éléments du DOM
const DOM = {
  barreNavigation: document.querySelector(".navbar"),
  conteneurGenres: document.getElementById("genres-container"),
  conteneurAnnees: document.getElementById("years-container"),
  conteneurSocietes: document.getElementById("companies-container"),
  formulaireRecherche: document.getElementById("search-form"),
  champRecherche: document.getElementById("search-input"),
  resultatsRecherche: document.getElementById("search-results"),
  sectionHero: document.getElementById("hero-section"),
  carrouselTendances: document.getElementById("trending-tv-carousel"),
  seriesPopulaires: document.getElementById("popular-tv"),
  seriesMieuxNotes: document.getElementById("top-rated-tv"),
  seriesEnCours: document.getElementById("airing-today"),
  seriesAVenir: document.getElementById("upcoming-movies"),
  sectionGenre: document.getElementById("genre-section"),
  distributionSerie: document.getElementById("series-cast"),
  lienConnexion: document.getElementById("login-link"),
  lienDeconnexion: document.getElementById("logout-link"),
  lienProfil: document.getElementById("profile-link"),
  lienAdmin: document.getElementById("admin-link"),
  affichageNomUtilisateur: document.getElementById("username-display"),
  toastContainer: document.getElementById("toast-container"),
}

const ICÔNES_PLATEFORMES = {
  "Netflix": "../images/netflix.png",
  "Amazon Prime Video": "../images/amazon_prime_video.png",
  "Amazon Video": "../images/amazon_video.png",
  "Disney Plus": "../images/disney_plus.png",
  "Disney+": "../images/disney_plus.png",
  "Apple TV Plus": "../images/apple_tv_plus.png",
  "Apple TV+": "../images/apple_tv_plus.png",
  "Apple TV": "../images/apple_tv.png",
  "CanalPlus": "../images/canal_plus.png",
  "OCS": "../images/ocs.png",
  "Google Play Movies": "../images/google_play_movies.png",
  "YouTube": "../images/youtube.png",
  "FilmoTV": "../images/filmotv.png",
  "Microsoft Store": "../images/microsoft_store.png",
  "Skynet": "../images/skynet.png",
  "HBO Max": "../images/max.png",
  "Max": "../images/max.png",
  "Hulu": "../images/hulu.png",
  "Paramount+": "../images/paramount_plus.png",
  "YouTube Premium": "../images/youtube_premium.png",
  "Peacock": "../images/peacock.png",
  "Discovery+": "../images/discovery_plus.png",
  "Showtime": "../images/showtime.png",
  "Starz": "../images/starz.png",
  "National Geographic": "../images/nat_geo.png",
  "AMC": "../images/amc.png",
}

// État de l'application
const ETAT_APPLICATION = {
  genres: [],
  companies: [],
  pageActuelle: 1,
  totalPages: 1,
  filtreActuel: "",
  genreActuel: "",
  anneeActuelle: "",
  companyActuelle: "",
  enChargement: false,
  idSerieActuelle: null,
  authentification: null,
  requetesActives: new Set(),
}

/**
 * Utilitaires de requête API
 */
async function recupererDonnees(url, idRequete) {
  if (ETAT_APPLICATION.requetesActives.has(idRequete)) {
    console.log(`Requête ${idRequete} déjà en cours, ignorée`)
    return null
  }

  ETAT_APPLICATION.requetesActives.add(idRequete)

  try {
    console.log(`Début de la requête ${idRequete}: ${url}`)
    const reponse = await fetch(url)

    if (!reponse.ok) {
      throw new Error(`Erreur HTTP: ${reponse.status}`)
    }

    const donnees = await reponse.json()
    console.log(`Requête ${idRequete} réussie:`, donnees)
    return donnees
  } catch (erreur) {
    console.error(`Erreur pour la requête ${idRequete}:`, erreur)
    throw erreur
  } finally {
    ETAT_APPLICATION.requetesActives.delete(idRequete)
  }
}

/**
 * Fonctions de récupération des données
 */
async function recupererGenres() {
  const url = `${CONFIG.URL_BASE}/genre/tv/list?api_key=${CONFIG.CLE_API}&language=fr-FR`
  const donnees = await recupererDonnees(url, "recupererGenres")
  if (donnees) {
    ETAT_APPLICATION.genres = donnees.genres
    afficherGenres()
  }
}

async function recupererSocietes() {
  const plateformesDistribution = [
    { id: 213, name: "Netflix" },
    { id: 49, name: "HBO" },
    { id: 3186, name: "HBO Max" },
    { id: 1024, name: "Amazon Prime Video" },
    { id: 2739, name: "Disney+" },
    { id: 453, name: "Hulu" },
    { id: 2552, name: "Apple TV+" },
    { id: 4330, name: "Paramount+" },
    { id: 1436, name: "YouTube Premium" },
    { id: 2697, name: "Peacock" },
    { id: 4353, name: "Discovery+" },
    { id: 1899, name: "Max" },
    { id: 3353, name: "Showtime" },
    { id: 67, name: "Starz" },
    { id: 43, name: "National Geographic" },
    { id: 174, name: "AMC" },
  ]
  ETAT_APPLICATION.companies = plateformesDistribution
  afficherSocietes()
}

async function recupererSeries(type, page = 1) {
  const url = `${CONFIG.URL_BASE}/tv/${type}?api_key=${CONFIG.CLE_API}&language=fr-FR&page=${page}`
  console.log(`Requête API pour ${type}: ${url}`)
  return await recupererDonnees(url, `recupererSeries-${type}-${page}`)
}

async function recupererTendances(page = 1) {
  const url = `${CONFIG.URL_BASE}/trending/tv/week?api_key=${CONFIG.CLE_API}&language=fr-FR&page=${page}`
  console.log(`Requête API pour tendances: ${url}`)
  return await recupererDonnees(url, `recupererTendances-${page}`)
}

async function recupererSeriesFiltresCombines(idGenre, annee, idSociete, page = 1) {
  let url = `${CONFIG.URL_BASE}/discover/tv?api_key=${CONFIG.CLE_API}&language=fr-FR&page=${page}`
  if (idGenre) url += `&with_genres=${idGenre}`
  if (annee) {
    if (annee.includes("-")) {
      const [anneeDebut, anneeFin] = annee.split("-")
      url += `&first_air_date.gte=${anneeDebut}-01-01&first_air_date.lte=${anneeFin}-12-31`
    } else {
      url += `&first_air_date_year=${annee}`
    }
  }
  if (idSociete) url += `&with_networks=${idSociete}`
  return await recupererDonnees(
      url,
      `recupererSeriesFiltresCombines-${idGenre || "no-genre"}-${annee || "no-year"}-${idSociete || "no-company"}-${page}`,
  )
}

async function rechercherSeries(requete, page = 1) {
  const url = `${CONFIG.URL_BASE}/search/tv?api_key=${CONFIG.CLE_API}&language=fr-FR&query=${encodeURIComponent(requete)}&page=${page}`
  return await recupererDonnees(url, `rechercherSeries-${requete}-${page}`)
}

async function recupererDetailsSerie(id) {
  const url = `${CONFIG.URL_BASE}/tv/${id}?api_key=${CONFIG.CLE_API}&language=fr-FR&append_to_response=credits,videos,watch/providers`
  return await recupererDonnees(url, `recupererDetailsSerie-${id}`)
}

/**
 * Fonctions d'affichage
 */
function creerCarteSerie(serie, texteBadge = null) {
  const anneeDebut = serie.first_air_date?.substring(0, 4) || "N/A"
  const note = serie.vote_average?.toFixed(1) || "0.0"
  const nombreSaisons = serie.number_of_seasons || "N/A"

  return `
    <div class="col-6 col-sm-4 col-md-3 col-lg-2">
        <div class="movie-card position-relative rounded overflow-hidden" data-id="${serie.id}" style="cursor: pointer;">
            <div class="movie-card-inner position-relative" style="height: 300px;">
                <img src="${serie.poster_path ? CONFIG.URL_IMAGE + serie.poster_path : CONFIG.AFFICHE_PAR_DEFAUT}" 
                     alt="${serie.name}" 
                     class="movie-card-img img-fluid w-100 h-100 object-fit-cover"
                     onerror="this.src='${CONFIG.AFFICHE_PAR_DEFAUT}'"
                     loading="lazy">
                
                ${texteBadge ? `<span class="position-absolute top-0 start-0 m-2 badge bg-danger">${texteBadge}</span>` : ''}
                
                <!-- Note au survol -->
                <div class="movie-rating position-absolute top-0 end-0 m-2 bg-dark bg-opacity-75 text-white rounded-pill px-2 py-1 d-flex align-items-center"
                     style="opacity: 0; transform: translateY(10px); transition: all 0.3s ease;">
                    <i class="ph ph-star-fill text-warning me-1 small"></i>
                    <small class="fw-bold">${note}</small>
                </div>
                
                <div class="movie-card-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end p-3">
                    <div class="text-white w-100">
                        <h6 class="mb-1 fw-bold movie-title" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${serie.name}</h6>
                        <small class="d-flex align-items-center justify-content-between w-100">
                            <span class="d-flex align-items-center">
                                <i class="ph ph-television me-1"></i><span>${nombreSaisons}s</span>
                            </span>
                            <span>${anneeDebut}</span>
                        </small>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `
}

function afficherSeriesTendances(series) {
  if (!series?.length || !DOM.carrouselTendances) return
  DOM.carrouselTendances.className = "row g-4"
  DOM.carrouselTendances.innerHTML = series
      .map((serie) => creerCarteSerie(serie))
      .join("")
  configurerEcouteursCartesSeries()
}

function afficherListeSeries(series, idConteneur, texteBadge = null) {
  const conteneur = document.getElementById(idConteneur)
  if (!conteneur || !series?.length) return
  conteneur.className = "row g-4"
  conteneur.innerHTML = series.map((serie) => creerCarteSerie(serie, texteBadge)).join("")
  configurerEcouteursCartesSeries()
}

function afficherResultatsRecherche(series) {
  if (!DOM.resultatsRecherche) return
  DOM.resultatsRecherche.innerHTML = `
    <div class="list-group shadow-sm" style="max-width: 500px; margin: 0 auto;">
      ${series
      .slice(0, 8)
      .map((serie) => {
        const imageUrl = serie.poster_path
            ? `${CONFIG.URL_IMAGE.replace("w500", "w154")}${serie.poster_path}`
            : CONFIG.IMAGE_SUBSTITUT
        return `
          <a href="#" class="list-group-item list-group-item-action search-result-item border-0 rounded mb-2" 
             data-id="${serie.id}" 
             style="display: flex; align-items: center; padding: 10px; background-color: #fff;">
            <img src="${imageUrl}" 
                 width="77" 
                 height="115" 
                 alt="Affiche de ${serie.name}" 
                 loading="lazy" 
                 style="border-radius: 4px; margin-right: 15px;"
                 onerror="this.src='${CONFIG.IMAGE_SUBSTITUT}'">
            <div style="flex: 1;">
              <h6 class="mb-1" style="font-size: 1rem; color: #333;">${serie.name}</h6>
              <div style="display: flex; align-items: center; gap: 10px;">
                <small class="text-muted" style="font-size: 0.85rem;">${serie.first_air_date?.substring(0, 4) || "N/A"}</small>
                <span class="badge ${obtenirClasseNote(serie.vote_average)}" 
                      style="font-size: 0.8rem; padding: 4px 8px;">
                  <i class="ph ph-star me-1"></i>${noteDisplay}
                </span>
              </div>
            </div>
          </a>
        `
      })
      .join("")}
    </div>
  `
  DOM.resultatsRecherche.style.cssText = `
    display: block;
    position: absolute;
    z-index: 1000;
    width: 100%;
    max-width: 500px;
    left: 50%;
    transform: translateX(-50%);
    top: 100%;
    margin-top: 5px;
  `
  document.querySelectorAll(".search-result-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault()
      const idSerie = item.dataset.id
      if (idSerie) {
        afficherDetailsSerie(idSerie)
      }
    })
  })
}

function afficherGenres() {
  if (!ETAT_APPLICATION.genres.length || !DOM.conteneurGenres) return
  const colonnes = 3
  const tailleGroupe = Math.ceil(ETAT_APPLICATION.genres.length / colonnes)
  DOM.conteneurGenres.innerHTML = Array.from({ length: colonnes })
      .map((_, i) => {
        const debut = i * tailleGroupe
        const fin = debut + tailleGroupe
        const genresColonne = ETAT_APPLICATION.genres.slice(debut, fin)
        return `
      <div class="col-md-4 genre-column">
        <h5>Catégories ${i + 1}</h5>
        <ul class="genre-list">
          ${genresColonne
            .map(
                (genre) => `
            <li>
              <a href="#" data-genre-id="${genre.id}" class="genre-link">
                ${genre.name}
              </a>
            </li>
          `,
            )
            .join("")}
        </ul>
      </div>
    `
      })
      .join("")
}

function afficherSocietes() {
  if (!ETAT_APPLICATION.companies.length || !DOM.conteneurSocietes) return
  const colonnes = 3
  const tailleGroupe = Math.ceil(ETAT_APPLICATION.companies.length / colonnes)
  DOM.conteneurSocietes.innerHTML = Array.from({ length: colonnes })
      .map((_, i) => {
        const debut = i * tailleGroupe
        const fin = debut + tailleGroupe
        const societesColonne = ETAT_APPLICATION.companies.slice(debut, fin)
        return `
      <div class="col-md-4 company-column">
        <h5>Plateformes ${i + 1}</h5>
        <ul class="company-list">
          ${societesColonne
            .map(
                (societe) => `
            <li>
              <a href="#" data-company-id="${societe.id}" class="company-link">
                ${societe.name}
              </a>
            </li>
          `,
            )
            .join("")}
        </ul>
      </div>
    `
      })
      .join("")
}

function afficherAnnees() {
  if (!DOM.conteneurAnnees) return
  const annees = [
    [2025, 2024, 2023, 2022, 2021, 2020],
    [2019, 2018, 2017, 2016, 2015, 2014],
    ["2010-2013", "2000-2009", "1990-1999", "1980-1989", "1970-1979", "1960-1969"],
  ]
  DOM.conteneurAnnees.innerHTML = annees
      .map(
          (anneesColonne, i) => `
    <div class="col-md-4 year-column">
      <h5>${i === 0 ? "Récentes" : i === 1 ? "Classiques" : "Décennies"}</h5>
      <ul class="year-list">
        ${anneesColonne
              .map(
                  (annee) => `
          <li>
            <a href="#" data-year="${annee}" class="year-link">
              ${annee}
              ${[2025, 2024].includes(annee) ? '<span class="badge bg-primary ms-2">Nouveau</span>' : ""}
            </a>
          </li>
        `,
              )
              .join("")}
      </ul>
    </div>
  `,
      )
      .join("")
}

function mettreAJourSectionHero(serie) {
  if (!serie || !DOM.sectionHero) return

  DOM.sectionHero.style.backgroundImage = `
    linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), 
    url(${serie.backdrop_path ? CONFIG.URL_ARRIERE_PLAN + serie.backdrop_path : CONFIG.IMAGE_SUBSTITUT})
  `

  const titre = DOM.sectionHero.querySelector(".hero-title")
  if (titre) titre.textContent = serie.name

  const description = DOM.sectionHero.querySelector(".hero-description")
  if (description) {
    description.textContent =
        serie.overview?.substring(0, 150) + (serie.overview?.length > 150 ? "..." : "") || "Découvrez cette série"
  }

  const boutonDecouvrir = DOM.sectionHero.querySelector("#discover-btn")
  if (boutonDecouvrir) boutonDecouvrir.dataset.id = serie.id
}

/**
 * Gestion des interactions
 */
async function gererSelectionGenre(idGenre) {
  ETAT_APPLICATION.genreActuel = idGenre
  ETAT_APPLICATION.pageActuelle = 1
  await chargerSeriesFiltresCombines()
  fermerMenuMobile()
}

async function gererSelectionAnnee(annee) {
  ETAT_APPLICATION.anneeActuelle = annee
  ETAT_APPLICATION.pageActuelle = 1
  await chargerSeriesFiltresCombines()
  fermerMenuMobile()
}

async function gererSelectionSociete(idSociete) {
  ETAT_APPLICATION.companyActuelle = idSociete
  ETAT_APPLICATION.pageActuelle = 1
  await chargerSeriesFiltresCombines()
  fermerMenuMobile()
}

async function gererRecherche(requete) {
  try {
    const donnees = await rechercherSeries(requete)
    if (donnees?.results?.length) {
      afficherResultatsRecherche(donnees.results)
    } else {
      afficherNotification("Aucun résultat", "warning")
    }
  } catch (erreur) {
    console.error("Erreur lors de la recherche:", erreur)
    afficherNotification("Erreur lors de la recherche", "danger")
  }
}

async function chargerSeriesFiltresCombines() {
  if (!DOM.sectionGenre) return
  DOM.sectionGenre.style.display = "block"
  const titreSection = obtenirTitreSectionFiltre()
  DOM.sectionGenre.scrollIntoView({ behavior: "smooth" })
  DOM.sectionGenre.innerHTML = `
    <div class="filter-tags mb-3" id="filter-tags"></div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="section-title">${titreSection}</h2>
    </div>
    <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-4" id="filtered-series"></div>
    <div class="text-center mt-4">
      <div class="spinner-border text-primary" id="filter-spinner"></div>
    </div>
  `
  try {
    const toutesLesSeries = []
    let page = 1
    let totalPages = 1

    do {
      const donnees = await recupererSeriesFiltresCombines(
          ETAT_APPLICATION.genreActuel,
          ETAT_APPLICATION.anneeActuelle,
          ETAT_APPLICATION.companyActuelle,
          page,
      )

      if (donnees?.results?.length) {
        toutesLesSeries.push(...donnees.results)
        totalPages = Math.min(donnees.total_pages, 5) // Limiter à 5 pages max pour éviter trop de requêtes
      }
      page++
    } while (page <= totalPages)

    if (toutesLesSeries.length) {
      console.log(`Affichage de toutes les séries filtrées (${titreSection}):`, toutesLesSeries)
      ETAT_APPLICATION.totalPages = totalPages
      afficherListeSeries(toutesLesSeries, "filtered-series")
      afficherFiltresActifs()
    } else {
      console.log(`Aucune série pour ${titreSection}`)
      afficherNotification("Aucune série correspondant aux critères", "warning")
    }
  } catch (erreur) {
    console.error("Erreur lors du filtrage combiné:", erreur)
    afficherNotification("Erreur lors du chargement des séries", "danger")
  } finally {
    document.getElementById("filter-spinner")?.remove()
  }
}

async function chargerSeriesFiltres(filtre) {
  console.log(`Chargement des séries pour le filtre: ${filtre}`)
  ETAT_APPLICATION.filtreActuel = filtre
  ETAT_APPLICATION.genreActuel = ""
  ETAT_APPLICATION.anneeActuelle = ""
  ETAT_APPLICATION.companyActuelle = ""
  ETAT_APPLICATION.pageActuelle = 1

  if (!DOM.sectionGenre) return

  DOM.sectionGenre.style.display = "block"
  const titreSection = obtenirTitreFiltre(filtre)
  DOM.sectionGenre.scrollIntoView({ behavior: "smooth" })
  DOM.sectionGenre.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="section-title">${titreSection}</h2>
    </div>
    <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-4" id="filtered-series"></div>
    <div class="text-center mt-4">
      <div class="spinner-border text-primary" id="filter-spinner"></div>
    </div>
  `

  try {
    const toutesLesSeries = []
    let page = 1
    let totalPages = 1

    do {
      // `trending` utilise un endpoint TMDB different de `/tv/{type}`.
      const donnees =
        filtre === "trending" ? await recupererTendances(page) : await recupererSeries(filtre, page)

      if (donnees?.results?.length) {
        toutesLesSeries.push(...donnees.results)
        totalPages = Math.min(donnees.total_pages, 5) // Limiter à 5 pages max
      }
      page++
    } while (page <= totalPages)

    if (toutesLesSeries.length) {
      console.log(`Affichage de toutes les séries ${filtre}:`, toutesLesSeries)
      ETAT_APPLICATION.totalPages = totalPages
      afficherListeSeries(toutesLesSeries, "filtered-series")
    } else {
      console.log(`Aucune série pour ${filtre}`)
      afficherNotification("Aucune série trouvée", "warning")
    }
  } catch (erreur) {
    console.error(`Erreur lors du chargement des séries ${filtre}:`, erreur)
    afficherNotification("Erreur lors du chargement des séries", "danger")
  } finally {
    document.getElementById("filter-spinner")?.remove()
  }
}

async function chargerDonneesAccueilSeries() {
  try {
    const [tendances, populaires, mieuxNotes, enCours, aVenir] = await Promise.all([
      recupererTendances(),
      recupererSeries("popular"),
      recupererSeries("top_rated"),
      recupererSeries("airing_today"),
      recupererSeries("on_the_air"),
    ])
    if (tendances?.results?.length) {
      afficherSeriesTendances(tendances.results.slice(0, 10))
      mettreAJourSectionHero(tendances.results[0])
    }
    if (populaires?.results?.length) afficherListeSeries(populaires.results.slice(0, 12), "popular-tv")
    if (mieuxNotes?.results?.length) afficherListeSeries(mieuxNotes.results.slice(0, 12), "top-rated-tv", "Top")
    if (enCours?.results?.length) afficherListeSeries(enCours.results.slice(0, 12), "airing-today")
    if (aVenir?.results?.length) afficherListeSeries(aVenir.results.slice(0, 12), "upcoming-movies")
  } catch (erreur) {
    console.error("Erreur lors du chargement des données:", erreur)
    afficherNotification("Erreur lors du chargement de l'application", "danger")
  }
}

function configurerEcouteursCartesSeries() {
  document.querySelectorAll(".movie-card").forEach((carte) => {
    // Animation de la note au survol
    carte.addEventListener("mouseenter", () => {
      const note = carte.querySelector('.movie-rating')
      if (note) {
        note.style.opacity = '1'
        note.style.transform = 'translateY(0)'
      }
    })

    carte.addEventListener("mouseleave", () => {
      const note = carte.querySelector('.movie-rating')
      if (note) {
        note.style.opacity = '0'
        note.style.transform = 'translateY(10px)'
      }
    })

    // Clic pour voir les détails
    carte.addEventListener("click", (e) => {
      const idSerie = carte.dataset.id
      if (idSerie) {
        console.log("[v0] Clic sur carte série avec ID:", idSerie)
        afficherDetailsSerie(idSerie)
      }
    })
  })
}

function fermerMenuMobile() {
  const menuMobile = document.querySelector(".navbar-collapse")
  if (menuMobile && menuMobile.classList.contains("show")) {
    const boutonToggle = document.querySelector(".navbar-toggler")
    if (boutonToggle) boutonToggle.click()
  }
}

function obtenirClasseNote(note) {
  if (note >= 8) return "bg-success"
  if (note >= 5) return "bg-warning"
  return "bg-danger"
}

function obtenirTitreFiltre(filtre) {
  const titres = {
    popular: "Séries populaires",
    top_rated: "Top Séries",
    airing_today: "En cours de diffusion",
    on_the_air: "Prochaines séries",
    trending: "Tendances",
  }
  return titres[filtre] || "Séries"
}

function obtenirTitreSectionFiltre() {
  const genre = ETAT_APPLICATION.genres.find((g) => g.id == ETAT_APPLICATION.genreActuel)?.name || ""
  const annee = ETAT_APPLICATION.anneeActuelle || ""
  const plateforme = ETAT_APPLICATION.companies.find((c) => c.id == ETAT_APPLICATION.companyActuelle)?.name || ""

  const parties = [genre, annee, plateforme].filter(Boolean)
  return parties.length > 0 ? `Séries ${parties.join(" - ")}` : "Séries filtrées"
}

function afficherNotification(message, type = "info") {
  if (!DOM.toastContainer) {
    console.warn("Container de toast non trouvé")
    return
  }

  const notification = document.createElement("div")
  notification.className = `toast show align-items-center text-white bg-${type} border-0`
  notification.role = "alert"
  notification.setAttribute("aria-live", "assertive")
  notification.setAttribute("aria-atomic", "true")

  notification.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `

  DOM.toastContainer.appendChild(notification)
  const bsNotification = new window.bootstrap.Toast(notification, { delay: 3000 })
  bsNotification.show()
  notification.addEventListener("hidden.bs.toast", () => notification.remove())
}

function afficherFiltresActifs() {
  const conteneurFiltres = document.getElementById("filter-tags")
  if (!conteneurFiltres) return
  conteneurFiltres.innerHTML = ""
  if (ETAT_APPLICATION.genreActuel) {
    const genre = ETAT_APPLICATION.genres.find((g) => g.id == ETAT_APPLICATION.genreActuel)?.name || "Genre"
    conteneurFiltres.innerHTML += `
      <span class="filter-tag">
        ${genre}
        <i class="ph ph-x remove-filter" data-type="genre" aria-label="Supprimer le filtre ${genre}"></i>
      </span>
    `
  }
  if (ETAT_APPLICATION.anneeActuelle) {
    conteneurFiltres.innerHTML += `
      <span class="filter-tag">
        ${ETAT_APPLICATION.anneeActuelle}
        <i class="ph ph-x remove-filter" data-type="year" aria-label="Supprimer le filtre ${ETAT_APPLICATION.anneeActuelle}"></i>
      </span>
    `
  }
  if (ETAT_APPLICATION.companyActuelle) {
    const plateforme =
        ETAT_APPLICATION.companies.find((c) => c.id == ETAT_APPLICATION.companyActuelle)?.name || "Plateforme"
    conteneurFiltres.innerHTML += `
      <span class="filter-tag">
        ${plateforme}
        <i class="ph ph-x remove-filter" data-type="company" aria-label="Supprimer le filtre ${plateforme}"></i>
      </span>
    `
  }
  document.querySelectorAll(".remove-filter").forEach((bouton) => {
    bouton.addEventListener("click", async (e) => {
      const type = e.target.dataset.type
      if (type === "genre") ETAT_APPLICATION.genreActuel = ""
      else if (type === "year") ETAT_APPLICATION.anneeActuelle = ""
      else if (type === "company") ETAT_APPLICATION.companyActuelle = ""
      await chargerSeriesFiltresCombines()
    })
  })
}

function afficherErreurUtilisateur() {
  const principal = document.querySelector("main")
  if (!principal) return
  principal.innerHTML = `
    <div class="alert alert-danger m-4">
      <h4 class="alert-heading">Erreur</h4>
      <p>Une erreur s'est produite lors du chargement des séries. Veuillez réessayer plus tard.</p>
      <button class="btn btn-outline-danger" onclick="location.reload()">
        <i class="ph ph-arrow-clockwise me-2"></i>Recharger la page
      </button>
    </div>
  `
}

function afficherDetailsSerie(id) {
  console.log("[v0] Navigation vers les détails de la série avec ID:", id)
  window.location.href = `PROJET_TM/Films/serie-details.html?id=${id}`
}

function afficherDistribution(serie) {
  if (!DOM.distributionSerie) return

  DOM.distributionSerie.innerHTML =
      serie.credits?.cast?.length > 0
          ? serie.credits.cast
              .slice(0, 8)
              .map(
                  (acteur) => `
      <div class="text-center" style="min-width: 100px;">
        <img src="${acteur.profile_path ? `${CONFIG.URL_IMAGE_ACTEUR}${acteur.profile_path}` : "https://via.placeholder.com/100x150?text=Acteur"}" 
             class="rounded-circle object-fit-cover mb-2" 
             width="80" height="80"
             alt="${acteur.name}"
             style="aspect-ratio: 1; object-fit: cover;"
             onerror="this.src='https://via.placeholder.com/100x150?text=Acteur'">
        <h6 class="mb-0 text-truncate" style="font-size: 0.9rem;">${acteur.name}</h6>
        <small class="text-muted text-truncate d-block" style="font-size: 0.8rem;">${acteur.character}</small>
      </div>
    `,
              )
              .join("")
          : "<p>Aucune information sur la distribution.</p>"
}

function afficherPlateformes(plateformes) {
  const conteneurPlateformes = document.getElementById("platforms-container")
  if (!conteneurPlateformes || !plateformes) return

  const typesPlateformes = {
    Streaming: plateformes.flatrate || [],
    Location: plateformes.rent || [],
    Achat: plateformes.buy || [],
  }

  let htmlPlateformes = ""

  Object.entries(typesPlateformes).forEach(([type, listeP]) => {
    if (listeP.length > 0) {
      htmlPlateformes += `
        <div class="platform-type mb-3">
          <h6 class="platform-type-title">${type}</h6>
          <div class="d-flex flex-wrap gap-2">
            ${listeP
          .map(
              (plateforme) => {
                  const logoUrl = plateforme.logo_path 
                    ? `https://image.tmdb.org/t/p/original${plateforme.logo_path}`
                    : (ICÔNES_PLATEFORMES[plateforme.provider_name] || CONFIG.ICÔNE_PLATEFORME_SUBSTITUT);
                    
                  return `
              <a href="#" 
                 class="vod-provider-card" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 title="${plateforme.provider_name} (${type})">
                <img src="${logoUrl}" 
                     class="vod-provider-logo" 
                     alt="${plateforme.provider_name}"
                     style="width: 40px; height: 40px; border-radius: 8px;"
                     onerror="this.src='${CONFIG.ICÔNE_PLATEFORME_SUBSTITUT}'">
                <div class="vod-provider-name">${plateforme.provider_name}</div>
                <span class="vod-provider-type">${type}</span>
              </a>
            `;
              },
          )
          .join("")}
          </div>
        </div>
      `
    }
  })

  conteneurPlateformes.innerHTML = htmlPlateformes || "<p>Aucune plateforme disponible.</p>"
}

/**
 * Configuration des écouteurs d'événements
 */
function configurerEcouteurs() {
  const filtres = [
    { id: "view-trending-tv", filtre: "trending" },
    { id: "view-popular-tv", filtre: "popular" },
    { id: "view-top-rated-tv", filtre: "top_rated" },
    { id: "view-airing-today", filtre: "airing_today" },
    { id: "view-upcoming", filtre: "on_the_air" },
  ]
  filtres.forEach(({ id, filtre }) => {
    const bouton = document.getElementById(id)
    if (bouton) {
      bouton.addEventListener("click", async (e) => {
        e.preventDefault()
        console.log(`Clic sur ${id} (filtre: ${filtre})`)
        await chargerSeriesFiltres(filtre)
      })
    }
  })

  document.addEventListener("click", async (e) => {
    const lienGenre = e.target.closest(".genre-link")
    if (lienGenre) {
      e.preventDefault()
      console.log("Clic sur genre:", lienGenre.dataset.genreId)
      await gererSelectionGenre(lienGenre.dataset.genreId)
      return
    }

    const lienAnnee = e.target.closest(".year-link")
    if (lienAnnee) {
      e.preventDefault()
      console.log("Clic sur année:", lienAnnee.dataset.year)
      await gererSelectionAnnee(lienAnnee.dataset.year)
      return
    }

    const lienSociete = e.target.closest(".company-link")
    if (lienSociete) {
      e.preventDefault()
      console.log("Clic sur société:", lienSociete.dataset.companyId)
      await gererSelectionSociete(lienSociete.dataset.companyId)
    }
  })

  if (DOM.formulaireRecherche) {
    DOM.formulaireRecherche.addEventListener("submit", async (e) => {
      e.preventDefault()
      const requete = DOM.champRecherche.value.trim()
      if (requete) {
        console.log("Recherche soumise:", requete)
        await gererRecherche(requete)
      }
    })
  }

  if (DOM.champRecherche) {
    DOM.champRecherche.addEventListener("focus", () => {
      console.log("Focus sur le champ de recherche")
      if (DOM.champRecherche.value && DOM.resultatsRecherche?.children.length) {
        DOM.resultatsRecherche.style.display = "block"
      }
    })

    document.addEventListener("click", (e) => {
      if (
          DOM.formulaireRecherche &&
          DOM.resultatsRecherche &&
          !DOM.formulaireRecherche.contains(e.target) &&
          !DOM.resultatsRecherche.contains(e.target)
      ) {
        DOM.resultatsRecherche.style.display = "none"
      }
    })
  }

  const boutonDecouvrir = DOM.sectionHero?.querySelector("#discover-btn")
  if (boutonDecouvrir) {
    boutonDecouvrir.addEventListener("click", (e) => {
      const idSerie = e.currentTarget.dataset.id
      if (idSerie) afficherDetailsSerie(idSerie)
    })
  }
}

/**
 * Initialisation de l'application
 */
async function initialiser() {
  try {
    console.log("Initialisation de l'application séries...")
    await recupererGenres()
    await recupererSocietes()
    afficherAnnees()
    await chargerDonneesAccueilSeries()
    configurerEcouteurs()
    console.log("Initialisation terminée avec succès")
  } catch (erreur) {
    console.error("Erreur lors de l'initialisation:", erreur)
    afficherNotification("Erreur lors du chargement de l'application", "danger")
  }
}

document.addEventListener("DOMContentLoaded", initialiser)
