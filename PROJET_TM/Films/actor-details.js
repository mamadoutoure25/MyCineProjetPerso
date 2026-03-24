// actor-details.js (corrigé : suppression du commentaire inutile, assurance que bootstrap est accessible, et corrections mineures pour robustesse)

// Configuration
const CONFIG = {
  CLE_API: "04c35731a5ee918f014970082a0088b1",
  URL_BASE: "https://api.themoviedb.org/3",
  URL_IMAGE: "https://image.tmdb.org/t/p/w500",
  IMAGE_SUBSTITUT: "https://via.placeholder.com/500x750?text=Image+indisponible",
  AFFICHE_PAR_DEFAUT: "https://via.placeholder.com/500x750?text=Aucune+affiche",
}

// Éléments du DOM
const DOM = {
  actorPhoto: document.getElementById("actor-photo"),
  actorName: document.getElementById("actor-name"),
  actorBirthday: document.getElementById("actor-birthday"),
  actorBirthplace: document.getElementById("actor-birthplace"),
  actorBiography: document.getElementById("actor-biography"),
  actorMovies: document.getElementById("actor-movies"),
  actorTV: document.getElementById("actor-tv"),
  toastContainer: document.getElementById("toast-container"),
  addActorToFavorites: document.getElementById("add-actor-to-favorites"),
}

let actorId = null
let actorName = null

// ==================== Gestion des favoris ====================

/**
 * Récupérer les acteurs favoris du localStorage
 */
function getActorFavorites() {
  try {
    const favorites = localStorage.getItem('actor_favorites')
    return favorites ? JSON.parse(favorites) : []
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error)
    return []
  }
}

/**
 * Vérifier si un acteur est dans les favoris
 */
function isActorFavorite(id) {
  return getActorFavorites().some(fav => fav.id === id)
}

/**
 * Ajouter/Retirer un acteur des favoris
 */
async function toggleActorFavorite(id, name) {
  try {
    let favorites = getActorFavorites()
    const index = favorites.findIndex(fav => fav.id === id)

    // Récupérer les infos de l'utilisateur
    const auth = sessionStorage.getItem('auth')
    const userId = auth ? JSON.parse(auth).userId : null

    if (index > -1) {
      // Retirer des favoris
      favorites.splice(index, 1)
      afficherNotification(`${name} retiré(e) des favoris`, "info")

      // Synchroniser avec la BD si l'utilisateur est connecté
      if (userId) {
        try {
          await supprimerActeurFavorisBD(userId, id)
        } catch (error) {
          console.warn('Erreur lors de la suppression dans la BD:', error)
        }
      }
    } else {
      // Ajouter aux favoris avec date
      favorites.push({ 
        id: id, 
        name: name,
        date_ajout: new Date().toISOString()
      })
      afficherNotification(`${name} ajouté(e) aux favoris`, "success")

      // Synchroniser avec la BD si l'utilisateur est connecté
      if (userId) {
        try {
          await ajouterActeurFavorisBD(userId, id, name)
        } catch (error) {
          console.warn('Erreur lors de l\'ajout dans la BD:', error)
        }
      }
    }

    localStorage.setItem('actor_favorites', JSON.stringify(favorites))
    updateActorFavoritesUI()
    // Déclencher un événement pour mettre à jour le profil
    window.dispatchEvent(new Event("actorFavoritesUpdated"))
  } catch (error) {
    console.error('Erreur lors de la gestion des favoris:', error)
    afficherNotification('Erreur lors de la sauvegarde des favoris', 'danger')
  }
}

/**
 * Ajouter un acteur aux favoris dans la BD
 */
async function ajouterActeurFavorisBD(userId, actorTmdbId, actorName) {
  try {
    const response = await fetch('favorite-actors.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        actor_id: actorTmdbId,
        actor_name: actorName
      })
    })

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }

    const data = await response.json()
    if (!data.success) {
      console.warn('Erreur BD:', data.message)
    } else {
      console.log('✅ Acteur ajouté à la BD')
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la BD:', error)
  }
}

/**
 * Supprimer un acteur des favoris dans la BD
 */
async function supprimerActeurFavorisBD(userId, actorId) {
  try {
    const response = await fetch('favorite-actors.php', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        actor_id: actorId
      })
    })

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }

    const data = await response.json()
    if (!data.success) {
      console.warn('Erreur BD:', data.message)
    } else {
      console.log('✅ Acteur supprimé de la BD')
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la BD:', error)
  }
}

