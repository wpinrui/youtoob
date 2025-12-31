package com.wpinrui.youtoob.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.wpinrui.youtoob.data.PlaybackSpeed
import com.wpinrui.youtoob.data.SettingsRepository
import com.wpinrui.youtoob.data.ThemeMode
import com.wpinrui.youtoob.data.VideoQuality
import com.wpinrui.youtoob.data.YoutoobSettings
import com.wpinrui.youtoob.ui.theme.YouToobTheme
import kotlinx.coroutines.launch

class SettingsActivity : ComponentActivity() {
    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val context = LocalContext.current
            val repository = remember { SettingsRepository(context) }
            val settings by repository.settings.collectAsState(initial = YoutoobSettings())
            val scope = rememberCoroutineScope()

            YouToobTheme(themeMode = settings.themeMode) {

                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = { Text("YouToob Settings") },
                            navigationIcon = {
                                IconButton(onClick = { finish() }) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                        contentDescription = "Back"
                                    )
                                }
                            }
                        )
                    },
                    modifier = Modifier.fillMaxSize()
                ) { innerPadding ->
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                            .padding(16.dp)
                    ) {
                        SettingsHeader("Appearance")
                        Spacer(modifier = Modifier.height(8.dp))

                        DropdownSetting(
                            title = "Theme",
                            subtitle = settings.themeMode.label,
                            options = ThemeMode.entries.map { it.label },
                            selectedIndex = ThemeMode.entries.indexOf(settings.themeMode),
                            onSelect = { index ->
                                scope.launch {
                                    repository.setThemeMode(ThemeMode.entries[index])
                                }
                            }
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        SettingsHeader("Playback")
                        Spacer(modifier = Modifier.height(8.dp))

                        DropdownSetting(
                            title = "Default quality",
                            subtitle = settings.defaultQuality.label,
                            options = VideoQuality.entries.map { it.label },
                            selectedIndex = VideoQuality.entries.indexOf(settings.defaultQuality),
                            onSelect = { index ->
                                scope.launch {
                                    repository.setDefaultQuality(VideoQuality.entries[index])
                                }
                            }
                        )

                        DropdownSetting(
                            title = "Default speed",
                            subtitle = settings.defaultSpeed.label,
                            options = PlaybackSpeed.entries.map { it.label },
                            selectedIndex = PlaybackSpeed.entries.indexOf(settings.defaultSpeed),
                            onSelect = { index ->
                                scope.launch {
                                    repository.setDefaultSpeed(PlaybackSpeed.entries[index])
                                }
                            }
                        )

                        ToggleSetting(
                            title = "Autoplay",
                            subtitle = if (settings.autoplayEnabled) "Enabled" else "Disabled",
                            checked = settings.autoplayEnabled,
                            onCheckedChange = { enabled ->
                                scope.launch {
                                    repository.setAutoplayEnabled(enabled)
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SettingsHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleSmall,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(vertical = 8.dp)
    )
}

@Composable
private fun DropdownSetting(
    title: String,
    subtitle: String,
    options: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { expanded = true }
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, style = MaterialTheme.typography.bodyLarge)
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEachIndexed { index, option ->
                DropdownMenuItem(
                    text = { Text(option) },
                    onClick = {
                        onSelect(index)
                        expanded = false
                    }
                )
            }
        }
    }
}

@Composable
private fun ToggleSetting(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, style = MaterialTheme.typography.bodyLarge)
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}
