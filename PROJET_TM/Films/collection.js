// Configuration API TMDB
const CONFIG = {
  API_KEY: "04c35731a5ee918f014970082a0088b1",
  BASE_URL: "https://api.themoviedb.org/3",
  IMAGE_BASE_URL: "https://image.tmdb.org/t/p",
  POSTER_SIZE: "w500",
  BACKDROP_SIZE: "w1280",
  PROFILE_SIZE: "w185",
}

// Variables globales
let collectionId = null
let collectionData = null

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  initTheme()

  const urlParams = new URLSearchParams(window.location.search)
  collectionId = urlParams.get("id")

  if (collectionId) {
    chargerCollection(collectionId)
  } else {
    afficherErreur("ID de collection manquant")
  }
})

// Gestion du thème clair/sombre
function initTheme() {
  const root = document.documentElement
  const toggleButton = document.getElementById("theme-toggle")
  const themeIcon = document.getElementById("theme-icon")

  const savedTheme = localStorage.getItem("theme")
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  const systemTheme = mediaQuery.matches ? "dark" : "light"
  const currentTheme = savedTheme || systemTheme

  root.setAttribute("data-theme", currentTheme)
  updateThemeIcon(currentTheme, themeIcon)
  updateThemeButtonLabel(currentTheme, toggleButton)

  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      const activeTheme = root.getAttribute("data-theme") || "dark"
      const nextTheme = activeTheme === "dark" ? "light" : "dark"
      root.setAttribute("data-theme", nextTheme)
      localStorage.setItem("theme", nextTheme)
      updateThemeIcon(nextTheme, themeIcon)
      updateThemeButtonLabel(nextTheme, toggleButton)
    })
  }

  mediaQuery.addEventListener("change", event => {
    if (localStorage.getItem("theme")) return
    const autoTheme = event.matches ? "dark" : "light"
    root.setAttribute("data-theme", autoTheme)
    updateThemeIcon(autoTheme, themeIcon)
    updateThemeButtonLabel(autoTheme, toggleButton)
  })
}

function updateThemeIcon(theme, iconElement) {
  if (!iconElement) return
  iconElement.className = theme === "dark" ? "ph ph-sun" : "ph ph-moon"
}

function updateThemeButtonLabel(theme, button) {
  if (!button) return
  const nextThemeLabel = theme === "dark" ? "clair" : "sombre"
  const label = `Passer en mode ${nextThemeLabel}`
  button.setAttribute("aria-label", label)
  button.setAttribute("title", label)
}

// Charger les données de la collection
async function chargerCollection(id) {
  try {
    showLoading(true)

    const response = await fetch(`${CONFIG.BASE_URL}/collection/${id}?api_key=${CONFIG.API_KEY}&language=fr-FR`)

    if (!response.ok) {
      throw new Error("Collection non trouvée")
    }

    collectionData = await response.json()
    await fetchCastAndCrew()
    afficherCollection(collectionData)
  } catch (error) {
    console.error("Erreur lors du chargement de la collection:", error)
    afficherErreur("Erreur lors du chargement de la collection")
  } finally {
    showLoading(false)
  }
}

// Récupérer les acteurs et l'équipe de la collection
async function fetchCastAndCrew() {
  try {
    const castSet = new Set()
    const crewSet = new Set()
    const cast = []
    const crew = []
    let totalRevenue = 0

    // Parcourir chaque film pour collecter les acteurs, l'équipe et le revenu
    for (const movie of collectionData.parts) {
      const response = await fetch(`${CONFIG.BASE_URL}/movie/${movie.id}?api_key=${CONFIG.API_KEY}&language=fr-FR&append_to_response=credits`)
      if (response.ok) {
        const movieData = await response.json()
        totalRevenue += movieData.revenue || 0
        // Collecter les 3 premiers acteurs
        if (movieData.credits?.cast) {
          movieData.credits.cast.slice(0, 80).forEach(actor => {
            if (!castSet.has(actor.id)) {
              castSet.add(actor.id)
              cast.push(actor)
            }
          })
        }
        // Collecter les réalisateurs et scénaristes
        if (movieData.credits?.crew) {
          movieData.credits.crew.filter(member => member.job === "Director" || member.job === "Writer").slice(0, 3).forEach(member => {
            if (!crewSet.has(member.id)) {
              crewSet.add(member.id)
              crew.push(member)
            }
          })
        }
      }
    }

    // Limiter à 10 acteurs et 10 membres d'équipe
    collectionData.cast = cast.slice(0, 10)
    collectionData.crew = crew.slice(0, 10)
    collectionData.revenue = totalRevenue
  } catch (error) {
    console.error("Erreur lors de la récupération des acteurs, de l'équipe et du revenu:", error)
  }
}

