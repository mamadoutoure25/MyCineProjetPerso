document.addEventListener('DOMContentLoaded', () => {
    // Charger les genres et acteurs disponibles
    fetchGenres();
    fetchActeurs();

    // Validation et soumission du formulaire
    document.getElementById('filmForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const tmdbId = document.getElementById('tmdb_id').value;
        const titre = document.getElementById('titre').value;
        const alertContainer = document.getElementById('alert-container');

        // Validation côté client
        if (!tmdbId || isNaN(tmdbId)) {
            alertContainer.innerHTML = `<div class="alert alert-danger">L'ID TMDB est obligatoire et doit être un nombre.</div>`;
            return;
        }
        if (!titre.trim()) {
            alertContainer.innerHTML = `<div class="alert alert-danger">Le titre est obligatoire.</div>`;
            return;
        }

        const form = this;
        const formData = new FormData(form);

        fetch('ajouterFilms.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                alertContainer.innerHTML = '';
                if (data.success) {
                    alertContainer.innerHTML = `<div class="alert alert-success">${data.success}</div>`;
                    form.reset();
                } else if (data.errors) {
                    const errors = data.errors.map(err => `<li>${err}</li>`).join('');
                    alertContainer.innerHTML = `<div class="alert alert-danger"><ul>${errors}</ul></div>`;
                }
            })
            .catch(error => {
                console.error('Erreur AJAX:', error);
                alertContainer.innerHTML = `<div class="alert alert-danger">Erreur réseau: ${error.message}</div>`;
            });
    });
});

// Charger les genres depuis la base de données
function fetchGenres() {
    fetch('fetchGenres.php')
        .then(response => response.json())
        .then(data => {
            const genreSelect = document.getElementById('genres');
            if (data.genres) {
                genreSelect.innerHTML = data.genres.map(genre =>
                    `<option value="${genre.tmdb_id}">${genre.nom}</option>`
                ).join('');
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des genres:', error);
            document.getElementById('alert-container').innerHTML =
                `<div class="alert alert-danger">Erreur lors du chargement des genres: ${error.message}</div>`;
        });
}

// Charger les acteurs depuis la base de données
function fetchActeurs() {
    fetch('fetchActeurs.php')
        .then(response => response.json())
        .then(data => {
            const acteurSelect = document.getElementById('acteurs');
            if (data.acteurs) {
                acteurSelect.innerHTML = data.acteurs.map(acteur =>
                    `<option value="${acteur.tmdb_id}">${acteur.nom}</option>`
                ).join('');
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des acteurs:', error);
            document.getElementById('alert-container').innerHTML =
                `<div class="alert alert-danger">Erreur lors du chargement des acteurs: ${error.message}</div>`;
        });
}

// Récupération des données TMDB
function fetchTMDBData() {
    const tmdbId = document.getElementById('tmdb_id').value;
    const alertContainer = document.getElementById('alert-container');

    if (!tmdbId) {
        alertContainer.innerHTML = `<div class="alert alert-warning">Veuillez entrer un ID TMDB.</div>`;
        return;
    }

    fetch(`fetchTMDB.php?tmdb_id=${tmdbId}`)
        .then(response => response.json())
        .then(data => {
            alertContainer.innerHTML = '';
            if (data.error) {
                alertContainer.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
                return;
            }
            if (data.status_code === 34) {
                alertContainer.innerHTML = `<div class="alert alert-danger">Film non trouvé sur TMDB.</div>`;
                return;
            }

            document.getElementById('titre').value = data.title || '';
            document.getElementById('titre_original').value = data.original_title || '';
            document.getElementById('description').value = data.overview || '';
            document.getElementById('synopsis').value = data.overview || '';
            document.getElementById('date_sortie').value = data.release_date || '';
            document.getElementById('duree').value = data.runtime || '';
            document.getElementById('annee').value = data.release_date ? new Date(data.release_date).getFullYear() : '';
            document.getElementById('poster_path').value = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '';
            document.getElementById('backdrop_path').value = data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '';
            document.getElementById('note_moyenne').value = data.vote_average || '';
            document.getElementById('realisateur').value = data.credits?.crew?.find(person => person.job === 'Director')?.name || '';
            document.getElementById('tagline').value = data.tagline || '';
            document.getElementById('status').value = data.status || 'Released';
            document.getElementById('langue_originale').value = data.original_language || '';
            document.getElementById('popularite').value = data.popularity || '';
            document.getElementById('homepage').value = data.homepage || '';
            document.getElementById('imdb_id').value = data.imdb_id || '';
            document.getElementById('video').value = data.video ? '1' : '0';

            // Sélectionner la bande-annonce
            const trailer = data.videos?.results?.find(video => video.type === 'Trailer' && video.site === 'YouTube');
            document.getElementById('trailer_url').value = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '';

            // Sélectionner les genres
            const genreSelect = document.getElementById('genres');
            Array.from(genreSelect.options).forEach(option => {
                option.selected = data.genres?.some(genre => genre.id === parseInt(option.value));
            });

            // Sélectionner les acteurs (limité aux 5 premiers pour simplifier)
            const acteurSelect = document.getElementById('acteurs');
            const acteurs = data.credits?.cast?.slice(0, 5) || [];
            Array.from(acteurSelect.options).forEach(option => {
                option.selected = acteurs.some(acteur => acteur.id === parseInt(option.value));
            });

            alertContainer.innerHTML = `<div class="alert alert-success">Données TMDB récupérées avec succès.</div>`;
        })
        .catch(error => {
            alertContainer.innerHTML = `<div class="alert alert-danger">Erreur TMDB: ${error.message}</div>`;
        });
}