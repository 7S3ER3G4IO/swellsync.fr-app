// global_search.js
// Logique pour la barre de recherche globale (Command Palette) de SwellSync

const globalSearchIndex = [
    // Spots (Top Spots)
    { id: "blancsablons", title: "Blanc Sablons", type: "Spot Finistère", url: "blancsablons.html", icon: "water" },
    { id: "lapalue", title: "La Palue", type: "Spot Finistère", url: "lapalue.html", icon: "water" },
    { id: "goulien", title: "Goulien", type: "Spot Finistère", url: "goulien.html", icon: "water" },
    { id: "latorche", title: "La Torche", type: "Spot Finistère", url: "latorche.html", icon: "water" },
    { id: "porsarvag", title: "Pors Ar Vag", type: "Spot Finistère", url: "porsarvag.html", icon: "water" },

    // Spots (Côte Atlantique Sud)
    { id: "biarritz", title: "Biarritz (Grande Plage)", type: "Spot Pays Basque", url: "biarritz.html", icon: "water" },
    { id: "hossegor", title: "Hossegor (La Gravière)", type: "Spot Landes", url: "hossegor.html", icon: "water" },
    { id: "seignosse", title: "Seignosse (Les Estagnots)", type: "Spot Landes", url: "seignosse.html", icon: "water" },
    { id: "guethary", title: "Guéthary (Parlementia)", type: "Spot Pays Basque", url: "guethary.html", icon: "water" },
    { id: "lacanau", title: "Lacanau Océan", type: "Spot Gironde", url: "lacanau.html", icon: "water" },
    { id: "capbreton", title: "Capbreton (La Piste)", type: "Spot Landes", url: "capbreton.html", icon: "water" },
    { id: "anglet", title: "Anglet (La Barre)", type: "Spot Pays Basque", url: "anglet.html", icon: "water" },
    { id: "mimizan", title: "Mimizan Plage", type: "Spot Landes", url: "mimizan.html", icon: "water" },
    { id: "biscarrosse", title: "Biscarrosse Plage", type: "Spot Landes", url: "biscarrosse.html", icon: "water" },
    { id: "montalivet", title: "Montalivet", type: "Spot Gironde", url: "montalivet.html", icon: "water" },

    // Pages & Apps
    { id: "page_home", title: "Accueil SwellSync", type: "Page Web", url: "index.html", icon: "home" },
    { id: "page_map", title: "Carte Active & Dashboard", type: "Page App", url: "map.html", icon: "public" },
    { id: "page_cams", title: "Centre Vidéo (Cams)", type: "Page App", url: "cams.html", icon: "videocam" },
    { id: "page_admin", title: "Administration", type: "Management", url: "admin.html", icon: "admin_panel_settings" },

    // Actions rapides
    { id: "action_login", title: "Connexion / Profil", type: "Action", url: "#", icon: "person", action: "openAuthOrProfileModal" },
];

let globalSearchActiveIndex = -1;
let currentSearchResults = [];

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("global-search-input");
    const searchBackdrop = document.getElementById("global-search-backdrop");

    if (searchInput) {
        searchInput.addEventListener("input", handleSearchInput);
        searchInput.addEventListener("keydown", handleSearchKeydown);
    }

    if (searchBackdrop) {
        searchBackdrop.addEventListener("click", (e) => {
            if (e.target === searchBackdrop) {
                closeGlobalSearchModal();
            }
        });
    }

    // Gestion du raccourci clavier global (Ctrl+K ou Cmd+K)
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            openGlobalSearchModal();
        }
    });

});

function openGlobalSearchModal() {
    const backdrop = document.getElementById("global-search-backdrop");
    const container = document.getElementById("global-search-container");
    const input = document.getElementById("global-search-input");

    if (backdrop && container && input) {
        backdrop.classList.remove("hidden");
        // Force reflow
        void backdrop.offsetWidth;

        backdrop.classList.add("opacity-100");
        backdrop.classList.remove("opacity-0");

        container.classList.add("scale-100");
        container.classList.remove("scale-95");

        input.value = "";
        input.focus();

        // Reset state
        globalSearchActiveIndex = -1;
        currentSearchResults = [];
        renderInitialSearchState();
    }
}

function closeGlobalSearchModal() {
    const backdrop = document.getElementById("global-search-backdrop");
    const container = document.getElementById("global-search-container");
    const input = document.getElementById("global-search-input");

    if (backdrop && container) {
        backdrop.classList.remove("opacity-100");
        backdrop.classList.add("opacity-0");

        container.classList.remove("scale-100");
        container.classList.add("scale-95");

        if (input) input.blur();

        setTimeout(() => {
            backdrop.classList.add("hidden");
        }, 300);
    }
}

