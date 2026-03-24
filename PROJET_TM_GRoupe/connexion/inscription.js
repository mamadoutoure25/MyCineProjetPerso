// ==================== Configuration ====================
const API_BASE = '../connexion/inscription.php';
const REDIRECT_LOGIN = 'connexion.html';

// ==================== Validation & Utilities ====================
/**
 * Valide les données d'inscription
 */
function validateRegistrationForm(pseudo, email, password) {
	const errors = [];

	if (!pseudo || pseudo.trim().length === 0) {
		errors.push('Le nom d\'utilisateur est requis');
	} else if (pseudo.trim().length < 3) {
		errors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
	} else if (pseudo.trim().length > 20) {
		errors.push('Le nom d\'utilisateur ne peut pas dépasser 20 caractères');
	}

	if (!email || email.trim().length === 0) {
		errors.push('L\'adresse e-mail est requise');
	} else if (!isValidEmail(email.trim())) {
		errors.push('Veuillez entrer une adresse e-mail valide');
	}

	if (!password || password.trim().length === 0) {
		errors.push('Le mot de passe est requis');
	} else if (password.trim().length < 6) {
		errors.push('Le mot de passe doit contenir au moins 6 caractères');
	}

	return errors;
}

/**
 * Valide le format d'un email
 */
function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
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
		'pseudo': 0,
		'email': 1,
		'password': 2
	};

	errors.forEach((error, index) => {
		const errorKey = Object.keys(errorInput)[index];
		if (errorKey && errorInput[errorKey] < formGroups.length) {
			const formGroup = formGroups[errorInput[errorKey]];
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

// ==================== API Communication ====================
/**
 * Envoie les données d'inscription au serveur
 */
async function handleRegistration(pseudo, email, password) {
	try {
		const validationErrors = validateRegistrationForm(pseudo, email, password);
		if (validationErrors.length > 0) {
			displayFormErrors(validationErrors);
			return { success: false, message: validationErrors[0] };
		}

		const formData = new FormData();
		formData.append('pseudo', pseudo.trim());
		formData.append('email', email.trim());
		formData.append('mot_de_passe', password);

		const response = await fetch(API_BASE, {
			method: 'POST',
			body: formData
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || `Erreur HTTP ${response.status}`);
		}

		if (data.success) {
			return { success: true, message: data.message };
		} else {
			return { success: false, message: data.message || 'Échec de l\'inscription' };
		}
	} catch (error) {
		console.error('Erreur lors de l\'inscription:', error);
		return { success: false, message: error.message || 'Erreur lors de l\'inscription' };
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
	const inputs = document.querySelectorAll('.form-control');

	if (isLoading) {
		submitButton.disabled = true;
		submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Inscription en cours...';
		inputs.forEach(input => input.disabled = true);
	} else {
		submitButton.disabled = false;
		submitButton.innerHTML = '<i class="ph ph-user-plus"></i><span class="btn-text">S\'inscrire</span>';
		inputs.forEach(input => input.disabled = false);
	}
}

// ==================== DOM Events ====================
document.addEventListener('DOMContentLoaded', () => {
	// Gestion du formulaire d'inscription
	const registerForm = document.getElementById('registerForm');
	if (registerForm) {
		registerForm.addEventListener('submit', async (e) => {
			e.preventDefault();

			const pseudo = document.getElementById('pseudo').value;
			const email = document.getElementById('email').value;
			const password = document.getElementById('password').value;

			setFormState(true);

			const result = await handleRegistration(pseudo, email, password);

			setFormState(false);

			const errorMessage = document.getElementById('error-message');
			if (errorMessage) {
				if (result.success) {
					errorMessage.style.display = 'none';
					showToast('Inscription réussie ! Redirection vers la connexion... 🎬', 'success');
					setTimeout(() => {
						window.location.href = REDIRECT_LOGIN;
					}, 1500);
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
	const formInputs = document.querySelectorAll('.form-control');
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

