// =============================================================================
// Controls Visibility Management
// =============================================================================

function createControlsManager(overlay, speedMenu, qualityMenu, video) {
    let visible = false;
    let hideTimeout = null;

    function scheduleHide() {
        clearTimeout(hideTimeout);
        // Don't auto-hide if video is paused
        if (!video.paused) {
            hideTimeout = setTimeout(hide, CONTROLS_AUTO_HIDE_MS);
        }
    }

    function show() {
        visible = true;
        overlay.classList.add('show-controls');
        scheduleHide();
    }

    function hide() {
        visible = false;
        overlay.classList.remove('show-controls');
        speedMenu.classList.remove('show');
        qualityMenu.classList.remove('show');
    }

    function toggle() {
        if (visible) {
            hide();
        } else {
            show();
        }
    }

    // When video plays, schedule hide if controls are visible
    video.addEventListener('play', () => {
        if (visible) scheduleHide();
    });

    return { show, hide, toggle };
}

// =============================================================================
// Double-Tap Skip Handler
// =============================================================================

function createDoubleTapHandler(video, indicator, textElement, direction, controls) {
    let lastTap = 0;
    let accumSeconds = 0;

    return function handleTap(e) {
        e.stopPropagation();

        // Ignore if multiple touches (pinch gesture)
        if (e.touches && e.touches.length >= 2) return;

        const now = Date.now();

        if (now - lastTap < DOUBLE_TAP_THRESHOLD_MS) {
            // Double tap - skip and hide controls
            controls.hide();
            accumSeconds += SKIP_SECONDS;
            if (direction === 'back') {
                video.currentTime = Math.max(0, video.currentTime - SKIP_SECONDS);
            } else {
                video.currentTime = Math.min(video.duration, video.currentTime + SKIP_SECONDS);
            }
            textElement.textContent = accumSeconds + ' seconds';
            indicator.classList.add('show');
            clearTimeout(indicator.hideTimeout);
            indicator.hideTimeout = setTimeout(() => {
                indicator.classList.remove('show');
                accumSeconds = 0;
            }, SKIP_INDICATOR_HIDE_MS);
        } else {
            // Single tap - toggle controls
            controls.toggle();
        }
        lastTap = now;
    };
}
