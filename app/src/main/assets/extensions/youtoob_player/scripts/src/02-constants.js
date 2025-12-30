// =============================================================================
// Constants
// =============================================================================

const DOUBLE_TAP_THRESHOLD_MS = 300;
const SKIP_INDICATOR_HIDE_MS = 600;
const CONTROLS_AUTO_HIDE_MS = 3000;
const FULLSCREEN_POLL_INTERVAL_MS = 500;
const SKIP_SECONDS = 10;
const VIDEO_POLL_INTERVAL_MS = 500;

const QUALITY_LABELS = {
    'hd2160': '2160p (4K)',
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
