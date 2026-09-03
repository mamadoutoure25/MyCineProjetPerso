/**
 * distributor-details.js - Page dédiée au catalogue des films et séries d'un distributeur / plateforme
 */

const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

const COMPANY_FAMILIES = {
    174: [174, 25120, 2785, 3627, 12, 923, 79, 9993, 184898, 429], // Warner Bros. Discovery
    2: [2, 3, 6125, 420, 1, 25, 9195], // Disney
    33: [33, 6704, 3486, 5556, 1014], // Universal
    5: [5, 14, 2251, 3287], // Sony
    4: [4, 2348], // Paramount
    11: [11, 1632, 493] // Lionsgate
};

const NETWORK_FAMILIES = {
    174: '49|3186|174', // HBO / Warner Bros.
    3186: '49|3186',   // HBO / Max
    213: '213',        // Netflix
    1024: '1024',      // Prime Video
    2552: '2552',      // Apple TV+
    2739: '2739',      // Disney+
    17400: '174',      // AMC
    285: '285',        // Canal+
    88: '88',          // FX
    4330: '67|4330',   // Paramount+ / Showtime
    453: '453',        // Hulu
    2: '2739',         // Disney+
    4: '67|4330'       // Paramount+
};

const METADATA_MAP = {
    174: {
        name: "Warner Bros. Discovery",
        type: 'both',
        networkId: '49|3186|174',
        partners: ["Warner Animation Group", "Legendary Pictures", "HBO Originals", "DC Studios", "New Line Cinema"],
        description: "Warner Bros. Discovery distribue en salles les films majeurs de Legendary (Dune, MonsterVerse) et diffuse sur plateforme les séries événementielles HBO et Max."
    },
    33: {
        name: "Universal Pictures",
        type: 'movie',
        partners: ["Syncopy (Nolan)", "Blumhouse", "Illumination", "DreamWorks Animation"],
        description: "Universal Pictures assure la distribution mondiale des chefs-d'œuvre de Syncopy (Oppenheimer), des succès d'animation Illumination et des thrillers de Blumhouse."
    },
    2: {
        name: "Walt Disney Studios / Disney+",
        type: 'both',
        networkId: '2739',
        partners: ["Marvel Studios", "Lucasfilm", "Pixar Animation", "20th Century Studios"],
        description: "Walt Disney Studios Motion Pictures gère la distribution globale des franchises géantes Marvel, Lucasfilm, Pixar et Disney+."
    },
    4: {
        name: "Paramount Pictures / Paramount+",
        type: 'both',
        networkId: '67|4330',
        partners: ["Skydance Media", "Showtime Networks", "Bad Robot", "Nickelodeon"],
        description: "Paramount distribue en salles les grandes productions Skydance (Mission: Impossible, Top Gun) et les séries originales sur Paramount+."
    },
    5: {
        name: "Sony Pictures Releasing",
        type: 'movie',
        partners: ["Marvel Studios", "Columbia Pictures", "Sony Pictures Animation"],
        description: "Sony Pictures Releasing est le distributeur mondial de l'univers Spider-Man, des adaptations Marvel associées et du label animation Sony."
    },
    11: {
        name: "Lionsgate Films",
        type: 'movie',
        partners: ["Summit Entertainment", "Thunder Road Pictures", "Millennium Media"],
        description: "Lionsgate Films est le leader indépendant mondial de la distribution d'action et de sagas fantastiques (John Wick, Hunger Games)."
    },
    183: {
        name: "StudioCanal",
        type: 'movie',
        partners: ["Canal+ Group", "Working Title", "Studiocanal UK"],
        description: "StudioCanal est le premier studio européen de production et distribution cinématographique avec un catalogue impressionnant."
    },
    41077: {
        name: "A24",
        type: 'movie',
        partners: ["Plan B Entertainment", "IAC Films", "Fruit Tree"],
        description: "A24 est le distributeur d'auteurs le plus influent du cinéma américain contemporain, récompensé aux Oscars."
    },
    102: {
        name: "Pathé Distribution",
        type: 'movie',
        partners: ["Chapter 2", "Farnham Film", "Jerico Films", "M6 Films"],
        description: "Pathé Distribution est un acteur historique de premier plan du cinéma français et européen."
    },
    6896: {
        name: "EuropaCorp",
        type: 'movie',
        partners: ["TF1 Films", "Canal+", "Fundamental Films"],
        description: "EuropaCorp distribue en salles les grandes comédies et films d'action internationaux créés par Luc Besson."
    },

    // --- SÉRIES & STREAMING ---
    3186: {
        name: "HBO / Max",
        type: 'tv',
        networkId: '49|3186',
        partners: ["HBO Originals", "Max Originals", "Warner Bros. Television"],
        description: "Chaîne d'exception et service de streaming du groupe Warner Bros. Discovery, référence absolue des séries de prestige (House of the Dragon, Game of Thrones, Euphoria)."
    },
    213: {
        name: "Netflix",
        type: 'tv',
        networkId: '213',
        partners: ["Netflix Originals", "Shondaland", "Millarworld"],
        description: "Pionnier et géant mondial du streaming, produisant et distribuant les séries les plus populaires au monde (Stranger Things, Squid Game, Mercredi)."
    },
    1024: {
        name: "Amazon Prime Video",
        type: 'tv',
        networkId: '1024',
        partners: ["Amazon MGM Studios", "Kilter Films"],
        description: "Service mondial de streaming d'Amazon offrant des superproductions d'action et adaptations de premier rang (The Boys, Les Anneaux de Pouvoir, Fallout)."
    },
    2552: {
        name: "Apple TV+",
        type: 'tv',
        networkId: '2552',
        partners: ["Apple Studios", "Skydance Television"],
        description: "Service de streaming premium consacré aux séries originales acclamées par la critique (Ted Lasso, Severance, Silo, The Morning Show)."
    },
    2739: {
        name: "Disney+ (Séries)",
        type: 'tv',
        networkId: '2739',
        partners: ["Marvel Studios", "Lucasfilm", "National Geographic"],
        description: "Plateforme exclusive réunissant l'intégralité des séries originales Star Wars, Marvel, Pixar et Disney (The Mandalorian, Loki, Ahsoka)."
    },
    17400: {
        name: "AMC Networks",
        type: 'tv',
        networkId: '174',
        partners: ["AMC Studios", "Gran Via Productions"],
        description: "Chaîne américaine légendaire à l'origine des séries télévisées cultes (Breaking Bad, The Walking Dead, Better Call Saul)."
    },
    285: {
        name: "Canal+ (Créations Originales)",
        type: 'tv',
        networkId: '285',
        partners: ["StudioCanal", "Canal+ Fiction"],
        description: "Pionnier français des créations originales de séries d'espionnage et policières (Le Bureau des Légendes, Engrenages, Hippocrate)."
    },
    88: {
        name: "FX Networks",
        type: 'tv',
        networkId: '88',
        partners: ["FX Productions", "20th Television"],
        description: "Chaîne dramatique prestige reconnue pour ses séries d'auteurs intenses et audacieuses (Shōgun, American Horror Story, Fargo, The Bear)."
    },
    4330: {
        name: "Paramount+ / Showtime",
        type: 'tv',
        networkId: '67|4330',
        partners: ["Paramount Television Studios", "Showtime Networks"],
        description: "Plateforme et chaîne réunissant les créations originales Paramount et Showtime (Yellowstone, Special Ops: Lioness, Dexter)."
    },
    453: {
        name: "Hulu",
        type: 'tv',
        networkId: '453',
        partners: ["20th Television", "Searchlight Television"],
        description: "Plateforme majeure spécialisée dans les séries adultes, comédies contemporaines et drames captivants (The Handmaid's Tale, Futurama, Only Murders)."
    }
};

