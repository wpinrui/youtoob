package com.wpinrui.youtoob

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.ui.graphics.Color
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.wpinrui.youtoob.ui.DownloadsActivity
import com.wpinrui.youtoob.ui.GeckoViewScreen
import com.wpinrui.youtoob.ui.SettingsActivity
import com.wpinrui.youtoob.ui.components.YoutoobBottomNav
import com.wpinrui.youtoob.ui.navigation.NavDestination
import com.wpinrui.youtoob.ui.theme.YouToobTheme
import org.mozilla.geckoview.GeckoSession

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            YouToobTheme {
                var currentDestination by remember { mutableStateOf(NavDestination.HOME) }
                var navigateToUrl by remember { mutableStateOf<String?>(null) }
                var isFullscreen by remember { mutableStateOf(false) }
                var currentUrl by remember { mutableStateOf("") }
                var geckoSession by remember { mutableStateOf<GeckoSession?>(null) }

                val isVideoPage = currentUrl.contains("/watch")
                val shouldShowNav = !isFullscreen && !isVideoPage

                BackHandler(enabled = isVideoPage) {
                    navigateToUrl = NavDestination.HOME.youtubeUrl
                    currentDestination = NavDestination.HOME
                }

                Scaffold(
                    modifier = Modifier.fillMaxSize().background(Color.Black),
                    containerColor = Color.Black,
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
                                    destination == NavDestination.SETTINGS -> {
                                        startActivity(Intent(this@MainActivity, SettingsActivity::class.java))
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
