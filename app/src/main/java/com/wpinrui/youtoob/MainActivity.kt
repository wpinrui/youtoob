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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.wpinrui.youtoob.data.SettingsRepository
import com.wpinrui.youtoob.data.YoutoobSettings
import com.wpinrui.youtoob.ui.DownloadsActivity
import com.wpinrui.youtoob.ui.GeckoViewScreen
import com.wpinrui.youtoob.ui.components.YoutoobBottomNav
import com.wpinrui.youtoob.ui.navigation.NavDestination
import com.wpinrui.youtoob.ui.theme.YouToobTheme
import com.wpinrui.youtoob.utils.isVideoPageUrl
import org.mozilla.geckoview.GeckoSession

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val context = LocalContext.current
            val settingsRepository = remember { SettingsRepository(context) }
            val settings by settingsRepository.settings.collectAsState(initial = YoutoobSettings())

            YouToobTheme(themeMode = settings.themeMode) {
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
