async function handleRegister(pseudo, email, password) {
    try {
        if (!pseudo || !email || !password) {
            showToast('Veuillez remplir tous les champs', 'danger');
            return { success: false, message: 'Veuillez remplir tous les champs' };
        }

        // Validation de l'email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            showToast('Adresse e-mail invalide', 'danger');
            return { success: false, message: 'Adresse e-mail invalide' };
        }

        // Validation du mot de passe (minimum 8 caractères)
        if (password.length < 8) {
            showToast('Le mot de passe doit contenir au moins 8 caractères', 'danger');
            return { success: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
        }

        // Validation du pseudo (alphanumérique, 3 à 20 caractères)
        const pseudoRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!pseudoRegex.test(pseudo)) {
            showToast('Le pseudo doit contenir entre 3 et 20 caractères alphanumériques', 'danger');
            return { success: false, message: 'Le pseudo doit contenir entre 3 et 20 caractères alphanumériques' };
        }

        console.log('auth.js: Envoi de la requête d\'inscription:', { pseudo, email });

        const formData = new FormData();
        formData.append('pseudo', pseudo);
        formData.append('email', email);
        formData.append('mot_de_passe', password);

        const response = await fetch('./inscription.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log('auth.js: Réponse d\'inscription:', data);

        if (!response.ok) {
            throw new Error(data.message || `Erreur HTTP ${response.status}`);
        }

        if (data.success) {
            return { success: true, message: data.message || 'Inscription réussie' };
        } else {
            return { success: false, message: data.message || 'Échec de l\'inscription' };
        }
    } catch (error) {
        console.error('auth.js: Erreur lors de l\'inscription:', error);
        return { success: false, message: error.message || 'Erreur lors de l\'inscription' };
    }
}

async function handleLogout() {
    try {
        console.log('auth.js: Déconnexion en cours...');
        const response = await fetch('./logout.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            throw new Error('Erreur lors de la déconnexion');
        }
        const data = await response.json();
        console.log('auth.js: Réponse de déconnexion:', data);
        if (!data.success) {
            throw new Error(data.message || 'Échec de la déconnexion');
        }
        console.log('auth.js: Déconnexion réussie');
    } catch (error) {
        console.error('auth.js: Erreur lors de la déconnexion:', error);
    }
    sessionStorage.removeItem('auth');
    localStorage.removeItem('lastAuth');
    document.dispatchEvent(new Event('authChange'));
    window.location.href = './connexion.html';
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.warn('auth.js: Conteneur de toast introuvable');
        return;
    }

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

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pseudo = document.getElementById('pseudo').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            console.log('auth.js: Soumission du formulaire d\'inscription:', { pseudo, email });
            const result = await handleRegister(pseudo, email, password);
            if (result.success) {
                showToast(result.message, 'success');
                setTimeout(() => window.location.href = './connexion.html', 2000);
            } else {
                showToast(result.message, 'danger');
                const errorMessage = document.getElementById('error-message');
                if (errorMessage) {
                    errorMessage.textContent = result.message;
                    errorMessage.style.display = 'block';
                    setTimeout(() => errorMessage.style.display = 'none', 5000);
                }
            }
        });
    }
});