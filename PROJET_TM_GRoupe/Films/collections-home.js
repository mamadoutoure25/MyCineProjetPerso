/**
 * @file collections-home.js
 * @description Gère l'affichage des collections populaires sur la page d'accueil
 * @version 1.0
 */

// Configuration API TMDB
const COLLECTIONS_HOME_CONFIG = {
  API_KEY: "04c35731a5ee918f014970082a0088b1",
  BASE_URL: "https://api.themoviedb.org/3",
  IMAGE_BASE_URL: "https://image.tmdb.org/t/p",
  POSTER_SIZE: "w500",
  BACKDROP_SIZE: "w1280",
}

// Collections à afficher sur la page d'accueil (5 principales)
const HOME_POPULAR_COLLECTIONS = [
  86311,   // The Avengers
  295, // Pirates of the Caribbean
  10,      // Star Wars
  2344, // Matrix
  119, // Le Seigneur des anneaux
  1241,    // Harry Potter
]

// Charger les collections au chargement du DOM
document.addEventListener("DOMContentLoaded", () => {
  loadHomeCollections()
})

/**
 * Charge les collections populaires pour la page d'accueil
 */
async function loadHomeCollections() {
  try {
    const grid = document.getElementById("home-collections-grid")
    if (!grid) return

    const collectionsData = []

    for (const collectionId of HOME_POPULAR_COLLECTIONS) {
      try {
        const response = await fetch(
          `${COLLECTIONS_HOME_CONFIG.BASE_URL}/collection/${collectionId}?api_key=${COLLECTIONS_HOME_CONFIG.API_KEY}&language=fr-FR`
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
      grid.innerHTML = '<p class="text-muted text-center py-5">Impossible de charger les collections.</p>'
    } else {
      displayHomeCollections(collectionsData, grid)
    }
  } catch (error) {
    console.error("Erreur lors du chargement des collections:", error)
  }
}

/**
 * Affiche les collections dans la grille de la page d'accueil
 */
function displayHomeCollections(collections, grid) {
  grid.className = "collections-grid-home"
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  `

  grid.innerHTML = collections.map(collection => `
    <a href="PROJET_TM_GRoupe/Films/collection.html?id=${collection.id}" 
       class="collection-home-link" 
       style="text-decoration: none; color: inherit;">
      <div class="collection-home-card" style="
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        height: 250px;
        background: var(--card-bg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid var(--border);
      "
      onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 12px 24px rgba(245, 158, 11, 0.2)'"
      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.15)'">
        
        <img src="${collection.poster_path ? `${COLLECTIONS_HOME_CONFIG.IMAGE_BASE_URL}/${COLLECTIONS_HOME_CONFIG.POSTER_SIZE}${collection.poster_path}` : 'https://via.placeholder.com/500x750?text=Image+indisponible'}" 
             alt="${collection.name}" 
             style="width: 100%; height: 100%; object-fit: cover;">
        
        <div style="
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.9) 100%);
          z-index: 2;
        "></div>
        
        <div style="
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          z-index: 3;
          color: white;
        ">
          <h3 style="
            font-size: 1rem;
            font-weight: 700;
            margin-bottom: 8px;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          ">${collection.name}</h3>
          
          <div style="
            display: flex;
            gap: 10px;
            align-items: center;
            font-size: 0.85rem;
          ">
            <span style="
              background: linear-gradient(135deg, var(--primary), var(--secondary));
              padding: 4px 10px;
              border-radius: 12px;
              font-weight: 600;
              white-space: nowrap;
            ">
              <i class="ph ph-film-slate me-1" style="font-size: 0.9em;"></i>
              ${collection.parts ? collection.parts.length : 0} films
            </span>
          </div>
        </div>
      </div>
    </a>
  `).join('')
}

// Exporter la fonction pour utilisation externe
window.loadHomeCollections = loadHomeCollections
window.displayHomeCollections = displayHomeCollections

