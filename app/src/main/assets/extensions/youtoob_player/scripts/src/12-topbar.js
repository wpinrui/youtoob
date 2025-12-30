// =============================================================================
// Top Bar Setup
// =============================================================================

function setupTopBar(video, controls) {
    const titleEl = document.getElementById('youtoob-video-title');
    const channelEl = document.getElementById('youtoob-channel-name');
    const autoplayBtn = document.getElementById('youtoob-autoplay');
    const loopBtn = document.getElementById('youtoob-loop');
    const shareBtn = document.getElementById('youtoob-share');

    // Update video info from page
    function updateVideoInfo() {
        // Try to get video title from various sources
        const titleSources = [
            () => document.querySelector('h1.title')?.textContent,
            () => document.querySelector('.slim-video-information-title')?.textContent,
            () => document.querySelector('[class*="video-title"]')?.textContent,
            () => document.querySelector('meta[property="og:title"]')?.content,
            () => document.title.replace(' - YouTube', '')
        ];

        for (const getTitle of titleSources) {
            const title = getTitle()?.trim();
            if (title) {
                titleEl.textContent = title;
                break;
            }
        }

        // Try to get channel name from various sources
        const channelSources = [
            () => document.querySelector('ytm-slim-owner-renderer .slim-owner-channel-name')?.textContent,
            () => document.querySelector('ytm-slim-owner-renderer a[href*="/channel/"]')?.textContent,
            () => document.querySelector('ytm-slim-owner-renderer a[href*="/@"]')?.textContent,
            () => document.querySelector('.slim-owner-channel-name')?.textContent,
            () => document.querySelector('ytm-byline-renderer .ytm-channel-name a')?.textContent,
            () => document.querySelector('.ytm-channel-name')?.textContent,
            () => document.querySelector('[itemprop="author"] [itemprop="name"]')?.content,
            () => document.querySelector('span[itemprop="author"]')?.textContent
        ];

        for (const getChannel of channelSources) {
            const channel = getChannel()?.trim();
            if (channel) {
                channelEl.textContent = channel;
                break;
            }
        }
    }

    // Initial update with slight delay to ensure DOM is ready
    setTimeout(updateVideoInfo, VIDEO_INFO_DELAY_MS);

    // Track loop state ourselves (video.loop doesn't work reliably with YouTube)
    let loopEnabled = false;

    function updateLoopState() {
        loopBtn.classList.toggle('active', loopEnabled);
    }

    // Loop toggle
    loopBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        loopEnabled = !loopEnabled;
        updateLoopState();
        controls.show();
    });

    // Initialize loop state
    updateLoopState();

    // Autoplay toggle
    let autoplayEnabled = false;

    function updateAutoplayState() {
        autoplayBtn.classList.toggle('active', autoplayEnabled);
    }

    autoplayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        autoplayEnabled = !autoplayEnabled;
        updateAutoplayState();
        controls.show();
    });

    // Disable YouTube's native autoplay by polling and clicking the toggle
    function disableYouTubeAutoplay() {
        // Desktop selector
        const desktopToggle = document.querySelector('.ytp-autonav-toggle-button[aria-checked="true"]');
        if (desktopToggle) {
            desktopToggle.click();
            return true;
        }
        // Mobile selectors - various possible elements
        const mobileToggles = document.querySelectorAll(
            '[aria-label*="Autoplay"][aria-pressed="true"], ' +
            '[aria-label*="autoplay"][aria-checked="true"], ' +
            'ytm-autonav-toggle-button-renderer[aria-pressed="true"], ' +
            'button[aria-label*="Autoplay is on"]'
        );
        if (mobileToggles.length > 0) {
            mobileToggles.forEach(t => t.click());
            return true;
        }
        return false;
    }

    // Poll to disable YouTube autoplay (it may re-enable)
    const autoplayCheckInterval = setInterval(() => {
        disableYouTubeAutoplay();
    }, AUTOPLAY_POLL_INTERVAL_MS);

    // Initial attempts with retries
    disableYouTubeAutoplay();
    AUTOPLAY_RETRY_DELAYS_MS.forEach(delay => setTimeout(disableYouTubeAutoplay, delay));

    // Clean up interval on page unload
    window.addEventListener('beforeunload', () => clearInterval(autoplayCheckInterval));

    // Use timeupdate to loop BEFORE video ends (prevents YouTube's ended handler)
    video.addEventListener('timeupdate', () => {
        if (loopEnabled && video.duration > 0) {
            // If within threshold of end, loop now
            if (video.currentTime >= video.duration - LOOP_THRESHOLD_SECONDS) {
                video.currentTime = 0;
                video.play();
            }
        }
    });

    // Backup: also handle ended event
    video.addEventListener('ended', (e) => {
        if (loopEnabled) {
            e.stopImmediatePropagation();
            video.currentTime = 0;
            video.play();
        } else if (autoplayEnabled) {
            // Find and click the next video
            const nextSelectors = [
                'ytm-endscreen-element-renderer a',
                'ytm-compact-autoplay-renderer a',
                'ytm-watch-next-secondary-results-renderer ytm-compact-video-renderer:first-child a',
                'ytm-video-with-context-renderer a',
                '.related-video a'
            ];

            for (const selector of nextSelectors) {
                const nextLink = document.querySelector(selector);
                if (nextLink && nextLink.href && nextLink.href.includes('/watch')) {
                    window.location.href = nextLink.href;
                    return;
                }
            }
        }
    }, true);

    // Share button - uses Web Share API or copies URL
    shareBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        const url = window.location.href;
        const title = titleEl.textContent || 'YouTube Video';

        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch (err) {
                // User cancelled or error - ignore
            }
        } else {
            // Fallback: copy URL to clipboard
            try {
                await navigator.clipboard.writeText(url);
                // Could show a toast here
            } catch (err) {
                // Clipboard failed - ignore
            }
        }

        controls.show();
    });
}
