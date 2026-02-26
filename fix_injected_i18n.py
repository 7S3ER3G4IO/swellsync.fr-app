#!/usr/bin/env python3
"""
fix_injected_i18n.py
Corrige le bug où data-i18n="key"> est injecté DANS le contenu textuel d'un tag
au lieu d'être un attribut HTML.

Pattern cassé  : <span data-i18n="x"> data-i18n="x">Texte original</span>
Pattern correct : <span data-i18n="x">Texte original</span>

Également corrige :
 - <tag> data-i18n="key">Texte    (pas d'attribut, juste du texte)
 - <tag data-i18n="key"> data-i18n="key">Texte  (doublon)
"""

import re, os, glob

BASE = os.path.dirname(os.path.abspath(__file__))
HTML_FILES = glob.glob(os.path.join(BASE, '*.html')) + glob.glob(os.path.join(BASE, 'admin', '*.html'))

total_fixed = 0

for filepath in HTML_FILES:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    fixes = 0

    # Pattern 1 : data-i18n="key"> en CONTENU, doublon sur un tag qui a déjà l'attribut
    # Ex: <span data-i18n="x"> data-i18n="x">Texte</span>
    # → <span data-i18n="x">Texte</span>
    pattern1 = r'(data-i18n="[^"]+">)\s*data-i18n="[^"]+">([^<]*)'
    def fix1(m):
        return m.group(1) + m.group(2)
    new_content, n = re.subn(pattern1, fix1, content)
    if n:
        content = new_content
        fixes += n

    # Pattern 2 : tag sans attribut mais avec data-i18n dans le texte
    # Ex: <h1 class="..."> data-i18n="coaching.title">🏄 Coaching Surf</h1>
    # → <h1 class="..." data-i18n="coaching.title">🏄 Coaching Surf</h1>
    # On cherche >\s*data-i18n="([^"]+)">([^<]*)
    pattern2 = r'(<(?:h[1-6]|p|span|div|a|button|label|li|td|th|strong|em|small|section|article)[^>]*)>\s*data-i18n="([^"]+)">([^<]*)'
    # Seulement si le tag n'a pas déjà data-i18n
    def fix2(m):
        tag_open = m.group(1)
        key = m.group(2)
        text = m.group(3)
        # Si le tag a déjà data-i18n, on skip (évite de créer un doublon)
        if 'data-i18n' in tag_open:
            return m.group(0)
        return f'{tag_open} data-i18n="{key}">{text}'
    new_content, n = re.subn(pattern2, fix2, content)
    if n:
        content = new_content
        fixes += n

    # Pattern 3 : balise qui a déjà data-i18n ET a du contenu data-i18n= avec le même ou autre key
    # Ex: <h1 data-i18n="coaching.title"> data-i18n="coaching.title">🏄 Coaching Surf</h1>
    # → <h1 data-i18n="coaching.title">🏄 Coaching Surf</h1>
    # (ce cas est normalement attrapé par pattern1, mais avec espace avant)
    pattern3 = r'(data-i18n="[^"]+")\s*>\s*data-i18n="[^"]+"\s*>([^<]*)'
    def fix3(m):
        return m.group(1) + '>' + m.group(2)
    new_content, n = re.subn(pattern3, fix3, content)
    if n:
        content = new_content
        fixes += n

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        fname = os.path.basename(filepath)
        print(f'✅ {fname} — {fixes} correction(s)')
        total_fixed += fixes

if total_fixed == 0:
    print('ℹ️  Aucun bug data-i18n mal injecté trouvé.')
else:
    print(f'\n✅ Total : {total_fixed} corrections dans {len([f for f in HTML_FILES])} fichiers HTML')
