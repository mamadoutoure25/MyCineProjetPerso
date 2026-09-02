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
let galleryImagesCache = null

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

  const savedTheme = localStorage.getItem("theme") || "dark"
  root.setAttribute("data-theme", savedTheme)
  updateThemeIcon(savedTheme, themeIcon)
  updateThemeButtonLabel(savedTheme, toggleButton)
}

function updateThemeIcon(theme, iconElement) {
  if (!iconElement) return
  iconElement.className = theme === "dark" ? "ph ph-moon fs-4" : "ph ph-sun fs-4"
}

function updateThemeButtonLabel(theme, button) {
  if (!button) return
  const nextThemeLabel = theme === "dark" ? "clair" : "sombre"
  const label = `Passer en mode ${nextThemeLabel}`
  button.setAttribute("aria-label", label)
  button.setAttribute("title", label)
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

    const response = await fetch(`${CONFIG.BASE_URL}/collection/${id}?api_key=${CONFIG.API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`)

    if (!response.ok) {
      throw new Error("Collection non trouvée")
    }

    collectionData = await response.json()

    const [imagesRes] = await Promise.allSettled([
      fetch(`${CONFIG.BASE_URL}/collection/${id}/images?api_key=${CONFIG.API_KEY}`).then(r => r.json()),
      fetchCastAndCrew()
    ]);

    await syncCollectionPoster(id);
    afficherCollection(collectionData)

    if (imagesRes.status === "fulfilled" && imagesRes.value) {
      galleryImagesCache = imagesRes.value;
      afficherGallery(imagesRes.value)
    }
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

    if (!collectionData || !collectionData.parts) return

    const movieResults = await Promise.all(
      collectionData.parts.map(movie =>
        fetch(`${CONFIG.BASE_URL}/movie/${movie.id}?api_key=${CONFIG.API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&append_to_response=credits`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    )

    for (const movieData of movieResults) {
      if (!movieData) continue
      totalRevenue += movieData.revenue || 0

      if (movieData.credits?.cast) {
        movieData.credits.cast.forEach(actor => {
          if (!castSet.has(actor.id)) {
            castSet.add(actor.id)
            cast.push(actor)
          }
        })
      }

      if (movieData.credits?.crew) {
        movieData.credits.crew.filter(member => member.job === "Director" || member.job === "Writer").slice(0, 3).forEach(member => {
          if (!crewSet.has(member.id)) {
            crewSet.add(member.id)
            crew.push(member)
          }
        })
      }
    }

    collectionData.cast = cast.slice(0, 24)
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

  const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : JSON.parse(sessionStorage.getItem("auth") || localStorage.getItem("lastAuth") || "null");
  const user = auth ? (auth.userId || auth.id) : null;

  const poster = document.getElementById("collection-poster")
  let customPoster = localStorage.getItem(`custom_collection_poster_${collection.id}`)
  if (window.getCustomPoster) {
      customPoster = window.getCustomPoster(collection.id, customPoster, 'collection');
  }
  const resetBtn = document.getElementById("btn-reset-poster")
  const changeBtn = document.getElementById("btn-change-poster")

  if (!user) {
      if (changeBtn) changeBtn.style.display = "none";
      if (resetBtn) resetBtn.style.display = "none";
  } else {
      if (resetBtn) resetBtn.style.display = customPoster ? "inline-block" : "none";
  }

  if (customPoster) {
    if (poster) poster.src = customPoster
  } else if (collection.poster_path) {
    if (poster) {
      poster.src = `${CONFIG.IMAGE_BASE_URL}/${CONFIG.POSTER_SIZE}${collection.poster_path}`
      poster.alt = collection.name
    }
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
  return revenue && revenue > 0 ? revenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $" : "Non divulgué";
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
    castContainer.innerHTML = '<p class="opacity-50 fs-6 py-4 col-12">Aucune information sur la distribution.</p>'
    return
  }

  castContainer.innerHTML = cast.map(actor => `
    <div class="small-actor-card" onclick="voirActeur(${actor.id})">
      <img src="${actor.profile_path ? `${CONFIG.IMAGE_BASE_URL}/w500${actor.profile_path}` : 'https://via.placeholder.com/300x450?text=Photo'}" 
           alt="${actor.name}" loading="lazy">
      <div class="actor-hover-overlay">
        <div class="actor-name text-truncate">${actor.name}</div>
        <div class="actor-role text-truncate">${actor.character || "N/A"}</div>
      </div>
    </div>
  `).join("")
}

// Afficher l'équipe
function afficherCrew(crew) {
  const crewContainer = document.getElementById("collection-crew")
  if (!crew || crew.length === 0) {
    crewContainer.innerHTML = '<p class="opacity-50 fs-6 py-4 col-12">Aucune information sur l\'équipe.</p>'
    return
  }

  crewContainer.innerHTML = crew.map(member => `
    <div class="crew-card">
      <div class="fw-extrabold text-theme text-truncate mb-1" style="font-size: 0.9rem;">${member.name}</div>
      <span class="badge rounded-pill bg-secondary x-small opacity-75">${member.job}</span>
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
    moviesGrid.className = "movie-grid-6"
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

// Rendre la galerie de médias
function afficherGallery(imgs) {
  if (imgs) galleryImagesCache = imgs;

  // Récupérer le lien de l'affiche actuellement active (personnalisée ou par défaut)
  const savedCustom = collectionId ? localStorage.getItem(`custom_collection_poster_${collectionId}`) : null;
  const defaultPoster = collectionData && collectionData.poster_path ? `${CONFIG.IMAGE_BASE_URL}/${CONFIG.POSTER_SIZE}${collectionData.poster_path}` : '';
  const currentActivePoster = savedCustom || defaultPoster;

  const renderGrid = (items, gridId, isPost = false) => {
    const c = document.getElementById(gridId);
    if (!c) return;
    if (!items || !items.length) return (c.innerHTML = "<p class='p-4 opacity-50 text-center w-100'>Aucun média disponible.</p>");
    
    c.innerHTML = items.slice(0, 24).map((im, i) => {
      const fullUrl = `${CONFIG.IMAGE_BASE_URL}/${isPost ? 'w500' : 'w780'}${im.file_path}`;
      const originalUrl = `${CONFIG.IMAGE_BASE_URL}/original${im.file_path}`;
      
      // Vérifier si cette affiche est actuellement sélectionnée comme affiche principale
      const isSelected = isPost && currentActivePoster && im.file_path && currentActivePoster.includes(im.file_path);

      return `
        <div class="premium-card ${isSelected ? 'border-success' : ''}" style="width: 100% !important; min-width: 0 !important; max-width: none !important; position: relative;">
          <img src="${fullUrl}" loading="lazy" style="border-radius: 16px; width: 100%; aspect-ratio: ${isPost ? '2/3' : '16/9'}; object-fit: cover;">
          ${isSelected ? `<div class="position-absolute top-0 start-0 m-2 badge bg-success rounded-pill px-3 py-1.5 fw-bold shadow"><i class="ph-fill ph-check-circle me-1"></i> Actuelle</div>` : ''}
          <div class="card-details">
            <div class="d-flex flex-column gap-2 justify-content-center align-items-center w-100 mt-auto">
              ${isPost ? (
                isSelected 
                  ? `<span class="badge bg-success rounded-pill px-3 py-1.5 fw-bold mb-1"><i class="ph-fill ph-check-circle me-1"></i> Affiche Sélectionnée</span>`
                  : `<button class="btn btn-sm btn-primary rounded-pill px-3 py-1.5 x-small fw-bold shadow-sm mb-1" onclick="changerAfficheCollection('${fullUrl}')" title="Définir comme affiche principale"><i class="ph ph-check me-1"></i> Choisir cette affiche</button>`
              ) : ''}
              <div class="d-flex gap-2 justify-content-center align-items-center mt-1">
                <button class="btn btn-sm btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;" onclick="openModal('img', '${originalUrl}', 'Aperçu HD')" title="Aperçu / Zoomer"><i class="ph ph-eye fs-5 text-dark"></i></button>
                <button class="btn btn-sm btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;" onclick="downloadImg('${originalUrl}', 'saga-media-${i + 1}.jpg')" title="Télécharger HD"><i class="ph ph-download-simple fs-5 text-dark"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  };
  renderGrid(imgs?.backdrops, "grid-backdrops");
  renderGrid(imgs?.posters, "grid-posters", true);
}

function getAuthHeadersCollection() {
    const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : null;
    const headers = { 'Content-Type': 'application/json' };
    if (auth && auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
    }
    return headers;
}

async function syncCollectionPoster(colId) {
    const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : null;
    if (auth && auth.token) {
        try {
            const res = await fetch(`./user_posters.php?tmdb_id=${colId}&media_type=collection`, {
                headers: getAuthHeadersCollection()
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.poster_path) {
                    localStorage.setItem(`custom_collection_poster_${colId}`, data.poster_path);
                } else if (data.success && data.poster_path === null) {
                    localStorage.removeItem(`custom_collection_poster_${colId}`);
                }
            }
        } catch (e) {
            console.warn("Erreur sync affiche collection API:", e);
        }
    }
}

// Fonction pour changer l'affiche principale de la collection
async function changerAfficheCollection(posterUrl) {
  if (!collectionId) return;
  localStorage.setItem(`custom_collection_poster_${collectionId}`, posterUrl);
  const posterEl = document.getElementById("collection-poster");
  if (posterEl) posterEl.src = posterUrl;
  
  const resetBtn = document.getElementById("btn-reset-poster");
  if (resetBtn) resetBtn.style.display = "inline-block";

  afficherNotification("Affiche de la collection mise à jour avec succès !", "success");

  const auth = JSON.parse(sessionStorage.getItem("auth") || localStorage.getItem("lastAuth") || "null");
  if (auth && auth.token) {
      try {
          await fetch('./user_posters.php', {
              method: 'POST',
              headers: getAuthHeadersCollection(),
              body: JSON.stringify({
                  tmdb_id: parseInt(collectionId),
                  media_type: 'collection',
                  poster_path: posterUrl
              })
          });
      } catch (e) {
          console.error("Erreur de sauvegarde de l'affiche de collection:", e);
      }
  }

  // Mettre à jour l'affichage dynamique de la galerie
  if (galleryImagesCache) {
    afficherGallery(galleryImagesCache);
  }
  
  // Remonter en douceur vers le hero
  document.getElementById("collection-hero")?.scrollIntoView({ behavior: "smooth" });
}

// Réinitialiser l'affiche originale de la collection
async function resetAfficheCollection() {
  if (!collectionId) return;
  localStorage.removeItem(`custom_collection_poster_${collectionId}`);
  const posterEl = document.getElementById("collection-poster");
  if (posterEl && collectionData && collectionData.poster_path) {
    posterEl.src = `${CONFIG.IMAGE_BASE_URL}/${CONFIG.POSTER_SIZE}${collectionData.poster_path}`;
  }
  const resetBtn = document.getElementById("btn-reset-poster");
  if (resetBtn) resetBtn.style.display = "none";

  afficherNotification("Affiche réinitialisée à l'originale", "info");

  const auth = JSON.parse(sessionStorage.getItem("auth") || localStorage.getItem("lastAuth") || "null");
  if (auth && auth.token) {
      try {
          await fetch(`./user_posters.php?tmdb_id=${collectionId}&media_type=collection`, {
              method: 'DELETE',
              headers: getAuthHeadersCollection()
          });
      } catch (e) {
          console.error("Erreur de réinitialisation d'affiche de collection:", e);
      }
  }

  // Mettre à jour l'affichage dynamique de la galerie
  if (galleryImagesCache) {
    afficherGallery(galleryImagesCache);
  }
}

// Ouvrir la galerie d'affiches
function ouvrirModalSelectAffiche() {
  const imagesSec = document.getElementById("images-section") || document.querySelector(".tab-content");
  // Basculer vers l'onglet affiches
  const postTabBtn = document.querySelector('button[data-bs-target="#tab-post"]');
  if (postTabBtn) {
    const tab = new bootstrap.Tab(postTabBtn);
    tab.show();
  }
  if (imagesSec) {
    imagesSec.scrollIntoView({ behavior: "smooth" });
  }
  afficherNotification("Sélectionnez 'Choisir' sur l'affiche de votre choix ci-dessous", "info");
}

// Toast notification helper
function afficherNotification(message, type = "success") {
  const toastContainer = document.getElementById("toast-notification");
  const toastMsg = document.getElementById("toast-message");
  if (toastContainer && toastMsg) {
    const icon = type === "success" ? "ph-check-circle" : "ph-info";
    toastMsg.innerHTML = `<i class="ph ${icon} fs-4"></i> ${message}`;
    toastContainer.style.display = "block";
    setTimeout(() => {
      toastContainer.style.display = "none";
    }, 4000);
  }
}

function openModal(type, src, title) {
  const cont = document.getElementById("mediaModalContent");
  const titleEl = document.getElementById("mediaModalTitle");
  if (titleEl) titleEl.textContent = title;
  if (cont) {
    cont.innerHTML = type === "video" ? `<div class="ratio ratio-16x9"><iframe src="https://www.youtube.com/embed/${src}?autoplay=1" allowfullscreen></iframe></div>` : `<img src="${src}" class="img-fluid rounded-4 shadow-lg">`;
  }
  const modal = new bootstrap.Modal(document.getElementById('mediaModal'));
  modal.show();
}

async function downloadImg(url, name) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
  } catch (e) { window.open(url, '_blank'); }
}

// Rendre les fonctions accessibles globalement
window.voirFilm = voirFilm;
window.voirActeur = voirActeur;
window.openModal = openModal;
window.downloadImg = downloadImg;
window.changerAfficheCollection = changerAfficheCollection;
window.resetAfficheCollection = resetAfficheCollection;
window.ouvrirModalSelectAffiche = ouvrirModalSelectAffiche;