package com.wpinrui.youtoob.gecko

import android.graphics.Bitmap
import org.mozilla.geckoview.AllowOrDeny
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.MediaSession
import com.wpinrui.youtoob.utils.PermissionBridge

data class ShareRequest(val title: String?, val text: String?, val uri: String?)
data class MediaInfo(val title: String?, val artist: String?)

private const val YOUTOOB_SCHEME = "youtoob"
private const val GOBACK_ACTION = "goback"
private const val SETTINGS_ACTION = "settings"
private const val MINIPLAYER_ACTION = "miniplayer"
private const val ARTWORK_BITMAP_SIZE = 256

class GeckoSessionDelegate(
    private val onFullscreenChange: (Boolean) -> Unit,
    private val onMediaPlaying: (MediaSession) -> Unit,
    private val onMediaPaused: () -> Unit = {},
    private val onMediaStopped: () -> Unit,
    private val onMediaMetadata: (MediaInfo) -> Unit = {},
    private val onMediaArtwork: (Bitmap) -> Unit = {},
    private val permissionBridge: PermissionBridge,
    private val onPageLoaded: (GeckoSession) -> Unit = {},
    private val onUrlChange: (String, GeckoSession) -> Unit = { _, _ -> },
    private val onShareRequest: (ShareRequest, (Boolean) -> Unit) -> Unit = { _, callback -> callback(false) },
    private val onGoBackRequest: (GeckoSession) -> Unit = {},
    private val onSettingsRequest: () -> Unit = {},
    private val onMiniplayerRequest: () -> Unit = {}
) : GeckoSession.ContentDelegate,
    GeckoSession.PermissionDelegate,
    GeckoSession.ProgressDelegate,
    GeckoSession.NavigationDelegate,
    GeckoSession.PromptDelegate,
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
        onMediaPlaying(mediaSession)
    }

    override fun onDeactivated(session: GeckoSession, mediaSession: MediaSession) {
        onMediaStopped()
    }

    override fun onPlay(session: GeckoSession, mediaSession: MediaSession) {
        onMediaPlaying(mediaSession)
    }

    override fun onPause(session: GeckoSession, mediaSession: MediaSession) {
        onMediaPaused()
    }

    override fun onStop(session: GeckoSession, mediaSession: MediaSession) {
        onMediaStopped()
    }

    override fun onMetadata(
        session: GeckoSession,
        mediaSession: MediaSession,
        metadata: MediaSession.Metadata
    ) {
        onMediaMetadata(MediaInfo(metadata.title, metadata.artist))

        // Load artwork bitmap asynchronously
        metadata.artwork?.getBitmap(ARTWORK_BITMAP_SIZE)?.accept({ bitmap ->
            bitmap?.let { onMediaArtwork(it) }
        }, { /* Ignore errors */ })
    }

    // ProgressDelegate - Detect page loads for CSS injection
    override fun onPageStop(session: GeckoSession, success: Boolean) {
        if (success) {
            onPageLoaded(session)
        }
    }

    // NavigationDelegate - Track URL changes
    override fun onLocationChange(session: GeckoSession, url: String?, perms: MutableList<GeckoSession.PermissionDelegate.ContentPermission>, hasUserGesture: Boolean) {
        url?.let { onUrlChange(it, session) }
    }

    // NavigationDelegate - Intercept custom URL scheme for JS→Kotlin bridge
    override fun onLoadRequest(
        session: GeckoSession,
        request: GeckoSession.NavigationDelegate.LoadRequest
    ): GeckoResult<AllowOrDeny>? {
        val uri = request.uri
        if (uri.startsWith("$YOUTOOB_SCHEME://")) {
            val action = uri.removePrefix("$YOUTOOB_SCHEME://")
            when (action) {
                GOBACK_ACTION -> onGoBackRequest(session)
                SETTINGS_ACTION -> onSettingsRequest()
                MINIPLAYER_ACTION -> onMiniplayerRequest()
            }
            // Block the navigation - we handled it
            return GeckoResult.fromValue(AllowOrDeny.DENY)
        }
        // Allow normal navigation
        return GeckoResult.fromValue(AllowOrDeny.ALLOW)
    }

    // PromptDelegate - Handle Web Share API
    override fun onSharePrompt(
        session: GeckoSession,
        prompt: GeckoSession.PromptDelegate.SharePrompt
    ): GeckoResult<GeckoSession.PromptDelegate.PromptResponse>? {
        val result = GeckoResult<GeckoSession.PromptDelegate.PromptResponse>()
        val request = ShareRequest(prompt.title, prompt.text, prompt.uri)

        onShareRequest(request) { success ->
            if (success) {
                result.complete(prompt.confirm(GeckoSession.PromptDelegate.SharePrompt.Result.SUCCESS))
            } else {
                result.complete(prompt.confirm(GeckoSession.PromptDelegate.SharePrompt.Result.ABORT))
            }
        }

        return result
    }
}
