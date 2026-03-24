/**
 * @file sombre_clair.js
 * @description Gestion avancée du thème clair/sombre avec animations et style Apple TV
 * @version 2.0
 * @update Thème Apple TV avec transitions fluides
 */

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const html = document.documentElement;
    const body = document.body;

    // Ajout d'une transition douce pour le changement de thème
    body.style.transition = 'background-color 0.6s ease, color 0.3s ease';

    // Vérifie le thème sauvegardé ou utilise la préférence système avec détection fine
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const savedTheme = localStorage.getItem('theme') || systemPreference;

    // Applique le thème avec un léger délai pour l'animation
    setTimeout(() => {
        html.setAttribute('data-theme', savedTheme);
        updateIcon(savedTheme);
    }, 50);

    // Animation du bouton de basculement
    themeToggle.style.transition = 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
    themeToggle.style.transformStyle = 'preserve-3d';

    // Gère le basculement de thème avec animation
    themeToggle.addEventListener('click', (e) => {
        e.preventDefault();

        // Animation du bouton
        themeToggle.style.transform = 'scale(0.9) rotate(180deg)';
        setTimeout(() => {
            themeToggle.style.transform = 'scale(1) rotate(0)';
        }, 400);

        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        // Change le thème avec un fondu
        html.style.opacity = '0.8';
        setTimeout(() => {
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
            html.style.opacity = '1';
        }, 200);
    });

    // Met à jour l'icône avec une animation
    function updateIcon(theme) {
        // Animation de fondu
        themeIcon.style.opacity = '0';
        themeIcon.style.transition = 'opacity 0.3s ease, transform 0.4s ease';

        setTimeout(() => {
            themeIcon.className = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
            themeIcon.style.opacity = '1';

            // Petite animation pour l'icône
            themeIcon.style.transform = 'scale(1.2)';
            setTimeout(() => {
                themeIcon.style.transform = 'scale(1)';
            }, 200);
        }, 150);
    }

    // Écoute les changements de préférence système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) { // Seulement si pas de préférence utilisateur
            const newTheme = e.matches ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            updateIcon(newTheme);
        }
    });
});