const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const elements = {
    alertContainer: document.getElementById('alert-container'),
    sortSelect: document.getElementById('sort-select'),
    filterBtn: document.getElementById('filter-btn'),
    filterPanel: document.getElementById('filter-panel'),
    yearFilter: document.getElementById('year-filter'),
    ratingFilter: document.getElementById('rating-filter'),
    ratingValue: document.getElementById('rating-value'),
    applyFiltersBtn: document.getElementById('apply-filters'),
    trendingCarousel: document.getElementById('trending-carousel'),
    nowPlayingMovies: document.getElementById('now-playing-movies'),
    popularMovies: document.getElementById('popular-movies'),
    topRatedMovies: document.getElementById('top-rated-movies'),
    upcomingMovies: document.getElementById('upcoming-movies'),
    genreSection: document.getElementById('genre-section'),
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    searchResults: document.getElementById('search-results'),
    loginLink: document.getElementById('login-link'),
    profileLink: document.getElementById('profile-link'),
    favoritesLink: document.getElementById('favorites-link'),
    divider: document.getElementById('divider'),
    logoutLink: document.getElementById('logout-link'),
    viewTrending: document.getElementById('view-trending'),
    viewNowPlaying: document.getElementById('view-now-playing'),
    viewPopular: document.getElementById('view-popular'),
    viewTopRated: document.getElementById('view-top-rated'),
    viewUpcoming: document.getElementById('view-upcoming'),
    allMovies: document.getElementById('all-movies')
};

let allFilms = [];
let displayedFilms = [];
let currentPage = 0;
const filmsPerPage = 12;
let state = {
    auth: null,
    favorites: new Set(),
    currentFilter: '',
    currentYear: '',
    isLoading: false,
    currentMovieId: null,
    isFavorite: false
};

function checkAuth() {
    const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : null;
    if (auth) {
        state.auth = auth;
        return true;
    }
    state.auth = null;
    return false;
}

function updateAuthUI() {
    const isLoggedIn = checkAuth();
    if (elements.loginLink && elements.profileLink) {
        if (isLoggedIn) {
            elements.loginLink.classList.add('d-none');
            elements.profileLink.classList.remove('d-none');
            elements.favoritesLink.classList.remove('d-none');
            elements.divider.classList.remove('d-none');
            elements.logoutLink.classList.remove('d-none');
            if (state.auth && state.auth.pseudo) {
                elements.profileLink.innerHTML = `<i class="ph ph-user me-2"></i> ${state.auth.pseudo}`;
            }
        } else {
            elements.loginLink.classList.remove('d-none');
            elements.profileLink.classList.add('d-none');
            elements.favoritesLink.classList.add('d-none');
            elements.divider.classList.add('d-none');
            elements.logoutLink.classList.add('d-none');
        }
    }
}

elements.ratingFilter.addEventListener('input', () => {
    elements.ratingValue.textContent = elements.ratingFilter.value;
});

elements.filterBtn.addEventListener('click', () => {
    elements.filterPanel.classList.toggle('d-none');
});

