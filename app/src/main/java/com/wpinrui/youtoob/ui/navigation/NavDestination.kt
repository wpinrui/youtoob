package com.wpinrui.youtoob.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.ui.graphics.vector.ImageVector

enum class NavDestination(
    val icon: ImageVector,
    val label: String,
    val youtubeUrl: String? = null
) {
    HOME(Icons.Default.Home, "Home", "https://m.youtube.com"),
    SUBSCRIPTIONS(Icons.Default.PlayArrow, "Subs", "https://m.youtube.com/feed/subscriptions"),
    DOWNLOADS(Icons.Default.KeyboardArrowDown, "Downloads"),
    SETTINGS(Icons.Default.Settings, "Settings");

    val isYouTubeDestination: Boolean
        get() = youtubeUrl != null
}
