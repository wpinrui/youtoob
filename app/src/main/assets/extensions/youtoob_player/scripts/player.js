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
    // SVG Icons
    // =============================================================================

    const ICONS = {
        play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
        prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>',
        next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
        fullscreen: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
        skipBack: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>',
        skipForward: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>'
    };

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
        .youtoob-overlay-bg {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.55);
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
            z-index: 1;
        }
        #youtoob-controls.show-controls .youtoob-overlay-bg {
            opacity: 1;
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
        .youtoob-skip-icon svg {
            width: 100%;
            height: 100%;
            fill: white;
        }
        .youtoob-center-controls {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            gap: 48px;
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
            background: rgba(0,0,0,0.35);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .youtoob-btn svg {
            width: 60%;
            height: 60%;
        }
        .youtoob-btn-small {
            width: 48px;
            height: 48px;
        }
        .youtoob-btn-large {
            width: 64px;
            height: 64px;
        }
        .youtoob-skip-icon {
            width: 32px;
            height: 32px;
            margin-bottom: 4px;
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
            background: transparent;
            border: 1px solid rgba(255,255,255,0.5);
            border-radius: 4px;
            color: white;
            padding: 0;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            min-width: 40px;
            height: 28px;
            line-height: 28px;
            text-align: center;
        }
        .youtoob-pill-btn:active {
            background: rgba(255,255,255,0.2);
        }
        .youtoob-fullscreen-btn {
            background: transparent;
            border: none;
            color: white;
            padding: 0;
            cursor: pointer;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .youtoob-fullscreen-btn svg {
            width: 24px;
            height: 24px;
        }
        .youtoob-fullscreen-btn:active {
            opacity: 0.7;
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
        /* Seek bar styles */
        .youtoob-seek-container {
            position: absolute;
            bottom: 48px;
            left: 12px;
            right: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
            z-index: 100001;
        }
        #youtoob-controls.show-controls .youtoob-seek-container {
            opacity: 1;
            pointer-events: auto;
        }
        .youtoob-time {
            color: white;
            font-size: 12px;
            font-weight: 500;
            min-width: 40px;
            text-align: center;
            font-family: Roboto, Arial, sans-serif;
        }
        .youtoob-time-current {
            text-align: right;
        }
        .youtoob-time-duration {
            text-align: left;
        }
        .youtoob-seek-bar {
            flex: 1;
            height: 24px;
            display: flex;
            align-items: center;
            cursor: pointer;
            position: relative;
        }
        .youtoob-seek-track {
            position: absolute;
            left: 0;
            right: 0;
            height: 3px;
            background: rgba(255,255,255,0.3);
            border-radius: 1.5px;
        }
        .youtoob-seek-buffer {
            position: absolute;
            left: 0;
            height: 3px;
            background: rgba(255,255,255,0.5);
            border-radius: 1.5px;
            width: 0%;
        }
        .youtoob-seek-progress {
            position: absolute;
            left: 0;
            height: 3px;
            background: #ff0000;
            border-radius: 1.5px;
            width: 0%;
        }
        .youtoob-seek-thumb {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #ff0000;
            border-radius: 50%;
            transform: translateX(-50%);
            left: 0%;
            box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
        .youtoob-seek-bar:active .youtoob-seek-thumb {
            width: 16px;
            height: 16px;
        }
        .youtoob-seek-bar:active .youtoob-seek-track,
        .youtoob-seek-bar:active .youtoob-seek-buffer,
        .youtoob-seek-bar:active .youtoob-seek-progress {
            height: 5px;
        }
    `;

    // =============================================================================
    // HTML Template
    // =============================================================================

    function getOverlayHTML() {
        return `
            <style>${PLAYER_STYLES}</style>

            <div class="youtoob-overlay-bg"></div>

            <div class="youtoob-tap-zones">
                <div class="youtoob-tap-zone" id="youtoob-left-zone">
                    <div class="youtoob-skip-indicator" id="youtoob-skip-back">
                        <div class="youtoob-skip-content">
                            <div class="youtoob-skip-icon">${ICONS.skipBack}</div>
                            <span id="youtoob-skip-back-text">${SKIP_SECONDS} seconds</span>
                        </div>
                    </div>
                </div>
                <div class="youtoob-tap-zone" id="youtoob-center-zone"></div>
                <div class="youtoob-tap-zone" id="youtoob-right-zone">
                    <div class="youtoob-skip-indicator" id="youtoob-skip-forward">
                        <div class="youtoob-skip-content">
                            <div class="youtoob-skip-icon">${ICONS.skipForward}</div>
                            <span id="youtoob-skip-forward-text">${SKIP_SECONDS} seconds</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="youtoob-center-controls">
                <button class="youtoob-btn youtoob-btn-small" id="youtoob-prev">${ICONS.prev}</button>
                <button class="youtoob-btn youtoob-btn-large" id="youtoob-play-pause">${ICONS.play}</button>
                <button class="youtoob-btn youtoob-btn-small" id="youtoob-next">${ICONS.next}</button>
            </div>

            <div class="youtoob-seek-container">
                <span class="youtoob-time youtoob-time-current" id="youtoob-time-current">0:00</span>
                <div class="youtoob-seek-bar" id="youtoob-seek-bar">
                    <div class="youtoob-seek-track"></div>
                    <div class="youtoob-seek-buffer" id="youtoob-seek-buffer"></div>
                    <div class="youtoob-seek-progress" id="youtoob-seek-progress"></div>
                    <div class="youtoob-seek-thumb" id="youtoob-seek-thumb"></div>
                </div>
                <span class="youtoob-time youtoob-time-duration" id="youtoob-time-duration">0:00</span>
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
                <button class="youtoob-fullscreen-btn" id="youtoob-fullscreen">${ICONS.fullscreen}</button>
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

    function formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '0:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    // Seek Bar Setup
    // =============================================================================

    function setupSeekBar(video, controls) {
        const seekBar = document.getElementById('youtoob-seek-bar');
        const seekProgress = document.getElementById('youtoob-seek-progress');
        const seekBuffer = document.getElementById('youtoob-seek-buffer');
        const seekThumb = document.getElementById('youtoob-seek-thumb');
        const timeCurrent = document.getElementById('youtoob-time-current');
        const timeDuration = document.getElementById('youtoob-time-duration');

        let isSeeking = false;

        function updateProgress() {
            if (isSeeking) return;
            const percent = (video.currentTime / video.duration) * 100 || 0;
            seekProgress.style.width = percent + '%';
            seekThumb.style.left = percent + '%';
            timeCurrent.textContent = formatTime(video.currentTime);
        }

        function updateBuffer() {
            if (video.buffered.length > 0) {
                const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                const percent = (bufferedEnd / video.duration) * 100 || 0;
                seekBuffer.style.width = percent + '%';
            }
        }

        function updateDuration() {
            timeDuration.textContent = formatTime(video.duration);
        }

        function seekToPosition(clientX) {
            const rect = seekBar.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const time = percent * video.duration;
            video.currentTime = time;
            seekProgress.style.width = (percent * 100) + '%';
            seekThumb.style.left = (percent * 100) + '%';
            timeCurrent.textContent = formatTime(time);
        }

        // Touch events for seeking
        seekBar.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            isSeeking = true;
            seekToPosition(e.touches[0].clientX);
            controls.show();
        });

        seekBar.addEventListener('touchmove', (e) => {
            if (isSeeking) {
                e.preventDefault();
                seekToPosition(e.touches[0].clientX);
            }
        });

        seekBar.addEventListener('touchend', () => {
            isSeeking = false;
        });

        // Mouse events (for testing on desktop)
        seekBar.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isSeeking = true;
            seekToPosition(e.clientX);
            controls.show();
        });

        document.addEventListener('mousemove', (e) => {
            if (isSeeking) {
                seekToPosition(e.clientX);
            }
        });

        document.addEventListener('mouseup', () => {
            isSeeking = false;
        });

        // Click to seek
        seekBar.addEventListener('click', (e) => {
            e.stopPropagation();
            seekToPosition(e.clientX);
            controls.show();
        });

        // Video event listeners
        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('progress', updateBuffer);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('durationchange', updateDuration);

        // Initial update
        updateProgress();
        updateBuffer();
        updateDuration();
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
        setupSeekBar(video, controls);

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