function renderInitialSearchState() {
    const resultsContainer = document.getElementById("global-search-results");
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
        <div class="text-center py-10 text-slate-500 text-sm font-medium">
            Entrez le nom d'un spot, d'une région ou d'une page... 🏄‍♂️
            <div class="mt-4 flex gap-2 justify-center">
                <span class="bg-white/5 px-3 py-1.5 rounded-full text-xs hover:bg-white/10 cursor-pointer border border-white/5 transition-colors" onclick="document.getElementById('global-search-input').value='Biarritz'; document.getElementById('global-search-input').dispatchEvent(new Event('input'))">Biarritz</span>
                <span class="bg-white/5 px-3 py-1.5 rounded-full text-xs hover:bg-white/10 cursor-pointer border border-white/5 transition-colors" onclick="document.getElementById('global-search-input').value='Admin'; document.getElementById('global-search-input').dispatchEvent(new Event('input'))">Admin</span>
                <span class="bg-white/10 text-white px-3 py-1.5 rounded-full text-xs hover:bg-white/20 cursor-pointer border border-white/20 transition-colors" onclick="document.getElementById('global-search-input').value='Spot'; document.getElementById('global-search-input').dispatchEvent(new Event('input'))">Tous les spots</span>
            </div>
        </div>
    `;
}

function handleSearchInput(e) {
    const query = e.target.value.toLowerCase().trim();
    const resultsContainer = document.getElementById("global-search-results");

    globalSearchActiveIndex = -1; // Reset selection on typing

    if (!query) {
        renderInitialSearchState();
        currentSearchResults = [];
        return;
    }

    currentSearchResults = globalSearchIndex.filter(item => {
        return item.title.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query) ||
            (item.id && item.id.includes(query));
    });

    renderSearchResults();
}

function renderSearchResults() {
    const resultsContainer = document.getElementById("global-search-results");
    if (!resultsContainer) return;

    if (currentSearchResults.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center py-10 text-slate-500 text-sm font-medium">
                Aucun résultat trouvé pour votre recherche. 😔
            </div>
        `;
        return;
    }

    let html = '<div class="flex flex-col gap-1 p-1">';
    currentSearchResults.forEach((result, index) => {
        const isSelected = globalSearchActiveIndex === index;
        const stateClass = isSelected ? "bg-white/10 border-white/20" : "bg-transparent border-transparent hover:bg-white/5";

        let clickHandler = `window.location.href='${result.url}'`;
        if (result.action) {
            clickHandler = `closeGlobalSearchModal(); ${result.action}();`;
        }

        html += `
            <div id="search-result-${index}"
                class="flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${stateClass}"
                onclick="${clickHandler}">
                <div class="w-10 h-10 rounded-full bg-background-dark flex items-center justify-center border border-white/10 shrink-0">
                    <span class="material-symbols-outlined text-primary text-[20px]">${result.icon}</span>
                </div>
                <div class="flex-grow">
                    <h4 class="text-white font-bold text-sm leading-tight uppercase tracking-wide">${result.title}</h4>
                    <p class="text-xs text-primary/70 font-semibold tracking-widest uppercase mt-0.5">${result.type}</p>
                </div>
                <span class="material-symbols-outlined text-slate-500 ${isSelected ? 'text-white' : ''}">chevron_right</span>
            </div>
        `;
    });
    html += '</div>';

    resultsContainer.innerHTML = html;
}

function handleSearchKeydown(e) {
    if (currentSearchResults.length === 0) return;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        globalSearchActiveIndex = (globalSearchActiveIndex + 1) % currentSearchResults.length;
        renderSearchResults();
        scrollToSearchResult(globalSearchActiveIndex);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        globalSearchActiveIndex = (globalSearchActiveIndex - 1 + currentSearchResults.length) % currentSearchResults.length;
        renderSearchResults();
        scrollToSearchResult(globalSearchActiveIndex);
    } else if (e.key === "Enter") {
        e.preventDefault();
        if (globalSearchActiveIndex >= 0 && globalSearchActiveIndex < currentSearchResults.length) {
            triggerSearchResultClick(currentSearchResults[globalSearchActiveIndex]);
        } else if (currentSearchResults.length > 0) { // Default to first item if none selected
            triggerSearchResultClick(currentSearchResults[0]);
        }
    }
}

function scrollToSearchResult(index) {
    const el = document.getElementById("search-result-" + index);
    if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

function triggerSearchResultClick(result) {
    if (result.action) {
        closeGlobalSearchModal();
        window[result.action]();
    } else {
        window.location.href = result.url;
    }
}
