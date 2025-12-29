package com.wpinrui.youtoob.extensions

sealed class ExtensionError {
    data class LoadFailed(val name: String, val cause: Throwable) : ExtensionError()
    data class NotFound(val name: String) : ExtensionError()
    data class AlreadyLoaded(val name: String) : ExtensionError()
    data class Incompatible(val name: String, val reason: String) : ExtensionError()
}
