// =============================================================================
// Gesture Handling (progressive swipe, long-press, pinch)
// =============================================================================

function setupGestures(video, overlay) {
    // Store video reference on window - handlers use this to access current video
    // This allows handlers to work with the new video element after re-injection
    window._youtoobGestureVideo = video;

    // Only setup event handlers once - they use window._youtoobGestureVideo
    // which gets updated on each setupGestures call
    if (window._youtoobGesturesInitialized) return;
    window._youtoobGesturesInitialized = true;

    // Helper to get current video (may change on re-injection)
    function getVideo() {
        return window._youtoobGestureVideo;
    }

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

    // Constants defined in 02-constants.js: DRAG_THRESHOLD, COMPLETE_THRESHOLD, LONG_PRESS_DELAY_MS, PINCH_THRESHOLD

    function getPlayerContainer() {
        return window._youtoobPlayerContainer || getVideo().parentElement;
    }

    // Long press for 2x speed
    function startLongPressTimer() {
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            originalSpeed = getVideo().playbackRate;
            getVideo().playbackRate = LONG_PRESS_SPEED_MULTIPLIER;
        }, LONG_PRESS_DELAY_MS);
    }

    function cancelLongPress() {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        if (isLongPress) {
            getVideo().playbackRate = originalSpeed;
            isLongPress = false;
        }
    }

    function resetGestureState() {
        touchStartTime = 0;
        isDragging = false;
        dragDirection = null;
        isPinching = false;
        initialPinchDistance = 0;
    }

    // isFullscreen() is defined in 06-helpers.js

    // Calculate distance between two touch points
    function getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate max scale needed to fill the screen
    function getFillScale() {
        const v = getVideo();
        const videoAspect = v.videoWidth / v.videoHeight;
        const screenAspect = window.innerWidth / window.innerHeight;
        if (screenAspect > videoAspect) {
            return screenAspect / videoAspect;
        } else {
            return videoAspect / screenAspect;
        }
    }

    // Apply scale during pinch (no transition - follows fingers)
    function applyPinchScale(scale) {
        const v = getVideo();
        v.style.transition = 'none';
        v.style.transform = scale === 1 ? '' : `scale(${scale})`;
        v.style.transformOrigin = 'center center';
    }

    // Snap to fill or fit with animation
    function snapToFillMode(fill) {
        const v = getVideo();
        isFillMode = fill;
        v.style.transition = `transform ${PINCH_SNAP_ANIMATION_MS}ms ease-out`;
        if (fill) {
            const scale = getFillScale();
            v.style.transform = `scale(${scale})`;
        } else {
            v.style.transform = '';
        }
        v.style.transformOrigin = 'center center';
    }

    // Apply shrink/translate transform for swipe-down gesture (same in portrait and fullscreen)
    function applySwipeDownTransform(deltaY) {
        const v = getVideo();
        const translateY = Math.min(deltaY - DRAG_THRESHOLD, COMPLETE_THRESHOLD * EXIT_FULLSCREEN_TRANSLATE_LIMIT);
        const scale = 1 - (translateY / (COMPLETE_THRESHOLD * EXIT_FULLSCREEN_SCALE_DIVISOR));
        v.style.transition = 'none';
        v.style.transform = `translateY(${translateY}px) scale(${Math.max(scale, EXIT_FULLSCREEN_MIN_SCALE)})`;
        v.style.transformOrigin = 'center top';
    }

    // Apply progressive transform during drag
    function applyDragTransform(deltaY) {
        const container = getPlayerContainer();
        if (!container) return;

        const v = getVideo();

        // Portrait mode: dragging UP to enter fullscreen
        if (!isFullscreen() && deltaY < -DRAG_THRESHOLD) {
            const progress = Math.min(Math.abs(deltaY + DRAG_THRESHOLD) / COMPLETE_THRESHOLD, 1);
            const scale = 1 + (progress * DRAG_SCALE_FACTOR);
            const translateY = -progress * DRAG_TRANSLATE_Y;
            v.style.transition = 'none';
            v.style.transform = `scale(${scale}) translateY(${translateY}px)`;
            v.style.transformOrigin = 'center center';
        }

        // Both modes: dragging DOWN (portrait: go back, fullscreen: exit)
        if (deltaY > DRAG_THRESHOLD) {
            applySwipeDownTransform(deltaY);
        }
    }

    // Reset transform with animation
    function resetTransform(animate = true) {
        const v = getVideo();
        if (animate) {
            v.style.transition = `transform ${TRANSFORM_ANIMATION_MS}ms ease-out`;
        }
        v.style.transform = '';
        v.style.transformOrigin = '';

        if (animate) {
            setTimeout(() => {
                getVideo().style.transition = '';
            }, TRANSFORM_ANIMATION_MS);
        }
    }

    // Toggle fullscreen via YouTube's button (uses getYouTubeFullscreenButton from 06-helpers.js)
    function toggleFullscreen() {
        const ytBtn = getYouTubeFullscreenButton();
        if (ytBtn) {
            ytBtn.click();
        } else {
            const ourFsBtn = document.getElementById('youtoob-fullscreen');
            if (ourFsBtn) ourFsBtn.click();
        }
    }

    // Complete fullscreen gesture (enter or exit)
    function completeFullscreenGesture() {
        resetTransform(false);
        toggleFullscreen();
    }

    // Enter miniplayer mode (for swipe down in portrait)
    // Uses custom URL scheme to trigger miniplayer bar and navigate to YouTube home
    // Audio continues playing; user can browse and tap bar to return to video
    // Uses window flag to prevent multiple triggers across script instances
    function enterMiniplayerMode() {
        if (window._youtoobEnteringMiniplayer) return;
        window._youtoobEnteringMiniplayer = true;
        resetTransform(false);
        location.href = 'youtoob://miniplayer';
        setTimeout(() => { window._youtoobEnteringMiniplayer = false; }, NAVIGATE_BACK_DEBOUNCE_MS);
    }

    // Attach to document instead of overlay - overlay moves during fullscreen which corrupts touch handling
    document.addEventListener('touchstart', (e) => {
        // Only handle touches on our overlay
        if (!e.target.closest('#youtoob-controls')) return;

        // Don't interfere with seek bar or buttons
        if (e.target.closest('.youtoob-seek-bar') ||
            e.target.closest('.youtoob-btn') ||
            e.target.closest('.youtoob-action-btn') ||
            e.target.closest('.youtoob-pill-btn') ||
            e.target.closest('.youtoob-fullscreen-btn') ||
            e.target.closest('.youtoob-menu')) return;

        // Detect pinch start (2 fingers) - only in fullscreen
        if (e.touches.length === 2) {
            if (!isFullscreen()) return; // Ignore pinch in portrait
            isPinching = true;
            initialPinchDistance = getTouchDistance(e.touches);
            // Reset any ongoing swipe - 2 fingers = pinch only
            isDragging = false;
            dragDirection = null;
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
    }, { capture: true, passive: false });

    document.addEventListener('touchmove', (e) => {
        // 2 fingers = pinch only, no swipe (only in fullscreen)
        if (e.touches.length >= 2 && isFullscreen()) {
            // Start pinch if not already
            if (!isPinching) {
                isPinching = true;
                initialPinchDistance = getTouchDistance(e.touches);
                isDragging = false;
                dragDirection = null;
                cancelLongPress();
            }

            // Handle pinch gesture - progressive zoom following fingers
            const currentDistance = getTouchDistance(e.touches);
            const pinchRatio = currentDistance / initialPinchDistance;
            const fillScale = getFillScale();

            // Calculate current scale based on pinch ratio
            // Start from current mode (1.0 for fit, fillScale for fill)
            const baseScale = isFillMode ? fillScale : 1;
            let currentScale = baseScale * pinchRatio;

            // Clamp scale between 1.0 (fit) and fillScale (fill)
            currentScale = Math.max(1, Math.min(fillScale, currentScale));

            applyPinchScale(currentScale);
            return;
        }

        // Single finger - but if we were pinching, ignore (finger lifted)
        if (isPinching) return;

        if (touchStartTime === 0) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartX;
        const deltaY = currentY - touchStartY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Cancel long press if user moves significantly
        if (absX > LONG_PRESS_CANCEL_THRESHOLD || absY > LONG_PRESS_CANCEL_THRESHOLD) {
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
            // Allow up/down in portrait, down in fullscreen
            if (!isFullscreen() || (dragDirection === 'down' && isFullscreen())) {
                applyDragTransform(deltaY);
            }
        }
    }, { capture: true, passive: true });

    document.addEventListener('touchend', (e) => {
        cancelLongPress();

        // Reset pinch state - snap to fill or fit based on current scale
        if (isPinching) {
            // Get current transform to determine which mode to snap to
            const currentTransform = getVideo().style.transform;
            const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
            const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
            const fillScale = getFillScale();
            const midpoint = (1 + fillScale) / 2;

            // Snap to fill if past midpoint, otherwise fit
            const shouldFill = currentScale > midpoint;
            snapToFillMode(shouldFill);

            resetGestureState();
            return;
        }

        if (touchStartTime === 0) return;

        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchEndY - touchStartY;

        // Reset touch state
        touchStartTime = 0;

        if (isDragging) {
            // Check if drag was far enough to complete action
            if (dragDirection === 'up' && !isFullscreen() && deltaY < -COMPLETE_THRESHOLD) {
                // Portrait: swipe up → enter fullscreen
                completeFullscreenGesture();
            } else if (dragDirection === 'down' && !isFullscreen() && deltaY > COMPLETE_THRESHOLD) {
                // Portrait: swipe down → enter miniplayer mode
                enterMiniplayerMode();
            } else if (dragDirection === 'down' && isFullscreen() && deltaY > COMPLETE_THRESHOLD) {
                // Fullscreen: swipe down → exit fullscreen
                completeFullscreenGesture();
            } else {
                // Snap back
                resetTransform(true);
            }

            isDragging = false;
            dragDirection = null;
        }
    }, { capture: true, passive: true });

    document.addEventListener('touchcancel', () => {
        cancelLongPress();
        resetGestureState();
        resetTransform(true);
    }, { capture: true, passive: true });

    // Clean up transform AND reset all gesture state on fullscreen change
    function onFullscreenChange() {
        resetTransform(false);
        resetGestureState();
        cancelLongPress();
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
}
