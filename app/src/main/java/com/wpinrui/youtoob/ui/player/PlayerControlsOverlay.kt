package com.wpinrui.youtoob.ui.player

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.ClosedCaption
import androidx.compose.material.icons.outlined.ThumbDown
import androidx.compose.material.icons.outlined.ThumbUp
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

private const val AUTO_HIDE_DELAY_MS = 3000L
private const val SKIP_SECONDS = 10

@Composable
fun PlayerControlsOverlay(
    modifier: Modifier = Modifier,
    isPlaying: Boolean = false,
    currentSpeed: Float = 1.0f,
    onPlayPause: () -> Unit = {},
    onSeekForward: () -> Unit = {},
    onSeekBackward: () -> Unit = {},
    onPrevious: () -> Unit = {},
    onNext: () -> Unit = {},
    onSpeedChange: (Float) -> Unit = {},
    onLike: () -> Unit = {},
    onDislike: () -> Unit = {},
    onSave: () -> Unit = {},
    onShare: () -> Unit = {},
    onCaptions: () -> Unit = {},
    onSettings: () -> Unit = {}
) {
    var controlsVisible by remember { mutableStateOf(false) }
    var showSkipForwardIndicator by remember { mutableStateOf(false) }
    var showSkipBackwardIndicator by remember { mutableStateOf(false) }
    var skipForwardSeconds by remember { mutableStateOf(0) }
    var skipBackwardSeconds by remember { mutableStateOf(0) }

    // Auto-hide controls after delay
    LaunchedEffect(controlsVisible) {
        if (controlsVisible) {
            delay(AUTO_HIDE_DELAY_MS)
            controlsVisible = false
        }
    }

    // Hide skip indicators after animation
    LaunchedEffect(showSkipForwardIndicator) {
        if (showSkipForwardIndicator) {
            delay(600)
            showSkipForwardIndicator = false
            skipForwardSeconds = 0
        }
    }

    LaunchedEffect(showSkipBackwardIndicator) {
        if (showSkipBackwardIndicator) {
            delay(600)
            showSkipBackwardIndicator = false
            skipBackwardSeconds = 0
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        // Gesture detection areas
        Row(modifier = Modifier.fillMaxSize()) {
            // Left side - double tap to seek backward
            DoubleTapArea(
                modifier = Modifier
                    .fillMaxHeight()
                    .weight(1f),
                onSingleTap = { controlsVisible = !controlsVisible },
                onDoubleTap = {
                    skipBackwardSeconds += SKIP_SECONDS
                    showSkipBackwardIndicator = true
                    onSeekBackward()
                }
            )

            // Center - just single tap for controls
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .weight(1f)
                    .pointerInput(Unit) {
                        detectTapGestures(
                            onTap = { controlsVisible = !controlsVisible }
                        )
                    }
            )

            // Right side - double tap to seek forward
            DoubleTapArea(
                modifier = Modifier
                    .fillMaxHeight()
                    .weight(1f),
                onSingleTap = { controlsVisible = !controlsVisible },
                onDoubleTap = {
                    skipForwardSeconds += SKIP_SECONDS
                    showSkipForwardIndicator = true
                    onSeekForward()
                }
            )
        }

        // Skip backward indicator (left side)
        AnimatedVisibility(
            visible = showSkipBackwardIndicator,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.CenterStart)
                .padding(start = 40.dp)
        ) {
            SkipIndicator(seconds = skipBackwardSeconds, isForward = false)
        }

        // Skip forward indicator (right side)
        AnimatedVisibility(
            visible = showSkipForwardIndicator,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 40.dp)
        ) {
            SkipIndicator(seconds = skipForwardSeconds, isForward = true)
        }

        // Main controls overlay
        AnimatedVisibility(
            visible = controlsVisible,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.fillMaxSize()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.4f))
            ) {
                // Center playback controls
                CenterPlaybackControls(
                    isPlaying = isPlaying,
                    onPrevious = onPrevious,
                    onPlayPause = onPlayPause,
                    onNext = onNext,
                    modifier = Modifier.align(Alignment.Center)
                )

                // Bottom controls bar
                BottomControlsBar(
                    currentSpeed = currentSpeed,
                    onSpeedChange = onSpeedChange,
                    onCaptions = onCaptions,
                    onSettings = onSettings,
                    modifier = Modifier.align(Alignment.BottomCenter)
                )
            }
        }

        // Action buttons (always visible below video when controls are shown)
        AnimatedVisibility(
            visible = controlsVisible,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.align(Alignment.BottomCenter)
        ) {
            ActionButtonsRow(
                onLike = onLike,
                onDislike = onDislike,
                onSave = onSave,
                onShare = onShare,
                modifier = Modifier.padding(bottom = 60.dp)
            )
        }
    }
}

