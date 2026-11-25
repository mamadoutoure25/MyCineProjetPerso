document.addEventListener("DOMContentLoaded", () => {
    // 1. Vérification de la connexion
    const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : JSON.parse(sessionStorage.getItem("auth") || localStorage.getItem("lastAuth") || "null");
    
    if (!auth) {
        // Rediriger si non connecté (sécurité)
        window.location.href = "../connexion/connexion.html?redirect=" + encodeURIComponent(window.location.pathname);
        return;
    }

    // 2. Affichage des infos utilisateur dans la bannière
    const pseudo = auth.pseudo || auth.username || (auth.user && (auth.user.pseudo || auth.user.username)) || "Membre";
    const nameEl = document.getElementById("user-display-name");
    const avatarEl = document.getElementById("user-avatar-initial");
    const roleEl = document.getElementById("user-role-badge");

    if (nameEl) nameEl.textContent = pseudo;
    if (avatarEl) avatarEl.textContent = (pseudo.charAt(0) || "M").toUpperCase();
    if (roleEl) {
        if (auth.role === 'admin') {
            roleEl.innerHTML = `<i class="ph-fill ph-shield-check"></i> Administrateur`;
            roleEl.style.borderColor = "rgba(245, 158, 11, 0.4)";
            roleEl.style.color = "#fbbf24";
            roleEl.style.background = "rgba(245, 158, 11, 0.12)";
        } else {
            roleEl.innerHTML = `<i class="ph-fill ph-sparkle"></i> Membre MyCiné`;
        }
    }

    // 3. Initialisation du contenu adulte (18+)
    const adultToggle = document.getElementById("toggle-adult-content");
    const includeAdult = localStorage.getItem("include_adult") === "true";
    if (adultToggle) {
        adultToggle.checked = includeAdult;
    }

    // 4. Initialisation Langue
    const langSelect = document.getElementById("select-language");
    if (langSelect) {
        langSelect.value = localStorage.getItem("user_lang") || "fr-FR";
    }

    // 5. Initialisation Région
    const regionSelect = document.getElementById("select-region");
    if (regionSelect) {
        regionSelect.value = localStorage.getItem("user_region") || "FR";
    }

    // 6. Initialisation Expérience Vidéo (Autoplay & Son)
    const autoplayToggle = document.getElementById("toggle-autoplay");
    if (autoplayToggle) {
        autoplayToggle.checked = localStorage.getItem("autoplay_trailer") !== "false";
    }

    const soundMuteToggle = document.getElementById("toggle-sound-mute");
    if (soundMuteToggle) {
        soundMuteToggle.checked = localStorage.getItem("default_audio_mute") !== "false";
    }

    // 7. Initialisation Sélecteur de Thème Visuel
    updateActiveThemeCard();

    // 8. Gestion Vider le Cache
    const btnClearCache = document.getElementById("btn-clear-cache");
    if (btnClearCache) {
        btnClearCache.addEventListener("click", () => {
            let clearedCount = 0;
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith("custom_movie_poster_") || k.startsWith("custom_tv_poster_") || k.startsWith("cache_"))) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(k => {
                localStorage.removeItem(k);
                clearedCount++;
            });
            notify(`Cache nettoyé avec succès (${clearedCount} éléments supprimés).`, "success");
        });
    }

    // 9. Gestion Déconnexion
    const btnLogout = document.getElementById("btn-logout-settings");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
                if (window.clearAuth) {
                    window.clearAuth();
                } else {
                    sessionStorage.removeItem("auth");
                    localStorage.removeItem("lastAuth");
                }
                notify("Déconnexion réussie...", "info");
                setTimeout(() => {
                    window.location.href = "../connexion/connexion.html";
                }, 800);
            }
        });
    }

    // 10. Bouton d'enregistrement des paramètres
    const btnSave = document.getElementById("btn-save-settings");
    if (btnSave) {
        btnSave.addEventListener("click", () => {
            if (langSelect) localStorage.setItem("user_lang", langSelect.value);
            if (regionSelect) localStorage.setItem("user_region", regionSelect.value);
            if (adultToggle) localStorage.setItem("include_adult", adultToggle.checked);
            if (autoplayToggle) localStorage.setItem("autoplay_trailer", autoplayToggle.checked);
            if (soundMuteToggle) localStorage.setItem("default_audio_mute", soundMuteToggle.checked);
            
            btnSave.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> ENREGISTREMENT...`;
            btnSave.classList.add("disabled");
            
            setTimeout(() => {
                notify("Paramètres enregistrés avec succès. Mise à jour...", "success");
                setTimeout(() => window.location.reload(), 900);
            }, 500);
        });
    }
});

// Gestion du sélecteur de thème visuel (Mode Sombre / Clair)
window.selectVisualTheme = function(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = theme === 'light' ? 'ph ph-sun fs-5' : 'ph ph-moon fs-5';
    }

    updateActiveThemeCard();
    notify(`Thème ${theme === 'dark' ? 'Sombre' : 'Clair'} activé`, "info");
};

function updateActiveThemeCard() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'dark';
    const darkCard = document.getElementById('theme-card-dark');
    const lightCard = document.getElementById('theme-card-light');

    if (darkCard && lightCard) {
        if (currentTheme === 'dark') {
            darkCard.classList.add('active');
            lightCard.classList.remove('active');
        } else {
            lightCard.classList.add('active');
            darkCard.classList.remove('active');
        }
    }
}

function notify(msg, type = "info") {
    const c = document.getElementById("toast-container");
    if (!c) return;
    const t = document.createElement("div");
    const bgClass = type === 'success' ? 'bg-success' : (type === 'danger' ? 'bg-danger' : 'bg-primary');
    t.className = `toast show ${bgClass} text-white p-3 mb-2 rounded-4 shadow-lg border-0`;
    t.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="ph-fill ph-${type === 'success' ? 'check-circle' : 'info'} me-2 fs-5"></i>
            <span class="fw-semibold">${msg}</span>
            <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}
