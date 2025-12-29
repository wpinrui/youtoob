package com.wpinrui.youtoob

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.wpinrui.youtoob.ui.theme.YouToobTheme
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoView

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            YouToobTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    GeckoViewScreen(modifier = Modifier.padding(innerPadding))
                }
            }
        }
    }
}

@Composable
fun GeckoViewScreen(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val runtime = remember { GeckoRuntime.create(context) }
    val session = remember { GeckoSession() }

    DisposableEffect(Unit) {
        session.open(runtime)
        session.loadUri("https://m.youtube.com")
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
