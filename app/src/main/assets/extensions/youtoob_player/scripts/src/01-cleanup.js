// =============================================================================
// GLOBAL STATE - stored on window to survive script re-injection
// =============================================================================

// Clean up ANY existing overlay immediately
document.querySelectorAll('#youtoob-controls').forEach(el => el.remove());

// Clean up any previous fullscreen handlers
if (window._youtoobFsHandler) {
    document.removeEventListener('fullscreenchange', window._youtoobFsHandler);
    document.removeEventListener('webkitfullscreenchange', window._youtoobFsHandler);
}
if (window._youtoobFsInterval) {
    clearInterval(window._youtoobFsInterval);
}
