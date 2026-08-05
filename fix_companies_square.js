const fs = require('fs');

// 1. Update companies-browse.js
let jsPath = 'PROJET_TM/Films/companies-browse.js';
if (fs.existsSync(jsPath)) {
    let jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Replace the generated card class in companies-browse.js
    // It currently outputs: <div class="premium-card company-premium"
    const newAfficherSocietes = `function afficherSocietes(companies) {
    const container = document.getElementById('companies-container');
    const noCompanies = document.getElementById('no-companies');

    if (!companies || companies.length === 0) {
        container.innerHTML = '';
        noCompanies.style.display = 'block';
        return;
    }

    noCompanies.style.display = 'none';

    container.innerHTML = companies
        .map(company => {
            const hasLogo = company.logo_path !== null;
            const logoUrl = hasLogo ? \`\${IMG_BASE_URL}\${company.logo_path}\` : \`https://via.placeholder.com/300x300?text=\${encodeURIComponent(company.name)}\`;
            return \`
        <div class="premium-company-card" onclick="window.location.href='company-details.html?id=\${company.id}'">
            <img src="\${logoUrl}" loading="lazy" alt="\${company.name}">
            <div class="card-details">
                <div class="card-title text-truncate">\${company.name}</div>
                <div class="card-meta">
                    <span class="rating-badge"><i class="ph-fill ph-globe-hemisphere-west"></i> \${company.origin_country || 'Inconnu'}</span>
                </div>
            </div>
        </div>
    \`}).join('');
}`;

    const funcRegex = /function\s+afficherSocietes\s*\([^)]*\)\s*\{[\s\S]*?\}\s*(?=\/\*|$|function)/;
    if (funcRegex.test(jsContent)) {
        jsContent = jsContent.replace(funcRegex, newAfficherSocietes + "\n");
        fs.writeFileSync(jsPath, jsContent, 'utf8');
        console.log("Updated companies-browse.js");
    }
}

// 2. Update companies-browse.html CSS
let htmlPath = 'PROJET_TM/Films/companies-browse.html';
if (fs.existsSync(htmlPath)) {
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    const oldCssRegex = /\/\* Grid for premium cards \*\/[\s\S]*?\[data-theme="light"\] \.company-premium img\s*\{\s*background: rgba\(0, 0, 0, 0\.03\);\s*\}/;
    
    const newCss = `/* Grid for premium cards */
        .movie-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 25px;
            justify-content: center;
        }
        @media (max-width: 1400px) { .movie-grid { grid-template-columns: repeat(5, 1fr); } }
        @media (max-width: 1100px) { .movie-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 800px) { .movie-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 500px) { .movie-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; } }

        /* Custom Premium Card specifically for Studios (Square) */
        .premium-company-card {
            width: 100%;
            min-width: 0;
            max-width: 220px;
            aspect-ratio: 1; /* Square for logos */
            border-radius: 16px;
            overflow: hidden;
            position: relative;
            background: var(--card-bg);
            border: 1px solid var(--border);
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
            margin: 0 auto;
        }

        .premium-company-card:hover {
            transform: scale(1.06) translateY(-10px);
            border-color: var(--accent);
            box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(167, 139, 250, 0.2);
        }

        .premium-company-card img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 30px;
            transition: transform 0.8s ease;
            background: rgba(255, 255, 255, 0.05); /* Slight white tint for dark logos */
        }
        
        [data-theme="light"] .premium-company-card img {
            background: rgba(0, 0, 0, 0.03);
        }

        .premium-company-card:hover img {
            transform: scale(1.1);
        }

        /* Hover Details */
        .premium-company-card .card-details {
            position: absolute;
            inset: 0;
            background: var(--card-details-bg, rgba(15, 23, 42, 0.9));
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 20px;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.4s ease;
            backdrop-filter: blur(4px);
        }

        .premium-company-card:hover .card-details {
            opacity: 1;
            transform: translateY(0);
        }

        .premium-company-card .card-title {
            font-weight: 900;
            font-size: 0.95rem;
            color: var(--text-primary);
            margin-bottom: 5px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }

        .premium-company-card .card-meta {
            display: flex;
            align-items: center;
            gap: 10px;
        }`;
        
    if (oldCssRegex.test(htmlContent)) {
        htmlContent = htmlContent.replace(oldCssRegex, newCss);
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
        console.log("Updated companies-browse.html CSS");
    } else {
        console.log("Could not match CSS block in companies-browse.html");
    }
}
