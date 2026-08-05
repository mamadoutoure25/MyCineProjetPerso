const fs = require('fs');

const files = [
    { path: 'index.html', prefix: 'PROJET_TM/Films/' },
    { path: 'series.html', prefix: 'PROJET_TM/Films/' },
    { path: 'PROJET_TM/Films/films.html', prefix: '' },
    { path: 'PROJET_TM/Films/profilUser.html', prefix: '' }
];

files.forEach(fileInfo => {
    if (fs.existsSync(fileInfo.path)) {
        let content = fs.readFileSync(fileInfo.path, 'utf8');
        
        const linkCollections = `<li class="nav-item"><a class="nav-link fw-bold opacity-50 text-theme" href="${fileInfo.prefix}collections-browse.html">COLLECTIONS</a></li>`;
        const linkStudios = `<li class="nav-item"><a class="nav-link fw-bold opacity-50 text-theme" href="${fileInfo.prefix}companies-browse.html">STUDIOS</a></li>`;
        
        // Find where SERIES is added
        const regexSeries = /<li class="nav-item"><a class="nav-link[^>]*href="[^"]*series\.html[^>]*>SÉRIES<\/a><\/li>/i;
        
        if (regexSeries.test(content) && !content.includes('>COLLECTIONS<')) {
            content = content.replace(regexSeries, (match) => {
                return `${match}\n                ${linkCollections}\n                ${linkStudios}`;
            });
            fs.writeFileSync(fileInfo.path, content, 'utf8');
            console.log(`Updated ${fileInfo.path}`);
        }
    }
});
