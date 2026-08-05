const fs = require('fs');

// --- 1. Rewrite companies-browse.html ---
const companiesHtml = `<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sociétés de production - MyCiné</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- Unified Premium Styles -->
    <link rel="stylesheet" href="premium-home.css">
    <link rel="stylesheet" href="theme-variables.css">
    <style>
        .companies-hero {
            padding: 140px 5% 60px;
            background: linear-gradient(to bottom, var(--bg-secondary) 0%, var(--bg-primary) 100%);
            border-bottom: 1px solid var(--border);
            text-align: center;
        }

        .stat-card {
            background: var(--glass);
            backdrop-filter: blur(15px);
            border: 1px solid var(--border);
            padding: 20px 30px;
            border-radius: 20px;
            text-align: center;
            min-width: 150px;
            transition: 0.3s;
        }
        .stat-card:hover { transform: translateY(-5px); border-color: var(--accent); }
        .stat-val { font-size: 1.8rem; font-weight: 900; color: var(--text-primary); }
        .stat-lbl { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--accent); letter-spacing: 1px; }

        .search-input-wrapper {
            max-width: 600px;
            margin: 0 auto 40px;
            position: relative;
        }
        
        .search-input-wrapper input {
            width: 100%;
            padding: 15px 25px;
            background: var(--glass);
            border: 1px solid var(--border);
            border-radius: 50px;
            color: var(--text-primary);
            font-size: 1.1rem;
            transition: 0.3s;
        }
        
        .search-input-wrapper input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.2);
        }

        .section-wrapper { padding: 40px 5% 80px; }
        
        .company-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
        }

        /* Glassmorphism Logo Card */
        .company-card-premium {
            background: var(--glass);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            text-align: center;
            aspect-ratio: 1;
            transition: 0.3s;
            cursor: pointer;
            text-decoration: none;
            color: var(--text-primary);
            position: relative;
            overflow: hidden;
        }
        
        .company-card-premium:hover {
            transform: translateY(-8px);
            border-color: var(--accent);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .company-logo-wrapper {
            flex-grow: 1;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.05); /* Slight white tint for contrast if logo is dark */
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 15px;
            transition: 0.3s;
        }
        
        [data-theme="light"] .company-logo-wrapper {
            background: rgba(0,0,0,0.05);
        }

        .company-logo {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
        }

        /* Many company logos are just black shapes without background. We might need a white glow or invert in dark mode, but for now we rely on the subtle background */
        
        .company-name {
            font-weight: 800;
            font-size: 0.9rem;
            width: 100%;
            text-transform: uppercase;
        }
        
        .company-country {
            font-size: 0.7rem;
            opacity: 0.6;
            font-weight: 600;
        }
    </style>
</head>
<body>

<!-- Unified Navbar -->
<nav class="navbar navbar-expand-lg fixed-top px-5">
    <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center gap-2" href="../../index.html" style="font-weight: 900; color: var(--text-primary);">
            <div style="background: linear-gradient(135deg, #a78bfa, #f472b6); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem;">M</div>
            MYCINÉ
        </a>
        <div class="collapse navbar-collapse justify-content-center">
            <ul class="navbar-nav gap-4">
                <li class="nav-item"><a class="nav-link fw-bold opacity-50 text-theme" href="../../index.html">ACCUEIL</a></li>
                <li class="nav-item"><a class="nav-link fw-bold opacity-50 text-theme" href="films.html">FILMS</a></li>
                <li class="nav-item"><a class="nav-link fw-bold opacity-50 text-theme" href="../../series.html">SÉRIES</a></li>
                <li class="nav-item"><a class="nav-link fw-bold opacity-50 text-theme" href="collections-browse.html">COLLECTIONS</a></li>
                <li class="nav-item"><a class="nav-link fw-bold text-theme" href="companies-browse.html">STUDIOS</a></li>
            </ul>
        </div>
        <div class="d-flex align-items-center gap-3">
            <button id="theme-toggle" class="btn btn-link text-theme text-decoration-none px-2 d-flex align-items-center" aria-label="Toggle theme">
                <i class="ph ph-moon fs-4" id="theme-icon"></i>
            </button>
            <div id="auth-section"></div>
        </div>
    </div>
</nav>

<!-- Hero Section -->
<header class="companies-hero">
    <div class="container-fluid">
        <h1 class="hero-title mb-3" style="font-size: 3.5rem;">SOCIÉTÉS DE PRODUCTION</h1>
        <p class="opacity-50 fs-5 mb-5">Découvrez les studios de légende qui façonnent le cinéma</p>
        
        <!-- Stats -->
        <div class="d-flex flex-wrap justify-content-center gap-3">
            <div class="stat-card">
                <div class="stat-val" id="total-companies">0</div>
                <div class="stat-lbl">Studios</div>
            </div>
            <div class="stat-card">
                <div class="stat-val" id="total-countries">0</div>
                <div class="stat-lbl">Pays</div>
            </div>
            <div class="stat-card">
                <div class="stat-val" id="total-films">0</div>
                <div class="stat-lbl">Films Produits</div>
            </div>
        </div>
    </div>
</header>

<main class="section-wrapper">
    <!-- Recherche -->
    <div class="search-input-wrapper">
        <input type="text" id="search-input" placeholder="Rechercher un studio (ex: Warner Bros, Pixar)..." aria-label="Rechercher">
        <i class="ph ph-magnifying-glass position-absolute text-theme opacity-50" style="right: 25px; top: 18px; font-size: 1.2rem;"></i>
    </div>

    <!-- Grille des sociétés -->
    <div class="company-grid" id="companies-container">
        <div class="text-center py-5 w-100" style="grid-column: 1 / -1;">
            <div class="spinner-border text-theme" role="status">
                <span class="visually-hidden">Chargement...</span>
            </div>
        </div>
    </div>

    <!-- Aucune société trouvée -->
    <div id="no-companies" class="text-center py-5" style="display: none; grid-column: 1 / -1;">
        <i class="ph ph-buildings fs-1 mb-3 opacity-50"></i>
        <h3 class="fw-bold">Aucune société trouvée</h3>
    </div>
</main>

<footer class="py-5 text-center border-top border-secondary mt-5 opacity-50">
    <p class="small fw-bold">© 2026 MYCINÉ • EXPERIENCE PREMIUM</p>
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="companies-browse.js"></script>
<script>
    window.onscroll = () => {
        const nav = document.querySelector('.navbar');
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    };
    
    // Auth section basic logic
    const auth = JSON.parse(sessionStorage.getItem("auth") || "null");
    const c = document.getElementById("auth-section");
    if (auth) {
        c.innerHTML = \`
            <div class="d-flex align-items-center gap-3">
                <div class="text-end d-none d-md-block">
                    <a href="profilUser.html" class="text-decoration-none text-theme">
                        <div class="fw-bold small">\${auth.username || auth.pseudo}</div>
                        <div class="x-small opacity-50">MON PROFIL</div>
                    </a>
                </div>
                <button onclick="sessionStorage.removeItem('auth'); window.location.reload();" class="btn btn-outline-danger rounded-pill px-3 btn-sm fw-bold">QUITTER</button>
            </div>\`;
    } else {
        c.innerHTML = \`<a href="../connexion/connexion.html" class="btn btn-primary rounded-pill px-4 fw-bold btn-sm">CONNEXION</a>\`;
    }
</script>
<script src="../theme.js"></script>
</body>
</html>`;

