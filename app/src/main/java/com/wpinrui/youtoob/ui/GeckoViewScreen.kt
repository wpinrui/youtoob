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
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.getSystemService
import com.wpinrui.youtoob.data.SettingsRepository
import com.wpinrui.youtoob.data.ThemeMode
import com.wpinrui.youtoob.data.YoutoobSettings
import com.wpinrui.youtoob.gecko.GeckoRuntimeProvider
import com.wpinrui.youtoob.gecko.GeckoSessionDelegate
import com.wpinrui.youtoob.gecko.ShareRequest
import com.wpinrui.youtoob.ui.navigation.NavDestination
import com.wpinrui.youtoob.utils.PermissionBridge
import com.wpinrui.youtoob.utils.isVideoPageUrl
import kotlinx.coroutines.flow.collectLatest
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoView

private const val SPA_NAVIGATION_DELAY_MS = 1000L

private fun getBaseCss(isDark: Boolean): String {
    val backgroundColor = if (isDark) "#000" else "#fff"
    val textColor = if (isDark) "#fff" else "#0f0f0f"
    val secondaryTextColor = if (isDark) "#aaa" else "#606060"

    return """
        /* Hide YouTube bottom navigation */
        ytm-pivot-bar-renderer,
        ytm-pivot-bar-item-renderer {
            display: none !important;
        }
        ytm-app {
            padding-bottom: 0 !important;
        }

        /* Theme-aware background */
        html, body, ytm-app, ytm-browse, ytm-watch {
            background-color: $backgroundColor !important;
        }

        /* Theme-aware text colors for light mode */
        ytm-rich-item-renderer,
        ytm-video-with-context-renderer,
        ytm-compact-video-renderer,
        ytm-reel-item-renderer,
        .media-item-headline,
        .media-item-metadata,
        .video-title,
        .channel-name,
        h3, h4,
        ytm-badge-and-byline-renderer,
        .yt-core-attributed-string {
            color: $textColor !important;
        }

        /* Secondary text (views, time, etc) */
        .media-item-byline,
        .ytm-badge-and-byline-renderer span,
        .view-count,
        .published-time {
            color: $secondaryTextColor !important;
        }

        /* Selected chips have light background - need dark text for contrast */
        ytm-chip-cloud-chip-renderer.selected .yt-core-attributed-string,
        ytm-chip-cloud-chip-renderer[aria-selected="true"] .yt-core-attributed-string {
            color: #0f0f0f !important;
        }
    """.trimIndent()
}

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
    /* Hide Gemini Ask button and collapse its space completely */
    button[aria-label="Ask"],
    yt-button-view-model:has(button[aria-label="Ask"]),
    button-view-model:has(button[aria-label="Ask"]),
    #flexible-item-buttons:has(button[aria-label="Ask"]),
    ytm-button-renderer:has(button[aria-label="Ask"]) {
        display: none !important;
    }
""".trimIndent()

private fun injectCss(session: GeckoSession, isVideoPage: Boolean, isDark: Boolean) {
    val baseCss = getBaseCss(isDark)
    val videoCss = if (isVideoPage) YOUTOOB_VIDEO_PAGE_CSS else ""
    val fullCss = baseCss + "\n" + videoCss

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

private fun injectSettings(session: GeckoSession, settings: YoutoobSettings) {
    val settingsScript = """
        (function() {
            window._youtoobSettings = {
                defaultQuality: '${settings.defaultQuality.youtubeQuality}',
                defaultSpeed: ${settings.defaultSpeed.value},
                autoplayEnabled: ${settings.autoplayEnabled}
            };
            localStorage.setItem('youtoob_settings', JSON.stringify(window._youtoobSettings));
        })();
    """.trimIndent()

    session.loadUri("javascript:$settingsScript")
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
    val settingsRepository = remember { SettingsRepository(context) }
    var cachedSettings by remember { mutableStateOf(YoutoobSettings()) }

    // Track system dark mode for theme-aware CSS injection
    val systemIsDark = isSystemInDarkTheme()
    val currentSystemIsDark by rememberUpdatedState(systemIsDark)

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

    LaunchedEffect(settingsRepository) {
        settingsRepository.settings.collectLatest { settings ->
            cachedSettings = settings
        }
    }

    val delegate = remember {
        GeckoSessionDelegate(
            onFullscreenChange = { fullscreen ->
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
                val isDark = cachedSettings.themeMode.isDark(currentSystemIsDark)
                injectCss(session, currentUrl.isVideoPageUrl(), isDark)
                if (currentUrl.isVideoPageUrl()) {
                    injectSettings(session, cachedSettings)
                }
            },
            onUrlChange = { url, session ->
                val wasVideoPage = currentUrl.isVideoPageUrl()
                val isVideoPage = url.isVideoPageUrl()
                currentUrl = url
                onUrlChange(url)
                // Re-inject CSS on SPA navigation when video page state changes
                if (isVideoPage != wasVideoPage) {
                    Handler(Looper.getMainLooper()).postDelayed({
                        val isDark = cachedSettings.themeMode.isDark(currentSystemIsDark)
                        injectCss(session, isVideoPage, isDark)
                    }, SPA_NAVIGATION_DELAY_MS)
                }
                // Inject settings on navigation to video page
                if (isVideoPage) {
                    Handler(Looper.getMainLooper()).postDelayed({
                        injectSettings(session, cachedSettings)
                    }, SPA_NAVIGATION_DELAY_MS)
                }
            },
            onShareRequest = { request, callback ->
                launchShareIntent(context, request, callback)
            },
            onGoBackRequest = { session ->
                session.goBack()
            },
            onSettingsRequest = {
                context.startActivity(Intent(context, SettingsActivity::class.java))
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

    val isDark = cachedSettings.themeMode.isDark(systemIsDark)

    // Reload page when theme changes to re-apply CSS
    var previousIsDark by remember { mutableStateOf(isDark) }
    if (isDark != previousIsDark) {
        previousIsDark = isDark
        session.reload()
    }

    val coverColor = if (isDark) android.graphics.Color.BLACK else android.graphics.Color.WHITE

    AndroidView(
        factory = { ctx ->
            GeckoView(ctx).apply {
                coverUntilFirstPaint(coverColor)
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
