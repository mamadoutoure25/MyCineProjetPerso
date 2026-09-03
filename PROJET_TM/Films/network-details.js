/**
 * network-details.js - Gestion des détails des sociétés de production
 */

// Configuration API
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Cache pour stocker les données
const cache = {
    network: null,
    series: [],
    allseries: [], // Stocker tous les series sans filtrer
    parentnetwork: null
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
    const networkId = urlParams.get('id') || urlParams.get('network_id');

    if (networkId) {
        await chargerDetailsReseau(networkId);
    } else {
        afficherErreur('Aucune société spécifiée');
    }

    configurerFiltres();
});

/**
 * Charger les détails complets de la société
 */
async function chargerDetailsReseau(networkId) {
    try {
        // Charger les détails de la société
        const urlnetwork = `${API_BASE_URL}/network/${networkId}?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`;
        const datanetwork = await fetch(urlnetwork).then(r => r.json());

        if (datanetwork.id) {
            cache.network = datanetwork;
            afficherDetailsReseau(datanetwork);

            // Charger les series produits par cette société
            await chargerseriesReseau(networkId);

            // Charger les détails de la société mère si elle existe
            if (datanetwork.parent_network?.id) {
                await chargerSocieteMere(datanetwork.parent_network.id);
            }

            // Charger les images/logos de la société
            await chargerImagesReseau(networkId);
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
function afficherDetailsReseau(network) {
    // Nom
    document.getElementById('network-name').textContent = network.name || 'Inconnue';

    // Logo
    const logoEl = document.getElementById('network-logo');
    if (logoEl) {
        if (network.logo_path) {
            logoEl.src = IMG_BASE_URL + network.logo_path;
            logoEl.style.display = 'inline-block';
        } else {
            logoEl.style.display = 'none';
        }
    }

    // Description
    const descEl = document.getElementById('network-description');
    const descContainer = document.getElementById('network-description-container');
    if (descEl && descContainer) {
        if (network.description && network.description.trim()) {
            descEl.textContent = network.description;
            descContainer.style.display = 'block';
        } else {
            descContainer.style.display = 'none';
        }
    }

    // Pays d'origine
    const countryName = obtenirNomPays(network.origin_country);
    if (document.getElementById('network-country')) {
        document.getElementById('network-country').textContent = countryName;
    }

    // Siège social
    if (document.getElementById('network-headquarters')) {
        document.getElementById('network-headquarters').textContent = (network.headquarters && network.headquarters.trim()) ? network.headquarters : '--';
    }

    // Site web
    const homepageContainer = document.getElementById('homepage-container');
    const homepageLink = document.getElementById('network-homepage');
    if (homepageContainer && homepageLink) {
        if (network.homepage && network.homepage.trim()) {
            homepageLink.href = network.homepage;
            homepageContainer.style.display = 'inline-block';
        } else {
            homepageContainer.style.display = 'none';
        }
    }

    // Société mère
    const parentContainer = document.getElementById('parent-network-container');
    const parentName = document.getElementById('parent-network-name');
    if (parentContainer && parentName) {
        if (network.parent_network) {
            parentName.textContent = network.parent_network.name || 'Inconnue';
            parentContainer.style.display = 'inline-block';
        } else {
            parentContainer.style.display = 'none';
        }
    }
}

/**
 * Charger les series produits par la société
 */
async function chargerseriesReseau(networkId) {
    try {
        let allseries = [];
        let totalResults = 0;
        let currentPage = 1;
        const maxPages = 100;

        const loadingDiv = document.getElementById('series-loading');
        const containerDiv = document.getElementById('series-container');
        const countDiv = document.getElementById('series-count');

        if (loadingDiv) loadingDiv.style.display = 'block';
        if (containerDiv) containerDiv.style.display = 'none';

        const includeAdult = localStorage.getItem("include_adult") === "true";
        const urlseries1 = `${API_BASE_URL}/discover/tv?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&with_companies=${networkId}&sort_by=popularity.desc&page=1&include_adult=${includeAdult}`;
        const dataseries1 = await fetch(urlseries1).then(r => r.json());

        if (dataseries1.results && dataseries1.results.length > 0) {
            allseries = [...dataseries1.results];
            totalResults = dataseries1.total_results;
            const totalPages = Math.min(dataseries1.total_pages, maxPages);

            if (countDiv) countDiv.textContent = `Chargement... (${allseries.length}/${totalResults})`;

            for (currentPage = 2; currentPage <= totalPages; currentPage++) {
                try {
                    const includeAdult = localStorage.getItem("include_adult") === "true";
                    const urlseriesNext = `${API_BASE_URL}/discover/tv?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&with_companies=${networkId}&sort_by=popularity.desc&page=${currentPage}&include_adult=${includeAdult}`;
                    const dataseriesNext = await fetch(urlseriesNext).then(r => r.json());

                    if (dataseriesNext.results && dataseriesNext.results.length > 0) {
                        allseries = [...allseries, ...dataseriesNext.results];
                        if (countDiv) countDiv.textContent = `Chargement... (${allseries.length}/${totalResults})`;
                    }
                    await new Promise(resolve => setTimeout(resolve, 30));
                } catch (error) {
                    console.error(`Erreur lors du chargement de la page ${currentPage}:`, error);
                }
            }

            cache.series = allseries;
            cache.allseries = allseries;
            afficherseriesReseau(allseries);
            if (countDiv) countDiv.textContent = `✅ ${totalResults} serie(s) disponible(s)`;

            remplirSelectFiltres(allseries);
            document.title = `${cache.network.name || 'Studio'} - ${allseries.length} series - MyCiné`;
        } else {
            if (document.getElementById('no-series')) document.getElementById('no-series').style.display = 'block';
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (countDiv) countDiv.textContent = 'Aucun serie trouvé';
        }
    } catch (error) {
        console.error('Erreur lors du chargement des series:', error);
        if (document.getElementById('no-series')) document.getElementById('no-series').style.display = 'block';
        if (document.getElementById('series-loading')) document.getElementById('series-loading').style.display = 'none';
    }
}

/**
 * Afficher les series de la société
 */
function afficherseriesReseau(series) {
    const container = document.getElementById('series-container');
    const loadingDiv = document.getElementById('series-loading');
    const noseriesDiv = document.getElementById('no-series');
    const summaryDiv = document.getElementById('series-summary');

    if (!series || series.length === 0) {
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (container) container.style.display = 'none';
        if (noseriesDiv) noseriesDiv.style.display = 'block';
        return;
    }

    container.innerHTML = series
        .map(serie => {
            const releaseYear = serie.release_date ? new Date(serie.release_date).getFullYear() : 'N/A';
            const ratingVal = serie.vote_average ? serie.vote_average.toFixed(1) : '0.0';
            const defaultImg = serie.poster_path ? IMG_BASE_URL + serie.poster_path : 'https://via.placeholder.com/210x315?text=Aucune+affiche';
            const posterSrc = window.getCustomPoster ? window.getCustomPoster(serie.id, defaultImg, 'tv') : (localStorage.getItem(`custom_tv_poster_${serie.id}`) || defaultImg);
            return `
                <div class="premium-card" onclick="afficherDetailsserie(${serie.id})" style="cursor: pointer;">
                    <img src="${posterSrc}" loading="lazy" alt="${serie.title}">
                    <div class="card-details">
                        <div class="card-title text-truncate">${serie.title}</div>
                        <div class="card-meta">
                            <span class="rating-badge"><i class="ph-fill ph-star text-warning"></i> ${ratingVal}</span>
                            <span class="opacity-75 ms-auto">${releaseYear}</span>
                        </div>
                    </div>
                </div>
            `;
        })
        .join('');

    const statsTotal = series.length;
    const statsRated = series.filter(f => f.vote_average).length;
    const statsAvgRating = statsRated > 0
        ? (series.filter(f => f.vote_average).reduce((sum, f) => sum + f.vote_average, 0) / statsRated).toFixed(1)
        : '0.0';

    const years = series
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
    if (noseriesDiv) noseriesDiv.style.display = 'none';
    if (summaryDiv) summaryDiv.style.display = 'flex';
}

/**
 * Charger les images/logos de la société
 */
async function chargerImagesReseau(networkId) {
    try {
        const urlImages = `${API_BASE_URL}/network/${networkId}/images?api_key=${API_KEY}`;
        const dataImages = await fetch(urlImages).then(r => r.json());

        if (dataImages.logos && dataImages.logos.length > 0) {
            afficherImagesReseau(dataImages.logos);
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
function afficherImagesReseau(logos) {
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
async function chargerSocieteMere(parentnetworkId) {
    try {
        const urlParent = `${API_BASE_URL}/network/${parentnetworkId}?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`;
        const dataParent = await fetch(urlParent).then(r => r.json());
        cache.parentnetwork = dataParent;
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
 * Afficher les détails du serie
 */
function afficherDetailsserie(serieId) {
    // Vérifier si on est dans le dossier series ou à la racine
    const estDansDossierseries = window.location.pathname.includes('/series/');
    if (estDansDossierseries) {
        window.location.href = `tv-details.html?id=${serieId}`;
    } else {
        window.location.href = `PROJET_TM_GRoupe/series/tv-details.html?id=${serieId}`;
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
                        <i class="ph ph-arrow-left me-2"></i> Retour aux series
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
function remplirSelectFiltres(series) {
    // Récupérer les années uniques
    const years = series
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

    // Filtrer les series
    let seriesFiltrés = [...cache.allseries];

    // Filtre année
    if (filterState.year) {
        seriesFiltrés = seriesFiltrés.filter(f => {
            const year = f.release_date ? parseInt(f.release_date.split('-')[0]) : null;
            return year === parseInt(filterState.year);
        });
    }

    // Filtre note minimale
    if (filterState.rating) {
        seriesFiltrés = seriesFiltrés.filter(f => f.vote_average >= parseFloat(filterState.rating));
    }

    // Filtre évaluation
    if (filterState.evaluated === 'evaluated') {
        seriesFiltrés = seriesFiltrés.filter(f => f.vote_average > 0);
    } else if (filterState.evaluated === 'not-evaluated') {
        seriesFiltrés = seriesFiltrés.filter(f => !f.vote_average || f.vote_average === 0);
    }

    // Afficher les filtres actifs
    afficherFiltresActifs();

    // Afficher les series filtrés
    cache.series = seriesFiltrés;
    afficherseriesReseau(seriesFiltrés);
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

    // Afficher tous les series
    cache.series = [...cache.allseries];
    afficherseriesReseau(cache.series);
}



// Export des fonctions globales
window.afficherDetailsserie = afficherDetailsserie;
window.chargerDetailsReseau = chargerDetailsReseau;

