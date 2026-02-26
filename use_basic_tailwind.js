const fs = require('fs');

const files = ['cgv.html', 'privacy.html', 'legal.html', 'cookies.html'];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // REMOVE plugins=...,typography,... so it matches index.html
    content = content.replace(
        '<script src="https://cdn.tailwindcss.com?plugins=forms,typography,container-queries"></script>', 
        '<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>'
    );
    // AND ALSO MOVE tailwind-config ABOVE tailwindcdn
    
    // First let's just make it identical to index.html load order
    fs.writeFileSync(file, content);
});
console.log("Replaced with basic tailwind CDN in all 4 legal pages");
