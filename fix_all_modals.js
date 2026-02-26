const fs = require('fs');

const modalHTML = `
    <!-- Légal Modals Container -->
    <div id="legal-modal-backdrop" class="fixed inset-0 bg-background-dark/90 backdrop-blur-md z-[100] hidden items-center justify-center p-4 md:p-8 opacity-0 transition-opacity duration-300">
        <div id="legal-modal-container" class="bg-background-dark border border-white/10 rounded-[2rem] w-full max-w-4xl max-h-full overflow-y-auto custom-scrollbar relative transform scale-95 transition-transform duration-300 shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex flex-col">
            <div class="w-full flex justify-end p-6 border-b border-white/5 sticky top-0 bg-background-dark/90 backdrop-blur z-20">
                <button onclick="closeLegalModal()" class="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div id="legal-modal-content" class="p-8 md:p-12 w-full">
                <!-- Injected via JS -->
            </div>
        </div>
    </div>
    <!-- Script Modal -->
    <script src="js/legal_modals.js?v=4"></script>
`;

const newFooterLinks = `
                <!-- Colonne 3 : Légal -->
                <div class="flex flex-col gap-4">
                    <h4 class="text-white font-bold uppercase tracking-widest text-sm mb-2">Légal</h4>
                    <a href="javascript:void(0)" onclick="openLegalModal('cgv')" class="text-sm hover:text-primary transition-colors">Conditions Générales (CGV)</a>
                    <a href="javascript:void(0)" onclick="openLegalModal('privacy')" class="text-sm hover:text-primary transition-colors">Politique de Confidentialité</a>
                    <a href="javascript:void(0)" onclick="openLegalModal('legal')" class="text-sm hover:text-primary transition-colors">Mentions Légales</a>
                    <a href="javascript:void(0)" onclick="openLegalModal('cookies')" class="text-sm hover:text-primary transition-colors">Gérer mes Cookies</a>
                </div>
`;

const files = ['index.html', 'cgv.html', 'privacy.html', 'legal.html', 'cookies.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Replace footer links completely
    const regexFooterLinks = /<!-- Colonne 3 : Légal -->[\s\S]*?<\/div>\s*<!-- Colonne 4 : Support -->/g;
    content = content.replace(regexFooterLinks, newFooterLinks + '                <!-- Colonne 4 : Support -->');
    
    // Replace old modal HTML and scripts in index if exists
    content = content.replace(/<!-- Légal Modals Container -->[\s\S]*?<script src="js\/legal_modals\.js(\?v=\d+)?"><\/script>/, '');

    // Replace before </body>
    content = content.replace(/<\/body>/, modalHTML + '\n</body>');
    
    fs.writeFileSync(file, content);
});
console.log("Modals injected perfectly with javascript:void(0) to bypass preventDefault issues!");
