package com.wpinrui.youtoob.extensions

import android.content.Context
import android.util.Log
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.WebExtension
import org.mozilla.geckoview.WebExtensionController

class ExtensionManager(
    private val runtime: GeckoRuntime,
    private val context: Context
) {
    private val controller: WebExtensionController = runtime.webExtensionController
    private val preferences: ExtensionPreferences = ExtensionPreferences(context)
    private val loadedExtensions = mutableMapOf<String, WebExtension>()

    fun loadAllExtensions(
        onComplete: ((List<Result<WebExtension>>) -> Unit)? = null
    ) {
        val results = mutableListOf<Result<WebExtension>>()
        val extensionsToLoad = BundledExtension.entries.filter {
            preferences.isExtensionEnabled(it)
        }

        if (extensionsToLoad.isEmpty()) {
            Log.i(TAG, "No extensions enabled to load")
            onComplete?.invoke(emptyList())
            return
        }

        var loadedCount = 0
        fun checkCompletion() {
            loadedCount++
            if (loadedCount == extensionsToLoad.size) {
                onComplete?.invoke(results)
            }
        }

        extensionsToLoad.forEach { extension ->
            loadExtension(
                extension = extension,
                onSuccess = { webExtension ->
                    results.add(Result.success(webExtension))
                    checkCompletion()
                },
                onError = { error ->
                    results.add(Result.failure(error))
                    checkCompletion()
                }
            )
        }
    }

    fun loadExtension(
        extension: BundledExtension,
        onSuccess: ((WebExtension) -> Unit)? = null,
        onError: ((Throwable) -> Unit)? = null
    ) {
        Log.d(TAG, "Loading extension: ${extension.displayName} from ${extension.builtInUri}")

        if (loadedExtensions.containsKey(extension.id)) {
            Log.w(TAG, "Extension already loaded: ${extension.displayName}")
            loadedExtensions[extension.id]?.let { onSuccess?.invoke(it) }
            return
        }

        controller.ensureBuiltIn(extension.builtInUri, extension.id).accept(
            { webExtension ->
                if (webExtension != null) {
                    Log.i(TAG, "Extension loaded: ${webExtension.metaData?.name ?: extension.displayName}")
                    loadedExtensions[webExtension.id] = webExtension
                    onSuccess?.invoke(webExtension)
                } else {
                    val errorMessage = "Extension returned null: ${extension.displayName}"
                    Log.w(TAG, errorMessage)
                    onError?.invoke(IllegalStateException(errorMessage))
                }
            },
            { error ->
                Log.e(TAG, "Failed to load extension: ${extension.displayName}", error)
                error?.let { onError?.invoke(it) }
            }
        )
    }

    fun enableExtension(
        extensionId: String,
        onComplete: ((Result<WebExtension>) -> Unit)? = null
    ) {
        val webExtension = loadedExtensions[extensionId]
        if (webExtension == null) {
            Log.w(TAG, "Extension not loaded, cannot enable: $extensionId")
            onComplete?.invoke(Result.failure(IllegalStateException("Extension not loaded")))
            return
        }

        controller.enable(webExtension, WebExtensionController.EnableSource.USER).accept(
            { enabled ->
                if (enabled != null) {
                    Log.i(TAG, "Extension enabled: ${enabled.id}")
                    loadedExtensions[enabled.id] = enabled
                    preferences.setExtensionEnabled(extensionId, true)
                    onComplete?.invoke(Result.success(enabled))
                } else {
                    onComplete?.invoke(Result.failure(IllegalStateException("Enable returned null")))
                }
            },
            { error ->
                Log.e(TAG, "Failed to enable extension: $extensionId", error)
                onComplete?.invoke(Result.failure(error ?: IllegalStateException("Unknown error")))
            }
        )
    }

    fun disableExtension(
        extensionId: String,
        onComplete: ((Result<WebExtension>) -> Unit)? = null
    ) {
        val webExtension = loadedExtensions[extensionId]
        if (webExtension == null) {
            Log.w(TAG, "Extension not loaded, cannot disable: $extensionId")
            onComplete?.invoke(Result.failure(IllegalStateException("Extension not loaded")))
            return
        }

        controller.disable(webExtension, WebExtensionController.EnableSource.USER).accept(
            { disabled ->
                if (disabled != null) {
                    Log.i(TAG, "Extension disabled: ${disabled.id}")
                    loadedExtensions[disabled.id] = disabled
                    preferences.setExtensionEnabled(extensionId, false)
                    onComplete?.invoke(Result.success(disabled))
                } else {
                    onComplete?.invoke(Result.failure(IllegalStateException("Disable returned null")))
                }
            },
            { error ->
                Log.e(TAG, "Failed to disable extension: $extensionId", error)
                onComplete?.invoke(Result.failure(error ?: IllegalStateException("Unknown error")))
            }
        )
    }

    fun getExtension(id: String): WebExtension? = loadedExtensions[id]

    fun isExtensionEnabled(id: String): Boolean {
        val bundledExtension = BundledExtension.fromId(id) ?: return false
        return preferences.isExtensionEnabled(bundledExtension)
    }

    fun getLoadedExtensions(): List<WebExtension> = loadedExtensions.values.toList()

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

    companion object {
        private const val TAG = "ExtensionManager"
    }
}
