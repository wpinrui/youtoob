// =============================================================================
// HTML Template
// =============================================================================

function getOverlayHTML() {
    return `
        <style>${PLAYER_STYLES}</style>

        <div class="youtoob-overlay-bg"></div>

        <div class="youtoob-top-bar">
            <div class="youtoob-video-info">
                <div class="youtoob-video-title" id="youtoob-video-title"></div>
                <div class="youtoob-channel-name" id="youtoob-channel-name"></div>
            </div>
            <div class="youtoob-top-actions">
                <button class="youtoob-action-btn" id="youtoob-autoplay" title="Autoplay">${ICONS.autoplay}</button>
                <button class="youtoob-action-btn" id="youtoob-loop" title="Loop">${ICONS.loop}</button>
                <button class="youtoob-action-btn" id="youtoob-share" title="Share">${ICONS.share}</button>
            </div>
        </div>

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
            <span class="youtoob-time-display" id="youtoob-time-display">0:00 / 0:00</span>
            <div class="youtoob-seek-bar" id="youtoob-seek-bar">
                <div class="youtoob-seek-track"></div>
                <div class="youtoob-seek-buffer" id="youtoob-seek-buffer"></div>
                <div class="youtoob-seek-progress" id="youtoob-seek-progress"></div>
                <div class="youtoob-seek-thumb" id="youtoob-seek-thumb"></div>
            </div>
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
