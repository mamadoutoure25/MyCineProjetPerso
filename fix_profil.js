const fs = require('fs');
const path = require('path');

// Fix profilUser.html
let htmlFile = 'PROJET_TM/Films/profilUser.html';
if (fs.existsSync(htmlFile)) {
    let content = fs.readFileSync(htmlFile, 'utf8');
    
    // Replace inline hardcoded backgrounds
    content = content.replace(/background:\s*linear-gradient\(to bottom,\s*#101010 0%,\s*#050505 100%\);/, 'background: linear-gradient(to bottom, var(--bg-secondary) 0%, var(--bg-primary) 100%);');
    content = content.replace(/background:\s*rgba\(255,255,255,0\.05\);/, 'background: var(--filter-select-bg);');
    content = content.replace(/background:\s*linear-gradient\(to top,\s*rgba\(0,0,0,0\.9\)\s*0%,\s*transparent 70%\);/, 'background: var(--card-details-bg);');
    content = content.replace(/border:\s*1px solid rgba\(255,255,255,0\.1\);/g, 'border: 1px solid var(--border);');
    content = content.replace(/background:\s*rgba\(255, 60, 60, 0\.2\);/, 'background: rgba(255, 60, 60, 0.2);');
    content = content.replace(/background:\s*rgba\(0,0,0,0\.5\);/, 'background: var(--glass);');
    
    fs.writeFileSync(htmlFile, content, 'utf8');
    console.log('Fixed profilUser.html');
}

// Fix profilUser.js
let jsFile = 'PROJET_TM/Films/profilUser.js';
if (fs.existsSync(jsFile)) {
    let content = fs.readFileSync(jsFile, 'utf8');
    
    // Replace text-white with text-theme
    content = content.replace(/text-white/g, 'text-theme');
    
    fs.writeFileSync(jsFile, content, 'utf8');
    console.log('Fixed profilUser.js');
}
