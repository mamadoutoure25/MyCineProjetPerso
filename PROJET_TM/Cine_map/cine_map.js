// Configuration Leaflet & Map
const MAP_CONFIG = {
    center: [50.5039, 4.4699], // Centre de la Belgique
    zoom: 8,
    maxZoom: 18,
    tilesDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    tilesLight: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> & <a href="https://carto.com/attributions">CARTO</a>'
};

// Variables globales
let map;
let tileLayer;
let allCinemas = [];
let markersMap = new Map();
let userMarker = null;
let userCoords = null;
let provincesSet = new Set();

// Initialisation de la carte Leaflet
function initMap() {
    map = L.map('map', {
        zoomControl: false
    }).setView(MAP_CONFIG.center, MAP_CONFIG.zoom);

    // Controles de zoom repositionnés
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const initialTiles = isLight ? MAP_CONFIG.tilesLight : MAP_CONFIG.tilesDark;

    tileLayer = L.tileLayer(initialTiles, {
        attribution: MAP_CONFIG.attribution,
        maxZoom: MAP_CONFIG.maxZoom
    }).addTo(map);

    // Écouter le changement de thème
    const observer = new MutationObserver(() => {
        const light = document.documentElement.getAttribute('data-theme') === 'light';
        tileLayer.setUrl(light ? MAP_CONFIG.tilesLight : MAP_CONFIG.tilesDark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

// Chargement des cinémas depuis data.json
async function loadCinemas() {
    try {
        const loader = document.getElementById('map-loading');
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Erreur réseau');

        const data = await response.json();
        allCinemas = data.results || [];

        // Extraire les provinces
        allCinemas.forEach(c => {
            if (c.province) provincesSet.add(c.province);
        });

        // Mettre à jour les compteurs
        const countTotal = document.getElementById('count-total');
        const countProv = document.getElementById('count-provinces');
        if (countTotal) countTotal.textContent = allCinemas.length;
        if (countProv) countProv.textContent = provincesSet.size;

        populateProvinceFilter();
        displayCinemas(allCinemas);

        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 400);
        }
    } catch (e) {
        console.error("Erreur chargement cinémas:", e);
        const resDiv = document.getElementById('results');
        if (resDiv) {
            resDiv.innerHTML = `<div class="p-4 text-center text-danger fw-bold">Impossible de charger les données des cinémas.</div>`;
        }
    }
}

// Création d'icônes Leaflet DivIcon
function createCustomDivIcon(category, isUser = false) {
    if (isUser) {
        return L.divIcon({
            className: 'user-marker-pin',
            html: `<div class="pin-user-pulse"><i class="ph-fill ph-navigation-arrow"></i></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
        });
    }

    let colorClass = 'pin-cinema';
    let iconHtml = '<i class="ph-fill ph-film-strip"></i>';
    const catLower = (category || '').toLowerCase();

    if (catLower.includes('ciné-club')) {
        colorClass = 'pin-club';
        iconHtml = '<i class="ph-fill ph-film-reel"></i>';
    } else if (catLower.includes('culturel')) {
        colorClass = 'pin-culture';
        iconHtml = '<i class="ph-fill ph-buildings"></i>';
    } else if (catLower.includes('multiplexe')) {
        colorClass = 'pin-multiplex';
        iconHtml = '<i class="ph-fill ph-popcorn"></i>';
    }

    return L.divIcon({
        className: `custom-map-pin ${colorClass}`,
        html: `<div class="pin-badge">${iconHtml}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34]
    });
}

// Génération du contenu HTML de la popup Leaflet
function createPopupContent(cinema) {
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cinema.geolocalisation.lat},${cinema.geolocalisation.lon}`;
    return `
        <div class="p-2">
            <span class="popup-badge">${cinema.categorie || 'Cinéma'}</span>
            <div class="popup-title">${cinema.denomination_du_lieu}</div>
            <div class="popup-address"><i class="ph-fill ph-map-pin text-accent me-1"></i> ${cinema.adresse}, ${cinema.code_postal} ${cinema.ville}</div>
            <div class="popup-province"><i class="ph-fill ph-buildings me-1"></i> Province : <strong>${cinema.province || 'N/A'}</strong></div>
            <div class="mt-3 d-flex gap-2">
                <a href="${gmapsUrl}" target="_blank" class="btn btn-sm btn-accent rounded-pill px-3 py-1 text-decoration-none fw-bold small">
                    <i class="ph-fill ph-navigation-arrow me-1"></i> Itinéraire
                </a>
                ${cinema.site_web ? `<a href="${cinema.site_web}" target="_blank" class="btn btn-sm btn-outline-light rounded-pill px-3 py-1 text-decoration-none fw-bold small"><i class="ph-fill ph-globe me-1"></i> Site</a>` : ''}
            </div>
        </div>
    `;
}

// Affichage des marqueurs et de la liste
function displayCinemas(cinemas) {
    // Effacer les marqueurs existants
    markersMap.forEach(marker => map.removeLayer(marker));
    markersMap.clear();

    const resultsDiv = document.getElementById('results');
    const countSpan = document.getElementById('results-count');
    if (countSpan) countSpan.textContent = cinemas.length;
    if (!resultsDiv) return;

    resultsDiv.innerHTML = '';

    if (!cinemas.length) {
        resultsDiv.innerHTML = `
            <div class="text-center p-5 opacity-75 border border-secondary border-opacity-25 rounded-4 bg-theme">
                <i class="ph ph-film-slash fs-1 text-accent mb-2"></i>
                <div class="fw-bold">Aucun cinéma trouvé</div>
                <div class="x-small text-muted mt-1">Essayez de modifier vos termes de recherche ou de réinitialiser les filtres.</div>
            </div>
        `;
        return;
    }

    const boundsGroup = [];

    cinemas.forEach(cinema => {
        const { lat, lon } = cinema.geolocalisation;
        const icon = createCustomDivIcon(cinema.categorie);
        const marker = L.marker([lat, lon], { icon }).addTo(map);

        marker.bindPopup(createPopupContent(cinema));
        markersMap.set(cinema.denomination_du_lieu, marker);
        boundsGroup.push([lat, lon]);

        // Créer la carte de liste à droite
        const card = createCinemaCard(cinema);
        resultsDiv.appendChild(card);
    });

    if (boundsGroup.length > 0 && !userCoords) {
        map.fitBounds(boundsGroup, { padding: [40, 40] });
    }
}

// Création d'une carte dans la colonne de droite
function createCinemaCard(cinema) {
    const card = document.createElement('div');
    card.className = 'cinema-item-card';

    let distanceHTML = '';
    if (cinema.distance !== undefined) {
        distanceHTML = `<span class="distance-badge ms-auto"><i class="ph-fill ph-path me-1"></i> ${cinema.distance.toFixed(1)} km</span>`;
    }

    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cinema.geolocalisation.lat},${cinema.geolocalisation.lon}`;

    card.innerHTML = `
        <div class="d-flex align-items-center mb-1">
            <span class="cinema-card-badge">${cinema.categorie || 'Cinéma'}</span>
            ${distanceHTML}
        </div>
        <div class="cinema-card-name">${cinema.denomination_du_lieu}</div>
        <div class="cinema-meta-info">
            <div><i class="ph-fill ph-map-pin me-1 text-accent"></i> ${cinema.adresse}, ${cinema.code_postal} ${cinema.ville}</div>
            <div><i class="ph-fill ph-buildings me-1 opacity-50"></i> ${cinema.province || 'Belgique'} • <em>${cinema.organisateur_exploitant || 'Exploitant privé'}</em></div>
        </div>
        <div class="d-flex gap-2 mt-3 pt-2 border-top border-secondary border-opacity-25 align-items-center">
            <button class="btn btn-sm btn-outline-accent rounded-pill px-3 py-1 fw-bold text-accent btn-focus-map">
                <i class="ph-fill ph-crosshair me-1"></i> Voir sur la carte
            </button>
            <a href="${gmapsUrl}" target="_blank" class="btn btn-sm btn-outline-light rounded-pill px-3 py-1 fw-bold text-theme opacity-75 ms-auto">
                <i class="ph-fill ph-navigation-arrow me-1"></i> Itinéraire
            </a>
            ${cinema.site_web ? `<a href="${cinema.site_web}" target="_blank" class="btn btn-sm btn-outline-light rounded-pill px-3 py-1 fw-bold text-theme opacity-75"><i class="ph-fill ph-globe me-1"></i> Web</a>` : ''}
        </div>
    `;

    // Interaction survol : met en évidence le marqueur Leaflet
    card.addEventListener('mouseenter', () => {
        const marker = markersMap.get(cinema.denomination_du_lieu);
        if (marker) {
            const el = marker.getElement();
            if (el) el.classList.add('active-pin');
        }
    });

    card.addEventListener('mouseleave', () => {
        const marker = markersMap.get(cinema.denomination_du_lieu);
        if (marker) {
            const el = marker.getElement();
            if (el) el.classList.remove('active-pin');
        }
    });

    // Clic sur le bouton ou la carte : centrer la carte et ouvrir le popup
    const focusBtn = card.querySelector('.btn-focus-map');
    const handleCardClick = (e) => {
        if (e.target.closest('a')) return;
        const marker = markersMap.get(cinema.denomination_du_lieu);
        if (marker) {
            map.flyTo([cinema.geolocalisation.lat, cinema.geolocalisation.lon], 15, { duration: 1.2 });
            marker.openPopup();
        }
    };

    if (focusBtn) focusBtn.addEventListener('click', handleCardClick);
    card.addEventListener('click', handleCardClick);

    return card;
}

// Remplissage du sélecteur de provinces
function populateProvinceFilter() {
    const select = document.getElementById('province-filter');
    if (!select) return;

    const sortedProvinces = Array.from(provincesSet).sort();
    sortedProvinces.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        select.appendChild(opt);
    });
}

