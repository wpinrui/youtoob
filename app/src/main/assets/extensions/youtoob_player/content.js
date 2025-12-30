// Youtoob Player - Content Script
// Hides YouTube bottom nav and adds custom player controls

(function() {
    'use strict';

    console.log('[Youtoob] Content script loaded');

    // CSS to hide YouTube bottom navigation
    const hideBottomNavCSS = `
        ytm-pivot-bar-renderer,
        ytm-pivot-bar-item-renderer {
            display: none !important;
        }
        ytm-app {
            padding-bottom: 0 !important;
        }
    `;

    // Inject CSS immediately
    function injectCSS() {
        if (document.getElementById('youtoob-custom-style')) return;
        const style = document.createElement('style');
        style.id = 'youtoob-custom-style';
        style.textContent = hideBottomNavCSS;
        (document.head || document.documentElement).appendChild(style);
        console.log('[Youtoob] CSS injected');
    }

    // Try to inject CSS as early as possible
    if (document.head) {
        injectCSS();
    } else {
        document.addEventListener('DOMContentLoaded', injectCSS);
    }

    // Player controls - only on watch pages
    function isWatchPage() {
        return location.href.includes('/watch');
    }

    // Wait for video element
    function waitForVideo(callback) {
        const video = document.querySelector('video');
        if (video) {
            callback(video);
        } else {
            setTimeout(() => waitForVideo(callback), 500);
        }
    }

    // Get quality label from height
    function getQualityLabel(height) {
        if (height >= 2160) return '4K';
        if (height >= 1440) return '1440p';
        if (height >= 1080) return 'FHD';
        if (height >= 720) return 'HD';
        if (height >= 480) return '480p';
        if (height >= 360) return '360p';
        return 'Auto';
    }

    // Create custom controls overlay
    function createCustomControls(video) {
        console.log('[Youtoob] Creating custom controls');

        // Find the player container
        const playerContainer = document.querySelector('.html5-video-player') ||
                               document.querySelector('ytm-player') ||
                               video.parentElement;

        if (!playerContainer) {
            console.log('[Youtoob] No player container found');
            return;
        }

        // Remove existing custom controls if any
        const existing = document.getElementById('youtoob-controls');
        if (existing) existing.remove();

        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'youtoob-controls';
        overlay.innerHTML = `
            <style>
                #youtoob-controls {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 999;
                    pointer-events: none;
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
                }
                .youtoob-tap-zone {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .youtoob-skip-indicator {
                    background: rgba(0,0,0,0.7);
                    border-radius: 50%;
                    padding: 16px 20px;
                    opacity: 0;
                    transition: opacity 0.2s;
                    pointer-events: none;
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
                    font-size: 18px;
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
                    right: 60px;
                    display: flex;
                    gap: 6px;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.2s;
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
            </style>

            <div class="youtoob-tap-zones">
                <div class="youtoob-tap-zone" id="youtoob-left-zone">
                    <div class="youtoob-skip-indicator" id="youtoob-skip-back">
                        <span class="youtoob-skip-arrows">◀◀◀</span>
                        <span id="youtoob-skip-back-text">10 seconds</span>
                    </div>
                </div>
                <div class="youtoob-tap-zone" id="youtoob-center-zone"></div>
                <div class="youtoob-tap-zone" id="youtoob-right-zone">
                    <div class="youtoob-skip-indicator" id="youtoob-skip-forward">
                        <span class="youtoob-skip-arrows">▶▶▶</span>
                        <span id="youtoob-skip-forward-text">10 seconds</span>
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
            </div>
        `;

        // Make player container position relative for absolute positioning
        playerContainer.style.position = 'relative';
        playerContainer.appendChild(overlay);

        // State
        let controlsVisible = false;
        let hideTimeout = null;
        let skipBackAccum = 0;
        let skipForwardAccum = 0;
        let lastLeftTap = 0;
        let lastRightTap = 0;

        // Elements
        const playPauseBtn = document.getElementById('youtoob-play-pause');
        const speedBtn = document.getElementById('youtoob-speed');
        const speedMenu = document.getElementById('youtoob-speed-menu');
        const qualityBtn = document.getElementById('youtoob-quality');
        const qualityMenu = document.getElementById('youtoob-quality-menu');
        const skipBackIndicator = document.getElementById('youtoob-skip-back');
        const skipForwardIndicator = document.getElementById('youtoob-skip-forward');
        const skipBackText = document.getElementById('youtoob-skip-back-text');
        const skipForwardText = document.getElementById('youtoob-skip-forward-text');
        const leftZone = document.getElementById('youtoob-left-zone');
        const centerZone = document.getElementById('youtoob-center-zone');
        const rightZone = document.getElementById('youtoob-right-zone');

        // Update play/pause icon
        function updatePlayPause() {
            playPauseBtn.textContent = video.paused ? '▶' : '⏸';
        }
        video.addEventListener('play', updatePlayPause);
        video.addEventListener('pause', updatePlayPause);
        updatePlayPause();

        // Update quality display
        function updateQualityDisplay() {
            const height = video.videoHeight;
            qualityBtn.textContent = getQualityLabel(height);
        }
        video.addEventListener('loadedmetadata', updateQualityDisplay);
        video.addEventListener('resize', updateQualityDisplay);
        updateQualityDisplay();

        // Populate quality menu by checking available qualities
        function populateQualityMenu() {
            // Try to get available qualities from YouTube's player
            const ytPlayer = document.querySelector('.html5-video-player');
            let qualities = [];

            if (ytPlayer && ytPlayer.getAvailableQualityLevels) {
                qualities = ytPlayer.getAvailableQualityLevels();
            }

            // Fallback to common qualities
            if (!qualities || qualities.length === 0) {
                qualities = ['hd1080', 'hd720', 'large', 'medium', 'small'];
            }

            const qualityLabels = {
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

            qualityMenu.innerHTML = '';
            qualities.forEach(q => {
                const label = qualityLabels[q] || q;
                const div = document.createElement('div');
                div.className = 'youtoob-menu-option';
                div.dataset.quality = q;
                div.textContent = label;
                qualityMenu.appendChild(div);
            });

            // Add click handlers
            qualityMenu.querySelectorAll('.youtoob-menu-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const quality = option.dataset.quality;

                    // Try to set quality via YouTube's player API
                    const ytPlayer = document.querySelector('.html5-video-player');
                    if (ytPlayer && ytPlayer.setPlaybackQualityRange) {
                        ytPlayer.setPlaybackQualityRange(quality, quality);
                    } else if (ytPlayer && ytPlayer.setPlaybackQuality) {
                        ytPlayer.setPlaybackQuality(quality);
                    }

                    qualityMenu.querySelectorAll('.youtoob-menu-option').forEach(o => o.classList.remove('active'));
                    option.classList.add('active');
                    qualityMenu.classList.remove('show');
                    showControls();
                });
            });
        }
        populateQualityMenu();

        // Show/hide controls
        function showControls() {
            controlsVisible = true;
            overlay.classList.add('show-controls');
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(hideControls, 3000);
        }

        function hideControls() {
            controlsVisible = false;
            overlay.classList.remove('show-controls');
            speedMenu.classList.remove('show');
            qualityMenu.classList.remove('show');
        }

        function toggleControls() {
            if (controlsVisible) {
                hideControls();
            } else {
                showControls();
            }
        }

        // Double tap detection
        function handleLeftTap(e) {
            e.stopPropagation();
            const now = Date.now();
            if (now - lastLeftTap < 300) {
                // Double tap - skip back
                skipBackAccum += 10;
                video.currentTime = Math.max(0, video.currentTime - 10);
                skipBackText.textContent = skipBackAccum + ' seconds';
                skipBackIndicator.classList.add('show');
                clearTimeout(skipBackIndicator.hideTimeout);
                skipBackIndicator.hideTimeout = setTimeout(() => {
                    skipBackIndicator.classList.remove('show');
                    skipBackAccum = 0;
                }, 600);
            } else {
                // Single tap - toggle controls
                toggleControls();
            }
            lastLeftTap = now;
        }

        function handleRightTap(e) {
            e.stopPropagation();
            const now = Date.now();
            if (now - lastRightTap < 300) {
                // Double tap - skip forward
                skipForwardAccum += 10;
                video.currentTime = Math.min(video.duration, video.currentTime + 10);
                skipForwardText.textContent = skipForwardAccum + ' seconds';
                skipForwardIndicator.classList.add('show');
                clearTimeout(skipForwardIndicator.hideTimeout);
                skipForwardIndicator.hideTimeout = setTimeout(() => {
                    skipForwardIndicator.classList.remove('show');
                    skipForwardAccum = 0;
                }, 600);
            } else {
                // Single tap - toggle controls
                toggleControls();
            }
            lastRightTap = now;
        }

        function handleCenterTap(e) {
            e.stopPropagation();
            toggleControls();
        }

        // Event listeners
        leftZone.addEventListener('click', handleLeftTap);
        rightZone.addEventListener('click', handleRightTap);
        centerZone.addEventListener('click', handleCenterTap);

        playPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
            showControls();
        });

        document.getElementById('youtoob-prev').addEventListener('click', (e) => {
            e.stopPropagation();
            const prevBtn = document.querySelector('.ytp-prev-button') ||
                           document.querySelector('[aria-label*="Previous"]');
            if (prevBtn) prevBtn.click();
            showControls();
        });

        document.getElementById('youtoob-next').addEventListener('click', (e) => {
            e.stopPropagation();
            const nextBtn = document.querySelector('.ytp-next-button') ||
                           document.querySelector('[aria-label*="Next"]');
            if (nextBtn) nextBtn.click();
            showControls();
        });

        speedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            qualityMenu.classList.remove('show');
            speedMenu.classList.toggle('show');
            showControls();
        });

        qualityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            speedMenu.classList.remove('show');
            qualityMenu.classList.toggle('show');
            showControls();
        });

        document.querySelectorAll('#youtoob-speed-menu .youtoob-menu-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const speed = parseFloat(option.dataset.speed);
                video.playbackRate = speed;
                speedBtn.textContent = speed === 1 ? '1.0' : speed.toString();
                document.querySelectorAll('#youtoob-speed-menu .youtoob-menu-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                speedMenu.classList.remove('show');
                showControls();
            });
        });

        // Update speed button if video speed changes externally
        video.addEventListener('ratechange', () => {
            const rate = video.playbackRate;
            speedBtn.textContent = rate === 1 ? '1.0' : rate.toString();
        });

        console.log('[Youtoob] Custom player controls injected');
    }

    // Initialize player controls on watch pages
    let playerInjected = false;

    function initPlayerIfNeeded() {
        if (isWatchPage() && !playerInjected) {
            playerInjected = true;
            waitForVideo(createCustomControls);
        }
    }

    // Run on initial load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlayerIfNeeded);
    } else {
        initPlayerIfNeeded();
    }

    // Handle SPA navigation
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            injectCSS(); // Re-inject CSS on navigation
            if (isWatchPage()) {
                playerInjected = false;
                setTimeout(() => {
                    initPlayerIfNeeded();
                }, 1000);
            }
        }
    }).observe(document.body || document.documentElement, { subtree: true, childList: true });

})();
