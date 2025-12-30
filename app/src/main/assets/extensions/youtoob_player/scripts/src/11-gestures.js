// =============================================================================
// Gesture Handling (progressive swipe, long-press, pinch)
// =============================================================================

function setupGestures(video, overlay) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let longPressTimer = null;
    let isLongPress = false;
    let originalSpeed = 1;
    let isDragging = false;
    let dragDirection = null; // 'up' or 'down'

    // Pinch gesture state
    let isPinching = false;
    let initialPinchDistance = 0;
    let isFillMode = false; // false = fit (contain), true = fill (cover)

    const DRAG_THRESHOLD = 20;  // Min distance to start progressive drag
    const COMPLETE_THRESHOLD = 60;  // Distance to complete fullscreen toggle
    const LONG_PRESS_DELAY = 400;  // ms to trigger long press
    const PINCH_THRESHOLD = 50;  // Min distance change to toggle fill mode

    // Get the video element for transforms
    function getVideoElement() {
        return video;
    }

    function getPlayerContainer() {
        return window._youtoobPlayerContainer || video.parentElement;
    }

    // Long press for 2x speed
    function startLongPressTimer() {
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            originalSpeed = video.playbackRate;
            video.playbackRate = 2;
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

    // Check if we're in fullscreen
    function isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    // Calculate distance between two touch points
    function getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Toggle fill mode (object-fit: cover vs contain)
    function setFillMode(fill) {
        isFillMode = fill;
        video.style.objectFit = fill ? 'cover' : 'contain';
    }

    // Apply progressive transform during drag
    function applyDragTransform(deltaY) {
        const container = getPlayerContainer();
        const videoEl = getVideoElement();
        if (!container || !videoEl) return;

        if (!isFullscreen()) {
            // Portrait mode: dragging UP to enter fullscreen
            // Scale video and translate up as user drags (fills toward notification bar)
            if (deltaY < -DRAG_THRESHOLD) {
                const progress = Math.min(Math.abs(deltaY + DRAG_THRESHOLD) / COMPLETE_THRESHOLD, 1);
                const scale = 1 + (progress * 0.3); // Scale up to 1.3x for dramatic effect
                const translateY = -progress * 20; // Move up toward notification bar
                videoEl.style.transition = 'none';
                videoEl.style.transform = `scale(${scale}) translateY(${translateY}px)`;
                videoEl.style.transformOrigin = 'center center';
            }
        } else {
            // Fullscreen mode: dragging DOWN to exit
            // Translate video down as user drags
            if (deltaY > DRAG_THRESHOLD) {
                const translateY = Math.min(deltaY - DRAG_THRESHOLD, COMPLETE_THRESHOLD * 1.5);
                const scale = 1 - (translateY / (COMPLETE_THRESHOLD * 10)); // Slight scale down
                videoEl.style.transition = 'none';
                videoEl.style.transform = `translateY(${translateY}px) scale(${Math.max(scale, 0.9)})`;
                videoEl.style.transformOrigin = 'center top';
            }
        }
    }

    // Reset transform with animation
    function resetTransform(animate = true) {
        const videoEl = getVideoElement();
        if (!videoEl) return;

        if (animate) {
            videoEl.style.transition = 'transform 0.25s ease-out';
        }
        videoEl.style.transform = '';
        videoEl.style.transformOrigin = '';

        if (animate) {
            setTimeout(() => {
                videoEl.style.transition = '';
            }, 250);
        }
    }

    // Complete fullscreen enter with animation
    function completeFullscreenEnter() {
        // Must request fullscreen IMMEDIATELY during user gesture - no setTimeout!
        resetTransform(false);

        // Click our own fullscreen button - this goes through the same trusted path
        // as a manual tap (which the user confirmed works reliably)
        const ourFsBtn = document.getElementById('youtoob-fullscreen');
        if (ourFsBtn) {
            console.log('[YouToob] Clicking our fullscreen button');
            ourFsBtn.click();
        }
    }

    // Complete fullscreen exit with animation
    function completeFullscreenExit() {
        // Must exit fullscreen IMMEDIATELY during user gesture - no setTimeout!
        resetTransform(false);

        // Use the same path as the button - click our fullscreen button
        // which handles the toggle correctly
        const ourFsBtn = document.getElementById('youtoob-fullscreen');
        if (ourFsBtn) {
            console.log('[YouToob] Clicking our fullscreen button to exit');
            ourFsBtn.click();
        }
    }

    // Use capture phase on overlay to intercept events before child handlers
    overlay.addEventListener('touchstart', (e) => {
        // Don't interfere with seek bar or buttons
        if (e.target.closest('.youtoob-seek-bar') ||
            e.target.closest('.youtoob-btn') ||
            e.target.closest('.youtoob-action-btn') ||
            e.target.closest('.youtoob-pill-btn') ||
            e.target.closest('.youtoob-fullscreen-btn') ||
            e.target.closest('.youtoob-menu')) return;

        // Detect pinch start (2 fingers)
        if (e.touches.length === 2) {
            isPinching = true;
            initialPinchDistance = getTouchDistance(e.touches);
            cancelLongPress();
            return;
        }

        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        isDragging = false;
        dragDirection = null;

        // Start long press detection
        startLongPressTimer();
    }, { capture: true, passive: true });

    overlay.addEventListener('touchmove', (e) => {
        // Handle pinch gesture
        if (isPinching && e.touches.length === 2) {
            const currentDistance = getTouchDistance(e.touches);
            const delta = currentDistance - initialPinchDistance;

            // Toggle fill mode when pinch exceeds threshold
            if (Math.abs(delta) > PINCH_THRESHOLD) {
                if (delta > 0 && !isFillMode) {
                    // Pinch out (spread) - fill mode
                    setFillMode(true);
                    initialPinchDistance = currentDistance; // Reset to prevent repeated toggles
                } else if (delta < 0 && isFillMode) {
                    // Pinch in - fit mode
                    setFillMode(false);
                    initialPinchDistance = currentDistance;
                }
            }
            return;
        }

        if (touchStartTime === 0) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartX;
        const deltaY = currentY - touchStartY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Cancel long press if user moves significantly
        if (absX > 15 || absY > 15) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }

        // Detect vertical drag direction
        if (!isDragging && absY > DRAG_THRESHOLD && absY > absX) {
            isDragging = true;
            dragDirection = deltaY < 0 ? 'up' : 'down';
        }

        // Apply progressive transform
        if (isDragging) {
            // Only allow up in portrait, down in fullscreen
            if ((dragDirection === 'up' && !isFullscreen()) ||
                (dragDirection === 'down' && isFullscreen())) {
                applyDragTransform(deltaY);
            }
        }
    }, { capture: true, passive: true });

    overlay.addEventListener('touchend', (e) => {
        cancelLongPress();

        // Reset pinch state
        if (isPinching) {
            isPinching = false;
            initialPinchDistance = 0;
            return;
        }

        if (touchStartTime === 0) {
            console.log('[YouToob] touchend: touchStartTime is 0, returning early');
            return;
        }

        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchEndY - touchStartY;

        console.log('[YouToob] touchend:', {
            touchStartY,
            touchEndY,
            deltaY,
            isDragging,
            dragDirection,
            isFS: isFullscreen(),
            threshold: -COMPLETE_THRESHOLD,
            wouldTrigger: dragDirection === 'up' && !isFullscreen() && deltaY < -COMPLETE_THRESHOLD
        });

        // Reset touch state
        touchStartTime = 0;

        if (isDragging) {
            // Check if drag was far enough to complete action
            if (dragDirection === 'up' && !isFullscreen() && deltaY < -COMPLETE_THRESHOLD) {
                // Complete fullscreen enter
                console.log('[YouToob] Calling completeFullscreenEnter');
                completeFullscreenEnter();
            } else if (dragDirection === 'down' && isFullscreen() && deltaY > COMPLETE_THRESHOLD) {
                // Complete fullscreen exit
                completeFullscreenExit();
            } else {
                // Snap back
                console.log('[YouToob] Snapping back');
                resetTransform(true);
            }

            isDragging = false;
            dragDirection = null;
        }
    }, { capture: true, passive: true });

    overlay.addEventListener('touchcancel', () => {
        cancelLongPress();
        touchStartTime = 0;
        isDragging = false;
        dragDirection = null;
        isPinching = false;
        initialPinchDistance = 0;
        resetTransform(true);
    }, { capture: true, passive: true });

    // Clean up transform AND reset all gesture state on fullscreen change
    function onFullscreenChange() {
        resetTransform(false);
        // Reset ALL gesture state to start fresh
        touchStartTime = 0;
        isDragging = false;
        dragDirection = null;
        isPinching = false;
        initialPinchDistance = 0;
        cancelLongPress();
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
}
