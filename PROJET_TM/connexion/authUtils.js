/**
 * Utility functions for JWT token validation, session management, and protected action guards.
 * MyCiné
 */
(function(window) {
    /**
     * Decode JWT and check if it is expired.
     */
    function isTokenExpired(token) {
        if (!token || typeof token !== 'string') return true;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return true;
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            if (payload && typeof payload.exp === 'number') {
                const now = Math.floor(Date.now() / 1000);
                return payload.exp < now;
            }
            return false;
        } catch (e) {
            return true;
        }
    }

    /**
     * Clear all auth storage data and cookies.
     */
    function clearAuth() {
        try {
            sessionStorage.removeItem('auth');
            localStorage.removeItem('lastAuth');
            document.cookie = "jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            if (typeof document !== 'undefined') {
                document.dispatchEvent(new CustomEvent('authChange'));
            }
        } catch(e) {
            console.error('Error clearing auth:', e);
        }
    }

    /**
     * Get valid auth object from storage if token is present and NOT expired.
     * Returns null if missing or expired.
     */
    function getValidAuth() {
        const raw = sessionStorage.getItem("auth") || localStorage.getItem("lastAuth");
        if (!raw) return null;
        try {
            const auth = JSON.parse(raw);
            const token = auth ? (auth.token || auth.jwt) : null;
            if (token && isTokenExpired(token)) {
                clearAuth();
                return null;
            }
            return auth;
        } catch (e) {
            clearAuth();
            return null;
        }
    }

    /**
     * Get relative URL to connexion.html based on current page location.
     */
    function getConnexionUrl() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/connexion/')) return 'connexion.html';
        if (currentPath.includes('/GestionFilmsBD/')) return '../connexion/connexion.html';
        if (currentPath.includes('/Films/')) return '../connexion/connexion.html';
        if (currentPath.includes('/Cine_map/')) return '../connexion/connexion.html';
        return 'PROJET_TM/connexion/connexion.html';
    }

    /**
     * Require authentication to perform an action.
     * If user is not logged in or token is expired, clears auth, notifies user, and redirects to connexion.html.
     */
    function requireAuthForAction(actionName) {
        const auth = getValidAuth();
        if (!auth) {
            clearAuth();
            const msg = actionName 
                ? `Votre session a expiré ou vous n'êtes pas connecté. Veuillez vous connecter pour ${actionName}.`
                : "Votre session a expiré. Veuillez vous connecter pour effectuer cette action.";
            alert(msg);
            window.location.href = getConnexionUrl();
            return null;
        }
        return auth;
    }

    // Expose functions globally
    window.isTokenExpired = isTokenExpired;
    window.clearAuth = clearAuth;
    window.getValidAuth = getValidAuth;
    window.getConnexionUrl = getConnexionUrl;
    window.requireAuthForAction = requireAuthForAction;
})(typeof window !== 'undefined' ? window : this);
