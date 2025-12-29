package com.wpinrui.youtoob.extensions

import android.content.Context
import android.content.SharedPreferences

class ExtensionPreferences(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(
        PREFS_NAME,
        Context.MODE_PRIVATE
    )

    fun isExtensionEnabled(extension: BundledExtension): Boolean {
        return prefs.getBoolean(
            getEnabledKey(extension.id),
            extension.defaultEnabled
        )
    }

    fun setExtensionEnabled(extensionId: String, enabled: Boolean) {
        prefs.edit().putBoolean(getEnabledKey(extensionId), enabled).apply()
    }

    fun getEnabledExtensions(): Set<String> {
        return BundledExtension.entries
            .filter { isExtensionEnabled(it) }
            .map { it.id }
            .toSet()
    }

    private fun getEnabledKey(extensionId: String): String {
        return "$KEY_PREFIX_ENABLED$extensionId"
    }

    companion object {
        private const val PREFS_NAME = "extension_preferences"
        private const val KEY_PREFIX_ENABLED = "enabled_"
    }
}
