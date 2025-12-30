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
            speedBtn.textContent = speed === 1 ? '1.0' : speed.toString();
            document.querySelectorAll('#youtoob-speed-menu .youtoob-menu-option').forEach(opt => opt.classList.remove('active'));
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
