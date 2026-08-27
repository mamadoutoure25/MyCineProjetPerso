/**
 * Route Guard - Sécurisation des chemins et routes côté client (JavaScript)
 * Empêche le rendu des pages réservées sans authentification / privilèges suffisants.
 */

(function () {
    // 1. Liste des règles d'accès selon les motifs d'URL
    const PROTECTED_ROUTES = [
        { pattern: /ajouterFilms\.html/i, role: 'admin' },
        { pattern: /modifierFilms\.html/i, role: 'admin' },
        { pattern: /supprimerFilms\.html/i, role: 'admin' },
        { pattern: /admin/i, role: 'admin' },
        { pattern: /profilUser\.html/i, role: 'user' }
    ];

    const currentPath = window.location.pathname;
    const matchedRule = PROTECTED_ROUTES.find(rule => rule.pattern.test(currentPath));

    // Si la route courante n'est pas restreinte, ne rien bloquer
    if (!matchedRule) return;

    // Masquer immédiatement le body pour éviter l'affichage de données sensibles avant vérification
    document.documentElement.style.visibility = 'hidden';

    // Helper pour récupérer la valeur d'un cookie
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    // Calculer le chemin relatif vers verif.php
    function getVerifUrl() {
        if (currentPath.includes('/connexion/')) return 'verif.php';
        if (currentPath.includes('/GestionFilmsBD/')) return '../connexion/verif.php';
        if (currentPath.includes('/Films/')) return '../connexion/verif.php';
        return 'PROJET_TM/connexion/verif.php';
    }

    function getConnexionUrl() {
        if (currentPath.includes('/connexion/')) return 'connexion.html';
        if (currentPath.includes('/GestionFilmsBD/')) return '../connexion/connexion.html';
        if (currentPath.includes('/Films/')) return '../connexion/connexion.html';
        return 'PROJET_TM/connexion/connexion.html';
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const csrfToken = getCookie('csrf_token') || '';

        try {
            const response = await fetch(getVerifUrl(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok || !data.isLoggedIn || !data.user) {
                throw new Error(data.error || 'Session non valide ou expirée');
            }

            // Vérification du rôle requis
            if (matchedRule.role === 'admin' && data.user.role !== 'admin') {
                alert('Accès refusé : Privilèges administrateur requis.');
                window.location.href = getConnexionUrl();
                return;
            }

            // Rétablir la visibilité de la page si tout est valide
            document.documentElement.style.visibility = '';

        } catch (err) {
            console.warn('RouteGuard: Accès refusé -', err.message);
            if (window.clearAuth) window.clearAuth();
            else {
                sessionStorage.removeItem('auth');
                localStorage.removeItem('lastAuth');
            }
            alert('Veuillez vous connecter pour accéder à cette page.');
            window.location.href = getConnexionUrl();
        }
    });
})();
