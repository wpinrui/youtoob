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

    // Constants defined in 02-constants.js: DRAG_THRESHOLD, COMPLETE_THRESHOLD, LONG_PRESS_DELAY_MS, PINCH_THRESHOLD

    function getPlayerContainer() {
        return window._youtoobPlayerContainer || video.parentElement;
    }

    // Long press for 2x speed
    function startLongPressTimer() {
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            originalSpeed = video.playbackRate;
            video.playbackRate = 2;
        }, LONG_PRESS_DELAY_MS);
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

    // isFullscreen() is defined in 06-helpers.js

    // Calculate distance between two touch points
    function getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate max scale needed to fill the screen
    function getFillScale() {
        const videoAspect = video.videoWidth / video.videoHeight;
        const screenAspect = window.innerWidth / window.innerHeight;
        if (screenAspect > videoAspect) {
            return screenAspect / videoAspect;
        } else {
            return videoAspect / screenAspect;
        }
    }

    // Apply scale during pinch (no transition - follows fingers)
    function applyPinchScale(scale) {
        video.style.transition = 'none';
        video.style.transform = scale === 1 ? '' : `scale(${scale})`;
        video.style.transformOrigin = 'center center';
    }

    // Snap to fill or fit with animation
    function snapToFillMode(fill) {
        isFillMode = fill;
        video.style.transition = 'transform 0.2s ease-out';
        if (fill) {
            const scale = getFillScale();
            video.style.transform = `scale(${scale})`;
        } else {
            video.style.transform = '';
        }
        video.style.transformOrigin = 'center center';
    }

    // Apply progressive transform during drag
    function applyDragTransform(deltaY) {
        const container = getPlayerContainer();
        if (!container) return;

        if (!isFullscreen()) {
            // Portrait mode: dragging UP to enter fullscreen
            // Scale video and translate up as user drags (fills toward notification bar)
            if (deltaY < -DRAG_THRESHOLD) {
                const progress = Math.min(Math.abs(deltaY + DRAG_THRESHOLD) / COMPLETE_THRESHOLD, 1);
                const scale = 1 + (progress * 0.3); // Scale up to 1.3x for dramatic effect
                const translateY = -progress * 20; // Move up toward notification bar
                video.style.transition = 'none';
                video.style.transform = `scale(${scale}) translateY(${translateY}px)`;
                video.style.transformOrigin = 'center center';
            }
        } else {
            // Fullscreen mode: dragging DOWN to exit
            // Translate video down as user drags
            if (deltaY > DRAG_THRESHOLD) {
                const translateY = Math.min(deltaY - DRAG_THRESHOLD, COMPLETE_THRESHOLD * 1.5);
                const scale = 1 - (translateY / (COMPLETE_THRESHOLD * 10)); // Slight scale down
                video.style.transition = 'none';
                video.style.transform = `translateY(${translateY}px) scale(${Math.max(scale, 0.9)})`;
                video.style.transformOrigin = 'center top';
            }
        }
    }

    // Reset transform with animation
    function resetTransform(animate = true) {
        if (animate) {
            video.style.transition = 'transform 0.25s ease-out';
        }
        video.style.transform = '';
        video.style.transformOrigin = '';

        if (animate) {
            setTimeout(() => {
                video.style.transition = '';
            }, 250);
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

    document.addEventListener('touchend', (e) => {
        cancelLongPress();

        // Reset pinch state - snap to fill or fit based on current scale
        if (isPinching) {
            // Get current transform to determine which mode to snap to
            const currentTransform = video.style.transform;
            const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
            const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
            const fillScale = getFillScale();
            const midpoint = (1 + fillScale) / 2;

            // Snap to fill if past midpoint, otherwise fit
            const shouldFill = currentScale > midpoint;
            snapToFillMode(shouldFill);

            isPinching = false;
            initialPinchDistance = 0;
            touchStartTime = 0;
            isDragging = false;
            dragDirection = null;
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
                completeFullscreenGesture();
            } else if (dragDirection === 'down' && isFullscreen() && deltaY > COMPLETE_THRESHOLD) {
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
