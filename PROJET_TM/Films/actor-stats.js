// actor-stats.js (Advanced Analytics Edition - Full French)

const CONFIG = {
    URL_BASE: "https://api.themoviedb.org/3",
    CLE_API: window.TMDB_CONFIG.API_KEY,
    LANG: "fr-FR"
};

const CHART_COLORS = {
    accent: '#a78bfa',
    secondary: '#f472b6',
    blue: '#60a5fa',
    teal: '#2dd4bf',
    orange: '#fb923c',
    gray: 'rgba(255,255,255,0.1)',
    white: '#ffffff'
};

const GENRE_COLORS = [
    '#a78bfa', '#f472b6', '#60a5fa', '#2dd4bf', '#fb923c', 
    '#f87171', '#818cf8', '#fb7185', '#34d399', '#fbbf24'
];

const COUNTRY_CODES = {
    'USA': 'US', 'United States': 'US', 'UK': 'GB', 'United Kingdom': 'GB', 'England': 'GB',
    'Scotland': 'GB', 'Wales': 'GB', 'Northern Ireland': 'GB', 'France': 'FR', 'Canada': 'CA',
    'Australia': 'AU', 'Germany': 'DE', 'West Germany': 'DE', 'Italy': 'IT', 'Spain': 'ES',
    'Mexico': 'MX', 'Japan': 'JP', 'South Korea': 'KR', 'China': 'CN', 'India': 'IN',
    'Brazil': 'BR', 'Russia': 'RU', 'Soviet Union': 'RU', 'Ireland': 'IE', 'New Zealand': 'NZ',
    'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK', 'Finland': 'FI', 'Netherlands': 'NL',
    'Belgium': 'BE', 'Switzerland': 'CH', 'Austria': 'AT', 'South Africa': 'ZA', 'Argentina': 'AR',
    'Hong Kong': 'HK', 'Taiwan': 'TW', 'Puerto Rico': 'PR', 'Philippines': 'PH', 'Turkey': 'TR',
    'Greece': 'GR', 'Poland': 'PL', 'Czech Republic': 'CZ', 'Czechoslovakia': 'CZ', 'Hungary': 'HU',
    'Romania': 'RO', 'Israel': 'IL', 'Egypt': 'EG', 'Morocco': 'MA', 'Iceland': 'IS'
};

document.addEventListener("DOMContentLoaded", async () => {
    const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : null;
    const loadingScreen = document.getElementById("loading-screen");
    const hideLoading = () => {
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.classList.add('d-none'), 500);
        }
    };

    if (!auth) {
        hideLoading();
        return;
    }

    try {
        const uid = auth.userId || auth.id || (auth.user && (auth.user.id || auth.user.userId)) || 1;
        
        const [movies, series, actors] = await Promise.all([
            chargerFavoris(uid, 'movie'),
            chargerFavoris(uid, 'tv'),
            chargerActeursFavoris(uid)
        ]);

        hideLoading();

        initMovieStats(movies);
        initTVStats(series);
        initActorStats(actors);

    } catch (e) {
        console.error("Erreur stats:", e);
        hideLoading();
    }
});

async function chargerFavoris(userId, type) {
    try {
        const res = await fetch(`favorites.php?user_id=${userId}&media_type=${type}`);
        const data = await res.json();
        if (!data.success) return [];

        const details = await Promise.all(
            data.favorites
                .filter(f => f.media_type === type || (!f.media_type && type === 'movie'))
                .map(async (f) => {
                    const r = await fetch(`${CONFIG.URL_BASE}/${type}/${f.tmdb_id}?api_key=${CONFIG.CLE_API}&language=${CONFIG.LANG}`);
                    return r.ok ? await r.json() : null;
                })
        );
        return details.filter(d => d !== null);
    } catch (e) { return []; }
}

async function chargerActeursFavoris(userId) {
    let list = [];
    try {
        const res = await fetch(`favorite-actors.php?user_id=${userId}`);
        const data = await res.json();
        if (data.success) list = data.favorite_actors.map(a => ({ id: a.tmdb_id }));
    } catch (e) {}

    if (list.length === 0) {
        const stored = localStorage.getItem('actor_favorites');
        list = stored ? JSON.parse(stored) : [];
    }

    const details = await Promise.all(
        list.map(async (a) => {
            const r = await fetch(`${CONFIG.URL_BASE}/person/${a.id}?api_key=${CONFIG.CLE_API}&language=${localStorage.getItem('user_lang') || 'fr-FR'}`);
            return r.ok ? await r.json() : null;
        })
    );
    return details.filter(d => d !== null);
}

