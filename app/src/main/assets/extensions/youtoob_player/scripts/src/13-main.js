// =============================================================================
// Main Setup Function
// =============================================================================

function createCustomControls(video) {
    const playerContainer = findPlayerContainer(video);
    if (!playerContainer) {
        console.log('[YouToob] No player container found');
        return;
    }

    ensureRelativePositioning(playerContainer);

    // Create and append overlay (cleanup already done at script start)
    const overlay = document.createElement('div');
    overlay.id = 'youtoob-controls';
    overlay.innerHTML = getOverlayHTML();
    playerContainer.appendChild(overlay);

    // Store reference globally for cleanup on re-injection
    window._youtoobOverlay = overlay;
    window._youtoobPlayerContainer = playerContainer;

    // Get element references
    const elements = {
        playPauseBtn: document.getElementById('youtoob-play-pause'),
        speedBtn: document.getElementById('youtoob-speed'),
        speedMenu: document.getElementById('youtoob-speed-menu'),
        qualityBtn: document.getElementById('youtoob-quality'),
        qualityMenu: document.getElementById('youtoob-quality-menu'),
        skipBackIndicator: document.getElementById('youtoob-skip-back'),
        skipForwardIndicator: document.getElementById('youtoob-skip-forward'),
        skipBackText: document.getElementById('youtoob-skip-back-text'),
        skipForwardText: document.getElementById('youtoob-skip-forward-text'),
        leftZone: document.getElementById('youtoob-left-zone'),
        centerZone: document.getElementById('youtoob-center-zone'),
        rightZone: document.getElementById('youtoob-right-zone')
    };

    // Create controls manager
    const controls = createControlsManager(overlay, elements.speedMenu, elements.qualityMenu, video);

    // Setup tap zones
    const handleLeftTap = createDoubleTapHandler(
        video, elements.skipBackIndicator, elements.skipBackText, 'back', controls
    );
    const handleRightTap = createDoubleTapHandler(
        video, elements.skipForwardIndicator, elements.skipForwardText, 'forward', controls
    );

    // Touch handlers (touchstart for immediate response)
    elements.leftZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleLeftTap(e);
    }, { passive: false });
    elements.rightZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleRightTap(e);
    }, { passive: false });
    elements.centerZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        controls.toggle();
    }, { passive: false });
    // Click handlers for desktop
    elements.leftZone.addEventListener('click', handleLeftTap);
    elements.rightZone.addEventListener('click', handleRightTap);
    elements.centerZone.addEventListener('click', (e) => {
        e.stopPropagation();
        controls.toggle();
    });

    // Setup all controls
    setupPlaybackControls(video, elements.playPauseBtn, controls);
    setupQualityDisplay(video, elements.qualityBtn);
    setupQualityMenu(elements.qualityMenu, controls);
    setupSpeedMenu(video, elements.speedBtn, elements.speedMenu, controls);
    setupFullscreen(overlay, controls);
    setupSeekBar(video, controls);
    setupTopBar(video, controls);
    setupGestures(video, overlay, controls);

    // Menu toggle buttons
    elements.speedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.qualityMenu.classList.remove('show');
        elements.speedMenu.classList.toggle('show');
        controls.show();
    });

    elements.qualityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.speedMenu.classList.remove('show');
        elements.qualityMenu.classList.toggle('show');
        controls.show();
    });

    // Show controls initially
    controls.show();
}

// =============================================================================
// Initialize
// =============================================================================

// Just create controls - content_script.js handles SPA navigation re-injection
waitForVideo(createCustomControls);
