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
    ICONE_PLATEFORME_SUBSTITUT: "../images/streaming-icon1.png",
}

const ICÔNES_PLATEFORMES = {
    Netflix: "../images/netflix.png",
    "Amazon Prime Video": "../images/amazon_prime_video.png",
    "Amazon Video": "../images/amazon_video.png",
    "Disney Plus": "../images/disney_plus.png",
    "Apple TV Plus": "../images/apple_tv_plus.png",
    "Apple TV": "../images/apple_tv.png",
    "Canal+": "../images/canal_plus.png",
    "OCS": "../images/ocs.png",
    "Google Play Movies": "../images/google_play_movies.png",
    "YouTube": "../images/youtube.png",
    "FilmoTV": "../images/filmotv.png",
    "Microsoft Store": "../images/microsoft_store.png",
    "Skynet": "../images/skynet.png",
    "Proximus Pickx": "../images/proximus_pickx.png",
    "HBO Max": "../images/hbo_max.png",
   "Max": "../images/hbo_max.png",
    "Rakuten TV": "../images/rakuten_tv.png",
    "Telenet": "../images/telenet.png",
    "LaCinetek": "../images/lacinetek.png",
}

const DOM = {
    addToFavorites: document.getElementById("add-to-favorites"),
    addToWatchlist: document.getElementById("add-to-watchlist"),
    markAsWatched: document.getElementById("mark-as-watched"),
    starRating: document.getElementById("star-rating"),
    toastContainer: document.getElementById("toast-container"),
    serieCast: document.getElementById("serie-cast"),
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
        "HBO Max": `https://play.max.com/`,
        "Max": `https://play.max.com/`,
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
        DOM.serieCast.innerHTML = '<p class="text-muted">Aucune information sur la distribution.</p>'
        return
    }

    DOM.serieCast.innerHTML = `
    <div class="actors-container">
      ${acteurs
        .slice(0, 20)
        .map(
            (acteur, index) => `
        <div class="actor-card" data-actor-id="${acteur.id}" data-index="${index}">
          <div class="actor-card-image">
            <img src="${acteur.profile_path ? CONFIG.URL_IMAGE_ACTEUR + acteur.profile_path : CONFIG.IMAGE_ACTEUR_SUBSTITUT}"
                 alt="${acteur.name}"
                 class="actor-image"
                 loading="lazy"
                 onerror="this.src='${CONFIG.IMAGE_ACTEUR_SUBSTITUT}'">
            <div class="actor-rank-badge">#${index + 1}</div>
            <div class="actor-overlay">
              <div class="overlay-content">
                <div class="actor-icon"><i class="ph ph-star-fill"></i></div>
                <span class="view-detail">Voir Détails</span>
              </div>
            </div>
          </div>
          <div class="actor-info">
            <h5 class="actor-name">${acteur.name}</h5>
            <p class="actor-character">${acteur.character ? acteur.character : "Rôle inconnu"}</p>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `

    const style = document.createElement("style")
    style.innerHTML = `
    .actors-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1.5rem;
      width: 100%;
    }
    
    .actor-card {
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
    }
    
    .actor-card:hover {
      transform: translateY(-16px) rotateX(5deg);
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.35), 0 0 40px rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.4);
    }
    
    .actor-card-image {
      position: relative;
      width: 100%;
      padding-bottom: 150%;
      overflow: hidden;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    }
    
    .actor-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.4s ease;
    }
    
    .actor-card:hover .actor-image {
      transform: scale(1.15) rotate(-2deg);
      filter: brightness(1.2) saturate(1.1);
    }
    
    .actor-rank-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      z-index: 2;
    }
    
    .actor-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.95) 100%);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      transition: opacity 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 3;
    }
    
    .actor-card:hover .actor-overlay {
      opacity: 1;
    }
    
    .overlay-content {
      text-align: center;
      animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      opacity: 0;
    }
    
    .actor-card:hover .overlay-content {
      animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s forwards;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .actor-icon {
      font-size: 32px;
      color: #3b82f6;
      margin-bottom: 8px;
      display: flex;
      justify-content: center;
      filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
    }
    
    .view-detail {
      display: block;
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    
    .actor-info {
      padding: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    }
    
    .actor-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 6px 0;
      line-height: 1.3;
      word-break: break-word;
    }
    
    .actor-character {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
      line-height: 1.3;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    @media (max-width: 1024px) {
      .actors-container {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 1.25rem;
      }
      
      .actor-card {
        border-radius: 10px;
      }
    }
    
    @media (max-width: 768px) {
      .actors-container {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 1rem;
      }
      
      .actor-card-image {
        padding-bottom: 140%;
      }
      
      .actor-rank-badge {
        width: 32px;
        height: 32px;
        font-size: 0.8rem;
      }
      
      .actor-info {
        padding: 12px;
      }
      
      .actor-name {
        font-size: 0.85rem;
      }
      
      .actor-character {
        font-size: 0.75rem;
      }
    }
    
    @media (max-width: 576px) {
      .actors-container {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 0.8rem;
      }
      
      .actor-card {
        border-radius: 8px;
      }
      
      .actor-card-image {
        padding-bottom: 135%;
      }
      
      .actor-rank-badge {
        width: 28px;
        height: 28px;
        font-size: 0.7rem;
        top: 8px;
        left: 8px;
      }
      
      .actor-icon {
        font-size: 24px;
        margin-bottom: 6px;
      }
      
      .view-detail {
        font-size: 0.75rem;
      }
      
      .actor-info {
        padding: 10px;
      }
      
      .actor-name {
        font-size: 0.8rem;
      }
      
      .actor-character {
        font-size: 0.7rem;
      }
    }
  `
    document.head.appendChild(style)

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
        conteneurSaisons.innerHTML = '<p class="text-muted">Aucune saison disponible.</p>'
        return
    }

    // Filtrer les saisons (exclure la saison 0 qui est généralement des spéciaux)
    const saisonsValides = saisons.filter(s => s.season_number > 0)

    conteneurSaisons.innerHTML = `
    <div class="seasons-grid">
      ${saisonsValides
        .map(
            (saison) => `
        <div class="season-card position-relative rounded overflow-hidden" data-season="${saison.season_number}" style="cursor: pointer;">
          <img src="${saison.poster_path ? CONFIG.URL_IMAGE + saison.poster_path : CONFIG.AFFICHE_PAR_DEFAUT}"
               alt="Saison ${saison.season_number}"
               class="season-img w-100 h-100"
               loading="lazy"
               onerror="this.src='${CONFIG.AFFICHE_PAR_DEFAUT}'">
          
          <div class="season-overlay position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-between p-3">
            <div class="season-header">
              <span class="season-badge bg-primary text-white px-2 py-1 rounded d-inline-block fw-bold">
                Saison ${saison.season_number}
              </span>
            </div>
            
            <div class="season-footer text-white">
              <h6 class="mb-2 fw-bold" style="font-size: 1.1rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                Saison ${saison.season_number}
              </h6>
              <div class="d-flex align-items-center justify-content-between" style="font-size: 0.9rem;">
                <span class="d-flex align-items-center">
                  <i class="ph ph-video me-1"></i>
                  ${saison.episode_count || 0} épisode${saison.episode_count > 1 ? 's' : ''}
                </span>
                ${saison.air_date ? `<span class="ms-2">${new Date(saison.air_date).getFullYear()}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `

    // Ajouter les styles pour les saisons
    const style = document.createElement("style")
    style.innerHTML = `
    .seasons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
    }
    
    .season-card {
      height: 300px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .season-card:hover {
      transform: translateY(-12px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border-color: rgba(255, 255, 255, 0.2);
    }
    
    .season-img {
      object-fit: cover;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: block;
    }
    
    .season-card:hover .season-img {
      transform: scale(1.08);
    }
    
    .season-overlay {
      background: linear-gradient(to bottom, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.3) 40%, rgba(15, 23, 42, 0.95) 100%);
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 10;
    }
    
    .season-card:hover .season-overlay {
      opacity: 1;
    }
    
    .season-header {
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
    }
    
    .season-card:hover .season-header {
      opacity: 1;
      transform: translateY(0);
    }
    
    .season-badge {
      font-size: 0.85rem;
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }
    
    .season-footer {
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
    }
    
    .season-footer h6 {
      letter-spacing: 0.5px;
    }
    
    @media (max-width: 768px) {
      .seasons-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 1rem;
      }
      
      .season-card {
        height: 225px;
      }
    }
    
    @media (max-width: 576px) {
      .seasons-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.75rem;
      }
      
      .season-card {
        height: 180px;
      }
      
      .season-footer h6 {
        font-size: 0.9rem !important;
      }
      
      .season-footer {
        font-size: 0.8rem !important;
      }
    }
  `
    document.head.appendChild(style)

    // Ajouter les écouteurs de clics pour les cartes de saisons
    configurerEcouteursSaisons()
}

function configurerEcouteursSaisons() {
    document.querySelectorAll(".season-card").forEach(carte => {
        carte.addEventListener("click", () => {
            const numeroSaison = carte.dataset.season
            afficherMessageSaison(numeroSaison)
        })
    })
}

function afficherMessageSaison(numeroSaison) {
    afficherNotification(`Saison ${numeroSaison} sélectionnée - Détails des épisodes à venir`, "info")
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
                    (plateforme) => `
            <a href="${obtenirUrlPlateforme(plateforme.provider_name, titreSerie, serieId, type)}"
               class="vod-provider-card"
               target="_blank"
               rel="noopener noreferrer"
               title="${plateforme.provider_name} (${type})">
              <img src="${ICÔNES_PLATEFORMES[plateforme.provider_name] || CONFIG.ICONE_PLATEFORME_SUBSTITUT}"
                   class="vod-provider-logo"
                   alt="${plateforme.provider_name}"
                   onerror="this.src='${CONFIG.ICONE_PLATEFORME_SUBSTITUT}'">
              <div class="vod-provider-name">${plateforme.provider_name}</div>
              <span class="vod-provider-type">${type}</span>
            </a>
          `,
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
        const response = await fetch(`${type}.php?user_id=${auth.userId}&film_id=${serieId}`, {
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
        const response = await fetch(`notes.php?user_id=${auth.userId}&film_id=${serieId}`, {
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

async function chargerDetailsSerie() {
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

        const conteneurProduction = document.getElementById("serie-production")
        if (serie.production_companies?.length) {
            conteneurProduction.innerHTML = serie.production_companies
                .slice(0, 3)
                .map((societe) => `<span class="badge bg-dark me-2">${societe.name}</span>`)
                .join("")
        } else {
            conteneurProduction.innerHTML = "<p>Aucune information sur la production.</p>"
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
})}