function initMovieStats(movies) {
    document.getElementById('movie-count').textContent = movies.length;
    if (movies.length === 0) return;

    const avgRating = movies.reduce((acc, m) => acc + (m.vote_average || 0), 0) / movies.length;
    document.getElementById('movie-avg-rating').textContent = avgRating.toFixed(1);

    const totalMinutes = movies.reduce((acc, m) => acc + (m.runtime || 0), 0);
    document.getElementById('movie-total-runtime').textContent = Math.round(totalMinutes / 60) + "h";

    const genreMap = {};
    movies.forEach(m => m.genres?.forEach(g => genreMap[g.name] = (genreMap[g.name] || 0) + 1));
    renderRadarChart('movieGenreChart', Object.keys(genreMap), Object.values(genreMap), CHART_COLORS.accent);

    const yearMap = {};
    const moviesByYear = {};
    movies.forEach(m => {
        if (m.release_date) {
            const year = new Date(m.release_date).getFullYear();
            yearMap[year] = (yearMap[year] || 0) + 1;
            if (!moviesByYear[year]) moviesByYear[year] = [];
            moviesByYear[year].push(m);
        }
    });
    const sortedYears = Object.keys(yearMap).sort((a, b) => Number(a) - Number(b));
    const sortedCounts = sortedYears.map(y => yearMap[y]);
    renderLineChart('movieYearChart', sortedYears, sortedCounts, CHART_COLORS.blue, moviesByYear);
}

function initTVStats(series) {
    document.getElementById('tv-count').textContent = series.length;
    if (series.length === 0) return;

    const avgEps = series.reduce((acc, s) => acc + (s.number_of_episodes || 0), 0) / series.length;
    document.getElementById('tv-avg-episodes').textContent = Math.round(avgEps);

    const genreMap = {};
    series.forEach(s => s.genres?.forEach(g => genreMap[g.name] = (genreMap[g.name] || 0) + 1));
    const mostCommon = Object.entries(genreMap).sort((a,b) => b[1] - a[1])[0]?.[0] || "-";
    document.getElementById('tv-most-genre').textContent = mostCommon;

    renderPolarChart('tvGenreChart', Object.keys(genreMap), Object.values(genreMap), GENRE_COLORS);

    // Traduction des statuts
    const statusTranslations = {
        "Returning Series": "En cours",
        "Ended": "Terminée",
        "Canceled": "Annulée",
        "Pilot": "Pilote",
        "In Production": "En production",
        "Planned": "Prévue"
    };

    const statusMap = {};
    series.forEach(s => {
        const label = statusTranslations[s.status] || s.status;
        statusMap[label] = (statusMap[label] || 0) + 1;
    });
    renderBarChart('tvStatusChart', Object.keys(statusMap), Object.values(statusMap), CHART_COLORS.secondary);
}

function initActorStats(actors) {
    document.getElementById('actor-count').textContent = actors.length;
    if (actors.length === 0) return;

    let totalAge = 0, countAge = 0;
    const genderMap = { 'Hommes': 0, 'Femmes': 0, 'Autres': 0 };
    const ageRanges = { "Moins de 30": 0, "30-45": 0, "45-60": 0, "60+": 0 };
    const countryData = {};
    const countryActors = {};
    const countryNames = {};

    actors.forEach(a => {
        if (a.gender === 1) genderMap['Femmes']++;
        else if (a.gender === 2) genderMap['Hommes']++;
        else genderMap['Autres']++;

        if (a.birthday) {
            const age = Math.floor((new Date() - new Date(a.birthday)) / (365.25 * 24 * 60 * 60 * 1000));
            totalAge += age;
            countAge++;
            if (age < 30) ageRanges["Moins de 30"]++;
            else if (age <= 45) ageRanges["30-45"]++;
            else if (age <= 60) ageRanges["45-60"]++;
            else ageRanges["60+"]++;
        }

        if (a.place_of_birth) {
            let parts = a.place_of_birth.split(',');
            let country = parts[parts.length - 1].trim();
            let code = COUNTRY_CODES[country];
            if (code) {
                countryData[code] = (countryData[code] || 0) + 1;
                if (!countryActors[code]) countryActors[code] = [];
                countryActors[code].push(a);
                countryNames[code] = country;
            }
        }
    });

    document.getElementById('actor-avg-age').textContent = countAge > 0 ? Math.round(totalAge / countAge) + " ans" : "N/A";
    const ratio = Math.round((genderMap['Femmes'] / actors.length) * 100);
    document.getElementById('actor-gender-ratio').textContent = `${ratio}% Femmes`;

    renderDoughnutChart('actorGenderChart', Object.keys(genderMap), Object.values(genderMap), [CHART_COLORS.blue, CHART_COLORS.secondary, CHART_COLORS.gray]);
    renderBarChart('actorAgeChart', Object.keys(ageRanges), Object.values(ageRanges), CHART_COLORS.orange);
    renderWorldMap(countryData, countryActors, countryNames);
}

