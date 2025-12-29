package com.wpinrui.youtoob.gecko

import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoResult

class GeckoSessionDelegate(
    private val onFullscreenChange: (Boolean) -> Unit
) : GeckoSession.ContentDelegate, GeckoSession.PermissionDelegate {

    // ContentDelegate - Fullscreen handling
    override fun onFullScreen(session: GeckoSession, fullScreen: Boolean) {
        onFullscreenChange(fullScreen)
    }

    // PermissionDelegate - Auto-grant media permissions for YouTube
    override fun onContentPermissionRequest(
        session: GeckoSession,
        perm: GeckoSession.PermissionDelegate.ContentPermission
    ): GeckoResult<Int> {
        val dominated = when (perm.permission) {
            GeckoSession.PermissionDelegate.PERMISSION_AUTOPLAY_AUDIBLE,
            GeckoSession.PermissionDelegate.PERMISSION_AUTOPLAY_INAUDIBLE,
            GeckoSession.PermissionDelegate.PERMISSION_MEDIA_KEY_SYSTEM_ACCESS,
            GeckoSession.PermissionDelegate.PERMISSION_PERSISTENT_STORAGE,
            GeckoSession.PermissionDelegate.PERMISSION_STORAGE_ACCESS ->
                GeckoSession.PermissionDelegate.ContentPermission.VALUE_ALLOW
            else ->
                GeckoSession.PermissionDelegate.ContentPermission.VALUE_DENY
        }
        return GeckoResult.fromValue(dominated)
    }

    override fun onMediaPermissionRequest(
        session: GeckoSession,
        uri: String,
        video: Array<out GeckoSession.PermissionDelegate.MediaSource>?,
        audio: Array<out GeckoSession.PermissionDelegate.MediaSource>?,
        callback: GeckoSession.PermissionDelegate.MediaCallback
    ) {
        // Grant first available video and audio sources for YouTube
        val videoSource = video?.firstOrNull()
        val audioSource = audio?.firstOrNull()
        callback.grant(videoSource, audioSource)
    }

    override fun onAndroidPermissionsRequest(
        session: GeckoSession,
        permissions: Array<out String>?,
        callback: GeckoSession.PermissionDelegate.Callback
    ) {
        // For now, grant all - in production would need runtime permission handling
        callback.grant()
    }
}
