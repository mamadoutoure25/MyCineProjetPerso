document.addEventListener('DOMContentLoaded', () => {
    // Charger les films, genres et acteurs disponibles
    fetchFilms();
    fetchGenres();
    fetchActeurs();

    // Écouter le changement de sélection de film
    document.getElementById('film_select').addEventListener('change', function() {
        if (this.value) {
            loadFilmData(this.value);
        }
    });

    // Gérer le bouton de récupération TMDB
    document.getElementById('fetchTMDBBtn').addEventListener('click', fetchTMDBData);

    // Gérer le bouton de réinitialisation
    document.getElementById('resetBtn').addEventListener('click', () => {
        document.getElementById('filmForm').reset();
        document.getElementById('alert-container').innerHTML = '';
    });

    // Validation et soumission du formulaire
    document.getElementById('filmForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const filmId = document.getElementById('film_select').value;
        const tmdbId = document.getElementById('tmdb_id').value;
        const titre = document.getElementById('titre').value;
        const alertContainer = document.getElementById('alert-container');

        // Validation côté client
        if (!filmId) {
            alertContainer.innerHTML = `<div class="alert alert-danger">Veuillez sélectionner un film à modifier.</div>`;
            return;
        }
        if (!tmdbId || isNaN(tmdbId)) {
            alertContainer.innerHTML = `<div class="alert alert-danger">L'ID TMDB est obligatoire et doit être un nombre.</div>`;
            return;
        }
        if (!titre.trim()) {
            alertContainer.innerHTML = `<div class="alert alert-danger">Le titre est obligatoire.</div>`;
            return;
        }

        const formData = new FormData(this);
        formData.append('film_id', filmId);

        fetch('modifierFilms.php', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
                }
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new TypeError("La réponse n'est pas du JSON");
                }
                return response.json();
            })
            .then(data => {
                alertContainer.innerHTML = '';
                if (data.success) {
                    alertContainer.innerHTML = `<div class="alert alert-success">${data.success}</div>`;
                    fetchFilms(); // Recharger la liste des films
                } else if (data.errors) {
                    const errors = data.errors.map(err => `<li>${err}</li>`).join('');
                    alertContainer.innerHTML = `<div class="alert alert-danger"><ul>${errors}</ul></div>`;
                } else {
                    alertContainer.innerHTML = `<div class="alert alert-danger">Erreur inconnue lors de la soumission.</div>`;
                }
            })
            .catch(error => {
                console.error('Erreur AJAX:', error);
                alertContainer.innerHTML = `<div class="alert alert-danger">Erreur réseau: ${error.message}</div>`;
            });
    });
});

// Charger la liste des films
function fetchFilms() {
    fetch('fetchFilms.php')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new TypeError("La réponse n'est pas du JSON");
            }
            return response.json();
        })
        .then(data => {
            const filmSelect = document.getElementById('film_select');
            if (data.films) {
                filmSelect.innerHTML = '<option value="">Choisissez un film...</option>' +
                    data.films.map(film =>
                        `<option value="${film.id}">${film.titre} (${film.annee})</option>`
                    ).join('');
            } else if (data.error) {
                throw new Error(data.error);
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des films:', error);
            document.getElementById('alert-container').innerHTML =
                `<div class="alert alert-danger">Erreur lors du chargement des films: ${error.message}</div>`;
        });
}

