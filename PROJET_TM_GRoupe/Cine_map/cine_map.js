// Configuration de l'application
const config = {
    map: {
        center: [50.5039, 4.4699], // Centre de la Belgique
        zoom: 8,
        maxZoom: 18,
        tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    icons: {
        cinema: {
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/3163/3163478.png', // Nouvelle icône pour cinéma
            iconSize: [32, 32]
        },
        club: {
            iconUrl: 'https://example.com/icons/club.png', // Nouvelle icône pour ciné-club
            iconSize: [32, 32]
        },
        culture: {
            iconUrl: 'https://example.com/icons/culture.png', // Nouvelle icône pour centre culturel
            iconSize: [32, 32]
        }
    }
};

// Initialisation des variables globales
let map;
let cinemaMarkers = [];
let allCinemas = [];
let provinces = new Set();

// Initialisation de la carte
function initMap() {
    map = L.map('map').setView(config.map.center, config.map.zoom);

    L.tileLayer(config.map.tileLayer, {
        attribution: config.map.attribution,
        maxZoom: config.map.maxZoom
    }).addTo(map);
}

// Création des icônes personnalisées
function createCustomIcons() {
    return {
        cinema: L.icon({
            ...config.icons.cinema,
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        club: L.icon({
            ...config.icons.club,
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        culture: L.icon({
            ...config.icons.culture,
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        })
    };
}

// Chargement des données des cinémas
async function loadCinemas() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Erreur de chargement des données');

        const data = await response.json();
        allCinemas = data.results;

        // Extraire les provinces uniques
        allCinemas.forEach(cinema => {
            if (cinema.province) provinces.add(cinema.province);
        });

        updateProvinceFilter();
        displayCinemas(allCinemas);
        updateFooterDate();
    } catch (error) {
        console.error("Erreur:", error);
        document.getElementById('results').innerHTML = `
            <div class="no-results">
                <p>Erreur de chargement des données. Veuillez réessayer plus tard.</p>
            </div>
        `;
    }
}

// Mise à jour du filtre des provinces
function updateProvinceFilter() {
    const provinceFilter = document.getElementById('province-filter');

    // Trier les provinces par ordre alphabétique
    const sortedProvinces = Array.from(provinces).sort();

    // Ajouter les options
    sortedProvinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        provinceFilter.appendChild(option);
    });
}

// Affichage des cinémas
function displayCinemas(cinemas) {
    // Réinitialiser
    clearMarkers();
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (cinemas.length === 0) {
        resultsDiv.innerHTML = `
            <div class="no-results">
                <p>Aucun cinéma trouvé. Essayez de modifier vos critères de recherche.</p>
            </div>
        `;
        return;
    }

    const icons = createCustomIcons();
    const markersGroup = [];

    // Afficher chaque cinéma
    cinemas.forEach(cinema => {
        // Créer le marqueur
        const marker = createMarker(cinema, icons);
        markersGroup.push(marker);
        cinemaMarkers.push(marker);

        // Créer la carte HTML
        resultsDiv.appendChild(createCinemaCard(cinema));
    });

    // Ajuster la vue de la carte
    if (markersGroup.length > 0) {
        const group = new L.featureGroup(markersGroup);
        map.fitBounds(group.getBounds().pad(0.2));
    }
}

// Création d'un marqueur
function createMarker(cinema, icons) {
    const { lat, lon } = cinema.geolocalisation;
    const category = cinema.categorie.toLowerCase();

    // Sélectionner l'icône
    let icon;
    if (category.includes('ciné-club')) icon = icons.club;
    else if (category.includes('culturel')) icon = icons.culture;
    else icon = icons.cinema;

    // Créer le marqueur
    const marker = L.marker([lat, lon], { icon }).addTo(map);

    // Créer le popup
    const popupContent = `
        <b>${cinema.denomination_du_lieu}</b><br>
        <i class="fas fa-map-marker-alt"></i> ${cinema.adresse}, ${cinema.code_postal} ${cinema.ville}<br>
        ${cinema.site_web ? `<a href="${cinema.site_web}" target="_blank"><i class="fas fa-globe"></i> Site web</a><br>` : ''}
        ${cinema.e_mail_de_contact ? `<i class="fas fa-envelope"></i> ${cinema.e_mail_de_contact}` : ''}
    `;

    marker.bindPopup(popupContent);
    return marker;
}

// Création d'une carte de cinéma
function createCinemaCard(cinema) {
    const card = document.createElement('div');
    const categoryClass = getCategoryClass(cinema.categorie);

    card.className = `cinema-card ${categoryClass}`;
    card.innerHTML = `
        <span class="category-tag">${cinema.categorie}</span>
        <h3>${cinema.denomination_du_lieu}</h3>
        <div class="cinema-info">
            <p><i class="fas fa-map-marker-alt"></i> ${cinema.adresse}, ${cinema.code_postal} ${cinema.ville}</p>
            <p><i class="fas fa-landmark"></i> ${cinema.province || 'Non spécifié'}</p>
            <p><i class="fas fa-building"></i> ${cinema.organisateur_exploitant || 'Non spécifié'}</p>
            ${cinema.site_web ? `<p><i class="fas fa-globe"></i> <a href="${cinema.site_web}" target="_blank">${cinema.site_web}</a></p>` : ''}
            ${cinema.e_mail_de_contact ? `<p><i class="fas fa-envelope"></i> ${cinema.e_mail_de_contact}</p>` : ''}
        </div>
    `;

    // Ajouter un événement pour centrer la carte sur le cinéma au clic
    card.addEventListener('click', () => {
        map.setView([cinema.geolocalisation.lat, cinema.geolocalisation.lon], 15);
    });

    return card;
}

// Obtenir la classe CSS pour la catégorie
function getCategoryClass(category) {
    if (!category) return 'cinema';

    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('ciné-club')) return 'ciné-club';
    if (lowerCategory.includes('culturel')) return 'centre-culturel';
    return 'cinema';
}