// --- NEW STYLED CHARTS ---

function renderWorldMap(data, countryActors, countryNames) {
    const mapEl = document.getElementById('actorWorldMap');
    if (!mapEl) return;
    mapEl.innerHTML = "";
    
    const isLight = document.documentElement.getAttribute('data-theme') === 'light' || document.body.classList.contains('light-theme');
    const baseColor = isLight ? '#e5e7eb' : 'rgba(255,255,255,0.05)';
    const strokeColor = isLight ? '#ffffff' : '#111111';
    
    const activeCodes = Object.keys(data);

    const mapOptions = {
        selector: '#actorWorldMap',
        map: 'world',
        backgroundColor: 'transparent',
        zoomOnScroll: false,
        regionStyle: {
            initial: {
                fill: baseColor,
                stroke: strokeColor,
                strokeWidth: 1,
                fillOpacity: 1
            },
            hover: { fill: CHART_COLORS.secondary, fillOpacity: 0.8 }
        },
        onRegionTooltipShow(event, tooltip, code) {
            const count = data[code] || 0;
            if (count > 0) {
                tooltip.text(tooltip.text() + ` - ${count} star${count > 1 ? 's' : ''} (Cliquez pour voir)`);
            } else {
                tooltip.text(tooltip.text());
            }
        },
        onRegionClick(event, code) {
            try {
                const list = countryActors[code];
                if (list && list.length > 0) {
                    const regionName = countryNames[code] || code;
                    showCountryActors(regionName, list);
                }
            } catch (e) {
                console.error("Map click error: ", e);
            }
        }
    };

    if (Object.keys(data).length > 0) {
        const colorValues = {};
        Object.keys(data).forEach(code => {
            const count = data[code];
            if (count < 5) {
                colorValues[code] = 'tier1';
            } else if (count <= 20) {
                colorValues[code] = 'tier2';
            } else if (count <= 50) {
                colorValues[code] = 'tier3';
            } else {
                colorValues[code] = 'tier4';
            }
        });

        mapOptions.series = {
            regions: [{
                attribute: 'fill',
                scale: {
                    'tier1': '#2e1065', // Très sombre (presque noir)
                    'tier2': '#5b21b6', // Mauve foncé
                    'tier3': '#a78bfa', // Mauve clair
                    'tier4': '#f472b6'  // Rose
                },
                values: colorValues
            }]
        };
    }

    window.worldMapInstance = new jsVectorMap(mapOptions);

    if (!window.mapTabListenerAdded) {
        document.querySelectorAll('button[data-bs-toggle="pill"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                if (e.target.dataset.bsTarget === '#tab-actors' && window.worldMapInstance) {
                    window.worldMapInstance.updateSize();
                }
            });
        });
        window.mapTabListenerAdded = true;
    }
}

function renderRadarChart(id, labels, data, color) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Titres',
                data: data,
                backgroundColor: color + '33',
                borderColor: color,
                borderWidth: 2,
                pointBackgroundColor: color,
                pointRadius: 4
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'var(--border)' },
                    grid: { color: 'var(--border)' },
                    pointLabels: { color: 'var(--text-secondary)', font: { size: 10 } },
                    ticks: { display: false }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderLineChart(id, labels, data, color, moviesByYear = null) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    if (Chart.getChart(id)) {
        Chart.getChart(id).destroy();
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Films sortis',
                data: data,
                borderColor: color,
                backgroundColor: color + '22',
                fill: true,
                tension: 0.3,
                borderWidth: 3,
                pointBackgroundColor: color,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 9,
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: color,
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            onClick: (e, elements) => {
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const year = labels[index];
                    const count = data[index];
                    showYearDetails(year, count, moviesByYear ? moviesByYear[year] : []);
                }
            },
            scales: {
                y: {
                    display: true,
                    beginAtZero: true,
                    ticks: {
                        color: 'var(--text-secondary)',
                        font: { size: 10, weight: '600' },
                        precision: 0
                    },
                    grid: { color: 'var(--border)' }
                },
                x: {
                    ticks: { color: 'var(--text-secondary)', font: { size: 10, weight: '600' } },
                    grid: { color: 'var(--border)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#a78bfa',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyColor: '#ffffff',
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: false,
                    callbacks: {
                        title: (items) => `Année ${items[0].label}`,
                        label: (item) => `🎬 ${item.raw} film${item.raw > 1 ? 's' : ''} dans votre collection (Cliquez pour afficher)`
                    }
                }
            }
        }
    });
}

