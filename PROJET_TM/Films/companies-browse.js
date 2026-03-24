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
    { id: 2, name: 'Disney' },
    { id: 4, name: 'Paramount' },
    { id: 5, name: 'Sony Pictures' },

    { id: 7, name: 'DreamWorks Pictures' },
    { id: 11, name: 'Lionsgate' },
    { id: 12, name: 'New Line Cinema' },
    { id: 14, name: 'Columbia Pictures' },
    { id: 21, name: 'Metro Goldwyn Mayer' },
    { id: 25, name: '20th Century Studios' },
    { id: 33, name: 'Universal Pictures' },
    { id: 56, name: 'Amblin Entertainment' },
    { id: 174, name: 'Warner Bros Pictures' },
    //192-shochiku
    { id: 192, name: 'Shochiku' },
    { id: 420, name: 'Marvel Studios' },
    { id: 882, name: 'Toho Company' },
    { id: 923, name: 'Legendary Pictures' },
    //1632-lionsgate
    { id: 1632, name: 'Lionsgate Films' },
    { id: 2251, name: 'Sony Pictures Animation' },
    { id: 2270, name: 'China Film Group Corporation' },
    { id: 2348, name: 'Nickelodeon Movies' },
    { id: 2785, name: 'Warner Bros Animation' },

    { id: 3486, name: 'DreamWorks Animation' },
    { id: 3627, name: 'Warner Bros Japan' },
    { id: 5556, name: 'Universal Animation Studios' },
    { id: 6125, name: 'Walt Disney Animation Studios' },
    { id: 6704, name: 'Illumination' },
    { id: 6896, name: 'Europa Corps' },
    { id: 7505, name: 'Marvel Entertainment' },
    { id: 7819, name: 'Lotte Entertainment' },
    { id: 78952, name: 'Wanda Pictures' },
    { id: 9383, name: 'Blue Sky Studios' },
    { id: 9993, name: 'DC Entertainment' },

    { id: 22213, name: 'TSG Entertainment' },
    { id: 25120, name: 'Warner Animation Group' },
    { id: 30148, name: 'Bona Film Group' },

    { id: 69484, name: 'Alibaba Pictures Group' },
    { id: 101516, name: 'Take Five' },
    { id: 147411, name: 'Lotte Entertainment Vietnam' },
    { id: 178464, name: 'Netflix' },
    { id: 184898, name: 'DC Studios' },
    { id: 194232, name: 'Apple Studio' },

];

let companiesData = [];
let filteredCompanies = [];

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await chargerSocietes();
    configurerTheme();
    configurerRecherche();
});

/**
 * Charger les données des sociétés
 */
async function chargerSocietes() {
    try {
        companiesData = [];
        let filmsTotal = 0;
        let countriesSet = new Set();

        // Charger les données de chaque société
        for (const company of COMPANIES_LIST) {
            try {
                const url = `${API_BASE_URL}/company/${company.id}?api_key=${API_KEY}&language=fr-FR`;
                const data = await fetch(url).then(r => r.json());

                if (data.id) {
                    // Charger le nombre de films
                    const urlFilms = `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${company.id}&page=1`;
                    const dataFilms = await fetch(urlFilms).then(r => r.json());

                    companiesData.push({
                        id: data.id,
                        name: data.name,
                        logo_path: data.logo_path,
                        headquarters: data.headquarters,
                        origin_country: data.origin_country,
                        homepage: data.homepage,
                        description: data.description,
                        parent_company: data.parent_company,
                        films_count: dataFilms.total_results || 0
                    });

                    filmsTotal += dataFilms.total_results || 0;
                    if (data.origin_country) {
                        countriesSet.add(data.origin_country);
                    }
                }
            } catch (error) {
                console.error(`Erreur pour la société ${company.id}:`, error);
            }

            // Petit délai pour ne pas surcharger l'API
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        filteredCompanies = [...companiesData];

        // Trier par popularité (nombre de films)
        companiesData.sort((a, b) => b.films_count - a.films_count);
        filteredCompanies = [...companiesData];

        // Afficher les statistiques
        document.getElementById('total-companies').textContent = companiesData.length;
        document.getElementById('total-countries').textContent = countriesSet.size;
        document.getElementById('total-films').textContent = filmsTotal.toLocaleString('fr-FR');

        // Afficher les sociétés
        afficherSocietes(companiesData);
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
    }
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
        .map(company => `
            <div class="company-card">
                <div class="company-logo-section">
                    <img src="${company.logo_path ? IMG_BASE_URL + company.logo_path : 'https://via.placeholder.com/300x150?text=' + encodeURIComponent(company.name)}" 
                         alt="${company.name}"
                         onerror="this.src='https://via.placeholder.com/300x150?text=${encodeURIComponent(company.name)}'">
                </div>
                <div class="company-info-section">
                    <div class="company-name" title="${company.name}">${company.name}</div>
                    
                    ${company.origin_country ? `
                        <div class="company-country">
                            <i class="ph ph-globe"></i>
                            <span>${obtenirNomPays(company.origin_country)}</span>
                        </div>
                    ` : ''}

                    ${company.headquarters ? `
                        <div class="company-headquarters" title="${company.headquarters}">
                            <i class="ph ph-map-pin"></i>
                            <span>${company.headquarters}</span>
                        </div>
                    ` : ''}

                    <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border); color: var(--text-secondary); font-size: 0.85rem;">
                        <i class="ph ph-film-strip me-1"></i>
                        <span>${company.films_count} film(s)</span>
                    </div>

                    <div class="company-actions">
                        <a href="company-details.html?id=${company.id}" class="btn btn-company btn-company-view">
                            <i class="ph ph-eye"></i>
                            <span>Voir</span>
                        </a>
                        <a href="projetBD.html?company=${company.id}" class="btn btn-company btn-company-filter" title="Filtrer par cette société">
                            <i class="ph ph-funnel"></i>
                            <span>Filtrer</span>
                        </a>
                    </div>
                </div>
            </div>
        `)
        .join('');
}

/**
 * Configurer la recherche
 */
function configurerRecherche() {
    const searchInput = document.getElementById('search-input');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (query === '') {
            filteredCompanies = [...companiesData];
        } else {
            filteredCompanies = companiesData.filter(company =>
                company.name.toLowerCase().includes(query) ||
                company.headquarters?.toLowerCase().includes(query) ||
                company.origin_country?.toLowerCase().includes(query)
            );
        }

        afficherSocietes(filteredCompanies);
    });
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
 * Configurer le thème sombre/clair
 */
function configurerTheme() {
    const themeSauvegarde = localStorage.getItem('theme');
    const themeSysteme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const themeActuel = themeSauvegarde || themeSysteme;

    document.documentElement.setAttribute('data-theme', themeActuel);
    mettreAJourIconeTheme(themeActuel);

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

