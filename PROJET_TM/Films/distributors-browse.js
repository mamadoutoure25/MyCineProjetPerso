/**
 * distributors-browse.js - Exploration des distributeurs de cinéma et des plateformes de séries/streaming
 */

const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const DISTRIBUTORS_LIST = [
    // --- DISTRIBUTEURS CINÉMA & HYBRIDES ---
    {
        id: 174,
        type: 'both',
        networkId: '49|3186|174',
        name: "Warner Bros. Discovery",
        partners: ["Legendary Pictures", "HBO Originals", "DC Studios", "Apple Original Films"],
        examples: "Dune, House of the Dragon, Game of Thrones, Batman, Harry Potter",
        description: "Distributeur mondial d'envergure (Warner Bros. Discovery & HBO Max). Distribue en salles les films Legendary (Dune) et sur plateforme les séries HBO/Max."
    },
    {
        id: 33,
        type: 'movie',
        name: "Universal Pictures",
        partners: ["Syncopy (Nolan)", "Blumhouse", "Illumination", "DreamWorks Animation"],
        examples: "Oppenheimer, Fast & Furious, Jurassic World, Moi Moche et Méchant, Super Mario",
        description: "Distributeur exclusif des œuvres de Syncopy (Oppenheimer), des thrillers Blumhouse et du catalogue Illumination."
    },
    {
        id: 2,
        type: 'both',
        networkId: '2739',
        name: "Walt Disney Studios / Disney+",
        partners: ["Marvel Studios", "Lucasfilm", "Pixar Animation", "20th Century Studios"],
        examples: "Avengers, Star Wars, Avatar, Toy Story, Deadpool & Wolverine, Loki",
        description: "Leader incontesté de la distribution cinéma et streaming (Disney+), gérant Marvel, Lucasfilm, Pixar et 20th Century."
    },
    {
        id: 4,
        type: 'both',
        networkId: '67|4330',
        name: "Paramount Pictures / Paramount+",
        partners: ["Skydance Media", "Showtime Networks", "Bad Robot", "Nickelodeon"],
        examples: "Mission: Impossible, Top Gun: Maverick, Yellowstone, Transformers, Sonic",
        description: "Studio et distributeur majeur en salles et streaming avec Paramount+ et les séries événementielles Showtime."
    },
    {
        id: 5,
        type: 'movie',
        name: "Sony Pictures Releasing",
        partners: ["Marvel Studios", "Columbia Pictures", "Sony Pictures Animation"],
        examples: "Spider-Man (MCU & Spider-Verse), Venom, Jumanji, Ghostbusters, Uncharted",
        description: "Orchestre la distribution mondiale de l'univers Spider-Man et Spider-Verse en étroite collaboration avec Marvel Studios."
    },
    {
        id: 11,
        type: 'movie',
        name: "Lionsgate Films",
        partners: ["Summit Entertainment", "Thunder Road Pictures", "Millennium Media"],
        examples: "John Wick, Hunger Games, Twilight, Saw, Expendables",
        description: "Le plus grand distributeur indépendant d'Hollywood, référence des sagas d'action et fantastiques à succès."
    },
    {
        id: 183,
        type: 'movie',
        name: "StudioCanal",
        partners: ["Canal+ Group", "Working Title", "Studiocanal UK"],
        examples: "Paddington, Le Grand Bain, Bac Nord, Non-Stop",
        description: "Leader européen de la distribution, détenant l'un des catalogues de chefs-d'œuvre les plus vastes du septième art."
    },
    {
        id: 41077,
        type: 'movie',
        name: "A24",
        partners: ["Plan B Entertainment", "IAC Films", "Fruit Tree"],
        examples: "Everything Everywhere All at Once, Civil War, Midsommar, Hereditary",
        description: "Studio et distributeur d'auteurs incontournable, récompensé aux Oscars pour son cinéma audacieux."
    },
    {
        id: 102,
        type: 'movie',
        name: "Pathé Distribution",
        partners: ["Chapter 2", "Farnham Film", "Jerico Films", "M6 Films"],
        examples: "Le Comte de Monte-Cristo, Les Trois Mousquetaires, Astérix",
        description: "Monument du cinéma français et européen, spécialiste des grandes fresques épiques et populaires."
    },
    {
        id: 6896,
        type: 'movie',
        name: "EuropaCorp",
        partners: ["TF1 Films", "Canal+", "Fundamental Films"],
        examples: "Lucy, Taken, Valérian, Le Transporteur",
        description: "Créé par Luc Besson, studio français d'action distribuant ses superproductions à l'échelle internationale."
    },

    // --- SÉRIES & STREAMING ---
    {
        id: 3186,
        type: 'tv',
        networkId: '49|3186',
        name: "HBO / Max",
        partners: ["HBO Originals", "Max Originals", "Warner Bros. Television"],
        examples: "House of the Dragon, Game of Thrones, The Last of Us, Euphoria, Succession",
        description: "Chaîne d'exception et service de streaming du groupe Warner Bros. Discovery, référence absolue des séries de prestige."
    },
    {
        id: 213,
        type: 'tv',
        networkId: '213',
        name: "Netflix",
        partners: ["Netflix Originals", "Shondaland", "Millarworld"],
        examples: "Stranger Things, Squid Game, Mercredi, The Crown, Narcos",
        description: "Pionnier et géant mondial du streaming, produisant et distribuant les séries les plus populaires au monde."
    },
    {
        id: 1024,
        type: 'tv',
        networkId: '1024',
        name: "Amazon Prime Video",
        partners: ["Amazon MGM Studios", "Kilter Films"],
        examples: "The Boys, Les Anneaux de Pouvoir, Fallout, Reacher, Fleabag",
        description: "Service mondial de streaming d'Amazon offrant des adaptations ambitieuses et des séries d'action majeures."
    },
    {
        id: 2552,
        type: 'tv',
        networkId: '2552',
        name: "Apple TV+",
        partners: ["Apple Studios", "Skydance Television"],
        examples: "Ted Lasso, Severance, Silo, The Morning Show, Foundation",
        description: "Plateforme de streaming premium consacrée aux séries originales acclamées par la critique et multi-récompensées."
    },
    {
        id: 2739,
        type: 'tv',
        networkId: '2739',
        name: "Disney+ (Séries)",
        partners: ["Marvel Studios", "Lucasfilm", "National Geographic"],
        examples: "The Mandalorian, Loki, Star Wars: Ahsoka, Wandavision, Percy Jackson",
        description: "Plateforme exclusive diffusant l'intégralité des séries télévisées originales Star Wars, Marvel et Disney."
    },
    {
        id: 17400,
        type: 'tv',
        networkId: '174',
        name: "AMC Networks",
        partners: ["AMC Studios", "Gran Via Productions"],
        examples: "Breaking Bad, The Walking Dead, Better Call Saul, Mad Men",
        description: "Chaîne américaine légendaire à l'origine de chefs-d'œuvre de l'âge d'or des séries télévisées."
    },
    {
        id: 285,
        type: 'tv',
        networkId: '285',
        name: "Canal+ (Créations Originales)",
        partners: ["StudioCanal", "Canal+ Fiction"],
        examples: "Le Bureau des Légendes, Engrenages, D'argent et de sang, Hippocrate",
        description: "Pionnier français des créations originales de séries télévisées policières, dramatiques et d'espionnage."
    },
    {
        id: 88,
        type: 'tv',
        networkId: '88',
        name: "FX Networks",
        partners: ["FX Productions", "20th Television"],
        examples: "Shōgun, American Horror Story, Sons of Anarchy, Fargo, The Bear",
        description: "Chaîne dramatique prestige reconnue pour ses œuvres intenses et audacieuses récompensées aux Emmy Awards."
    },
    {
        id: 4330,
        type: 'tv',
        networkId: '67|4330',
        name: "Paramount+ / Showtime",
        partners: ["Paramount Television Studios", "Showtime Networks"],
        examples: "Yellowstone, Lioness, Special Ops, Halo, Dexter, Billions",
        description: "Service de streaming réunissant les grands drames du groupe Paramount et la prestigieuse marque Showtime."
    },
    {
        id: 453,
        type: 'tv',
        networkId: '453',
        name: "Hulu",
        partners: ["20th Television", "Searchlight Television"],
        examples: "The Handmaid's Tale, Futurama, Only Murders in the Building, The Bear",
        description: "Plateforme majeure du groupe Disney spécialisée dans les séries adultes, comédies et drames contemporains."
    }
];

