const fs = require('fs');

let content = fs.readFileSync('series.html', 'utf8');

// 1. Wrap auth-section and add button
if (!content.includes('id="theme-toggle"')) {
    let match = content.match(/<div[^>]*id="auth-section"[^>]*>/);
    if (match) {
        let originalAuthDiv = match[0];
        let replacement = `
        <div class="d-flex align-items-center gap-3">
            <button id="theme-toggle" class="btn btn-link text-theme text-decoration-none px-2 d-flex align-items-center" aria-label="Toggle theme">
                <i class="ph ph-moon fs-4" id="theme-icon"></i>
            </button>
            ${originalAuthDiv}`;
        
        content = content.replace(originalAuthDiv, replacement);
        content = content.replace(/(<\/div>\s*<\/div>\s*<\/nav>)/, '</div>$1');
    }
}

// 2. Add data-theme="dark"
if (content.includes('<html') && !content.includes('data-theme=')) {
    content = content.replace(/<html([^>]*)>/i, '<html$1 data-theme="dark">');
}

// 3. Inject theme.js at the bottom
if (!content.includes('theme.js')) {
    content = content.replace(/<\/body>/i, `<script src="PROJET_TM/theme.js"></script>\n</body>`);
}

// 4. Inject theme-variables.css link
if (!content.includes('theme-variables.css')) {
    content = content.replace(/<\/head>/i, `<link rel="stylesheet" href="PROJET_TM/Films/theme-variables.css">\n</head>`);
}

// 5. Replace colors
content = content.replace(/\btext-white\b/g, 'text-theme');
content = content.replace(/\bbg-dark\b/g, 'bg-theme');

fs.writeFileSync('series.html', content, 'utf8');
console.log('Fixed series.html');
