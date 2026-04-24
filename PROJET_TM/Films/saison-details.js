/**
 * Gestion des détails des saisons de séries TV
 */

// Configuration
const CONFIG = {
    CLE_API: "04c35731a5ee918f014970082a0088b1",
    URL_BASE: "https://api.themoviedb.org/3",
    URL_IMAGE: "https://image.tmdb.org/t/p/w500",
    URL_STILL: "https://image.tmdb.org/t/p/w300",
    URL_ARRIERE_PLAN: "https://image.tmdb.org/t/p/original",
    AFFICHE_PAR_DEFAUT: "https://via.placeholder.com/500x750?text=Aucune+affiche",
    STILL_PAR_DEFAUT: "https://via.placeholder.com/300x169?text=Aucune+image",
}

const DOM = {
    episodesContainer: document.getElementById("episodes-container"),
    seasonTitle: document.getElementById("season-title"),
    seasonOverview: document.getElementById("season-overview"),
    seasonTags: document.getElementById("season-tags"),
    seasonPoster: document.getElementById("season-poster"),
    seasonHeroSection: document.getElementById("season-hero-section"),
    breadcrumbSerieName: document.getElementById("breadcrumb-serie-name"),
    breadcrumbSeasonName: document.getElementById("breadcrumb-season-name"),
    toastContainer: document.getElementById("toast-container"),
    seasonCast: document.getElementById("season-cast"),
    seasonPosters: document.getElementById("season-posters"),
    seasonVideos: document.getElementById("season-videos"),
}

let serieId = null
let seasonNumber = null

async function recupererVideosSaison(serieId, seasonNumber) {
    try {
        const url = `${CONFIG.URL_BASE}/tv/${serieId}/season/${seasonNumber}/videos?api_key=${CONFIG.CLE_API}&language=fr-FR`
        let response = await fetch(url)
        let data = await response.json()
        
        // Si pas de vidéos en FR, essayer en EN
        if (!data.results || data.results.length === 0) {
            const urlEn = `${CONFIG.URL_BASE}/tv/${serieId}/season/${seasonNumber}/videos?api_key=${CONFIG.CLE_API}`
            response = await fetch(urlEn)
            data = await response.json()
        }
        
        return data
    } catch (error) {
        console.error("Erreur lors de la récupération des vidéos de la saison:", error)
        return { results: [] }
    }
}

function afficherVideos(videos) {
    if (!DOM.seasonVideos) return

    if (!videos || videos.length === 0) {
        const section = DOM.seasonVideos.closest('.content-section')
        if (section) section.style.display = 'none'
        return
    }

    DOM.seasonVideos.innerHTML = videos
        .slice(0, 6) // Limiter aux 6 premières vidéos
        .map(
            (video) => `
        <div class="video-card">
            <div class="video-wrapper">
                <iframe src="https://www.youtube.com/embed/${video.key}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen></iframe>
            </div>
            <div class="video-info p-3">
                <h6 class="video-title text-truncate mb-1" title="${video.name}">${video.name}</h6>
                <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle">${video.type}</span>
            </div>
        </div>
    `
        )
        .join("")
}

async function recupererImagesSaison(serieId, seasonNumber) {
    try {
        const url = `${CONFIG.URL_BASE}/tv/${serieId}/season/${seasonNumber}/images?api_key=${CONFIG.CLE_API}`
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
        return await response.json()
    } catch (error) {
        console.error("Erreur lors de la récupération des images de la saison:", error)
        return { posters: [] }
    }
}

function afficherPosters(posters) {
    if (!DOM.seasonPosters) return

    if (!posters || posters.length === 0) {
        const section = DOM.seasonPosters.closest('.content-section')
        if (section) section.style.display = 'none'
        return
    }

    DOM.seasonPosters.innerHTML = posters
        .slice(0, 15)
        .map(
            (poster) => `
        <div class="image-card">
            <div class="image-card-inner image-card-poster">
                <img src="${CONFIG.URL_IMAGE + poster.file_path}" 
                     class="image-card-img" 
                     alt="Poster saison"
                     loading="lazy"
                     onclick="window.open('${CONFIG.URL_ARRIERE_PLAN + poster.file_path}', '_blank')">
            </div>
        </div>
    `
        )
        .join("")
}

