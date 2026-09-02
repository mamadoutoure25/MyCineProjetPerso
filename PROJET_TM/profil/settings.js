document.addEventListener("DOMContentLoaded", () => {
    // 1. Vérification de la connexion
    const auth = typeof window.getValidAuth === 'function' ? window.getValidAuth() : JSON.parse(sessionStorage.getItem("auth") || localStorage.getItem("lastAuth") || "null");
    
    if (!auth) {
        // Rediriger si non connecté (sécurité)
        window.location.href = "../connexion/connexion.html?redirect=" + encodeURIComponent(window.location.pathname);
        return;
    }

    // 2. Initialisation de l'état du switch
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

    // 6. Bouton d'enregistrement
    const btnSave = document.getElementById("btn-save-settings");
    if (btnSave) {
        btnSave.addEventListener("click", () => {
            if (langSelect) localStorage.setItem("user_lang", langSelect.value);
            if (regionSelect) localStorage.setItem("user_region", regionSelect.value);
            if (adultToggle) localStorage.setItem("include_adult", adultToggle.checked);
            
            btnSave.innerHTML = `<i class="ph-fill ph-spinner-gap spin-icon me-2"></i> ENREGISTREMENT...`;
            btnSave.classList.add("disabled");
            
            setTimeout(() => {
                notify("Paramètres enregistrés avec succès. Rechargement...", "success");
                setTimeout(() => window.location.reload(), 1000);
            }, 600);
        });
    }
});
function notify(msg, type) {
    const c = document.getElementById("toast-container");
    if (!c) return;
    const t = document.createElement("div");
    t.className = `toast show bg-${type} text-white p-3 mb-2 rounded-4 shadow-lg`;
    t.innerHTML = `<div class="d-flex align-items-center"><i class="ph-fill ph-${type === 'warning' ? 'warning' : 'check-circle'} me-2 fs-5"></i><span>${msg}</span></div>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}
