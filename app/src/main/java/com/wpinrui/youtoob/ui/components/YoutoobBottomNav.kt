package com.wpinrui.youtoob.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.wpinrui.youtoob.ui.navigation.NavDestination

@Composable
fun YoutoobBottomNav(
    currentDestination: NavDestination,
    onNavigate: (NavDestination) -> Unit,
    isVisible: Boolean,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(
        visible = isVisible,
        enter = slideInVertically(initialOffsetY = { it }),
        exit = slideOutVertically(targetOffsetY = { it }),
        modifier = modifier
    ) {
        NavigationBar {
            NavDestination.entries.forEach { destination ->
                NavigationBarItem(
                    icon = { Icon(destination.icon, contentDescription = destination.label) },
                    label = { Text(destination.label) },
                    selected = currentDestination == destination,
                    onClick = { onNavigate(destination) }
                )
            }
        }
    }
}