let distributorId = 174;
let currentMediaType = 'movie'; // 'movie' ou 'tv'
let currentSort = 'popularity.desc';
let currentPage = 1;
let totalPages = 1;
let isFetching = false;
let accumulatedRevenue = 0;

let selectedGenre = '';
let selectedYear = '';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const typeParam = urlParams.get('type');

    if (idParam) {
        distributorId = parseInt(idParam, 10);
    }

    const meta = METADATA_MAP[distributorId];
    if (typeParam === 'tv' || (meta && meta.type === 'tv')) {
        currentMediaType = 'tv';
    } else {
        currentMediaType = 'movie';
    }

    updateToggleUI();
    populateYearFilter();
    initDistributorPage();
});

function setMediaType(type) {
    if (currentMediaType === type) return;
    currentMediaType = type;
    updateToggleUI();
    loadMovies(true);
}

function updateToggleUI() {
    const btnMovie = document.getElementById('btn-media-movie');
    const btnTv = document.getElementById('btn-media-tv');
    const btnRevenue = document.getElementById('btn-sort-revenue');
    const statRevenueCard = document.getElementById('stat-card-revenue');
    const statLabel = document.getElementById('stat-label-count');

    if (btnMovie && btnTv) {
        if (currentMediaType === 'movie') {
            btnMovie.classList.add('active', 'btn-primary');
            btnMovie.classList.remove('btn-outline-secondary');
            btnTv.classList.remove('active', 'btn-primary');
            btnTv.classList.add('btn-outline-secondary');
            if (statLabel) statLabel.textContent = 'Films Distribués';
            if (statRevenueCard) statRevenueCard.style.display = 'block';
            if (btnRevenue) btnRevenue.style.display = 'inline-block';
        } else {
            btnTv.classList.add('active', 'btn-primary');
            btnTv.classList.remove('btn-outline-secondary');
            btnMovie.classList.remove('active', 'btn-primary');
            btnMovie.classList.add('btn-outline-secondary');
            if (statLabel) statLabel.textContent = 'Séries Distribuées';
            if (statRevenueCard) statRevenueCard.style.display = 'none';
            if (btnRevenue) btnRevenue.style.display = 'none';
            if (currentSort === 'revenue.desc') currentSort = 'popularity.desc';
        }
    }
}

