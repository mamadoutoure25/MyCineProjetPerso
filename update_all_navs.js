const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

function getDepth(filePath) {
    const relPath = path.relative(rootDir, filePath);
    const depth = relPath.split(path.sep).length - 1;
    return depth;
}

function getPrefix(depth) {
    if (depth === 0) return '';
    if (depth === 1) return '../';
    if (depth === 2) return '../../';
    if (depth === 3) return '../../../';
    return '';
}

function generateNavbar(depth, currentFile) {
    const p = getPrefix(depth);
    
    // Links paths
    const indexLink = depth === 0 ? 'index.html' : p + 'index.html';
    const seriesLink = depth === 0 ? 'series.html' : p + 'series.html';
    
    // For Films directory files (since they are in PROJET_TM/Films)
    const filmsLink = depth === 0 ? 'PROJET_TM/Films/films.html' : (depth === 1 ? '../PROJET_TM/Films/films.html' : (currentFile.includes('PROJET_TM\\\\Films') || currentFile.includes('PROJET_TM/Films') ? 'films.html' : p + 'PROJET_TM/Films/films.html'));
    
    const collectionsLink = depth === 0 ? 'PROJET_TM/Films/collections-browse.html' : (depth === 1 ? '../PROJET_TM/Films/collections-browse.html' : (currentFile.includes('PROJET_TM\\\\Films') || currentFile.includes('PROJET_TM/Films') ? 'collections-browse.html' : p + 'PROJET_TM/Films/collections-browse.html'));
    
    const studiosLink = depth === 0 ? 'PROJET_TM/Films/companies-browse.html' : (depth === 1 ? '../PROJET_TM/Films/companies-browse.html' : (currentFile.includes('PROJET_TM\\\\Films') || currentFile.includes('PROJET_TM/Films') ? 'companies-browse.html' : p + 'PROJET_TM/Films/companies-browse.html'));
    
    const loginLink = depth === 0 ? 'PROJET_TM/connexion/connexion.html' : (depth === 1 ? '../PROJET_TM/connexion/connexion.html' : (currentFile.includes('PROJET_TM\\\\connexion') || currentFile.includes('PROJET_TM/connexion') ? 'connexion.html' : p + 'PROJET_TM/connexion/connexion.html'));

    return `<nav class="navbar navbar-expand-lg fixed-top px-5">
    <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center gap-2" href="${indexLink}" style="font-weight: 900; color: var(--text-primary);">
            <div style="background: linear-gradient(135deg, #a78bfa, #f472b6); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem;">M</div>
            MYCINÉ
        </a>
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
            <i class="ph ph-list fs-2 text-theme"></i>
        </button>
        <div class="collapse navbar-collapse justify-content-center" id="navbarContent">
            <ul class="navbar-nav gap-4">
                <li class="nav-item"><a class="nav-link fw-bold opacity-50 text-theme" href="${indexLink}">ACCUEIL</a></li>
                <li class="nav-item"><a class="nav-link fw-bold opacity-50 text-theme" href="${filmsLink}">FILMS</a></li>
                <li class="nav-item"><a class="nav-link fw-bold opacity-50 text-theme" href="${seriesLink}">SÉRIES</a></li>
                <li class="nav-item"><a class="nav-link fw-bold opacity-50 text-theme" href="${collectionsLink}">COLLECTIONS</a></li>
                <li class="nav-item"><a class="nav-link fw-bold opacity-50 text-theme" href="${studiosLink}">STUDIOS</a></li>
            </ul>
        </div>
        <div class="d-flex align-items-center gap-3">
            <button id="theme-toggle" class="btn btn-link text-theme text-decoration-none px-2 d-flex align-items-center" aria-label="Toggle theme">
                <i class="ph ph-moon fs-4" id="theme-icon"></i>
            </button>
            <div id="auth-section">
                <a href="${loginLink}" class="btn btn-primary rounded-pill px-4 fw-bold btn-sm">CONNEXION</a>
            </div>
        </div>
    </div>
</nav>`;
}

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if(!filePath.includes('.git') && !filePath.includes('node_modules') && !filePath.includes('vendor')) {
                results = results.concat(walkDir(filePath));
            }
        } else if (file.endsWith('.html')) {
            results.push(filePath);
        }
    });
    return results;
}

const htmlFiles = walkDir(rootDir);
let updatedCount = 0;

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Find the entire <nav> block
    const navRegex = /<nav\b[^>]*>[\s\S]*?<\/nav>/i;
    
    if (navRegex.test(content)) {
        const depth = getDepth(file);
        const newNav = generateNavbar(depth, file);
        
        content = content.replace(navRegex, newNav);
        
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated navbar in ${path.relative(rootDir, file)}`);
        updatedCount++;
    }
});

console.log(`\nDone. Updated ${updatedCount} files.`);
