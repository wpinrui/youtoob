package com.wpinrui.youtoob.ui

import android.app.Activity
import android.content.pm.ActivityInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.view.WindowInsets
import android.view.WindowInsetsController
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.getSystemService
import com.wpinrui.youtoob.gecko.GeckoRuntimeProvider
import com.wpinrui.youtoob.gecko.GeckoSessionDelegate
import com.wpinrui.youtoob.player.VideoController
import com.wpinrui.youtoob.ui.navigation.NavDestination
import com.wpinrui.youtoob.ui.player.PlayerControlsOverlay
import com.wpinrui.youtoob.utils.PermissionBridge
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoView

private val HIDE_YOUTUBE_BOTTOM_NAV_JS = """
(function() {
    var style = document.getElementById('youtoob-custom-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'youtoob-custom-style';
        style.textContent = `
            ytm-pivot-bar-renderer,
            ytm-pivot-bar-item-renderer {
                display: none !important;
            }
            ytm-app {
                padding-bottom: 0 !important;
            }
        `;
        document.head.appendChild(style);
    }
})();
""".trimIndent()

private fun injectCustomStyles(session: GeckoSession) {
    session.loadUri("javascript:$HIDE_YOUTUBE_BOTTOM_NAV_JS")
}

@Composable
fun GeckoViewScreen(
    modifier: Modifier = Modifier,
    navigateToUrl: String? = null,
    onFullscreenChange: (Boolean) -> Unit = {}
) {
    val context = LocalContext.current
    val activity = context as? Activity
    var isFullscreen by remember { mutableStateOf(false) }
    var isPlaying by remember { mutableStateOf(false) }
    var currentSpeed by remember { mutableFloatStateOf(1.0f) }

    val audioManager = remember { context.getSystemService<AudioManager>() }
    val audioFocusRequest = remember {
        AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MOVIE)
                    .build()
            )
            .build()
    }

    val runtime = remember { GeckoRuntimeProvider.getRuntime(context) }

    val permissionBridge = remember { PermissionBridge() }
    var pendingPermissionCallback by remember { mutableStateOf<((Map<String, Boolean>) -> Unit)?>(null) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        pendingPermissionCallback?.invoke(results)
        pendingPermissionCallback = null
    }

    DisposableEffect(permissionBridge) {
        permissionBridge.setLauncher { permissions, callback ->
            pendingPermissionCallback = callback
            permissionLauncher.launch(permissions)
        }
        onDispose { }
    }

    val delegate = remember {
        GeckoSessionDelegate(
            onFullscreenChange = { fullscreen ->
                isFullscreen = fullscreen
                onFullscreenChange(fullscreen)
                activity?.let {
                    setFullscreen(it, fullscreen)
                    setOrientation(it, fullscreen)
                }
            },
            onMediaPlaying = {
                isPlaying = true
                audioManager?.requestAudioFocus(audioFocusRequest)
            },
            onMediaStopped = {
                isPlaying = false
                audioManager?.abandonAudioFocusRequest(audioFocusRequest)
            },
            permissionBridge = permissionBridge,
            onPageLoaded = { session ->
                injectCustomStyles(session)
            }
        )
    }

    val session = remember {
        GeckoSession().apply {
            contentDelegate = delegate
            permissionDelegate = delegate
            progressDelegate = delegate
            mediaSessionDelegate = delegate
        }
    }

    DisposableEffect(Unit) {
        session.open(runtime)
        session.loadUri(requireNotNull(NavDestination.HOME.youtubeUrl))
        onDispose {
            session.close()
        }
    }

    LaunchedEffect(navigateToUrl) {
        navigateToUrl?.let { url ->
            session.loadUri(url)
        }
    }

    val videoController = remember(session) { VideoController(session) }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                GeckoView(ctx).apply {
                    setSession(session)
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        PlayerControlsOverlay(
            isPlaying = isPlaying,
            currentSpeed = currentSpeed,
            onPlayPause = { videoController.togglePlayPause() },
            onSeekForward = { videoController.seekForward() },
            onSeekBackward = { videoController.seekBackward() },
            onPrevious = { /* TODO: Previous video in playlist */ },
            onNext = { /* TODO: Next video in playlist */ },
            onSpeedChange = { speed ->
                currentSpeed = speed
                videoController.setPlaybackSpeed(speed)
            },
            onLike = { videoController.clickLikeButton() },
            onDislike = { videoController.clickDislikeButton() },
            onSave = { videoController.clickSaveButton() },
            onShare = { videoController.clickShareButton() },
            onCaptions = { videoController.toggleCaptions() },
            onSettings = { videoController.openQualitySettings() }
        )
    }
}

private fun setFullscreen(activity: Activity, fullscreen: Boolean) {
    val window = activity.window
    val controller = window.insetsController ?: return

    if (fullscreen) {
        controller.hide(WindowInsets.Type.systemBars())
        controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    } else {
        controller.show(WindowInsets.Type.systemBars())
    }
}

private fun setOrientation(activity: Activity, fullscreen: Boolean) {
    activity.requestedOrientation = if (fullscreen) {
        ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
    } else {
        ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    }
}