@Composable
private fun DoubleTapArea(
    modifier: Modifier = Modifier,
    onSingleTap: () -> Unit,
    onDoubleTap: () -> Unit
) {
    var lastTapTime by remember { mutableStateOf(0L) }

    Box(
        modifier = modifier.pointerInput(Unit) {
            detectTapGestures(
                onTap = {
                    val currentTime = System.currentTimeMillis()
                    if (currentTime - lastTapTime < 300) {
                        onDoubleTap()
                    } else {
                        onSingleTap()
                    }
                    lastTapTime = currentTime
                }
            )
        }
    )
}

@Composable
private fun SkipIndicator(
    seconds: Int,
    isForward: Boolean,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = CircleShape,
        color = Color.Black.copy(alpha = 0.6f)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(16.dp)
        ) {
            Row {
                repeat(3) {
                    Text(
                        text = if (isForward) "▶" else "◀",
                        color = Color.White,
                        fontSize = 16.sp
                    )
                }
            }
            Text(
                text = "$seconds seconds",
                color = Color.White,
                fontSize = 12.sp
            )
        }
    }
}

@Composable
private fun CenterPlaybackControls(
    isPlaying: Boolean,
    onPrevious: () -> Unit,
    onPlayPause: () -> Unit,
    onNext: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(32.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        ControlButton(
            icon = Icons.Default.SkipPrevious,
            contentDescription = "Previous",
            onClick = onPrevious,
            size = 48.dp
        )

        ControlButton(
            icon = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
            contentDescription = if (isPlaying) "Pause" else "Play",
            onClick = onPlayPause,
            size = 64.dp
        )

        ControlButton(
            icon = Icons.Default.SkipNext,
            contentDescription = "Next",
            onClick = onNext,
            size = 48.dp
        )
    }
}

@Composable
private fun ControlButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    size: androidx.compose.ui.unit.Dp,
    modifier: Modifier = Modifier
) {
    IconButton(
        onClick = onClick,
        modifier = modifier.size(size)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = Color.White,
            modifier = Modifier.size(size * 0.75f)
        )
    }
}

@Composable
private fun BottomControlsBar(
    currentSpeed: Float,
    onSpeedChange: (Float) -> Unit,
    onCaptions: () -> Unit,
    onSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showSpeedMenu by remember { mutableStateOf(false) }
    val speeds = listOf(0.5f, 0.75f, 1.0f, 1.25f, 1.5f, 1.75f, 2.0f)

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.End,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Speed selector
        Box {
            Surface(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .clickable { showSpeedMenu = !showSpeedMenu },
                color = Color.Black.copy(alpha = 0.6f)
            ) {
                Text(
                    text = if (currentSpeed == 1.0f) "1.0" else currentSpeed.toString().take(4),
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }

            if (showSpeedMenu) {
                SpeedMenu(
                    speeds = speeds,
                    currentSpeed = currentSpeed,
                    onSpeedSelected = { speed ->
                        onSpeedChange(speed)
                        showSpeedMenu = false
                    },
                    onDismiss = { showSpeedMenu = false }
                )
            }
        }

        Spacer(modifier = Modifier.width(16.dp))

        // Captions button
        IconButton(onClick = onCaptions) {
            Icon(
                imageVector = Icons.Outlined.ClosedCaption,
                contentDescription = "Captions",
                tint = Color.White
            )
        }

        // Settings button
        IconButton(onClick = onSettings) {
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = "Settings",
                tint = Color.White
            )
        }
    }
}

@Composable
private fun SpeedMenu(
    speeds: List<Float>,
    currentSpeed: Float,
    onSpeedSelected: (Float) -> Unit,
    onDismiss: () -> Unit
) {
    Surface(
        modifier = Modifier.padding(bottom = 40.dp),
        shape = RoundedCornerShape(8.dp),
        color = Color(0xFF212121)
    ) {
        Column(modifier = Modifier.padding(vertical = 8.dp)) {
            speeds.forEach { speed ->
                val isSelected = speed == currentSpeed
                Text(
                    text = "${speed}x",
                    color = if (isSelected) Color(0xFF3EA6FF) else Color.White,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSpeedSelected(speed) }
                        .padding(horizontal = 24.dp, vertical = 12.dp)
                )
            }
        }
    }
}

@Composable
private fun ActionButtonsRow(
    onLike: () -> Unit,
    onDislike: () -> Unit,
    onSave: () -> Unit,
    onShare: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        ActionButton(
            icon = Icons.Outlined.ThumbUp,
            label = "Like",
            onClick = onLike
        )
        ActionButton(
            icon = Icons.Outlined.ThumbDown,
            label = "Dislike",
            onClick = onDislike
        )
        ActionButton(
            icon = Icons.Outlined.BookmarkBorder,
            label = "Save",
            onClick = onSave
        )
        ActionButton(
            icon = Icons.Default.Share,
            label = "Share",
            onClick = onShare
        )
    }
}

@Composable
private fun ActionButton(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick
            )
            .padding(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = Color.White,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            color = Color.White,
            fontSize = 12.sp
        )
    }
}
