/**
 * company-details.js - Gestion des détails des sociétés de production
 */

// Configuration API
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Cache pour stocker les données
const cache = {
    company: null,
    films: [],
    allFilms: [], // Stocker tous les films sans filtrer
    parentCompany: null
};

// État des filtres
const filterState = {
    year: '',
    rating: '',
    evaluated: ''
};

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('id') || urlParams.get('company_id');

    if (companyId) {
        await chargerDetailsCompagnie(companyId);
    } else {
        afficherErreur('Aucune société spécifiée');
    }

    configurerFiltres();
});

/**
 * Charger les détails complets de la société
 */
async function chargerDetailsCompagnie(companyId) {
    try {
        // Charger les détails de la société
        const urlCompany = `${API_BASE_URL}/company/${companyId}?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`;
        const dataCompany = await fetch(urlCompany).then(r => r.json());

        if (dataCompany.id) {
            cache.company = dataCompany;
            afficherDetailsCompagnie(dataCompany);

            // Charger les films produits par cette société
            await chargerFilmsCompagnie(companyId);

            // Charger les détails de la société mère si elle existe
            if (dataCompany.parent_company?.id) {
                await chargerSocieteMere(dataCompany.parent_company.id);
            }

            // Charger les images/logos de la société
            await chargerImagesCompagnie(companyId);
        } else {
            afficherErreur('Société non trouvée');
        }
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        afficherErreur('Erreur lors du chargement des données');
    }
}

/**
 * Afficher les détails de la société
 */
function afficherDetailsCompagnie(company) {
    // Nom
    document.getElementById('company-name').textContent = company.name || 'Inconnue';

    // Logo
    const logoEl = document.getElementById('company-logo');
    if (logoEl) {
        if (company.logo_path) {
            logoEl.src = IMG_BASE_URL + company.logo_path;
            logoEl.style.display = 'inline-block';
        } else {
            logoEl.style.display = 'none';
        }
    }

    // Description
    const descEl = document.getElementById('company-description');
    const descContainer = document.getElementById('company-description-container');
    if (descEl && descContainer) {
        if (company.description && company.description.trim()) {
            descEl.textContent = company.description;
            descContainer.style.display = 'block';
        } else {
            descContainer.style.display = 'none';
        }
    }

    // Pays d'origine
    const countryName = obtenirNomPays(company.origin_country);
    if (document.getElementById('company-country')) {
        document.getElementById('company-country').textContent = countryName;
    }

    // Siège social
    if (document.getElementById('company-headquarters')) {
        document.getElementById('company-headquarters').textContent = (company.headquarters && company.headquarters.trim()) ? company.headquarters : '--';
    }

    // Site web
    const homepageContainer = document.getElementById('homepage-container');
    const homepageLink = document.getElementById('company-homepage');
    if (homepageContainer && homepageLink) {
        if (company.homepage && company.homepage.trim()) {
            homepageLink.href = company.homepage;
            homepageContainer.style.display = 'inline-block';
        } else {
            homepageContainer.style.display = 'none';
        }
    }

    // Société mère
    const parentContainer = document.getElementById('parent-company-container');
    const parentName = document.getElementById('parent-company-name');
    if (parentContainer && parentName) {
        if (company.parent_company) {
            parentName.textContent = company.parent_company.name || 'Inconnue';
            parentContainer.style.display = 'inline-block';
        } else {
            parentContainer.style.display = 'none';
        }
    }
}

/**
 * Charger les films produits par la société
 */