function showYearDetails(year, count, moviesList) {
    const titleEl = document.getElementById("yearDetailTitle");
    const contentEl = document.getElementById("yearDetailContent");
    if (titleEl) titleEl.innerHTML = `Films de votre collection sortis en <span class="text-accent">${year}</span> (${count})`;

    if (contentEl) {
        contentEl.style.display = 'block'; // Override HTML grid
        
        const hoverStyles = `
            <style>
                .cinematic-card { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); border: 1px solid transparent; }
                .cinematic-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(167,139,250,0.25) !important; border-color: var(--accent); z-index: 2; }
            </style>
        `;

        if (!moviesList || moviesList.length === 0) {
            contentEl.innerHTML = `<p class="text-center opacity-50 py-4 w-100">Aucun détail disponible pour cette année.</p>`;
        } else {
            contentEl.innerHTML = hoverStyles + `
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; padding: 10px;">
                    ${moviesList.map(m => `
                        <div class="cinematic-card" onclick="window.location.href='movie-details.html?id=${m.id}'" style="width: 140px; position: relative; border-radius: 16px; overflow: hidden; cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.4); background: var(--bg-card);">
                            <img src="${m.poster_path ? 'https://image.tmdb.org/t/p/w500' + m.poster_path : 'https://via.placeholder.com/220x330?text=Affiche'}" loading="lazy" style="width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block;">
                            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 40px 12px 12px; background: linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.8) 40%, transparent 100%); text-align: center;">
                                <div style="color: #ffffff; font-weight: 700; font-size: 0.8rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${m.title}</div>
                                <div style="color: var(--accent); font-size: 0.75rem; font-weight: 800; margin-top: 6px;">⭐ ${m.vote_average ? m.vote_average.toFixed(1) : 'N/A'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    const modalEl = document.getElementById('yearDetailModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }
}

function showCountryActors(countryName, actorsList) {
    const titleEl = document.getElementById("yearDetailTitle");
    const contentEl = document.getElementById("yearDetailContent");
    if (titleEl) titleEl.innerHTML = `🌍 Talents originaires de : <span class="text-accent">${countryName}</span> (${actorsList.length})`;

    if (contentEl) {
        contentEl.style.display = 'block'; // Override HTML grid
        
        const hoverStyles = `
            <style>
                .cinematic-card { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); border: 1px solid transparent; }
                .cinematic-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(167,139,250,0.25) !important; border-color: var(--accent); z-index: 2; }
            </style>
        `;

        contentEl.innerHTML = hoverStyles + `
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; padding: 10px;">
                ${actorsList.map(a => `
                    <div class="cinematic-card" onclick="window.location.href='actor-details.html?id=${a.id}'" style="width: 140px; position: relative; border-radius: 16px; overflow: hidden; cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.4); background: var(--bg-card);">
                        <img src="${a.profile_path ? 'https://image.tmdb.org/t/p/w500' + a.profile_path : 'https://via.placeholder.com/220x330?text=Photo'}" loading="lazy" style="width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block;">
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 40px 12px 12px; background: linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.8) 40%, transparent 100%); text-align: center;">
                            <div style="color: #ffffff; font-weight: 700; font-size: 0.85rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8); line-height: 1.2;">${a.name}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    const modalEl = document.getElementById('yearDetailModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }
}

function renderPolarChart(id, labels, data, colors) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light' || document.body.classList.contains('light-theme');
    const textColor = isLight ? '#475569' : '#cbd5e1';
    const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';

    new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors.map(c => c + 'AA'), borderWidth: 0 }]
        },
        options: {
            scales: { r: { grid: { color: gridColor }, ticks: { display: false } } },
            plugins: { legend: { position: 'right', labels: { color: textColor, boxWidth: 12, font: { size: 10, family: "'Inter', sans-serif" } } } }
        }
    });
}

function renderDoughnutChart(id, labels, data, colors) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light' || document.body.classList.contains('light-theme');
    const textColor = isLight ? '#475569' : '#cbd5e1';
    const cardBg = isLight ? '#ffffff' : '#1e293b';

    new Chart(ctx, {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderWidth: 4, borderColor: cardBg, borderRadius: 8, hoverOffset: 5 }] },
        options: {
            cutout: '75%',
            plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 20, font: { weight: '600', family: "'Inter', sans-serif" } } } }
        }
    });
}

function renderBarChart(id, labels, data, color) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light' || document.body.classList.contains('light-theme');
    const textColor = isLight ? '#475569' : '#cbd5e1';

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: color, borderRadius: 8, barPercentage: 0.6 }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: { grid: { display: false, drawBorder: false }, ticks: { display: false } },
                y: { grid: { display: false, drawBorder: false }, ticks: { color: textColor, font: { weight: '600', family: "'Inter', sans-serif" } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}