// Filtrer les cinémas
function filterCinemas() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const province = document.getElementById('province-filter').value;
    const category = document.getElementById('category-filter').value;

    const filtered = allCinemas.filter(cinema => {
        // Filtre de recherche
        const matchesSearch =
            cinema.denomination_du_lieu.toLowerCase().includes(searchTerm) ||
            cinema.ville.toLowerCase().includes(searchTerm) ||
            cinema.adresse.toLowerCase().includes(searchTerm) ||
            (cinema.organisateur_exploitant && cinema.organisateur_exploitant.toLowerCase().includes(searchTerm));

        // Filtre par province
        const matchesProvince = province === 'all' || cinema.province === province;

        // Filtre par catégorie
        const matchesCategory = category === 'all' ||
            cinema.categorie.toLowerCase().includes(category);

        return matchesSearch && matchesProvince && matchesCategory;
    });

    displayCinemas(filtered);
}

// Réinitialiser les filtres
function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('province-filter').value = 'all';
    document.getElementById('category-filter').value = 'all';
    displayCinemas(allCinemas);
}

// Effacer tous les marqueurs
function clearMarkers() {
    cinemaMarkers.forEach(marker => map.removeLayer(marker));
    cinemaMarkers = [];
}

// Mettre à jour la date dans le footer
function updateFooterDate() {
    const dateElement = document.getElementById('update-date');
    const today = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('fr-FR', options);
}

// Initialisation de l'application
function initApp() {
    initMap();
    loadCinemas();

    // Événements
    document.getElementById('search-btn').addEventListener('click', filterCinemas);
    document.getElementById('reset-btn').addEventListener('click', resetFilters);
    document.getElementById('province-filter').addEventListener('change', filterCinemas);
    document.getElementById('category-filter').addEventListener('change', filterCinemas);

    // Recherche lors de la frappe avec délai
    let searchTimer;
    document.getElementById('search-input').addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(filterCinemas, 300);
    });
}

// Démarrer l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', initApp);