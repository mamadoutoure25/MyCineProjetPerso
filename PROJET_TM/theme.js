// Theme Logic
document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    function setTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        if (themeIcon) {
            if (theme === 'light') {
                themeIcon.className = 'ph ph-sun fs-4';
            } else {
                themeIcon.className = 'ph ph-moon fs-4';
            }
        }
        if (themeToggle) {
            const label = theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre';
            themeToggle.setAttribute('aria-label', label);
            themeToggle.setAttribute('title', label);
        }
    }

    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
});

// Global Premium Alert System
window.customAlert = function(message, type = 'warning') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-4';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const toastId = 'alert-' + Date.now();
    const toast = document.createElement('div');
    
    let icon = 'ph-info';
    let gradient = 'linear-gradient(135deg, #3b82f6, #2563eb)';
    
    if (type === 'warning' || type === 'danger') {
        icon = 'ph-warning-circle';
        gradient = 'linear-gradient(135deg, #f43f5e, #e11d48)';
    } else if (type === 'success') {
        icon = 'ph-check-circle';
        gradient = 'linear-gradient(135deg, #10b981, #059669)';
    } else if (type === 'accent') {
        icon = 'ph-bell-ringing';
        gradient = 'linear-gradient(135deg, #a78bfa, #f472b6)';
    }

    toast.className = `toast align-items-center text-white border-0`;
    toast.style.background = gradient;
    toast.style.borderRadius = '16px';
    toast.style.boxShadow = '0 15px 35px rgba(0,0,0,0.3)';
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex px-3 py-2">
            <div class="toast-body d-flex align-items-center gap-3 fw-bold" style="font-size: 1.05rem; letter-spacing: 0.5px;">
                <i class="ph ${icon} fs-3"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    container.appendChild(toast);
    
    if (typeof bootstrap !== 'undefined') {
        const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
        bsToast.show();
        toast.addEventListener('hidden.bs.toast', () => toast.remove());
    } else {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};
