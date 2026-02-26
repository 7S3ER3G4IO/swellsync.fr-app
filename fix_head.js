const fs = require('fs');

const headContent = `<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>SwellSync | Légal</title>
    <!-- TailwindCSS pour la DA demandée -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,typography,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <!-- Meta-Tags Web App & PWA Manifest -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#0f2123">
    <!-- Optimisations Mobile pures Apple -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="SwellSync">
    <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/3144/3144810.png">
    <!-- Nos styles personnels (Pour les Toasts Custom et variables) -->
    <link rel="stylesheet" href="css/styles.css">
    <!-- FontAwesome pour les logos de marques -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

    <script id="tailwind-config">
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
</head>`;

const files = ['cgv.html', 'privacy.html', 'legal.html', 'cookies.html'];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/<head>[\s\S]*?<\/head>/g, headContent);
    fs.writeFileSync(file, content);
});
console.log("HEAD completely replaced in all legal files.");
