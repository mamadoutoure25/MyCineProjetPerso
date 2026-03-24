document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    const clapperboard = document.querySelector('.clapperboard');
    const pupils = document.querySelectorAll('.clapperboard-pupil');

    if (passwordInput && clapperboard && pupils) {
        // Gestion du focus sur le champ mot de passe
        passwordInput.addEventListener('focus', () => {
            clapperboard.classList.add('eyes-closed', 'clap');
        });

        // Gestion de la perte de focus
        passwordInput.addEventListener('blur', () => {
            clapperboard.classList.remove('eyes-closed', 'clap');
        });

        // Suivi du mouvement de la souris pour les pupilles
        document.addEventListener('mousemove', (e) => {
            pupils.forEach(pupil => {
                const rect = pupil.parentElement.getBoundingClientRect();
                const eyeCenterX = rect.left + rect.width / 2;
                const eyeCenterY = rect.top + rect.height / 2;
                const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
                const maxMove = 3;
                const moveX = Math.cos(angle) * maxMove;
                const moveY = Math.sin(angle) * maxMove;
                pupil.style.transform = `translate(-50%, -50%) translate(${moveX}px, ${moveY}px)`;
            });
        });
    }
});