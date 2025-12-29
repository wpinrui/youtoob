package com.wpinrui.youtoob.extensions

enum class BundledExtension(
    val id: String,
    val displayName: String,
    val folderName: String,
    val defaultEnabled: Boolean = true
) {
    UBLOCK_ORIGIN(
        id = "uBlock0@raymondhill.net",
        displayName = "uBlock Origin",
        folderName = "ublock_origin",
        defaultEnabled = true
    ),
    SPONSORBLOCK(
        id = "sponsorBlocker@ajay.app",
        displayName = "SponsorBlock",
        folderName = "sponsorblock",
        defaultEnabled = true
    ),
    YOUTUBE_HD(
        id = "{7b1bf0b6-a1b9-42b0-b75d-252036438bdc}",
        displayName = "YouTube High Definition",
        folderName = "youtube_hd",
        defaultEnabled = true
    );

    val builtInUri: String
        get() = "resource://android/assets/extensions/$folderName/"

    companion object {
        fun fromId(id: String): BundledExtension? = entries.find { it.id == id }
    }
}
