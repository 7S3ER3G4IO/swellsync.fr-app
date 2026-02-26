const fs = require('fs');

const standardScripts = `
    <!-- Scripts -->
    <script src="js/pwa.js"></script>
    <script src="js/toast.js"></script>
    <script src="js/api.js"></script>
    <script src="js/main.js"></script>
    <script src="js/legal_modals.js?v=5"></script>
</body>`;

const bareScripts = `
    <!-- Scripts -->
    <script src="js/legal_modals.js?v=5"></script>
</body>`;

const files = ['index.html', 'cgv.html', 'privacy.html', 'legal.html', 'cookies.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // remove the solitary modal script and generic empty space
    content = content.replace(/<!-- Script Modal -->\s*<script src="js\/legal_modals\.js\?v=\d+"><\/script>\s*<\/body>/, '');
    content = content.replace(/<\/body>/, '');
    
    if (file === 'index.html') {
        content += standardScripts + '\n';
    } else {
        content += bareScripts + '\n';
    }
    
    fs.writeFileSync(file, content);
});
console.log("Restored main scripts to index.html and cleaned up others!");
