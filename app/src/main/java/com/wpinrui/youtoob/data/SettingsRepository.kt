package com.wpinrui.youtoob.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "youtoob_settings")

enum class VideoQuality(val label: String, val value: String) {
    AUTO("Auto", "auto"),
    P480("480p", "480"),
    P720("720p", "720"),
    P1080("1080p", "1080"),
    P1440("1440p", "1440"),
    P4K("4K", "2160");

    companion object {
        fun fromValue(value: String): VideoQuality =
            entries.find { it.value == value } ?: AUTO
    }
}

enum class PlaybackSpeed(val label: String, val value: Float) {
    X0_5("0.5x", 0.5f),
    X0_75("0.75x", 0.75f),
    X1("1x", 1.0f),
    X1_25("1.25x", 1.25f),
    X1_5("1.5x", 1.5f),
    X2("2x", 2.0f);

    companion object {
        fun fromValue(value: Float): PlaybackSpeed =
            entries.find { it.value == value } ?: X1
    }
}

enum class ThemeMode(val label: String, val value: String) {
    SYSTEM("System", "system"),
    LIGHT("Light", "light"),
    DARK("Dark", "dark");

    fun isDark(systemIsDark: Boolean): Boolean = when (this) {
        LIGHT -> false
        DARK -> true
        SYSTEM -> systemIsDark
    }

    companion object {
        fun fromValue(value: String): ThemeMode =
            entries.find { it.value == value } ?: SYSTEM
    }
}

data class YoutoobSettings(
    val defaultQuality: VideoQuality = VideoQuality.AUTO,
    val defaultSpeed: PlaybackSpeed = PlaybackSpeed.X1,
    val autoplayEnabled: Boolean = true,
    val themeMode: ThemeMode = ThemeMode.SYSTEM
)

class SettingsRepository(private val context: Context) {

    private object PreferenceKeys {
        val DEFAULT_QUALITY = stringPreferencesKey("default_quality")
        val DEFAULT_SPEED = stringPreferencesKey("default_speed")
        val AUTOPLAY_ENABLED = booleanPreferencesKey("autoplay_enabled")
        val THEME_MODE = stringPreferencesKey("theme_mode")
    }

    val settings: Flow<YoutoobSettings> = context.dataStore.data.map { preferences ->
        YoutoobSettings(
            defaultQuality = VideoQuality.fromValue(
                preferences[PreferenceKeys.DEFAULT_QUALITY] ?: VideoQuality.AUTO.value
            ),
            defaultSpeed = PlaybackSpeed.fromValue(
                preferences[PreferenceKeys.DEFAULT_SPEED]?.toFloatOrNull() ?: PlaybackSpeed.X1.value
            ),
            autoplayEnabled = preferences[PreferenceKeys.AUTOPLAY_ENABLED] ?: true,
            themeMode = ThemeMode.fromValue(
                preferences[PreferenceKeys.THEME_MODE] ?: ThemeMode.SYSTEM.value
            )
        )
    }

    suspend fun setDefaultQuality(quality: VideoQuality) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.DEFAULT_QUALITY] = quality.value
        }
    }

    suspend fun setDefaultSpeed(speed: PlaybackSpeed) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.DEFAULT_SPEED] = speed.value.toString()
        }
    }

    suspend fun setAutoplayEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.AUTOPLAY_ENABLED] = enabled
        }
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.THEME_MODE] = mode.value
        }
    }
}
