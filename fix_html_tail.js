const fs = require('fs');

const standardScripts = `
    <!-- Scripts -->
    <script src="js/pwa.js"></script>
    <script src="js/toast.js"></script>
    <script src="js/api.js"></script>
    <script src="js/main.js"></script>
    <script src="js/legal_modals.js?v=6"></script>
</body>
</html>`;

const bareScripts = `
    <!-- Scripts -->
    <script src="js/legal_modals.js?v=6"></script>
</body>
</html>`;

const files = ['index.html', 'cgv.html', 'privacy.html', 'legal.html', 'cookies.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove ANY existing </body>, </html>, and old script blocks at the end
    content = content.replace(/<\/html>[\s\S]*/, '');
    content = content.replace(/<\/body>[\s\S]*/, '');
    content = content.replace(/<!-- Scripts -->[\s\S]*/, '');
    content = content.replace(/<script src="js\/legal_modals\.js\?v=\d+"><\/script>\s*$/, '');
    
    // Append the correct tail
    if (file === 'index.html') {
        content += standardScripts + '\n';
    } else {
        content += bareScripts + '\n';
    }
    
    fs.writeFileSync(file, content);
});
console.log("Fixed HTML tails!");
