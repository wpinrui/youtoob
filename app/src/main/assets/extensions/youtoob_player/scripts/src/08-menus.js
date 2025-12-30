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

function findBestAvailableQuality(availableQualities, preferredQuality) {
    if (availableQualities.includes(preferredQuality)) {
        return preferredQuality;
    }
    const qualityIndex = QUALITY_PRIORITY.indexOf(preferredQuality);
    if (qualityIndex === -1) return null;

    for (let i = qualityIndex; i < QUALITY_PRIORITY.length; i++) {
        if (availableQualities.includes(QUALITY_PRIORITY[i])) {
            return QUALITY_PRIORITY[i];
        }
    }
    return null;
}

function autoSetQuality() {
    const settings = getYoutoobSettings();
    const preferredQuality = settings.defaultQuality;

    if (preferredQuality === 'auto') return;

    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        const ytPlayer = document.querySelector('.html5-video-player');
        const hasPlayerApi = ytPlayer?.getAvailableQualityLevels && ytPlayer?.setPlaybackQualityRange;

        if (!hasPlayerApi) {
            if (attempts >= AUTO_QUALITY_MAX_ATTEMPTS) clearInterval(interval);
            return;
        }

        const availableQualities = ytPlayer.getAvailableQualityLevels();
        if (!availableQualities?.length) {
            if (attempts >= AUTO_QUALITY_MAX_ATTEMPTS) clearInterval(interval);
            return;
        }

        const targetQuality = findBestAvailableQuality(availableQualities, preferredQuality);
        if (targetQuality) {
            ytPlayer.setPlaybackQualityRange(targetQuality, targetQuality);
        }
        if (targetQuality || attempts >= AUTO_QUALITY_MAX_ATTEMPTS) {
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

    if (preferredSpeed !== DEFAULT_SPEED && video) {
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
