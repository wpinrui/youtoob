package com.wpinrui.youtoob.extensions

data class ExtensionConfig(
    val id: String,
    val name: String,
    val assetPath: String,
    val enableNativeMessaging: Boolean = false
) {
    val assetUri: String
        get() = "resource://android/assets/$assetPath/"
}

object BundledExtensions {
    val UBLOCK_ORIGIN = ExtensionConfig(
        id = "uBlock0@raymondhill.net",
        name = "uBlock Origin",
        assetPath = "extensions/ublock-origin"
    )

    val SPONSORBLOCK = ExtensionConfig(
        id = "sponsorBlocker@ajay.app",
        name = "SponsorBlock",
        assetPath = "extensions/sponsorblock"
    )

    val YOUTUBE_HD = ExtensionConfig(
        id = "nicememe@nicememe.com",
        name = "YouTube High Definition",
        assetPath = "extensions/youtube-hd"
    )

    val ALL = listOf(UBLOCK_ORIGIN, SPONSORBLOCK, YOUTUBE_HD)
}
