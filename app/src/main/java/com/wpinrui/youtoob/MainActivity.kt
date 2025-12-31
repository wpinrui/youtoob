package com.wpinrui.youtoob

import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.compose.runtime.mutableIntStateOf
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.wpinrui.youtoob.ui.DownloadsActivity
import com.wpinrui.youtoob.ui.GeckoViewScreen
import com.wpinrui.youtoob.ui.components.YoutoobBottomNav
import com.wpinrui.youtoob.ui.navigation.NavDestination
import com.wpinrui.youtoob.ui.theme.YouToobThemeWithSettings
import com.wpinrui.youtoob.utils.isVideoPageUrl
import org.mozilla.geckoview.GeckoSession

class MainActivity : ComponentActivity() {
    // Triggers recomposition when configuration changes
    private val configVersion = mutableIntStateOf(0)

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        configVersion.intValue++
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            // Read configVersion to trigger recomposition on config changes
            @Suppress("UNUSED_EXPRESSION")
            configVersion.intValue

            YouToobThemeWithSettings {
                var currentDestination by remember { mutableStateOf(NavDestination.HOME) }
                var navigateToUrl by remember { mutableStateOf<String?>(null) }
                var isFullscreen by remember { mutableStateOf(false) }
                var currentUrl by remember { mutableStateOf("") }
                var geckoSession by remember { mutableStateOf<GeckoSession?>(null) }

                val isVideoPage = currentUrl.isVideoPageUrl()
                val shouldShowNav = !isFullscreen && !isVideoPage

                BackHandler(enabled = isVideoPage) {
                    geckoSession?.goBack()
                }

                val backgroundColor = MaterialTheme.colorScheme.background

                Scaffold(
                    modifier = Modifier.fillMaxSize().background(backgroundColor),
                    containerColor = backgroundColor,
                    bottomBar = {
                        YoutoobBottomNav(
                            currentDestination = currentDestination,
                            onNavigate = { destination ->
                                currentDestination = destination
                                when {
                                    destination.isYouTubeDestination -> {
                                        navigateToUrl = destination.youtubeUrl
                                    }
                                    destination == NavDestination.DOWNLOADS -> {
                                        startActivity(Intent(this@MainActivity, DownloadsActivity::class.java))
                                    }
                                }
                            },
                            isVisible = shouldShowNav
                        )
                    }
                ) { innerPadding ->
                    GeckoViewScreen(
                        modifier = Modifier.padding(innerPadding),
                        navigateToUrl = navigateToUrl,
                        onFullscreenChange = { fullscreen ->
                            isFullscreen = fullscreen
                        },
                        onUrlChange = { url ->
                            currentUrl = url
                        },
                        onSessionReady = { session ->
                            geckoSession = session
                        }
                    )
                }
            }
        }
    }
}
