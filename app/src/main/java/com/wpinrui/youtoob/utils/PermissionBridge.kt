package com.wpinrui.youtoob.utils

import org.mozilla.geckoview.GeckoSession

typealias PermissionRequestLauncher = (Array<String>, (Map<String, Boolean>) -> Unit) -> Unit

class PermissionBridge {
    private var launcher: PermissionRequestLauncher? = null

    fun setLauncher(launcher: PermissionRequestLauncher) {
        this.launcher = launcher
    }

    fun requestPermissions(
        permissions: Array<out String>,
        callback: GeckoSession.PermissionDelegate.Callback
    ) {
        val currentLauncher = launcher
        if (currentLauncher == null) {
            callback.reject()
            return
        }

        @Suppress("UNCHECKED_CAST")
        currentLauncher(permissions as Array<String>) { results ->
            val allGranted = results.values.all { it }
            if (allGranted) {
                callback.grant()
            } else {
                callback.reject()
            }
        }
    }
}
