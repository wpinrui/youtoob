package com.wpinrui.youtoob.ui

import android.app.Activity
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.viewinterop.AndroidView
import com.wpinrui.youtoob.gecko.GeckoRuntimeProvider
import com.wpinrui.youtoob.gecko.GeckoSessionDelegate
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoView

private const val YOUTUBE_MOBILE_URL = "https://m.youtube.com"

@Composable
fun GeckoViewScreen(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val view = LocalView.current
    val activity = context as? Activity
    var isFullscreen by remember { mutableStateOf(false) }

    val runtime = remember { GeckoRuntimeProvider.getRuntime(context) }

    val delegate = remember {
        GeckoSessionDelegate(
            onFullscreenChange = { fullscreen ->
                isFullscreen = fullscreen
                activity?.let { setFullscreen(it, view, fullscreen) }
            }
        )
    }

    val session = remember {
        GeckoSession().apply {
            contentDelegate = delegate
            permissionDelegate = delegate
        }
    }

    DisposableEffect(Unit) {
        session.open(runtime)
        session.loadUri(YOUTUBE_MOBILE_URL)
        onDispose {
            session.close()
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

private fun setFullscreen(activity: Activity, view: View, fullscreen: Boolean) {
    val window = activity.window
    val controller = window.insetsController ?: return

    if (fullscreen) {
        controller.hide(WindowInsets.Type.systemBars())
        controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    } else {
        controller.show(WindowInsets.Type.systemBars())
    }
}
