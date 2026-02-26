#!/usr/bin/env python3
"""
SwellSync — Injection data-i18n v2 — recherche par pattern de texte exact
"""
import re, os

BASE = os.path.dirname(os.path.abspath(__file__))

# Correspondances EXACTES : texte fr → clé i18n
# Plus précis, basé sur des fragments uniques dans chaque page
INJECTIONS = [
    # ================================================================
    # coaching.html
    # ================================================================
    {
        'file': 'coaching.html',
        'tag': 'h1',
        'search': 'Coaching Surf',
        'key': 'coaching.title',
    },
    {
        'file': 'coaching.html',
        'tag': 'p',
        'search': 'Exercices ciblés',
        'key': 'coaching.subtitle',
    },
    # ================================================================
    # actu.html
    # ================================================================
    {
        'file': 'actu.html',
        'tag': 'h1',
        'search': 'Actualités',
        'key': 'actu.title',
    },
    {
        'file': 'actu.html',
        'tag': 'span',
        'search': 'Surf',
        'key': 'actu.subtitle',
    },
    # ================================================================
    # communaute.html
    # ================================================================
    {
        'file': 'communaute.html',
        'tag': 'h1',
        'search': 'Communauté SwellSync',
        'key': 'communaute.title',
    },
    # ================================================================
    # contact.html
    # ================================================================
    {
        'file': 'contact.html',
        'tag': 'h1',
        'search': 'Contactez',
        'key': 'contact.title',
    },
    # ================================================================
    # cotes.html
    # ================================================================
    {
        'file': 'cotes.html',
        'tag': 'h1',
        'search': 'Carte des Côtes',
        'key': 'cotes.title',
    },
    # ================================================================
    # journal.html
    # ================================================================
    {
        'file': 'journal.html',
        'tag': 'h1',
        'search': 'Journal de Surf',
        'key': 'journal.title',
    },
    # ================================================================
    # dashboard.html
    # ================================================================
    {
        'file': 'dashboard.html',
        'tag': 'h1',
        'search': 'Mon Dashboard',
        'key': 'dashboard.title',
    },
    # ================================================================
    # surf-trip.html
    # ================================================================
    {
        'file': 'surf-trip.html',
        'tag': 'h1',
        'search': 'Surf Trip Planner',
        'key': 'surf_trip.title',
    },
    # ================================================================
    # abonnement.html
    # ================================================================
    {
        'file': 'abonnement.html',
        'tag': 'h1',
        'search': 'Surfez',
        'key': 'abonnement.title',
    },
    # ================================================================
    # pro.html
    # ================================================================
    {
        'file': 'pro.html',
        'tag': 'h1',
        'search': 'SwellSync Pro',
        'key': 'pro.title',
    },
    # ================================================================
    # reseaux.html
    # ================================================================
    {
        'file': 'reseaux.html',
        'tag': 'h1',
        'search': 'Réseaux Sociaux',
        'key': 'reseaux.title',
    },
    # ================================================================
    # iot-network.html
    # ================================================================
    {
        'file': 'iot-network.html',
        'tag': 'h1',
        'search': 'IoT Network',
        'key': 'iot.title',
    },
]

total = 0
for inj in INJECTIONS:
    path = os.path.join(BASE, inj['file'])
    if not os.path.exists(path):
        print(f'  ❌ {inj["file"]} not found')
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    tag = inj['tag']
    search = re.escape(inj['search'])
    key = inj['key']
    
    # Pattern : <tag ...>...TEXT...</ tag> — ajoute data-i18n si pas déjà là
    pattern = rf'(<{tag}(?![^>]*data-i18n)[^>]*>)((?:[^<]*(?:<(?!/{tag})[^>]*>)?)*?{search}[^<]*?)(</{tag}>)'
    
    def add_attr(m):
        opening = m.group(1)
        # Ajouter data-i18n avant la fermeture du tag ouvrant
        new_opening = opening[:-1] + f' data-i18n="{key}">'
        return new_opening + m.group(2) + m.group(3)
    
    new_content, n = re.subn(pattern, add_attr, content, count=1, flags=re.DOTALL | re.IGNORECASE)
    
    if n > 0 and new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'  ✅ {inj["file"]}: {tag} [{inj["search"][:30]}...] → data-i18n="{key}"')
        total += 1
    else:
        # Fallback : vérifier si data-i18n est déjà présent
        if f'data-i18n="{key}"' in content:
            print(f'  ✔️  {inj["file"]}: {key} déjà présent')
        else:
            print(f'  ⚠️  {inj["file"]}: texte "{inj["search"][:30]}" non trouvé dans <{tag}>')

print(f'\n✅ {total} attributs data-i18n supplémentaires injectés')
