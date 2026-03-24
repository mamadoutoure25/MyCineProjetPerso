// ==================== Configuration ====================
const API_BASE = '../connexion/connexion.php';
const REDIRECT_ADMIN = '../GestionFilmsBD/ajouterFilms.html';
const REDIRECT_USER = '../../index.html';

// ==================== Validation & Utilities ====================
/**
 * Valide les identifiants de connexion
 */
function validateLoginForm(pseudo, password, role) {
	const errors = [];

	if (!pseudo || pseudo.trim().length === 0) {
		errors.push('Le nom d\'utilisateur est requis');
	}

	if (!password || password.trim().length === 0) {
		errors.push('Le mot de passe est requis');
	}

	if (!role || role.trim().length === 0) {
		errors.push('Le rôle est requis');
	}

	return errors;
}

/**
 * Affiche les erreurs du formulaire
 */
function displayFormErrors(errors) {
	const formGroups = document.querySelectorAll('.form-group');
	formGroups.forEach(group => {
		const errorDiv = group.querySelector('.form-error');
		if (errorDiv) {
			errorDiv.classList.remove('show');
			errorDiv.textContent = '';
		}
	});

	const errorInput = {
		'username': 0,
		'password': 1,
		'role': 2
	};

	errors.forEach((error, index) => {
		const errorKey = Object.keys(errorInput)[index];
		if (errorKey) {
			const formGroup = document.querySelectorAll('.form-group')[errorInput[errorKey]];
			if (formGroup) {
				const errorDiv = formGroup.querySelector('.form-error');
				if (errorDiv) {
					errorDiv.textContent = error;
					errorDiv.classList.add('show');
				}
			}
		}
	});
}

/**
 * Stocke les informations d'authentification
 */
function storeAuthInfo(authData) {
	try {
		sessionStorage.setItem('auth', JSON.stringify({
			userId: authData.user.id,
			token: authData.token,
			pseudo: authData.user.pseudo,
			role: authData.user.role
		}));
		document.dispatchEvent(new Event('authChange'));
	} catch (error) {
		console.error('Erreur lors du stockage de l\'authentification:', error);
		throw new Error('Impossible de stocker les données d\'authentification');
	}
}

/**
 * Effectue la redirection selon le rôle
 */
function redirectByRole(role) {
	const redirectUrl = role === 'admin' ? REDIRECT_ADMIN : REDIRECT_USER;
	window.location.href = redirectUrl;
}

// ==================== API Communication ====================
/**
 * Envoie les identifiants au serveur
 */
async function handleLogin(pseudo, password, role) {
	try {
		const validationErrors = validateLoginForm(pseudo, password, role);
		if (validationErrors.length > 0) {
			displayFormErrors(validationErrors);
			return { success: false, message: validationErrors[0] };
		}

		const response = await fetch(API_BASE, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({
				pseudo: pseudo.trim(),
				mot_de_passe: password,
				role: role.trim()
			})
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || `Erreur HTTP ${response.status}`);
		}

		if (data.success) {
			storeAuthInfo(data);
			return { success: true, role: data.user.role };
		} else {
			return { success: false, message: data.message || 'Échec de la connexion' };
		}
	} catch (error) {
		console.error('Erreur lors de la connexion:', error);
		return { success: false, message: error.message || 'Erreur de connexion' };
	}
}

/**
 * Gère la déconnexion
 */
async function handleLogout() {
	try {
		const response = await fetch('../connexion/logout.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		});

		if (!response.ok) {
			throw new Error('Erreur lors de la déconnexion');
		}

		const data = await response.json();
		if (!data.success) {
			throw new Error(data.message || 'Échec de la déconnexion');
		}
	} catch (error) {
		console.error('Erreur lors de la déconnexion:', error);
	} finally {
		sessionStorage.removeItem('auth');
		document.dispatchEvent(new Event('authChange'));
		window.location.href = '../connexion/connexion.html';
	}
}

// ==================== UI Interactions ====================
/**
 * Affiche une notification toast
 */
function showToast(message, type = 'info') {
	const toastContainer = document.getElementById('toast-container');
	if (!toastContainer) {
		console.warn('Conteneur de toast introuvable');
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

/**
 * Active/désactive la visibilité du mot de passe
 */
function togglePasswordVisibility() {
	const passwordInput = document.getElementById('password');
	const toggleButton = document.getElementById('togglePassword');
	const isPassword = passwordInput.type === 'password';

	passwordInput.type = isPassword ? 'text' : 'password';
	toggleButton.innerHTML = isPassword
		? '<i class="ph ph-eye-slash"></i>'
		: '<i class="ph ph-eye"></i>';
}

/**
 * Définit les états du formulaire
 */
function setFormState(isLoading) {
	const submitButton = document.querySelector('.btn-auth-submit');
	const inputs = document.querySelectorAll('.form-control, .form-select');

	if (isLoading) {
		submitButton.disabled = true;
		submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Connexion en cours...';
		inputs.forEach(input => input.disabled = true);
	} else {
		submitButton.disabled = false;
		submitButton.innerHTML = '<i class="ph ph-sign-in"></i><span class="btn-text">Se connecter</span>';
		inputs.forEach(input => input.disabled = false);
	}
}

// ==================== DOM Events ====================
document.addEventListener('DOMContentLoaded', () => {
	// Gestion du formulaire de connexion
	const loginForm = document.getElementById('loginForm');
	if (loginForm) {
		loginForm.addEventListener('submit', async (e) => {
			e.preventDefault();

			const pseudo = document.getElementById('username').value;
			const password = document.getElementById('password').value;
			const role = document.getElementById('role').value;

			setFormState(true);

			const result = await handleLogin(pseudo, password, role);

			setFormState(false);

			const errorMessage = document.getElementById('error-message');
			if (errorMessage) {
				if (result.success) {
					errorMessage.style.display = 'none';
					showToast('Connexion réussie ! 🎬', 'success');
					setTimeout(() => redirectByRole(result.role), 1000);
				} else {
					errorMessage.textContent = result.message;
					errorMessage.style.display = 'block';
					showToast(result.message, 'danger');
				}
			}
		});
	}

	// Toggle visibilité du mot de passe
	const togglePasswordBtn = document.getElementById('togglePassword');
	if (togglePasswordBtn) {
		togglePasswordBtn.addEventListener('click', (e) => {
			e.preventDefault();
			togglePasswordVisibility();
		});
	}

	// Réinitialiser l'erreur en cas de modification
	const formInputs = document.querySelectorAll('.form-control, .form-select');
	formInputs.forEach(input => {
		input.addEventListener('input', () => {
			const formGroup = input.closest('.form-group');
			if (formGroup) {
				const errorDiv = formGroup.querySelector('.form-error');
				if (errorDiv) {
					errorDiv.classList.remove('show');
				}
			}
		});
	});
});