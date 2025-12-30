// =============================================================================
// Gesture Handling (swipe, long-press)
// =============================================================================

function setupGestures(video, overlay, controls) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let longPressTimer = null;
    let isLongPress = false;
    let originalSpeed = 1;

    const SWIPE_THRESHOLD = 80;  // Minimum distance for swipe
    const LONG_PRESS_DELAY = 500;  // ms to trigger long press

    // Get the tap zones for gesture detection
    const tapZones = overlay.querySelector('.youtoob-tap-zones');
    if (!tapZones) return;

    // Long press for 2x speed
    function startLongPressTimer() {
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            originalSpeed = video.playbackRate;
            video.playbackRate = 2;
            // Visual feedback - could add indicator here
        }, LONG_PRESS_DELAY);
    }

    function cancelLongPress() {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        if (isLongPress) {
            video.playbackRate = originalSpeed;
            isLongPress = false;
        }
    }

    // Swipe detection
    function handleSwipe(deltaX, deltaY) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Vertical swipe must be dominant
        if (absY > absX && absY > SWIPE_THRESHOLD) {
            if (deltaY < 0) {
                // Swipe up - enter fullscreen
                if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                    const target = video.parentElement || video;
                    if (target.requestFullscreen) {
                        target.requestFullscreen();
                    } else if (target.webkitRequestFullscreen) {
                        target.webkitRequestFullscreen();
                    }
                }
            } else {
                // Swipe down - exit fullscreen
                if (document.fullscreenElement || document.webkitFullscreenElement) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                }
            }
            return true;
        }
        return false;
    }

    // Touch event handlers
    tapZones.addEventListener('touchstart', (e) => {
        // Don't interfere with seek bar
        if (e.target.closest('.youtoob-seek-bar')) return;

        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();

        // Start long press detection
        startLongPressTimer();
    }, { passive: true });

    tapZones.addEventListener('touchmove', (e) => {
        // Cancel long press if user moves
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
        if (deltaX > 10 || deltaY > 10) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }
    }, { passive: true });

    tapZones.addEventListener('touchend', (e) => {
        cancelLongPress();

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const duration = Date.now() - touchStartTime;

        // Only process swipe if it was a quick gesture (< 300ms)
        if (duration < 300) {
            handleSwipe(deltaX, deltaY);
        }
    }, { passive: true });

    tapZones.addEventListener('touchcancel', () => {
        cancelLongPress();
    }, { passive: true });
}