async function loadFilms() {
    if (state.isLoading) return;
    state.isLoading = true;
    elements.alertContainer.innerHTML = '';

    try {
        const response = await fetch('./projetBD.php', { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.errors) {
            elements.alertContainer.innerHTML = `<div class="alert alert-danger">${data.errors.join('<br>')}</div>`;
            return;
        }
        if (data.films.length === 0) {
            elements.alertContainer.innerHTML = `<div class="alert alert-info">${data.message || 'Aucun film trouvé dans la base de données.'}</div>`;
            return;
        }
        allFilms = data.films
            .map(film => {
                try {
                    return {
                        ...film,
                        genres: film.genres ? JSON.parse(film.genres) : [],
                        acteurs: film.acteurs ? JSON.parse(film.acteurs) : [],
                        note_moyenne: film.note_moyenne ? parseFloat(film.note_moyenne) : null
                    };
                } catch (e) {
                    console.error(`Erreur JSON pour le film ${film.titre || 'inconnu'} (tmdb_id: ${film.tmdb_id}):`, e);
                    return null;
                }
            })
            .filter(film => film !== null && film.tmdb_id);
        if (state.auth) {
            try {
                const response = await fetch('./favorites.php?user_id=' + state.auth.userId);
                const data = await response.json();
                if (data.favorites) {
                    state.favorites = new Set(data.favorites.map(f => parseInt(f.tmdb_id)));
                }
            } catch (error) {
                console.error('Erreur lors du chargement des favoris:', error);
            }
        }
        displayHomeData();
    } catch (error) {
        console.error('Erreur lors du chargement des films:', error);
        elements.alertContainer.innerHTML = `<div class="alert alert-danger">Erreur réseau: ${error.message}</div>`;
    } finally {
        state.isLoading = false;
    }
}

function displayHomeData() {
    const trending = allFilms
        .sort((a, b) => new Date(b.date_ajout || '1970-01-01') - new Date(a.date_ajout || '1970-01-01'))
        .slice(0, 10);
    displayTrendingMovies(trending);

    const popular = allFilms
        .filter(film => film.popularite != null)
        .sort((a, b) => (b.popularite || 0) - (a.popularite || 0))
        .slice(0, 12);
    displayPopularMovies(popular);

    const topRated = allFilms
        .filter(film => film.note_moyenne != null)
        .sort((a, b) => (b.note_moyenne || 0) - (a.note_moyenne || 0))
        .slice(0, 12);
    displayTopRatedMovies(topRated);

    const upcoming = allFilms
        .filter(film => film.date_sortie && new Date(film.date_sortie) > new Date())
        .sort((a, b) => new Date(a.date_sortie) - new Date(b.date_sortie))
        .slice(0, 12);
    displayUpcomingMovies(upcoming);

    displayAllMovies(allFilms);

    // Charger les films en lecture actuellement depuis TMDB
    loadNowPlayingMovies();
}

function displayTrendingMovies(movies) {
    if (!movies.length || !elements.trendingCarousel) return;
    elements.trendingCarousel.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
    setupMovieCardEventListeners();
}

function displayPopularMovies(movies) {
    if (!movies.length || !elements.popularMovies) return;
    elements.popularMovies.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
    setupMovieCardEventListeners();
}

function displayTopRatedMovies(movies) {
    if (!movies.length || !elements.topRatedMovies) return;
    elements.topRatedMovies.innerHTML = movies.map(movie => createMovieCard(movie, 'Top')).join('');
    setupMovieCardEventListeners();
}

function displayUpcomingMovies(movies) {
    if (!movies.length || !elements.upcomingMovies) return;
    elements.upcomingMovies.innerHTML = movies.map(movie => createMovieCard(movie, movie.date_sortie)).join('');
    setupMovieCardEventListeners();
}

function displayAllMovies(movies) {
    if (!movies.length || !elements.allMovies) return;
    elements.allMovies.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
    setupMovieCardEventListeners();
}

async function loadNowPlayingMovies() {
    try {
        const response = await fetch(`${API_BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&region=FR`);
        if (!response.ok) throw new Error('Erreur lors du chargement des films en lecture');

        const data = await response.json();
        const nowPlayingMovies = data.results.slice(0, 12).map(movie => ({
            tmdb_id: movie.id,
            titre: movie.title,
            poster_path: movie.poster_path ? `${IMG_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=Aucune+affiche',
            note_moyenne: movie.vote_average,
            date_sortie: movie.release_date,
            acteurs: []
        }));

        displayNowPlayingMovies(nowPlayingMovies);
    } catch (error) {
        console.error('Erreur lors du chargement des films now_playing:', error);
    }
}

function displayNowPlayingMovies(movies) {
    if (!movies.length || !elements.nowPlayingMovies) return;
    elements.nowPlayingMovies.innerHTML = movies.map(movie => {
        const isFavorite = state.favorites.has(parseInt(movie.tmdb_id));
        const titre = movie.titre || 'Sans titre';
        const note_moyenne = typeof movie.note_moyenne === 'number' && !isNaN(movie.note_moyenne)
            ? (movie.note_moyenne * 2).toFixed(1)
            : 'N/A';

        return `
            <div class="col">
                <div class="card h-100 border-0 shadow-sm movie-card vod-provider-card" data-id="${movie.tmdb_id}">
                    <div class="position-relative" style="height: 300px; overflow: hidden;">
                        <img src="${movie.poster_path}" 
                             class="card-img-top h-100 object-fit-cover" 
                             alt="${titre}"
                             loading="lazy"
                             onerror="this.src='https://via.placeholder.com/500x750?text=Image+indisponible'">
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-movie-id="${movie.tmdb_id}">
                            <i class="ph ${isFavorite ? 'ph-heart-fill' : 'ph-heart'}"></i>
                        </button>
                        <span class="position-absolute top-0 end-0 m-2 badge bg-success">
                            En lecture
                        </span>
                    </div>
                    <div class="card-body p-3">
                        <h5 class="card-title text-truncate mb-2">${titre}</h5>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge ${getRatingClass(movie.note_moyenne)}">
                                <i class="ph ph-star"></i> ${note_moyenne}
                            </span>
                            <small class="text-muted">${movie.date_sortie || 'N/A'}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    setupMovieCardEventListeners();
}

function createMovieCard(movie, badgeText = null) {
    if (!movie.tmdb_id) return '';
    const isFavorite = state.favorites.has(parseInt(movie.tmdb_id));
    const acteurs = Array.isArray(movie.acteurs) && movie.acteurs.length > 0
        ? movie.acteurs.join(', ')
        : 'Aucun acteur';
    const titre = movie.titre || 'Sans titre';
    const annee = movie.annee || 'N/A';
    const note_moyenne = typeof movie.note_moyenne === 'number' && !isNaN(movie.note_moyenne)
        ? (movie.note_moyenne * 2).toFixed(1)
        : 'N/A';
    const poster_path = movie.poster_path || 'https://via.placeholder.com/500x750?text=Aucune+affiche';

    return `
        <div class="col">
            <div class="card h-100 border-0 shadow-sm movie-card vod-provider-card" data-id="${movie.tmdb_id}">
                <div class="position-relative" style="height: 300px; overflow: hidden;">
                    <img src="${poster_path}" 
                         class="card-img-top h-100 object-fit-cover" 
                         alt="${titre}"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/500x750?text=Image+indisponible'">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-movie-id="${movie.tmdb_id}">
                        <i class="ph ${isFavorite ? 'ph-heart-fill' : 'ph-heart'}"></i>
                    </button>
                    ${badgeText ? `
                        <span class="position-absolute top-0 end-0 m-2 badge bg-primary">
                            ${typeof badgeText === 'string' ? badgeText.substring(0, 7) + (badgeText.length > 7 ? '...' : '') : badgeText}
                        </span>
                    ` : ''}
                </div>
                <div class="card-body p-3">
                    <h5 class="card-title text-truncate mb-2">${titre}</h5>
                    <p class="card-text small text-muted mb-2">${acteurs}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge ${getRatingClass(movie.note_moyenne)}">
                            <i class="ph ph-star"></i> ${note_moyenne}
                        </span>
                        <small class="text-muted">${annee}</small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getRatingClass(vote) {
    const voteValue = typeof vote === 'string' ? parseFloat(vote) : vote;
    if (!voteValue || isNaN(voteValue)) return 'bg-danger';
    if (voteValue >= 8) return 'bg-success';
    if (voteValue >= 5) return 'bg-warning';
    return 'bg-danger';
}

function applyFiltersAndSort() {
    const year = elements.yearFilter.value ? parseInt(elements.yearFilter.value) : null;
    const minRating = parseFloat(elements.ratingFilter.value);
    const sort = elements.sortSelect.value;

    displayedFilms = allFilms.filter(film => {
        const matchesYear = !year || film.annee == year;
        const matchesRating = !minRating || (typeof film.note_moyenne === 'number' && film.note_moyenne >= minRating);
        return matchesYear && matchesRating;
    });

    displayedFilms.sort((a, b) => {
        if (sort === 'date_desc') {
            return (b.annee || 0) - (a.annee || 0);
        } else if (sort === 'date_asc') {
            return (a.annee || 0) - (b.annee || 0);
        } else if (sort === 'rating_desc') {
            return (b.note_moyenne || 0) - (a.note_moyenne || 0);
        } else if (sort === 'rating_asc') {
            return (a.note_moyenne || 0) - (b.note_moyenne || 0);
        }
        return 0;
    });

    currentPage = 0;
    elements.genreSection.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="section-title">Films filtrés</h2>
        </div>
        <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-4" id="filtered-movies"></div>
        <div class="text-center mt-4">
            <button id="load-more" class="btn btn-outline-primary">Charger plus</button>
        </div>
    `;
    displayFilms();
}

function displayFilms() {
    const start = currentPage * filmsPerPage;
    const end = start + filmsPerPage;
    const filmsToDisplay = displayedFilms.slice(start, end);

    const container = document.getElementById('filtered-movies');
    if (container) {
        container.innerHTML = filmsToDisplay.map(movie => createMovieCard(movie)).join('');
        setupMovieCardEventListeners();
    }

    const loadMoreBtn = document.getElementById('load-more');
    if (loadMoreBtn) {
        loadMoreBtn.classList.toggle('d-none', end >= displayedFilms.length);
    }
}

document.addEventListener('click', (e) => {
    if (e.target.id === 'load-more') {
        currentPage++;
        displayFilms();
    }
});

elements.applyFiltersBtn.addEventListener('click', () => {
    applyFiltersAndSort();
    elements.filterPanel.classList.add('d-none');
});

elements.sortSelect.addEventListener('change', applyFiltersAndSort);

function loadFilteredMovies(filter) {
    state.currentFilter = filter;
    state.currentYear = '';
    currentPage = 0;

    displayedFilms = allFilms.slice();
    if (filter === 'trending') {
        displayedFilms.sort((a, b) => new Date(b.date_ajout || '1970-01-01') - new Date(a.date_ajout || '1970-01-01'));
    } else if (filter === 'popular') {
        displayedFilms = displayedFilms
            .filter(film => film.popularite != null)
            .sort((a, b) => (b.popularite || 0) - (a.popularite || 0));
    } else if (filter === 'top_rated') {
        displayedFilms = displayedFilms
            .filter(film => film.note_moyenne != null)
            .sort((a, b) => (b.note_moyenne || 0) - (a.note_moyenne || 0));
    } else if (filter === 'upcoming') {
        displayedFilms = displayedFilms
            .filter(film => film.date_sortie && new Date(film.date_sortie) > new Date())
            .sort((a, b) => new Date(a.date_sortie) - new Date(b.date_sortie));
    }

    elements.genreSection.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="section-title">${getFilterTitle(filter)}</h2>
        </div>
        <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-4" id="filtered-movies"></div>
        <div class="text-center mt-4">
            <button id="load-more" class="btn btn-outline-primary">Charger plus</button>
        </div>
    `;
    displayFilms();
}

function getFilterTitle(filter) {
    const titles = {
        'trending': 'Tendances',
        'popular': 'Films populaires',
        'top_rated': 'Top Films',
        'upcoming': 'Prochaines sorties',
        'now_playing': 'Lecture en cours'
    };
    return titles[filter] || 'Films';
}

async function loadNowPlayingFiltered() {
    try {
        const response = await fetch(`${API_BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&region=FR&page=1`);
        if (!response.ok) throw new Error('Erreur lors du chargement des films en lecture');

        const data = await response.json();
        const nowPlayingMovies = data.results.map(movie => ({
            tmdb_id: movie.id,
            titre: movie.title,
            poster_path: movie.poster_path ? `${IMG_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=Aucune+affiche',
            note_moyenne: movie.vote_average,
            date_sortie: movie.release_date,
            acteurs: [],
            overview: movie.overview
        }));

        elements.genreSection.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="section-title">Lecture en cours</h2>
            </div>
            <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-4" id="filtered-movies"></div>
        `;

        const container = document.getElementById('filtered-movies');
        if (container) {
            container.innerHTML = nowPlayingMovies.map(movie => {
                const isFavorite = state.favorites.has(parseInt(movie.tmdb_id));
                const titre = movie.titre || 'Sans titre';
                const note_moyenne = typeof movie.note_moyenne === 'number' && !isNaN(movie.note_moyenne)
                    ? (movie.note_moyenne * 2).toFixed(1)
                    : 'N/A';

                return `
                    <div class="col">
                        <div class="card h-100 border-0 shadow-sm movie-card vod-provider-card" data-id="${movie.tmdb_id}">
                            <div class="position-relative" style="height: 300px; overflow: hidden;">
                                <img src="${movie.poster_path}" 
                                     class="card-img-top h-100 object-fit-cover" 
                                     alt="${titre}"
                                     loading="lazy"
                                     onerror="this.src='https://via.placeholder.com/500x750?text=Image+indisponible'">
                                <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-movie-id="${movie.tmdb_id}">
                                    <i class="ph ${isFavorite ? 'ph-heart-fill' : 'ph-heart'}"></i>
                                </button>
                                <span class="position-absolute top-0 end-0 m-2 badge bg-success">
                                    En lecture
                                </span>
                            </div>
                            <div class="card-body p-3">
                                <h5 class="card-title text-truncate mb-2">${titre}</h5>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge ${getRatingClass(movie.note_moyenne)}">
                                        <i class="ph ph-star"></i> ${note_moyenne}
                                    </span>
                                    <small class="text-muted">${movie.date_sortie || 'N/A'}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            setupMovieCardEventListeners();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des films now_playing filtrés:', error);
        elements.genreSection.innerHTML = `<div class="alert alert-danger">Erreur lors du chargement des films en lecture</div>`;
    }
}

window.showMovieDetails = function(tmdb_id) {
    window.location.href = `./movie-details.html?tmdb_id=${tmdb_id}`;
};

function setupMovieCardEventListeners() {
    document.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => {
            const tmdb_id = card.dataset.id;
            showMovieDetails(tmdb_id);
        });
    });

    document.querySelectorAll('.favorite-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const tmdb_id = parseInt(button.dataset.movieId);
            const isFavorite = button.classList.contains('active');

            const auth = typeof window.requireAuthForAction === 'function' ? window.requireAuthForAction("gérer les favoris") : null;
            if (!auth) return;
            state.auth = auth;

            try {
                const method = isFavorite ? 'DELETE' : 'POST';
                const response = await fetch('./favorites.php', {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.auth.token}`
                    },
                    body: JSON.stringify({
                        film_id: tmdb_id,
                        user_id: state.auth.userId
                    })
                });

                const data = await response.json();
                if (data.success) {
                    button.classList.toggle('active');
                    const icon = button.querySelector('i');
                    if (button.classList.contains('active')) {
                        icon.classList.replace('ph-heart', 'ph-heart-fill');
                        state.favorites.add(tmdb_id);
                        showToast('Film ajouté aux favoris', 'success');
                    } else {
                        icon.classList.replace('ph-heart-fill', 'ph-heart');
                        state.favorites.delete(tmdb_id);
                        showToast('Film retiré des favoris', 'warning');
                    }
                    displayHomeData();
                    if (state.currentFilter) {
                        loadFilteredMovies(state.currentFilter);
                    }
                } else {
                    showToast('Erreur: ' + (data.message || 'Action non effectuée'), 'danger');
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour des favoris:', error);
                showToast('Erreur lors de la mise à jour des favoris', 'danger');
            }
        });
    });
}

function setupViewAllButtons() {
    const viewAllButtons = ['view-now-playing', 'view-trending', 'view-popular', 'view-top-rated', 'view-upcoming'];
    viewAllButtons.forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = id.split('-').slice(1).join('-');
                if (id === 'view-now-playing') {
                    loadNowPlayingFiltered();
                } else {
                    loadFilteredMovies(filter);
                }
                elements.genreSection.scrollIntoView({ behavior: 'smooth' });
            });
        }
    });
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast show align-items-center text-white bg-${type} border-0`;
    toast.role = 'alert';
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.id = toastId;

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
        const bsToast = bootstrap.Toast.getOrCreateInstance(toast);
        bsToast.hide();
        toast.addEventListener('hidden.bs.toast', () => toast.remove());
    }, 5000);
}

async function searchMovies(query) {
    if (!query) {
        elements.searchResults.innerHTML = '';
        elements.searchResults.style.display = 'none';
        return;
    }

    const results = allFilms.filter(film =>
        film.titre && film.titre.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    if (results.length === 0) {
        elements.searchResults.innerHTML = '<div class="search-result-item">Aucun résultat trouvé</div>';
    } else {
        elements.searchResults.innerHTML = results.map(film => `
            <div class="search-result-item" data-id="${film.tmdb_id}">
                ${film.titre} (${film.annee || 'N/A'})
            </div>
        `).join('');
    }
    elements.searchResults.style.display = results.length ? 'block' : 'none';

    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const tmdb_id = item.dataset.id;
            showMovieDetails(tmdb_id);
        });
    });
}

elements.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = elements.searchInput.value.trim();
    searchMovies(query);
});

elements.searchInput.addEventListener('input', () => {
    const query = elements.searchInput.value.trim();
    searchMovies(query);
});

document.addEventListener('click', (e) => {
    if (!elements.searchForm.contains(e.target) && !elements.searchResults.contains(e.target)) {
        elements.searchResults.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    updateAuthUI();
    await loadFilms();
    setupViewAllButtons();

    // Vérifier si un film a été supprimé
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('deleted') === 'true') {
        showToast('Film supprimé avec succès !', 'success');
    }

    elements.logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('auth');
        state.auth = null;
        state.favorites.clear();
        updateAuthUI();
        showToast('Vous êtes déconnecté', 'success');
        loadFilms();
    });

    if (urlParams.get('added') === 'true') {
        showToast('Film ajouté avec succès !', 'success');
        await loadFilms();
    }
});