/**
 * Mettre à jour l'UI du bouton favoris
 */
function updateActorFavoritesUI() {
  if (!DOM.addActorToFavorites || !actorId) return

  const isFavorite = isActorFavorite(actorId)
  const icon = DOM.addActorToFavorites.querySelector('i')

  if (isFavorite) {
    icon.classList.remove('ph-heart')
    icon.classList.add('ph-heart-fill')
    DOM.addActorToFavorites.style.background = 'rgba(239, 68, 68, 0.8)'
    DOM.addActorToFavorites.style.color = '#fef2f2'
    DOM.addActorToFavorites.title = 'Retirer des favoris'
  } else {
    icon.classList.remove('ph-heart-fill')
    icon.classList.add('ph-heart')
    DOM.addActorToFavorites.style.background = 'rgba(0, 0, 0, 0.6)'
    DOM.addActorToFavorites.style.color = 'white'
    DOM.addActorToFavorites.title = 'Ajouter aux favoris'
  }
}

// Récupérer l'ID de l'acteur depuis l'URL
function obtenirIdActeur() {
  const params = new URLSearchParams(window.location.search)
  return params.get("id")
}

// Récupérer les détails de l'acteur via l'API TMDB
async function recupererDetailsActeur(id) {
  try {
    const url = `${CONFIG.URL_BASE}/person/${id}?api_key=${CONFIG.CLE_API}&language=fr-FR&append_to_response=movie_credits,tv_credits,external_ids`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des détails de l'acteur:", error)
    afficherNotification("Impossible de charger les détails de l'acteur", "danger")
    return null
  }
}

// Afficher les informations de l'acteur
function afficherInfosActeur(acteur) {
  if (DOM.actorPhoto) {
    DOM.actorPhoto.src = acteur.profile_path ? CONFIG.URL_IMAGE + acteur.profile_path : CONFIG.IMAGE_SUBSTITUT
    DOM.actorPhoto.alt = acteur.name
  }

  actorName = acteur.name

  if (DOM.actorName) {
    DOM.actorName.textContent = acteur.name
    document.title = `${acteur.name} - MyCiné`
  }

  if (DOM.actorBirthday && acteur.birthday) {
    const birthday = new Date(acteur.birthday)
    const age = acteur.deathday
        ? Math.floor((new Date(acteur.deathday) - birthday) / (365.25 * 24 * 60 * 60 * 1000))
        : Math.floor((new Date() - birthday) / (365.25 * 24 * 60 * 60 * 1000))
    DOM.actorBirthday.innerHTML = `<strong>Né(e) le:</strong> ${birthday.toLocaleDateString("fr-FR")} (${age} ans${acteur.deathday ? " au décès" : ""})`
  }

  if (DOM.actorBirthplace && acteur.place_of_birth) {
    DOM.actorBirthplace.innerHTML = `<strong>Lieu de naissance:</strong> ${acteur.place_of_birth}`
  }

  if (DOM.actorBiography) {
    DOM.actorBiography.textContent = acteur.biography || "Aucune biographie disponible."
  }

  // Mettre à jour l'UI des favoris
  updateActorFavoritesUI()
}