async function recupererDetailsSaison(serieId, seasonNumber) {
    try {
        const url = `${CONFIG.URL_BASE}/tv/${serieId}/season/${seasonNumber}?api_key=${CONFIG.CLE_API}&language=fr-FR`
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
        return await response.json()
    } catch (error) {
        console.error("Erreur lors de la récupération des détails de la saison:", error)
        return null
    }
}

async function recupererDetailsSerie(serieId) {
    try {
        const url = `${CONFIG.URL_BASE}/tv/${serieId}?api_key=${CONFIG.CLE_API}&language=fr-FR`
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
        return await response.json()
    } catch (error) {
        console.error("Erreur lors de la récupération des détails de la série:", error)
        return null
    }
}

async function recupererCreditsSaison(serieId, seasonNumber) {
    try {
        const url = `${CONFIG.URL_BASE}/tv/${serieId}/season/${seasonNumber}/credits?api_key=${CONFIG.CLE_API}&language=fr-FR`
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
        return await response.json()
    } catch (error) {
        console.error("Erreur lors de la récupération des crédits de la saison:", error)
        return null
    }
}

function afficherActeurs(acteurs) {
    if (!DOM.seasonCast) return
    
    if (!acteurs || acteurs.length === 0) {
        DOM.seasonCast.innerHTML = '<p class="text-muted text-center w-100">Aucune information sur la distribution pour cette saison.</p>'
        return
    }

    DOM.seasonCast.innerHTML = acteurs
        .slice(0, 18)
        .map(
            (acteur) => `
        <div class="movie-card" onclick="voirActeur(${acteur.id})">
            <div class="movie-card-inner">
              <img src="${acteur.profile_path ? "https://image.tmdb.org/t/p/w185" + acteur.profile_path : "https://via.placeholder.com/185x278?text=Aucune+photo"}"
                   class="movie-card-img"
                   alt="${acteur.name}"
                   loading="lazy"
                   onerror="this.src='https://via.placeholder.com/185x278?text=Aucune+photo'">
              
              <div class="movie-card-overlay">
                <div class="text-white w-100">
                  <h6 class="mb-1 fw-bold movie-title" style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; font-size: 1rem; -webkit-text-fill-color: white;">${acteur.name}</h6>
                  <small class="d-block" style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; color: rgba(255, 255, 255, 0.8); font-size: 0.8rem;">${acteur.character || "Rôle inconnu"}</small>
                </div>
              </div>
            </div>
        </div>
      `,
        )
        .join("")
}

function voirActeur(actorId) {
    if (actorId) {
        window.location.href = `actor-details.html?id=${actorId}`
    }
}

