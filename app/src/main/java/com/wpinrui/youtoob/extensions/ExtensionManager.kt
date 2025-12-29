package com.wpinrui.youtoob.extensions

import android.util.Log
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.WebExtension
import org.mozilla.geckoview.WebExtensionController

class ExtensionManager(private val runtime: GeckoRuntime) {

    private val controller: WebExtensionController = runtime.webExtensionController
    private val installedExtensions = mutableMapOf<String, WebExtension>()

    fun loadBundledExtensions(
        onExtensionLoaded: ((ExtensionConfig, WebExtension) -> Unit)? = null,
        onError: ((ExtensionConfig, Throwable) -> Unit)? = null
    ) {
        BundledExtensions.ALL.forEach { config ->
            loadExtension(config, onExtensionLoaded, onError)
        }
    }

    fun loadExtension(
        config: ExtensionConfig,
        onSuccess: ((ExtensionConfig, WebExtension) -> Unit)? = null,
        onError: ((ExtensionConfig, Throwable) -> Unit)? = null
    ) {
        Log.d(TAG, "Loading extension: ${config.name} from ${config.assetUri}")

        controller.ensureBuiltIn(config.assetUri, config.id).accept(
            { extension ->
                if (extension != null) {
                    Log.i(TAG, "Extension loaded: ${extension.metaData?.name ?: config.name}")
                    installedExtensions[extension.id] = extension
                    onSuccess?.invoke(config, extension)
                } else {
                    Log.w(TAG, "Extension returned null: ${config.name}")
                }
            },
            { error ->
                Log.e(TAG, "Failed to load extension: ${config.name}", error)
                error?.let { onError?.invoke(config, it) }
            }
        )
    }

    fun getInstalledExtension(id: String): WebExtension? = installedExtensions[id]

    fun listInstalledExtensions(callback: (List<WebExtension>) -> Unit) {
        controller.list().accept(
            { extensions ->
                callback(extensions ?: emptyList())
            },
            { error ->
                Log.e(TAG, "Failed to list extensions", error)
                callback(emptyList())
            }
        )
    }

    fun enableExtension(extension: WebExtension, callback: ((WebExtension?) -> Unit)? = null) {
        controller.enable(extension, WebExtensionController.EnableSource.USER).accept(
            { enabled ->
                Log.i(TAG, "Extension enabled: ${enabled?.id}")
                callback?.invoke(enabled)
            },
            { error ->
                Log.e(TAG, "Failed to enable extension", error)
                callback?.invoke(null)
            }
        )
    }

    fun disableExtension(extension: WebExtension, callback: ((WebExtension?) -> Unit)? = null) {
        controller.disable(extension, WebExtensionController.EnableSource.USER).accept(
            { disabled ->
                Log.i(TAG, "Extension disabled: ${disabled?.id}")
                callback?.invoke(disabled)
            },
            { error ->
                Log.e(TAG, "Failed to disable extension", error)
                callback?.invoke(null)
            }
        )
    }

    companion object {
        private const val TAG = "ExtensionManager"
    }
}
