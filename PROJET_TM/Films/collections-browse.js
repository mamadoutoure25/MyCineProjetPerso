// Configuration API TMDB
const COLLECTIONS_CONFIG = {
  BASE_URL: window.TMDB_CONFIG?.BASE_URL || "https://api.themoviedb.org/3",
  API_KEY: window.TMDB_CONFIG?.API_KEY || "04c35731a5ee918f014970082a0088b1",
  IMAGE_BASE_URL: "https://image.tmdb.org/t/p",
  IMG_BASE_URL: "https://image.tmdb.org/t/p",
  POSTER_SIZE: "w500",
  BACKDROP_SIZE: "w1280",
}

// Variables globales pour stocker les collections et la pagination
let allCollections = []
let initialCollectionsBackup = []
let currentSortMethod = "original"
const BATCH_SIZE = 18
let currentPopularIndex = 0
let isLoadingMore = false
let loadedCollectionIds = new Set()

// État de la recherche
let isSearching = false
let currentSearchQuery = ""
let searchCurrentPage = 1
let searchTotalPages = 1
let searchDebounceTimeout = null

// État du mode Découverte TMDB (sagas hors POPULAR_COLLECTIONS)
let isDiscoveryMode = false
const DISCOVERY_KEYWORDS = [
  'collection', 'saga', 'trilogie', 'trilogy', 'chronicles', 'universe', 
  'aventure', 'adventure', 'war', 'guerre', 'hero', 'super', 'dragon', 
  'star', 'dark', 'secret', 'legend', 'magic', 'monster', 'alien', 
  'zombie', 'action', 'detective', 'agent', 'world', 'police', 'future', 
  'king', 'space', 'fantome', 'ghost', 'planet', 'apocalypse', 'dimension'
]
let discoveryKeywordIndex = 0
let discoveryPage = 1

// Collections populaires de référence (initiales)
const POPULAR_COLLECTIONS = [...new Set([
  // Grands Classiques & Incontournables
  119, // Le Seigneur des anneaux
  10, // Star Wars
  8091, // Alien
  295, // Pirates des Caraïbes
  528, // Terminator
  2344, // Matrix
  726871, // Dune
  1241, // Harry Potter
  435259, // Les Animaux Fantastiques
  328, // Jurassic Park
  8650, // Transformers
  264, // Retour vers le futur
  173710, // La Planète des singes
  84, // Indiana Jones
  404609, // John Wick

  // Super-héros & Univers Cinématographiques
  86311, // The Avengers
  531241, // Spider-Man (Home)
  556, // Spider-Man (Sam Raimi)
  124119, // The Amazing Spider-Man
  573436, // Spider-Man: Spider-Verse
  263, // Batman (The Dark Knight)
  120794, // Batman (Classique)
  948485, // The Batman Saga
  748, // X-Men
  448150, // Deadpool
  453993, // Wolverine
  131292, // Iron Man
  131296, // Captain America
  131295, // Thor
  284433, // Gardiens de la Galaxie
  131294, // Ant-Man
  618529, // Doctor Strange
  529892, // Black Panther
  131252, // Venom
  656, // Superman
  468552, // Wonder Woman
  573693, // Aquaman
  7711, // DC Extended Universe

  // Action, Espionnage & Frissons
  645, // James Bond
  87359, // Mission: Impossible
  9485, // Fast & Furious
  105995, // Jason Bourne
  623, // Die Hard
  8945, // Mad Max
  722, // L'Arme Fatale
  1565, // Bad Boys
  126125, // Expendables
  94430, // Taken
  391860, // Kingsman
  523855, // Equalizer
  11777, // Rush Hour
  7670, // Ocean's
  531330, // Top Gun
  2282, // Benjamin Gates (National Treasure)
  1575, // Rocky
  553717, // Creed
  1069584, // Gladiator
  521, // Rambo
  2584, // Karate Kid
  2980, // Le Flic de Beverly Hills

  // Sci-Fi, Fantastique & Aventure
  87096, // Avatar Saga
  121938, // Le Hobbit
  120364, // Star Trek
  535313, // Godzilla
  1539140, // Godzilla x Kong
  399, // Predator
  420, // Le Monde de Narnia
  131635, // Hunger Games
  295130, // Le Labyrinthe
  283579, // Divergente
  495527, // Jumanji
  33514, // Twilight
  179919, // Percy Jackson
  363369, // Pacific Rim
  382685, // Insaisissables (Now You See Me)
  63043, // TRON
  744, // Men in Black
  304, // SOS Fantômes (Ghostbusters)
  2366, // Gremlins
  945475, // Beetlejuice
  1733, // La Momie
  277, // Underworld
  2354, // Le Parrain (The Godfather)

  // Horreur & Épouvante
  422837, // The Conjuring Universe
  402074, // Annabelle
  3804, // Insidious
  10194, // Saw
  7326, // Scream
  3004, // Halloween
  8864, // Destination Finale
  17255, // Resident Evil
  100788, // Paranormal Activity
  521226, // Sans un bruit (A Quiet Place)
  1434946, // Alien Romulus

  // Animation & Familial
  131230, // Toy Story
  2150, // Shrek
  86066, // Moi, Moche et Méchant
  544669, // Les Minions
  94032, // Le Roi Lion
  5353, // L'Âge de glace
  77816, // Kung Fu Panda
  89137, // Dragons
  468222, // Les Indestructibles
  93935, // Cars
  14740, // Madagascar
  91361, // Hôtel Transylvanie
  386382, // La Reine des Neiges (Frozen)
  1022790, // Vice-Versa (Inside Out)
  1241984, // Vaiana / Moana
  95039, // Sonic the Hedgehog
  10214, // Maman j'ai raté l'avion (Home Alone)
  10839, // La Nuit au musée
  925155 // Demon Slayer
])];

