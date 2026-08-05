/**
 * distributor-details.js - Page dédiée au catalogue complet des films d'un distributeur
 */

const API_KEY = '04c35731a5ee918f014970082a0088b1';
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

const COMPANY_FAMILIES = {
    174: [174, 25120, 2785, 3627, 12], // Warner Bros., Warner Animation Group (25120), WB Animation, WB Japan, New Line Cinema
    2: [2, 3, 6125, 420, 1, 25, 9195], // Disney, Pixar, Disney Animation, Marvel Studios, Lucasfilm, 20th Century, Touchstone
    33: [33, 6704, 3486, 5556, 1014], // Universal, Illumination, DreamWorks, Universal Animation, Focus Features
    5: [5, 14, 2251, 3287], // Sony, Columbia, Sony Animation, Screen Gems
    4: [4, 2348], // Paramount, Nickelodeon
    11: [11, 1632, 493] // Lionsgate, Summit
};

const METADATA_MAP = {
    174: {
        partners: ["Warner Animation Group", "Legendary Pictures", "Apple Original Films", "DC Studios", "New Line Cinema"],
        description: "Warner Bros. et Warner Animation Group (25120) distribuent les superproductions d'animation (Lego Movie, Tom & Jerry), les films de Legendary (Dune), DC Studios et Apple (F1)."
    },
    33: {
        partners: ["Syncopy (Nolan)", "Blumhouse", "Illumination", "DreamWorks Animation"],
        description: "Universal Pictures assure la distribution mondiale des chefs-d'œuvre de Syncopy (Oppenheimer), des succès d'animation Illumination et des thrillers de Blumhouse."
    },
    2: {
        partners: ["Marvel Studios", "Lucasfilm", "Pixar Animation", "20th Century Studios"],
        description: "Walt Disney Studios Motion Pictures gère la distribution globale des franchises géantes de Marvel Studios, Lucasfilm, Pixar et 20th Century Studios."
    },
    4: {
        partners: ["Skydance Media", "Apple Original Films", "Bad Robot", "Nickelodeon"],
        description: "Paramount Pictures distribue en salles les grandes productions Skydance (Mission: Impossible, Top Gun) et les films originaux d'Apple en salles."
    },
    5: {
        partners: ["Marvel Studios", "Columbia Pictures", "Sony Pictures Animation"],
        description: "Sony Pictures Releasing est le distributeur mondial de l'univers Spider-Man, des adaptations Marvel associées et du label animation Sony."
    },
    11: {
        partners: ["Summit Entertainment", "Thunder Road Pictures", "Millennium Media"],
        description: "Lionsgate Films est le leader indépendant mondial de la distribution d'action et de sagas fantastiques (John Wick, Hunger Games)."
    },
    183: {
        partners: ["Canal+ Group", "Working Title", "Studiocanal UK"],
        description: "StudioCanal est le premier studio européen de production et distribution cinématographique avec un catalogue impressionnant."
    },
    41077: {
        partners: ["Plan B Entertainment", "IAC Films", "Fruit Tree"],
        description: "A24 est le distributeur d'auteurs le plus influent du cinéma américain contemporain, récompensé aux Oscars."
    },
    102: {
        partners: ["Chapter 2", "Farnham Film", "Jerico Films", "M6 Films"],
        description: "Pathé Distribution est un acteur historique de premier plan du cinéma français et européen."
    },
    6896: {
        partners: ["TF1 Films", "Canal+", "Fundamental Films"],
        description: "EuropaCorp distribue en salles les grandes comédies et films d'action internationaux créés par Luc Besson."
    }
};

let distributorId = 174;
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
    if (idParam) {
        distributorId = parseInt(idParam, 10);
    }

    populateYearFilter();
    initDistributorPage();
});

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
        const companyRes = await fetch(`${API_BASE_URL}/company/${distributorId}?api_key=${API_KEY}&language=fr-FR`).then(r => r.ok ? r.json() : null);
        
        const nameEl = document.getElementById("distributor-name");
        const descEl = document.getElementById("distributor-description");
        const logoImg = document.getElementById("distributor-logo");
        const partnersEl = document.getElementById("distributor-partners");

        const meta = METADATA_MAP[distributorId] || {};

        if (companyRes) {
            if (nameEl) nameEl.textContent = companyRes.name;
            if (companyRes.logo_path && logoImg) {
                logoImg.src = `${IMG_BASE_URL}${companyRes.logo_path}`;
                logoImg.style.display = "block";
            }
        }

        if (descEl) {
            descEl.textContent = meta.description || (companyRes && companyRes.description) || "Catalogue des films distribués au cinéma et à l'international.";
        }

        if (partnersEl && meta.partners) {
            partnersEl.innerHTML = `<span class="small fw-bold opacity-50 me-2"><i class="ph ph-handshake me-1"></i>PARTENAIRES CLÉS :</span>` +
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
        const companiesQuery = COMPANY_FAMILIES[distributorId] ? COMPANY_FAMILIES[distributorId].join('|') : distributorId;
        let url = `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&language=fr-FR&with_companies=${companiesQuery}&sort_by=${currentSort}&page=${currentPage}`;

        if (selectedGenre) {
            url += `&with_genres=${selectedGenre}`;
        }
        if (selectedYear) {
            url += `&primary_release_year=${selectedYear}`;
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
                // Calculate revenue sum for current page results if sorting by revenue or default
                res.results.forEach(m => {
                    if (m.revenue) accumulatedRevenue += m.revenue;
                });

                if (revEl && accumulatedRevenue > 0) {
                    revEl.textContent = accumulatedRevenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
                }

                const html = res.results.map(m => `
                    <div class="premium-card" onclick="window.location.href='movie-details.html?id=${m.id}'" style="cursor: pointer;">
                        <img src="${m.poster_path ? IMG_BASE_URL + m.poster_path : 'https://via.placeholder.com/210x315'}" loading="lazy">
                        <div class="card-details">
                            <div class="card-title text-truncate">${m.title}</div>
                            <div class="card-meta">
                                <span class="rating-badge"><i class="ph-fill ph-star"></i> ${m.vote_average ? m.vote_average.toFixed(1) : '0.0'}</span>
                                <span class="opacity-75">${m.release_date ? new Date(m.release_date).getFullYear() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                `).join('');

                if (reset) {
                    grid.innerHTML = html;
                } else {
                    grid.insertAdjacentHTML('beforeend', html);
                }

                if (loadBtn) {
                    loadBtn.style.display = currentPage < totalPages ? 'inline-block' : 'none';
                }
            } else if (reset) {
                grid.innerHTML = `<p class="text-center opacity-50 py-5 w-100" style="grid-column: 1 / -1;">Aucun film trouvé pour ce distributeur.</p>`;
                if (loadBtn) loadBtn.style.display = 'none';
            }
        }
    } catch (e) {
        console.error("Erreur chargement films distribués:", e);
        if (reset && grid) grid.innerHTML = `<p class="text-center opacity-50 py-5 w-100" style="grid-column: 1 / -1;">Erreur lors du chargement des films.</p>`;
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
