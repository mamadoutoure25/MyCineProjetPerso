const fs = require('fs');

// 1. Fix collections-browse.js
let cbPath = 'PROJET_TM/Films/collections-browse.js';
if (fs.existsSync(cbPath)) {
    let jsContent = fs.readFileSync(cbPath, 'utf8');
    
    const newRender = `function renderCollections(collectionsToDisplay) {
  const grid = document.getElementById("collections-grid");
  const noCollectionsDiv = document.getElementById("no-collections");

  if (collectionsToDisplay.length === 0) {
    grid.style.display = "none";
    noCollectionsDiv.style.display = "block";
    return;
  }
  
  grid.innerHTML = generateCardsHTML(collectionsToDisplay);
  
  noCollectionsDiv.style.display = "none";
  grid.style.display = "grid";
}`;

    // Regex to replace the renderCollections function
    const renderRegex = /function\s+renderCollections\s*\([^)]*\)\s*\{[\s\S]*?grid\.style\.display\s*=\s*"grid"\n?\}/;
    if (renderRegex.test(jsContent)) {
        jsContent = jsContent.replace(renderRegex, newRender);
        fs.writeFileSync(cbPath, jsContent, 'utf8');
        console.log('Fixed collections-browse.js');
    }
}

// 2. Fix collection.js
let cPath = 'PROJET_TM/Films/collection.js';
if (fs.existsSync(cPath)) {
    let jsContent = fs.readFileSync(cPath, 'utf8');
    
    // We want to replace renderMovies body inside afficherFilms
    // We can just regex replace the string that builds the movie-card
    const oldMovieCardRegex = /<div class="movie-card"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/; // Might be hard to match. Let's just find the map() and replace it.
    
    const newMovieCard = `
      <div class="premium-card" onclick="window.location.href='movie-details.html?id=\${movie.id}'">
        <img src="\${movie.poster_path ? \`\${CONFIG.IMAGE_BASE_URL}/\${CONFIG.POSTER_SIZE}\${movie.poster_path}\` : 'https://via.placeholder.com/500x750?text=Aucune+affiche'}" 
             alt="\${movie.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750?text=Image+indisponible'">
        <div class="card-details">
            <div class="card-title text-truncate">\${movie.title}</div>
            <div class="card-meta">
                <span class="rating-badge"><i class="ph-fill ph-star"></i> \${movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
            </div>
        </div>
      </div>
    `;
    
    // In collection.js, find: moviesGrid.innerHTML = moviesToRender.map(movie => `...`).join("")
    // Let's replace everything inside the map callback.
    const mapRegex = /moviesGrid\.innerHTML\s*=\s*moviesToRender\.map\s*\(\s*movie\s*=>\s*`([\s\S]*?)`\s*\)\.join\(\s*""\s*\)/;
    if (mapRegex.test(jsContent)) {
        jsContent = jsContent.replace(mapRegex, `moviesGrid.innerHTML = moviesToRender.map(movie => \`${newMovieCard}\`).join("")`);
        
        // Also update moviesGrid class to movie-grid (since it used movies-grid)
        jsContent = jsContent.replace(/moviesGrid\.className\s*=\s*"movies-grid"/g, `moviesGrid.className = "movie-grid"`);
        
        fs.writeFileSync(cPath, jsContent, 'utf8');
        console.log('Fixed collection.js cards');
    }
}

// 3. Update collection.html to include premium-home.css and fix grid class
let chPath = 'PROJET_TM/Films/collection.html';
if (fs.existsSync(chPath)) {
    let content = fs.readFileSync(chPath, 'utf8');
    
    if (!content.includes('premium-home.css')) {
        content = content.replace('<link rel="stylesheet" href="collection.css">', '<link rel="stylesheet" href="collection.css">\n    <link rel="stylesheet" href="premium-home.css">');
    }
    
    // Add grid styling in style block if missing, or use movie-grid
    if (!content.includes('.movie-grid {')) {
        const gridCSS = `
    <style>
        .movie-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 20px;
            padding: 20px 0;
        }
        @media (max-width: 1400px) { .movie-grid { grid-template-columns: repeat(5, 1fr); } }
        @media (max-width: 1100px) { .movie-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 800px) { .movie-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 500px) { .movie-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; } }
        .movie-grid .premium-card {
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
        }
    </style>
        `;
        content = content.replace('</head>', `${gridCSS}\n</head>`);
    }
    
    fs.writeFileSync(chPath, content, 'utf8');
    console.log('Fixed collection.html');
}