let loadedDistributorsMap = {};
let currentDistributorId = null;
let currentDistributorSort = 'popularity.desc';
let currentFilterType = 'all';

const COMPANY_FAMILIES = {
    174: [174, 25120, 2785, 3627, 12, 923, 79, 9993, 184898, 429], // Warner Bros. Discovery
    2: [2, 3, 6125, 420, 1, 25, 9195], // Disney
    33: [33, 6704, 3486, 5556, 1014], // Universal
    5: [5, 14, 2251, 3287], // Sony
    4: [4, 2348], // Paramount
    11: [11, 1632, 493] // Lionsgate
};

document.addEventListener('DOMContentLoaded', () => {
    chargerDistributeurs();
});

function filtrerDistributeurs(type) {
    currentFilterType = type;

    document.querySelectorAll('#distributor-filter-tabs .filter-dist-btn').forEach(btn => {
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active', 'btn-primary');
            btn.classList.remove('btn-outline-secondary');
        } else {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-outline-secondary');
        }
    });

    renderDistributorsGrid();
}

async function chargerDistributeurs() {
    const container = document.getElementById('distributors-container');
    if (!container) return;

    try {
        const fetchPromises = DISTRIBUTORS_LIST.map(d => {
            if (d.type === 'tv') {
                const mainNetId = d.networkId.split('|')[0];
                return Promise.all([
                    fetch(`${API_BASE_URL}/network/${mainNetId}?api_key=${API_KEY}`).then(r => r.ok ? r.json() : null).catch(() => null),
                    fetch(`${API_BASE_URL}/discover/tv?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&with_networks=${d.networkId}&sort_by=popularity.desc&page=1`).then(r => r.ok ? r.json() : null).catch(() => null)
                ]).then(([apiNet, apiSeries]) => {
                    const item = {
                        ...d,
                        logo_path: apiNet?.logo_path || null,
                        origin_country: apiNet?.origin_country || 'US',
                        films_count: apiSeries?.total_results || 0,
                        top_items: apiSeries?.results?.slice(0, 4) || []
                    };
                    loadedDistributorsMap[d.id] = item;
                    return item;
                });
            } else {
                const compQuery = COMPANY_FAMILIES[d.id] ? COMPANY_FAMILIES[d.id].join('|') : d.id;
                return Promise.all([
                    fetch(`${API_BASE_URL}/company/${d.id}?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`).then(r => r.ok ? r.json() : null).catch(() => null),
                    fetch(`${API_BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${compQuery}&sort_by=revenue.desc&page=1`).then(r => r.ok ? r.json() : null).catch(() => null)
                ]).then(([apiCompany, apiFilms]) => {
                    const item = {
                        ...d,
                        logo_path: apiCompany?.logo_path || null,
                        origin_country: apiCompany?.origin_country || 'US',
                        films_count: apiFilms?.total_results || 0,
                        top_items: apiFilms?.results?.slice(0, 4) || []
                    };
                    loadedDistributorsMap[d.id] = item;
                    return item;
                });
            }
        });

        await Promise.all(fetchPromises);
        renderDistributorsGrid();

    } catch (e) {
        console.error("Erreur chargement distributeurs:", e);
        if (container) container.innerHTML = `<p class="text-center opacity-50 py-5 w-100">Erreur lors du chargement des distributeurs.</p>`;
    }
}

