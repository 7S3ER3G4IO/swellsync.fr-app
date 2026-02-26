const fs = require('fs');

const configScript = `    <script id="tailwind-config">
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
                        "sans": ["Lexend", "sans-serif"],
                        "display": ["Lexend", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "1rem",
                        "lg": "2rem",
                        "xl": "3rem",
                        "full": "9999px"
                    }
                }
            }
        }
    </script>
    <!-- TailwindCSS pour la DA demandée -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>`;

const files = ['index.html', 'cgv.html', 'privacy.html', 'legal.html', 'cookies.html'];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove old tailwind-config block
    content = content.replace(/<script id="tailwind-config">[\s\S]*?<\/script>/, '');
    // Remove old tailwind css script
    content = content.replace(/<!-- TailwindCSS pour la DA demandée -->\s*<script src="https:\/\/cdn\.tailwindcss\.com[\s\S]*?<\/script>/, '');
    content = content.replace(/<script src="https:\/\/cdn\.tailwindcss\.com[\s\S]*?<\/script>/, '');

    // Insert new config before </head> or right after title
    content = content.replace(/<title>(.*?)<\/title>/, `<title>$1</title>\n${configScript}`);
    
    fs.writeFileSync(file, content);
});
console.log("Fixed Tailwind execution order (Config FIRST, then Script) across all HTML files.");