// Afficher les données de la collection
function afficherCollection(collection) {
  document.title = `${collection.name} - MyCiné`

  const heroSection = document.getElementById("collection-hero")
  if (collection.backdrop_path) {
    heroSection.style.backgroundImage = `url(${CONFIG.IMAGE_BASE_URL}/${CONFIG.BACKDROP_SIZE}${collection.backdrop_path})`
  }

  const poster = document.getElementById("collection-poster")
  if (collection.poster_path) {
    poster.src = `${CONFIG.IMAGE_BASE_URL}/${CONFIG.POSTER_SIZE}${collection.poster_path}`
    poster.alt = collection.name
  }

  document.getElementById("collection-title").textContent = collection.name

  // Afficher le nom original si différent du nom français
  if (collection.original_name && collection.original_name !== collection.name) {
    const titleElement = document.getElementById("collection-title")
    titleElement.innerHTML = `<span>${collection.name}</span><br><small style="font-size: 0.6em; opacity: 0.8;">${collection.original_name}</small>`
  }

  document.getElementById("collection-overview").textContent = collection.overview || "Aucune description disponible."

  document.getElementById("movies-count").textContent = `${collection.parts.length} films`
  document.getElementById("collection-years").textContent = getCollectionYears(collection.parts)
  document.getElementById("collection-revenue").textContent = getCollectionRevenue(collection.revenue)

  // Ajouter la langue originale si disponible
  if (collection.original_language) {
    const languageCode = collection.original_language.toUpperCase()
    const languageNames = {
      'EN': 'Anglais',
      'FR': 'Français',
      'ES': 'Espagnol',
      'DE': 'Allemand',
      'IT': 'Italien',
      'JA': 'Japonais',
      'ZH': 'Chinois',
      'RU': 'Russe'
    }
    const languageName = languageNames[languageCode] || languageCode
    const badgesContainer = document.querySelector(".d-flex.flex-wrap.gap-3")
    if (badgesContainer) {
      const languageBadge = document.createElement("span")
      languageBadge.className = "badge rounded-pill"
      languageBadge.textContent = `🌐 ${languageName}`
      badgesContainer.appendChild(languageBadge)
    }
  }

  afficherCast(collection.cast)
  afficherCrew(collection.crew)
  afficherFilms(collection.parts)
}

// Calculer les années de la collection
function getCollectionYears(movies) {
  const years = movies
      .map(movie => movie.release_date ? new Date(movie.release_date).getFullYear() : null)
      .filter(year => year !== null)
      .sort((a, b) => a - b)

  if (years.length === 0) return "Années inconnues"
  if (years.length === 1) return years[0].toString()
  return `${years[0]} - ${years[years.length - 1]}`
}

// Formater le revenu total
function getCollectionRevenue(revenue) {
  return revenue ? new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(revenue) : "Non divulgué"
}

// Obtenir la classe CSS pour le badge de note
function getRatingBadgeClass(vote) {
  const voteValue = typeof vote === 'number' ? vote : parseFloat(vote)
  if (!voteValue || isNaN(voteValue)) return 'bg-danger'
  if (voteValue >= 8) return 'bg-success'
  if (voteValue >= 5) return 'bg-warning'
  return 'bg-danger'
}

// Afficher les acteurs
function afficherCast(cast) {
  const castContainer = document.getElementById("collection-cast")
  if (!cast || cast.length === 0) {
    castContainer.innerHTML = '<p class="text-muted">Aucune information sur la distribution.</p>'
    return
  }

  castContainer.innerHTML = cast.map(actor => `
    <div class="cast-card text-center" onclick="voirActeur(${actor.id})">
      <img src="${actor.profile_path ? `${CONFIG.IMAGE_BASE_URL}/${CONFIG.PROFILE_SIZE}${actor.profile_path}` : 'https://via.placeholder.com/80x80?text=Acteur'}" 
           alt="${actor.name}" class="rounded-circle">
      <p class="mb-0">${actor.name}</p>
      <small class="text-muted">${actor.character || "Rôle inconnu"}</small>
    </div>
  `).join("")
}

