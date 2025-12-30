package com.wpinrui.youtoob.ui

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.getSystemService
import com.wpinrui.youtoob.gecko.GeckoRuntimeProvider
import com.wpinrui.youtoob.gecko.GeckoSessionDelegate
import com.wpinrui.youtoob.gecko.ShareRequest
import com.wpinrui.youtoob.ui.navigation.NavDestination
import com.wpinrui.youtoob.utils.PermissionBridge
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoView

private const val SPA_NAVIGATION_DELAY_MS = 1000L

private val YOUTOOB_BASE_CSS = """
    /* Hide YouTube bottom navigation */
    ytm-pivot-bar-renderer,
    ytm-pivot-bar-item-renderer {
        display: none !important;
    }
    ytm-app {
        padding-bottom: 0 !important;
    }

    /* Pure black background */
    html, body, ytm-app, ytm-browse, ytm-watch {
        background-color: #000 !important;
    }
""".trimIndent()

private val YOUTOOB_VIDEO_PAGE_CSS = """
    /* Hide YouTube top bar (logo/search) on video pages only */
    ytm-mobile-topbar-renderer,
    header.mobile-topbar-header {
        display: none !important;
    }
    /* Remove top padding/margin everywhere */
    ytm-app,
    ytm-watch,
    .page-container,
    .watch-below-the-player,
    ytm-player,
    ytm-player-container,
    .player-container,
    .html5-video-player,
    .html5-video-container,
    #player-container-id,
    .ytm-autonav-bar {
        padding-top: 0 !important;
        margin-top: 0 !important;
        top: 0 !important;
    }
    /* Hide Gemini Ask button and its container */
    ytm-button-renderer[button-renderer][aria-label="Ask"],
    button[aria-label="Ask"],
    .ytm-gemini-button,
    [data-a11y-title-text="Ask"],
    ytm-button-renderer:has(button[aria-label="Ask"]) {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
    }
    /* Force single row layout for video meta */
    ytm-slim-video-metadata-section-renderer {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        gap: 8px !important;
        padding: 8px !important;
    }
    /* Channel info compact */
    ytm-slim-owner-renderer {
        flex-shrink: 0 !important;
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
    }
    ytm-slim-owner-renderer #channel-thumbnail {
        width: 28px !important;
        height: 28px !important;
    }
    ytm-slim-owner-renderer #channel-name {
        max-width: 80px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        font-size: 12px !important;
    }
    /* Hide subscriber count */
    ytm-slim-owner-renderer #metadata {
        display: none !important;
    }
    /* Compact subscribe button */
    ytm-subscribe-button-renderer button {
        padding: 4px 8px !important;
        font-size: 11px !important;
        min-width: unset !important;
    }
    /* Action bar inline */
    ytm-slim-video-action-bar-renderer {
        flex-shrink: 0 !important;
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
    }
    .slim-video-action-bar-actions {
        display: flex !important;
        flex-wrap: nowrap !important;
        gap: 2px !important;
    }
    /* Hide ALL button text labels */
    ytm-slim-video-action-bar-renderer .yt-spec-button-shape-next__button-text-content,
    ytm-slim-video-action-bar-renderer [class*="button-text"],
    ytm-slim-video-action-bar-renderer .cbox,
    .slim-video-action-bar-actions span[class*="text"] {
        display: none !important;
    }
    /* Tiny buttons */
    ytm-slim-video-action-bar-renderer button,
    ytm-slim-video-action-bar-renderer ytm-button-renderer {
        padding: 4px !important;
        min-width: unset !important;
        margin: 0 !important;
    }
    ytm-slim-video-action-bar-renderer svg,
    ytm-slim-video-action-bar-renderer .yt-icon {
        width: 18px !important;
        height: 18px !important;
    }
    /* Like/dislike group compact */
    ytm-segmented-like-dislike-button-renderer {
        display: flex !important;
        gap: 0 !important;
    }
""".trimIndent()

private fun injectCss(session: GeckoSession, isVideoPage: Boolean) {
    val videoCss = if (isVideoPage) YOUTOOB_VIDEO_PAGE_CSS else ""
    val fullCss = YOUTOOB_BASE_CSS + "\n" + videoCss

    val cssScript = """
        (function() {
            var style = document.getElementById('youtoob-custom-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'youtoob-custom-style';
                document.head.appendChild(style);
            }
            style.textContent = `$fullCss`;
        })();
    """.trimIndent()

    session.loadUri("javascript:$cssScript")
}

@Composable
fun GeckoViewScreen(
    modifier: Modifier = Modifier,
    navigateToUrl: String? = null,
    onFullscreenChange: (Boolean) -> Unit = {},
    onUrlChange: (String) -> Unit = {},
    onSessionReady: (GeckoSession) -> Unit = {}
) {
    val context = LocalContext.current
    val activity = context as? Activity
    var isFullscreen by remember { mutableStateOf(false) }
    var currentUrl by remember { mutableStateOf("") }

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
                audioManager?.requestAudioFocus(audioFocusRequest)
            },
            onMediaStopped = {
                audioManager?.abandonAudioFocusRequest(audioFocusRequest)
            },
            permissionBridge = permissionBridge,
            onPageLoaded = { session ->
                injectCss(session, currentUrl.contains("/watch"))
            },
            onUrlChange = { url, session ->
                val wasVideoPage = currentUrl.contains("/watch")
                val isVideoPage = url.contains("/watch")
                currentUrl = url
                onUrlChange(url)
                // Re-inject CSS on SPA navigation when video page state changes
                if (isVideoPage != wasVideoPage) {
                    Handler(Looper.getMainLooper()).postDelayed({
                        injectCss(session, isVideoPage)
                    }, SPA_NAVIGATION_DELAY_MS)
                }
            },
            onShareRequest = { request, callback ->
                launchShareIntent(context, request, callback)
            }
        )
    }

    val session = remember {
        GeckoSession().apply {
            contentDelegate = delegate
            permissionDelegate = delegate
            progressDelegate = delegate
            navigationDelegate = delegate
            mediaSessionDelegate = delegate
            promptDelegate = delegate
        }
    }

    DisposableEffect(Unit) {
        session.open(runtime)
        session.loadUri(requireNotNull(NavDestination.HOME.youtubeUrl))
        onSessionReady(session)
        onDispose {
            session.close()
        }
    }

    LaunchedEffect(navigateToUrl) {
        navigateToUrl?.let { url ->
            session.loadUri(url)
        }
    }

    AndroidView(
        factory = { ctx ->
            GeckoView(ctx).apply {
                setSession(session)
            }
        },
        modifier = modifier.fillMaxSize()
    )
}

private fun setFullscreen(activity: Activity, fullscreen: Boolean) {
    val window = activity.window
    val controller = WindowCompat.getInsetsController(window, window.decorView)

    if (fullscreen) {
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    } else {
        controller.show(WindowInsetsCompat.Type.systemBars())
    }
}

private fun setOrientation(activity: Activity, fullscreen: Boolean) {
    activity.requestedOrientation = if (fullscreen) {
        ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
    } else {
        ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    }
}

private fun launchShareIntent(context: Context, request: ShareRequest, callback: (Boolean) -> Unit) {
    try {
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, request.uri ?: request.text ?: "")
            request.title?.let { putExtra(Intent.EXTRA_SUBJECT, it) }
        }

        val shareIntent = Intent.createChooser(sendIntent, null)
        context.startActivity(shareIntent)
        callback(true)
    } catch (e: Exception) {
        callback(false)
    }
}
