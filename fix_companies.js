const fs = require('fs');

// 1. Update companies-browse.js
let jsPath = 'PROJET_TM/Films/companies-browse.js';
if (fs.existsSync(jsPath)) {
    let jsContent = fs.readFileSync(jsPath, 'utf8');
    
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
            const logoUrl = hasLogo ? \`\${IMG_BASE_URL}\${company.logo_path}\` : \`https://via.placeholder.com/300x450?text=\${encodeURIComponent(company.name)}\`;
            return \`
        <div class="premium-card company-premium" onclick="window.location.href='company-details.html?id=\${company.id}'">
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

    // Regex to replace the function body of afficherSocietes
    const funcRegex = /function\s+afficherSocietes\s*\([^)]*\)\s*\{[\s\S]*?\}\s*(?=\/\*|$|function)/;
    if (funcRegex.test(jsContent)) {
        jsContent = jsContent.replace(funcRegex, newAfficherSocietes + "\n");
        fs.writeFileSync(jsPath, jsContent, 'utf8');
        console.log("Updated companies-browse.js");
    } else {
        console.log("Could not match afficherSocietes in companies-browse.js");
    }
}

// 2. Update companies-browse.html CSS and Grid
let htmlPath = 'PROJET_TM/Films/companies-browse.html';
if (fs.existsSync(htmlPath)) {
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Change id="companies-container" class="company-grid" to class="movie-grid"
    htmlContent = htmlContent.replace(/class="company-grid"/g, 'class="movie-grid"');
    
    // Ensure premium-home.css is linked
    if (!htmlContent.includes('premium-home.css')) {
        htmlContent = htmlContent.replace(/<link rel="stylesheet" href="theme-variables.css">/, '<link rel="stylesheet" href="premium-home.css">\n    <link rel="stylesheet" href="theme-variables.css">');
    }
    
    // Replace the specific CSS block for companies
    const oldCssRegex = /\.company-grid\s*\{[\s\S]*?\.company-country\s*\{[\s\S]*?\}\s*\}/;
    
    const newCss = `.movie-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 25px;
            justify-content: center;
        }
        .movie-grid .premium-card {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 220px !important;
            margin: 0 auto;
        }
        @media (max-width: 1400px) { .movie-grid { grid-template-columns: repeat(5, 1fr); } }
        @media (max-width: 1100px) { .movie-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 800px) { .movie-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 500px) { .movie-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; } }

        .company-premium img {
            object-fit: contain !important;
            padding: 30px;
            background: rgba(255,255,255,0.05);
        }`;
        
    if (oldCssRegex.test(htmlContent)) {
        htmlContent = htmlContent.replace(oldCssRegex, newCss);
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
        console.log("Updated companies-browse.html CSS");
    } else {
        console.log("Could not match CSS block in companies-browse.html");
    }
}
