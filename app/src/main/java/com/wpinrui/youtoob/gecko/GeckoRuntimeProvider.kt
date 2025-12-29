package com.wpinrui.youtoob.gecko

import android.content.Context
import android.util.Log
import com.wpinrui.youtoob.extensions.ExtensionManager
import org.mozilla.geckoview.GeckoRuntime

object GeckoRuntimeProvider {
    private const val TAG = "GeckoRuntimeProvider"

    @Volatile
    private var runtime: GeckoRuntime? = null

    @Volatile
    private var extensionManager: ExtensionManager? = null

    fun getRuntime(context: Context): GeckoRuntime {
        return runtime ?: synchronized(this) {
            runtime ?: GeckoRuntime.create(context.applicationContext).also { newRuntime ->
                runtime = newRuntime
                loadExtensions(newRuntime)
            }
        }
    }

    private fun loadExtensions(runtime: GeckoRuntime) {
        extensionManager = ExtensionManager(runtime).also { manager ->
            manager.loadBundledExtensions(
                onExtensionLoaded = { config, extension ->
                    Log.i(TAG, "Extension loaded: ${config.name} (${extension.id})")
                },
                onError = { config, error ->
                    Log.e(TAG, "Failed to load extension: ${config.name}", error)
                }
            )
        }
    }

    fun shutdown() {
        runtime?.shutdown()
        runtime = null
        extensionManager = null
    }
}