// Afficher les identifiants externes
function afficherIdentifiantsExternes(acteur) {
  const container = document.getElementById("external-ids")
  if (!container || !acteur.external_ids) return

  const externalIds = acteur.external_ids
  let html = '<div class="external-ids-title"><i class="ph ph-share-network"></i>Retrouvez-le en ligne</div>'
  html += '<div class="external-links">'

  // IMDb
  if (externalIds.imdb_id) {
    html += `<a href="https://www.imdb.com/name/${externalIds.imdb_id}/" target="_blank" rel="noopener noreferrer" class="external-link" data-tooltip="IMDb" title="Voir sur IMDb"><i class="ph ph-imdb-logo"></i></a>`
  }

  // Wikidata
  if (externalIds.wikidata_id) {
    html += `<a href="https://www.wikidata.org/wiki/${externalIds.wikidata_id}" target="_blank" rel="noopener noreferrer" class="external-link" data-tooltip="Wikidata" title="Voir sur Wikidata"><i class="ph ph-globe"></i></a>`
  }

  // Instagram
  if (externalIds.instagram_id) {
    html += `<a href="https://www.instagram.com/${externalIds.instagram_id}/" target="_blank" rel="noopener noreferrer" class="external-link" data-tooltip="Instagram" title="Voir sur Instagram"><i class="ph ph-instagram-logo"></i></a>`
  }

  // Twitter
  if (externalIds.twitter_id) {
    html += `<a href="https://twitter.com/${externalIds.twitter_id}" target="_blank" rel="noopener noreferrer" class="external-link" data-tooltip="Twitter" title="Voir sur Twitter"><i class="ph ph-x-logo"></i></a>`
  }

  // TikTok
  if (externalIds.tiktok_id) {
    html += `<a href="https://www.tiktok.com/@${externalIds.tiktok_id}" target="_blank" rel="noopener noreferrer" class="external-link" data-tooltip="TikTok" title="Voir sur TikTok"><i class="ph ph-tiktok-logo"></i></a>`
  }

  // Facebook
  if (externalIds.facebook_id) {
    html += `<a href="https://www.facebook.com/${externalIds.facebook_id}" target="_blank" rel="noopener noreferrer" class="external-link" data-tooltip="Facebook" title="Voir sur Facebook"><i class="ph ph-facebook-logo"></i></a>`
  }

  // YouTube
  if (externalIds.youtube_id) {
    html += `<a href="https://www.youtube.com/channel/${externalIds.youtube_id}" target="_blank" rel="noopener noreferrer" class="external-link" data-tooltip="YouTube" title="Voir sur YouTube"><i class="ph ph-youtube-logo"></i></a>`
  }

  html += '</div>'

  // Ajouter les autres identifiants en tant que badges
  const autresToUris = ['freebase_id', 'tvrage_id', 'freebase_mid']
  const autresTotales = autresToUris.filter(id => externalIds[id])

  if (autresTotales.length > 0) {
    html += '<div class="external-links-row" style="margin-top: 1rem;">'

    if (externalIds.freebase_id) {
      html += `<a href="https://www.freebase.com${externalIds.freebase_id}" target="_blank" rel="noopener noreferrer" class="external-link-badge"><i class="ph ph-link"></i> Freebase</a>`
    }

    if (externalIds.tvrage_id) {
      html += `<span class="external-link-badge"><i class="ph ph-television"></i> TVRage ID: ${externalIds.tvrage_id}</span>`
    }

    html += '</div>'
  }

  container.innerHTML = html
}


// Afficher la filmographie (films)
function afficherFilmographie(films) {
  if (!DOM.actorMovies || !films) return

  // Trier par date de sortie (plus récent en premier)
  const filmsTriés = films.cast.sort((a, b) => {
    const dateA = new Date(a.release_date || "1900-01-01")
    const dateB = new Date(b.release_date || "1900-01-01")
    return dateB - dateA
  })

  DOM.actorMovies.className = "row g-4"
  DOM.actorMovies.innerHTML = filmsTriés
      .slice(0, 200)
      .map(
          (film) => `
        <div class="col-6 col-sm-4 col-md-3 col-lg-2">
            <a href="movie-details.html?id=${film.id}" class="text-decoration-none">
                <div class="movie-card position-relative rounded overflow-hidden" data-id="${film.id}">
                    <div class="movie-card-inner position-relative" style="height: 300px; cursor: pointer;">
                        <img src="${film.poster_path ? CONFIG.URL_IMAGE + film.poster_path : CONFIG.AFFICHE_PAR_DEFAUT}" 
                             alt="${film.title}" 
                             class="movie-card-img img-fluid w-100 h-100 object-fit-cover"
                             onerror="this.src='${CONFIG.AFFICHE_PAR_DEFAUT}'"
                             loading="lazy">
                        
                        <!-- Note au survol -->
                        <div class="movie-rating position-absolute top-0 end-0 m-2 bg-dark bg-opacity-75 text-white rounded-pill px-2 py-1 d-flex align-items-center"
                             style="opacity: 0; transform: translateY(10px); transition: all 0.3s ease;">
                            <i class="ph ph-star-fill text-warning me-1 small"></i>
                            <small class="fw-bold">${film.vote_average ? film.vote_average.toFixed(1) : 'N/A'}</small>
                        </div>
                        
                        <div class="movie-card-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end p-3">
                            <div class="text-white w-100">
                                <h6 class="mb-1 fw-bold movie-title" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${film.title}</h6>
                                <small class="d-flex align-items-center justify-content-between w-100">
                                    <span class="d-flex align-items-center">
                                        <span class="badge bg-warning text-dark">${film.character || "Rôle"}</span>
                                    </span>
                                    ${film.release_date ? `<span>${film.release_date.split("-")[0]}</span>` : ''}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        </div>
    `,
      )
      .join("")

  configurerEcouteursCartesFilms()
}