const popularCollectionsSet = new Set(POPULAR_COLLECTIONS);

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  initTheme()
  initSearch()
  loadCollections()
  initSortButtons()
})

// Gestion du thème clair/sombre
function initTheme() {
  const root = document.documentElement
  const toggleButton = document.getElementById("theme-toggle")
  const themeIcon = document.getElementById("theme-icon")

  const savedTheme = localStorage.getItem("theme") || "dark"
  root.setAttribute("data-theme", savedTheme)
  updateThemeIcon(savedTheme, themeIcon)
  updateThemeButtonLabel(savedTheme, toggleButton)
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

// Initialisation de la recherche et du bouton Découverte TMDB
function initSearch() {
  const searchInput = document.getElementById("search-collection-input")
  const clearBtn = document.getElementById("btn-clear-search")
  const resetBtn = document.getElementById("btn-reset-search")
  const discoverBtn = document.getElementById("btn-discover-tmdb")

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.trim()
      if (clearBtn) {
        clearBtn.style.display = q.length > 0 ? "block" : "none"
      }
      clearTimeout(searchDebounceTimeout)
      searchDebounceTimeout = setTimeout(() => {
        handleSearch(q)
      }, 400)
    })

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        clearTimeout(searchDebounceTimeout)
        handleSearch(searchInput.value.trim())
      }
    })
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = ""
      clearBtn.style.display = "none"
      resetSearchState()
    })
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = ""
      if (clearBtn) clearBtn.style.display = "none"
      resetSearchState()
    })
  }

  if (discoverBtn) {
    discoverBtn.addEventListener("click", () => {
      startDiscoveryMode()
    })
  }
}

// Réinitialiser la recherche et revenir à la vue par défaut
function resetSearchState() {
  isSearching = false
  isDiscoveryMode = false
  currentSearchQuery = ""
  searchCurrentPage = 1
  searchTotalPages = 1

  const laneTitle = document.getElementById("collections-lane-title")
  if (laneTitle) laneTitle.textContent = "EXPLORER LES COLLECTIONS"

  const discoverBtn = document.getElementById("btn-discover-tmdb")
  if (discoverBtn) {
    discoverBtn.classList.remove("active")
    discoverBtn.innerHTML = `<i class="ph ph-sparkle text-accent me-1"></i> SAGAS INÉDITES (TMDB)`
  }

  if (initialCollectionsBackup.length > 0) {
    allCollections = [...initialCollectionsBackup]
    applySorting(currentSortMethod)
  } else {
    loadCollections()
  }
}

