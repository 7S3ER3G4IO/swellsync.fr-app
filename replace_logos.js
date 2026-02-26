const fs = require('fs');
const glob = require('glob');

const SVG_LOGO_L = `<img src="assets/images/swellsync_icon.svg" alt="SwellSync Logo" class="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(0,186,214,0.4)]">`;

glob.sync('*.html').forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Replace old favicons with the new SVG
    content = content.replace(/<link rel=\"apple-touch-icon\" href=\"https:\/\/cdn-icons-png\.flaticon\.com\/512\/3144\/3144810\.png\">/g,
        '<link rel="apple-touch-icon" href="assets/images/swellsync_icon.svg">\n    <link rel="icon" type="image/svg+xml" href="assets/images/swellsync_icon.svg">\n    <link rel="shortcut icon" href="assets/images/swellsync_icon.svg">');

    // Replace material icons logo 
    let replaced1 = content.replace(/<span class=\"material-symbols-outlined text-primary text-3xl group-hover:rotate-12 transition-transform\">waves<\/span>/g, SVG_LOGO_L);
    let replaced2 = replaced1.replace(/<span class=\"material-symbols-outlined text-primary text-3xl\">waves<\/span>/g, SVG_LOGO_L);

    if (content !== replaced2) {
        fs.writeFileSync(file, replaced2);
        console.log('Updated ' + file);
    }
});