fs.writeFileSync('PROJET_TM/Films/companies-browse.html', companiesHtml, 'utf8');
console.log('companies-browse.html rewritten');

// --- 2. Patch companies-browse.js to output premium-card HTML ---
let jsPath = 'PROJET_TM/Films/companies-browse.js';
if(fs.existsSync(jsPath)) {
    let jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // We will replace the generateCompanyCard function body
    const newGenerateCardsHtml = `function generateCompanyCard(company) {
    const hasLogo = company.logo_path !== null;
    const logoUrl = hasLogo ? \`\${IMG_URL}\${company.logo_path}\` : 'https://via.placeholder.com/300x150?text=Logo+Non+Disponible';
    const country = company.origin_country || 'Inconnu';
    const hq = company.headquarters || 'Non spécifié';

    return \`
        <a href="company-details.html?id=\${company.id}" class="company-card-premium text-decoration-none">
            <div class="company-logo-wrapper">
                <img src="\${logoUrl}" class="company-logo" alt="\${company.name}">
            </div>
            <div class="company-name text-truncate">\${company.name}</div>
            <div class="company-country"><i class="ph-fill ph-globe-hemisphere-west"></i> \${country}</div>
        </a>
    \`;
}`;

    const funcRegex = /function\s+generateCompanyCard\s*\([^)]*\)\s*\{[\s\S]*?return[\s\S]*?<\/div>\\n\s*`;\s*\}/;
    if (funcRegex.test(jsContent)) {
        jsContent = jsContent.replace(funcRegex, newGenerateCardsHtml);
    } else {
        jsContent += '\n\n' + newGenerateCardsHtml;
    }
    
    fs.writeFileSync(jsPath, jsContent, 'utf8');
    console.log('companies-browse.js rewritten');
}
