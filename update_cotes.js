const fs = require('fs');

const htmlInput = `
<section class="mb-16 relative" data-purpose="region-map-selector">
<div class="flex flex-col items-center mb-12 mt-12">
<div class="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] font-bold tracking-widest text-primary mb-6 uppercase">
<span class="w-2 h-2 bg-primary rounded-full animate-pulse"></span> Réseau Mondial
</div>
<h2 class="text-5xl font-bold mb-4 text-white">Carte <span class="text-primary">En Direct</span></h2>
<p class="text-slate-400 max-w-2xl text-center leading-relaxed">Explorez notre liste de spots de surf premiums à travers le monde. Conditions en temps réel vérifiées et garanties à <span class="text-primary font-bold">100%</span> par nos 12 modèles météorologiques.</p>
</div>
<!-- Simulated 3D Map Container -->
<div class="relative w-full aspect-[21/9] rounded-[2.5rem] overflow-hidden glass border border-primary/20 flex flex-col items-center justify-center group shadow-[0_0_50px_rgba(0,186,214,0.15)] bg-background-dark/50 p-4">
<!-- Interactive Leaflet Map -->
<div id="surf-map" class="w-full h-full rounded-[2rem] z-10 flex-grow border border-white/5"></div>
<!-- Badge superposé -->
<div class="absolute top-8 right-8 z-[400] glass px-4 py-2 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-lg">
    <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
    SYNCHRONISÉ
</div>
<!-- Top Left Control overlay -->
<div class="absolute top-8 left-8 z-[400] glass px-6 py-3 rounded-full border-white/10 pointer-events-auto flex items-center gap-6">
    <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">SATELLITE LINK ACTIVE</span>
    </div>
    <div class="w-px h-4 bg-white/10"></div>
    <div class="flex items-center gap-3">
        <button class="text-[10px] font-bold text-primary hover:text-white transition-colors uppercase tracking-widest">REGIONS</button>
        <button class="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">LAYERS</button>
    </div>
</div>
</div>
</section>
<!-- END: Region Selector Hero -->

<!-- BEGIN: Forecast and Live Widgets -->
<section class="grid grid-cols-1 lg:grid-cols-3 gap-8" id="forecast-details">
<!-- Column 1: Live Weather & Wind (Main Focus) -->
<div class="lg:col-span-1 flex flex-col gap-8">
<!-- Weather Card -->
<div class="glass p-8 rounded-[2rem] glow-button relative overflow-hidden h-full border border-primary/20 bg-gradient-to-br from-background-dark/90 to-background-dark shadow-2xl" data-purpose="weather-widget">
<div class="absolute top-0 right-0 p-6">
<div class="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
<span class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
<span class="text-[10px] font-bold text-primary tracking-widest">EN DIRECT</span>
</div>
</div>
<h3 class="text-xs font-bold text-slate-500 mb-6 uppercase tracking-[0.2em]">Sélection: Biarritz</h3>
<div class="flex items-baseline gap-2 mb-10">
<span class="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">2.4</span>
<span class="text-3xl font-light text-slate-500">m</span>
<div class="ml-4 flex flex-col">
<span class="text-primary font-bold text-xs tracking-wide uppercase">Amélioration</span>
<span class="text-sm text-slate-500">Période 11s</span>
</div>
</div>
<div class="grid grid-cols-2 gap-8 border-t border-primary/10 pt-8 mt-auto">
<div class="flex flex-col gap-1">
<p class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Vent</p>
<p class="text-2xl font-black text-white">6kt <span class="text-[10px] font-bold text-primary uppercase ml-1 block mt-1 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 inline-block text-center max-w-max">Offshore</span></p>
</div>
<div class="flex flex-col gap-1">
<p class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Marée</p>
<p class="text-xl font-black text-white leading-tight">Descen<br/>dante</p>
</div>
</div>
</div>
</div>

<!-- Column 2: Spot List Grid -->
<div class="lg:col-span-2">
<div class="glass border border-primary/20 rounded-[2.5rem] overflow-hidden shadow-2xl h-full flex flex-col" data-purpose="spot-forecast-table">
<div class="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5">
<div class="flex items-center gap-3">
<div class="w-8 h-8 flex items-center justify-center text-primary bg-primary/10 rounded-lg">
<span class="material-symbols-outlined text-[18px]">waves</span>
</div>
<h3 class="font-black tracking-widest text-white uppercase text-lg">NOS 60 SPOTS</h3>
</div>
<div class="flex items-center gap-4">
<button class="flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 text-[10px] font-bold text-primary tracking-widest uppercase bg-primary/5">
<span class="material-symbols-outlined text-[14px]">swipe_up</span> SWIPE
</button>
</div>
</div>
<div class="overflow-x-auto flex-grow">
<table class="w-full text-left">
<thead class="bg-background-dark/80 backdrop-blur-md text-xs text-slate-500 uppercase font-black tracking-widest">
<tr>
<th class="px-8 py-5">Spot Name</th>
<th class="px-6 py-5">Swell</th>
<th class="px-6 py-5">Period</th>
<th class="px-6 py-5">Wind</th>
<th class="px-6 py-5 text-right">Status</th>
</tr>
</thead>
<tbody class="divide-y divide-white/5 font-medium">
<tr class="hover:bg-white/5 transition-colors group cursor-pointer relative overflow-hidden">
<td class="px-8 py-6 font-bold text-white text-lg">Biarritz Grande Plage</td>
<td class="px-6 py-6 text-slate-300">1.8 - 2.5m</td>
<td class="px-6 py-6 text-slate-300">12s</td>
<td class="px-6 py-6 text-primary font-bold">SE 5kts</td>
<td class="px-6 py-6 text-right">
<span class="px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black rounded-full uppercase tracking-widest shadow-[inset_0_0_10px_rgba(0,186,214,0.1)]">Épique</span>
</td>
</tr>
<tr class="hover:bg-white/5 transition-colors group cursor-pointer relative overflow-hidden">
<td class="px-8 py-6 font-bold text-white text-lg">Hossegor La Gravière</td>
<td class="px-6 py-6 text-slate-300">2.0 - 3.0m</td>
<td class="px-6 py-6 text-slate-300">14s</td>
<td class="px-6 py-6 text-primary font-bold">E 8kts</td>
<td class="px-6 py-6 text-right">
<span class="px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black rounded-full uppercase tracking-widest shadow-[inset_0_0_10px_rgba(0,186,214,0.1)]">Épique</span>
</td>
</tr>
<tr class="hover:bg-white/5 transition-colors group cursor-pointer relative overflow-hidden">
<td class="px-8 py-6 font-bold text-white text-lg">Capbreton Le Santocha</td>
<td class="px-6 py-6 text-slate-300">1.5 - 2.0m</td>
<td class="px-6 py-6 text-slate-300">11s</td>
<td class="px-6 py-6 text-green-400 font-bold">NE 10kts</td>
<td class="px-6 py-6 text-right">
<span class="px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black rounded-full uppercase tracking-widest">Très Bon</span>
</td>
</tr>
<tr class="hover:bg-white/5 transition-colors group cursor-pointer relative overflow-hidden">
<td class="px-8 py-6 font-bold text-white text-lg">Anglet Les Cavaliers</td>
<td class="px-6 py-6 text-slate-300">1.8 - 2.4m</td>
<td class="px-6 py-6 text-slate-300">12s</td>
<td class="px-6 py-6 text-primary font-bold">ESE 6kts</td>
<td class="px-6 py-6 text-right">
<span class="px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black rounded-full uppercase tracking-widest shadow-[inset_0_0_10px_rgba(0,186,214,0.1)]">Épique</span>
</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
</section>

<section class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8" data-purpose="advanced-metrics">
<!-- Swell Direction & Energy Card -->
<div class="glass p-8 rounded-[2rem] border border-primary/20 shadow-xl group hover:-translate-y-1 transition-transform relative overflow-hidden">
<div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
<h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Swell Analysis</h4>
<div class="flex items-center justify-between mb-8 relative z-10">
<div class="relative w-24 h-24 border-2 border-primary/20 rounded-full flex items-center justify-center bg-background-dark/50">
<div class="absolute inset-0 rounded-full border border-dashed border-primary/40 animate-[spin_10s_linear_infinite]"></div>
<span class="material-symbols-outlined text-primary text-5xl rotate-[210deg] drop-shadow-[0_0_15px_rgba(0,186,214,0.8)]">navigation</span>
</div>
<div class="text-right">
<p class="text-5xl font-black text-white tracking-tighter">WSW</p>
<p class="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Dir. 210°</p>
<p class="text-xs text-slate-400 mt-2 font-medium bg-white/5 px-2 py-1 rounded inline-block">Énergie: 840 kJ</p>
</div>
</div>
<div class="space-y-3 relative z-10">
<div class="flex justify-between text-[10px] uppercase font-bold text-slate-500"><span>Consistency</span><span class="text-white">74%</span></div>
<div class="w-full h-2 bg-background-dark rounded-full overflow-hidden shadow-inner"><div class="w-3/4 h-full bg-primary shadow-[0_0_10px_rgba(0,186,214,0.8)]"></div></div>
</div>
</div>

<!-- Wind Velocity Graph Card -->
<div class="glass p-8 rounded-[2rem] border border-primary/20 shadow-xl group hover:-translate-y-1 transition-transform relative overflow-hidden">
<div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
<h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Wind Speed (24h)</h4>
<div class="h-28 flex items-end gap-1.5 mb-6 relative z-10">
<div class="flex-1 bg-primary/20 h-1/2 rounded-t hover:bg-primary/40 transition-colors"></div>
<div class="flex-1 bg-primary/30 h-3/4 rounded-t hover:bg-primary/50 transition-colors"></div>
<div class="flex-1 bg-primary/40 h-full rounded-t hover:bg-primary/60 transition-colors"></div>
<div class="flex-1 bg-primary/80 h-[90%] rounded-t shadow-[0_0_15px_rgba(0,186,214,0.5)]"></div>
<div class="flex-1 bg-primary/30 h-1/2 rounded-t hover:bg-primary/50 transition-colors"></div>
<div class="flex-1 bg-primary/20 h-1/3 rounded-t hover:bg-primary/40 transition-colors"></div>
<div class="flex-1 bg-primary/10 h-1/4 rounded-t hover:bg-primary/30 transition-colors"></div>
</div>
<div class="flex justify-between items-end relative z-10">
<div>
<p class="text-4xl font-black text-white leading-none">12 <span class="text-sm text-slate-500 font-bold ml-1">kts</span></p>
<p class="text-[10px] text-primary uppercase font-bold tracking-widest mt-2">Peak Gusts 18kt</p>
</div>
<div class="text-right">
<span class="px-3 py-1 rounded bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20">Offshore</span>
</div>
</div>
</div>

<!-- Tide Chart Card -->
<div class="glass p-8 rounded-[2rem] border border-primary/20 shadow-xl group hover:-translate-y-1 transition-transform relative overflow-hidden">
<div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
<h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Tide Cycles</h4>
<div class="relative h-28 w-full flex items-center relative z-10">
<!-- Use SVG directly for tide line -->
<svg class="w-full h-full text-primary/40 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 20">
<path d="M0,10 Q25,0 50,10 T100,20" fill="none" stroke="currentColor" stroke-dasharray="2 2" stroke-width="0.5"></path>
<circle cx="35" cy="6" fill="#00bad6" r="2" class="animate-pulse shadow-[0_0_10px_rgba(0,186,214,1)]"></circle>
</svg>
<div class="absolute top-[10%] left-[35%] -translate-x-1/2">
<div class="px-2 py-0.5 bg-primary rounded-sm text-[8px] font-black text-background-dark tracking-widest shadow-[0_0_10px_rgba(0,186,214,0.4)]">NOW</div>
</div>
</div>
<div class="grid grid-cols-2 gap-4 mt-6 relative z-10">
<div class="bg-white/5 p-3 rounded-xl border border-white/5">
<p class="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1 flex items-center gap-1"><span class="material-symbols-outlined text-[12px] text-primary">arrow_upward</span> High Tide</p>
<p class="text-xl font-black text-white">14:24 <span class="text-[10px] text-slate-400 align-top ml-1">(3.8m)</span></p>
</div>
<div class="bg-white/5 p-3 rounded-xl border border-white/5">
<p class="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1 flex items-center gap-1"><span class="material-symbols-outlined text-[12px] text-slate-400">arrow_downward</span> Low Tide</p>
<p class="text-xl font-black text-white">20:45 <span class="text-[10px] text-slate-400 align-top ml-1">(0.9m)</span></p>
</div>
</div>
</div>
</section>
`;

let currentHtml = fs.readFileSync('cotes.html', 'utf8');

const startMain = currentHtml.indexOf('<main class="relative z-20 flex-grow flex flex-col px-6 pt-32 pb-24 min-h-screen">');
const endMain = currentHtml.indexOf('</main>', startMain) + 7;

if(startMain !== -1 && endMain !== -1) {
    let replacedHtml = currentHtml.substring(0, startMain) + 
      '<main class="relative z-20 flex-grow flex flex-col max-w-7xl mx-auto px-6 pt-32 pb-24 min-h-screen w-full">\n' + 
      htmlInput + 
      '\n</main>' + 
      currentHtml.substring(endMain);
    fs.writeFileSync('cotes.html', replacedHtml, 'utf8');
    console.log("Updated `cotes.html`");
} else {
    console.log("Could not find <main> in cotes.html");
}