function afficherEpisodes(episodes) {
    if (!DOM.episodesContainer) return

    if (!episodes || episodes.length === 0) {
        DOM.episodesContainer.innerHTML = '<div class="col-12 text-center text-muted">Aucun épisode trouvé pour cette saison.</div>'
        return
    }

    DOM.episodesContainer.innerHTML = episodes
        .map(
            (episode) => {
                // Extraire le réalisateur
                const director = episode.crew?.find(person => person.job === "Director");
                
                // Prendre les 3 premiers invités
                const topGuests = episode.guest_stars?.slice(0, 3).map(g => g.name).join(", ");

                return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="episode-card">
                    <div class="position-relative">
                        <img src="${episode.still_path ? CONFIG.URL_STILL + episode.still_path : CONFIG.STILL_PAR_DEFAUT}" 
                             alt="${episode.name}" 
                             class="episode-image"
                             onerror="this.src='${CONFIG.STILL_PAR_DEFAUT}'">
                        ${episode.vote_average ? `
                            <div class="episode-rating-badge">
                                <i class="ph-fill ph-star"></i> ${episode.vote_average.toFixed(1)}
                            </div>
                        ` : ""}
                    </div>
                    <div class="episode-content">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="episode-number">Épisode ${episode.episode_number}</span>
                            <span class="episode-air-date">${episode.air_date ? new Date(episode.air_date).toLocaleDateString("fr-FR", {day: 'numeric', month: 'short'}) : ""}</span>
                        </div>
                        <h3 class="episode-title">${episode.name}</h3>
                        
                        ${director ? `<p class="episode-director"><strong>Réalisé par :</strong> ${director.name}</p>` : ""}
                        
                        <p class="episode-overview">${episode.overview || "Pas de synopsis disponible."}</p>
                        
                        ${topGuests ? `
                            <div class="episode-guests mt-3">
                                <small class="text-muted"><i class="ph ph-users me-1"></i> Avec : ${topGuests}...</small>
                            </div>
                        ` : ""}
                    </div>
                </div>
            </div>
        `
            }
        )
        .join("")
}

// Éléments du DOM pour l'authentification
const AUTH_DOM = {
    lienConnexion: document.getElementById("login-link"),
    lienDeconnexion: document.getElementById("logout-link"),
    lienProfil: document.getElementById("profile-link"),
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

    if (AUTH_DOM.lienConnexion) AUTH_DOM.lienConnexion.classList.toggle("d-none", estConnecte)
    if (AUTH_DOM.lienProfil) AUTH_DOM.lienProfil.classList.toggle("d-none", !estConnecte)
    if (AUTH_DOM.lienDeconnexion) AUTH_DOM.lienDeconnexion.classList.toggle("d-none", !estConnecte)

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

async function chargerDetailsSaison() {
    // ... existant ...
    mettreAJourInterfaceAuthentification()
    const params = new URLSearchParams(window.location.search)
    serieId = params.get("serieId")
    seasonNumber = params.get("season")

    if (!serieId || seasonNumber === null) {
        window.location.href = "../../series.html"
        return
    }

    try {
        // Charger les détails de la série pour le titre et le fil d'Ariane
        const serie = await recupererDetailsSerie(serieId)
        if (serie) {
            DOM.breadcrumbSerieName.textContent = serie.name
            DOM.breadcrumbSerieName.href = `serie-details.html?id=${serieId}`
            
            if (serie.backdrop_path) {
                DOM.seasonHeroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${CONFIG.URL_ARRIERE_PLAN + serie.backdrop_path})`
            }
        }

        // Charger les détails de la saison, les crédits et les images en parallèle
        const [saison, credits, images] = await Promise.all([
            recupererDetailsSaison(serieId, seasonNumber),
            recupererCreditsSaison(serieId, seasonNumber),
            recupererImagesSaison(serieId, seasonNumber)
        ])

        if (!saison) {
            afficherNotification("Impossible de charger les détails de la saison", "danger")
            return
        }

        DOM.seasonTitle.textContent = saison.name || `Saison ${seasonNumber}`
        DOM.breadcrumbSeasonName.textContent = saison.name || `Saison ${seasonNumber}`
        DOM.seasonOverview.textContent = saison.overview || "Aucun synopsis disponible pour cette saison."
        
        DOM.seasonPoster.src = saison.poster_path ? CONFIG.URL_IMAGE + saison.poster_path : CONFIG.AFFICHE_PAR_DEFAUT
        DOM.seasonPoster.alt = saison.name

        DOM.seasonTags.innerHTML = `
            <span class="badge bg-primary"><i class="ph ph-video me-1"></i> ${saison.episodes?.length || 0} épisodes</span>
            ${saison.air_date ? `<span class="badge bg-secondary"><i class="ph ph-calendar me-1"></i> ${new Date(saison.air_date).getFullYear()}</span>` : ""}
        `

        afficherEpisodes(saison.episodes)
        if (credits) afficherActeurs(credits.cast)
        if (images) afficherPosters(images.posters)

    } catch (error) {
        console.error("Erreur:", error)
        afficherNotification("Une erreur est survenue lors du chargement des données", "danger")
    }
}

function afficherNotification(message, type = "info") {
    if (!DOM.toastContainer) return

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
    setTimeout(() => {
        toast.remove()
    }, 5000)
}

document.addEventListener("DOMContentLoaded", chargerDetailsSaison)
