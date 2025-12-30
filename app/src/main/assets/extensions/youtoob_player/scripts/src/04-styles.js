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
        bottom: 35px;
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
        bottom: 65px;
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
        bottom: 0;
        left: 12px;
        right: 12px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        z-index: 100001;
    }
    #youtoob-controls.fullscreen .youtoob-seek-container {
        bottom: 30px;
        left: 62px;
        right: 12px;
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
    }
    .youtoob-seek-bar {
        width: 100%;
        height: 24px;
        display: flex;
        align-items: center;
        cursor: pointer;
        position: relative;
        padding: 0 6px;
        box-sizing: border-box;
    }
    .youtoob-seek-track {
        position: absolute;
        left: 6px;
        right: 6px;
        height: 3px;
        background: rgba(255,255,255,0.3);
        border-radius: 1.5px;
    }
    .youtoob-seek-buffer {
        position: absolute;
        left: 6px;
        height: 3px;
        background: rgba(255,255,255,0.5);
        border-radius: 1.5px;
        width: 0%;
    }
    .youtoob-seek-progress {
        position: absolute;
        left: 6px;
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
        left: 6px;
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
