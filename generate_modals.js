const fs = require('fs');

const files = {
    'cgv': 'cgv.html',
    'privacy': 'privacy.html',
    'legal': 'legal.html',
    'cookies': 'cookies.html'
};

let jsContent = `
const legalContents = {
`;

for (const [key, file] of Object.entries(files)) {
    let content = fs.readFileSync(file, 'utf8');
    let mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    let htmlPart = mainMatch ? mainMatch[1].replace(/`/g, '\\`').replace(/<h1/, '<h2').replace(/<\/h1>/, '</h2>') : '';
    jsContent += `    '${key}': \`${htmlPart}\`,\n`;
}

jsContent += `};

function openLegalModal(type) {
    const backdrop = document.getElementById('legal-modal-backdrop');
    const contentDiv = document.getElementById('legal-modal-content');
    const container = document.getElementById('legal-modal-container');
    
    if(!backdrop || !contentDiv) return;
    
    contentDiv.innerHTML = legalContents[type] || 'Contenu introuvable';
    
    // Show modal
    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex');
    
    // Animation
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        container.classList.remove('scale-95');
        container.classList.add('scale-100');
    }, 10);
}

function closeLegalModal() {
    const backdrop = document.getElementById('legal-modal-backdrop');
    const container = document.getElementById('legal-modal-container');
    
    if(!backdrop) return;
    
    // Animation
    backdrop.classList.add('opacity-0');
    container.classList.remove('scale-100');
    container.classList.add('scale-95');
    
    setTimeout(() => {
        backdrop.classList.remove('flex');
        backdrop.classList.add('hidden');
    }, 300);
}
`;

fs.writeFileSync('js/legal_modals.js', jsContent);
console.log("js/legal_modals.js has been generated.");
