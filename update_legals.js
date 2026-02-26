const fs = require('fs');
const files = ['cgv.html', 'privacy.html', 'legal.html', 'cookies.html'];

const tailwindConfig = `    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <link rel="stylesheet" href="css/styles.css">
    <script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#00bad6",
                        "background-light": "#f5f8f8",
                        "background-dark": "#0f2123",
                    },
                    fontFamily: {
                        "display": ["Lexend", "sans-serif"]
                    }
                }
            }
        }
    </script>`;

const footerHTML = `
    <!-- Footer Professionnel -->
    <footer class="bg-[#0a1516] text-slate-400 py-16 border-t border-white/5 mt-12 w-full">
        <div class="max-w-7xl mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-white/5 pb-12">
                <div class="flex flex-col gap-4">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-3xl">waves</span>
                        <span class="font-display font-black text-xl text-white tracking-tight">Swell<span class="text-primary">Sync</span></span>
                    </div>
                    <p class="text-sm leading-relaxed mt-2">La plateforme de prévision de surf la plus technologique du marché. Surf smart, ride hard.</p>
                    <div class="flex gap-4 mt-4">
                         <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-xl"><i class="fa-brands fa-instagram"></i></a>
                         <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-xl"><i class="fa-brands fa-tiktok"></i></a>
                         <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-xl"><i class="fa-brands fa-x-twitter"></i></a>
                    </div>
                </div>
                <div class="flex flex-col gap-4">
                    <h4 class="text-white font-bold uppercase tracking-widest text-sm mb-2">SwellSync</h4>
                    <a href="index.html" class="text-sm hover:text-primary transition-colors">La Carte Interactive</a>
                    <a href="#" class="text-sm hover:text-primary transition-colors">Spots Tendances</a>
                    <a href="#" class="text-sm hover:text-primary transition-colors">Abonnement PRO</a>
                </div>
                <div class="flex flex-col gap-4">
                    <h4 class="text-white font-bold uppercase tracking-widest text-sm mb-2">Légal</h4>
                    <a href="cgv.html" class="text-sm hover:text-primary transition-colors">Conditions Générales (CGV)</a>
                    <a href="privacy.html" class="text-sm hover:text-primary transition-colors">Politique de Confidentialité</a>
                    <a href="legal.html" class="text-sm hover:text-primary transition-colors">Mentions Légales</a>
                    <a href="cookies.html" class="text-sm hover:text-primary transition-colors">Gérer mes Cookies</a>
                </div>
                <div class="flex flex-col gap-4">
                    <h4 class="text-white font-bold uppercase tracking-widest text-sm mb-2">Assistance</h4>
                    <p class="text-sm mb-2">Notre équipe est basée à Hossegor, France. Nous répondons en moins de 24h.</p>
                    <a href="mailto:support@swellsync.com" class="text-primary font-bold hover:underline flex items-center gap-2 text-sm">
                         <span class="material-symbols-outlined text-[16px]">mail</span>
                         support@swellsync.com
                    </a>
                </div>
            </div>
            <div class="flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-medium">
                <p>&copy; 2026 SwellSync Technology. Tous droits réservés.</p>
                <div class="flex items-center gap-2 mt-4 md:mt-0">
                     <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                     Serveurs Opérationnels (99.9% Uptime)
                </div>
            </div>
        </div>
    </footer>
</body>`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace Head
    content = content.replace(
        /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>[\s\S]*?<link rel="stylesheet" href="css\/styles\.css">/,
        tailwindConfig
    );
    
    // Replace Footer
    content = content.replace(/<\/body>/, footerHTML);
    
    fs.writeFileSync(file, content);
});
console.log("Les pages ont été mises à jour avec TailwindConfig et le vrai Footer.");
