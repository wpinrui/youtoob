package com.wpinrui.youtoob.gecko

import android.content.Context
import android.util.Log
import com.wpinrui.youtoob.extensions.ExtensionManager
import org.mozilla.geckoview.AllowOrDeny
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.WebExtension
import org.mozilla.geckoview.WebExtensionController

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
                setupPromptDelegate(newRuntime)
                loadExtensions(newRuntime)
            }
        }
    }

    private fun setupPromptDelegate(runtime: GeckoRuntime) {
        runtime.webExtensionController.promptDelegate = object : WebExtensionController.PromptDelegate {
            override fun onInstallPrompt(extension: WebExtension): GeckoResult<AllowOrDeny>? {
                Log.i(TAG, "Auto-allowing extension install: ${extension.metaData?.name}")
                return GeckoResult.fromValue(AllowOrDeny.ALLOW)
            }

            override fun onUpdatePrompt(
                current: WebExtension,
                updated: WebExtension,
                newPermissions: Array<out String>,
                newOrigins: Array<out String>
            ): GeckoResult<AllowOrDeny>? {
                Log.i(TAG, "Auto-allowing extension update: ${updated.metaData?.name}")
                return GeckoResult.fromValue(AllowOrDeny.ALLOW)
            }

            override fun onOptionalPrompt(
                extension: WebExtension,
                permissions: Array<out String>,
                origins: Array<out String>
            ): GeckoResult<AllowOrDeny>? {
                Log.i(TAG, "Auto-allowing optional permissions for: ${extension.metaData?.name}")
                return GeckoResult.fromValue(AllowOrDeny.ALLOW)
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
