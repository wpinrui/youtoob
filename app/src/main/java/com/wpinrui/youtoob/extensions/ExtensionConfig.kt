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
    HIDE_YOUTUBE_SHORTS(
        id = "{88ebde3a-4581-4c6b-8019-2a05a9e3e938}",
        displayName = "Hide YouTube Shorts",
        folderName = "hide_youtube_shorts",
        defaultEnabled = true
    ),
    YOUTOOB_PLAYER(
        id = "youtoob-player@wpinrui.com",
        displayName = "YouToob Player Controls",
        folderName = "youtoob_player",
        defaultEnabled = true
    );

    val builtInUri: String
        get() = "resource://android/assets/extensions/$folderName/"

    companion object {
        fun fromId(id: String): BundledExtension? = entries.find { it.id == id }
    }
}
