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
        // Target the ytm-settings container specifically
        const ytmSettings = document.querySelector('ytm-settings.cairo-settings');
        if (ytmSettings) return ytmSettings;

        // Fallback selectors
        const selectors = [
            'ytm-settings',
            'ytm-section-list-renderer',
            'ytm-settings-renderer'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) return el;
        }
        return null;
    }

    function createSettingsItem() {
        // Match YouTube's native settings item structure
        const item = document.createElement('div');
        item.id = SETTINGS_ID;
        item.className = 'setting-generic-category cairo-settings';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');

        // Use YouTube's gear icon SVG (same as General settings)
        item.innerHTML = `
            <div class="setting-generic-category-block">
                <div class="setting-generic-category-icon">
                    <c3-icon fill-icon="false">
                        <span class="yt-icon-shape ytSpecIconShapeHost">
                            <div style="width: 100%; height: 100%; display: block; fill: currentcolor;">
                                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;">
                                    <path d="M12.844 1h-1.687a2 2 0 00-1.962 1.616 3 3 0 01-3.92 2.263 2 2 0 00-2.38.891l-.842 1.46a2 2 0 00.417 2.507 3 3 0 010 4.525 2 2 0 00-.417 2.507l.843 1.46a2 2 0 002.38.892 3.001 3.001 0 013.918 2.263A2 2 0 0011.157 23h1.686a2 2 0 001.963-1.615 3.002 3.002 0 013.92-2.263 2 2 0 002.38-.892l.842-1.46a2 2 0 00-.418-2.507 3 3 0 010-4.526 2 2 0 00.418-2.508l-.843-1.46a2 2 0 00-2.38-.891 3 3 0 01-3.919-2.263A2 2 0 0012.844 1Zm-1.767 2.347a6 6 0 00.08-.347h1.687a4.98 4.98 0 002.407 3.37 4.98 4.98 0 004.122.4l.843 1.46A4.98 4.98 0 0018.5 12a4.98 4.98 0 001.716 3.77l-.843 1.46a4.98 4.98 0 00-4.123.4A4.979 4.979 0 0012.843 21h-1.686a4.98 4.98 0 00-2.408-3.371 4.999 4.999 0 00-4.12-.399l-.844-1.46A4.979 4.979 0 005.5 12a4.98 4.98 0 00-1.715-3.77l.842-1.459a4.98 4.98 0 004.123-.399 4.981 4.981 0 002.327-3.025ZM16 12a4 4 0 11-7.999 0 4 4 0 018 0Zm-4 2a2 2 0 100-4 2 2 0 000 4Z"></path>
                                </svg>
                            </div>
                        </span>
                    </c3-icon>
                </div>
                <div class="setting-generic-category-title-block cairo-settings">
                    <div class="title-text">
                        <span class="yt-core-attributed-string" role="text">YouToob Settings</span>
                    </div>
                </div>
            </div>
        `;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Use replace() to avoid adding to history (prevents re-triggering on back/forward)
            window.location.replace('youtoob://settings');
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
