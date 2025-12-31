package com.wpinrui.youtoob.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
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
        NavigationBar(
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.onSurface,
            windowInsets = WindowInsets(0.dp)
        ) {
            val contentColor = MaterialTheme.colorScheme.onSurface
            NavDestination.entries.forEach { destination ->
                val isSelected = currentDestination == destination
                NavigationBarItem(
                    icon = {
                        Icon(
                            imageVector = if (isSelected) destination.selectedIcon else destination.unselectedIcon,
                            contentDescription = destination.label
                        )
                    },
                    label = { Text(destination.label) },
                    selected = isSelected,
                    onClick = { onNavigate(destination) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = contentColor,
                        selectedTextColor = contentColor,
                        unselectedIconColor = contentColor.copy(alpha = 0.7f),
                        unselectedTextColor = contentColor.copy(alpha = 0.7f),
                        indicatorColor = Color.Transparent
                    )
                )
            }
        }
    }
}
