// Settings menu injection for YouToob
// Injects "YouToob Settings" into YouTube's settings page

(function() {
    'use strict';

    // Guard against multiple runs
    if (window._youtoobSettingsInjectorLoaded) return;
    window._youtoobSettingsInjectorLoaded = true;

    const SETTINGS_ID = 'youtoob-settings-item';
    const INJECTION_DELAY_MS = 500;

    function isSettingsPage() {
        return location.pathname.includes('/account') ||
               location.pathname.includes('/select_site');
    }

    function findSettingsContainer() {
        // Try various YouTube mobile settings containers
        const selectors = [
            'ytm-section-list-renderer',
            'ytm-settings-renderer',
            '.settings-list',
            'ytm-browse',
            'ytm-single-column-browse-results-renderer',
            '#contents',
            'ytm-app [role="main"]',
            'ytm-app'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) return el;
        }
        return document.body;
    }

    function createSettingsItem() {
        const item = document.createElement('div');
        item.id = SETTINGS_ID;
        item.style.cssText = `
            padding: 16px 24px;
            display: flex;
            align-items: center;
            cursor: pointer;
            background: transparent;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        `;

        item.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 24px; opacity: 0.9;">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span style="font-size: 14px; color: inherit;">YouToob Settings</span>
        `;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Use replace() to avoid adding to history (prevents re-triggering on back/forward)
            window.location.replace('youtoob://settings');
        });

        item.addEventListener('touchstart', () => {
            item.style.background = 'rgba(255,255,255,0.1)';
        });

        item.addEventListener('touchend', () => {
            item.style.background = 'transparent';
        });

        return item;
    }

    function injectSettingsItem() {
        // Don't inject if already present
        if (document.getElementById(SETTINGS_ID)) return;

        if (!isSettingsPage()) return;

        const container = findSettingsContainer();
        if (!container) return;

        const item = createSettingsItem();

        // Insert at the top of the container
        if (container.firstChild) {
            container.insertBefore(item, container.firstChild);
        } else {
            container.appendChild(item);
        }
    }

    // Inject on load
    function init() {
        if (!isSettingsPage()) return;
        setTimeout(injectSettingsItem, INJECTION_DELAY_MS);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-inject on SPA navigation
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            // Remove old item if navigating away
            const oldItem = document.getElementById(SETTINGS_ID);
            if (oldItem) oldItem.remove();
            // Reset the guard so we can inject again
            setTimeout(injectSettingsItem, INJECTION_DELAY_MS);
        } else if (isSettingsPage()) {
            // Page content might have changed, try to inject
            setTimeout(injectSettingsItem, INJECTION_DELAY_MS);
        }
    });

    observer.observe(document.body, { subtree: true, childList: true });
})();
