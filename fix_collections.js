const fs = require('fs');

let cbPath = 'PROJET_TM/Films/collections-browse.js';
if (fs.existsSync(cbPath)) {
    let jsContent = fs.readFileSync(cbPath, 'utf8');
    
    const regex = /grid\.innerHTML = collectionsToDisplay\.map\(collection => `([\s\S]*?)`\)\.join\(''\)/;
    
    const newCode = `grid.innerHTML = collectionsToDisplay.map(collection => \`
        <div class="premium-card" onclick="window.location.href='collection.html?id=\${collection.id}'">
            <img src="\${collection.poster_path ? \`\${COLLECTIONS_CONFIG.IMAGE_BASE_URL}/\${COLLECTIONS_CONFIG.POSTER_SIZE}\${collection.poster_path}\` : 'https://via.placeholder.com/500x750?text=Affiche+indisponible'}" loading="lazy" alt="\${collection.name}">
            <div class="card-details">
                <div class="card-title text-truncate">\${collection.name}</div>
                <div class="card-meta">
                    <span class="rating-badge"><i class="ph-fill ph-stack"></i> \${collection.parts ? collection.parts.length : 0} FILMS</span>
                </div>
            </div>
        </div>
    \`).join('')`;
    
    if (regex.test(jsContent)) {
        jsContent = jsContent.replace(regex, newCode);
        
        // Ensure moviesGrid class matches .movie-grid if we need to? No, collections-browse uses #collections-grid
        
        fs.writeFileSync(cbPath, jsContent, 'utf8');
        console.log("Successfully replaced cards using regex in collections-browse.js!");
    } else {
        console.log("Regex failed in collections-browse.js!");
    }
}
