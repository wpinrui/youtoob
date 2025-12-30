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
