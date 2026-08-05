const fs = require('fs');

const files = [
    'PROJET_TM/Films/collections-browse.html',
    'PROJET_TM/Films/collection.html'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        const newCSS = `/* Exact Premium Card Grid Matching index.html dimensions */
        .movie-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 25px;
            justify-items: center; /* Ensures the 200px fixed cards center nicely in whatever column width */
        }`;
        
        // Remove the old CSS block that I added in fix_grid_css.js
        const regex = /\/\* Auto-fill Grid for premium cards \*\/[\s\S]*?margin: 0 auto;\s*\}/;
        if (regex.test(content)) {
            content = content.replace(regex, newCSS);
            fs.writeFileSync(file, content, 'utf8');
            console.log("Updated " + file);
        }
    }
});
