/**
 * SwellSync — nav.js
 * Navigation: active link, Plus mega-menu, mobile menu, scroll effect
 */

(function () {
    'use strict';

    // ──────────────────────────────────────────────
    // 1. ACTIVE LINK HIGHLIGHT
    // ──────────────────────────────────────────────
    function highlightActiveNavLink() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('a.nav-link').forEach(link => {
            const href = link.getAttribute('href') || '';
            const isAnchor = href.startsWith('#') || href.includes('index.html#');
            const linkPage = href.split('/').pop().split('#')[0];
            const isActive = !isAnchor && (linkPage === page || (page === '' && linkPage === 'index.html'));
            if (isActive) {
                link.style.color = '#00bad6';
                link.style.background = 'rgba(0,186,214,0.08)';
                link.setAttribute('aria-current', 'page');
            }
        });
    }

    // ──────────────────────────────────────────────
    // 2. PLUS MEGA-MENU DROPDOWN
    // ──────────────────────────────────────────────
    function initPlusMegaMenu() {
        const wrapper = document.getElementById('nav-plus-wrapper');
        const btn = document.getElementById('nav-plus-btn');
        const chevron = document.getElementById('nav-plus-chevron');
        if (!wrapper || !btn) return;

        // Pages data
        const COLUMNS = [
            {
                label: 'SWELLSYNC', color: '#00bad6',
                items: [
                    { href: 'abonnement.html', icon: 'star', label: 'Abonnements' },
                    { href: 'contact.html', icon: 'mail', label: 'Contact' },
                ]
            },
            {
                label: 'LÉGAL', color: '#00bad6',
                items: [
                    { href: 'cgv.html', icon: 'description', label: 'CGV' },
                    { href: 'legal.html', icon: 'gavel', label: 'Légal' },
                    { href: 'privacy.html', icon: 'lock', label: 'Confidentialité' },
                    { href: 'cookies.html', icon: 'cookie', label: 'Cookies' },
                ]
            }
        ];

        // Build dropdown panel
        const dropdown = document.createElement('div');
        dropdown.id = 'nav-plus-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: calc(100% + 12px);
            left: 50%;
            transform: translateX(-50%) translateY(-8px);
            opacity: 0;
            pointer-events: none;
            z-index: 9999;
            background: rgba(10, 21, 22, 0.97);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px;
            padding: 24px 28px 20px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,186,214,0.05);
            transition: opacity 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1);
            display: flex;
            gap: 32px;
            min-width: 520px;
        `;

        // Arrow pointing up
        dropdown.innerHTML = `<div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%) rotate(45deg);width:12px;height:12px;background:rgba(10,21,22,0.97);border-top:1px solid rgba(255,255,255,0.08);border-left:1px solid rgba(255,255,255,0.08);"></div>`;

        COLUMNS.forEach(col => {
            let colHTML = `<div style="min-width:140px;">
                <div style="font-family:Lexend,sans-serif;font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:12px;">${col.label}</div>`;
            col.items.forEach(item => {
                colHTML += `<a href="${item.href}" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;text-decoration:none;transition:background 0.15s,color 0.15s;margin-bottom:2px;" 
                    onmouseover="this.style.background='rgba(0,186,214,0.08)'" onmouseout="this.style.background='transparent'">
                    <span class="material-symbols-outlined" style="font-size:18px;color:#00bad6;opacity:0.7;">${item.icon}</span>
                    <span style="font-family:Lexend,sans-serif;font-size:13px;font-weight:600;color:#cbd5e1;">${item.label}</span>
                </a>`;
            });
            colHTML += '</div>';
            dropdown.insertAdjacentHTML('beforeend', colHTML);
        });

        // Bottom hint
        dropdown.insertAdjacentHTML('beforeend', `
            <div style="position:absolute;bottom:-28px;left:50%;transform:translateX(-50%);white-space:nowrap;">
                <span style="font-family:'Courier New',monospace;font-size:11px;color:#00bad6;opacity:0.5;">↑ Survoler 'Plus' pour explorer</span>
            </div>
        `);

        wrapper.appendChild(dropdown);

        // Show / Hide
        let isOpen = false;
        let closeTimeout = null;

        function openMenu() {
            clearTimeout(closeTimeout);
            isOpen = true;
            dropdown.style.opacity = '1';
            dropdown.style.transform = 'translateX(-50%) translateY(0)';
            dropdown.style.pointerEvents = 'auto';
            if (chevron) chevron.style.transform = 'rotate(180deg)';
        }

        function closeMenu() {
            closeTimeout = setTimeout(() => {
                isOpen = false;
                dropdown.style.opacity = '0';
                dropdown.style.transform = 'translateX(-50%) translateY(-8px)';
                dropdown.style.pointerEvents = 'none';
                if (chevron) chevron.style.transform = '';
            }, 150);
        }

        // Hover behavior
        wrapper.addEventListener('mouseenter', openMenu);
        wrapper.addEventListener('mouseleave', closeMenu);
        dropdown.addEventListener('mouseenter', () => clearTimeout(closeTimeout));
        dropdown.addEventListener('mouseleave', closeMenu);

        // Click toggle for touch
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            isOpen ? closeMenu() : openMenu();
        });

        // Close on click outside
        document.addEventListener('click', () => { if (isOpen) closeMenu(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) closeMenu(); });
    }

    // ──────────────────────────────────────────────
    // 3. MOBILE MENU
    // ──────────────────────────────────────────────
    function initMobileMenu() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        if (!menuBtn) return;

        let mobilePanel = document.getElementById('mobile-nav-panel');
        if (!mobilePanel) {
            mobilePanel = document.createElement('div');
            mobilePanel.id = 'mobile-nav-panel';
            mobilePanel.style.cssText = `
                position: fixed;
                top: 76px;
                left: 12px;
                right: 12px;
                z-index: 49;
                background: rgba(10, 21, 22, 0.97);
                backdrop-filter: blur(24px);
                -webkit-backdrop-filter: blur(24px);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 16px;
                padding: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.6);
                transform: translateY(-12px);
                opacity: 0;
                pointer-events: none;
                transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease;
            `;

            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const navLinks = [
                { href: 'cotes.html', label: '🗺️ Côtes' },
                { href: 'spot_detail.html', label: '🌊 Conditions' },
                { href: 'actu.html', label: '📰 Actualités' },
                { href: 'abonnement.html', label: '⭐ Abonnement' },
                { href: 'contact.html', label: '✉️ Contact' },
            ];

            navLinks.forEach(item => {
                const a = document.createElement('a');
                a.href = item.href;
                const linkPage = item.href.split('/').pop().split('#')[0];
                const isActive = linkPage === currentPage;
                a.style.cssText = `
                    display: flex; align-items: center;
                    padding: 12px 14px; border-radius: 12px;
                    font-family: 'Lexend', sans-serif;
                    font-size: 13px; font-weight: 700;
                    text-decoration: none;
                    color: ${isActive ? '#00bad6' : '#94a3b8'};
                    background: ${isActive ? 'rgba(0,186,214,0.08)' : 'transparent'};
                    border: 1px solid ${isActive ? 'rgba(0,186,214,0.15)' : 'transparent'};
                    transition: all 0.15s;
                `;
                a.textContent = item.label;
                a.onmouseover = () => { if (!isActive) { a.style.background = 'rgba(255,255,255,0.04)'; a.style.color = '#fff'; } };
                a.onmouseout = () => { if (!isActive) { a.style.background = 'transparent'; a.style.color = '#94a3b8'; } };
                mobilePanel.appendChild(a);
            });

            // Separator + auth buttons
            const sep = document.createElement('div');
            sep.style.cssText = 'height:1px;background:rgba(255,255,255,0.06);margin:10px 0;';
            mobilePanel.appendChild(sep);

            const actions = document.createElement('div');
            actions.style.cssText = 'display:flex;gap:8px;';
            actions.innerHTML = `
                <button onclick="typeof openAuthOrProfileModal!=='undefined'&&openAuthOrProfileModal()" 
                    style="flex:1;padding:12px;border-radius:12px;background:rgba(0,186,214,0.1);border:1px solid rgba(0,186,214,0.2);color:#00bad6;font-weight:700;font-size:13px;font-family:Lexend,sans-serif;cursor:pointer;">
                    Connexion
                </button>
                <button onclick="typeof openAuthOrProfileModal!=='undefined'&&openAuthOrProfileModal()" 
                    style="flex:1;padding:12px;border-radius:12px;background:#00bad6;border:none;color:#0a1516;font-weight:800;font-size:13px;font-family:Lexend,sans-serif;cursor:pointer;">
                    S'inscrire
                </button>
            `;
            mobilePanel.appendChild(actions);
            document.body.appendChild(mobilePanel);
        }

        let isOpen = false;

        function openMenu() {
            isOpen = true;
            mobilePanel.style.opacity = '1';
            mobilePanel.style.transform = 'translateY(0)';
            mobilePanel.style.pointerEvents = 'auto';
            menuBtn.querySelector('.material-symbols-outlined').textContent = 'close';
        }

        function closeMenu() {
            isOpen = false;
            mobilePanel.style.opacity = '0';
            mobilePanel.style.transform = 'translateY(-12px)';
            mobilePanel.style.pointerEvents = 'none';
            menuBtn.querySelector('.material-symbols-outlined').textContent = 'menu';
        }

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isOpen ? closeMenu() : openMenu();
        });

        document.addEventListener('click', (e) => {
            if (isOpen && !mobilePanel.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) closeMenu();
        });
    }

    // ──────────────────────────────────────────────
    // 4. SCROLL EFFECT
    // ──────────────────────────────────────────────
    function initNavScroll() {
        const header = document.getElementById('main-nav');
        if (!header) return;
        const nav = header.querySelector('nav');
        if (!nav) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                nav.style.background = 'rgba(7,15,16,0.85)';
                nav.style.borderColor = 'rgba(255,255,255,0.1)';
            } else {
                nav.style.background = 'rgba(7,15,16,0.4)';
                nav.style.borderColor = 'rgba(255,255,255,0.06)';
            }
        }, { passive: true });
    }

    // ── Init ────────────────────────────────────
    function init() {
        highlightActiveNavLink();
        initPlusMegaMenu();
        initMobileMenu();
        initNavScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
