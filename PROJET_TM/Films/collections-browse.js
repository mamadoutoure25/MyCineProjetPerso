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
  328, // Jurassic Park
  8650, // Transformers
  264, // Back to the Future
  173710, // La Planète des singes
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
  1539140, // Godzilla x Kong
  535313, // Godzilla
  8864, // Final Destination
  399, // Predator
  420, // Le Monde de Narnia
  283579, // Divergente
  495527, // Jumanji
  284433, // Gardiens de la Galaxie
  1434946, // Alien Romulus
  422837, // The Conjuring Universe
  553717, // Creed
  1733, // La Momie
  17255, // Resident Evil
  925155, // Demon Slayer
  94032, // Roi Lion
  544669, // Les Minions
  468222, // Les Indestructibles
  77816, // Kung Fu Panda
  2150, // Shrek
  86066, // Moi Moche et Méchant
  556, // Spider-Man
  573436, // Spider Man New Generation
  126125, // Expendables
  402074, // Annabelle
  89137, // Dragons
  131230, // Toy Story
  131292, // Iron Man
  131296, // Captain America
  131295, // Thor
  131294, // Ant-Man
  131252, // Venom
  93935, // Cars
  744, // Men in Black
  623, // Die Hard
  10194, // Saw
  7326, // Scream
  722, // L'Arme Fatale
  656, // Superman
  7711, // DCEU
  5353, // Ice Age / L'Âge de glace
  8092, // RoboCop
  7670, // Ocean's
  95039, // Sonic the Hedgehog
  2354, // Le Parrain (The Godfather)
  1565, // Bad Boys
  521, // Rambo
  304, // SOS Fantômes (Ghostbusters)
  2980, // Le Flic de Beverly Hills
  10839, // Une nuit au musée
  10214, // Maman j'ai raté l'avion (Home Alone)
  2584, // Karate Kid
  3804, // Insidious
  3004, // Halloween
  100788, // Paranormal Activity
  2366, // Gremlins
  2302, // Bridget Jones
  11777, // Rush Hour
  2282, // Benjamin Gates (National Treasure)
  2356, // Austin Powers
  91361, // Hôtel Transylvanie
  302331, // Paddington
  9735, // Scary Movie
  310 // Planet of the Apes Classic
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

// Charger les collections en parallèle
async function loadCollections() {
  try {
    const fetchPromises = POPULAR_COLLECTIONS.map(id =>
      fetch(`${COLLECTIONS_CONFIG.BASE_URL}/collection/${id}?api_key=${COLLECTIONS_CONFIG.API_KEY}&language=fr-FR`)
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
    )

    const rawCollections = await Promise.all(fetchPromises)
    const validCollections = rawCollections.filter(c => c !== null)

    // Calculer les recettes totales par collection
    await fetchCollectionsRevenue(validCollections)

    if (validCollections.length === 0) {
      showNoCollections()
    } else {
      displayCollections(validCollections)
    }
  } catch (error) {
    console.error("Erreur lors du chargement des collections:", error)
    showNoCollections()
  }
}

// Récupérer le box-office total des films de chaque collection
async function fetchCollectionsRevenue(collections) {
  await Promise.all(
    collections.map(async (c) => {
      if (!c.parts || c.parts.length === 0) {
        c.totalRevenue = 0;
        return;
      }
      try {
        const moviePromises = c.parts.map(m =>
          fetch(`${COLLECTIONS_CONFIG.BASE_URL}/movie/${m.id}?api_key=${COLLECTIONS_CONFIG.API_KEY}`)
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        );
        const moviesDetails = await Promise.all(moviePromises);
        c.totalRevenue = moviesDetails.reduce((sum, m) => sum + (m && m.revenue ? m.revenue : 0), 0);
      } catch (e) {
        c.totalRevenue = 0;
      }
    })
  );
}

// Afficher les collections
function displayCollections(collections) {
  allCollections = [...collections]
  renderCollections(allCollections)
}

// Afficher les cartes de collection
function renderCollections(collectionsToDisplay) {
  const grid = document.getElementById("collections-grid")
  const noCollectionsDiv = document.getElementById("no-collections")

  if (collectionsToDisplay.length === 0) {
    grid.style.display = "none"
    noCollectionsDiv.style.display = "block"
    return
  }

  grid.innerHTML = collectionsToDisplay.map(collection => {
    const revBadge = collection.totalRevenue && collection.totalRevenue > 0
      ? `<span class="rating-badge text-accent fw-bold"><i class="ph-fill ph-currency-dollar"></i> ${collection.totalRevenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} $</span>`
      : "";
    return `
        <div class="premium-card" onclick="window.location.href='collection.html?id=${collection.id}'">
            <img src="${collection.poster_path ? `${COLLECTIONS_CONFIG.IMAGE_BASE_URL}/${COLLECTIONS_CONFIG.POSTER_SIZE}${collection.poster_path}` : 'https://via.placeholder.com/500x750?text=Affiche+indisponible'}" loading="lazy" alt="${collection.name}">
            <div class="card-details">
                <div class="card-title text-truncate">${collection.name}</div>
                <div class="card-meta">
                    <span class="rating-badge"><i class="ph-fill ph-stack"></i> ${collection.parts ? collection.parts.length : 0} FILMS</span>
                    ${revBadge}
                </div>
            </div>
        </div>
    `;
  }).join('')

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

    case "recettes-desc":
      // Trier par recettes totales (Plus > Moins)
      sortedCollections.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      break

    case "recettes-asc":
      // Trier par recettes totales (Moins > Plus)
      sortedCollections.sort((a, b) => (a.totalRevenue || 0) - (b.totalRevenue || 0))
      break

    case "original":
    default:
      // Garder l'ordre original
      sortedCollections = [...allCollections]
      break
  }

  renderCollections(sortedCollections)
}