// Charger les données d'un film spécifique
function loadFilmData(filmId) {
    fetch(`modifierFilms.php?id=${filmId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new TypeError("La réponse n'est pas du JSON");
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                document.getElementById('alert-container').innerHTML =
                    `<div class="alert alert-danger">${data.error}</div>`;
                return;
            }

            // Remplir le formulaire avec les données du film
            document.getElementById('tmdb_id').value = data.tmdb_id || '';
            document.getElementById('titre').value = data.titre || '';
            document.getElementById('titre_original').value = data.titre_original || '';
            document.getElementById('description').value = data.description || '';
            document.getElementById('synopsis').value = data.synopsis || '';
            document.getElementById('date_sortie').value = data.date_sortie || '';
            document.getElementById('duree').value = data.duree || '';
            document.getElementById('annee').value = data.annee || '';
            document.getElementById('poster_path').value = data.poster_path || '';
            document.getElementById('backdrop_path').value = data.backdrop_path || '';
            document.getElementById('note_moyenne').value = data.note_moyenne || '';
            document.getElementById('realisateur').value = data.realisateur || '';
            document.getElementById('tagline').value = data.tagline || '';
            document.getElementById('status').value = data.status || 'Released';
            document.getElementById('langue_originale').value = data.langue_originale || '';
            document.getElementById('popularite').value = data.popularite || '';
            document.getElementById('video').value = data.video || '0';
            document.getElementById('homepage').value = data.homepage || '';
            document.getElementById('imdb_id').value = data.imdb_id || '';
            document.getElementById('trailer_url').value = data.trailer_url || '';

            // Sélectionner les genres
            const genreSelect = document.getElementById('genres');
            if (data.genres) {
                Array.from(genreSelect.options).forEach(option => {
                    option.selected = data.genres.some(genre => genre.tmdb_id === parseInt(option.value));
                });
            }

            // Sélectionner les acteurs
            const acteurSelect = document.getElementById('acteurs');
            if (data.acteurs) {
                Array.from(acteurSelect.options).forEach(option => {
                    option.selected = data.acteurs.some(acteur => acteur.tmdb_id === parseInt(option.value));
                });
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement du film:', error);
            document.getElementById('alert-container').innerHTML =
                `<div class="alert alert-danger">Erreur lors du chargement du film: ${error.message}</div>`;
        });
}

// Charger les genres depuis la base de données
function fetchGenres() {
    fetch('fetchGenres.php')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new TypeError("La réponse n'est pas du JSON");
            }
            return response.json();
        })
        .then(data => {
            const genreSelect = document.getElementById('genres');
            if (data.genres) {
                genreSelect.innerHTML = data.genres.map(genre =>
                    `<option value="${genre.tmdb_id}">${genre.nom}</option>`
                ).join('');
            } else if (data.error) {
                throw new Error(data.error);
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
    const acteurSelect = document.getElementById('acteurs');
    if (!acteurSelect) {
        console.error("L'élément avec l'ID 'acteurs' n'existe pas dans le DOM");
        document.getElementById('alert-container').innerHTML =
            `<div class="alert alert-danger">Erreur : L'élément pour afficher les acteurs est introuvable.</div>`;
        return;
    }

    fetch('fetchActeurs.php')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new TypeError("La réponse n'est pas du JSON");
            }
            return response.json();
        })
        .then(data => {
            if (data.acteurs) {
                acteurSelect.innerHTML = data.acteurs.map(acteur =>
                    `<option value="${acteur.tmdb_id}">${acteur.nom}</option>`
                ).join('');
            } else if (data.error) {
                throw new Error(data.error);
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
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new TypeError("La réponse n'est pas du JSON");
            }
            return response.json();
        })
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

            // Mettre à jour les champs avec les données TMDB
            document.getElementById('titre').value = data.title || document.getElementById('titre').value;
            document.getElementById('titre_original').value = data.original_title || document.getElementById('titre_original').value;
            document.getElementById('description').value = data.overview || document.getElementById('description').value;
            document.getElementById('synopsis').value = data.overview || document.getElementById('synopsis').value;
            document.getElementById('date_sortie').value = data.release_date || document.getElementById('date_sortie').value;
            document.getElementById('duree').value = data.runtime || document.getElementById('duree').value;
            document.getElementById('annee').value = data.release_date ? new Date(data.release_date).getFullYear() : document.getElementById('annee').value;
            document.getElementById('poster_path').value = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : document.getElementById('poster_path').value;
            document.getElementById('backdrop_path').value = data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : document.getElementById('backdrop_path').value;
            document.getElementById('note_moyenne').value = data.vote_average || document.getElementById('note_moyenne').value;
            document.getElementById('realisateur').value = data.credits?.crew?.find(person => person.job === 'Director')?.name || document.getElementById('realisateur').value;
            document.getElementById('tagline').value = data.tagline || document.getElementById('tagline').value;
            document.getElementById('status').value = data.status || document.getElementById('status').value;
            document.getElementById('langue_originale').value = data.original_language || document.getElementById('langue_originale').value;
            document.getElementById('popularite').value = data.popularity || document.getElementById('popularite').value;
            document.getElementById('homepage').value = data.homepage || document.getElementById('homepage').value;
            document.getElementById('imdb_id').value = data.imdb_id || document.getElementById('imdb_id').value;
            document.getElementById('video').value = data.video ? '1' : document.getElementById('video').value;

            // Mettre à jour la bande-annonce
            const trailer = data.videos?.results?.find(video => video.type === 'Trailer' && video.site === 'YouTube');
            document.getElementById('trailer_url').value = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : document.getElementById('trailer_url').value;

            // Sélectionner les genres
            const genreSelect = document.getElementById('genres');
            Array.from(genreSelect.options).forEach(option => {
                option.selected = data.genres?.some(genre => genre.id === parseInt(option.value));
            });

            // Sélectionner les acteurs (limité aux 5 premiers)
            const acteurSelect = document.getElementById('acteurs');
            const acteurs = data.credits?.cast?.slice(0, 5) || [];
            Array.from(acteurSelect.options).forEach(option => {
                option.selected = acteurs.some(acteur => acteur.id === parseInt(option.value));
            });

            alertContainer.innerHTML = `<div class="alert alert-success">Données TMDB récupérées avec succès.</div>`;
        })
        .catch(error => {
            console.error('Erreur TMDB:', error);
            alertContainer.innerHTML = `<div class="alert alert-danger">Erreur TMDB: ${error.message}</div>`;
        });
}