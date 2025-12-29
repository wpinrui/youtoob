package com.wpinrui.youtoob.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.wpinrui.youtoob.gecko.GeckoRuntimeProvider
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoView

private const val YOUTUBE_MOBILE_URL = "https://m.youtube.com"

@Composable
fun GeckoViewScreen(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val runtime = remember { GeckoRuntimeProvider.getRuntime(context) }
    val session = remember { GeckoSession() }

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