function renderDistributorsGrid() {
    const container = document.getElementById('distributors-container');
    if (!container) return;

    let items = Object.values(loadedDistributorsMap);
    if (items.length === 0) items = DISTRIBUTORS_LIST;

    if (currentFilterType === 'movie') {
        items = items.filter(d => d.type === 'movie' || d.type === 'both');
    } else if (currentFilterType === 'tv') {
        items = items.filter(d => d.type === 'tv' || d.type === 'both');
    }

    container.innerHTML = items.map(d => {
        const logoUrl = d.logo_path ? `${IMG_BASE_URL}${d.logo_path}` : `https://via.placeholder.com/300x120?text=${encodeURIComponent(d.name)}`;
        const partnersHtml = d.partners ? d.partners.map(p => `<span class="partner-chip"><i class="ph ph-handshake me-1"></i>${p}</span>`).join(' ') : '';

        const badgeTypeHtml = d.type === 'tv' 
            ? `<span class="badge bg-info text-dark rounded-pill px-3 py-1 me-2 x-small fw-bold"><i class="ph ph-television me-1"></i> SÉRIES & STREAMING</span>`
            : d.type === 'both'
            ? `<span class="badge bg-purple rounded-pill px-3 py-1 me-2 x-small fw-bold" style="background: linear-gradient(135deg, #a78bfa, #f472b6);"><i class="ph ph-film-strip me-1"></i> CINÉMA & STREAMING</span>`
            : `<span class="badge bg-primary rounded-pill px-3 py-1 me-2 x-small fw-bold"><i class="ph ph-film-strip me-1"></i> CINÉMA</span>`;

        const topItemsHtml = d.top_items && d.top_items.length > 0
            ? d.top_items.slice(0, 4).map(m => {
                const targetUrl = d.type === 'tv' ? `serie-details.html?id=${m.id}` : `movie-details.html?id=${m.id}`;
                const titleText = m.title || m.name;
                const defaultImg = m.poster_path ? IMG_BASE_URL + m.poster_path : 'https://via.placeholder.com/150x225';
                const posterSrc = d.type === 'tv' ? defaultImg : (window.getCustomPoster ? window.getCustomPoster(m.id, defaultImg, 'movie') : (localStorage.getItem(`custom_movie_poster_${m.id}`) || defaultImg));
                return `
                    <div class="col-3" title="${titleText}">
                        <a href="${targetUrl}">
                            <img src="${posterSrc}" class="img-fluid rounded-3 shadow-sm hover-scale" style="aspect-ratio:2/3; object-fit:cover;">
                        </a>
                    </div>
                `;
            }).join('')
            : '';

        const targetDetailUrl = `distributor-details.html?id=${d.id}${d.type ? '&type=' + d.type : ''}`;

        return `
            <div class="distributor-card">
                <div>
                    <div class="distributor-logo-box" style="cursor: pointer;" onclick="window.location.href='${targetDetailUrl}'">
                        <img src="${logoUrl}" alt="${d.name}">
                    </div>

                    <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">
                        <h4 class="fw-black mb-0 text-theme" style="cursor: pointer;" onclick="window.location.href='${targetDetailUrl}'">${d.name}</h4>
                        <div>
                            ${badgeTypeHtml}
                            <span class="badge bg-secondary rounded-pill px-3 py-1 x-small fw-bold"><i class="ph-fill ph-globe-hemisphere-west"></i> ${d.origin_country || 'US'}</span>
                        </div>
                    </div>

                    <p class="small opacity-75 mb-3">${d.description}</p>

                    <div class="mb-3">
                        <div class="x-small fw-extrabold text-accent uppercase mb-2"><i class="ph-fill ph-buildings me-1"></i> PARTENAIRES & LABELS CLÉS</div>
                        <div class="d-flex flex-wrap gap-2">${partnersHtml}</div>
                    </div>

                    <div class="mb-3">
                        <div class="x-small fw-extrabold opacity-50 uppercase mb-1"><i class="ph-fill ph-sparkle me-1"></i> SAGAS & SUCCÈS MAJEURS</div>
                        <div class="small fw-bold text-theme">${d.examples}</div>
                    </div>
                </div>

                <div>
                    ${topItemsHtml ? `
                        <div class="mt-3 pt-3 border-top border-secondary opacity-75">
                            <div class="x-small fw-bold opacity-50 uppercase mb-2">${d.type === 'tv' ? 'SÉRIES ÉVÉNEMENT' : 'PRODUCTIONS / DISTRIBUTIONS PHARES'}</div>
                            <div class="row g-2">${topItemsHtml}</div>
                        </div>
                    ` : ''}

                    <div class="d-flex gap-2 mt-3">
                        <a href="${targetDetailUrl}" class="btn btn-primary rounded-pill btn-sm w-100 fw-bold">
                            <i class="${d.type === 'tv' ? 'ph ph-television' : 'ph ph-film-strip'} me-1"></i> DÉCOUVRIR (${d.films_count || 0} ${d.type === 'tv' ? 'SÉRIES' : 'TITRES'})
                        </a>
                        <button class="btn btn-outline-secondary rounded-pill btn-sm fw-bold px-3" title="Aperçu rapide" onclick="afficherTousLesFilmsDistribués(${d.id})">
                            <i class="ph ph-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function afficherTousLesFilmsDistribués(distributorId) {
    currentDistributorId = distributorId;
    currentDistributorSort = 'popularity.desc';

    const distInfo = loadedDistributorsMap[distributorId] || DISTRIBUTORS_LIST.find(d => d.id === distributorId);
    const titleEl = document.getElementById("distributorModalTitle");
    const subtitleEl = document.getElementById("distributorModalSubtitle");
    const logoEl = document.getElementById("distributorModalLogo");
    const grid = document.getElementById("distributorModalGrid");
    const companyPageBtn = document.getElementById("btn-view-company-page");

    if (titleEl) titleEl.textContent = distInfo ? distInfo.name : "Catalogue du Distributeur";
    if (subtitleEl) subtitleEl.textContent = distInfo ? `Partenaires majeurs : ${distInfo.partners.join(', ')}` : "";
    if (companyPageBtn) companyPageBtn.href = `distributor-details.html?id=${distributorId}${distInfo?.type ? '&type=' + distInfo.type : ''}`;

    if (logoEl && distInfo && distInfo.logo_path) {
        logoEl.innerHTML = `<img src="${IMG_BASE_URL}${distInfo.logo_path}" style="max-height: 100%; max-width: 120px; object-fit: contain;">`;
        logoEl.style.display = "flex";
    } else if (logoEl) {
        logoEl.style.display = "none";
    }

    if (grid) {
        grid.innerHTML = `<div class="text-center py-5 w-100" style="grid-column: 1 / -1;"><div class="spinner-border text-accent"></div></div>`;
    }

    const modalEl = document.getElementById('distributorModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    await loadDistributorMovies(distributorId, currentDistributorSort);
}

async function loadDistributorMovies(distributorId, sortMethod) {
    const grid = document.getElementById("distributorModalGrid");
    const countEl = document.getElementById("distributorModalCount");
    const distInfo = loadedDistributorsMap[distributorId] || DISTRIBUTORS_LIST.find(d => d.id === distributorId);

    try {
        let res;
        if (distInfo && distInfo.type === 'tv') {
            res = await fetch(`${API_BASE_URL}/discover/tv?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&with_networks=${distInfo.networkId}&sort_by=${sortMethod}&page=1`).then(r => r.json());
        } else {
            const compQuery = COMPANY_FAMILIES[distributorId] ? COMPANY_FAMILIES[distributorId].join('|') : distributorId;
            res = await fetch(`${API_BASE_URL}/discover/movie?api_key=${API_KEY}&language=${localStorage.getItem('user_lang') || 'fr-FR'}&with_companies=${compQuery}&sort_by=${sortMethod}&page=1`).then(r => r.json());
        }

        if (countEl) {
            countEl.textContent = `${res.total_results || 0} ${distInfo?.type === 'tv' ? 'séries distribuées' : 'films distribués'}`;
        }

        if (res.results && res.results.length > 0) {
            grid.innerHTML = res.results.map(m => {
                const targetUrl = distInfo?.type === 'tv' ? `serie-details.html?id=${m.id}` : `movie-details.html?id=${m.id}`;
                const titleText = m.title || m.name;
                const releaseYear = m.release_date ? new Date(m.release_date).getFullYear() : (m.first_air_date ? new Date(m.first_air_date).getFullYear() : 'N/A');
                const defaultImg = m.poster_path ? IMG_BASE_URL + m.poster_path : 'https://via.placeholder.com/210x315';
                const posterSrc = distInfo?.type === 'tv' ? defaultImg : (window.getCustomPoster ? window.getCustomPoster(m.id, defaultImg, 'movie') : (localStorage.getItem(`custom_movie_poster_${m.id}`) || defaultImg));

                return `
                    <div class="premium-card" onclick="window.location.href='${targetUrl}'" style="cursor: pointer;">
                        <img src="${posterSrc}" loading="lazy">
                        <div class="card-details">
                            <div class="card-title text-truncate">${titleText}</div>
                            <div class="card-meta">
                                <span class="rating-badge"><i class="ph-fill ph-star"></i> ${m.vote_average ? m.vote_average.toFixed(1) : '0.0'}</span>
                                <span class="opacity-75">${releaseYear}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            grid.innerHTML = `<p class="text-center opacity-50 py-5 w-100" style="grid-column: 1 / -1;">Aucun élément disponible pour ce distributeur.</p>`;
        }
    } catch (e) {
        console.error(e);
        if (grid) grid.innerHTML = `<p class="text-center opacity-50 py-5 w-100" style="grid-column: 1 / -1;">Erreur lors du chargement des contenus.</p>`;
    }
}

async function sortDistributorMovies(sortMethod) {
    if (!currentDistributorId) return;

    ['sort-dist-pop', 'sort-dist-rev', 'sort-dist-vote'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active', 'btn-primary');
    });

    if (sortMethod === 'popularity.desc') document.getElementById('sort-dist-pop')?.classList.add('active', 'btn-primary');
    if (sortMethod === 'revenue.desc') document.getElementById('sort-dist-rev')?.classList.add('active', 'btn-primary');
    if (sortMethod === 'vote_average.desc') document.getElementById('sort-dist-vote')?.classList.add('active', 'btn-primary');

    await loadDistributorMovies(currentDistributorId, sortMethod);
}
