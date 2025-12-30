package com.wpinrui.youtoob.ui

import android.app.Activity
import android.content.Context
import android.content.pm.ActivityInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.view.WindowInsets
import android.view.WindowInsetsController
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
import com.wpinrui.youtoob.ui.navigation.NavDestination
import com.wpinrui.youtoob.utils.PermissionBridge
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoView

private const val TAG = "YoutoobPlayer"

private val HIDE_YOUTUBE_BOTTOM_NAV_CSS = """
    ytm-pivot-bar-renderer,
    ytm-pivot-bar-item-renderer {
        display: none !important;
    }
    ytm-app {
        padding-bottom: 0 !important;
    }
""".trimIndent()

private fun loadCustomPlayerJs(context: Context): String {
    return try {
        val js = context.assets.open("js/custom_player.js").bufferedReader().use { it.readText() }
        android.util.Log.d(TAG, "Loaded custom_player.js: ${js.length} chars")
        js
    } catch (e: Exception) {
        android.util.Log.e(TAG, "Failed to load custom_player.js", e)
        ""
    }
}

private var cachedPlayerJs: String? = null

private fun injectScripts(session: GeckoSession, context: Context, isVideoPage: Boolean) {
    android.util.Log.d(TAG, "injectScripts called, isVideoPage=$isVideoPage")

    // CSS injection only - player controls via javascript: URI is too limited in GeckoView
    val cssScript = """
        (function() {
            var style = document.getElementById('youtoob-custom-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'youtoob-custom-style';
                style.textContent = `$HIDE_YOUTUBE_BOTTOM_NAV_CSS`;
                document.head.appendChild(style);
            }
        })();
    """.trimIndent()

    session.loadUri("javascript:$cssScript")
    android.util.Log.d(TAG, "CSS injected")
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
                android.util.Log.d(TAG, "onPageLoaded, currentUrl=$currentUrl")
                injectScripts(session, context, currentUrl.contains("/watch"))
            },
            onUrlChange = { url, session ->
                android.util.Log.d(TAG, "onUrlChange: $url")
                val wasVideoPage = currentUrl.contains("/watch")
                val isVideoPage = url.contains("/watch")
                currentUrl = url
                // Inject on SPA navigation to video page
                if (isVideoPage && !wasVideoPage) {
                    android.util.Log.d(TAG, "SPA navigation to video page, injecting after delay")
                    android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                        injectScripts(session, context, true)
                    }, 1000)
                }
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
