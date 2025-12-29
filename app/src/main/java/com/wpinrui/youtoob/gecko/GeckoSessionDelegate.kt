package com.wpinrui.youtoob.gecko

import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.MediaSession
import com.wpinrui.youtoob.utils.PermissionBridge

class GeckoSessionDelegate(
    private val onFullscreenChange: (Boolean) -> Unit,
    private val onMediaPlaying: () -> Unit,
    private val onMediaStopped: () -> Unit,
    private val permissionBridge: PermissionBridge
) : GeckoSession.ContentDelegate,
    GeckoSession.PermissionDelegate,
    MediaSession.Delegate {

    // ContentDelegate - Fullscreen handling
    override fun onFullScreen(session: GeckoSession, fullScreen: Boolean) {
        onFullscreenChange(fullScreen)
    }

    // PermissionDelegate - Auto-grant media permissions for YouTube
    override fun onContentPermissionRequest(
        session: GeckoSession,
        perm: GeckoSession.PermissionDelegate.ContentPermission
    ): GeckoResult<Int> {
        val result = when (perm.permission) {
            GeckoSession.PermissionDelegate.PERMISSION_AUTOPLAY_AUDIBLE,
            GeckoSession.PermissionDelegate.PERMISSION_AUTOPLAY_INAUDIBLE,
            GeckoSession.PermissionDelegate.PERMISSION_MEDIA_KEY_SYSTEM_ACCESS,
            GeckoSession.PermissionDelegate.PERMISSION_PERSISTENT_STORAGE,
            GeckoSession.PermissionDelegate.PERMISSION_STORAGE_ACCESS ->
                GeckoSession.PermissionDelegate.ContentPermission.VALUE_ALLOW
            else ->
                GeckoSession.PermissionDelegate.ContentPermission.VALUE_DENY
        }
        return GeckoResult.fromValue(result)
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
        if (permissions.isNullOrEmpty()) {
            callback.grant()
            return
        }
        permissionBridge.requestPermissions(permissions, callback)
    }

    // MediaSessionDelegate - Handle media playback state
    override fun onActivated(session: GeckoSession, mediaSession: MediaSession) {
        onMediaPlaying()
    }

    override fun onDeactivated(session: GeckoSession, mediaSession: MediaSession) {
        onMediaStopped()
    }

    override fun onPlay(session: GeckoSession, mediaSession: MediaSession) {
        onMediaPlaying()
    }

    override fun onPause(session: GeckoSession, mediaSession: MediaSession) {
        onMediaStopped()
    }

    override fun onStop(session: GeckoSession, mediaSession: MediaSession) {
        onMediaStopped()
    }
}
