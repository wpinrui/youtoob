// =============================================================================
// Settings Helpers
// =============================================================================

function getYoutoobSettings() {
    // First check window object (set by native injection)
    if (window._youtoobSettings) {
        return window._youtoobSettings;
    }
    // Fallback to localStorage
    try {
        const stored = localStorage.getItem('youtoob_settings');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        // Ignore parse errors
    }
    // Default settings
    return {
        defaultQuality: 'auto',
        defaultSpeed: 1.0,
        autoplayEnabled: true
    };
}

// =============================================================================
// Auto Quality Setting
// =============================================================================

function autoSetQuality() {
    const settings = getYoutoobSettings();
    const preferredQuality = settings.defaultQuality;

    // If user prefers auto, don't set quality
    if (preferredQuality === 'auto') {
        return;
    }

    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        const ytPlayer = document.querySelector('.html5-video-player');

        if (!ytPlayer || !ytPlayer.getAvailableQualityLevels || !ytPlayer.setPlaybackQualityRange) {
            if (attempts >= AUTO_QUALITY_MAX_ATTEMPTS) {
                clearInterval(interval);
            }
            return;
        }

        const availableQualities = ytPlayer.getAvailableQualityLevels();
        if (!availableQualities || availableQualities.length === 0) {
            if (attempts >= AUTO_QUALITY_MAX_ATTEMPTS) {
                clearInterval(interval);
            }
            return;
        }

        // Find the preferred quality or next best available
        let targetQuality = null;

        // First try to get the exact preferred quality
        if (availableQualities.includes(preferredQuality)) {
            targetQuality = preferredQuality;
        } else {
            // Find the closest lower quality
            const qualityIndex = QUALITY_PRIORITY.indexOf(preferredQuality);
            if (qualityIndex !== -1) {
                for (let i = qualityIndex; i < QUALITY_PRIORITY.length; i++) {
                    if (availableQualities.includes(QUALITY_PRIORITY[i])) {
                        targetQuality = QUALITY_PRIORITY[i];
                        break;
                    }
                }
            }
        }

        if (targetQuality) {
            ytPlayer.setPlaybackQualityRange(targetQuality, targetQuality);
            clearInterval(interval);
        } else if (attempts >= AUTO_QUALITY_MAX_ATTEMPTS) {
            clearInterval(interval);
        }
    }, AUTO_QUALITY_POLL_INTERVAL_MS);
}

// =============================================================================
// Auto Speed Setting
// =============================================================================

function autoSetSpeed(video) {
    const settings = getYoutoobSettings();
    const preferredSpeed = settings.defaultSpeed;

    // Only set if different from default
    if (preferredSpeed !== 1.0 && video) {
        video.playbackRate = preferredSpeed;
    }
}

// =============================================================================
// Speed Formatting
// =============================================================================

function formatSpeed(speed) {
    return Number.isInteger(speed) ? speed.toFixed(1) : speed.toString();
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
    qualities.forEach(quality => {
        const label = QUALITY_LABELS[quality] || quality;
        const div = document.createElement('div');
        div.className = 'youtoob-menu-option';
        div.dataset.quality = quality;
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

            qualityMenu.querySelectorAll('.youtoob-menu-option').forEach(opt => opt.classList.remove('active'));
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
            speedBtn.textContent = formatSpeed(speed);
            document.querySelectorAll('#youtoob-speed-menu .youtoob-menu-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            speedMenu.classList.remove('show');
            controls.show();
        });
    });

    video.addEventListener('ratechange', () => {
        speedBtn.textContent = formatSpeed(video.playbackRate);
    });
}
