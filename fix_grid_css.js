const fs = require('fs');

const filesToFix = [
    'PROJET_TM/Films/collections-browse.html',
    'PROJET_TM/Films/companies-browse.html',
    'PROJET_TM/Films/collection.html'
];

const oldGridCssRegex = /\.movie-grid\s*\{[\s\S]*?@media[^}]*\}[^}]*\}[^}]*\}[^}]*\}/g; 
// Actually, it's safer to just replace everything between .movie-grid { and the end of the style block.
// Or we can just read the file and replace the whole block.

filesToFix.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // Let's replace the grid CSS block.
        // In collections-browse.html, it's:
        // .movie-grid { ... }
        // @media ...
        // @media ...
        // @media ...
        // @media ...
        
        // We can just find `.movie-grid {` and replace it and the medias.
        // It's easier to use string replace for the exact known block, but the block differs slightly per file.
        // Let's use regex to clear out old `.movie-grid` rules and insert the new one.
        
        const cssToReplace = / \/\* 6 Column Grid for premium cards \*\/[\s\S]*?\.movie-grid \.premium-card \{[\s\S]*?min-width: 0 !important;\s*\}/;
        
        const newCSS = `/* Auto-fill Grid for premium cards */
        .movie-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 25px 20px;
            justify-content: center;
        }
        .movie-grid .premium-card {
            width: 100% !important;
            max-width: 220px !important;
            min-width: 0 !important;
            margin: 0 auto;
        }`;
        
        if (content.includes('/* 6 Column Grid for premium cards */')) {
             content = content.replace(cssToReplace, newCSS);
             console.log(`Replaced CSS in ${file}`);
        } else if (content.includes('.movie-grid {')) {
             // Fallback for collection.html
             content = content.replace(/\.movie-grid \{[\s\S]*?min-width: 0 !important;\s*\}/, newCSS);
             console.log(`Replaced fallback CSS in ${file}`);
        }
        
        fs.writeFileSync(file, content, 'utf8');
    }
});
