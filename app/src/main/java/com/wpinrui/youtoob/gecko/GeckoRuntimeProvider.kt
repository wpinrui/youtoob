package com.wpinrui.youtoob.gecko

import android.content.Context
import android.util.Log
import com.wpinrui.youtoob.extensions.ExtensionManager
import org.mozilla.geckoview.AllowOrDeny
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.WebExtension
import org.mozilla.geckoview.WebExtensionController

object GeckoRuntimeProvider {
    private const val TAG = "YTB_Runtime"

    @Volatile
    private var runtime: GeckoRuntime? = null

    @Volatile
    private var extensionManager: ExtensionManager? = null

    fun getRuntime(context: Context): GeckoRuntime {
        return runtime ?: synchronized(this) {
            runtime ?: createRuntime(context.applicationContext).also { newRuntime ->
                runtime = newRuntime
                setupPromptDelegate(newRuntime)
                loadExtensions(context.applicationContext, newRuntime)
            }
        }
    }

    private fun createRuntime(context: Context): GeckoRuntime {
        val settings = GeckoRuntimeSettings.Builder()
            .consoleOutput(true)  // Forward JS console to logcat
            .remoteDebuggingEnabled(true)  // Enable remote debugging
            .build()
        return GeckoRuntime.create(context, settings)
    }

    private fun setupPromptDelegate(runtime: GeckoRuntime) {
        runtime.webExtensionController.promptDelegate = object : WebExtensionController.PromptDelegate {
            override fun onUpdatePrompt(
                extension: WebExtension,
                permissions: Array<out String>,
                origins: Array<out String>,
                newPermissions: Array<out String>
            ): GeckoResult<AllowOrDeny>? {
                Log.i(TAG, "Auto-allowing extension update: ${extension.metaData?.name}")
                return GeckoResult.fromValue(AllowOrDeny.ALLOW)
            }

            override fun onOptionalPrompt(
                extension: WebExtension,
                permissions: Array<out String>,
                origins: Array<out String>,
                optionalPermissions: Array<out String>
            ): GeckoResult<AllowOrDeny>? {
                Log.i(TAG, "Auto-allowing optional permissions for: ${extension.metaData?.name}")
                return GeckoResult.fromValue(AllowOrDeny.ALLOW)
            }
        }
    }

    private fun loadExtensions(context: Context, runtime: GeckoRuntime) {
        extensionManager = ExtensionManager(runtime, context).also { manager ->
            manager.loadAllExtensions { results ->
                val successful = results.count { it.isSuccess }
                val failed = results.count { it.isFailure }
                Log.i(TAG, "Extensions loaded: $successful successful, $failed failed")

                results.forEach { result ->
                    result.fold(
                        onSuccess = { extension ->
                            Log.i(TAG, "Extension loaded: ${extension.metaData?.name} (${extension.id})")
                        },
                        onFailure = { error ->
                            Log.e(TAG, "Extension failed to load", error)
                        }
                    )
                }
            }
        }
    }

    fun shutdown() {
        runtime?.shutdown()
        runtime = null
        extensionManager = null
    }
}
