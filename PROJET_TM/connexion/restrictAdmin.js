document.addEventListener('DOMContentLoaded', async () => {
    console.log('restrictAdmin.js: Vérification de l\'authentification...');

    const authData = JSON.parse(sessionStorage.getItem('auth') || '{}');
    console.log('restrictAdmin.js: Données authData:', authData);

    if (!authData.token || !authData.role) {
        console.warn('restrictAdmin.js: Token ou rôle manquant dans sessionStorage');
        showToast('Veuillez vous connecter en tant qu\'administrateur', 'danger');
        setTimeout(() => window.location.href = '../connexion/connexion.html', 2000);
        return;
    }

    try {
        console.log('restrictAdmin.js: Envoi de la requête à check_session.php avec token:', authData.token);
        const response = await fetch('../connexion/check_session.php', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.token}`
            },
            credentials: 'include'
        });

        console.log('restrictAdmin.js: Statut de la réponse:', response.status);
        const data = await response.json();
        console.log('restrictAdmin.js: Réponse de check_session.php:', data);

        if (!response.ok) {
            console.warn('restrictAdmin.js: Réponse non OK:', response.status, data.message);
            throw new Error(data.message || `Erreur HTTP ${response.status}`);
        }

        if (!data.success || !data.isLoggedIn) {
            console.warn('restrictAdmin.js: Session non connectée ou invalide');
            showToast('Session invalide, veuillez vous reconnecter', 'danger');
            sessionStorage.removeItem('auth');
            setTimeout(() => window.location.href = '../connexion/connexion.html', 2000);
            return;
        }

        if (data.user.role !== 'admin') {
            console.warn('restrictAdmin.js: Rôle utilisateur non admin:', data.user.role);
            showToast('Privilèges administrateurs requis', 'danger');
            sessionStorage.removeItem('auth');
            setTimeout(() => window.location.href = '../connexion/connexion.html', 2000);
            return;
        }

        console.log('restrictAdmin.js: Authentification réussie pour admin');
    } catch (error) {
        console.error('restrictAdmin.js: Erreur lors de la vérification de la session:', error);
        showToast('Erreur lors de la vérification de la session: ' + error.message, 'danger');
        sessionStorage.removeItem('auth');
        setTimeout(() => window.location.href = '../connexion/connexion.html', 2000);
    }
});