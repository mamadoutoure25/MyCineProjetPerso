/**
 * distributors-browse.js - Exploration des distributeurs de cinéma et de leurs partenariats
 */

const API_KEY = '04c35731a5ee918f014970082a0088b1';
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const DISTRIBUTORS_LIST = [
    {
        id: 174,
        name: "Warner Bros. Pictures",
        partners: ["Legendary Pictures", "Apple Original Films", "DC Studios", "Village Roadshow"],
        examples: "Dune: Part Two, F1 (Apex), Batman, Harry Potter, Matrix",
        description: "Distributeur mondial d'envergure. Distribue en salles les superproductions de Legendary (Dune, MonsterVerse) et les créations Apple Original (F1)."
    },
    {
        id: 33,
        name: "Universal Pictures",
        partners: ["Syncopy (Nolan)", "Blumhouse", "Illumination", "DreamWorks Animation"],
        examples: "Oppenheimer, Fast & Furious, Jurassic World, Moi Moche et Méchant, Super Mario",
        description: "Distributeur exclusif des œuvres de Syncopy (Oppenheimer), des thrillers Blumhouse et du catalogue Illumination."
    },
    {
        id: 2,
        name: "Walt Disney Studios Motion Pictures",
        partners: ["Marvel Studios", "Lucasfilm", "Pixar Animation", "20th Century Studios"],
        examples: "Avengers, Star Wars, Avatar, Toy Story, Deadpool & Wolverine",
        description: "Leader incontesté de la distribution mondiale, gérant les sorties géantes de Marvel, Lucasfilm, Pixar et 20th Century."
    },
    {
        id: 4,
        name: "Paramount Pictures",
        partners: ["Skydance Media", "Apple Original Films", "Bad Robot", "Nickelodeon"],
        examples: "Mission: Impossible, Top Gun: Maverick, Transformers, Sonic, Gladiator II",
        description: "Studio et distributeur majeur, partenaire privilégié de Skydance pour Mission: Impossible et Top Gun, ainsi que des sorties Apple."
    },
    {
        id: 5,
        name: "Sony Pictures Releasing",
        partners: ["Marvel Studios", "Columbia Pictures", "Sony Pictures Animation"],
        examples: "Spider-Man (MCU & Spider-Verse), Venom, Jumanji, Ghostbusters, Uncharted",
        description: "Orchestre la distribution mondiale de l'univers Spider-Man et Spider-Verse en étroite collaboration avec Marvel Studios."
    },
    {
        id: 11,
        name: "Lionsgate Films",
        partners: ["Summit Entertainment", "Thunder Road Pictures", "Millennium Media"],
        examples: "John Wick, Hunger Games, Twilight, Saw, Expendables",
        description: "Le plus grand distributeur indépendant d'Hollywood, référence des sagas d'action et fantastiques à succès."
    },
    {
        id: 183,
        name: "StudioCanal",
        partners: ["Canal+ Group", "Working Title", "Studiocanal UK"],
        examples: "Paddington, Le Grand Bain, Bac Nord, Non-Stop",
        description: "Leader européen de la distribution, détenant l'un des catalogues de chefs-d'œuvre les plus vastes du septième art."
    },
    {
        id: 41077,
        name: "A24",
        partners: ["Plan B Entertainment", "IAC Films", "Fruit Tree"],
        examples: "Everything Everywhere All at Once, Civil War, Midsommar, Hereditary",
        description: "Studio et distributeur d'auteurs incontournable, récompensé aux Oscars pour son cinéma audacieux."
    },
    {
        id: 102,
        name: "Pathé Distribution",
        partners: ["Chapter 2", "Farnham Film", "Jerico Films", "M6 Films"],
        examples: "Le Comte de Monte-Cristo, Les Trois Mousquetaires, Astérix",
        description: "Monument du cinéma français et européen, spécialiste des grandes fresques épiques et populaires."
    },
    {
        id: 6896,
        name: "EuropaCorp",
        partners: ["TF1 Films", "Canal+", "Fundamental Films"],
        examples: "Lucy, Taken, Valérian, Le Transporteur",
        description: "Créé par Luc Besson, studio français d'action distribuant ses superproductions à l'échelle internationale."
    }
];

let loadedDistributorsMap = {};
let currentDistributorId = null;
let currentDistributorSort = 'popularity.desc';

const COMPANY_FAMILIES = {
    174: [174, 25120, 2785, 3627, 12], // Warner Bros., Warner Animation Group (25120), WB Animation, WB Japan, New Line Cinema
    2: [2, 3, 6125, 420, 1, 25, 9195], // Disney, Pixar, Disney Animation, Marvel Studios, Lucasfilm, 20th Century, Touchstone
    33: [33, 6704, 3486, 5556, 1014], // Universal, Illumination, DreamWorks, Universal Animation, Focus Features
    5: [5, 14, 2251, 3287], // Sony, Columbia, Sony Animation, Screen Gems
    4: [4, 2348], // Paramount, Nickelodeon
    11: [11, 1632, 493] // Lionsgate, Summit
};

document.addEventListener('DOMContentLoaded', () => {
    chargerDistributeurs();
});