// Charger les collections de base (1er lot de sagas populaires)
async function loadCollections() {
  const grid = document.getElementById("collections-grid")
  const noCollectionsDiv = document.getElementById("no-collections")
  if (grid) {
    grid.style.display = "grid"
    grid.innerHTML = `
      <div class="text-center py-5 w-100" style="grid-column: 1 / -1;">
          <div class="spinner-border text-theme" role="status">
              <span class="visually-hidden">Chargement...</span>
          </div>
      </div>
    `
  }
  if (noCollectionsDiv) noCollectionsDiv.style.display = "none"

  try {
    currentPopularIndex = 0
    allCollections = []
    loadedCollectionIds.clear()

    const initialIds = POPULAR_COLLECTIONS.slice(0, BATCH_SIZE)
    const lang = localStorage.getItem('user_lang') || 'fr-FR'
    const fetchPromises = initialIds.map(id =>
      fetch(`${COLLECTIONS_CONFIG.BASE_URL}/collection/${id}?api_key=${COLLECTIONS_CONFIG.API_KEY}&language=${lang}`)
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
    )

    const rawCollections = await Promise.all(fetchPromises)
    const validCollections = rawCollections.filter(c => c !== null)

    validCollections.forEach(c => loadedCollectionIds.add(c.id))

    // Calculer les recettes totales par collection
    await fetchCollectionsRevenue(validCollections)

    currentPopularIndex = initialIds.length
    allCollections = [...validCollections]
    initialCollectionsBackup = [...validCollections]

    if (allCollections.length === 0) {
      showNoCollections("Aucune collection trouvée", "Vérifiez votre connexion internet.")
    } else {
      applySorting(currentSortMethod)
    }
  } catch (error) {
    console.error("Erreur lors du chargement des collections:", error)
    showNoCollections("Erreur de chargement", "Impossible de charger les collections.")
  }
}

// Activer le mode Découverte TMDB (sagas qui ne sont pas dans POPULAR_COLLECTIONS)
async function startDiscoveryMode() {
  isDiscoveryMode = true
  isSearching = false
  currentSearchQuery = ""

  const searchInput = document.getElementById("search-collection-input")
  const clearBtn = document.getElementById("btn-clear-search")
  if (searchInput) searchInput.value = ""
  if (clearBtn) clearBtn.style.display = "none"

  const laneTitle = document.getElementById("collections-lane-title")
  if (laneTitle) laneTitle.textContent = "✨ SAGAS INÉDITES TMDB (HORS LISTE POPULAIRE)"

  const discoverBtn = document.getElementById("btn-discover-tmdb")
  if (discoverBtn) {
    discoverBtn.classList.add("active")
    discoverBtn.innerHTML = `<i class="ph ph-check-circle text-accent me-1"></i> MODE INÉDIT ACTIF`
  }

  const grid = document.getElementById("collections-grid")
  const noCollectionsDiv = document.getElementById("no-collections")
  if (grid) {
    grid.style.display = "grid"
    grid.innerHTML = `
      <div class="text-center py-5 w-100" style="grid-column: 1 / -1;">
          <div class="spinner-border text-theme" role="status"></div>
          <div class="mt-3 small opacity-75">Exploration des sagas TMDB inédites...</div>
      </div>
    `
  }
  if (noCollectionsDiv) noCollectionsDiv.style.display = "none"

  discoveryKeywordIndex = 0
  discoveryPage = 1
  allCollections = []

  const newCollections = await fetchTMDBDiscoveryCollections(BATCH_SIZE)
  allCollections = [...newCollections]

  if (allCollections.length === 0) {
    showNoCollections("Aucune saga inédite trouvée", "Cliquez sur Réinitialiser pour revenir aux collections populaires.")
  } else {
    applySorting(currentSortMethod)
  }
}

