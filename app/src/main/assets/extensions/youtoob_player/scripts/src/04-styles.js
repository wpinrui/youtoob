// =============================================================================
// CSS Styles
// =============================================================================

const PLAYER_STYLES = `
    /* Force overflow visible on YouTube player containers for seek thumb */
    ytm-player,
    ytm-player-container,
    ytm-media-item,
    .html5-video-player,
    .html5-video-container,
    .video-stream,
    .player-container,
    .ytm-player-container,
    ytm-single-video-watch-page-modern,
    ytm-watch,
    #player,
    ytm-single-video-watch-page-modern > *,
    .html5-video-player > *,
    [class*="player"] {
        overflow: visible !important;
        clip: auto !important;
        clip-path: none !important;
        contain: none !important;
    }

    /* Fix gap between player and related chips - adjust for removed 48px top bar */
    ytm-related-chip-cloud-renderer {
        top: calc(56.25vw + 48px) !important;
    }

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
    #youtoob-controls.fullscreen {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 2147483647 !important;
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
        touch-action: manipulation;
    }
    .youtoob-tap-zone {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: visible;
        touch-action: manipulation;
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
        gap: 38px;
        align-items: center;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        z-index: 100001;
    }
    #youtoob-controls.fullscreen .youtoob-center-controls {
        gap: 48px;
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
    .youtoob-btn.disabled {
        opacity: 0.3;
        pointer-events: none;
    }
    .youtoob-btn-small {
        width: 38px;
        height: 38px;
    }
    .youtoob-btn-large {
        width: 52px;
        height: 52px;
    }
    #youtoob-controls.fullscreen .youtoob-btn-small {
        width: 48px;
        height: 48px;
    }
    #youtoob-controls.fullscreen .youtoob-btn-large {
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
        bottom: 24px;
        right: 12px;
        display: flex;
        gap: 6px;
        align-items: center;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        z-index: 100001;
    }
    #youtoob-controls.fullscreen .youtoob-bottom-bar {
        bottom: 54px;
    }
    #youtoob-controls.show-controls .youtoob-bottom-bar {
        pointer-events: auto;
    }
    /* Top bar styles */
    .youtoob-top-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        z-index: 100001;
    }
    #youtoob-controls.fullscreen .youtoob-top-bar {
        padding: 20px 24px;
    }
    #youtoob-controls.show-controls .youtoob-top-bar {
        opacity: 1;
        pointer-events: auto;
    }
    .youtoob-video-info {
        flex: 1;
        min-width: 0;
        margin-right: 12px;
        display: none;
    }
    #youtoob-controls.fullscreen .youtoob-video-info {
        display: block;
    }
    .youtoob-video-title {
        color: white;
        font-size: 14px;
        font-weight: 600;
        font-family: Roboto, Arial, sans-serif;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        margin: 0;
    }
    .youtoob-channel-name {
        color: rgba(255,255,255,0.7);
        font-size: 12px;
        font-weight: 400;
        font-family: Roboto, Arial, sans-serif;
        margin-top: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-shadow: 0 1px 2px rgba(0,0,0,0.6);
    }
    #youtoob-controls.fullscreen .youtoob-video-title {
        font-size: 18px;
    }
    #youtoob-controls.fullscreen .youtoob-channel-name {
        font-size: 14px;
    }
    .youtoob-top-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-shrink: 0;
        margin-left: auto;
    }
    .youtoob-action-btn {
        background: transparent;
        border: none;
        color: white;
        padding: 0;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.9;
    }
    .youtoob-action-btn svg {
        width: 22px;
        height: 22px;
    }
    .youtoob-action-btn:active {
        opacity: 0.6;
    }
    .youtoob-action-btn.active {
        color: #3ea6ff;
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
    .youtoob-menu-container {
        position: relative;
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
        bottom: -6px;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        z-index: 100001;
        overflow: visible;
    }
    #youtoob-controls.fullscreen .youtoob-seek-container {
        bottom: 30px;
        left: 50px;
        right: 0;
    }
    #youtoob-controls.show-controls .youtoob-seek-container {
        opacity: 1;
        pointer-events: auto;
    }
    .youtoob-time-display {
        color: white;
        font-size: 12px;
        font-weight: 500;
        font-family: Roboto, Arial, sans-serif;
        margin-left: 12px;
    }
    .youtoob-seek-bar {
        width: 100%;
        height: 16px;
        display: flex;
        align-items: flex-end;
        cursor: pointer;
        position: relative;
        padding: 0;
        box-sizing: border-box;
        overflow: visible;
    }
    .youtoob-seek-track {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 6px;
        height: 3px;
        background: rgba(255,255,255,0.3);
    }
    .youtoob-seek-buffer {
        position: absolute;
        left: 0;
        bottom: 6px;
        height: 3px;
        background: rgba(255,255,255,0.5);
        width: 0%;
    }
    .youtoob-seek-progress {
        position: absolute;
        left: 0;
        bottom: 6px;
        height: 3px;
        background: #ff0000;
        width: 0%;
    }
    .youtoob-seek-thumb {
        position: absolute;
        width: 12px;
        height: 12px;
        background: #ff0000;
        border-radius: 50%;
        transform: translateX(-50%);
        left: 0;
        bottom: 1.5px;
        box-shadow: 0 0 4px rgba(0,0,0,0.3);
    }
    .youtoob-seek-bar:active .youtoob-seek-thumb {
        width: 16px;
        height: 16px;
        bottom: 0.5px;
    }
    .youtoob-seek-bar:active .youtoob-seek-track,
    .youtoob-seek-bar:active .youtoob-seek-buffer,
    .youtoob-seek-bar:active .youtoob-seek-progress {
        height: 5px;
    }
`;