async function chargerDistributeurs() {
    const container = document.getElementById('distributors-container');
    if (!container) return;

    try {
        const fetchPromises = DISTRIBUTORS_LIST.map(d => {
            const compQuery = COMPANY_FAMILIES[d.id] ? COMPANY_FAMILIES[d.id].join('|') : d.id;
            return Promise.all([
                fetch(`${API_BASE_URL}/company/${d.id}?api_key=${API_KEY}&language=fr-FR`).then(r => r.ok ? r.json() : null).catch(() => null),
                fetch(`${API_BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${compQuery}&sort_by=revenue.desc&page=1`).then(r => r.ok ? r.json() : null).catch(() => null)
            ]).then(([apiCompany, apiFilms]) => {
                const item = {
                    ...d,
                    logo_path: apiCompany?.logo_path || null,
                    origin_country: apiCompany?.origin_country || 'US',
                    headquarters: apiCompany?.headquarters || '',
                    films_count: apiFilms?.total_results || 0,
                    top_movies: apiFilms?.results?.slice(0, 4) || []
                };
                loadedDistributorsMap[d.id] = item;
                return item;
            });
        });

        const distributors = await Promise.all(fetchPromises);

        container.innerHTML = distributors.map(d => {
            const logoUrl = d.logo_path ? `${IMG_BASE_URL}${d.logo_path}` : `https://via.placeholder.com/300x120?text=${encodeURIComponent(d.name)}`;
            const partnersHtml = d.partners.map(p => `<span class="partner-chip"><i class="ph ph-handshake me-1"></i>${p}</span>`).join(' ');

            const topMoviesHtml = d.top_movies && d.top_movies.length > 0
                ? d.top_movies.map(m => `
                    <div class="col-3" title="${m.title}">
                        <a href="movie-details.html?id=${m.id}">
                            <img src="${m.poster_path ? IMG_BASE_URL + m.poster_path : 'https://via.placeholder.com/150x225'}" class="img-fluid rounded-3 shadow-sm hover-scale" style="aspect-ratio:2/3; object-fit:cover;">
                        </a>
                    </div>
                `).join('')
                : '';

            return `
                <div class="distributor-card">
                    <div>
                        <div class="distributor-logo-box" style="cursor: pointer;" onclick="window.location.href='distributor-details.html?id=${d.id}'">
                            <img src="${logoUrl}" alt="${d.name}">
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h4 class="fw-black mb-0 text-theme" style="cursor: pointer;" onclick="window.location.href='distributor-details.html?id=${d.id}'">${d.name}</h4>
                            <span class="badge bg-primary rounded-pill px-3 py-2 x-small fw-bold"><i class="ph-fill ph-globe-hemisphere-west"></i> ${d.origin_country}</span>
                        </div>

                        <p class="small opacity-75 mb-3">${d.description}</p>

                        <div class="mb-3">
                            <div class="x-small fw-extrabold text-accent uppercase mb-2"><i class="ph-fill ph-buildings me-1"></i> PARTENAIRES DE PRODUCTION SOUVENT DISTRIBUÉS</div>
                            <div class="d-flex flex-wrap gap-2">${partnersHtml}</div>
                        </div>

                        <div class="mb-3">
                            <div class="x-small fw-extrabold opacity-50 uppercase mb-1"><i class="ph-fill ph-sparkle me-1"></i> SAGAS & SUCCÈS MAJEURS</div>
                            <div class="small fw-bold text-theme">${d.examples}</div>
                        </div>
                    </div>

                    <div>
                        ${topMoviesHtml ? `
                            <div class="mt-3 pt-3 border-top border-secondary opacity-75">
                                <div class="x-small fw-bold opacity-50 uppercase mb-2">PRODUCTIONS / DISTRIBUTIONS PHARES</div>
                                <div class="row g-2">${topMoviesHtml}</div>
                            </div>
                        ` : ''}

                        <div class="d-flex gap-2 mt-3">
                            <a href="distributor-details.html?id=${d.id}" class="btn btn-primary rounded-pill btn-sm w-100 fw-bold">
                                <i class="ph ph-film-strip me-1"></i> DÉCOUVRIR LE CATALOGUE (${d.films_count} FILMS)
                            </a>
                            <button class="btn btn-outline-secondary rounded-pill btn-sm fw-bold px-3" title="Aperçu rapide" onclick="afficherTousLesFilmsDistribués(${d.id})">
                                <i class="ph ph-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error("Erreur chargement distributeurs:", e);
        container.innerHTML = `<p class="text-center opacity-50 py-5 w-100">Erreur lors du chargement des distributeurs.</p>`;
    }
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
    if (companyPageBtn) companyPageBtn.href = `distributor-details.html?id=${distributorId}`;

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

    try {
        const compQuery = COMPANY_FAMILIES[distributorId] ? COMPANY_FAMILIES[distributorId].join('|') : distributorId;
        const res = await fetch(`${API_BASE_URL}/discover/movie?api_key=${API_KEY}&language=fr-FR&with_companies=${compQuery}&sort_by=${sortMethod}&page=1`).then(r => r.json());

        if (countEl) {
            countEl.textContent = `${res.total_results || 0} films distribués`;
        }

        if (res.results && res.results.length > 0) {
            grid.innerHTML = res.results.map(m => `
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
        } else {
            grid.innerHTML = `<p class="text-center opacity-50 py-5 w-100" style="grid-column: 1 / -1;">Aucun film disponible pour ce distributeur.</p>`;
        }
    } catch (e) {
        console.error(e);
        if (grid) grid.innerHTML = `<p class="text-center opacity-50 py-5 w-100" style="grid-column: 1 / -1;">Erreur lors du chargement des films.</p>`;
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
