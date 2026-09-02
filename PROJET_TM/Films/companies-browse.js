/**
 * companies-browse.js - Navigation et exploration des sociétés de production
 */
/**
 * companies-browse.js - Navigation et exploration des sociétés de production
 */

// Configuration API
const API_KEY = '04c35731a5ee918f014970082a0088b1';
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Liste des sociétés populaires à afficher
const COMPANIES_LIST = [
    { id: 1, name: 'Lucasfilm Ltd.' },
    { id: 2, name: 'Walt Disney Pictures' },
    { id: 3, name: 'Pixar' },
    { id: 4, name: 'Paramount' },
    { id: 5, name: 'Sony Pictures' },
    { id: 7, name: 'DreamWorks Pictures' },
    { id: 9, name: 'Gaumont' },
    { id: 11, name: 'Lionsgate' },
    { id: 12, name: 'New Line Cinema' },
    { id: 14, name: 'Columbia Pictures' },
    { id: 21, name: 'Metro Goldwyn Mayer' },
    { id: 25, name: '20th Century Studios' },
    { id: 33, name: 'Universal Pictures' },
    { id: 47, name: 'Constantin Film' },
    { id: 56, name: 'Amblin Entertainment' },
    { id: 79, name: 'Village Roadshow Pictures' },
    { id: 102, name: 'Pathé' },
    { id: 104, name: 'Canal+' },
    { id: 174, name: 'Warner Bros. Discovery' },
    { id: 183, name: 'StudioCanal' },
    { id: 192, name: 'Shochiku' },
    { id: 420, name: 'Marvel Studios' },
    { id: 493, name: 'Summit Entertainment' },
    { id: 508, name: 'Regency Enterprises' },
    { id: 559, name: 'TriStar Pictures' },
    { id: 882, name: 'Toho Company' },
    { id: 923, name: 'Legendary Pictures' },
    { id: 1014, name: 'Focus Features' },
    { id: 1632, name: 'Lionsgate Films' },
    { id: 1898, name: 'Kyoto Animation' },
    { id: 2251, name: 'Sony Pictures Animation' },
    { id: 2270, name: 'China Film Group' },
    { id: 2348, name: 'Nickelodeon Movies' },
    { id: 2785, name: 'Warner Bros Animation' },
    { id: 3172, name: 'Blumhouse Productions' },
    { id: 3287, name: 'Screen Gems' },
    { id: 3486, name: 'DreamWorks Animation' },
    { id: 3627, name: 'Warner Bros Japan' },
    { id: 5542, name: 'Toei Animation' },
    { id: 5556, name: 'Universal Animation Studios' },
    { id: 6125, name: 'Walt Disney Animation Studios' },
    { id: 6704, name: 'Illumination' },
    { id: 6896, name: 'EuropaCorp' },
    { id: 7505, name: 'Marvel Entertainment' },
    { id: 7819, name: 'Lotte Entertainment' },
    { id: 9195, name: 'Touchstone Pictures' },
    { id: 9383, name: 'Blue Sky Studios' },
    { id: 9993, name: 'DC Entertainment' },
    { id: 9996, name: 'Syncopy' },
    { id: 10163, name: 'Working Title Films' },
    { id: 10342, name: 'Studio Ghibli' },
    { id: 11470, name: 'Bad Robot' },
    { id: 12693, name: 'Madhouse' },
    { id: 18625, name: 'Ufotable' },
    { id: 20555, name: 'Taurus Film' },
    { id: 22213, name: 'TSG Entertainment' },
    { id: 25120, name: 'Warner Animation Group' },
    { id: 30148, name: 'Bona Film Group' },
    { id: 30571, name: 'MAPPA' },
    { id: 41077, name: 'A24' },
    { id: 69484, name: 'Alibaba Pictures Group' },
    { id: 178464, name: 'Netflix' },
    { id: 184898, name: 'DC Studios' },
    { id: 194232, name: 'Apple Studios' }
];

let companiesData = [];
let filteredCompanies = [];

const PAYS_LIST = [
    { code: 'US', name: 'États-Unis' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japon' },
    { code: 'GB', name: 'Royaume-Uni' },
    { code: 'DE', name: 'Allemagne' },
    { code: 'CN', name: 'Chine' },
    { code: 'KR', name: 'Corée du Sud' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australie' },
    { code: 'IT', name: 'Italie' },
    { code: 'ES', name: 'Espagne' },
    { code: 'BR', name: 'Brésil' },
    { code: 'IN', name: 'Inde' },
    { code: 'MX', name: 'Mexique' },
    { code: 'RU', name: 'Russie' }
];

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    remplirSelectPays();
    configurerFiltres();
    await chargerSocietes();
});

/**
 * Charger les données des sociétés en parallèle
 */
