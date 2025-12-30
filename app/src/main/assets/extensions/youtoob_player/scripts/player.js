(function() {
    // Don't run if already injected
    if (window.youtoobPlayerInjected) return;
    window.youtoobPlayerInjected = true;

    // =============================================================================
    // Constants
    // =============================================================================

    const DOUBLE_TAP_THRESHOLD_MS = 300;
    const SKIP_INDICATOR_HIDE_MS = 600;
    const CONTROLS_AUTO_HIDE_MS = 3000;
    const SKIP_SECONDS = 10;
    const SPA_NAVIGATION_DELAY_MS = 1000;
    const VIDEO_POLL_INTERVAL_MS = 500;

    const QUALITY_LABELS = {
        'hd2160': '4K (2160p)',
        'hd1440': '1440p',
        'hd1080': '1080p (FHD)',
        'hd720': '720p (HD)',
        'large': '480p',
        'medium': '360p',
        'small': '240p',
        'tiny': '144p',
        'auto': 'Auto'
    };

    const FALLBACK_QUALITIES = ['hd1080', 'hd720', 'large', 'medium', 'small'];

    // =============================================================================
    // CSS Styles
    // =============================================================================

    const PLAYER_STYLES = `
        /* Hide YouTube's native mobile controls */
        .player-controls-content,
        .ytp-chrome-bottom,
        .ytp-chrome-top,
        .ytp-gradient-bottom,
        .ytp-gradient-top,
        .ytp-bezel,
        .ytp-doubletap-ui,
        .ytp-doubletap-ui-legacy,
        ytm-custom-control,
        .ytm-autonav-bar,
        .player-controls-background {
            display: none !important;
            pointer-events: none !important;
        }

        #youtoob-controls {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 99999 !important;
            pointer-events: none;
            overflow: visible;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
        }
        #youtoob-controls.show-controls .youtoob-center-controls {
            opacity: 1;
        }
        #youtoob-controls.show-controls .youtoob-bottom-bar {
            opacity: 1;
        }
        .youtoob-tap-zones {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            pointer-events: auto;
            z-index: 100000;
            overflow: visible;
        }
        .youtoob-tap-zone {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: visible;
        }
        .youtoob-skip-indicator {
            background: rgba(0,0,0,0.3);
            border-radius: 50%;
            width: 100vh;
            height: 100vh;
            opacity: 0;
            transition: opacity 0.15s;
            pointer-events: none;
            position: absolute;
        }
        .youtoob-skip-content {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        #youtoob-left-zone .youtoob-skip-indicator {
            left: 0;
            transform: translateX(-50%);
        }
        #youtoob-left-zone .youtoob-skip-content {
            right: 25%;
        }
        #youtoob-right-zone .youtoob-skip-indicator {
            right: 0;
            transform: translateX(50%);
        }
        #youtoob-right-zone .youtoob-skip-content {
            left: 25%;
        }
        .youtoob-skip-indicator.show {
            opacity: 1;
        }
        .youtoob-skip-indicator span {
            color: white;
            font-size: 14px;
            display: block;
            text-align: center;
        }
        .youtoob-skip-arrows {
            font-size: 24px;
            letter-spacing: -4px;
        }
        .youtoob-center-controls {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            gap: 32px;
            align-items: center;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
            z-index: 100001;
        }
        #youtoob-controls.show-controls .youtoob-center-controls {
            pointer-events: auto;
        }
        .youtoob-btn {
            background: rgba(0,0,0,0.6);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .youtoob-btn-small {
            width: 48px;
            height: 48px;
            font-size: 24px;
        }
        .youtoob-btn-large {
            width: 64px;
            height: 64px;
            font-size: 32px;
        }
        .youtoob-bottom-bar {
            position: absolute;
            bottom: 10px;
            right: 10px;
            display: flex;
            gap: 6px;
            align-items: center;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
            z-index: 100001;
        }
        #youtoob-controls.show-controls .youtoob-bottom-bar {
            pointer-events: auto;
        }
        .youtoob-pill-btn {
            background: rgba(0,0,0,0.6);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 4px;
            color: white;
            padding: 4px 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            min-width: 36px;
            text-align: center;
        }
        .youtoob-pill-btn:active {
            background: rgba(255,255,255,0.2);
        }
        .youtoob-menu {
            position: absolute;
            bottom: 36px;
            right: 0;
            background: #212121;
            border-radius: 8px;
            padding: 8px 0;
            display: none;
            min-width: 100px;
        }
        .youtoob-menu.show {
            display: block;
        }
        .youtoob-menu-option {
            color: white;
            padding: 10px 16px;
            cursor: pointer;
            font-size: 13px;
            white-space: nowrap;
        }
        .youtoob-menu-option:hover {
            background: rgba(255,255,255,0.1);
        }
        .youtoob-menu-option.active {
            color: #3ea6ff;
            font-weight: bold;
        }
    `;

    // =============================================================================
    // HTML Template
    // =============================================================================

    function getOverlayHTML() {
        return `
            <style>${PLAYER_STYLES}</style>

            <div class="youtoob-tap-zones">
                <div class="youtoob-tap-zone" id="youtoob-left-zone">
                    <div class="youtoob-skip-indicator" id="youtoob-skip-back">
                        <div class="youtoob-skip-content">
                            <span class="youtoob-skip-arrows">◀◀◀</span>
                            <span id="youtoob-skip-back-text">${SKIP_SECONDS} seconds</span>
                        </div>
                    </div>
                </div>
                <div class="youtoob-tap-zone" id="youtoob-center-zone"></div>
                <div class="youtoob-tap-zone" id="youtoob-right-zone">
                    <div class="youtoob-skip-indicator" id="youtoob-skip-forward">
                        <div class="youtoob-skip-content">
                            <span class="youtoob-skip-arrows">▶▶▶</span>
                            <span id="youtoob-skip-forward-text">${SKIP_SECONDS} seconds</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="youtoob-center-controls">
                <button class="youtoob-btn youtoob-btn-small" id="youtoob-prev">⏮</button>
                <button class="youtoob-btn youtoob-btn-large" id="youtoob-play-pause">▶</button>
                <button class="youtoob-btn youtoob-btn-small" id="youtoob-next">⏭</button>
            </div>

            <div class="youtoob-bottom-bar">
                <div style="position: relative;">
                    <button class="youtoob-pill-btn" id="youtoob-quality">FHD</button>
                    <div class="youtoob-menu" id="youtoob-quality-menu"></div>
                </div>
                <div style="position: relative;">
                    <button class="youtoob-pill-btn" id="youtoob-speed">1.0</button>
                    <div class="youtoob-menu" id="youtoob-speed-menu">
                        <div class="youtoob-menu-option" data-speed="0.5">0.5x</div>
                        <div class="youtoob-menu-option" data-speed="0.75">0.75x</div>
                        <div class="youtoob-menu-option active" data-speed="1">1.0x</div>
                        <div class="youtoob-menu-option" data-speed="1.25">1.25x</div>
                        <div class="youtoob-menu-option" data-speed="1.5">1.5x</div>
                        <div class="youtoob-menu-option" data-speed="1.75">1.75x</div>
                        <div class="youtoob-menu-option" data-speed="2">2.0x</div>
                    </div>
                </div>
                <button class="youtoob-pill-btn" id="youtoob-fullscreen">⛶</button>
            </div>
        `;
    }

    // =============================================================================
    // Helper Functions
    // =============================================================================

    function waitForVideo(callback) {
        const video = document.querySelector('video');
        if (video) {
            callback(video);
        } else {
            setTimeout(() => waitForVideo(callback), VIDEO_POLL_INTERVAL_MS);
        }
    }

    function getQualityLabel(height) {
        if (height >= 2160) return '4K';
        if (height >= 1440) return '1440p';
        if (height >= 1080) return 'FHD';
        if (height >= 720) return 'HD';
        if (height >= 480) return '480p';
        if (height >= 360) return '360p';
        return 'Auto';
    }

    function findPlayerContainer(video) {
        return document.querySelector('ytm-player') ||
               document.querySelector('.html5-video-player') ||
               video.parentElement;
    }

    function ensureRelativePositioning(container) {
        const style = getComputedStyle(container);
        if (style.position === 'static') {
            container.style.position = 'relative';
        }
    }

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

    // =============================================================================
    // Quality Menu Setup
    // =============================================================================

    function setupQualityMenu(qualityMenu, controls) {
        const ytPlayer = document.querySelector('.html5-video-player');
        let qualities = [];

        if (ytPlayer && ytPlayer.getAvailableQualityLevels) {
            qualities = ytPlayer.getAvailableQualityLevels();
        }

        if (!qualities || qualities.length === 0) {
            qualities = FALLBACK_QUALITIES;
        }

        qualityMenu.innerHTML = '';
        qualities.forEach(q => {
            const label = QUALITY_LABELS[q] || q;
            const div = document.createElement('div');
            div.className = 'youtoob-menu-option';
            div.dataset.quality = q;
            div.textContent = label;
            qualityMenu.appendChild(div);
        });

        qualityMenu.querySelectorAll('.youtoob-menu-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const quality = option.dataset.quality;

                const ytPlayer = document.querySelector('.html5-video-player');
                if (ytPlayer && ytPlayer.setPlaybackQualityRange) {
                    ytPlayer.setPlaybackQualityRange(quality, quality);
                } else if (ytPlayer && ytPlayer.setPlaybackQuality) {
                    ytPlayer.setPlaybackQuality(quality);
                }

                qualityMenu.querySelectorAll('.youtoob-menu-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                qualityMenu.classList.remove('show');
                controls.show();
            });
        });
    }

    // =============================================================================
    // Speed Menu Setup
    // =============================================================================

    function setupSpeedMenu(video, speedBtn, speedMenu, controls) {
        document.querySelectorAll('#youtoob-speed-menu .youtoob-menu-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const speed = parseFloat(option.dataset.speed);
                video.playbackRate = speed;
                speedBtn.textContent = speed === 1 ? '1.0' : speed.toString();
                document.querySelectorAll('#youtoob-speed-menu .youtoob-menu-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                speedMenu.classList.remove('show');
                controls.show();
            });
        });

        video.addEventListener('ratechange', () => {
            const rate = video.playbackRate;
            speedBtn.textContent = rate === 1 ? '1.0' : rate.toString();
        });
    }

    // =============================================================================
    // Playback Controls Setup
    // =============================================================================

    function setupPlaybackControls(video, playPauseBtn, controls) {
        function updatePlayPause() {
            playPauseBtn.textContent = video.paused ? '▶' : '⏸';
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

    // Store fullscreen handler globally so we can remove it on re-injection
    let currentFullscreenHandler = null;

    function setupFullscreen(overlay, playerContainer, controls) {
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
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        videoEl.requestFullscreen();
                    }
                }
            }
            controls.show();
        });

        // Remove previous fullscreen handler if exists
        if (currentFullscreenHandler) {
            document.removeEventListener('fullscreenchange', currentFullscreenHandler);
        }

        currentFullscreenHandler = () => {
            if (document.fullscreenElement) {
                document.fullscreenElement.appendChild(overlay);
            } else {
                playerContainer.appendChild(overlay);
            }
            controls.show();
        };

        document.addEventListener('fullscreenchange', currentFullscreenHandler);
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

        // Remove ALL existing controls (may be in different containers during fullscreen)
        document.querySelectorAll('#youtoob-controls').forEach(el => el.remove());

        // Create and append overlay
        const overlay = document.createElement('div');
        overlay.id = 'youtoob-controls';
        overlay.innerHTML = getOverlayHTML();
        playerContainer.appendChild(overlay);

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
        setupFullscreen(overlay, playerContainer, controls);

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

        console.log('Youtoob custom player controls injected');
    }

    // =============================================================================
    // Initialize
    // =============================================================================

    waitForVideo(createCustomControls);

    // Re-inject on navigation (YouTube SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            if (location.href.includes('/watch')) {
                window.youtoobPlayerInjected = false;
                setTimeout(() => {
                    window.youtoobPlayerInjected = true;
                    waitForVideo(createCustomControls);
                }, SPA_NAVIGATION_DELAY_MS);
            }
        }
    }).observe(document.body, { subtree: true, childList: true });
})();
