const fs = require('fs');

const files = ['index.html', 'cgv.html', 'privacy.html', 'legal.html', 'cookies.html'];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace <a href="javascript:void(0)" onclick="..."> with <button onclick="..." class="text-left w-full ...">
    content = content.replace(/<a href="javascript:void\(0\)" onclick="openLegalModal\('cgv'\)" class="(.*?)">(.*?)<\/a>/g, 
                             '<button onclick="openLegalModal(\\\'cgv\\\')" class="text-left $1">$2</button>');
    content = content.replace(/<a href="javascript:void\(0\)" onclick="openLegalModal\('privacy'\)" class="(.*?)">(.*?)<\/a>/g, 
                             '<button onclick="openLegalModal(\\\'privacy\\\')" class="text-left $1">$2</button>');
    content = content.replace(/<a href="javascript:void\(0\)" onclick="openLegalModal\('legal'\)" class="(.*?)">(.*?)<\/a>/g, 
                             '<button onclick="openLegalModal(\\\'legal\\\')" class="text-left $1">$2</button>');
    content = content.replace(/<a href="javascript:void\(0\)" onclick="openLegalModal\('cookies'\)" class="(.*?)">(.*?)<\/a>/g, 
                             '<button onclick="openLegalModal(\\\'cookies\\\')" class="text-left $1">$2</button>');                             
                             
    fs.writeFileSync(file, content);
});
console.log("Converted a tags to buttons for CSP safety.");
