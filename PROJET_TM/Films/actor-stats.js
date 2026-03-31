// actor-stats.js

const CONFIG = {
    URL_BASE: "https://api.themoviedb.org/3",
    CLE_API: "04c35731a5ee918f014970082a0088b1"
};

document.addEventListener("DOMContentLoaded", async () => {
    const auth = JSON.parse(sessionStorage.getItem("auth"));
    if (!auth) {
        window.location.href = "../connexion/connexion.html";
        return;
    }

    const actors = await chargerActeursFavoris(auth.userId);
    if (!actors || actors.length === 0) {
        document.getElementById("stats-content").classList.add("d-none");
        document.getElementById("no-data-message").classList.remove("d-none");
        return;
    }

    const stats = analyserDonnees(actors);
    afficherStats(stats);
    genererGraphiques(stats);
});

async function chargerActeursFavoris(userId) {
    let acteursList = [];
    
    // 1. Charger depuis la BD
    try {
        const response = await fetch(`favorite-actors.php?user_id=${userId}`);
        if (response.ok) {
            const donnees = await response.json();
            if (donnees.success && donnees.favorite_actors) {
                acteursList = donnees.favorite_actors.map(actor => ({
                    id: actor.tmdb_id
                }));
            }
        }
    } catch (e) {
        console.warn("Erreur chargement BD:", e);
    }

    // 2. Si vide, charger depuis LocalStorage
    if (acteursList.length === 0) {
        const stored = localStorage.getItem('actor_favorites');
        acteursList = stored ? JSON.parse(stored) : [];
    }

    // 3. Récupérer les détails complets (genre et date de naissance)
    const total = acteursList.length;
    document.getElementById("total-actors").textContent = total;

    const acteursDetails = await Promise.all(
        acteursList.map(async (a) => {
            try {
                const res = await fetch(`${CONFIG.URL_BASE}/person/${a.id}?api_key=${CONFIG.CLE_API}&language=fr-FR`);
                return res.ok ? await res.json() : null;
            } catch (e) { return null; }
        })
    );

    return acteursDetails.filter(a => a !== null);
}

function analyserDonnees(actors) {
    const stats = {
        genres: { homme: 0, femme: 0, autre: 0 },
        ages: {
            "Moins de 30": 0,
            "30 - 45": 0,
            "45 - 60": 0,
            "Plus de 60": 0,
            "Inconnu": 0
        },
        totalAge: 0,
        countWithAge: 0
    };

    actors.forEach(a => {
        // Genre (1 = Femme, 2 = Homme, 0/3 = Autre)
        if (a.gender === 1) stats.genres.femme++;
        else if (a.gender === 2) stats.genres.homme++;
        else stats.genres.autre++;

        // Âge
        if (a.birthday) {
            const birthDate = new Date(a.birthday);
            const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
            
            stats.totalAge += age;
            stats.countWithAge++;

            if (age < 30) stats.ages["Moins de 30"]++;
            else if (age <= 45) stats.ages["30 - 45"]++;
            else if (age <= 60) stats.ages["45 - 60"]++;
            else stats.ages["Plus de 60"]++;
        } else {
            stats.ages["Inconnu"]++;
        }
    });

    return stats;
}

function afficherStats(stats) {
    // Âge moyen
    const avg = stats.countWithAge > 0 ? Math.round(stats.totalAge / stats.countWithAge) : 0;
    document.getElementById("avg-age").textContent = `${avg} ans`;

    // Majorité
    let majorite = "Égalité";
    if (stats.genres.homme > stats.genres.femme) majorite = "Hommes";
    else if (stats.genres.femme > stats.genres.homme) majorite = "Femmes";
    document.getElementById("most-common-gender").textContent = majorite;
}

function genererGraphiques(stats) {
    // Couleurs du thème
    const colors = {
        primary: '#f59e0b',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        blue: '#3b82f6',
        teal: '#2dd4bf',
        text: '#ffffff'
    };

    // Graphique Genre
    new Chart(document.getElementById('genderChart'), {
        type: 'doughnut',
        data: {
            labels: ['Hommes', 'Femmes', 'Autres'],
            datasets: [{
                data: [stats.genres.homme, stats.genres.femme, stats.genres.autre],
                backgroundColor: [colors.blue, colors.accent, '#64748b'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: colors.text, padding: 20 }
                }
            }
        }
    });

    // Graphique Âge
    new Chart(document.getElementById('ageChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(stats.ages),
            datasets: [{
                label: 'Nombre d\'acteurs',
                data: Object.values(stats.ages),
                backgroundColor: colors.primary,
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: colors.text, stepSize: 1 },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: colors.text },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}