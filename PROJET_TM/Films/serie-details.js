/**
 * Gestion des détails des séries TV
 */

// Configuration
const CONFIG = {
    CLE_API: "04c35731a5ee918f014970082a0088b1",
    URL_BASE: "https://api.themoviedb.org/3",
    URL_IMAGE: "https://image.tmdb.org/t/p/w500",
    URL_IMAGE_ACTEUR: "https://image.tmdb.org/t/p/w185",
    URL_ARRIERE_PLAN: "https://image.tmdb.org/t/p/original",
    IMAGE_SUBSTITUT: "https://via.placeholder.com/500x750?text=Image+indisponible",
    AFFICHE_PAR_DEFAUT: "https://via.placeholder.com/500x750?text=Aucune+affiche",
    IMAGE_ACTEUR_SUBSTITUT: "https://via.placeholder.com/185x278?text=Aucune+photo",
    ICONE_PLATEFORME_SUBSTITUT: "images/streaming-icon1.png",
}

const ICÔNES_PLATEFORMES = {
    Netflix: "images/netflix.png",
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

const DOM = {
    addToFavorites: document.getElementById("add-to-favorites"),
    addToWatchlist: document.getElementById("add-to-watchlist"),
    markAsWatched: document.getElementById("mark-as-watched"),
    starRating: document.getElementById("star-rating"),
    btnClearRating: document.getElementById("btn-clear-rating"),
    ratingFeedback: document.getElementById("rating-feedback"),
    toastContainer: document.getElementById("toast-container"),
    serieCast: document.getElementById("serie-cast"),
    productionSection: document.getElementById("production-section"),
    serieProductionCompanies: document.getElementById("serie-production-companies"),
    serieProviders: document.getElementById("serie-providers"),
    noProviders: document.getElementById("noProviders"),
}

let auth = null
let serieId = null

function estSessionValide() {
    return Boolean(auth && auth.userId && auth.token)
}

function verifierAuthentification() {
    const donneesAuth = sessionStorage.getItem("auth")
    if (!donneesAuth) return false

    try {
        const donnees = JSON.parse(donneesAuth)
        if (donnees && donnees.userId && donnees.token) {
            auth = donnees
            return true
        }
    } catch (error) {
        console.warn("Session auth invalide, nettoyage du stockage.", error)
    }

    sessionStorage.removeItem("auth")
    auth = null
    return false
}

function obtenirUrlPlateforme(nomPlateforme, titreSerie, idSerie, typePlateforme) {
    const titreSlug = encodeURIComponent(titreSerie.toLowerCase().replace(/[^a-z0-9]+/g, "-"))
    const urlsPlateformes = {
        Netflix: `https://www.netflix.com/search?q=${encodeURIComponent(titreSerie)}`,
        "Amazon Prime Video": `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(titreSerie)}`,
        "Amazon Video": `https://www.amazon.com/s?k=${encodeURIComponent(titreSerie)}&i=instant-video`,
        "Disney Plus": `https://www.disneyplus.com/search?q=${encodeURIComponent(titreSerie)}`,
        "Apple TV Plus": `https://tv.apple.com/search?term=${encodeURIComponent(titreSerie)}`,
        "Apple TV": `https://tv.apple.com/search?term=${encodeURIComponent(titreSerie)}`,
        "Canal+": `https://www.canalplus.com/recherche/?q=${encodeURIComponent(titreSerie)}`,
        "OCS": `https://www.ocs.fr/rechercher?q=${encodeURIComponent(titreSerie)}`,
        "Google Play Movies": `https://play.google.com/store/search?q=${encodeURIComponent(titreSerie)}&c=movies`,
        "YouTube": `https://www.youtube.com/results?search_query=${encodeURIComponent(titreSerie + " series")}`,
        "FilmoTV": `https://www.filmotv.fr/fr/recherche?term=${encodeURIComponent(titreSerie)}`,
        "Microsoft Store": `https://www.microsoft.com/fr-be/store/search/movies?q=${encodeURIComponent(titreSerie)}`,
        "Skynet": `https://www.skynet.be/fr/recherche?query=${encodeURIComponent(titreSerie)}`,
        "Proximus Pickx": `https://pickx.be/fr/recherche?search=${encodeURIComponent(titreSerie)}`,
        "HBO Max": `https://play.hbomax.com/search/result?q=${encodeURIComponent(titreSerie).replace(/%20/g, "+")}`,
        "Max": `https://play.hbomax.com/search/result?q=${encodeURIComponent(titreSerie).replace(/%20/g, "+")}`,
        "Rakuten TV": `https://rakuten.tv/be/search?query=${encodeURIComponent(titreSerie)}`,
        "Telenet": `https://www.telenet.be/fr/recherche?query=${encodeURIComponent(titreSerie)}`,
        "LaCinetek": `https://www.lacinetek.com/fr/rechercher?query=${encodeURIComponent(titreSerie)}`,
    }
    return urlsPlateformes[nomPlateforme] || `https://www.themoviedb.org/tv/${idSerie}/watch`
}

async function recupererDetailsSerie(id) {
    try {
        const url = `${CONFIG.URL_BASE}/tv/${id}?api_key=${CONFIG.CLE_API}&language=fr-FR&append_to_response=credits,watch/providers,videos`
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
        return await response.json()
    } catch (error) {
        console.error("Erreur lors de la récupération des détails de la série:", error)
        afficherNotification("Impossible de charger les détails de la série", "danger")
        return null
    }
}

function afficherActeurs(acteurs) {
    if (!DOM.serieCast) {
        console.warn("Conteneur #serie-cast introuvable")
        return
    }
    if (!acteurs || acteurs.length === 0) {
        DOM.serieCast.innerHTML = '<p class="text-muted text-center w-100">Aucune information sur la distribution.</p>'
        return
    }

    DOM.serieCast.innerHTML = acteurs
        .slice(0, 18)
        .map(
            (acteur) => `
        <div class="movie-card" onclick="if(!event.target.closest('.btn-actor-favorite')) { voirActeur(${acteur.id}); }">
            <div class="movie-card-inner">
              <img src="${acteur.profile_path ? CONFIG.URL_IMAGE_ACTEUR + acteur.profile_path : CONFIG.IMAGE_ACTEUR_SUBSTITUT}"
                   class="movie-card-img"
                   alt="${acteur.name}"
                   loading="lazy"
                   onerror="this.src='${CONFIG.IMAGE_ACTEUR_SUBSTITUT}'">
              
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

    // Mettre à jour l'UI des favoris si la fonction existe
    if (typeof updateActorFavoritesUI === "function") {
        updateActorFavoritesUI()
    }
}

// Redirection vers les détails de l'acteur
function voirActeur(actorId) {
    if (actorId) {
        window.location.href = `actor-details.html?id=${actorId}`
    }
}

function afficherSaisons(saisons) {
    const conteneurSaisons = document.getElementById("serie-seasons")
    if (!conteneurSaisons) {
        console.warn("Conteneur #serie-seasons introuvable")
        return
    }

    if (!saisons || saisons.length === 0) {
        conteneurSaisons.innerHTML = '<p class="text-muted text-center w-100">Aucune saison disponible.</p>'
        return
    }

    // Filtrer les saisons (exclure la saison 0 qui est généralement des spéciaux)
    const saisonsValides = saisons.filter(s => s.season_number > 0)

    conteneurSaisons.innerHTML = `
    <div class="seasons-grid">
      ${saisonsValides
        .map(
            (saison) => `
        <div class="season-card" onclick="voirSaison(${serieId}, ${saison.season_number})">
          <div class="season-card-image">
            <img src="${saison.poster_path ? CONFIG.URL_IMAGE + saison.poster_path : CONFIG.AFFICHE_PAR_DEFAUT}"
                 alt="Saison ${saison.season_number}"
                 class="season-img"
                 loading="lazy"
                 onerror="this.src='${CONFIG.AFFICHE_PAR_DEFAUT}'">
          </div>
          
          <div class="season-info">
            <h5 class="season-name">Saison ${saison.season_number}</h5>
            <div class="season-meta d-flex align-items-center justify-content-between">
              <span style="color: rgba(255, 255, 255, 0.9);">
                <i class="ph ph-video me-1"></i>
                ${saison.episode_count || 0} ép.
              </span>
              ${saison.air_date ? `<span style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem;">${new Date(saison.air_date).getFullYear()}</span>` : ""}
            </div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `
}

// Redirection vers les détails de la saison
function voirSaison(serieId, seasonNumber) {
    if (serieId && seasonNumber !== undefined) {
        window.location.href = `saison-details.html?serieId=${serieId}&season=${seasonNumber}`
    }
}

function afficherSocietesProduction(productionCompanies) {
    if (!DOM.serieProductionCompanies || !DOM.productionSection) return

    if (!productionCompanies || productionCompanies.length === 0) {
        DOM.productionSection.style.display = "none"
        return
    }

    DOM.productionSection.style.display = "block"
    DOM.serieProductionCompanies.innerHTML = `
        <div class="production-companies-grid">
            ${productionCompanies
                .map(
                    (company) => `
                <div class="production-company-card">
                    <div class="production-logo-container">
                        ${
                            company.logo_path
                                ? `<img src="${CONFIG.URL_IMAGE}${company.logo_path}" 
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
            `,
                )
                .join("")}
        </div>
    `
}

function afficherPlateformesEtDistributeurs({ plateformes, titreSerie }) {
    if (!DOM.serieProviders || !DOM.noProviders) {
        console.warn("Conteneur #serie-providers ou #noProviders introuvable")
        return
    }

    const contenu = Object.entries(plateformes)
        .map(([type, listePlateformes]) => {
            if (listePlateformes.length === 0) return ""
            return `
      <div class="provider-section">
        <h3><i class="ph ph-${type === "Streaming" ? "play" : type === "Achat" ? "shopping-cart" : "clock"}"></i> ${type}</h3>
        <div class="vod-providers-grid">
          ${listePlateformes
                .map(
                    (plateforme) => {
                        // Utiliser le logo de l'API si disponible, sinon repli sur l'icône locale, sinon icône par défaut
                        const logoUrl = plateforme.logo_path 
                            ? `${CONFIG.URL_IMAGE}${plateforme.logo_path}`
                            : (ICÔNES_PLATEFORMES[plateforme.provider_name] || CONFIG.ICONE_PLATEFORME_SUBSTITUT);
                            
                        return `
            <a href="${obtenirUrlPlateforme(plateforme.provider_name, titreSerie, serieId, type)}"
               class="vod-provider-card"
               target="_blank"
               rel="noopener noreferrer"
               title="${plateforme.provider_name} (${type})">
              <img src="${logoUrl}"
                   class="vod-provider-logo"
                   alt="${plateforme.provider_name}"
                   onerror="this.src='${CONFIG.ICONE_PLATEFORME_SUBSTITUT}'">
              <div class="vod-provider-name">${plateforme.provider_name}</div>
              <span class="vod-provider-type">${type}</span>
            </a>
          `;
                    }
                )
                .join("")}
        </div>
      </div>
    `
        })
        .join("")

    DOM.serieProviders.innerHTML = contenu
    DOM.noProviders.classList.toggle("d-none", contenu.length > 0)
}

async function verifierPresenceDansListe(type) {
    if (!auth || !serieId) return false
    try {
        const response = await fetch(`${type}.php?user_id=${auth.userId}&film_id=${serieId}&media_type=tv`, {
            method: "GET",
            headers: { Accept: "application/json" },
        })
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
        const data = await response.json()
        if (type === "favorites") return data.success && data.is_favorite
        if (type === "watchlist") return data.success && data.is_in_watchlist
        if (type === "watched") return data.success && data.is_watched
        return false
    } catch (error) {
        console.error(`Erreur lors de la vérification de ${type}:`, error)
        return false
    }
}

async function verifierNoteSerie() {
    if (!auth || !serieId) return 0
    try {
        const response = await fetch(`notes.php?user_id=${auth.userId}&film_id=${serieId}&media_type=tv`, {
            method: "GET",
            headers: { Accept: "application/json" },
        })
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
        const data = await response.json()
        return data.success && data.note ? Number.parseInt(data.note) : 0
    } catch (error) {
        console.error("Erreur lors de la vérification de la note:", error)
        return 0
    }
}

function setFeedbackNote(message, type = "secondary") {
    if (!DOM.ratingFeedback) return
    DOM.ratingFeedback.textContent = message
    DOM.ratingFeedback.className = `rating-feedback mt-2 text-${type}`
}

function mettreAJourEtoiles(note) {
    if (!DOM.starRating) return
    const etoiles = DOM.starRating.querySelectorAll(".star")
    etoiles.forEach((etoile) => {
        const valeur = Number.parseInt(etoile.getAttribute("data-value"))
        if (valeur <= note) {
            etoile.classList.add("filled")
            etoile.classList.replace("ph-star", "ph-star-fill")
        } else {
            etoile.classList.remove("filled")
            etoile.classList.replace("ph-star-fill", "ph-star")
        }
        etoile.setAttribute("aria-checked", valeur === note ? "true" : "false")
    })

    // Mettre à jour le feedback
    if (note > 0) {
        setFeedbackNote(`Votre note locale: ${note}/10`, "success")
    } else if (!estSessionValide()) {
        setFeedbackNote("Connectez-vous pour ajouter votre note locale.", "secondary")
    } else {
        setFeedbackNote("Cliquez sur une étoile pour noter cette série.", "secondary")
    }

    // Gérer la visibilité du bouton d'annulation
    if (DOM.btnClearRating) {
        DOM.btnClearRating.style.display = note > 0 ? "flex" : "none"
    }
}

async function annulerNote() {
    if (!estSessionValide() || !serieId) return
    await gererNoteSerie(0)
}

async function mettreAJourBoutons() {
    if (!auth || !serieId) return

    const [estFavori, estDansWatchlist, estVu, note] = await Promise.all([
        verifierPresenceDansListe("favorites"),
        verifierPresenceDansListe("watchlist"),
        verifierPresenceDansListe("watched"),
        verifierNoteSerie(),
    ])

    if (DOM.addToFavorites) {
        DOM.addToFavorites.innerHTML = estFavori
            ? '<i class="ph ph-heart"></i> Retirer des favoris'
            : '<i class="ph ph-heart"></i> Ajouter aux favoris'
        DOM.addToFavorites.className = estFavori ? "btn btn-outline-primary btn-lg" : "btn btn-primary btn-lg"
    }

    if (DOM.addToWatchlist) {
        DOM.addToWatchlist.innerHTML = estDansWatchlist
            ? '<i class="ph ph-clock"></i> Retirer de la watchlist'
            : '<i class="ph ph-clock"></i> À regarder plus tard'
        DOM.addToWatchlist.className = estDansWatchlist ? "btn btn-outline-warning btn-lg" : "btn btn-warning btn-lg"
    }

    if (DOM.markAsWatched) {
        DOM.markAsWatched.innerHTML = estVu
            ? '<i class="ph ph-check-circle"></i> Retirer des vus'
            : '<i class="ph ph-check-circle"></i> Déjà vu'
        DOM.markAsWatched.className = estVu ? "btn btn-outline-success btn-lg" : "btn btn-success btn-lg"
    }

    mettreAJourEtoiles(note)
}

async function gererActionListe(type, ajouter) {
    if (!estSessionValide() || !serieId) {
        afficherNotification("Veuillez vous connecter pour modifier vos listes", "warning")
        return false
    }

    const method = ajouter ? "POST" : "DELETE"
    try {
        const response = await fetch(`${type}.php`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth.token}`,
                Accept: "application/json",
            },
            body: JSON.stringify({
                user_id: auth.userId,
                film_id: Number(serieId),
                media_type: "tv"
            }),
        })
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
        const data = await response.json()
        if (data.success) {
            const action = ajouter ? "ajoutée à" : "retirée de"
            const libelle = type === "favorites" ? "favoris" : type === "watchlist" ? "watchlist" : "vues"
            afficherNotification(`Série ${action} ${libelle}`, "success")
            await mettreAJourBoutons()
            document.dispatchEvent(new Event("listeMiseAJour"))
            return true
        }
        throw new Error(data.message || `Échec de l'action sur ${type}`)
    } catch (error) {
        console.error(`Erreur lors de l'action sur ${type}:`, error)
        afficherNotification(`Erreur: ${error.message}`, "danger")
        return false
    }
}

async function gererNoteSerie(note) {
    if (!estSessionValide() || !serieId) {
        afficherNotification("Veuillez vous connecter pour noter cette série", "warning")
        return false
    }

    const method = note > 0 ? "POST" : "DELETE"
    try {
        const response = await fetch(`notes.php`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth.token}`,
                Accept: "application/json",
            },
            body: JSON.stringify({
                user_id: auth.userId,
                film_id: Number(serieId),
                note,
            }),
        })
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
        const data = await response.json()
        if (data.success) {
            const message = note > 0 ? `Note de ${note} étoile(s) enregistrée` : "Note supprimée"
            afficherNotification(message, "success")
            mettreAJourEtoiles(note)
            document.dispatchEvent(new Event("listeMiseAJour"))
            return true
        }
        throw new Error(data.message || "Échec de l'action sur la note")
    } catch (error) {
        console.error("Erreur lors de l'action sur la note:", error)
        afficherNotification(`Erreur: ${error.message}`, "danger")
        return false
    }
}

function afficherNotification(message, type = "info") {
    if (!DOM.toastContainer) {
        console.warn("Conteneur de notification introuvable")
        return
    }

    const toast = document.createElement("div")
    toast.className = `toast show align-items-center text-white bg-${type} border-0`
    toast.role = "alert"
    toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `

    DOM.toastContainer.appendChild(toast)
    const bsToast = new window.bootstrap.Toast(toast)
    bsToast.show()
    toast.addEventListener("hidden.bs.toast", () => toast.remove())
}

// Éléments du DOM pour l'authentification
const AUTH_DOM = {
    lienConnexion: document.getElementById("login-link"),
    lienDeconnexion: document.getElementById("logout-link"),
    lienProfil: document.getElementById("profile-link"),
    lienAdmin: document.getElementById("admin-link"),
}

// Gestion de l'authentification
function verifierAuthentification() {
    const donneesAuth = sessionStorage.getItem("auth")
    if (donneesAuth) {
        return JSON.parse(donneesAuth)
    }
    return null
}

function mettreAJourInterfaceAuthentification() {
    const auth = verifierAuthentification()
    const estConnecte = !!auth
    const roleUtilisateur = auth?.role || ""

    if (AUTH_DOM.lienConnexion) AUTH_DOM.lienConnexion.classList.toggle("d-none", estConnecte)
    if (AUTH_DOM.lienProfil) AUTH_DOM.lienProfil.classList.toggle("d-none", !estConnecte)
    if (AUTH_DOM.lienDeconnexion) AUTH_DOM.lienDeconnexion.classList.toggle("d-none", !estConnecte)
    if (AUTH_DOM.lienAdmin) AUTH_DOM.lienAdmin.classList.toggle("d-none", !estConnecte || roleUtilisateur !== "admin")

    const lienProfilAncre = AUTH_DOM.lienProfil
        ? (AUTH_DOM.lienProfil.tagName === "A" ? AUTH_DOM.lienProfil : AUTH_DOM.lienProfil.querySelector("a"))
        : null

    if (lienProfilAncre) {
        lienProfilAncre.setAttribute("href", "profilUser.html")
        if (estConnecte && auth.pseudo) {
            lienProfilAncre.innerHTML = `<i class="ph ph-user me-2"></i> ${auth.pseudo}`
        }
    }

    if (AUTH_DOM.lienDeconnexion) {
        AUTH_DOM.lienDeconnexion.addEventListener("click", (e) => {
            e.preventDefault()
            sessionStorage.removeItem("auth")
            window.location.reload()
        })
    }
}

async function chargerDetailsSerie() {
    // ... existant ...
    mettreAJourInterfaceAuthentification()
    serieId = new URLSearchParams(window.location.search).get("id")
    if (!serieId) {
        window.location.href = "../../series.html"
        return
    }

    try {
        const serie = await recupererDetailsSerie(serieId)
        if (!serie) {
            afficherNotification("Impossible de charger les détails de la série", "danger")
            window.location.href = "../../series.html"
            return
        }

        document.getElementById("serie-hero-section").style.backgroundImage =
            `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${serie.backdrop_path ? CONFIG.URL_ARRIERE_PLAN + serie.backdrop_path : CONFIG.IMAGE_SUBSTITUT})`

        document.getElementById("serie-title").textContent =
            `${serie.name} (${serie.first_air_date?.substring(0, 4) || "N/A"})`

        document.getElementById("serie-tags").innerHTML = `
      <span class="badge bg-primary">${serie.genres?.[0]?.name || "Série"}</span>
      ${serie.episode_run_time?.[0] ? `<span class="badge bg-secondary">${serie.episode_run_time[0]} min/ep</span>` : ""}
      <span class="badge ${obtenirClasseNote(serie.vote_average)}">
        <i class="ph ph-star"></i> ${serie.vote_average?.toFixed(1) || "0.0"}/10
      </span>
    `

        document.getElementById("serie-overview").textContent = serie.overview || "Aucun synopsis disponible."
        document.getElementById("serie-poster").src = serie.poster_path
            ? CONFIG.URL_IMAGE + serie.poster_path
            : CONFIG.AFFICHE_PAR_DEFAUT
        document.getElementById("serie-poster").alt = serie.name

        if (serie.credits?.cast) afficherActeurs(serie.credits.cast)

        if (serie.seasons) afficherSaisons(serie.seasons)

        if (serie.production_companies) {
            afficherSocietesProduction(serie.production_companies)
        }

        const plateformes = serie["watch/providers"]?.results?.BE || {}
        const typesPlateformes = {
            Streaming: plateformes.flatrate || [],
            Location: plateformes.rent || [],
            Achat: plateformes.buy || [],
        }
        afficherPlateformesEtDistributeurs({ plateformes: typesPlateformes, titreSerie: serie.name })

        const bandeAnnonce = serie.videos?.results?.find((v) => v.site === "YouTube" && v.type === "Trailer")
        const conteneurBandeAnnonce = document.getElementById("serie-trailer")
        if (bandeAnnonce) {
            conteneurBandeAnnonce.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${bandeAnnonce.key}" frameborder="0" allowfullscreen></iframe>
      `
            document.getElementById("watch-trailer").href = `https://www.youtube.com/watch?v=${bandeAnnonce.key}`
            document.getElementById("watch-trailer").style.display = "inline-flex"
        } else {
            conteneurBandeAnnonce.innerHTML = `
        <div class="alert alert-info">
          <i class="ph ph-info"></i> Aucune bande-annonce disponible.
        </div>
      `
        }
    } catch (erreur) {
        console.error("Erreur:", erreur)
        afficherNotification("Erreur de chargement des détails", "danger")
    }
}

function obtenirClasseNote(note) {
    if (note >= 8) return "bg-success"
    if (note >= 5) return "bg-warning"
    return "bg-danger"
}

document.addEventListener("DOMContentLoaded", async () => {
    if (!verifierAuthentification()) {
        if (DOM.addToFavorites) DOM.addToFavorites.disabled = true
        if (DOM.addToWatchlist) DOM.addToWatchlist.disabled = true
        if (DOM.markAsWatched) DOM.markAsWatched.disabled = true
        if (DOM.starRating) {
            DOM.starRating.classList.add("disabled")
            DOM.starRating.querySelectorAll(".star").forEach((etoile) => {
                etoile.disabled = true
                etoile.setAttribute("aria-disabled", "true")
            })
        }
        afficherNotification("Veuillez vous connecter pour gérer vos listes et noter des séries", "warning")
    }

    await chargerDetailsSerie()
    await mettreAJourBoutons()

    if (DOM.addToFavorites) {
        DOM.addToFavorites.addEventListener("click", async () => {
            const estFavori = await verifierPresenceDansListe("favorites")
            await gererActionListe("favorites", !estFavori)
        })
    }

    if (DOM.addToWatchlist) {
        DOM.addToWatchlist.addEventListener("click", async () => {
            const estDansWatchlist = await verifierPresenceDansListe("watchlist")
            await gererActionListe("watchlist", !estDansWatchlist)
        })
    }

    if (DOM.markAsWatched) {
        DOM.markAsWatched.addEventListener("click", async () => {
            const estVu = await verifierPresenceDansListe("watched")
            await gererActionListe("watched", !estVu)
        })
    }

    if (DOM.btnClearRating) {
        DOM.btnClearRating.addEventListener("click", annulerNote)
    }

    if (DOM.starRating) {
        const etoiles = DOM.starRating.querySelectorAll(".star")
        etoiles.forEach((etoile) => {
            etoile.addEventListener("click", async () => {
                if (!estSessionValide()) {
                    afficherNotification("Veuillez vous connecter pour noter cette série", "warning")
                    return
                }
                const note = Number.parseInt(etoile.getAttribute("data-value"))
                const noteActuelle = await verifierNoteSerie()
                const nouvelleNote = note === noteActuelle ? 0 : note
                await gererNoteSerie(nouvelleNote)
            })

            etoile.addEventListener("keydown", async (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    if (!estSessionValide()) {
                        afficherNotification("Veuillez vous connecter pour noter cette série", "warning")
                        return
                    }
                    const note = Number.parseInt(etoile.getAttribute("data-value"))
                    const noteActuelle = await verifierNoteSerie()
                    const nouvelleNote = note === noteActuelle ? 0 : note
                    await gererNoteSerie(nouvelleNote)
                }
            })
        })
    }
})
