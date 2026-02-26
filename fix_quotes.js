const fs = require('fs');
const files = ['index.html', 'cgv.html', 'privacy.html', 'legal.html', 'cookies.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\\'/g, "'");
    fs.writeFileSync(file, content);
});
console.log("Fixed literal backslashes in onclicks.");
