// =============================================================================
// Playback Controls Setup
// =============================================================================

function setupPlaybackControls(video, playPauseBtn, controls) {
    function updatePlayPause() {
        playPauseBtn.innerHTML = video.paused ? ICONS.play : ICONS.pause;
    }

    video.addEventListener('play', updatePlayPause);
    video.addEventListener('pause', updatePlayPause);
    updatePlayPause();

    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
        controls.show();
    });

    document.getElementById('youtoob-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        const prevBtn = document.querySelector('.ytp-prev-button') ||
            document.querySelector('[aria-label*="Previous"]');
        if (prevBtn) prevBtn.click();
        controls.show();
    });

    document.getElementById('youtoob-next').addEventListener('click', (e) => {
        e.stopPropagation();
        const nextBtn = document.querySelector('.ytp-next-button') ||
            document.querySelector('[aria-label*="Next"]');
        if (nextBtn) nextBtn.click();
        controls.show();
    });
}

// =============================================================================
// Fullscreen Setup
// =============================================================================

function setupFullscreen(overlay, controls) {
    document.getElementById('youtoob-fullscreen').addEventListener('click', (e) => {
        e.stopPropagation();
        const ytFullscreen = document.querySelector('.ytp-fullscreen-button') ||
            document.querySelector('[aria-label*="ull screen"]') ||
            document.querySelector('button.fullscreen-icon');
        if (ytFullscreen) {
            ytFullscreen.click();
        } else {
            const videoEl = document.querySelector('video');
            if (videoEl) {
                const fsElement = document.fullscreenElement || document.webkitFullscreenElement;
                if (fsElement) {
                    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
                } else {
                    (videoEl.requestFullscreen || videoEl.webkitRequestFullscreen).call(videoEl);
                }
            }
        }
        controls.show();
    });

    function checkFullscreen() {
        const fsElement = document.fullscreenElement || document.webkitFullscreenElement;
        const isFullscreen = !!fsElement;
        const wasFullscreen = overlay.classList.contains('fullscreen');

        if (isFullscreen && !wasFullscreen) {
            // Entering fullscreen - move overlay into fullscreen element
            overlay.classList.add('fullscreen');
            const target = fsElement.tagName === 'VIDEO' ? fsElement.parentElement : fsElement;
            target.appendChild(overlay);
        } else if (!isFullscreen && wasFullscreen) {
            // Exiting fullscreen - move overlay back to player container
            overlay.classList.remove('fullscreen');
            if (window._youtoobPlayerContainer) {
                window._youtoobPlayerContainer.appendChild(overlay);
            }
        }
    }

    // Store handler globally for cleanup on re-injection
    window._youtoobFsHandler = () => {
        checkFullscreen();
        controls.show();
    };

    document.addEventListener('fullscreenchange', window._youtoobFsHandler);
    document.addEventListener('webkitfullscreenchange', window._youtoobFsHandler);

    // Poll for fullscreen (YouTube sometimes doesn't trigger events)
    window._youtoobFsInterval = setInterval(checkFullscreen, FULLSCREEN_POLL_INTERVAL_MS);
}

// =============================================================================
// Quality Display
// =============================================================================

function setupQualityDisplay(video, qualityBtn) {
    function updateQualityDisplay() {
        qualityBtn.textContent = getQualityLabel(video.videoHeight);
    }

    video.addEventListener('loadedmetadata', updateQualityDisplay);
    video.addEventListener('resize', updateQualityDisplay);
    updateQualityDisplay();
}
