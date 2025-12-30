package com.wpinrui.youtoob.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Subscriptions
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Subscriptions
import androidx.compose.ui.graphics.vector.ImageVector

enum class NavDestination(
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
    val label: String,
    val youtubeUrl: String? = null
) {
    HOME(
        Icons.Filled.Home,
        Icons.Outlined.Home,
        "Home",
        "https://m.youtube.com"
    ),
    SUBSCRIPTIONS(
        Icons.Filled.Subscriptions,
        Icons.Outlined.Subscriptions,
        "Subscriptions",
        "https://m.youtube.com/feed/subscriptions"
    ),
    DOWNLOADS(
        Icons.Filled.Download,
        Icons.Outlined.Download,
        "Downloads"
    ),
    YOU(
        Icons.Filled.Person,
        Icons.Outlined.Person,
        "You",
        "https://m.youtube.com/feed/library"
    );

    val isYouTubeDestination: Boolean
        get() = youtubeUrl != null
}