// Configurer les écouteurs des cartes de films
function configurerEcouteursCartesFilms() {
  document.querySelectorAll(".movie-card").forEach(carte => {
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
  })
}

// Afficher la filmographie (séries TV)
function afficherFilmographieTV(series) {
  if (!DOM.actorTV || !series) return

  // Trier par date de première diffusion (plus récent en premier)
  const seriesTriées = series.cast.sort((a, b) => {
    const dateA = new Date(a.first_air_date || "1900-01-01")
    const dateB = new Date(b.first_air_date || "1900-01-01")
    return dateB - dateA
  })

  DOM.actorTV.className = "row g-4"
  DOM.actorTV.innerHTML = seriesTriées
      .slice(0, 100)
      .map(
          (serie) => `
        <div class="col-6 col-sm-4 col-md-3 col-lg-2">
            <a href="serie-details.html?id=${serie.id}" class="text-decoration-none">
                <div class="movie-card position-relative rounded overflow-hidden" data-id="${serie.id}">
                    <div class="movie-card-inner position-relative" style="height: 300px; cursor: pointer;">
                        <img src="${serie.poster_path ? CONFIG.URL_IMAGE + serie.poster_path : CONFIG.AFFICHE_PAR_DEFAUT}" 
                             alt="${serie.name}" 
                             class="movie-card-img img-fluid w-100 h-100 object-fit-cover"
                             onerror="this.src='${CONFIG.AFFICHE_PAR_DEFAUT}'"
                             loading="lazy">
                        
                        <!-- Note au survol -->
                        <div class="movie-rating position-absolute top-0 end-0 m-2 bg-dark bg-opacity-75 text-white rounded-pill px-2 py-1 d-flex align-items-center"
                             style="opacity: 0; transform: translateY(10px); transition: all 0.3s ease;">
                            <i class="ph ph-star-fill text-warning me-1 small"></i>
                            <small class="fw-bold">${serie.vote_average ? serie.vote_average.toFixed(1) + '/10' : 'N/A'}</small>
                        </div>
                        
                        <div class="movie-card-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end p-3">
                            <div class="text-white w-100">
                                <h6 class="mb-1 fw-bold movie-title" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${serie.name}</h6>
                                <small class="d-flex align-items-center justify-content-between w-100">
                                    <span class="d-flex align-items-center">
                                        <span class="badge bg-warning text-dark">${serie.character || "Rôle"}</span>
                                    </span>
                                    ${serie.first_air_date ? `<span>${serie.first_air_date.split("-")[0]}</span>` : ''}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        </div>
    `,
      )
      .join("")

  configurerEcouteursCartesFilms()
}

// Afficher une notification
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
  if (window.bootstrap) {
    const bsToast = new window.bootstrap.Toast(toast)
    bsToast.show()
    toast.addEventListener("hidden.bs.toast", () => toast.remove())
  } else {
    // Fallback si bootstrap n'est pas chargé
    setTimeout(() => toast.remove(), 3000)
  }
}

// Initialisation
document.addEventListener("DOMContentLoaded", async () => {
  // Récupérer l'ID de l'acteur
  actorId = obtenirIdActeur()
  if (!actorId) {
    afficherNotification("Aucun acteur spécifié", "danger")
    window.location.href = "../../index.html"
    return
  }

  // Charger les détails de l'acteur
  const acteur = await recupererDetailsActeur(actorId)
  if (acteur) {
    afficherInfosActeur(acteur)
    afficherIdentifiantsExternes(acteur)
    afficherFilmographie(acteur.movie_credits)
    afficherFilmographieTV(acteur.tv_credits)
  } else {
    afficherNotification("Impossible de charger les détails de l'acteur", "danger")
    window.location.href = "../../index.html"
  }

  // Ajouter l'écouteur d'événement pour le bouton favoris
  if (DOM.addActorToFavorites && actorName) {
    DOM.addActorToFavorites.addEventListener("click", () => {
      toggleActorFavorite(actorId, actorName)
    })
  }
})