function populateYearFilter() {
    const yearSelect = document.getElementById('filter-year');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    let options = `<option value="">Toutes les années</option>`;
    for (let y = currentYear; y >= 1950; y--) {
        options += `<option value="${y}">${y}</option>`;
    }
    yearSelect.innerHTML = options;
}

function applyFilters() {
    const genreSelect = document.getElementById('filter-genre');
    const yearSelect = document.getElementById('filter-year');

    selectedGenre = genreSelect ? genreSelect.value : '';
    selectedYear = yearSelect ? yearSelect.value : '';

    loadMovies(true);
}

async function initDistributorPage() {
    await fetchDistributorHeader();
    await loadMovies(true);
}

async function fetchDistributorHeader() {
    try {
        const meta = METADATA_MAP[distributorId] || {};
        let resInfo = null;

        if (currentMediaType === 'tv' || meta.type === 'tv') {
            const netId = meta.networkId ? meta.networkId.split('|')[0] : (NETWORK_FAMILIES[distributorId] ? NETWORK_FAMILIES[distributorId].split('|')[0] : distributorId);
            resInfo = await fetch(`${API_BASE_URL}/network/${netId}?api_key=${API_KEY}`).then(r => r.ok ? r.json() : null).catch(() => null);
        } else {
            resInfo = await fetch(`${API_BASE_URL}/company/${distributorId}?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`).then(r => r.ok ? r.json() : null).catch(() => null);
        }
        
        const nameEl = document.getElementById("distributor-name");
        const descEl = document.getElementById("distributor-description");
        const logoImg = document.getElementById("distributor-logo");
        const partnersEl = document.getElementById("distributor-partners");

        if (resInfo || meta.name) {
            if (nameEl) nameEl.textContent = meta.name || (resInfo && resInfo.name) || "Société de Distribution";
            if (resInfo && resInfo.logo_path && logoImg) {
                logoImg.src = `${IMG_BASE_URL}${resInfo.logo_path}`;
                logoImg.style.display = "block";
            }
        }

        if (descEl) {
            descEl.textContent = meta.description || (resInfo && resInfo.description) || "Catalogue des œuvres et productions distribuées en salles et sur plateforme.";
        }

        if (partnersEl && meta.partners) {
            partnersEl.innerHTML = `<span class="small fw-bold opacity-50 me-2"><i class="ph ph-handshake me-1"></i>PARTENAIRES & LABELS :</span>` +
                meta.partners.map(p => `<span class="partner-chip"><i class="ph-fill ph-buildings me-1"></i>${p}</span>`).join(' ');
        }
    } catch (e) {
        console.error("Erreur header distributeur:", e);
    }
}

