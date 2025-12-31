'use strict';

// Small content script that injects the player controls script
// This pattern avoids size limits by using web_accessible_resources

(function() {
    // Guard against multiple content script runs
    if (window._youtoobContentScriptLoaded) return;
    window._youtoobContentScriptLoaded = true;

    const SPA_NAVIGATION_DELAY_MS = 500;
    const VISIBILITY_CHECK_DELAY_MS = 300;

    // Track the video element we last injected for
    let lastVideoElement = null;

    // Only run on watch pages
    function shouldRun() {
        return location.hostname.includes('youtube.com');
    }

    if (!shouldRun()) return;

    // Inject the main player script
    function injectPlayerScript() {
        // Remove old script to force re-execution
        const oldScript = document.getElementById('youtoob-player-script');
        if (oldScript) oldScript.remove();

        const script = document.createElement('script');
        script.id = 'youtoob-player-script';
        script.src = browser.runtime.getURL('scripts/player.js');
        (document.head || document.documentElement).appendChild(script);

        // Track the current video element
        lastVideoElement = document.querySelector('video');
    }

    // Check if player controls need re-injection (video element changed or is stale)
    function checkVideoHealth() {
        const currentVideo = document.querySelector('video');
        if (!currentVideo) return false;

        // Video element was replaced
        if (lastVideoElement && lastVideoElement !== currentVideo) {
            return true;
        }

        // Video is in stale state (no duration means it's not properly loaded)
        if (!currentVideo.duration || isNaN(currentVideo.duration)) {
            return true;
        }

        return false;
    }

    // Inject on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectPlayerScript);
    } else {
        injectPlayerScript();
    }

    // Re-inject on SPA navigation (only one observer needed)
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            // Small delay to let the new page render
            setTimeout(injectPlayerScript, SPA_NAVIGATION_DELAY_MS);
        }
    });

    observer.observe(document.body, { subtree: true, childList: true });

    // Re-inject when returning from background if video became stale
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Small delay to let YouTube restore the video
            setTimeout(() => {
                if (checkVideoHealth()) {
                    injectPlayerScript();
                }
            }, VISIBILITY_CHECK_DELAY_MS);
        }
    });
})();