async function chargerSocietes() {
    try {
        companiesData = [];
        let filmsTotal = 0;
        let countriesSet = new Set();

        const fetchPromises = COMPANIES_LIST.map(company =>
            Promise.all([
                fetch(`${API_BASE_URL}/company/${company.id}?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`).then(r => r.ok ? r.json() : null).catch(() => null),
                fetch(`${API_BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${company.id}&page=1`).then(r => r.ok ? r.json() : null).catch(() => null)
            ]).then(([data, dataFilms]) => {
                if (data && data.id) {
                    const count = dataFilms?.total_results || 0;
                    return {
                        id: data.id,
                        name: data.name,
                        logo_path: data.logo_path,
                        headquarters: data.headquarters,
                        origin_country: data.origin_country,
                        homepage: data.homepage,
                        description: data.description,
                        parent_company: data.parent_company,
                        films_count: count
                    };
                }
                return null;
            }).catch(() => null)
        );

        const results = await Promise.all(fetchPromises);
        companiesData = results.filter(c => c !== null);

        companiesData.forEach(c => {
            filmsTotal += c.films_count;
            if (c.origin_country) countriesSet.add(c.origin_country);
        });

        // Trier par popularité (nombre de films)
        companiesData.sort((a, b) => b.films_count - a.films_count);
        filteredCompanies = [...companiesData];

        // Afficher les statistiques
        document.getElementById('total-companies').textContent = companiesData.length;
        document.getElementById('total-countries').textContent = countriesSet.size;
        document.getElementById('total-films').textContent = filmsTotal.toLocaleString('fr-FR');

        // Mettre à jour les pays et afficher les sociétés
        remplirSelectPays();
        afficherSocietes(companiesData);
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
    }
}

/**
 * Remplir le menu déroulant des pays
 */
function remplirSelectPays() {
    const countrySelect = document.getElementById('country-filter');
    if (!countrySelect) return;

    const countriesMap = new Map();

    // 1. Ajouter les pays issus des sociétés chargées
    companiesData.forEach(c => {
        if (c.origin_country) {
            const code = c.origin_country.toUpperCase();
            const label = obtenirNomPays(code);
            countriesMap.set(code, label);
        }
    });

    // 2. Si chargement en cours ou données vides, afficher les pays par défaut
    if (countriesMap.size === 0) {
        PAYS_LIST.forEach(p => countriesMap.set(p.code, p.name));
    }

    const sortedCountries = Array.from(countriesMap.entries()).sort((a, b) => a[1].localeCompare(b[1], 'fr'));

    const countLabel = companiesData.length > 0 ? ` (${companiesData.length})` : '';

    countrySelect.innerHTML = `<option value="ALL">🌍 Tous les pays${countLabel}</option>` +
        sortedCountries.map(([code, name]) => {
            const count = companiesData.filter(c => c.origin_country?.toUpperCase() === code).length;
            const countStr = count > 0 ? ` (${count})` : '';
            return `<option value="${code}">${name}${countStr}</option>`;
        }).join('');
}

/**
 * Afficher les sociétés
 */
function afficherSocietes(companies) {
    const container = document.getElementById('companies-container');
    const noCompanies = document.getElementById('no-companies');

    if (!companies || companies.length === 0) {
        container.innerHTML = '';
        noCompanies.style.display = 'block';
        return;
    }

    noCompanies.style.display = 'none';

    container.innerHTML = companies
        .map(company => {
            const hasLogo = company.logo_path !== null;
            const logoUrl = hasLogo ? `${IMG_BASE_URL}${company.logo_path}` : `https://via.placeholder.com/300x300?text=${encodeURIComponent(company.name)}`;
            const countryName = obtenirNomPays(company.origin_country);
            return `
        <div class="premium-company-card" onclick="window.location.href='company-details.html?id=${company.id}'">
            <img src="${logoUrl}" loading="lazy" alt="${company.name}">
            <div class="card-details">
                <div class="card-title text-truncate">${company.name}</div>
                <div class="card-meta">
                    <span class="rating-badge"><i class="ph-fill ph-globe-hemisphere-west"></i> ${countryName}</span>
                </div>
            </div>
        </div>
    `}).join('');
}
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
 * Filtrer les sociétés selon la recherche texte et le pays sélectionné
 */
function filtrerSocietes() {
    const searchInput = document.getElementById('search-input');
    const countrySelect = document.getElementById('country-filter');

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCountry = countrySelect ? countrySelect.value : 'ALL';

    filteredCompanies = companiesData.filter(company => {
        const matchesQuery = query === '' ||
            company.name.toLowerCase().includes(query) ||
            company.headquarters?.toLowerCase().includes(query) ||
            company.origin_country?.toLowerCase().includes(query) ||
            obtenirNomPays(company.origin_country).toLowerCase().includes(query);

        const matchesCountry = selectedCountry === 'ALL' ||
            company.origin_country?.toUpperCase() === selectedCountry;

        return matchesQuery && matchesCountry;
    });

    afficherSocietes(filteredCompanies);
}

/**
 * Configurer les écouteurs d'événements pour la recherche et les filtres
 */
function configurerFiltres() {
    const searchInput = document.getElementById('search-input');
    const countrySelect = document.getElementById('country-filter');

    if (searchInput) {
        searchInput.addEventListener('input', filtrerSocietes);
    }
    if (countrySelect) {
        countrySelect.addEventListener('change', filtrerSocietes);
    }
}

function generateCompanyCard(company) {
    const hasLogo = company.logo_path !== null;
    const logoUrl = hasLogo ? `${IMG_URL}${company.logo_path}` : 'https://via.placeholder.com/300x150?text=Logo+Non+Disponible';
    const country = company.origin_country || 'Inconnu';
    const hq = company.headquarters || 'Non spécifié';

    return `
        <a href="company-details.html?id=${company.id}" class="company-card-premium text-decoration-none">
            <div class="company-logo-wrapper">
                <img src="${logoUrl}" class="company-logo" alt="${company.name}">
            </div>
            <div class="company-name text-truncate">${company.name}</div>
            <div class="company-country"><i class="ph-fill ph-globe-hemisphere-west"></i> ${country}</div>
        </a>
    `;
}