// Afficher l'équipe
function afficherCrew(crew) {
  const crewContainer = document.getElementById("collection-crew")
  if (!crew || crew.length === 0) {
    crewContainer.innerHTML = '<p class="text-muted">Aucune information sur l\'équipe.</p>'
    return
  }

  crewContainer.innerHTML = crew.map(member => `
    <div class="crew-card text-center">
      <p class="mb-0">${member.name}</p>
      <small class="text-muted">${member.job}</small>
    </div>
  `).join("")
}

// Afficher les films de la collection
function afficherFilms(movies) {
  const moviesGrid = document.getElementById("movies-grid")
  const sortedMovies = [...movies].sort((a, b) => {
    const dateA = new Date(a.release_date || "1900-01-01")
    const dateB = new Date(b.release_date || "1900-01-01")
    return dateA - dateB
  })

  // Créer les boutons de filtre par année
  const years = [...new Set(sortedMovies
    .map(m => m.release_date ? m.release_date.split("-")[0] : null)
    .filter(year => year !== null))]
    .sort()

  // Ajouter un conteneur de filtres avant la grille
  const filterContainer = document.createElement("div")
  filterContainer.className = "filter-container mb-4"
  filterContainer.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  `

  const allButton = document.createElement("button")
  allButton.className = "btn btn-sm btn-primary"
  allButton.textContent = "Tous les films"
  allButton.style.cssText = `
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
  `
  allButton.addEventListener("click", () => {
    renderMovies(sortedMovies)
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"))
    allButton.classList.add("active")
  })
  allButton.classList.add("filter-btn", "active")
  filterContainer.appendChild(allButton)

  years.forEach(year => {
    const btn = document.createElement("button")
    btn.className = "btn btn-sm filter-btn"
    btn.textContent = year
    btn.style.cssText = `
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    `
    btn.addEventListener("click", () => {
      const filtered = sortedMovies.filter(m => m.release_date?.startsWith(year))
      renderMovies(filtered)
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"))
      btn.classList.add("active")
    })
    filterContainer.appendChild(btn)
  })

  // Insérer le conteneur de filtres avant la grille
  moviesGrid.parentElement.insertBefore(filterContainer, moviesGrid)

  // Fonction pour rendre les films
  function renderMovies(moviesToRender) {
    moviesGrid.className = "movie-grid"
    moviesGrid.innerHTML = moviesToRender.map(movie => `
      <div class="premium-card" onclick="window.location.href='movie-details.html?id=${movie.id}'">
        <img src="${movie.poster_path ? `${CONFIG.IMAGE_BASE_URL}/${CONFIG.POSTER_SIZE}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=Aucune+affiche'}" 
             alt="${movie.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750?text=Image+indisponible'">
        <div class="card-details">
            <div class="card-title text-truncate">${movie.title}</div>
            <div class="card-meta">
                <span class="rating-badge"><i class="ph-fill ph-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
            </div>
        </div>
      </div>
    `).join("")
    moviesGrid.style.display = "grid"
  }

  renderMovies(sortedMovies)
}

// Rediriger vers la page de détails du film
function voirFilm(movieId) {
  window.location.href = `movie-details.html?id=${movieId}`
}

// Rediriger vers la page de détails de l'acteur
function voirActeur(actorId) {
  window.location.href = `actor-details.html?id=${actorId}`
}

// Afficher/masquer le spinner de chargement
function showLoading(show) {
  const loading = document.getElementById("loading")
  const moviesGrid = document.getElementById("movies-grid")

  if (show) {
    loading.style.display = "flex"
    moviesGrid.style.display = "none"
  } else {
    loading.style.display = "none"
  }
}

// Afficher une erreur
function afficherErreur(message) {
  const container = document.querySelector("#collection-content .container-fluid")
  if (!container) return

  container.innerHTML = `
    <div class="alert alert-danger text-center mt-5" role="alert">
      <i class="ph ph-warning-circle me-2"></i>
      ${message}
    </div>
    <div class="text-center mt-3">
      <a href="../../index.html" class="btn btn-primary">
        <i class="ph ph-house me-2"></i>
        Retour a l'accueil
      </a>
    </div>
  `
}

// Rendre les fonctions accessibles globalement
window.voirFilm = voirFilm
window.voirActeur = voirActeur