async function loadMovies(reset = false) {
    if (isFetching) return;
    isFetching = true;

    if (reset) {
        currentPage = 1;
        accumulatedRevenue = 0;
    }

    const grid = document.getElementById("distributed-movies-grid");
    const countEl = document.getElementById("stat-total-movies");
    const revEl = document.getElementById("stat-total-revenue");
    const loadBtn = document.getElementById("btn-load-more");

    if (reset && grid) {
        grid.innerHTML = `<div class="text-center py-5 w-100" style="grid-column: 1 / -1;"><div class="spinner-border text-theme"></div></div>`;
    }

    try {
        const meta = METADATA_MAP[distributorId] || {};
        let url = '';

        if (currentMediaType === 'tv') {
            const netQuery = meta.networkId || NETWORK_FAMILIES[distributorId] || distributorId;
            url = `${API_BASE_URL}/discover/tv?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&with_networks=${netQuery}&sort_by=${currentSort}&page=${currentPage}`;

            if (selectedGenre) url += `&with_genres=${selectedGenre}`;
            if (selectedYear) url += `&first_air_date_year=${selectedYear}`;
        } else {
            const companiesQuery = COMPANY_FAMILIES[distributorId] ? COMPANY_FAMILIES[distributorId].join('|') : distributorId;
            url = `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&with_companies=${companiesQuery}&sort_by=${currentSort}&page=${currentPage}`;

            if (selectedGenre) url += `&with_genres=${selectedGenre}`;
            if (selectedYear) url += `&primary_release_year=${selectedYear}`;
        }

        const res = await fetch(url).then(r => r.json());

        if (res) {
            totalPages = res.total_pages || 1;
            if (countEl) countEl.textContent = (res.total_results || 0).toLocaleString('fr-FR');

            // Backdrop Hero Image
            if (reset && res.results && res.results[0] && res.results[0].backdrop_path) {
                const backdropImg = document.getElementById("hero-backdrop-img");
                if (backdropImg) backdropImg.src = BACKDROP_URL + res.results[0].backdrop_path;
            }

            if (res.results && res.results.length > 0) {
                if (currentMediaType === 'movie') {
                    res.results.forEach(m => {
                        if (m.revenue) accumulatedRevenue += m.revenue;
                    });
                    if (revEl && accumulatedRevenue > 0) {
                        revEl.textContent = accumulatedRevenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
                    }
                }

                const html = res.results.map(m => {
                    const itemType = m.media_type || (m.title ? 'movie' : 'tv');
                    const isTv = itemType === 'tv';
                    const targetUrl = isTv ? `serie-details.html?id=${m.id}` : `movie-details.html?id=${m.id}`;
                    const titleText = m.title || m.name;
                    const releaseDate = isTv ? m.first_air_date : m.release_date;
                    const yearText = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
                    const defaultImg = m.poster_path ? IMG_BASE_URL + m.poster_path : 'https://via.placeholder.com/210x315';
                    const posterSrc = isTv ? defaultImg : (window.getCustomPoster ? window.getCustomPoster(m.id, defaultImg, 'movie') : (localStorage.getItem(`custom_movie_poster_${m.id}`) || defaultImg));

                    return `
                        <div class="premium-card" onclick="window.location.href='${targetUrl}'" style="cursor: pointer;">
                            <img data-movie-id="${m.id}" src="${posterSrc}" loading="lazy">
                            <div class="card-details">
                                <div class="card-title text-truncate">${titleText}</div>
                                <div class="card-meta">
                                    <span class="rating-badge"><i class="ph-fill ph-star"></i> ${m.vote_average ? m.vote_average.toFixed(1) : '0.0'}</span>
                                    <span class="opacity-75">${yearText}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                if (reset) {
                    grid.innerHTML = html;
                } else {
                    grid.insertAdjacentHTML('beforeend', html);
                }

                if (loadBtn) {
                    loadBtn.style.display = currentPage < totalPages ? 'inline-block' : 'none';
                }
            } else if (reset) {
                grid.innerHTML = `<p class="text-center opacity-50 py-5 w-100" style="grid-column: 1 / -1;">Aucun ${currentMediaType === 'tv' ? 'série' : 'film'} trouvé pour ce distributeur.</p>`;
                if (loadBtn) loadBtn.style.display = 'none';
            }
        }
    } catch (e) {
        console.error("Erreur chargement contenus distribués:", e);
        if (reset && grid) grid.innerHTML = `<p class="text-center opacity-50 py-5 w-100" style="grid-column: 1 / -1;">Erreur lors du chargement du catalogue.</p>`;
    } finally {
        isFetching = false;
    }
}

function loadMoreMovies() {
    if (currentPage < totalPages) {
        currentPage++;
        loadMovies(false);
    }
}

function setSort(sortMethod) {
    currentSort = sortMethod;

    document.querySelectorAll('.sort-btn').forEach(btn => {
        if (btn.getAttribute('data-sort') === sortMethod) {
            btn.classList.add('active', 'btn-primary');
            btn.classList.remove('btn-outline-secondary');
        } else {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-outline-secondary');
        }
    });

    loadMovies(true);
}