async function chargerFilmsCompagnie(companyId) {
    try {
        let allFilms = [];
        let totalResults = 0;
        let currentPage = 1;
        const maxPages = 100;

        const loadingDiv = document.getElementById('films-loading');
        const containerDiv = document.getElementById('films-container');
        const countDiv = document.getElementById('films-count');

        if (loadingDiv) loadingDiv.style.display = 'block';
        if (containerDiv) containerDiv.style.display = 'none';

        const urlFilms1 = `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&with_companies=${companyId}&sort_by=popularity.desc&page=1`;
        const dataFilms1 = await fetch(urlFilms1).then(r => r.json());

        if (dataFilms1.results && dataFilms1.results.length > 0) {
            allFilms = [...dataFilms1.results];
            totalResults = dataFilms1.total_results;
            const totalPages = Math.min(dataFilms1.total_pages, maxPages);

            if (countDiv) countDiv.textContent = `Chargement... (${allFilms.length}/${totalResults})`;

            for (currentPage = 2; currentPage <= totalPages; currentPage++) {
                try {
                    const urlFilmsNext = `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&with_companies=${companyId}&sort_by=popularity.desc&page=${currentPage}`;
                    const dataFilmsNext = await fetch(urlFilmsNext).then(r => r.json());

                    if (dataFilmsNext.results && dataFilmsNext.results.length > 0) {
                        allFilms = [...allFilms, ...dataFilmsNext.results];
                        if (countDiv) countDiv.textContent = `Chargement... (${allFilms.length}/${totalResults})`;
                    }
                    await new Promise(resolve => setTimeout(resolve, 30));
                } catch (error) {
                    console.error(`Erreur lors du chargement de la page ${currentPage}:`, error);
                }
            }

            cache.films = allFilms;
            cache.allFilms = allFilms;
            afficherFilmsCompagnie(allFilms);
            if (countDiv) countDiv.textContent = `✅ ${totalResults} film(s) disponible(s)`;

            remplirSelectFiltres(allFilms);
            document.title = `${cache.company.name || 'Studio'} - ${allFilms.length} films - MyCiné`;
        } else {
            if (document.getElementById('no-films')) document.getElementById('no-films').style.display = 'block';
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (countDiv) countDiv.textContent = 'Aucun film trouvé';
        }
    } catch (error) {
        console.error('Erreur lors du chargement des films:', error);
        if (document.getElementById('no-films')) document.getElementById('no-films').style.display = 'block';
        if (document.getElementById('films-loading')) document.getElementById('films-loading').style.display = 'none';
    }
}

/**
 * Afficher les films de la société
 */
function afficherFilmsCompagnie(films) {
    const container = document.getElementById('films-container');
    const loadingDiv = document.getElementById('films-loading');
    const noFilmsDiv = document.getElementById('no-films');
    const summaryDiv = document.getElementById('films-summary');

    if (!films || films.length === 0) {
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (container) container.style.display = 'none';
        if (noFilmsDiv) noFilmsDiv.style.display = 'block';
        return;
    }

    container.innerHTML = films
        .map(film => {
            const releaseYear = film.release_date ? new Date(film.release_date).getFullYear() : 'N/A';
            const ratingVal = film.vote_average ? film.vote_average.toFixed(1) : '0.0';
            const defaultImg = film.poster_path ? IMG_BASE_URL + film.poster_path : 'https://via.placeholder.com/210x315?text=Aucune+affiche';
            const posterSrc = window.getCustomPoster ? window.getCustomPoster(film.id, defaultImg, 'movie') : (localStorage.getItem(`custom_movie_poster_${film.id}`) || defaultImg);
            return `
                <div class="premium-card" onclick="afficherDetailsFilm(${film.id})" style="cursor: pointer;">
                    <img src="${posterSrc}" loading="lazy" alt="${film.title}">
                    <div class="card-details">
                        <div class="card-title text-truncate">${film.title}</div>
                        <div class="card-meta">
                            <span class="rating-badge"><i class="ph-fill ph-star text-warning"></i> ${ratingVal}</span>
                            <span class="opacity-75 ms-auto">${releaseYear}</span>
                        </div>
                    </div>
                </div>
            `;
        })
        .join('');

    const statsTotal = films.length;
    const statsRated = films.filter(f => f.vote_average).length;
    const statsAvgRating = statsRated > 0
        ? (films.filter(f => f.vote_average).reduce((sum, f) => sum + f.vote_average, 0) / statsRated).toFixed(1)
        : '0.0';

    const years = films
        .filter(f => f.release_date)
        .map(f => parseInt(f.release_date.split('-')[0]))
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort();

    const statsYearRange = years.length > 0
        ? `${Math.min(...years)} - ${Math.max(...years)}`
        : '--';

    if (document.getElementById('stats-total')) document.getElementById('stats-total').textContent = statsTotal;
    if (document.getElementById('stats-rated')) document.getElementById('stats-rated').textContent = statsRated;
    if (document.getElementById('stats-avg-rating')) document.getElementById('stats-avg-rating').textContent = `${statsAvgRating} / 10`;
    if (document.getElementById('stats-year-range')) document.getElementById('stats-year-range').textContent = statsYearRange;

    if (loadingDiv) loadingDiv.style.display = 'none';
    if (container) container.style.display = 'grid';
    if (noFilmsDiv) noFilmsDiv.style.display = 'none';
    if (summaryDiv) summaryDiv.style.display = 'flex';
}

/**
 * Charger les images/logos de la société
 */
