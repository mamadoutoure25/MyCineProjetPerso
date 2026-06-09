// actor-stats.js (Advanced Analytics Edition - Full French)

const CONFIG = {
    URL_BASE: "https://api.themoviedb.org/3",
    CLE_API: "04c35731a5ee918f014970082a0088b1",
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

document.addEventListener("DOMContentLoaded", async () => {
    const auth = JSON.parse(sessionStorage.getItem("auth"));
    if (!auth) {
        window.location.href = "../connexion/connexion.html";
        return;
    }

    try {
        const loadingScreen = document.getElementById("loading-screen");
        const uid = auth.userId || auth.id;
        
        const [movies, series, actors] = await Promise.all([
            chargerFavoris(uid, 'movie'),
            chargerFavoris(uid, 'tv'),
            chargerActeursFavoris(uid)
        ]);

        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.classList.add('d-none'), 500);
        }

        initMovieStats(movies);
        initTVStats(series);
        initActorStats(actors);

    } catch (e) {
        console.error("Erreur stats:", e);
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
            const r = await fetch(`${CONFIG.URL_BASE}/person/${a.id}?api_key=${CONFIG.CLE_API}&language=fr-FR`);
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
    movies.forEach(m => {
        if (m.release_date) {
            const year = new Date(m.release_date).getFullYear();
            yearMap[year] = (yearMap[year] || 0) + 1;
        }
    });
    renderLineChart('movieYearChart', Object.keys(yearMap).sort(), Object.values(yearMap), CHART_COLORS.blue);
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
    });

    document.getElementById('actor-avg-age').textContent = countAge > 0 ? Math.round(totalAge / countAge) + " ans" : "N/A";
    const ratio = Math.round((genderMap['Femmes'] / actors.length) * 100);
    document.getElementById('actor-gender-ratio').textContent = `${ratio}% Femmes`;

    renderDoughnutChart('actorGenderChart', Object.keys(genderMap), Object.values(genderMap), [CHART_COLORS.blue, CHART_COLORS.secondary, CHART_COLORS.gray]);
    renderBarChart('actorAgeChart', Object.keys(ageRanges), Object.values(ageRanges), CHART_COLORS.orange);
}

// --- NEW STYLED CHARTS ---

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
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } },
                    ticks: { display: false }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderLineChart(id, labels, data, color) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                borderColor: color,
                backgroundColor: color + '11',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            scales: {
                y: { display: false },
                x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 9 } }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderPolarChart(id, labels, data, colors) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors.map(c => c + 'AA'), borderWidth: 0 }]
        },
        options: {
            scales: { r: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } } },
            plugins: { legend: { position: 'right', labels: { color: '#fff', boxWidth: 12, font: { size: 10 } } } }
        }
    });
}

function renderDoughnutChart(id, labels, data, colors) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    new Chart(ctx, {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderWidth: 0 }] },
        options: {
            cutout: '75%',
            plugins: { legend: { position: 'bottom', labels: { color: '#fff', padding: 20 } } }
        }
    });
}

function renderBarChart(id, labels, data, color) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: color, borderRadius: 8 }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: { grid: { display: false }, ticks: { display: false } },
                y: { grid: { display: false }, ticks: { color: '#fff', font: { weight: '600' } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}
