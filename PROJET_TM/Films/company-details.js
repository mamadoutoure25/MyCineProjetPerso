/**
 * company-details.js - Gestion des détails des sociétés de production
 */

// Configuration API
const API_KEY = '04c35731a5ee918f014970082a0088b1';
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

    configurerTheme();
    configurerFiltres();
});

/**
 * Charger les détails complets de la société
 */
async function chargerDetailsCompagnie(companyId) {
    try {
        // Charger les détails de la société
        const urlCompany = `${API_BASE_URL}/company/${companyId}?api_key=${API_KEY}&language=fr-FR`;
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
    if (company.logo_path) {
        document.getElementById('company-logo').src = IMG_BASE_URL + company.logo_path;
    } else {
        document.getElementById('company-logo').src = 'https://via.placeholder.com/500x300?text=' + encodeURIComponent(company.name || 'Pas de logo');
    }

    // Description
    if (company.description && company.description.trim()) {
        document.getElementById('company-description').textContent = company.description;
        document.getElementById('company-description-container').style.display = 'block';
    } else {
        document.getElementById('company-description-container').style.display = 'none';
    }

    // Pays d'origine
    const countryName = obtenirNomPays(company.origin_country);
    document.getElementById('company-country').textContent = countryName;

    // Siège social
    if (company.headquarters && company.headquarters.trim()) {
        document.getElementById('company-headquarters').textContent = company.headquarters;
    } else {
        document.getElementById('company-headquarters').textContent = '--';
    }

    // Site web
    if (company.homepage && company.homepage.trim()) {
        document.getElementById('company-homepage').href = company.homepage;
        document.getElementById('homepage-container').style.display = 'block';

        document.getElementById('company-website').href = company.homepage;
        document.getElementById('website-container').style.display = 'flex';
    } else {
        document.getElementById('homepage-container').style.display = 'none';
        document.getElementById('website-container').style.display = 'none';
    }

    // Société mère
    if (company.parent_company) {
        document.getElementById('parent-company-name').textContent = company.parent_company.name || 'Inconnue';
        document.getElementById('parent-company-container').style.display = 'block';
    } else {
        document.getElementById('parent-company-container').style.display = 'none';
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
        const maxPages = 100; // Limite raisonnable de pages

        // Afficher le chargement
        const loadingDiv = document.getElementById('films-loading');
        const containerDiv = document.getElementById('films-container');
        const countDiv = document.getElementById('films-count');

        loadingDiv.style.display = 'block';
        containerDiv.style.display = 'none';

        // Charger la première page pour connaître le nombre total
        const urlFilms1 = `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&language=fr-FR&with_companies=${companyId}&sort_by=popularity.desc&page=1`;
        const dataFilms1 = await fetch(urlFilms1).then(r => r.json());

        if (dataFilms1.results && dataFilms1.results.length > 0) {
            allFilms = [...dataFilms1.results];
            totalResults = dataFilms1.total_results;
            const totalPages = Math.min(dataFilms1.total_pages, maxPages);

            // Mettre à jour le compteur pendant le chargement
            countDiv.textContent = `Chargement... (${allFilms.length}/${totalResults})`;

            // Charger les pages suivantes
            for (currentPage = 2; currentPage <= totalPages; currentPage++) {
                try {
                    const urlFilmsNext = `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&language=fr-FR&with_companies=${companyId}&sort_by=popularity.desc&page=${currentPage}`;
                    const dataFilmsNext = await fetch(urlFilmsNext).then(r => r.json());

                    if (dataFilmsNext.results && dataFilmsNext.results.length > 0) {
                        allFilms = [...allFilms, ...dataFilmsNext.results];
                        // Mettre à jour le compteur en direct
                        countDiv.textContent = `Chargement... (${allFilms.length}/${totalResults})`;
                    }

                    // Petit délai pour ne pas surcharger l'API
                    await new Promise(resolve => setTimeout(resolve, 50));
                } catch (error) {
                    console.error(`Erreur lors du chargement de la page ${currentPage}:`, error);
                }
            }

            cache.films = allFilms;
            afficherFilmsCompagnie(allFilms);
            countDiv.textContent = `✅ ${totalResults} film(s) trouvé(s) (${allFilms.length} affichés)`;

            // Stocker aussi dans allFilms pour les filtres
            cache.allFilms = allFilms;

            // Remplir les select des filtres
            remplirSelectFiltres(allFilms);

            // Mettre à jour le titre de la page
            document.title = `${cache.company.name} - ${allFilms.length} films - MyCiné`;
        } else {
            document.getElementById('no-films').style.display = 'block';
            loadingDiv.style.display = 'none';
            countDiv.textContent = 'Aucun film trouvé';
        }
    } catch (error) {
        console.error('Erreur lors du chargement des films:', error);
        document.getElementById('no-films').style.display = 'block';
        document.getElementById('films-loading').style.display = 'none';
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
        loadingDiv.style.display = 'none';
        container.style.display = 'none';
        noFilmsDiv.style.display = 'block';
        summaryDiv.style.display = 'none';
        return;
    }

    // Afficher les films
    container.innerHTML = films
        .map(film => `
            <div class="film-card" onclick="afficherDetailsFilm(${film.id})">
                <div class="film-poster">
                    <img src="${film.poster_path ? IMG_BASE_URL + film.poster_path : 'https://via.placeholder.com/300x450?text=Aucune+affiche'}" 
                         alt="${film.title}"
                         onerror="this.src='https://via.placeholder.com/300x450?text=Aucune+affiche'">
                </div>
                <div class="film-info">
                    <div class="film-title" title="${film.title}">${film.title}</div>
                    <div class="film-year">${film.release_date ? film.release_date.split('-')[0] : 'N/A'}</div>
                    ${film.vote_average ? `<div class="film-rating"><i class="ph ph-star-fill"></i> ${film.vote_average.toFixed(1)}/10</div>` : '<div class="film-rating">N/A</div>'}
                </div>
            </div>
        `)
        .join('');

    // Calculer et afficher les statistiques
    const statsTotal = films.length;
    const statsRated = films.filter(f => f.vote_average).length;
    const statsAvgRating = statsRated > 0
        ? (films.filter(f => f.vote_average).reduce((sum, f) => sum + f.vote_average, 0) / statsRated).toFixed(1)
        : '0';

    const years = films
        .filter(f => f.release_date)
        .map(f => parseInt(f.release_date.split('-')[0]))
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort();

    const statsYearRange = years.length > 0
        ? `${Math.min(...years)} - ${Math.max(...years)}`
        : '--';

    document.getElementById('stats-total').textContent = statsTotal;
    document.getElementById('stats-rated').textContent = statsRated;
    document.getElementById('stats-avg-rating').textContent = statsAvgRating;
    document.getElementById('stats-year-range').textContent = statsYearRange;

    // Afficher/masquer les éléments
    loadingDiv.style.display = 'none';
    container.style.display = 'grid';
    noFilmsDiv.style.display = 'none';
    summaryDiv.style.display = 'block';

    // Scroller vers les films
    setTimeout(() => {
        document.querySelector('.section-header').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
            document.getElementById('images-count').textContent = `${dataImages.logos.length} logo(s) trouvé(s)`;
            document.getElementById('images-section').style.display = 'block';
        } else {
            document.getElementById('no-logos').style.display = 'block';
            document.getElementById('images-section').style.display = 'block';
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
        container.innerHTML = '';
        noLogosDiv.style.display = 'block';
        return;
    }

    noLogosDiv.style.display = 'none';

    container.innerHTML = logos
        .map(logo => `
            <div class="image-card">
                <div class="image-container">
                    <img src="${IMG_BASE_URL}${logo.file_path}" 
                         alt="Logo"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Logo+non+disponible'">
                </div>
                <div class="image-info">
                    <span class="image-type">${logo.file_type || '.png'}</span>
                    <div class="image-stats">
                        <div class="image-stat">
                            <div class="image-stat-label">Aspect</div>
                            <div class="image-stat-value">${logo.aspect_ratio.toFixed(2)}</div>
                        </div>
                        <div class="image-stat">
                            <div class="image-stat-label">Dimensions</div>
                            <div class="image-stat-value">${logo.width}x${logo.height}</div>
                        </div>
                        <div class="image-stat">
                            <div class="image-stat-label">Note</div>
                            <div class="image-stat-value">${logo.vote_average ? logo.vote_average.toFixed(1) : 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `)
        .join('');
}

/**
 * Charger les détails de la société mère
 */
async function chargerSocieteMere(parentCompanyId) {
    try {
        const urlParent = `${API_BASE_URL}/company/${parentCompanyId}?api_key=${API_KEY}&language=fr-FR`;
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

/**
 * Configurer les filtres
 */
function configurerFiltres() {
    // Écouter les clics sur le bouton Appliquer
    document.getElementById('apply-filters')?.addEventListener('click', appliquerFiltres);

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

/**
 * Configurer le thème sombre/clair
 */
function configurerTheme() {
    const themeSauvegarde = localStorage.getItem('theme');
    const themeSysteme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const themeActuel = themeSauvegarde || themeSysteme;

    document.documentElement.setAttribute('data-theme', themeActuel);
    mettreAJourIconeTheme(themeActuel);

    // Écouter les changements de thème
    document.getElementById('theme-toggle')?.addEventListener('click', basculerTheme);
}

function mettreAJourIconeTheme(theme) {
    const icone = document.getElementById('theme-icon');
    if (icone) {
        if (theme === 'dark') {
            icone.classList.remove('ph-sun');
            icone.classList.add('ph-moon');
        } else {
            icone.classList.remove('ph-moon');
            icone.classList.add('ph-sun');
        }
    }
}

function basculerTheme() {
    const themeActuel = document.documentElement.getAttribute('data-theme');
    const nouveauTheme = themeActuel === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', nouveauTheme);
    localStorage.setItem('theme', nouveauTheme);
    mettreAJourIconeTheme(nouveauTheme);
}

// Export des fonctions globales
window.afficherDetailsFilm = afficherDetailsFilm;
window.chargerDetailsCompagnie = chargerDetailsCompagnie;