async function chargerImagesCompagnie(companyId) {
    try {
        const urlImages = `${API_BASE_URL}/company/${companyId}/images?api_key=${API_KEY}`;
        const dataImages = await fetch(urlImages).then(r => r.json());

        if (dataImages.logos && dataImages.logos.length > 0) {
            afficherImagesCompagnie(dataImages.logos);
            if (document.getElementById('images-count')) document.getElementById('images-count').textContent = `${dataImages.logos.length} logo(s) disponible(s)`;
            if (document.getElementById('images-section')) document.getElementById('images-section').style.display = 'block';
        }
    } catch (error) {
        console.error('Erreur lors du chargement des images:', error);
    }
}

/**
 * Afficher les logos de la société
 */
function afficherImagesCompagnie(logos) {
    const container = document.getElementById('logos-container');
    const noLogosDiv = document.getElementById('no-logos');

    if (!logos || logos.length === 0) {
        if (container) container.innerHTML = '';
        if (noLogosDiv) noLogosDiv.style.display = 'block';
        return;
    }

    if (noLogosDiv) noLogosDiv.style.display = 'none';

    container.innerHTML = logos
        .map((logo, index) => {
            const logoUrl = `${IMG_BASE_URL}${logo.file_path}`;
            const fileType = (logo.file_type || '.png').toUpperCase().replace('.', '');
            const dims = `${logo.width} × ${logo.height}`;
            const aspect = logo.aspect_ratio ? logo.aspect_ratio.toFixed(2) : '1.0';

            return `
                <div class="logo-card-premium">
                    <div class="logo-pod">
                        <img src="${logoUrl}" loading="lazy" alt="Logo officiel ${index + 1}">
                    </div>
                    <div class="logo-card-body">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="logo-badge-dim"><i class="ph ph-bounding-box me-1"></i> ${dims}</span>
                            <span class="logo-badge-type">${fileType}</span>
                        </div>
                        <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-secondary opacity-75">
                            <span class="x-small text-theme opacity-75 fw-bold">Ratio ${aspect}</span>
                            <div class="d-flex gap-2">
                                <a href="${logoUrl}" target="_blank" class="btn-logo-action" title="Aperçu HD">
                                    <i class="ph ph-eye"></i>
                                </a>
                                <a href="${logoUrl}" download="logo-${index + 1}.png" target="_blank" class="btn-logo-action primary" title="Télécharger">
                                    <i class="ph ph-download-simple"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        })
        .join('');
}

/**
 * Charger les détails de la société mère
 */
async function chargerSocieteMere(parentCompanyId) {
    try {
        const urlParent = `${API_BASE_URL}/company/${parentCompanyId}?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`;
        const dataParent = await fetch(urlParent).then(r => r.json());
        cache.parentCompany = dataParent;
    } catch (error) {
        console.error('Erreur lors du chargement de la société mère:', error);
    }
}

/**
 * Obtenir le nom du pays à partir du code
 */
function obtenirNomPays(countryCode) {
    const paysMap = {
        'US': 'États-Unis',
        'GB': 'Royaume-Uni',
        'JP': 'Japon',
        'FR': 'France',
        'DE': 'Allemagne',
        'IT': 'Italie',
        'ES': 'Espagne',
        'CA': 'Canada',
        'AU': 'Australie',
        'BR': 'Brésil',
        'IN': 'Inde',
        'CN': 'Chine',
        'KR': 'Corée du Sud',
        'MX': 'Mexique',
        'RU': 'Russie'
    };

    return paysMap[countryCode?.toUpperCase()] || countryCode || 'Inconnue';
}

/**
 * Afficher les détails du film
 */
function afficherDetailsFilm(filmId) {
    // Vérifier si on est dans le dossier Films ou à la racine
    const estDansDossierFilms = window.location.pathname.includes('/Films/');
    if (estDansDossierFilms) {
        window.location.href = `movie-details.html?id=${filmId}`;
    } else {
        window.location.href = `PROJET_TM_GRoupe/Films/movie-details.html?id=${filmId}`;
    }
}

/**
 * Gérer les erreurs d'affichage
 */
function afficherErreur(message) {
    const container = document.querySelector('main') || document.body;
    container.innerHTML = `
        <section class="content-section" style="padding-top: 150px; text-align: center;">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <i class="ph ph-warning" style="font-size: 4rem; color: var(--danger); margin-bottom: 20px;"></i>
                    <h1>Erreur</h1>
                    <p style="color: var(--text-secondary); font-size: 1.1rem;">${message}</p>
                    <a href="../../index.html" class="btn btn-primary mt-3">
                        <i class="ph ph-arrow-left me-2"></i> Retour aux films
                    </a>
                </div>
            </div>
        </section>
    `;
}

function configurerFiltres() {
    // Écouter les clics sur le bouton Appliquer
    document.getElementById('apply-filters')?.addEventListener('click', appliquerFiltres);

    // Écouter les changements directs sur les selects
    document.getElementById('filter-year')?.addEventListener('change', appliquerFiltres);
    document.getElementById('filter-rating')?.addEventListener('change', appliquerFiltres);
    document.getElementById('filter-evaluated')?.addEventListener('change', appliquerFiltres);

    // Écouter les clics sur le bouton Effacer
    document.getElementById('clear-filters')?.addEventListener('click', effacerFiltres);
}

/**
 * Remplir les options des select avec les années et notes disponibles
 */
function remplirSelectFiltres(films) {
    // Récupérer les années uniques
    const years = films
        .filter(f => f.release_date)
        .map(f => parseInt(f.release_date.split('-')[0]))
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => b - a);

    const yearSelect = document.getElementById('filter-year');
    if (yearSelect) {
        const optionsYear = years.map(year => `<option value="${year}">${year}</option>`).join('');
        yearSelect.innerHTML = '<option value="">Toutes les années</option>' + optionsYear;
    }
}

/**
 * Appliquer les filtres
 */
function appliquerFiltres() {
    // Récupérer les valeurs des filtres
    filterState.year = document.getElementById('filter-year')?.value || '';
    filterState.rating = document.getElementById('filter-rating')?.value || '';
    filterState.evaluated = document.getElementById('filter-evaluated')?.value || '';

    // Filtrer les films
    let filmsFiltrés = [...cache.allFilms];

    // Filtre année
    if (filterState.year) {
        filmsFiltrés = filmsFiltrés.filter(f => {
            const year = f.release_date ? parseInt(f.release_date.split('-')[0]) : null;
            return year === parseInt(filterState.year);
        });
    }

    // Filtre note minimale
    if (filterState.rating) {
        filmsFiltrés = filmsFiltrés.filter(f => f.vote_average >= parseFloat(filterState.rating));
    }

    // Filtre évaluation
    if (filterState.evaluated === 'evaluated') {
        filmsFiltrés = filmsFiltrés.filter(f => f.vote_average > 0);
    } else if (filterState.evaluated === 'not-evaluated') {
        filmsFiltrés = filmsFiltrés.filter(f => !f.vote_average || f.vote_average === 0);
    }

    // Afficher les filtres actifs
    afficherFiltresActifs();

    // Afficher les films filtrés
    cache.films = filmsFiltrés;
    afficherFilmsCompagnie(filmsFiltrés);
}

/**
 * Afficher les filtres actifs
 */
function afficherFiltresActifs() {
    const container = document.getElementById('filter-tags');
    const activeFiltersDiv = document.getElementById('active-filters');

    container.innerHTML = '';
    let hasFilters = false;

    // Afficher filtre année
    if (filterState.year) {
        container.innerHTML += `<span class="badge bg-primary">${filterState.year}</span>`;
        hasFilters = true;
    }

    // Afficher filtre note
    if (filterState.rating) {
        container.innerHTML += `<span class="badge bg-info">Note: ${filterState.rating}+</span>`;
        hasFilters = true;
    }

    // Afficher filtre évaluation
    if (filterState.evaluated) {
        const labelEval = filterState.evaluated === 'evaluated' ? 'Évalués' : 'Non évalués';
        container.innerHTML += `<span class="badge bg-success">${labelEval}</span>`;
        hasFilters = true;
    }

    activeFiltersDiv.style.display = hasFilters ? 'block' : 'none';
}

/**
 * Effacer tous les filtres
 */
function effacerFiltres() {
    // Réinitialiser les selects
    document.getElementById('filter-year').value = '';
    document.getElementById('filter-rating').value = '';
    document.getElementById('filter-evaluated').value = '';

    // Réinitialiser l'état
    filterState.year = '';
    filterState.rating = '';
    filterState.evaluated = '';

    // Masquer les filtres actifs
    document.getElementById('active-filters').style.display = 'none';

    // Afficher tous les films
    cache.films = [...cache.allFilms];
    afficherFilmsCompagnie(cache.films);
}



// Export des fonctions globales
window.afficherDetailsFilm = afficherDetailsFilm;
window.chargerDetailsCompagnie = chargerDetailsCompagnie;

