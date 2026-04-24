// actor-stats.js (Dashboard Global)

const CONFIG = {
    URL_BASE: "https://api.themoviedb.org/3",
    CLE_API: "04c35731a5ee918f014970082a0088b1",
    LANG: "fr-FR"
};

const CHART_COLORS = {
    primary: '#f59e0b', secondary: '#8b5cf6', accent: '#ec4899',
    blue: '#3b82f6', teal: '#2dd4bf', pink: '#f43f5e',
    gray: '#64748b', white: '#ffffff'
};

const GENRE_COLORS = [
    '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', 
    '#ff9f40', '#4dc9f6', '#f67019', '#f53794', '#537bc4', 
    '#acc236', '#166a8f', '#00a950', '#58595b', '#8549ba',
    '#eb4d4b', '#22a6b3', '#f0932b', '#6ab04c', '#be2edd'
];

document.addEventListener("DOMContentLoaded", async () => {
    const auth = JSON.parse(sessionStorage.getItem("auth"));
    if (!auth) {
        window.location.href = "../connexion/connexion.html";
        return;
    }

    try {
        const loadingScreen = document.getElementById("loading-screen");
        
        // Charger toutes les données en parallèle
        const [movies, series, actors] = await Promise.all([
            chargerFavoris(auth.userId, 'movie'),
            chargerFavoris(auth.userId, 'tv'),
            chargerActeursFavoris(auth.userId)
        ]);

        // Masquer chargement
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.classList.add('d-none'), 500);

        // Initialiser les stats
        initMovieStats(movies);
        initTVStats(series);
        initActorStats(actors);

    } catch (e) {
        console.error("Erreur stats:", e);
    }
});

// --- CHARGEMENT ---

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
            const r = await fetch(`${CONFIG.URL_BASE}/person/${a.id}?api_key=${CONFIG.CLE_API}&language=${CONFIG.LANG}`);
            return r.ok ? await r.json() : null;
        })
    );
    return details.filter(d => d !== null);
}

// --- FILMS ---

function initMovieStats(movies) {
    document.getElementById('movie-count').textContent = movies.length;
    if (movies.length === 0) return;

    // Note moyenne
    const avgRating = movies.reduce((acc, m) => acc + m.vote_average, 0) / movies.length;
    document.getElementById('movie-avg-rating').textContent = avgRating.toFixed(1);

    // Temps total
    const totalMinutes = movies.reduce((acc, m) => acc + (m.runtime || 0), 0);
    document.getElementById('movie-total-runtime').textContent = Math.round(totalMinutes / 60) + "h";

    // Genres
    const genreMap = {};
    movies.forEach(m => {
        m.genres.forEach(g => {
            genreMap[g.name] = (genreMap[g.name] || 0) + 1;
        });
    });

    renderPieChart('movieGenreChart', Object.keys(genreMap), Object.values(genreMap), GENRE_COLORS);

    // Années
    const yearMap = {};
    movies.forEach(m => {
        if (m.release_date) {
            const decade = Math.floor(new Date(m.release_date).getFullYear() / 10) * 10;
            const label = decade + "s";
            yearMap[label] = (yearMap[label] || 0) + 1;
        }
    });
    renderBarChart('movieYearChart', Object.keys(yearMap).sort(), Object.values(yearMap), CHART_COLORS.primary);
}

// --- SERIES ---

function initTVStats(series) {
    document.getElementById('tv-count').textContent = series.length;
    if (series.length === 0) return;

    // Moyenne épisodes
    const avgEps = series.reduce((acc, s) => acc + (s.number_of_episodes || 0), 0) / series.length;
    document.getElementById('tv-avg-episodes').textContent = Math.round(avgEps);

    // Genre dominant
    const genreMap = {};
    series.forEach(s => {
        s.genres.forEach(g => genreMap[g.name] = (genreMap[g.name] || 0) + 1);
    });
    const mostCommon = Object.entries(genreMap).sort((a,b) => b[1] - a[1])[0]?.[0] || "-";
    document.getElementById('tv-most-genre').textContent = mostCommon;

    renderPieChart('tvGenreChart', Object.keys(genreMap), Object.values(genreMap), GENRE_COLORS);

    // Statut
    const statusMap = {};
    series.forEach(s => statusMap[s.status] = (statusMap[s.status] || 0) + 1);
    renderBarChart('tvStatusChart', Object.keys(statusMap), Object.values(statusMap), CHART_COLORS.secondary);
}

// --- ACTEURS ---

function initActorStats(actors) {
    document.getElementById('actor-count').textContent = actors.length;
    if (actors.length === 0) return;

    // Âge Moyen
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

    renderPieChart('actorGenderChart', Object.keys(genderMap), Object.values(genderMap), [CHART_COLORS.blue, CHART_COLORS.accent, CHART_COLORS.gray]);
    renderBarChart('actorAgeChart', Object.keys(ageRanges), Object.values(ageRanges), CHART_COLORS.accent);
}

// --- CHARTS HELPERS ---

function renderPieChart(id, labels, data, colors) {
    new Chart(document.getElementById(id), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
        }
    });
}

function renderBarChart(id, labels, data, color) {
    new Chart(document.getElementById(id), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: color, borderRadius: 5 }]
        },
        options: {
            scales: {
                y: { beginAtZero: true, ticks: { color: '#fff', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { ticks: { color: '#fff' }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}