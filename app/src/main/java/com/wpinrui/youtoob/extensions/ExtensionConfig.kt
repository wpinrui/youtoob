package com.wpinrui.youtoob.extensions

data class ExtensionConfig(
    val id: String,
    val name: String,
    val folderName: String
) {
    val builtInUri: String
        get() = "resource://android/assets/extensions/$folderName/"
}

object BundledExtensions {
    val UBLOCK_ORIGIN = ExtensionConfig(
        id = "uBlock0@raymondhill.net",
        name = "uBlock Origin",
        folderName = "ublock_origin"
    )

    val SPONSORBLOCK = ExtensionConfig(
        id = "sponsorBlocker@ajay.app",
        name = "SponsorBlock",
        folderName = "sponsorblock"
    )

    val YOUTUBE_HD = ExtensionConfig(
        id = "{7b1bf0b6-a1b9-42b0-b75d-252036438bdc}",
        name = "YouTube High Definition",
        folderName = "youtube_hd"
    )

    val ALL = listOf(UBLOCK_ORIGIN, SPONSORBLOCK, YOUTUBE_HD)
}
