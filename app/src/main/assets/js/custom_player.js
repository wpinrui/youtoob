(function() {
    // Don't run if already injected
    if (window.youtoobPlayerInjected) return;
    window.youtoobPlayerInjected = true;

    // Wait for video element
    function waitForVideo(callback) {
        const video = document.querySelector('video');
        if (video) {
            callback(video);
        } else {
            setTimeout(() => waitForVideo(callback), 500);
        }
    }

    // Create custom controls overlay
    function createCustomControls(video) {
        // Find the player container
        const playerContainer = document.querySelector('.html5-video-player') ||
                               document.querySelector('ytm-player') ||
                               video.parentElement;

        if (!playerContainer) return;

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
                    bottom: 48px;
                    right: 12px;
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                    pointer-events: auto;
                }
                .youtoob-speed-btn {
                    background: rgba(0,0,0,0.7);
                    border: none;
                    border-radius: 4px;
                    color: white;
                    padding: 6px 12px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                }
                .youtoob-speed-menu {
                    position: absolute;
                    bottom: 40px;
                    right: 0;
                    background: #212121;
                    border-radius: 8px;
                    padding: 8px 0;
                    display: none;
                }
                .youtoob-speed-menu.show {
                    display: block;
                }
                .youtoob-speed-option {
                    color: white;
                    padding: 12px 24px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .youtoob-speed-option:hover {
                    background: rgba(255,255,255,0.1);
                }
                .youtoob-speed-option.active {
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
                    <button class="youtoob-speed-btn" id="youtoob-speed">1.0x</button>
                    <div class="youtoob-speed-menu" id="youtoob-speed-menu">
                        <div class="youtoob-speed-option" data-speed="0.5">0.5x</div>
                        <div class="youtoob-speed-option" data-speed="0.75">0.75x</div>
                        <div class="youtoob-speed-option active" data-speed="1">1.0x</div>
                        <div class="youtoob-speed-option" data-speed="1.25">1.25x</div>
                        <div class="youtoob-speed-option" data-speed="1.5">1.5x</div>
                        <div class="youtoob-speed-option" data-speed="1.75">1.75x</div>
                        <div class="youtoob-speed-option" data-speed="2">2.0x</div>
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
        let lastCenterTap = 0;

        // Elements
        const playPauseBtn = document.getElementById('youtoob-play-pause');
        const speedBtn = document.getElementById('youtoob-speed');
        const speedMenu = document.getElementById('youtoob-speed-menu');
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
            // Try to click YouTube's previous button
            const prevBtn = document.querySelector('.ytp-prev-button') ||
                           document.querySelector('[aria-label*="Previous"]');
            if (prevBtn) prevBtn.click();
            showControls();
        });

        document.getElementById('youtoob-next').addEventListener('click', (e) => {
            e.stopPropagation();
            // Try to click YouTube's next button
            const nextBtn = document.querySelector('.ytp-next-button') ||
                           document.querySelector('[aria-label*="Next"]');
            if (nextBtn) nextBtn.click();
            showControls();
        });

        speedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            speedMenu.classList.toggle('show');
            showControls();
        });

        document.querySelectorAll('.youtoob-speed-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const speed = parseFloat(option.dataset.speed);
                video.playbackRate = speed;
                speedBtn.textContent = speed + 'x';
                document.querySelectorAll('.youtoob-speed-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                speedMenu.classList.remove('show');
                showControls();
            });
        });

        // Update speed button if video speed changes externally
        video.addEventListener('ratechange', () => {
            speedBtn.textContent = video.playbackRate + 'x';
        });

        console.log('Youtoob custom player controls injected');
    }

    // Initialize
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
                }, 1000);
            }
        }
    }).observe(document.body, { subtree: true, childList: true });
})();
