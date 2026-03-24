document.addEventListener('DOMContentLoaded', async () => {
    const filmSelect = document.getElementById('film_select');
    const deleteFilmForm = document.getElementById('deleteFilmForm');
    const alertContainer = document.getElementById('alert-container');
    const toastContainer = document.getElementById('toast-container');

    // Function to show toast notifications
    function showToast(message, type = 'info') {
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast show align-items-center text-white bg-${type} border-0`;
        toast.role = 'alert';
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.id = toastId;

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        const bsToast = bootstrap.Toast.getOrCreateInstance(toast);
        bsToast.show();
        setTimeout(() => {
            bsToast.hide();
            toast.addEventListener('hidden.bs.toast', () => toast.remove());
        }, 5000);
    }

    // Fetch films from the database
    async function loadFilms() {
        try {
            const response = await fetch('fetchFilms.php', {
                cache: 'no-cache',
                credentials: 'same-origin' // Include cookies for session
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erreur HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Réponse non-JSON reçue:', text);
                throw new TypeError("La réponse n'est pas du JSON");
            }

            const data = await response.json();
            if (data.error) {
                alertContainer.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
                return;
            }

            if (!data.films || data.films.length === 0) {
                alertContainer.innerHTML = `<div class="alert alert-info">Aucun film trouvé dans la base de données.</div>`;
                return;
            }

            // Populate the film select dropdown
            filmSelect.innerHTML = '<option value="">Choisissez un film...</option>' +
                data.films.map(film => `<option value="${film.id}">${film.titre} (${film.annee})</option>`).join('');
        } catch (error) {
            console.error('Erreur lors du chargement des films:', error);
            alertContainer.innerHTML = `<div class="alert alert-danger">Erreur: ${error.message}</div>`;
        }
    }

    // Handle form submission
    deleteFilmForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const filmId = filmSelect.value;

        if (!filmId) {
            alertContainer.innerHTML = `<div class="alert alert-warning">Veuillez sélectionner un film.</div>`;
            return;
        }

        // Confirm deletion
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce film ? Cette action est irréversible.')) {
            return;
        }

        try {
            const response = await fetch('supprimerFilm.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin', // Include cookies for session
                body: JSON.stringify({ film_id: parseInt(filmId) })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Réponse non-JSON reçue:', text);
                throw new TypeError("La réponse n'est pas du JSON");
            }

            const data = await response.json();
            if (data.success) {
                showToast('Film supprimé avec succès !', 'success');
                // Reload films
                await loadFilms();
                deleteFilmForm.reset();
                // Redirect to projetBD.html to show the updated list
                setTimeout(() => {
                    window.location.href = '../Films/projetBD.html?deleted=true';
                }, 1000);
            } else {
                alertContainer.innerHTML = `<div class="alert alert-danger">Erreur: ${data.message || 'Impossible de supprimer le film'}</div>`;
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alertContainer.innerHTML = `<div class="alert alert-danger">Erreur: ${error.message}</div>`;
        }
    });

    // Load films on page load
    await loadFilms();
});