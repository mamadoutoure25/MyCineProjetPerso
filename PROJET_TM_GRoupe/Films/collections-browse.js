// Configuration API TMDB
const COLLECTIONS_CONFIG = {
  API_KEY: "04c35731a5ee918f014970082a0088b1",
  BASE_URL: "https://api.themoviedb.org/3",
  IMAGE_BASE_URL: "https://image.tmdb.org/t/p",
  POSTER_SIZE: "w500",
  BACKDROP_SIZE: "w1280",
}

// Variable globale pour stocker les collections
let allCollections = []
let currentSortMethod = "original"

// Collections populaires à charger
const POPULAR_COLLECTIONS = [

  119, // Le Seigneur des anneaux
  10, // Star Wars
  8091, // Alien
  295, // Pirates of the Caribbean
  528, // Terminator
  2344, // Matrix
  726871, // Dune
  1241, // Harry Potter
  435259, // Les Animaux Fantastiques
  328, //Jurassic Park
  8650, // Transformers
   264 ,// Back to the Future
  173710, //La Planète des singes
  84, // Indiana Jones
  404609, // John Wick

  435, // Batman
  645, // James Bond
  748, // X-men
  87359, // Mission: Impossible
  8945, // Mad Max
  33514, // Twilight
  1069584, // Gladiator
  9485, // Fast & Furious
  131635, // Hunger Games
  295130, // Le Labyrinthe
  105995, // The Bourne Collection
  120364, // Star Trek
  86311, // The Avengers
  87096, // Avatar Saga

  121938, // Le Hobbit
  1575, // Rocky
  277, // Underworld




  420, // Le Monde de Narnia
  283579, // Divergente
  495527, // Jumanji
  284433,  // Gardiens de la Galaxie
  1434946, // Alien Romulus
  422837, // The Conjuring Universe
  553717, // Creed
  1733, // La Momie
  313086,  // The Conjuring Universe
  925155, // Demon Slayer
  94032, // Roi Lion
  762512, // Le Roi Lion Remake
  1451578, // Coco
  1084247, // Zootopie
  14740, // Madagascar
  544669, // lES MINIONS
  468222, // Les Indestructibles
  77816, // Kung Fu Panda
  2150, // Shrek
  229932, // Rio
  86066, // Moi Moche et Méchant

  556, // Spider-Man
  573436, // Spider Man New Generation
  531241, // Spider Man Avengers
  125574, // The Amazing Spider
  126125, // Expendables
  402074, // Anabelle
  89137, // Dragons

  579870, //  Qu'est-ce qu'on a fait au Bon Dieu ?
]

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  initTheme()
  loadCollections()
  initSortButtons()
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

// Charger les collections
async function loadCollections() {
  try {
    const collectionsData = []

    for (const collectionId of POPULAR_COLLECTIONS) {
      try {
        const response = await fetch(
          `${COLLECTIONS_CONFIG.BASE_URL}/collection/${collectionId}?api_key=${COLLECTIONS_CONFIG.API_KEY}&language=fr-FR`
        )

        if (response.ok) {
          const data = await response.json()
          collectionsData.push(data)
        }
      } catch (error) {
        console.warn(`Erreur lors du chargement de la collection ${collectionId}:`, error)
      }
    }

    if (collectionsData.length === 0) {
      showNoCollections()
    } else {
      displayCollections(collectionsData)
    }
  } catch (error) {
    console.error("Erreur lors du chargement des collections:", error)
    showNoCollections()
  }
}

// Afficher les collections
function displayCollections(collections) {
  allCollections = [...collections]
  renderCollections(allCollections)
}

// Afficher les collections triées
function renderCollections(collectionsToDisplay) {
  const grid = document.getElementById("collections-grid")
  const noCollectionsDiv = document.getElementById("no-collections")

  if (collectionsToDisplay.length === 0) {
    grid.style.display = "none"
    noCollectionsDiv.style.display = "block"
    return
  }

  grid.innerHTML = collectionsToDisplay.map(collection => `
    <a href="collection.html?id=${collection.id}" class="collection-card-link">
      <div class="collection-card-preview">
        <img src="${collection.poster_path ? `${COLLECTIONS_CONFIG.IMAGE_BASE_URL}/${COLLECTIONS_CONFIG.POSTER_SIZE}${collection.poster_path}` : 'https://via.placeholder.com/500x750?text=Affiche+indisponible'}" 
             alt="${collection.name}" 
             class="collection-card-image"
             loading="lazy">
        <div class="collection-card-overlay"></div>
        <div class="collection-card-info">
          <div class="collection-card-title">${collection.name}</div>
          <div class="collection-card-meta">
            <span class="collection-card-badge">
              <i class="ph ph-film-slate me-1"></i> ${collection.parts ? collection.parts.length : 0} films
            </span>
            ${collection.original_language ? `<span style="opacity: 0.8;">🌐 ${getLanguageName(collection.original_language)}</span>` : ''}
          </div>
        </div>
      </div>
    </a>
  `).join('')

  noCollectionsDiv.style.display = "none"
  grid.style.display = "grid"
}

// Afficher le message "aucune collection"
function showNoCollections() {
  const grid = document.getElementById("collections-grid")
  const noCollectionsDiv = document.getElementById("no-collections")

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

// Rendre les fonctions accessibles globalement
window.getLanguageName = getLanguageName

// Initialiser les boutons de tri
function initSortButtons() {
  const sortButtons = document.querySelectorAll(".sort-btn")

  sortButtons.forEach(button => {
    button.addEventListener("click", () => {
      const sortMethod = button.getAttribute("data-sort")

      // Mettre à jour l'état des boutons
      sortButtons.forEach(btn => btn.classList.remove("active"))
      button.classList.add("active")

      // Appliquer le tri
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
      // Trier par nom (A-Z)
      sortedCollections.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      break

    case "name-desc":
      // Trier par nom (Z-A)
      sortedCollections.sort((a, b) => b.name.localeCompare(a.name, 'fr'))
      break

    case "movies-desc":
      // Trier par nombre de films (Plus > Moins)
      sortedCollections.sort((a, b) => {
        const moviesA = a.parts ? a.parts.length : 0
        const moviesB = b.parts ? b.parts.length : 0
        return moviesB - moviesA
      })
      break

    case "movies-asc":
      // Trier par nombre de films (Moins > Plus)
      sortedCollections.sort((a, b) => {
        const moviesA = a.parts ? a.parts.length : 0
        const moviesB = b.parts ? b.parts.length : 0
        return moviesA - moviesB
      })
      break

    case "original":
    default:
      // Garder l'ordre original
      sortedCollections = [...allCollections]
      break
  }

  renderCollections(sortedCollections)
}