// Recherche dynamique TMDB (par mots-clés)
async function handleSearch(query) {
  if (!query) {
    resetSearchState()
    return
  }

  isSearching = true
  isDiscoveryMode = false
  currentSearchQuery = query
  searchCurrentPage = 1

  const discoverBtn = document.getElementById("btn-discover-tmdb")
  if (discoverBtn) {
    discoverBtn.classList.remove("active")
    discoverBtn.innerHTML = `<i class="ph ph-sparkle text-accent me-1"></i> SAGAS INÉDITES (TMDB)`
  }

  const laneTitle = document.getElementById("collections-lane-title")
  if (laneTitle) laneTitle.textContent = `RÉSULTATS TMDB POUR "${query.toUpperCase()}"`

  const grid = document.getElementById("collections-grid")
  const noCollectionsDiv = document.getElementById("no-collections")
  if (grid) {
    grid.style.display = "grid"
    grid.innerHTML = `
      <div class="text-center py-5 w-100" style="grid-column: 1 / -1;">
          <div class="spinner-border text-theme" role="status"></div>
          <div class="mt-3 small opacity-75">Recherche TMDB en cours...</div>
      </div>
    `
  }
  if (noCollectionsDiv) noCollectionsDiv.style.display = "none"

  try {
    const lang = localStorage.getItem('user_lang') || 'fr-FR'
    const url = `${COLLECTIONS_CONFIG.BASE_URL}/search/collection?api_key=${COLLECTIONS_CONFIG.API_KEY}&query=${encodeURIComponent(query)}&page=1&language=${lang}`
    const res = await fetch(url)
    if (!res.ok) throw new Error("Erreur TMDB search")
    const data = await res.json()

    searchTotalPages = data.total_pages || 1
    const rawResults = data.results || []

    // Filtrer les résultats avec affiche
    const candidates = rawResults.filter(c => c && c.id && c.poster_path)

    // Récupérer les détails de chaque collection (/collection/{id}) pour avoir ses films et sa description
    const detailedPromises = candidates.map(c =>
      fetch(`${COLLECTIONS_CONFIG.BASE_URL}/collection/${c.id}?api_key=${COLLECTIONS_CONFIG.API_KEY}&language=${lang}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )

    const detailedCollections = (await Promise.all(detailedPromises)).filter(c => c && c.parts && c.parts.length >= 1)

    // Calculer les recettes totales
    await fetchCollectionsRevenue(detailedCollections)

    allCollections = detailedCollections
    detailedCollections.forEach(c => loadedCollectionIds.add(c.id))

    if (allCollections.length === 0) {
      showNoCollections(`Aucune collection trouvée pour "${query}"`, "Essayez avec d'autres mots-clés ou vérifiez l'orthographe.")
    } else {
      applySorting(currentSortMethod)
    }
  } catch (err) {
    console.error("Erreur recherche collections:", err)
    showNoCollections("Erreur de recherche", "Impossible d'effectuer la recherche TMDB.")
  }
}

// Fonction moteur pour découvrir des sagas TMDB hors de POPULAR_COLLECTIONS
async function fetchTMDBDiscoveryCollections(targetCount = 18) {
  const discovered = []
  const lang = localStorage.getItem('user_lang') || 'fr-FR'
  let attempts = 0
  const maxAttempts = 10

  while (discovered.length < targetCount && attempts < maxAttempts) {
    attempts++
    const keyword = DISCOVERY_KEYWORDS[discoveryKeywordIndex % DISCOVERY_KEYWORDS.length]
    const url = `${COLLECTIONS_CONFIG.BASE_URL}/search/collection?api_key=${COLLECTIONS_CONFIG.API_KEY}&query=${encodeURIComponent(keyword)}&page=${discoveryPage}&language=${lang}`

    try {
      const res = await fetch(url)
      if (!res.ok) {
        discoveryPage++
        continue
      }
      const data = await res.json()
      const results = data.results || []

      if (results.length === 0) {
        discoveryKeywordIndex++
        discoveryPage = 1
        continue
      }

      // Filtrer :
      // 1. Présence d'un poster_path
      // 2. Pas déjà dans loadedCollectionIds
      // 3. Pas dans POPULAR_COLLECTIONS (garantie d'inédit)
      const candidates = results.filter(c => 
        c && 
        c.id && 
        c.poster_path && 
        !loadedCollectionIds.has(c.id) && 
        !popularCollectionsSet.has(c.id)
      )

      // Récupérer les détails pour chaque candidat
      const detailedPromises = candidates.map(c => 
        fetch(`${COLLECTIONS_CONFIG.BASE_URL}/collection/${c.id}?api_key=${COLLECTIONS_CONFIG.API_KEY}&language=${lang}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )

      const detailedResults = await Promise.all(detailedPromises)

      for (const col of detailedResults) {
        if (!col || !col.id) continue
        if (loadedCollectionIds.has(col.id)) continue
        if (popularCollectionsSet.has(col.id)) continue

        // On conserve les vraies sagas (au moins 1 film, idéalement 2+)
        if (col.parts && col.parts.length >= 1) {
          loadedCollectionIds.add(col.id)
          discovered.push(col)
          if (discovered.length >= targetCount) break
        }
      }

      if (discoveryPage >= (data.total_pages || 1)) {
        discoveryKeywordIndex++
        discoveryPage = 1
      } else {
        discoveryPage++
      }
    } catch (err) {
      console.warn("Erreur défilement découverte TMDB:", err)
      discoveryPage++
    }
  }

  if (discovered.length > 0) {
    await fetchCollectionsRevenue(discovered)
  }

  return discovered
}

