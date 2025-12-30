'use strict';

// Small content script that injects the player controls script
// This pattern avoids size limits by using web_accessible_resources

(function() {
    // Only run on watch pages
    function shouldRun() {
        return location.hostname.includes('youtube.com');
    }

    if (!shouldRun()) return;

    // Inject the main player script
    function injectPlayerScript() {
        if (document.getElementById('youtoob-player-script')) return;

        const script = document.createElement('script');
        script.id = 'youtoob-player-script';
        script.src = browser.runtime.getURL('scripts/player.js');
        script.addEventListener('load', () => {
            console.log('[YouToob] Player script loaded');
        });
        script.addEventListener('error', (e) => {
            console.error('[YouToob] Failed to load player script', e);
        });
        (document.head || document.documentElement).appendChild(script);
    }

    // Inject on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectPlayerScript);
    } else {
        injectPlayerScript();
    }

    // Re-inject on SPA navigation
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            // Small delay to let the new page render
            setTimeout(injectPlayerScript, 500);
        }
    });

    observer.observe(document.body, { subtree: true, childList: true });
})();
