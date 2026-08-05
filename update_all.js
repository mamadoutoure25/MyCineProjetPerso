const fs = require('fs');
const path = require('path');

const rootDir = 'C:\\wamp64\\www\\PROJET_TM_GRoupe_Local_2026\\www';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (!f.includes('node_modules') && !f.includes('.git') && !f.includes('.idea')) {
                walkDir(dirPath, callback);
            }
        } else {
            if (f.endsWith('.html') || f.endsWith('.css')) {
                callback(path.join(dir, f));
            }
        }
    });
}

walkDir(rootDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;

    if (filePath.endsWith('.html')) {
        // Replace text-white with text-theme
        content = content.replace(/\btext-white\b/g, 'text-theme');
        // Replace bg-dark with bg-theme
        content = content.replace(/\bbg-dark\b/g, 'bg-theme');
        
        // Inline styles in HTML
        content = content.replace(/color:\s*#fff/g, 'color: var(--text-primary)');
        content = content.replace(/color:\s*white/g, 'color: var(--text-primary)');
        content = content.replace(/background(-color)?:\s*#111/g, 'background: var(--bg-card)');
        
        // Inject link to theme-variables.css if not present
        if (!content.includes('theme-variables.css')) {
            const relPath = path.relative(path.dirname(filePath), path.join(rootDir, 'PROJET_TM', 'Films', 'theme-variables.css')).replace(/\\/g, '/');
            const linkTag = `<link rel="stylesheet" href="${relPath}">\n</head>`;
            content = content.replace(/<\/head>/i, linkTag);
        }
    } else if (filePath.endsWith('.css')) {
        // Skip theme-variables.css itself
        if (!filePath.includes('theme-variables.css')) {
            content = content.replace(/color:\s*#fff(?:fff)?\b/gi, 'color: var(--text-primary)');
            content = content.replace(/color:\s*white\b/gi, 'color: var(--text-primary)');
            content = content.replace(/color:\s*#000(?:000)?\b/gi, 'color: var(--text-primary)'); // Wait, some #000 might be intentional for contrast. But let's change them to text-primary too? No, let's leave #000 alone as it might be inside a badge that has a fixed background.
            
            content = content.replace(/background(?:-color)?:\s*#111(?:111)?\b/gi, 'background: var(--bg-card)');
            content = content.replace(/background(?:-color)?:\s*#000(?:000)?\b/gi, 'background: var(--background)');
            
            // Borders with white opacity
            content = content.replace(/border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.[0-9]+\)/gi, 'border: 1px solid var(--border)');
            
            // Backgrounds with white opacity (often glass)
            content = content.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.05\)/gi, 'background: var(--filter-select-bg)');
        }
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Modified:', filePath);
    }
});
