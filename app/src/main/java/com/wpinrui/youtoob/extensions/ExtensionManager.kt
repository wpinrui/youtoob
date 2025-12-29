package com.wpinrui.youtoob.extensions

import android.content.Context
import android.util.Log
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.WebExtension
import org.mozilla.geckoview.WebExtensionController
import java.io.File

class ExtensionManager(
    private val context: Context,
    private val runtime: GeckoRuntime
) {

    private val controller: WebExtensionController = runtime.webExtensionController
    private val installedExtensions = mutableMapOf<String, WebExtension>()
    private val extensionsDir = File(context.filesDir, "extensions")

    init {
        extensionsDir.mkdirs()
    }

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
        try {
            val xpiFile = copyXpiFromAssets(config)
            val uri = "file://${xpiFile.absolutePath}"

            Log.d(TAG, "Loading extension: ${config.name} from $uri")

            controller.install(uri).accept(
                { extension ->
                    if (extension != null) {
                        Log.i(TAG, "Extension installed: ${extension.metaData?.name ?: config.name}")
                        installedExtensions[extension.id] = extension
                        onSuccess?.invoke(config, extension)
                    } else {
                        Log.w(TAG, "Extension returned null: ${config.name}")
                    }
                },
                { error ->
                    Log.e(TAG, "Failed to install extension: ${config.name}", error)
                    error?.let { onError?.invoke(config, it) }
                }
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to copy extension: ${config.name}", e)
            onError?.invoke(config, e)
        }
    }

    private fun copyXpiFromAssets(config: ExtensionConfig): File {
        val destFile = File(extensionsDir, config.xpiFileName)

        // Always copy to ensure we have the latest version
        context.assets.open(config.assetPath).use { input ->
            destFile.outputStream().use { output ->
                input.copyTo(output)
            }
        }

        return destFile
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
