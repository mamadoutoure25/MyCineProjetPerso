const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            content = content.replace(/language=${localStorage.getItem('user_lang') || 'fr-FR'}/g, "language=${localStorage.getItem('user_lang') || 'fr-FR'}");
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log("Updated", fullPath);
            }
        }
    }
}
replaceInDir('c:/wamp64/www/MyCineProjetPerso/www');
console.log("Done");