// Filtrage combiné (recherche, province, catégorie)
function filterCinemas() {
    const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    const provinceVal = document.getElementById('province-filter')?.value || 'all';
    const categoryVal = document.getElementById('category-filter')?.value || 'all';

    const filtered = allCinemas.filter(c => {
        const matchSearch = !searchVal || 
            c.denomination_du_lieu.toLowerCase().includes(searchVal) ||
            c.ville.toLowerCase().includes(searchVal) ||
            c.adresse.toLowerCase().includes(searchVal) ||
            (c.organisateur_exploitant && c.organisateur_exploitant.toLowerCase().includes(searchVal));

        const matchProvince = provinceVal === 'all' || c.province === provinceVal;
        const matchCategory = categoryVal === 'all' || (c.categorie && c.categorie.toLowerCase().includes(categoryVal));

        return matchSearch && matchProvince && matchCategory;
    });

    displayCinemas(filtered);
}

// Formule de Haversine pour calculer la distance en km
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Me Géolocaliser
function geolocateUser() {
    const btn = document.getElementById('btn-geolocate');
    if (!navigator.geolocation) {
        alert("La géolocalisation n'est pas supportée par votre navigateur.");
        return;
    }

    if (btn) btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Recherche...`;

    navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        userCoords = [latitude, longitude];

        // Placer ou déplacer le marqueur utilisateur
        if (userMarker) {
            userMarker.setLatLng(userCoords);
        } else {
            const userIcon = createCustomDivIcon(null, true);
            userMarker = L.marker(userCoords, { icon: userIcon }).addTo(map);
            userMarker.bindPopup('<b class="text-success">Vous êtes ici !</b>').openPopup();
        }

        map.flyTo(userCoords, 11, { duration: 1.5 });

        // Calculer les distances pour tous les cinémas et les trier
        allCinemas.forEach(c => {
            c.distance = calculateDistance(latitude, longitude, c.geolocalisation.lat, c.geolocalisation.lon);
        });

        allCinemas.sort((a, b) => a.distance - b.distance);

        const distInfo = document.getElementById('distance-info');
        if (distInfo) distInfo.classList.remove('d-none');

        displayCinemas(allCinemas);

        if (btn) btn.innerHTML = `<i class="ph-fill ph-check-circle me-1 text-success"></i> Géolocalisé`;
    }, (err) => {
        console.error("Erreur géolocalisation:", err);
        alert("Impossible d'obtenir votre position actuelle.");
        if (btn) btn.innerHTML = `<i class="ph-fill ph-crosshair me-1 text-success"></i> Me géolocaliser`;
    });
}

// Réinitialisation des filtres
function resetFilters() {
    const searchInput = document.getElementById('search-input');
    const provinceFilter = document.getElementById('province-filter');
    const categoryFilter = document.getElementById('category-filter');

    if (searchInput) searchInput.value = '';
    if (provinceFilter) provinceFilter.value = 'all';
    if (categoryFilter) categoryFilter.value = 'all';

    displayCinemas(allCinemas);
    map.flyTo(MAP_CONFIG.center, MAP_CONFIG.zoom, { duration: 1 });
}

// Initialisation de l'application au chargement
function initApp() {
    initMap();
    loadCinemas();

    // Événements filtres
    document.getElementById('search-input')?.addEventListener('input', filterCinemas);
    document.getElementById('province-filter')?.addEventListener('change', filterCinemas);
    document.getElementById('category-filter')?.addEventListener('change', filterCinemas);
    document.getElementById('reset-btn')?.addEventListener('click', resetFilters);
    document.getElementById('btn-geolocate')?.addEventListener('click', geolocateUser);
}

document.addEventListener('DOMContentLoaded', initApp);