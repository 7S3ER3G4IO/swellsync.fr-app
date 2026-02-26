const fs = require('fs');

const files = ['index.html', 'cgv.html', 'privacy.html', 'legal.html', 'cookies.html'];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Extract the tailwind-config script block
    const configRegex = /<script id="tailwind-config">[\s\S]*?<\/script>/;
    const configMatch = content.match(configRegex);
    if (!configMatch) return;
    
    const configScript = configMatch[0];
    
    // Remove the block from its current bad position
    content = content.replace(configRegex, '');
    
    // Insert it AFTER the cdn.tailwindcss.com script tag
    const cdnRegex = /(<script src="https:\/\/cdn\.tailwindcss\.com[\s\S]*?<\/script>)/;
    content = content.replace(cdnRegex, `$1\n    ${configScript}`);
    
    fs.writeFileSync(file, content);
});
console.log("Moved config AFTER CDN to prevent ReferenceError!");