// Charger les collections supplémentaires via la carte "VOIR PLUS"
async function loadMoreCollections() {
  if (isLoadingMore) return
  isLoadingMore = true

  const icon = document.getElementById("view-more-icon")
  const label = document.getElementById("view-more-label")
  if (icon) {
    icon.className = "ph ph-circle-notch fs-1 mb-2 text-accent"
    icon.style.animation = "spin 1s linear infinite"
  }
  if (label) label.textContent = "CHARGEMENT..."

  try {
    const lang = localStorage.getItem('user_lang') || 'fr-FR'

    // Cas 1 : En mode recherche active
    if (isSearching) {
      if (searchCurrentPage >= searchTotalPages) {
        if (label) label.textContent = "FIN DES RÉSULTATS"
        setTimeout(() => {
          if (label) label.textContent = "VOIR PLUS"
          if (icon) {
            icon.className = "ph ph-plus-circle fs-1 mb-2 text-accent"
            icon.style.animation = "none"
          }
        }, 1500)
        return
      }

      searchCurrentPage++
      const url = `${COLLECTIONS_CONFIG.BASE_URL}/search/collection?api_key=${COLLECTIONS_CONFIG.API_KEY}&query=${encodeURIComponent(currentSearchQuery)}&page=${searchCurrentPage}&language=${lang}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const candidates = (data.results || []).filter(c => c && c.id && c.poster_path && !loadedCollectionIds.has(c.id))
        const detailedPromises = candidates.map(c =>
          fetch(`${COLLECTIONS_CONFIG.BASE_URL}/collection/${c.id}?api_key=${COLLECTIONS_CONFIG.API_KEY}&language=${lang}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
        const detailedCollections = (await Promise.all(detailedPromises)).filter(c => c && c.parts && c.parts.length >= 1)
        detailedCollections.forEach(c => loadedCollectionIds.add(c.id))
        await fetchCollectionsRevenue(detailedCollections)
        allCollections = [...allCollections, ...detailedCollections]
        applySorting(currentSortMethod)
      }
      return
    }

    // Cas 2 : En mode Découverte TMDB active
    if (isDiscoveryMode) {
      const freshCollections = await fetchTMDBDiscoveryCollections(BATCH_SIZE)
      if (freshCollections.length > 0) {
        allCollections = [...allCollections, ...freshCollections]
        applySorting(currentSortMethod)
      }
      return
    }

    // Cas 3 : Mode standard
    // S'il reste des sagas dans la liste populaire prédéfinie, on continue de les charger
    if (currentPopularIndex < POPULAR_COLLECTIONS.length) {
      const nextIds = POPULAR_COLLECTIONS.slice(currentPopularIndex, currentPopularIndex + BATCH_SIZE)
      const fetchPromises = nextIds.map(id =>
        fetch(`${COLLECTIONS_CONFIG.BASE_URL}/collection/${id}?api_key=${COLLECTIONS_CONFIG.API_KEY}&language=${lang}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      )

      const rawCollections = await Promise.all(fetchPromises)
      const validCollections = rawCollections.filter(c => c !== null)
      validCollections.forEach(c => loadedCollectionIds.add(c.id))

      await fetchCollectionsRevenue(validCollections)

      allCollections = [...allCollections, ...validCollections]
      initialCollectionsBackup = [...allCollections]
      currentPopularIndex += nextIds.length

      applySorting(currentSortMethod)
    } else {
      // POPULAR_COLLECTIONS est épuisé : on enchaîne de manière illimitée sur la DÉCOUVERTE DYNAMIQUE TMDB !
      const discoveredCollections = await fetchTMDBDiscoveryCollections(BATCH_SIZE)
      if (discoveredCollections.length > 0) {
        allCollections = [...allCollections, ...discoveredCollections]
        initialCollectionsBackup = [...allCollections]
        applySorting(currentSortMethod)
      }
    }
  } catch (err) {
    console.error("Erreur lors du chargement des collections supplémentaires:", err)
  } finally {
    isLoadingMore = false
    const currentIcon = document.getElementById("view-more-icon")
    const currentLabel = document.getElementById("view-more-label")
    if (currentIcon) {
      currentIcon.className = "ph ph-plus-circle fs-1 mb-2 text-accent"
      currentIcon.style.animation = "none"
    }
    if (currentLabel) currentLabel.textContent = "VOIR PLUS"
  }
}

// Récupérer le box-office total des films de chaque collection
async function fetchCollectionsRevenue(collections) {
  await Promise.all(
    collections.map(async (c) => {
      if (!c.parts || c.parts.length === 0) {
        c.totalRevenue = 0
        return
      }
      try {
        const moviePromises = c.parts.map(m =>
          fetch(`${COLLECTIONS_CONFIG.BASE_URL}/movie/${m.id}?api_key=${COLLECTIONS_CONFIG.API_KEY}`)
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        )
        const moviesDetails = await Promise.all(moviePromises)
        c.totalRevenue = moviesDetails.reduce((sum, m) => sum + (m && m.revenue ? m.revenue : 0), 0)
      } catch (e) {
        c.totalRevenue = 0
      }
    })
  )
}

// Afficher les cartes de collection avec le bouton Voir Plus
function renderCollections(collectionsToDisplay) {
  const grid = document.getElementById("collections-grid")
  const noCollectionsDiv = document.getElementById("no-collections")

  if (!collectionsToDisplay || collectionsToDisplay.length === 0) {
    grid.style.display = "none"
    noCollectionsDiv.style.display = "block"
    return
  }

  let html = collectionsToDisplay.map(collection => {
    const customPoster = localStorage.getItem(`custom_collection_poster_${collection.id}`)
    const posterSrc = customPoster || (collection.poster_path ? `${COLLECTIONS_CONFIG.IMAGE_BASE_URL}/${COLLECTIONS_CONFIG.POSTER_SIZE}${collection.poster_path}` : 'https://via.placeholder.com/500x750?text=Affiche+indisponible')
    const revBadge = collection.totalRevenue && collection.totalRevenue > 0
      ? `<span class="rating-badge text-accent fw-bold"><i class="ph-fill ph-currency-dollar"></i> ${collection.totalRevenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} $</span>`
      : ""
    return `
        <div class="premium-card" onclick="window.location.href='collection.html?id=${collection.id}'">
            <img src="${posterSrc}" loading="lazy" alt="${collection.name}">
            <div class="card-details">
                <div class="card-title text-truncate">${collection.name}</div>
                <div class="card-meta">
                    <span class="rating-badge"><i class="ph-fill ph-stack"></i> ${collection.parts ? collection.parts.length : 0} FILMS</span>
                    ${revBadge}
                </div>
            </div>
        </div>
    `
  }).join('')

  // Afficher la carte "VOIR PLUS" en permanence pour permettre la découverte illimitée
  const canShowMore = !isSearching || searchCurrentPage < searchTotalPages
  if (canShowMore) {
    html += `
        <div class="premium-card view-more-collection-card" id="btn-load-more-collections" onclick="loadMoreCollections()" title="Afficher d'autres sagas">
            <div class="view-more-inner text-center">
                <i class="ph ph-plus-circle fs-1 mb-2 text-accent" id="view-more-icon"></i>
                <div class="fw-bold small view-more-text" id="view-more-label">VOIR PLUS</div>
            </div>
        </div>
    `
  }

  grid.innerHTML = html
  noCollectionsDiv.style.display = "none"
  grid.style.display = "grid"
}

// Afficher le message "aucune collection"
function showNoCollections(title = "Aucune collection trouvée", desc = "Aucun élément ne correspond à votre demande.") {
  const grid = document.getElementById("collections-grid")
  const noCollectionsDiv = document.getElementById("no-collections")
  const titleEl = document.getElementById("no-collections-title")
  const descEl = document.getElementById("no-collections-desc")
  const resetBtn = document.getElementById("btn-reset-search")
  const exploreFilms = document.getElementById("link-explore-films")

  if (titleEl) titleEl.textContent = title
  if (descEl) descEl.textContent = desc
  if (resetBtn) resetBtn.style.display = (isSearching || isDiscoveryMode) ? "inline-block" : "none"
  if (exploreFilms) exploreFilms.style.display = (isSearching || isDiscoveryMode) ? "none" : "inline-block"

  grid.style.display = "none"
  noCollectionsDiv.style.display = "block"
}

// Obtenir le nom de la langue
function getLanguageName(languageCode) {
  const languageNames = {
    'en': 'Anglais',
    'fr': 'Français',
    'es': 'Espagnol',
    'de': 'Allemand',
    'it': 'Italien',
    'ja': 'Japonais',
    'zh': 'Chinois',
    'ru': 'Russe',
    'pt': 'Portugais',
    'ko': 'Coréen'
  }
  return languageNames[languageCode?.toLowerCase()] || languageCode?.toUpperCase() || 'Inconnu'
}

window.getLanguageName = getLanguageName

// Initialiser les boutons de tri
function initSortButtons() {
  const sortButtons = document.querySelectorAll(".sort-btn")

  sortButtons.forEach(button => {
    button.addEventListener("click", () => {
      const sortMethod = button.getAttribute("data-sort")

      sortButtons.forEach(btn => btn.classList.remove("active"))
      button.classList.add("active")

      applySorting(sortMethod)
    })
  })
}

// Appliquer le tri
function applySorting(sortMethod) {
  currentSortMethod = sortMethod
  let sortedCollections = [...allCollections]

  switch (sortMethod) {
    case "name":
      sortedCollections.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      break

    case "name-desc":
      sortedCollections.sort((a, b) => b.name.localeCompare(a.name, 'fr'))
      break

    case "movies-desc":
      sortedCollections.sort((a, b) => {
        const moviesA = a.parts ? a.parts.length : 0
        const moviesB = b.parts ? b.parts.length : 0
        return moviesB - moviesA
      })
      break

    case "movies-asc":
      sortedCollections.sort((a, b) => {
        const moviesA = a.parts ? a.parts.length : 0
        const moviesB = b.parts ? b.parts.length : 0
        return moviesA - moviesB
      })
      break

    case "recettes-desc":
      sortedCollections.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      break

    case "recettes-asc":
      sortedCollections.sort((a, b) => (a.totalRevenue || 0) - (b.totalRevenue || 0))
      break

    case "original":
    default:
      sortedCollections = [...allCollections]
      break
  }

  renderCollections(sortedCollections)
}

// Rendre la fonction accessible globalement pour le bouton Voir Plus
window.loadMoreCollections = loadMoreCollections
window.startDiscoveryMode = startDiscoveryMode
